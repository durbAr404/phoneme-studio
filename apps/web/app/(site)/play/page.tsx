import type { Metadata } from "next";
import { serverApi } from "@/lib/server-api";
import type { ActivitySummary } from "@/lib/types";
import { PageHeader, LinkButton } from "@/components/ui";
import { Gallery } from "@/components/play/gallery";

export const metadata: Metadata = { title: "Play", description: "Ready-made phoneme games for Australian English." };

export default async function PlayPage() {
  const items = (await serverApi<ActivitySummary[]>("/gallery", { revalidate: 60 })) ?? [];
  return (
    <>
      <PageHeader
        title="Play"
        description="Ready-made games. Play one now, or copy it and make it yours."
        actions={<LinkButton href="/daily" variant="accent">Daily challenge</LinkButton>}
      />
      <Gallery items={items} />
    </>
  );
}
