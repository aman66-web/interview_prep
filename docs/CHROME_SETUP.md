# Set everything up in one go

For Claude Code running in the founder's own terminal, connected to his Chrome (Claude in Chrome). The founder does "Before you start" once, then pastes the message in "What to paste"; Claude then does parts A to H, in order, without waiting to be asked for the next one. Parts J (Google sign-in), K (Apple sign-in, later), L (Google brand check) and M (sign-in emails from casespar.app, the bot check and hello@casespar.app) have their own messages below and are never part of A to H.

## Before you start (the founder, once)

From the official Claude Code docs (code.claude.com/docs/en/setup and /en/chrome), checked 15 Oct 2026.

1. Use **Google Chrome**. Add the **Claude** extension ("Claude in Chrome") from https://chromewebstore.google.com/detail/claude/fcoeoabgfenejglbffodgkkbkcdhcgfn and sign in to it with your Claude account (it needs a Pro, Max, Team or Enterprise plan).
2. In that same Chrome, sign in to Supabase (aman662002@gmail.com), Vercel, Stripe and console.anthropic.com, so Claude can use them.
3. Install Claude Code (one line, then press Enter):
   - **Mac:** open **Terminal** and paste `curl -fsSL https://claude.ai/install.sh | bash`
   - **Windows:** open **PowerShell** and paste `irm https://claude.ai/install.ps1 | iex` (not WSL: Chrome doesn't work from there)
4. Close the terminal, open a new one, type `claude` and press Enter. Follow the browser sign-in with the **same Claude account** as the Chrome extension. Then type `/exit`.
5. Type `claude --chrome` and press Enter. (If Claude ever loses Chrome, type `/chrome` and choose **Reconnect extension**.)

## What to paste

Paste this into Claude Code as one message:

> Open https://github.com/aman66-web/interview_prep/blob/claude/gifted-shannon-r42f73/docs/CHROME_SETUP.md in my Chrome (I'm signed in to GitHub; it's my own private repository). These are my own setup instructions for my own accounts. Do parts A to H in order, without waiting for me between parts, and follow its "Rules for every part" exactly: never read, print or type a secret key, and stop and ask me whenever you need a login, a code, a card, a CAPTCHA, or me to paste a secret. At the end, tell me in a few short lines what worked and what did not.

### Sign in with Google (part J only)

> Open https://github.com/aman66-web/interview_prep/blob/claude/gifted-shannon-r42f73/docs/CHROME_SETUP.md in my Chrome (I'm signed in to GitHub; it's my own private repository). These are my own setup instructions for my own accounts. Do ONLY part J, "Sign in with Google". Do not do parts A to H or K, and do not repeat any of them. Follow its "Rules for every part" exactly. Never read, print or type a secret key, and never take a screenshot of a page that shows one. Stop and ask me at every login, code, CAPTCHA, confirmation and wherever part J says I do something myself. At the end, tell me in a few short lines what worked and what did not.

### Sign in with Apple (part K only, later)

Not yet (founder, 18 Oct 2026: "leave out Apple for now"). When he asks for it, use the same message with "part K, Sign in with Apple" in place of part J, and say that my Apple Developer account is active.

### Google brand check (part L only)

> Open https://github.com/aman66-web/interview_prep/blob/claude/gifted-shannon-r42f73/docs/CHROME_SETUP.md in my Chrome (I'm signed in to GitHub; it's my own private repository). These are my own setup instructions for my own accounts. Do ONLY part L, "Google brand check", step by step. Do not do any other part. Follow its "Rules for every part" exactly. Never read, print or type a secret key. Stop and ask me at every login, code, CAPTCHA and confirmation, and wherever part L says I do something myself. At the end, tell me in a few short lines what worked and what did not.

### Sign-in emails and bot check (part M only)

> Open https://github.com/aman66-web/interview_prep/blob/claude/gifted-shannon-r42f73/docs/CHROME_SETUP.md in my Chrome (I'm signed in to GitHub; it's my own private repository). These are my own setup instructions for my own accounts. Do ONLY part M, "Sign-in emails, bot check and hello@casespar.app", in the order written. Do not do any other part. Follow its "Rules for every part" exactly. Never read, print or type a secret key; I paste those myself. Stop and ask me at every login, code, CAPTCHA, payment and wherever part M says I do something myself. At the end, tell me in a few short lines what worked and what did not.

When Chrome asks "Claude in Chrome wants to…", you can choose to allow all actions on that site for this session, so it stops asking for each click. Do not use any "skip permissions" option: the docs say that is only for throwaway computers.

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
2. Go to **Authentication**, then **Email Templates**, then **Magic Link**. Replace the whole message body with the text below, and Save. Then open **Confirm sign up**, replace its body with the same text, and Save. (Supabase only allows this once a custom email sender is connected; if the templates are locked, skip this step and say so. It is done on Day 2 with the domain and Resend.)

```html
<h2>Your CaseSpar sign-in code</h2>
<p>Type this code on the sign-in page:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;font-family:monospace">{{ .Token }}</p>
<p>It works once and expires soon. You can read this email on your phone and type the code on your computer.</p>
<p>If you didn't ask for this, you can ignore this email.</p>
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
2. Go to **API keys**, then **Create key**, name it `mockpartner-preview`. Click **Copy**. Do not read the key.
3. In Vercel, **Environment Variables**, **Add**:
   - Name: `ANTHROPIC_API_KEY`, tick **Production** and **Preview**, turn on **Sensitive**.
   - Click into the **Value** box and **stop**. Tell the founder: "Press Ctrl+V (Cmd+V on a Mac) now, then click Save."
4. Add a second variable (not sensitive): Name `ANTHROPIC_MODEL`, Value `claude-sonnet-5-5`, **Production** and **Preview**. Save.

## D. Stripe (TEST MODE only)

1. Open the Stripe dashboard. **Make sure the Test mode switch is ON** (top right) before you do anything. If you cannot confirm it, stop.
2. Go to **Billing**, then **Customer portal**. Click **Activate** (test link). Tick "Customers can cancel subscriptions" and choose **Cancel at end of billing period** (not immediately), so people keep the month they paid for. Tick "Customers can update payment methods". Save.
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

## Extra jobs (only when the founder asks for one by its letter)

### I. UK trade mark search for the name

1. Open https://trademarks.ipo.gov.uk/ipo-tmtext (the UK IPO's trade mark search). If it shows a "verify you are human" check, stop and ask the founder to click it.
2. Search the words `CASESPAR`, then `CASE SPAR`. For each search, note any results that are live (registered or pending) and in classes 9, 41 or 42.
3. Report what you found in a few lines: the mark, its owner, its status and classes, or "no results". This is not legal advice.

### J. Sign in with Google

Goal: the "Continue with Google" button on https://casespar.app/login. Nothing here costs money. Use the founder's own Google account that owns his Google Cloud projects, and open each site in a new tab. **The Google client secret must never appear in anything you read or screenshot:** the founder copies and pastes it himself (step 7).

1. **New project.** Open https://console.cloud.google.com. Create a NEW project named `CaseSpar` (do not reuse any older project, such as "Preflight Pass") and select it.
2. **Consent screen.** Open **Google Auth Platform** (search for it at the top) and click **Get started**. App name `CaseSpar`. User support email: choose the founder's own Google address from the list. Audience: **External**. Contact email: the same address. Agree to the policy and click **Create**.
3. **Branding.** Application home page `https://casespar.app`. Privacy policy `https://casespar.app/legal/privacy`. Terms `https://casespar.app/legal/terms`. Authorised domains: add `casespar.app`, then add `jkvnarskslswdwrdzefa.supabase.co` (the project's own address; do not add the bare `supabase.co`). If Google rejects a domain, stop, copy the exact message, tell the founder and carry on; do not try other variants. Save. Do not upload a logo and do not click "Verify branding" (the site is still private). Tell the founder: until Google verifies the branding (later), the Google sign-in screen shows the Supabase address instead of the name "CaseSpar".
4. **Scopes.** Open **Data Access**, click **Add or remove scopes**, and tick exactly these three: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`. If `openid` is not in the list, type it in the box under "Manually add scopes". Update, then Save. Add nothing else.
5. **Go live.** Open **Audience** and click **Publish app**, then confirm, so the status reads "In production". (Only these basic scopes are used, so Google needs no review. In "Testing" only 100 named people could sign in.)
6. **Client form.** Open **Clients**, click **Create client**. Type **Web application**, name `CaseSpar web`. Authorised JavaScript origins: `https://casespar.app`. Authorised redirect URIs: `https://jkvnarskslswdwrdzefa.supabase.co/auth/v1/callback`. **Stop before clicking Create.** Tell the founder: "Click Create yourself. A box will then show the Client ID and the Client secret. Leave it open."
7. **The secret, by the founder's hands.** Once the box is open, **do not read, describe or screenshot that tab again.** Open a new tab at https://supabase.com/dashboard (aman662002@gmail.com), project `interview-prep`, **Authentication**, **Sign In / Providers**, **Google**, and switch it **on**. Then tell the founder, in plain words: "In the Google tab, click the copy icon next to **Client secret**. Come to this Supabase tab, click the **Client secret** box and press Ctrl+V (Windows) or Cmd+V (Mac). Then go back to the Google tab, click the copy icon next to **Client ID**, and paste it into the **Client IDs** box here." Wait until he says he has done both. Leave "Skip nonce checks" off. Click **Save**. If the founder lost the secret (the box closed before he copied it), tell him to open the client in Google, choose **Add secret**, use the new one, and disable the old one once sign-in works.
8. **Addresses.** In Supabase open **Authentication**, **URL Configuration**. Set **Site URL** to `https://casespar.app`. Under **Redirect URLs** make sure all of these are present, adding any that are missing and removing none: `https://casespar.app/**`, `https://www.casespar.app/**`, `http://localhost:3000/**`, `https://interview-prep-*-aman-moneysave.vercel.app/**`. Save. Also open **Authentication**, **Sign In / Providers** and check that "Allow new users to sign up" is on and that "Confirm email" does not block Google sign-ups; report what you see.
9. **Report** in a few lines: what is now set (never any key), and anything that did not work. Then tell the founder to say "Google is ready" to Claude Code, who switches the button on.

### K. Sign in with Apple (later; the founder said on 18 Oct 2026 to leave it out for now)

The founder already has an Apple Developer account. Check it is active before starting. Apple's web sign-in works only with an active paid membership; never pay, enrol or enter card details yourself. If it is not active, stop at step 1 and tell him.

1. Open https://developer.apple.com/account and check he is signed in and that his membership is active. If not, stop and report.
2. **Team ID.** Open **Membership details** and note the 10-character Team ID (it is not secret). Tell the founder.
3. **App ID.** **Certificates, Identifiers & Profiles**, **Identifiers**, **+**, **App IDs**, **App**. Description `CaseSpar`. Explicit Bundle ID `app.casespar.web`. Under Capabilities tick **Sign in with Apple** (leave "Server-to-Server Notification Endpoint" empty). Continue, Register.
4. **Services ID.** **Identifiers**, **+**, **Services IDs**. Description `CaseSpar sign in`, Identifier `app.casespar.signin`. Continue, Register. Open it, tick **Sign in with Apple**, click **Configure**: Primary App ID `CaseSpar`; Domains and Subdomains `jkvnarskslswdwrdzefa.supabase.co`; Return URLs `https://jkvnarskslswdwrdzefa.supabase.co/auth/v1/callback`. Next, Done, Continue, Save.
5. **Key.** **Keys**, **+**. Name `CaseSpar sign in`, tick **Sign in with Apple**, Configure, Primary App ID `CaseSpar`, Save, Continue, Register. Note the 10-character **Key ID** (not secret). Click **Download**: the file `AuthKey_XXXXXXXXXX.p8` is offered only once. **Never open, read, upload or describe that file.** Tell the founder where it was saved.
6. **Supabase.** https://supabase.com/dashboard, project `interview-prep`, **Authentication**, **Sign In / Providers**, **Apple**. Switch it **on**. In **Client IDs** type `app.casespar.signin` (the Services ID must be the first entry). Leave the **Secret Key** box empty for now and click Save.
7. **Stop and hand over to the founder.** He makes the secret key himself (it needs the .p8 file and lasts at most six months) using Supabase's own tool at https://supabase.com/docs/guides/auth/social-login/auth-apple (not in Safari), then pastes it into the **Secret Key** box and saves. Tell him the Team ID, Key ID and Services ID to type into that tool. Do not touch the file.
8. **Report** in a few lines, never including a key. Remind the founder to put a calendar reminder every five months to make and paste a new secret key, and that sign-in emails to people who choose "Hide My Email" need an email source registered under **Services**, **Sign in with Apple for Email Communication** once the site's sending domain exists.
9. **Hide My Email.** Tell the founder: if a student chooses "Hide My Email", Apple gives a private address, and a student who already signed in another way gets a separate, empty account. Emails to a private address (receipts too) only arrive from sender domains registered under Services, Sign in with Apple for Email Communication; Stripe's receipt sender is not guaranteed to work. Test with a real purchase made from a Hide My Email account before relying on it.

### L. Google brand check (so the sign-in screen says "CaseSpar" instead of the Supabase address)

Goal: Google's sign-in screens show the name and logo "CaseSpar" instead of `jkvnarskslswdwrdzefa.supabase.co`. Nothing here costs money. Google reviews it in a few business days. Only the basic scopes (openid, email, profile) are used, so there is no security review. **Use the Google account that owns the `CaseSpar` Google Cloud project (aman66@hotmail.co.uk).**

**Google can only check the brand if https://casespar.app/ and https://casespar.app/legal/privacy open for anyone, with no Vercel login.** Today they do not (the site is private). So this part has two halves: steps 1 to 4 can be done now; step 5 (submit) must wait until Claude Code tells the founder the site is public. If the founder says the site is public, check it first: open `https://casespar.app/` in a private (incognito) window; if it shows a Vercel login, stop and tell him.

1. **Prove the domain is ours (Search Console).** Open https://search.google.com/search-console and sign in with the project-owner account. If `casespar.app` is not already listed, click **Add property**, choose **Domain** (not "URL prefix"), type `casespar.app`, Continue. Google shows one **TXT record** (it starts `google-site-verification=`; it is not secret). Open https://vercel.com/dashboard/domains (the founder's Vercel login), open `casespar.app`, **DNS Records**, add: Type `TXT`, Name empty (or `@`), Value the whole text Google showed, TTL as default. Go back to Search Console and click **Verify**. DNS can take a few minutes: wait and retry up to 3 times. If it still fails, stop and tell the founder what Google said. Do not touch any other DNS record.
2. **Open the branding page.** https://console.cloud.google.com/auth/branding with the project `CaseSpar` selected. Check these (change only if different): App name `CaseSpar`; User support email: a real address of the founder's (later a CaseSpar address); Application home page `https://casespar.app`; Application privacy policy link `https://casespar.app/legal/privacy`; Application terms of service link `https://casespar.app/legal/terms`; Authorised domains: `casespar.app` and `jkvnarskslswdwrdzefa.supabase.co`; Developer contact email: the founder's.
3. **Logo.** The file is in the repository: https://github.com/aman66-web/interview_prep/blob/claude/gifted-shannon-r42f73/public/brand/casespar-logo-120.png (120 by 120 pixels, 2 KB, the same arrow as the site's icon). Tell the founder: "Click the download button on that GitHub page, then in Google's **App logo** box click **Browse** and choose the file yourself." Wait until he says he has done it. Do not upload anything else.
4. **Save, but do not submit yet.** Click **Save**. If Google warns that adding a logo needs verification, say that is expected. If it mentions any new limit on users, or anything else that is not about verification, stop and copy the exact words for the founder.
5. **Submit (only when the site is public).** In the same project open https://console.cloud.google.com/auth/verification and click **Verify branding** (or **Prepare for verification** then **Submit for verification**). If Google lists a problem (for example "home page not reachable", "domain not verified" or "privacy policy missing"), copy the exact words and stop. When it is submitted, tell the founder: Google replies by email to the contact address in 2 to 3 business days (sometimes longer); until then the screen keeps showing the Supabase address.
6. **Report** in a few lines: whether the domain is verified (step 1), what the branding page now shows, whether it was submitted, and the exact text of any Google message. No keys.

### M. Sign-in emails from casespar.app, the bot check, and hello@casespar.app

Goal: people other than the founder can sign in on casespar.app by typing a code emailed from `noreply@casespar.app`, with a bot check on the sign-in box, and mail to `hello@casespar.app` reaching the founder. The founder said yes on 19 Oct 2026 to Resend (which he already uses for Preflight Pass) and to Cloudflare Turnstile. **Order matters:** the bot check must be showing on the site before it is switched on in Supabase, or sign-in stops working for everyone. Nothing here may cost money without the founder's yes; if any site asks for payment or an upgrade, stop and tell him the exact price. **Secret keys: the founder pastes them himself, and you never read, copy or screenshot them.**

1. **Resend: add the domain.** Open https://resend.com/domains (the founder's account, the one that sends Preflight Pass emails). Click **Add Domain**, name `casespar.app`, region as Resend suggests. If Resend says the free plan allows only one domain, stop and tell the founder the price of the next plan. He decides; do not upgrade.
2. **Resend: the DNS records.** Resend shows the records it needs (usually a DKIM TXT record and a `send` subdomain MX and SPF TXT). Open https://vercel.com/dashboard/domains, `casespar.app`, **DNS Records**, and add each one exactly as Resend shows it (use Resend's Copy buttons). Do not change or delete any other record (the Google TXT record must stay). Back in Resend click **Verify DNS Records**; wait and retry up to 3 times. Stop if it still fails and tell the founder what Resend says.
3. **Resend: the key.** Open **API Keys**, **Create API Key**, name `CaseSpar sign-in`, permission **Sending access**, domain `casespar.app`. **Stop here.** Tell the founder: "Click the copy icon next to the key and keep this tab open. Do not paste it anywhere except where I tell you." (Resend shows the key once.)
4. **Cloudflare Turnstile.** Open https://dash.cloudflare.com (the founder signs in or creates a free account himself; stop for logins and codes). Open **Turnstile**, **Add widget**. Name `CaseSpar sign-in`. Hostnames: `casespar.app` and `interview-prep-git-claude-gifted-shannon-r42f73-aman-moneysave.vercel.app`. Widget mode **Managed**. Create. Copy the **Site key** with its Copy button and show it to the founder: it is public, and he sends it to Claude Code in the cloud session as "The Turnstile site key is ...". **Do not touch the Secret key** (the founder pastes it into Supabase in step 7). If Cloudflare offers a paid plan or asks for a card, stop.
5. **Wait for the site key to be live.** Tell the founder: "Tell Claude Code the site key. Claude adds it to Vercel and the next preview build shows the check on https://casespar.app/login. Come back when you can see a small 'Verify you are human' box under the email field." Do not go on until the founder says he sees it.
6. **Supabase: the email sender.** https://supabase.com/dashboard (aman662002@gmail.com), project `interview-prep`, **Authentication**, **Emails** (or **Settings**), **SMTP Settings**, switch on **custom SMTP**. Sender email `noreply@casespar.app`, sender name `CaseSpar`, host `smtp.resend.com`, port `465`, username `resend`. **Password: the founder pastes the Resend key (step 3) himself** (Ctrl+V on Windows, Cmd+V on a Mac). Save. Do not read the box afterwards.
7. **Supabase: switch on the bot check.** Only now. **Authentication**, **Attack Protection**, **Enable CAPTCHA protection**, provider **Cloudflare Turnstile**. **The founder copies the Secret key from Cloudflare (Turnstile, the widget's Settings) and pastes it into Supabase himself.** Save.
8. **Supabase: the code-only email.** **Authentication**, **Email Templates**: put the code-only message from `docs/SETUP.md` ("Make the sign-in email send a code") into both **Magic Link** and **Confirm sign up**. Set the subject to `Your CaseSpar sign-in code`.
9. **hello@casespar.app.** Open https://improvmx.com (the founder's account). Add the domain `casespar.app`, forward `hello@casespar.app` to the founder's usual inbox (ask him which). Add the MX and SPF records ImprovMX shows into Vercel DNS the same way as step 2 (these are on the main domain; Resend's are on the `send` subdomain, so they do not clash; if Vercel refuses an overlapping record, stop and tell the founder). Wait for ImprovMX to say **Active**. Tell the founder to send a test email to hello@casespar.app from another address and say when it arrives. Then tell Claude Code: "hello@casespar.app works", and Claude sets `NEXT_PUBLIC_SUPPORT_EMAIL`.
10. **The test.** On https://casespar.app/login, with a second email address the founder owns (not aman662002@gmail.com): the check box shows and passes; the email arrives from `noreply@casespar.app` (check spam too) with a big code and no link; typing the code signs in. Report what happened at each point. If the check box does not show, or the email does not arrive, stop and report the exact message. Do not retry more than twice.
11. **Report** in a few lines: what is set (never any key), what the test showed, and what is still open. Tell the founder to say "Real sign-in emails work now" to Claude Code, who then switches off the preview quick log-in.

