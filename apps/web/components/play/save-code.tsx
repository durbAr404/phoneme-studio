"use client";
import { useEffect, useRef, useState } from "react";
import { Copy, Smartphone } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { exportData, importData, workspace } from "@/lib/workspace";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast";

/** Move games and progress to another device with a short code, no account needed. Keeps the code in sync. */
export function SaveCode() {
  const toast = useToast();
  const ws = workspace.useStore();
  const [restore, setRestore] = useState("");
  const [busy, setBusy] = useState(false);
  const first = useRef(true);

  // Keep the save code up to date when the workspace changes.
  useEffect(() => {
    if (first.current || !ws.save) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => {
      api(`/saves/${ws.save!.code}`, { method: "PUT", body: { data: exportData() }, headers: { "X-Edit-Token": ws.save!.token } }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [ws.activities, ws.stars, ws.daily, ws.custom_words, ws.save]);

  const create = async () => {
    setBusy(true);
    try {
      const r = await api<{ code: string; edit_token: string }>("/saves", { body: { data: exportData() } });
      workspace.set({ save: { code: r.code, token: r.edit_token } });
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't create a code");
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    try {
      const r = await api<{ data: unknown }>(`/saves/${encodeURIComponent(restore.trim().toLowerCase())}`);
      const n = importData(r.data);
      toast(`Restored ${n} game${n === 1 ? "" : "s"}`);
      setRestore("");
    } catch (e) {
      toast(e instanceof ApiError || e instanceof Error ? e.message : "Couldn't restore");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky text-sky-ink"><Smartphone className="size-5" /></span>
        <div>
          <h3 className="font-semibold">Use on another device</h3>
          <p className="text-[15px] text-ink-soft">Get a save code, then type it on the other device. Anyone with the code can see your games, so keep it to yourself.</p>
        </div>
      </div>
      {ws.save ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-mint px-5 py-4 text-mint-ink">
          <span>Your save code</span>
          <code className="rounded-lg bg-surface px-3 py-1 text-lg font-semibold text-ink">{ws.save.code}</code>
          <Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(ws.save!.code); toast("Code copied"); } catch { toast("Copy it by hand"); } }}>
            <Copy className="size-4" /> Copy
          </Button>
          <span className="text-sm">Updates automatically.</span>
        </div>
      ) : (
        <Button variant="primary" onClick={create} disabled={busy}>Get a save code</Button>
      )}
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (restore.trim()) void doRestore(); }}>
        <div className="min-w-56 flex-1">
          <label htmlFor="restore" className="mb-1.5 block text-[15px] font-medium">Restore from a code</label>
          <Input id="restore" value={restore} onChange={(e) => setRestore(e.target.value)} placeholder="koala-river-0421" autoComplete="off" />
        </div>
        <Button type="submit" disabled={busy || !restore.trim()}>Restore</Button>
      </form>
    </div>
  );
}
