import type { Metadata } from "next";
import { DailyChallenge } from "@/components/play/daily";

export const metadata: Metadata = { title: "Daily challenge", description: "One new sound word every day." };

export default function DailyPage() {
  return <DailyChallenge />;
}
