"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Lock, LogOut, Menu, Search, Settings, X } from "lucide-react";
import { SHOWCASE } from "@/lib/showcase";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import { useSession } from "./providers";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { openSearch } from "./search-palette";

const LINKS = [
  { href: "/play", label: "Play" },
  { href: "/create", label: "Create" },
  { href: "/library", label: "Word library" },
  { href: "/sounds", label: "Sound guide" },
  { href: "/about", label: "About" },
  ...(SHOWCASE ? [{ href: "/developers", label: "For Developers" }] : []),
];

function CreateMenu({ active }: { active: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(!open)}
        className={cn("inline-flex items-center gap-1 rounded-xl px-3 py-2 text-ink-soft hover:text-ink", (active || open) && "bg-mint text-ink")}
      >
        Create <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-12 left-0 z-50 w-80 animate-rise rounded-3xl bg-surface p-2 shadow-xl ring-1 ring-line">
          {[
            { href: "/create/wordle", sym: "θ", tone: "bg-mint text-mint-ink", title: "Wordle", body: "Guess a word sound by sound" },
            { href: "/create/word-search", sym: "ʃ", tone: "bg-peach text-peach-ink", title: "Word search", body: "Find words hidden as sounds" },
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-sunken">
              <span className={cn("ipa grid size-11 place-items-center rounded-xl text-xl", item.tone)}>{item.sym}</span>
              <span>
                <span className="block font-medium">{item.title}</span>
                <span className="text-sm text-ink-soft">{item.body}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { me, refresh } = useSession();
  const [mobile, setMobile] = useState(false);
  useEffect(() => setMobile(false), [pathname]);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const signOut = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    await refresh();
    router.push("/");
  };

  const right = (
    <>
      <button
        type="button"
        onClick={openSearch}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-sunken px-3 text-[15px] whitespace-nowrap text-ink-soft hover:text-ink"
        aria-label="Search, keyboard shortcut Control K"
      >
        <Search className="size-4" />
        <span className="hidden 2xl:inline">Search</span>
        <kbd className="hidden rounded-md border border-line-strong px-1.5 text-xs 2xl:inline">Ctrl K</kbd>
      </button>
      <ThemeToggle />
      <Link href="/settings" aria-label="Settings" className="grid size-11 place-items-center rounded-xl hover:bg-sunken">
        <Settings className="size-5" />
      </Link>
      {me.role === "admin" || me.role === "demo" ? (
        <Link href="/admin" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-mint px-4 font-semibold whitespace-nowrap text-mint-ink">
          <Lock className="size-4" /> {me.role === "demo" ? "Admin demo" : "Admin"}
        </Link>
      ) : (
        <Link href="/my-activities" className="inline-flex h-10 items-center rounded-full bg-sunken px-4 font-semibold whitespace-nowrap hover:bg-mint">
          My activities
        </Link>
      )}
      {me.role !== "visitor" && (
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="grid size-11 place-items-center rounded-xl hover:bg-sunken">
          <LogOut className="size-5" />
        </button>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-paper/85 backdrop-blur-md">
      <a href="#main" className="sr-only rounded-xl bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-20 max-w-[1240px] items-center gap-4 px-5 md:px-8">
        <Logo />
        <div className="ml-4 hidden items-center gap-1 xl:flex">
          {LINKS.map((l) =>
            l.href === "/create" ? (
              <CreateMenu key={l.href} active={isActive("/create")} />
            ) : (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn("rounded-xl px-3 py-2 whitespace-nowrap text-ink-soft hover:text-ink", isActive(l.href) && "bg-mint text-ink")}
              >
                {l.label}
              </Link>
            ),
          )}
        </div>
        <div className="ml-auto hidden items-center gap-1.5 xl:flex">{right}</div>
        <div className="ml-auto flex items-center gap-1 xl:hidden">
          <button type="button" onClick={openSearch} aria-label="Search" className="grid size-11 place-items-center rounded-xl hover:bg-sunken">
            <Search className="size-5" />
          </button>
          <ThemeToggle />
          <button type="button" onClick={() => setMobile(!mobile)} aria-expanded={mobile} aria-label="Menu" className="grid size-11 place-items-center rounded-xl hover:bg-sunken">
            {mobile ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>
      {mobile && (
        <div className="animate-rise border-t border-line bg-paper px-5 pb-6 xl:hidden">
          <div className="grid gap-1 py-3">
            {[...LINKS.filter((l) => l.href !== "/create"), { href: "/create/wordle", label: "Create a Wordle" }, { href: "/create/word-search", label: "Create a word search" }, { href: "/my-activities", label: "My activities" }, { href: "/settings", label: "Settings" }].map((l) => (
              <Link key={l.href} href={l.href} className={cn("rounded-xl px-4 py-3 text-lg", isActive(l.href) && "bg-mint")}>
                {l.label}
              </Link>
            ))}
            {(me.role === "admin" || me.role === "demo") && (
              <Link href="/admin" className="rounded-xl px-4 py-3 text-lg">
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
