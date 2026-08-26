# Landvex

Founder-led automation engineering on AWS. Company site for Landvex Inc. (Houston) and Landvex AB (Tyresö).

## Local development

```bash
npm install
cp .env.example .env.local
# add RESEND_API_KEY from Resend or `vercel env pull .env.local --yes`
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contact form (Resend only)

The enquiry form posts to a server action that sends mail with Resend.

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Server-only API key |
| `CONTACT_FROM` | Verified sender, e.g. `Landvex <contact@landvex.com>` |
| `CONTACT_TO` | Inbox, defaults to `contact@landvex.com` |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata |

Until `landvex.com` is verified in Resend, `CONTACT_FROM` can stay `Landvex <onboarding@resend.dev>`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm test
```
