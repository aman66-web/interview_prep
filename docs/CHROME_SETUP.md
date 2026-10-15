# Setup steps for Claude in Chrome

For Claude in Chrome (or Claude Code with `--chrome`). The founder asks you to do one STEP at a time. Read only the step he names, and do exactly that.

## Rules for every step

- Work in the founder's signed-in browser.
- **Never read, print, type or describe a secret key.** Only use the page's own **Copy** button. The founder pastes secret keys himself (Ctrl+V on Windows, Cmd+V on a Mac).
- Whenever a login, a code (2FA), a card or bank detail, or a CAPTCHA is needed, stop, tell the founder in plain words what you need, and wait.
- If something looks different from these steps, stop and say what you see. Do not guess.
- When the step is finished, say which parts worked and which did not, in a few simple lines. Never include a key in that message.

## STEP 1: Supabase, then Vercel

The Supabase account is **aman662002@gmail.com**. The project is **interview-prep**.

**A. Supabase settings**

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

**B. The Supabase secret key**

3. In Supabase open **Project Settings**, then **API Keys**. Click the **Copy** button next to the secret key (it starts with `sb_secret_`). Do not reveal or read it.
4. Open a new tab: Vercel, project **interview-prep**, **Settings**, **Environment Variables**, **Add**.
   - Name: `SUPABASE_SECRET_KEY`
   - Tick **Production** and **Preview**.
   - Turn on **Sensitive**.
   - Click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V now, then click Save."
5. When the founder says it is saved, check that `SUPABASE_SECRET_KEY` shows in the list (never show its value) and report.

## STEP 2: Anthropic (the AI interviewer)

1. Open console.anthropic.com. Go to **Settings**, then **Limits**, and set the **monthly spend limit** to **$20**. If it asks for credit or a payment card first, stop and let the founder do that.
2. Go to **API keys**, then **Create key**, name it `casespar-preview`. Click **Copy**. Do not read the key.
3. Open Vercel, project **interview-prep**, **Settings**, **Environment Variables**, **Add**.
   - Name: `ANTHROPIC_API_KEY`
   - Tick **Production** and **Preview**.
   - Turn on **Sensitive**.
   - Click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V now, then click Save."
4. Add a second variable (not sensitive): Name `ANTHROPIC_MODEL`, Value `claude-sonnet-5-5`, **Production** and **Preview**. Save.
5. Report which parts worked.

## STEP 3: Stripe (TEST MODE only)

1. Open the Stripe dashboard. **Make sure the Test mode switch is ON** (top right) before you do anything. If you cannot confirm it, stop.
2. Go to **Billing**, then **Customer portal**. Click **Activate** (test link). Tick "Customers can cancel subscriptions" and "Customers can update payment methods". Save.
3. Go to **Developers**, then **API keys**. Click **Copy** on the **Secret key** (it starts with `sk_test_`). Do not read it.
4. Open Vercel, project **interview-prep**, **Settings**, **Environment Variables**, **Add**.
   - Name: `STRIPE_SECRET_KEY`
   - Tick **Production** and **Preview**.
   - Turn on **Sensitive**.
   - Click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V now, then click Save."
5. Do not set up the webhook yet. Report which parts worked.
