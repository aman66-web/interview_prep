#!/usr/bin/env node
// Makes the "secret key" that Supabase asks for when Sign in with Apple is switched on.
//
// Apple does not give you a ready-made secret. You make one yourself from the private key
// file (AuthKey_XXXXXXXXXX.p8) that Apple lets you download once, and Apple only accepts it
// for up to six months. This script makes one that lasts 150 days, so you renew it every
// five months with a comfortable margin.
//
// Run it on your own computer. The private key file never leaves your computer and nothing
// is sent anywhere. The secret is printed on its own, so you can copy it straight into
// Supabase without ever showing it in a chat:
//
//   node scripts/apple-client-secret.mjs ~/Downloads/AuthKey_ABC123DEFG.p8 TEAMID KEYID SERVICES.ID | pbcopy
//
//   TEAMID    your 10-character Apple Team ID (Membership details)
//   KEYID     the 10-character Key ID shown next to the key you created
//   SERVICES.ID  the Services ID identifier (for example app.casespar.signin)
//
// pbcopy is the Mac command that copies to the clipboard (use clip on Windows). Then paste
// into Supabase: Authentication, Providers, Apple, Secret Key.

import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DAY = 86400;
export const SECRET_DAYS = 150; // Apple's limit is six months (about 182 days)

const b64url = (input) => Buffer.from(input).toString("base64url");

/** The signed client secret (a JWT) Apple expects for Sign in with Apple on the web. */
export function makeAppleClientSecret({ privateKeyPem, teamId, keyId, servicesId, now = Math.floor(Date.now() / 1000), days = SECRET_DAYS }) {
  if (!/^[A-Z0-9]{10}$/.test(teamId)) throw new Error("The Team ID should be 10 letters and numbers.");
  if (!/^[A-Z0-9]{10}$/.test(keyId)) throw new Error("The Key ID should be 10 letters and numbers.");
  if (!servicesId || /\s/.test(servicesId)) throw new Error("Enter the Services ID, for example app.casespar.signin.");
  if (!(days > 0 && days <= 180)) throw new Error("Apple allows at most six months.");

  let key;
  try {
    key = createPrivateKey(privateKeyPem);
  } catch {
    throw new Error("That file is not a private key. Use the AuthKey_XXXXXXXXXX.p8 file Apple gave you.");
  }
  if (key.asymmetricKeyType !== "ec" || key.asymmetricKeyDetails?.namedCurve !== "prime256v1") {
    throw new Error("That is not an Apple Sign in key (it should be the AuthKey_XXXXXXXXXX.p8 file from Apple, an ECDSA P-256 key).");
  }

  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = { iss: teamId, iat: now, exp: now + days * DAY, aud: "https://appleid.apple.com", sub: servicesId };
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = sign("sha256", Buffer.from(body), { key, dsaEncoding: "ieee-p1363" });
  return { secret: `${body}.${b64url(signature)}`, expires: new Date((now + days * DAY) * 1000) };
}

function main() {
  const [file, teamId, keyId, servicesId] = process.argv.slice(2);
  if (!file || !teamId || !keyId || !servicesId) {
    console.error("Usage: node scripts/apple-client-secret.mjs <AuthKey file.p8> <Team ID> <Key ID> <Services ID>");
    process.exit(1);
  }
  let privateKeyPem;
  try {
    privateKeyPem = readFileSync(file, "utf8");
  } catch {
    console.error("Could not read that key file. Check the path.");
    process.exit(1);
  }
  try {
    const { secret, expires } = makeAppleClientSecret({ privateKeyPem, teamId, keyId, servicesId });
    process.stdout.write(secret); // nothing else on stdout, so it can be piped straight to the clipboard
    const remind = new Date(expires.getTime() - 14 * DAY * 1000);
    console.error(`\nDone. This secret stops working on ${expires.toISOString().slice(0, 10)}.`);
    console.error(`Put a reminder in your calendar for ${remind.toISOString().slice(0, 10)} to run this again and paste the new one into Supabase.`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : "Could not make the secret. Check the key file and the details.");
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
