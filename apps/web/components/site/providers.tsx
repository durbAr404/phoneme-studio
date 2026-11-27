"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { SHOWCASE } from "@/lib/showcase";
import { api } from "@/lib/api";
import { applyPrefs, prefs } from "@/lib/prefs";
import type { Me, PublicConfig } from "@/lib/types";
import { ToastProvider } from "@/components/ui/toast";
import { SearchPalette } from "./search-palette";

type Session = { me: Me; config: PublicConfig | null; loading: boolean; refresh: () => Promise<void> };
const VISITOR: Me = { role: "visitor", user: null };
const SessionCtx = createContext<Session>({ me: VISITOR, config: null, loading: true, refresh: async () => {} });

export function useSession() {
  return useContext(SessionCtx);
}

function PrefsSync() {
  const p = prefs.useStore();
  useEffect(() => {
    applyPrefs(p);
    if (p.theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyPrefs(prefs.get());
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [p]);
  return null;
}

export function Providers({ children, config }: { children: ReactNode; config: PublicConfig | null }) {
  const [me, setMe] = useState<Me>(VISITOR);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!SHOWCASE) {
      setLoading(false); // no sign-in on the main site, everyone is a visitor
      return;
    }
    try {
      setMe(await api<Me>("/auth/me"));
    } catch {
      setMe(VISITOR);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return (
    <SessionCtx.Provider value={{ me, config, loading, refresh }}>
      <ToastProvider>
        <PrefsSync />
        {children}
        <SearchPalette />
      </ToastProvider>
    </SessionCtx.Provider>
  );
}
