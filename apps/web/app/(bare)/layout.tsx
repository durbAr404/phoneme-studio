import { BareShell } from "@/components/site/site-shell";

export default function BareLayout({ children }: { children: React.ReactNode }) {
  return <BareShell>{children}</BareShell>;
}
