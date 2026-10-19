import { createPrivateKey, generateKeyPairSync, verify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { enabledOAuthProviders, parseProvider } from "@/lib/auth/providers";
import { makeAppleClientSecret, SECRET_DAYS } from "../scripts/apple-client-secret.mjs";

// "Continue with Google / Apple": which buttons show, and the Apple secret maker.

describe("which sign-in providers are switched on", () => {
  it("shows none until the setting names them", () => {
    expect(enabledOAuthProviders(undefined)).toEqual([]);
    expect(enabledOAuthProviders("")).toEqual([]);
  });

  it("reads a comma list in any case and order, each once, in a fixed order", () => {
    expect(enabledOAuthProviders("Apple, google ,apple")).toEqual(["google", "apple"]);
    expect(enabledOAuthProviders("google")).toEqual(["google"]);
  });

  it("ignores names it does not know, so a typo never shows a broken button", () => {
    expect(enabledOAuthProviders("facebook,github,google")).toEqual(["google"]);
  });

  it("accepts only the two providers from a form field", () => {
    expect(parseProvider("google")).toBe("google");
    expect(parseProvider("apple")).toBe("apple");
    for (const bad of ["Google", "github", "", null, undefined, 3, ["google"]]) expect(parseProvider(bad)).toBeNull();
  });
});

describe("the Apple client secret maker", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
  const base = { privateKeyPem, teamId: "ABCDE12345", keyId: "KEY1234567", servicesId: "app.casespar.signin", now: 1_800_000_000 };
  const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString());

  it("makes a signed token with the claims Apple asks for", () => {
    const { secret, expires } = makeAppleClientSecret(base);
    const [h, p, s] = secret.split(".");
    expect(decode(h)).toEqual({ alg: "ES256", kid: "KEY1234567", typ: "JWT" });
    expect(decode(p)).toEqual({ iss: "ABCDE12345", iat: 1_800_000_000, exp: 1_800_000_000 + SECRET_DAYS * 86400, aud: "https://appleid.apple.com", sub: "app.casespar.signin" });
    expect(expires.getTime()).toBe((1_800_000_000 + SECRET_DAYS * 86400) * 1000);
    // The signature checks out against the matching public key (Apple's JWT uses the raw r||s form).
    const ok = verify("sha256", Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"));
    expect(ok).toBe(true);
    // ...and not against another key.
    const other = generateKeyPairSync("ec", { namedCurve: "prime256v1" }).publicKey;
    expect(verify("sha256", Buffer.from(`${h}.${p}`), { key: other, dsaEncoding: "ieee-p1363" }, Buffer.from(s, "base64url"))).toBe(false);
  });

  it("lasts well inside Apple's six-month limit", () => {
    expect(SECRET_DAYS).toBeLessThan(180);
  });

  it("refuses wrong details with a plain message, and a bad key file", () => {
    expect(() => makeAppleClientSecret({ ...base, teamId: "short" })).toThrow(/Team ID/);
    expect(() => makeAppleClientSecret({ ...base, keyId: "lower12345" })).toThrow(/Key ID/);
    expect(() => makeAppleClientSecret({ ...base, servicesId: "has space" })).toThrow(/Services ID/);
    expect(() => makeAppleClientSecret({ ...base, days: 400 })).toThrow(/six months/);
    expect(() => makeAppleClientSecret({ ...base, privateKeyPem: "not a key" })).toThrow(/not a private key/);
    const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const p384 = generateKeyPairSync("ec", { namedCurve: "secp384r1" }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    expect(() => makeAppleClientSecret({ ...base, privateKeyPem: rsa })).toThrow(/not an Apple Sign in key/);
    expect(() => makeAppleClientSecret({ ...base, privateKeyPem: p384 })).toThrow(/not an Apple Sign in key/);
    expect(createPrivateKey(privateKeyPem).asymmetricKeyType).toBe("ec");
  });
});
