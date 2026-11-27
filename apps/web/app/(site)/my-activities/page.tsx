import type { Metadata } from "next";
import { MyActivities } from "@/components/play/my-activities";

export const metadata: Metadata = { title: "My activities" };

export default function Page() {
  return <MyActivities />;
}
