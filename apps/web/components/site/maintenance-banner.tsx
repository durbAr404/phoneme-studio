"use client";
import { Info } from "lucide-react";
import { useSession } from "./providers";

export function MaintenanceBanner() {
  const { config } = useSession();
  if (!config?.maintenance_message) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-butter px-4 py-2.5 text-center text-[15px] font-medium text-butter-ink">
      <Info className="size-4 shrink-0" /> {config.maintenance_message}
    </div>
  );
}
