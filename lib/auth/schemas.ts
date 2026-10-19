import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(320)
  .pipe(z.email());

/** The one-time code from the sign-in email (Supabase uses 6 to 10 digits). */
export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6,10}$/);

/** Email link types we accept when signing in. */
const signInOtpTypes = ["email", "magiclink", "signup"] as const;
export type SignInOtpType = (typeof signInOtpTypes)[number];

export function parseSignInOtpType(value: unknown): SignInOtpType | null {
  return signInOtpTypes.find((t) => t === value) ?? null;
}
