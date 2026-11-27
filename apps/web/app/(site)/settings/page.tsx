import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "@/components/play/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Saved on this device." />
      <SettingsForm />
    </div>
  );
}
