import type { Metadata } from "next";
import { Suspense } from "react";
import { Builder } from "@/components/builder/builder";

export const metadata: Metadata = { title: "Build a word search" };

export default function Page() {
  return (
    <Suspense>
      <Builder kind="wordsearch" />
    </Suspense>
  );
}
