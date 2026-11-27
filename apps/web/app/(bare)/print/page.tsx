import type { Metadata } from "next";
import { Suspense } from "react";
import { PrintSheet } from "@/components/play/print-sheet";

export const metadata: Metadata = { title: "Print worksheet", robots: { index: false } };

export default function PrintPage() {
  return (
    <Suspense>
      <PrintSheet />
    </Suspense>
  );
}
