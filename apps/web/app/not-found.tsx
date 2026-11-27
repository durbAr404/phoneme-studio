import { Buddy } from "@/components/games/buddy";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto max-w-xl px-5 py-24 text-center">
      <Buddy mood="sad" size={150} className="mx-auto" />
      <h1 className="mt-6 text-4xl font-semibold">That page isn&apos;t a word we know.</h1>
      <p className="mt-3 text-lg text-ink-soft">The link may be old, or the game may have been saved on another device.</p>
      <div className="mt-8 flex justify-center gap-3">
        <LinkButton href="/" variant="primary">Go home</LinkButton>
        <LinkButton href="/play">Play the gallery</LinkButton>
      </div>
    </main>
  );
}
