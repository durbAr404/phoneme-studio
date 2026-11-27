import type { Metadata } from "next";
import { Suspense } from "react";
import { Classroom } from "@/components/play/classroom";

export const metadata: Metadata = { title: "Classroom mode", robots: { index: false } };

export default function ClassroomPage() {
  return (
    <Suspense>
      <Classroom />
    </Suspense>
  );
}
