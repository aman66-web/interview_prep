import { useCallback, useSyncExternalStore } from "react";

// Small values kept in sessionStorage (this browser tab only; functional use such
// as "which drill was I on" or the notes box in an interview). Read through
// useSyncExternalStore so the server-rendered page and the first browser render
// agree, then the stored value is picked up. This is the only file that touches
// sessionStorage (tests/repo-rules.test.ts checks), and nothing here is sent to us.

const EVENT = "session-storage-change";

export function useSessionText(key: string): [string, (value: string) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      return sessionStorage.getItem(key) ?? "";
    } catch {
      return ""; // storage blocked: behave as if nothing was saved
    }
  }, [key]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => "");

  const set = useCallback(
    (next: string) => {
      try {
        sessionStorage.setItem(key, next);
      } catch {
        // storage blocked: callers also keep the value in React state
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, set];
}

/** A whole number, 0 when nothing is stored. */
export function useSessionNumber(key: string): [number, (value: number) => void] {
  const [raw, setRaw] = useSessionText(key);
  const n = Number(raw);
  const set = useCallback((next: number) => setRaw(String(next)), [setRaw]);
  return [Number.isInteger(n) && n > 0 ? n : 0, set];
}
