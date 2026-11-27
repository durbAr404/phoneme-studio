import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import { SoundGuide } from "@/components/play/sound-guide";

export const metadata: Metadata = { title: "Sound guide", description: "The 44 sounds of Australian English in HCE symbols." };

export default function SoundsPage() {
  return (
    <>
      <PageHeader title="Sound guide" description="The 44 sounds of Australian English. Tap one to hear an example and see how it's made." />
      <Suspense>
        <SoundGuide />
      </Suspense>
    </>
  );
}
