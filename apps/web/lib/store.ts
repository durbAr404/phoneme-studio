"use client";
/**
 * Tiny localStorage-backed stores with useSyncExternalStore. Everything a visitor makes
 * lives here, so the site works fully without an account.
 */
import { useSyncExternalStore } from "react";

export function createStore<T>(key: string, initial: T) {
  let state: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = localStorage.getItem(key);
      if (raw) state = { ...initial, ...JSON.parse(raw) };
    } catch {
      /* storage unavailable or corrupt: start fresh */
    }
  }

  function get(): T {
    load();
    return state;
  }

  function set(update: Partial<T> | ((prev: T) => T)) {
    load();
    state = typeof update === "function" ? (update as (p: T) => T)(state) : { ...state, ...update };
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* quota or private mode */
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) {
        loaded = false;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { get, set, subscribe, useStore, initial };
}
