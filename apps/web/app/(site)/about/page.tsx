import type { Metadata } from "next";
import { SHOWCASE } from "@/lib/showcase";
import { SITE } from "@/lib/site";
import Link from "next/link";
import { LinkButton } from "@/components/ui";

export const metadata: Metadata = { title: "About", description: "What Phoneme Studio is, who it's for and how to use it." };

const STEPS = [
  { title: "Create a game", body: "Open Create in the menu and pick Wordle or Word search.", tone: "bg-mint text-mint-ink" },
  { title: "Add your words", body: "Paste a list, start from a word list, or tick words in the library. New words get their sounds from the sound keyboard.", tone: "bg-peach text-peach-ink" },
  { title: "Share it", body: "Copy a link, show the QR code, print a worksheet, download an offline file, or play in classroom mode.", tone: "bg-butter text-butter-ink" },
  { title: "Students play", body: "On any device, with no account. Stars and streaks are saved in their browser.", tone: "bg-sky text-sky-ink" },
];
const FAQ = [
  ["Is it free?", "Yes. Everything on the site is free to use for teaching."],
  ["Do students need an account?", "No. They open your link or scan the QR code and play straight away."],
  ["Where are my games saved?", "In this browser. To move them to another device, make a save code in My activities and enter it there. There are no accounts to create."],
  ["Can teachers see class results?", "Teacher accounts with class results are built but switched off on this public site. You can explore them in the teacher demo."],
  ["Can I use it without internet?", "Yes. Download the offline file from the share step. It works with no connection, fonts included."],
  ["Why do some symbols look unfamiliar?", "Australian English vowels differ from British and American ones. HCE symbols such as /æɪ/ (day) and /əʉ/ (go) match how Australians speak."],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="pt-20 pb-12 text-center">
        <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">Letters aren&apos;t sounds.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-xl text-ink-soft">
          Phoneme Studio is a free tool for speech pathology educators, teachers and students to practise hearing the sounds inside words.
        </p>
        <div className="mt-9 flex justify-center gap-2.5" aria-label="chin: 4 letters, 3 sounds">
          {[["tʃ", "bg-sky text-sky-ink"], ["ɪ", "bg-peach text-peach-ink"], ["n", "bg-sky text-sky-ink"]].map(([s, t], i) => (
            <span key={s} className={`ipa grid size-20 animate-drop place-items-center rounded-[22px] text-4xl ${t}`} style={{ animationDelay: `${i * 0.12}s` }}>{s}</span>
          ))}
        </div>
        <p className="mt-4 text-ink-soft">chin has 4 letters but 3 sounds</p>
      </section>

      <section className="mt-6">
        <h2 className="mb-6 text-3xl font-semibold">How to use it</h2>
        <ol className="grid gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex items-center gap-5 rounded-[24px] bg-surface p-5 ring-1 ring-line">
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-semibold ${s.tone}`}>{i + 1}</span>
              <span><b className="block text-lg font-semibold">{s.title}</b><span className="text-ink-soft">{s.body}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 grid gap-5 sm:grid-cols-2">
        <div className="rounded-[28px] bg-surface p-7 ring-1 ring-line">
          <h2 className="text-xl font-semibold">What is HCE?</h2>
          <p className="mt-3 text-ink-soft">HCE is the transcription system for Australian English described by Harrington, Cox and Evans (1997). It uses one symbol per sound, so students can see exactly what they hear.</p>
          <Link href="/sounds" className="mt-4 inline-block font-medium underline decoration-primary underline-offset-4">See all 44 sounds</Link>
        </div>
        <div className="rounded-[28px] bg-surface p-7 ring-1 ring-line">
          <h2 className="text-xl font-semibold">Private by design</h2>
          <p className="mt-3 text-ink-soft">No accounts for students. Players are anonymous unless they choose a nickname, and results are deleted after 90 days.</p>
          <Link href="/settings" className="mt-4 inline-block font-medium underline decoration-primary underline-offset-4">Back up your data</Link>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="mb-4 text-3xl font-semibold">Questions</h2>
        <div className="rounded-[28px] bg-surface px-7 ring-1 ring-line">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0} className="border-b border-line py-5 last:border-0">
              <summary className="cursor-pointer text-lg font-medium">{q}</summary>
              <p className="mt-2 text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-[28px] bg-mint p-8 text-center text-mint-ink">
        <h2 className="text-2xl font-semibold">Built as a university project</h2>
        <p className="mx-auto mt-2 max-w-xl">Phoneme Studio started as a La Trobe University computer science project and was rebuilt as a full-stack web app. Made by {SITE.author}.</p>
        <div className="mt-5 flex justify-center gap-3">
          <LinkButton href="/create/wordle" variant="primary">Make your first game</LinkButton>
          {SHOWCASE ? (
            <LinkButton href="/developers">How it&apos;s built</LinkButton>
          ) : (
            SITE.repoUrl && <LinkButton href={SITE.repoUrl}>View the code</LinkButton>
          )}
        </div>
      </section>
    </div>
  );
}
