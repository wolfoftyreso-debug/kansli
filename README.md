# Landvex

Company site for Landvex Inc. (Houston) and Landvex AB (Tyresö). Next.js, hosted on AWS. The enquiry form sends mail with Resend, on the server only.

## Setup

```bash
npm install
cp .env.example .env.local
```

Set the names below in `.env.local`. Production `CONTACT_FROM` must be a `landvex.com` address after the domain is verified in Resend.

```bash
npm run dev      # http://localhost:3000
npm test
npm run lint
npm run typecheck
npm run build
```

## Environment

Names only. Values belong in the host environment or `.env.local`, never in git.

| Name | Server-only | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Resend API key |
| `CONTACT_FROM` | yes | Verified sender, typically `Landvex <contact@landvex.com>` |
| `CONTACT_TO` | yes | Inbox; defaults to `contact@landvex.com` |

Do not put secrets in `NEXT_PUBLIC_*`. Rate limiting is in-process and therefore best-effort across instances.

## Deploy

Production runs on AWS. Same variable names as local. Production refuses a From address outside `landvex.com`.
