"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Redo2, Undo2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { DEFAULT_SETTINGS, type ActivityData, type Kind, type Word } from "@/lib/types";
import { newId, saveActivity, workspace, type LocalActivity } from "@/lib/workspace";
import { prefs } from "@/lib/prefs";
import { cn } from "@/lib/cn";
import { Button, Spinner, Toggle } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useSession } from "@/components/site/providers";
import { WordsStep, useLibrary } from "./words-step";
import { SettingsStep } from "./settings-step";
import { ShareStep } from "./share-step";

type History = { past: ActivityData[]; present: ActivityData; future: ActivityData[] };
type Action = { type: "set"; data: ActivityData; merge?: boolean } | { type: "undo" } | { type: "redo" } | { type: "reset"; data: ActivityData };

function reducer(h: History, a: Action): History {
  switch (a.type) {
    case "set":
      // Typing in a text field merges into one undo step instead of one per keystroke.
      return a.merge ? { ...h, present: a.data, future: [] } : { past: [...h.past, h.present].slice(-50), present: a.data, future: [] };
    case "undo":
      return h.past.length ? { past: h.past.slice(0, -1), present: h.past.at(-1)!, future: [h.present, ...h.future] } : h;
    case "redo":
      return h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h;
    case "reset":
      return { past: [], present: a.data, future: [] };
  }
}

function blank(kind: Kind): ActivityData {
  const p = prefs.get();
  return {
    kind,
    title: kind === "wordle" ? "My Wordle" : "My word search",
    instructions: "",
    settings: { ...DEFAULT_SETTINGS, max_guesses: p.default_guesses, hints: p.default_hints, grid_size: p.default_grid, seed: Math.floor(Math.random() * 1_000_000) },
    words: [],
  };
}

const STEPS = ["Words", "Settings", "Share"] as const;

/**
 * Three-step game builder. Visitors' work autosaves to this browser; signed-in teachers
 * also sync to their account. In "official" mode (admin) it saves to the public library instead.
 */
