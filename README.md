# interview_prep

Consulting case-interview practice with an AI interviewer that scores you. Built with Next.js, Supabase, Stripe and the Anthropic API.

- Project rules and commands: [`CLAUDE.md`](CLAUDE.md)
- Product spec: [`docs/SPEC.md`](docs/SPEC.md)
- Where we are: [`docs/PROGRESS.md`](docs/PROGRESS.md)

## Run it

Needs Node 22 or newer.

```
npm install
cp .env.example .env.local   # then fill in your own values; never commit this file
npm run dev
```

Checks (the same ones GitHub runs): `npm run lint`, `npm run typecheck`, `npm test`, `npm run content:check`, `npm run build`.
