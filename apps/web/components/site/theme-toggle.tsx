"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { prefs, resolvedTheme } from "@/lib/prefs";

export function ThemeToggle() {
  const p = prefs.useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme(p.theme) === "dark";
  return (
    <button
      type="button"
      onClick={() => prefs.set({ theme: dark ? "light" : "dark" })}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-11 place-items-center rounded-xl text-ink hover:bg-sunken"
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
