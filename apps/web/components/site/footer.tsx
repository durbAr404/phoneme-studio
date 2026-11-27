import Link from "next/link";
import { SHOWCASE } from "@/lib/showcase";

export function Footer() {
  return (
    <footer className="mx-auto mt-24 max-w-[1240px] px-5 md:px-8">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line py-8 text-[15px] text-ink-soft">
        <span>Your activities stay in this browser. Use a save code to move them to another device.</span>
        {SHOWCASE && <Link href="/admin-login" className="ml-auto text-sm hover:text-ink">Admin Login</Link>}
      </div>
    </footer>
  );
}
