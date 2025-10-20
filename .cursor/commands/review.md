Context (assume unless stated otherwise):
	•	Framework: Next.js App Router with React Server Components + Server Actions
	•	Data: Drizzle ORM (SQLite/Postgres) via Server Actions and/or Route Handlers (app/api/*) with fetch
	•	UI: shadcn/ui + Tailwind
	•	Forms/validation: React Hook Form + Zod (server is source of truth)
	•	Tooling: TypeScript strict, Biome + Ultracite, CI for typecheck/lint/build
	•	Concerns: pagination, overview/detail, optimistic updates, invalidations, stable page count after delete/update

Goal: Perform an expert review focused on correctness, architecture, performance, accessibility, data consistency, and DX. Provide concrete, code-level fixes.

⸻

1) Architecture & RSC Boundaries
	•	Verify Server vs Client component split; remove unnecessary "use client".
	•	Server Actions: validate inputs with Zod (server-side); ensure idempotency, transactional integrity, and clear error mapping.
	•	Apply revalidatePath/revalidateTag/cache correctly; avoid data waterfalls.
	•	Identify hydration pitfalls (unstable props, Dates, random IDs, locale objects).

2) Routing & UX States
	•	App Router conventions: colocated layout.tsx, loading.tsx, error.tsx, not-found.tsx, metadata.ts.
	•	Ensure overview/detail flows: sheets vs pages use proper URL state (search params/segments), focus management, and back/forward navigation.
	•	Defensive handling of dynamic params and searchParams.

3) Data Layer (Drizzle + Server Actions / Route Handlers)
	•	Drizzle schema & migrations consistent; types correct; indexes present for filters/sorts/pagination.
	•	Use parameterized queries only; avoid string concatenation.
	•	Prevent N+1 with appropriate joins or prefetch queries.
	•	Use transactions for multi-step mutations; guarantee atomicity.
	•	Keep secrets/server-only env server-side (no leakage via next.config or serialized props).
	•	If using route handlers: correct HTTP semantics, status codes, cache headers; no over-fetching.

4) Pagination, Invalidation & Consistency
	•	Define and verify the pagination model (cursor/offset).
	•	After create/update/delete, ensure list + detail stay in sync using revalidateTag/revalidatePath and local state reconciliation so the current number of pages remains stable.
	•	Avoid stale UI after optimistic updates; implement rollback paths on failure.

5) Forms, Validation, and Mutations
	•	RHF + Zod: server is the authority; client derives types.
	•	Return structured errors from actions; map to field and form errors.
	•	Handle file uploads/large payloads with streaming where appropriate.

6) UI/Accessibility/Styling
	•	shadcn: consistent usage; tree-shakable imports; no unused components.
	•	Tailwind: avoid class construction that breaks purge; maintain spacing/typography scales.
	•	A11y: keyboard navigation, roles/labels, color contrast; dialogs/sheets trap & restore focus.

7) Performance & Bundles
	•	Prefer RSC for data-heavy work; keep client components lean.
	•	Use dynamic imports for heavy client-only widgets.
	•	Check Next/Image, prefetch behavior of Link, caching headers.
	•	Spot re-render hotspots; memoize only when it meaningfully reduces work.

8) Security & Access Control
	•	Server-side auth/authorization checks (ABAC/RBAC if present).
	•	Prevent IDOR and over-posting; validate identifiers and ownership.
	•	Sanitize user content; safe redirects; CSRF considerations for non-idempotent actions.

9) Testing & Tooling
	•	Recommend unit/integration/e2e coverage (Vitest/Playwright).
	•	Tests for pagination, optimistic mutations + rollback, error/load/not-found states.
	•	Biome/Ultracite config: ensure deprecated rules policy (warn vs error) aligns with CI; include typecheck and build in CI.

⸻

📌 Deliverables
	1.	Findings Table — Severity (blocker/major/minor), Area, File/Path, Issue, Why it matters, Fix (short).
	2.	Top 10 Actionable Fixes with before/after code (TSX/TS/SQL) including revalidation calls.
	3.	Architecture Notes — propose simplifications (RSC boundaries, unified invalidation strategy).
	4.	Checklists (tick/untick):
	•	RSC boundaries ✅/❌
	•	Stable pagination after deletes/updates ✅/❌
	•	Zod validation on all actions ✅/❌
	•	Error/load/not-found per route ✅/❌
	5.	Quick Wins (<1h) and High-Leverage Refactors (½–2 days).

⸻

📎 Example Invocation

Review this Next.js App Router project (RSC, Server Actions, Drizzle, shadcn, RHF+Zod).
Pay special attention to pagination and keeping the current page count stable after deletes/updates.
Call out hydration risks and any misuse of revalidateTag/revalidatePath.

Start with:
	•	app/(routes)/items/page.tsx, app/(routes)/items/[id]/page.tsx, components/ItemSheet.tsx
	•	server/actions/items.ts, lib/revalidate.ts
	•	db/schema.ts, drizzle/*.sql
	•	components/ui/*

Then propose code diffs and a unified invalidation plan.
