import { useCallback, useSyncExternalStore } from "react";

// A number kept in sessionStorage (this browser tab only, functional use such as
// "which drill was I on"). Read through useSyncExternalStore so the server-rendered
// page and the first browser render agree, then the stored value is picked up.

const EVENT = "session-number-change";

export function useSessionNumber(key: string): [number, (value: number) => void] {
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
      const n = Number(sessionStorage.getItem(key));
      return Number.isInteger(n) && n > 0 ? n : 0;
    } catch {
      return 0; // storage blocked: behave as if nothing was saved
    }
  }, [key]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  const set = useCallback(
    (next: number) => {
      try {
        sessionStorage.setItem(key, String(next));
      } catch {
        // storage blocked: callers also keep the value in React state
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [key],
  );

  return [value, set];
}
