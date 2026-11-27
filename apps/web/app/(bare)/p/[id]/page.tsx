import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { serverApi } from "@/lib/server-api";
import type { ActivityData } from "@/lib/types";
import { Player } from "@/components/games/player";

type Props = { params: Promise<{ id: string }> };
export const metadata: Metadata = { title: "Shared game", robots: { index: false } };

export default async function SharedGame({ params }: Props) {
  const { id } = await params;
  const a = await serverApi<ActivityData>(`/shares/${id}`, { revalidate: 3600 });
  if (!a) notFound();
  return <Player activity={a} source={{ type: "share", id }} />;
}
