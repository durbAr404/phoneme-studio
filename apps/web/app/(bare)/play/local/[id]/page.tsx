"use client";
import { use } from "react";
import { workspace } from "@/lib/workspace";
import { Player } from "@/components/games/player";
import { Empty, LinkButton } from "@/components/ui";

export default function LocalPlay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ws = workspace.useStore();
  const a = ws.activities.find((x) => x.id === id);
  if (!a)
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <Empty title="This game isn't on this device" body="Games you make are saved in the browser you made them in." action={<LinkButton href="/my-activities" variant="primary">My activities</LinkButton>} />
      </div>
    );
  return <Player activity={a} source={{ type: "local", id }} />;
}
