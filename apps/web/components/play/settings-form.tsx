"use client";
import { useRef } from "react";
import { Download, Moon, Sun, Trash2, Upload } from "lucide-react";
import { DEFAULT_PREFS, prefs } from "@/lib/prefs";
import { exportData, importData, workspace } from "@/lib/workspace";
import { Button, Segmented, Toggle } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { SaveCode } from "./save-code";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      <div className="divide-y divide-line rounded-[28px] bg-surface px-7 ring-1 ring-line">{children}</div>
    </section>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-5">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-[15px] text-ink-soft">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsForm() {
  const p = prefs.useStore();
  const ws = workspace.useStore();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);

  const backup = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData(), null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `phoneme-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    workspace.set({ last_backup: new Date().toISOString() });
    toast("Backup downloaded");
  };

  const restore = async (f: File) => {
    try {
      if (f.size > 2_000_000) throw new Error("That file is too large.");
      const n = importData(JSON.parse(await f.text()));
      toast(`Restored ${n} game${n === 1 ? "" : "s"}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't read that file");
    }
  };

  return (
    <>
      <Section title="Appearance">
        <Row label="Theme">
          <Segmented label="Theme" value={p.theme} onChange={(theme) => prefs.set({ theme })} options={[{ value: "light", label: <><Sun className="size-4" /> Light</> }, { value: "dark", label: <><Moon className="size-4" /> Dark</> }, { value: "system", label: "Match device" }]} />
        </Row>
        <Row label="Text size" description="Bigger text everywhere, including game tiles">
          <Segmented label="Text size" value={p.text} onChange={(text) => prefs.set({ text })} options={[{ value: "normal", label: "A" }, { value: "large", label: "A+" }, { value: "xl", label: "A++" }]} />
        </Row>
        <Toggle label="Easy-read font" description="Wider letters and spacing, helpful for dyslexic readers" checked={p.font === "easy"} onChange={(v) => prefs.set({ font: v ? "easy" : "default" })} />
      </Section>
      <Section title="Motion and sound">
        <Row label="Animations" description="Tile flips, confetti and the sound wave">
          <Segmented label="Animations" value={p.motion} onChange={(motion) => prefs.set({ motion })} options={[{ value: "on", label: "On" }, { value: "less", label: "Less" }, { value: "off", label: "Off" }]} />
        </Row>
        <Toggle label="Sound effects" description="Taps, flips and a cheer when you win" checked={p.sound} onChange={(sound) => prefs.set({ sound })} />
        <Row label="Volume">
          <input type="range" min={0} max={1} step={0.1} value={p.volume} onChange={(e) => prefs.set({ volume: Number(e.target.value) })} aria-label="Volume" className="w-56 accent-[var(--primary)]" />
        </Row>
        <Toggle label="Colour-blind friendly tiles" description="Adds a tick or a ring to green and yellow tiles" checked={p.colorblind} onChange={(colorblind) => prefs.set({ colorblind })} />
      </Section>
      <Section title="Game defaults">
        <Row label="Wordle guesses per word">
          <Segmented label="Guesses" value={p.default_guesses} onChange={(default_guesses) => prefs.set({ default_guesses })} options={[4, 5, 6, 8].map((n) => ({ value: n, label: String(n) }))} />
        </Row>
        <Row label="Word search grid size">
          <Segmented label="Grid size" value={p.default_grid} onChange={(default_grid) => prefs.set({ default_grid })} options={[8, 10, 12].map((n) => ({ value: n, label: String(n) }))} />
        </Row>
        <Toggle label="Hints on by default" checked={p.default_hints} onChange={(default_hints) => prefs.set({ default_hints })} />
      </Section>
      <Section title="Your data">
        <div className="py-6"><SaveCode /></div>
        <Row label="Back up your games" description={`${ws.activities.length} saved here · last backup ${ws.last_backup ? new Date(ws.last_backup).toLocaleDateString("en-AU") : "never"}`}>
          <Button onClick={backup}><Download className="size-4" /> Download backup</Button>
        </Row>
        <Row label="Restore from a backup file">
          <input ref={file} type="file" aria-label="Backup file" accept="application/json,.json" className="sr-only" onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
          <Button variant="outline" onClick={() => file.current?.click()}><Upload className="size-4" /> Choose file</Button>
        </Row>
        <Row label="Clear everything" description="Removes your games, words, progress and settings from this browser">
          <Button variant="danger" onClick={() => {
            if (!window.confirm("Delete everything saved in this browser? This can't be undone.")) return;
            workspace.set(() => workspace.initial);
            prefs.set(() => DEFAULT_PREFS);
            toast("Cleared");
          }}>
            <Trash2 className="size-4" /> Clear
          </Button>
        </Row>
      </Section>
    </>
  );
}
