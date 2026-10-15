"use client";

import { useSessionText } from "@/lib/client/use-session-storage";
import { parseStoredUtm, UTM_KEYS, UTM_STORAGE_KEY } from "@/lib/analytics/utm";

// Hidden inputs carrying the campaign tags saved by <UtmCapture />, for a form whose
// server action records the signup event (read them with utmFromFormData). Renders
// nothing when the visit had no tags.

export function UtmFields() {
  const [stored] = useSessionText(UTM_STORAGE_KEY);
  const utm = parseStoredUtm(stored);
  if (!utm) return null;
  return <>{UTM_KEYS.map((key) => (utm[key] ? <input key={key} type="hidden" name={key} value={utm[key]} /> : null))}</>;
}