export function Builder({ kind, mode = "personal", officialId }: { kind: Kind; mode?: "personal" | "official"; officialId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { me } = useSession();
  const { lib, lists } = useLibrary();
  const [h, dispatch] = useReducer(reducer, null, () => ({ past: [], present: blank(kind), future: [] }));
  const [step, setStep] = useState(0);
  const [localId, setLocalId] = useState("");
  const [remoteId, setRemoteId] = useState<string | undefined>();
  const [loaded, setLoaded] = useState(mode === "personal" ? false : !officialId);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const lastTyped = useRef(0);
  const data = h.present;

  // Load: ?id= (edit a local game), ?from= (copy a published game), ?words= (from the library), or an official activity.
  useEffect(() => {
    if (mode === "official") {
      if (officialId)
        api<ActivityData & { is_published: boolean }>(`/admin/activities/${officialId}`)
          .then((a) => {
            dispatch({ type: "reset", data: { kind: a.kind, title: a.title, instructions: a.instructions, settings: a.settings, words: a.words } });
            setPublished(a.is_published);
          })
          .catch(() => toast("Couldn't load that activity"))
          .finally(() => setLoaded(true));
      return;
    }
    const id = params.get("id");
    const existing = id ? workspace.get().activities.find((a) => a.id === id) : undefined;
    if (existing) {
      dispatch({ type: "reset", data: existing });
      setLocalId(existing.id);
      setRemoteId(existing.remote_id);
      setLoaded(true);
      return;
    }
    setLocalId(newId());
    const from = params.get("from");
    const preset = params.get("words");
    if (from) {
      api<ActivityData>(`/activities/${from}`)
        .then((a) => dispatch({ type: "reset", data: { ...a, kind: a.kind, title: `${a.title} (my copy)` } }))
        .finally(() => setLoaded(true));
    } else if (preset) {
      api<{ items: Word[] }>("/words?limit=500").then((r) => {
        const wanted = new Set(preset.split(",").map((s) => s.trim().toLowerCase()));
        dispatch({ type: "reset", data: { ...blank(kind), words: r.items.filter((w) => wanted.has(w.english)).map((w) => ({ english: w.english, phonemes: w.phonemes })) } });
        setLoaded(true);
      });
    } else setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave personal games to this browser.
  useEffect(() => {
    if (mode !== "personal" || !loaded || !localId || data.words.length === 0) return;
    const t = setTimeout(() => saveActivity({ ...(data as ActivityData), id: localId, remote_id: remoteId, updated_at: "" } as LocalActivity), 400);
    return () => clearTimeout(t);
  }, [data, localId, remoteId, loaded, mode]);

  const update = useCallback(
    (patch: Partial<ActivityData>) => {
      const typing = "title" in patch || "instructions" in patch;
      const merge = typing && Date.now() - lastTyped.current < 1200;
      if (typing) lastTyped.current = Date.now();
      dispatch({ type: "set", data: { ...data, ...patch }, merge });
    },
    [data],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      if ((e.target as HTMLElement).closest("input, textarea")) return;
      e.preventDefault();
      dispatch({ type: e.shiftKey ? "redo" : "undo" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const syncToAccount = async () => {
    if (me.role !== "teacher" && me.role !== "admin") return;
    try {
      if (remoteId) await api(`/me/activities/${remoteId}`, { method: "PATCH", body: { title: data.title, instructions: data.instructions, settings: data.settings, words: data.words } });
      else {
        const created = await api<{ id: string }>("/me/activities", { body: data });
        setRemoteId(created.id);
        saveActivity({ ...data, id: localId, remote_id: created.id, updated_at: "" });
      }
    } catch {
      toast("Saved on this device. Syncing to your account failed.");
    }
  };

  const saveOfficial = async (publish: boolean) => {
    setSaving(true);
    try {
      const body = { title: data.title, instructions: data.instructions, settings: data.settings, words: data.words, is_published: publish };
      if (officialId) await api(`/admin/activities/${officialId}`, { method: "PATCH", body });
      else {
        const created = await api<{ id: string }>("/admin/activities", { body: data });
        if (publish) await api(`/admin/activities/${created.id}`, { method: "PATCH", body: { is_published: true } });
      }
      toast(publish ? "Published" : "Saved as draft");
      router.push("/admin/activities");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    if (step === 0 && data.words.length === 0) return toast("Add at least one word first");
    if (step === 1 && !data.title.trim()) return toast("Give your game a title");
    if (step === 1 && mode === "personal") await syncToAccount();
    setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!loaded) return <Spinner />;
  const lastStep = mode === "official" ? 1 : 2;

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pt-10 pb-8">
        <div>
          <p className="text-ink-soft">{mode === "official" ? "Official activity" : data.kind === "wordle" ? "New Wordle" : "New word search"}</p>
          <h1 className="text-4xl font-semibold tracking-tight">{data.title || "Untitled"}</h1>
        </div>
        <ol className="flex flex-wrap items-center gap-3" aria-label="Steps">
          {STEPS.slice(0, lastStep + 1).map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <button type="button" onClick={() => (i < step || data.words.length) && setStep(i)} aria-current={i === step ? "step" : undefined} className={cn("flex items-center gap-2 font-medium", i > step && "text-ink-soft")}>
                <span className={cn("grid size-8 place-items-center rounded-[10px] text-sm", i < step ? "bg-ink text-paper" : i === step ? "bg-primary text-on-primary" : "bg-sunken")}>{i < step ? <Check className="size-4" /> : i + 1}</span>
                {label}
              </button>
              {i < lastStep && <span className="h-0.5 w-8 bg-line" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>

      {step === 0 && <WordsStep words={data.words} setWords={(words) => update({ words })} lib={lib} lists={lists} />}
      {step === 1 && <SettingsStep data={data} update={update} />}
      {step === 2 && mode === "personal" && <ShareStep data={data} localId={localId} remoteId={remoteId} />}

      <div className="sticky bottom-0 z-20 mt-10 -mx-5 border-t border-line bg-paper/90 px-5 backdrop-blur md:-mx-8 md:px-8">
        <div className="flex h-20 items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[15px] text-ink-soft sm:inline-flex">
            {mode === "official" ? (
              <Toggle label="Publish" checked={published} onChange={setPublished} />
            ) : (
              <>
                <Check className="size-4" /> {me.role === "teacher" || me.role === "admin" ? "Saved on this device and your account" : "Saved in this browser"}
              </>
            )}
          </span>
          <span className="ml-auto" />
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "undo" })} disabled={!h.past.length} aria-label="Undo">
            <Undo2 className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "redo" })} disabled={!h.future.length} aria-label="Redo">
            <Redo2 className="size-4" />
          </Button>
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          )}
          {step < lastStep ? (
            <Button variant="primary" onClick={next}>
              Next: {STEPS[step + 1].toLowerCase()} <ArrowRight className="size-4" />
            </Button>
          ) : mode === "official" ? (
            <Button variant="primary" onClick={() => saveOfficial(published)} disabled={saving}>
              {saving ? "Saving…" : published ? "Save and publish" : "Save draft"}
            </Button>
          ) : (
            <Button variant="primary" onClick={() => router.push("/my-activities")}>
              Done <Check className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
