"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowRight, Copy, Download, Link2, Monitor, Play, Printer } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { ActivityData } from "@/lib/types";
import { generateWordleHtml } from "@/lib/export/wordle-html";
import { generateWordSearchHtml } from "@/lib/export/wordsearch-html";
import { shareUrl } from "@/lib/share-url";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast";

export function ShareStep({ data, localId, remoteId }: { data: ActivityData; localId: string; remoteId?: string }) {
  const toast = useToast();
  const [link, setLink] = useState("");
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLink("");
    setQr("");
  }, [data]);

  const createLink = async () => {
    setBusy(true);
    try {
      const { id } = await api<{ id: string }>("/shares", { body: { ...data, activity_id: remoteId } });
      const url = shareUrl(id);
      setLink(url);
      setQr(await QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#17352e", light: "#ffffff" } }));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Couldn't create a link.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const html =
      data.kind === "wordle"
        ? generateWordleHtml({ name: data.title, difficulty: "MEDIUM", words: data.words, config: { maxAttempts: data.settings.max_guesses, showHints: data.settings.hints } })
        : generateWordSearchHtml({ name: data.title, difficulty: data.settings.difficulty, words: data.words, config: { rows: data.settings.grid_size, cols: data.settings.grid_size, seed: data.settings.seed, showEnglish: data.settings.show_spelling } });
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.title.replace(/[^\w-]+/g, "-").toLowerCase() || "phoneme-game"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actions = [
    { icon: Monitor, title: "Classroom mode", body: "Play together on the big screen, in teams", href: `/classroom?local=${localId}` },
    { icon: Printer, title: "Print a worksheet", body: "A4, with an answer key", href: `/print?local=${localId}` },
  ];

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div className="grid place-items-center gap-5 rounded-[28px] bg-surface p-10 text-center ring-1 ring-line">
        <span className="ipa grid size-24 place-items-center rounded-[28px] bg-mint text-4xl text-mint-ink">{data.words[0]?.phonemes.slice(0, 2).join("")}</span>
        <div>
          <h2 className="text-2xl font-semibold">{data.title}</h2>
          <p className="text-ink-soft">{data.kind === "wordle" ? "Wordle" : "Word search"} · {data.words.length} words</p>
        </div>
        <Link href={`/play/local/${localId}`} className="inline-flex h-12 items-center gap-2 rounded-full bg-sunken px-5 font-semibold hover:bg-mint">
          <Play className="size-4" /> Try it yourself
        </Link>
      </div>
      <div className="grid gap-4">
        <div className="rounded-[28px] bg-surface p-6 ring-1 ring-line">
          <h3 className="font-semibold">Link for students</h3>
          {link ? (
            <>
              <div className="mt-3 flex gap-2">
                <label htmlFor="share-link" className="sr-only">Share link</label>
                <Input id="share-link" readOnly value={link} onFocus={(e) => e.target.select()} />
                <Button variant="accent" onClick={async () => { try { await navigator.clipboard.writeText(link); toast("Link copied"); } catch { toast("Select the link and copy it"); } }}>
                  <Copy className="size-4" /> Copy
                </Button>
              </div>
              <div className="mt-5 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- data: URL generated in the browser */}
                {qr && <img src={qr} alt="QR code for the share link" className="size-28 rounded-xl bg-white p-1.5" />}
                <p className="text-[15px] text-ink-soft">Students scan this with a tablet camera. No account needed. The link keeps working even if you edit or delete your copy.</p>
              </div>
            </>
          ) : (
            <div className="mt-3">
              <p className="mb-4 text-[15px] text-ink-soft">Creates a link and a QR code. Anyone with it can play.</p>
              <Button variant="primary" onClick={createLink} disabled={busy}>
                <Link2 className="size-4" /> {busy ? "Creating…" : "Create link"}
              </Button>
            </div>
          )}
        </div>
        <div className="rounded-[28px] bg-surface p-2 ring-1 ring-line">
          {actions.map((a) => (
            <Link key={a.title} href={a.href} className="flex items-center gap-4 rounded-2xl p-4 hover:bg-sunken">
              <span className="grid size-11 place-items-center rounded-xl bg-sunken"><a.icon className="size-5" /></span>
              <span><span className="block font-medium">{a.title}</span><span className="text-sm text-ink-soft">{a.body}</span></span>
              <ArrowRight className="ml-auto size-5 text-ink-soft" />
            </Link>
          ))}
          <button type="button" onClick={download} className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-sunken">
            <span className="grid size-11 place-items-center rounded-xl bg-sunken"><Download className="size-5" /></span>
            <span><span className="block font-medium">Download offline file</span><span className="text-sm text-ink-soft">One HTML file that works with no internet</span></span>
            <ArrowRight className="ml-auto size-5 text-ink-soft" />
          </button>
        </div>
      </div>
    </div>
  );
}
