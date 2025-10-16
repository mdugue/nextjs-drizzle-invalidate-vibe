# Pulseboard

Pulseboard is a production-style Next.js App Router demo showcasing modern client/server data workflows with Drizzle ORM, SQLite, Server Actions, and cache invalidation. Three domains—projects, tickets, and members—illustrate drawer, detail page, and modal overview/detail patterns with cursor pagination and optimistic UI.

## ✨ Features

- **React Server Components** with server data loaders cached via `unstable_cache` and granular cache tags.
- **Server Actions** for all CRUD operations with Zod validation, `react-hook-form`, and optimistic state updates.
- **Cursor-based pagination** with stable backfill after mutations and search/sort controls persisted in URL search params.
- **Three interaction patterns**
  - Projects → sheet/drawer detail
  - Tickets → dedicated detail page
  - Members → modal dialog detail
- **Drizzle ORM + SQLite** schema, migrations, and Faker-powered seeding script (~120 rows per entity).
- **Tailwind CSS + shadcn/ui** component primitives, accessible dialogs/sheets, and Suspense skeletons.
- **Quality tooling** with Biome linting, strict TypeScript, Bun tests, and GitHub Actions CI.

## 🧱 Tech Stack

- Next.js 15 (App Router) + React 19 RC
- TypeScript (strict)
- Tailwind CSS & shadcn/ui (Radix)
- Drizzle ORM + libSQL
- Bun runtime & test runner
- Zod + react-hook-form
- Biome formatter/linter

## 🚀 Getting Started

```bash
bun install
bunx drizzle-kit generate
bun run db:migrate
bun run db:seed
bun run dev
```

The SQLite database lives at `.data/dev.sqlite` (git-ignored). Seed data uses Faker to generate realistic entities.

## 🧭 Architecture Overview

```
app/
  layout.tsx        # Sidebar layout + providers
  page.tsx          # Landing page
  projects/         # Sheet interaction + list
  tickets/          # List + detail page editing
  members/          # List + modal interaction
lib/
  schema.ts         # Drizzle schema + enums
  queries.ts        # Cached data fetchers with tags
  pagination.ts     # Cursor pagination helper
scripts/seed.ts     # Faker seed script
```

Key patterns:

- `lib/queries.ts` centralizes cached fetchers with tag-based invalidation.
- `lib/pagination.ts` ensures stable cursor navigation with backfill.
- Client components (`ProjectSheet`, `TicketDetailForm`, `MemberDialog`) use `useTransition`, `useOptimistic`, and `router.refresh()` for smooth UX.

## 🧪 Tooling & Scripts

| Command               | Description                    |
| --------------------- | ------------------------------ |
| `bun run dev`         | Start Next.js dev server       |
| `bun run build`       | Create production build        |
| `bun run start`       | Start production server        |
| `bun run db:generate` | Generate Drizzle SQL migration |
| `bun run db:migrate`  | Apply migrations               |
| `bun run db:seed`     | Seed SQLite database           |
| `bun run lint`        | Biome lint/format check        |
| `bun run typecheck`   | TypeScript strict check        |
| `bun run test`        | Bun test suite                 |

## 🧰 Extending

- **New entities:** Add schema definitions, create cached queries with tags, extend `scripts/seed.ts`, and mirror UI patterns.
- **Authentication:** Wrap Server Actions with access control before mutation.
- **Deployment:** Provision SQLite file storage (or swap to Postgres) and configure `DATABASE_URL` in `drizzle.config.ts`.

## 📄 License

MIT
