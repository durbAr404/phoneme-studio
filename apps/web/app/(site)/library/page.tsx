import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { LibraryClient } from "@/components/play/library";

export const metadata: Metadata = { title: "Word library", description: "Words transcribed in HCE, ready to use in any game." };

export default function LibraryPage() {
  return (
    <>
      <PageHeader title="Word library" description="Words transcribed in HCE. Tick words, then make a game from them." />
      <Suspense>
        <LibraryClient />
      </Suspense>
    </>
  );
}
