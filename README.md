# kansli

**Kansli** is a small office task board built with [Next.js](https://nextjs.org) (App Router) and Tailwind CSS. It demonstrates a full end-to-end flow: a React UI that reads and writes tasks through JSON API route handlers, backed by a file-based store.

## Getting started

Requires Node.js 22+ and [pnpm](https://pnpm.io).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the task board.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Run the production build. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Type-check with `tsc --noEmit`. |

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | List all tasks. |
| `POST` | `/api/tasks` | Create a task (`{ "title": string, "owner"?: string }`). |
| `PATCH` | `/api/tasks/:id` | Toggle a task's done state. |
| `DELETE` | `/api/tasks/:id` | Delete a task. |

Tasks are persisted to `data/tasks.json` (git-ignored, seeded on first run).

## Project structure

- `src/app/page.tsx` — client UI for the task board.
- `src/app/api/tasks/` — route handlers for the tasks API.
- `src/lib/store.ts` — file-based JSON task store.
