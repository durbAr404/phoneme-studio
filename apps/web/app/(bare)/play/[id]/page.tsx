import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { serverApi } from "@/lib/server-api";
import type { Activity } from "@/lib/types";
import { Player } from "@/components/games/player";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await serverApi<Activity>(`/activities/${(await params).id}`, { revalidate: 60 });
  return { title: a?.title ?? "Play" };
}

export default async function PlayActivity({ params }: Props) {
  const { id } = await params;
  const a = await serverApi<Activity>(`/activities/${id}`, { revalidate: 60 });
  if (!a) notFound();
  return <Player activity={a} source={{ type: "activity", id }} />;
}
