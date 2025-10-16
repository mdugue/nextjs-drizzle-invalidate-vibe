# AGENTS

This repository is Bun-first and demonstrates modern Next.js App Router patterns with Drizzle ORM, libSQL, and granular cache invalidation. Follow the guidance below to keep contributions consistent and production-grade.

## Required checks (before merging)

- Run `bun run lint`, `bun run typecheck`, and `bun run test` and ensure they pass.
- Prefer project scripts (i.e. `bun run <script>`) over ad-hoc commands.

## Data access and caching

- Prefer colocating data access helpers under `lib/` and keep them driver-agnostic. Only `lib/db.ts` should bind to a specific driver/runtime.
- Centralize read fetchers in `lib/queries.ts` using `unstable_cache` and tag constants:
  - `PROJECT_LIST_TAG` / `PROJECT_DETAIL_TAG(id)`
  - `TICKET_LIST_TAG` / `TICKET_DETAIL_TAG(id)`
  - `MEMBER_LIST_TAG` / `MEMBER_DETAIL_TAG(id)`
- After any mutation, revalidate the correct tags in Server Actions with `revalidateTag(...)` so lists and details refresh without manual cache busting.

## Server Actions and validation

- Validate form inputs with Zod schemas in `lib/zod.ts` using the `parseFormData` pattern seen in `app/*/actions.ts`.
- Perform the mutation, then call `revalidateTag(...)` for both list and detail tags where relevant.
- Avoid catching errors unless you can surface a meaningful message to the user.

## Pagination, search, and sort

- For lists, use `cursorPaginate` from `lib/pagination.ts` and accept `{ cursor, direction, limit, search, sort }` props.
- Supported sort keys are `"createdAt"` and `"title"`; keep tie-breaks stable by `id` as shown in existing fetchers.

## Next.js dynamic APIs (App Router)

- In server components/pages, await dynamic APIs before using them: `headers()`, `cookies()`, `draftMode()`, and `searchParams`.
- If a page receives `searchParams`, treat it as async and await before property access to avoid the Next.js "sync dynamic APIs" warning.

## Database, migrations, and seed data

- Local SQLite lives at `.data/dev.sqlite` and is created on demand by `lib/db.ts`.
- Generate SQL: `bun run db:generate`
- Apply migrations: `bun run db:migrate`
- Seed data: `bun run db:seed`
- When schemas change, update `scripts/seed.ts` accordingly so local environments stay consistent.

## UI and styling

- Use Tailwind CSS and shadcn/ui component primitives under `app/components/ui/`.
- Keep loading/empty states aligned with existing skeleton patterns.

## Documentation

- Document significant infrastructure or workflow changes in `README.md` (e.g., new env vars, scripts, or hosting requirements). Also update the scripts table if you add or change commands.

## Adding a new entity (checklist)

- Add schema/enums to `lib/schema.ts`.
- Create cached fetchers + tags in `lib/queries.ts`.
- Add Zod form schema in `lib/zod.ts`.
- Implement Server Actions with correct `revalidateTag(...)` calls.
- Extend `scripts/seed.ts` with realistic data.
- Build list/detail UI following existing domain patterns.
- Ensure lint, typecheck, and tests pass before merging.
