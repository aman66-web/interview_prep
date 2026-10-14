import { describe, expect, it } from "vitest";
import { emailSchema, otpCodeSchema, parseSignInOtpType } from "@/lib/auth/schemas";

describe("emailSchema", () => {
  it("accepts an address and tidies it up", () => {
    expect(emailSchema.parse("  Student@Example.COM ")).toBe("student@example.com");
  });

  it.each(["", "no-at-sign", "a@", "@b.com", "a b@c.com", "x".repeat(400) + "@example.com"])(
    "rejects %j",
    (value) => {
      expect(emailSchema.safeParse(value).success).toBe(false);
    },
  );

  it("rejects things that are not text", () => {
    expect(emailSchema.safeParse(null).success).toBe(false);
    expect(emailSchema.safeParse(undefined).success).toBe(false);
  });
});

describe("otpCodeSchema", () => {
  it("accepts 6 to 10 digits", () => {
    expect(otpCodeSchema.parse(" 123456 ")).toBe("123456");
    expect(otpCodeSchema.parse("1234567890")).toBe("1234567890");
  });

  it.each(["", "12345", "12345678901", "12 3456", "abcdef", "12345a"])("rejects %j", (value) => {
    expect(otpCodeSchema.safeParse(value).success).toBe(false);
  });
});

describe("parseSignInOtpType", () => {
  it("accepts sign-in link types only", () => {
    expect(parseSignInOtpType("email")).toBe("email");
    expect(parseSignInOtpType("magiclink")).toBe("magiclink");
    expect(parseSignInOtpType("signup")).toBe("signup");
  });

  it("rejects the rest, including password-reset and invite links", () => {
    expect(parseSignInOtpType("recovery")).toBeNull();
    expect(parseSignInOtpType("invite")).toBeNull();
    expect(parseSignInOtpType("email_change")).toBeNull();
    expect(parseSignInOtpType(null)).toBeNull();
  });
});
