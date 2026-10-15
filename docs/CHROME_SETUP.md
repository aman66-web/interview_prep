# Set everything up in one go

For Claude Code running in the founder's own terminal, connected to his Chrome (Claude in Chrome). The founder pastes the message in "What to paste" below once; Claude then does every part, A to H, in order, without waiting to be asked for the next one.

## What to paste

Paste this into Claude Code (with Chrome connected) as one message:

> Set up my CaseSpar website accounts for me. Do every part of the instructions below, A to H, in order, in my Chrome. Follow the "Rules for every part" exactly: never read, print or type a secret key, and stop and ask me whenever you need a login, a code, a card, a CAPTCHA, or me to paste a secret. When you finish, tell me in a few short lines what worked and what did not.

Then paste everything from "Rules for every part" to the end of this file underneath it, in the same message. (Or, if Claude Code was started inside the project folder, just say: "Do everything in docs/CHROME_SETUP.md, parts A to H, in order.")

## Rules for every part

- Work in the founder's signed-in Chrome. Open each site in a new tab.
- **Never read, print, type or describe a secret key**, here or anywhere else. Only use the page's own **Copy** button. The founder pastes secret keys himself (Ctrl+V on Windows, Cmd+V on a Mac).
- Whenever a login, a code (2FA), a card or bank detail, or a CAPTCHA is needed, stop, tell the founder in plain words what you need, and wait for him.
- Nothing here may cost money without the founder saying yes in this conversation. If a site asks for payment or credit, stop and ask.
- **Stripe stays in Test mode.** Never switch Stripe to live mode.
- If a page looks different from these steps, stop and say what you see. Do not guess.
- After each part, say in one line whether it worked, then carry straight on to the next part.
- At the end, report which parts worked and which did not, in a few simple lines. Never include a key in any message.

The preview site is `https://interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app` (the founder must be logged in to Vercel to open it). Vercel project: **interview-prep** (account aman-moneysave). Supabase account: **aman662002@gmail.com**, project **interview-prep**.

## A. Supabase settings

1. Open Supabase, project **interview-prep**, then **Authentication**, then **URL Configuration**.
   - Site URL: `https://interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app`
   - Under Redirect URLs add both of these:
     - `http://localhost:3000/**`
     - `https://interview-prep-*-aman-moneysave.vercel.app/**`
   - Click Save.
2. Go to **Authentication**, then **Email Templates**, then **Magic Link**. Replace the whole message body with the text below, and Save. Then open **Confirm sign up**, replace its body with the same text, and Save.

```html
<h2>Your sign-in link</h2>
<p><a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Sign in</a></p>
<p>Or type this code on the sign-in page: <strong>{{ .Token }}</strong></p>
<p>The link and code work once and expire soon. If you didn't ask for this, you can ignore this email.</p>
```

## B. The Supabase secret key into Vercel

1. In Supabase open **Project Settings**, then **API Keys**. Click the **Copy** button next to the secret key (it starts with `sb_secret_`). Do not reveal or read it.
2. Open a new tab: Vercel, project **interview-prep**, **Settings**, **Environment Variables**, **Add**.
   - Name: `SUPABASE_SECRET_KEY`
   - Tick **Production** and **Preview**.
   - Turn on **Sensitive**.
   - Click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V (Cmd+V on a Mac) now, then click Save."
3. When the founder says it is saved, check that `SUPABASE_SECRET_KEY` shows in the list (never show its value).

## C. Anthropic (the AI interviewer)

1. Open console.anthropic.com. Go to **Settings**, then **Limits**, and set the **monthly spend limit** to **$20**. If it asks for credit or a payment card first, stop and let the founder do that (it costs money, so he decides).
2. Go to **API keys**, then **Create key**, name it `casespar-preview`. Click **Copy**. Do not read the key.
3. In Vercel, **Environment Variables**, **Add**:
   - Name: `ANTHROPIC_API_KEY`, tick **Production** and **Preview**, turn on **Sensitive**.
   - Click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V (Cmd+V on a Mac) now, then click Save."
4. Add a second variable (not sensitive): Name `ANTHROPIC_MODEL`, Value `claude-sonnet-5-5`, **Production** and **Preview**. Save.

## D. Stripe (TEST MODE only)

1. Open the Stripe dashboard. **Make sure the Test mode switch is ON** (top right) before you do anything. If you cannot confirm it, stop.
2. Go to **Billing**, then **Customer portal**. Click **Activate** (test link). Tick "Customers can cancel subscriptions" and "Customers can update payment methods". Save.
3. Go to **Developers**, then **API keys**. Click **Copy** on the **Secret key** (it starts with `sk_test_`). Do not read it.
4. In Vercel, **Environment Variables**, **Add**:
   - Name: `STRIPE_SECRET_KEY`, tick **Production** and **Preview**, turn on **Sensitive**.
   - Click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V (Cmd+V on a Mac) now, then click Save."
5. Do not set up a Stripe webhook yet: the preview site is behind the Vercel login, so Stripe could not reach it. The site switches a plan on as soon as someone comes back from paying, so testing works without it.

## E. The other site settings in Vercel

1. **`CRON_SECRET`** (a long random password for the daily clean-up; nobody needs to know it). Make it straight into the clipboard, without showing it, by running one command in the terminal:
   - Mac: `openssl rand -hex 32 | tr -d '\n' | pbcopy`
   - Windows (PowerShell): `$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { $_.ToString('x2') }) | Set-Clipboard`

   Then in Vercel, **Environment Variables**, **Add**: Name `CRON_SECRET`, tick **Production** and **Preview**, turn on **Sensitive**, click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V (Cmd+V on a Mac) now, then click Save."
2. **`ADMIN_EMAILS`** (not sensitive): Value `aman662002@gmail.com`, **Production** and **Preview**. Save. This lets the founder open the `/admin` page.
3. **`NEXT_PUBLIC_SUPPORT_EMAIL`** (not sensitive): ask the founder which email address the site should show for support. If he has none yet, skip this one and say so in the report.

## F. Put the new settings live

1. In Vercel, project **interview-prep**, open **Deployments**. Find the newest deployment of the branch `claude/gifted-shannon-r42f73`. Open its **⋯** menu and click **Redeploy** (keep the build cache option as it is), then confirm.
2. Wait until it says **Ready** (a minute or two).

## G. Check it works

Use the preview site address above.

1. **Sign in:** click **Start free**, enter `aman662002@gmail.com` and send the email. Stop and ask the founder to open that inbox and tell you the 6-digit code (or type it into the page himself). Supabase's built-in email only reaches this address for now, so use no other.
2. **AI interviewer:** on the dashboard start the free case (Harbourline Bakeries), click **Start the interview**, and send one short message, such as "Can I ask a clarifying question about the client's goal?". Check that the interviewer replies within about a minute. Then click **Finish now** and confirm, and check that a scored debrief appears.
3. **Test payment:** open **Pricing**. Tick the box under **Monthly** and click **Choose Monthly**. On Stripe's page, check it says test mode. Stop and ask the founder to type the Stripe test card himself: number `4242 4242 4242 4242`, any future date, any 3 digits, any postcode. After paying, check that the site's Account page shows the **Monthly** plan.
4. **Admin page:** open `/admin` on the preview site and check that it loads.

## H. Report

Tell the founder in a few short lines: which parts worked, which did not and what you saw, and anything he still needs to do. Never include a key.
