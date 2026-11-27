"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Toast = { id: number; message: string };
const Ctx = createContext<(message: string) => void>(() => {});

/** Spring-in toast messages at the top of the screen, announced to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none">
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className="fixed left-1/2 z-[90] rounded-full bg-ink px-5 py-3 font-medium text-paper shadow-lg"
            style={{ top: 96 + i * 60, animation: "toast-in 2.6s cubic-bezier(.3,1.6,.5,1) both" }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
