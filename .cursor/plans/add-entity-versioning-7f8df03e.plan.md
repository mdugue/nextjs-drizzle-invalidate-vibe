<!-- 7f8df03e-1602-473a-9c29-713c9d273dc0 10c4aa0e-a00e-4f6f-b2e2-0a8bf0f3e5dd -->
# Expert Review: Next.js App Router Project

## Executive Summary

This project demonstrates solid fundamentals with RSC architecture, Server Actions, proper cache invalidation, and cursor pagination. However, there are critical gaps in **database indexing**, **authentication/authorization**, and **test coverage** that should be addressed before production.

## 1. Findings Table

| Severity | Area | File/Path | Issue | Why It Matters | Fix |

|----------|------|-----------|-------|----------------|-----|

| **BLOCKER** | Data Layer | `lib/schema.ts` | Missing indexes on `deleted_at`, `created_at`, `title` | Performance degrades with scale; list queries will be slow | Add indexes in schema |

| **BLOCKER** | Security | `app/*/actions.ts` | No authentication/authorization checks | Anyone can CRUD any resource (IDOR vulnerability) | Add auth middleware + ownership checks |

| **MAJOR** | Data Layer | `lib/schema.ts` | Missing composite index on history tables (`entity_id`, `version_number`) | Version queries are inefficient | Add composite index |

| **MAJOR** | Testing | `tests/` | No integration tests for Server Actions, versioning, error paths | Bugs in mutation logic could corrupt data | Add action tests with real DB |

| **MAJOR** | Testing | Project root | No E2E tests for user flows | Navigation, forms, optimistic updates untested | Add Playwright suite |

| **MAJOR** | Error Handling | `app/*/actions.ts` | Actions throw unstructured errors | Client can't map errors to form fields | Return `{success: false, errors: {...}}` |

| **MINOR** | Schema Consistency | `lib/zod.ts`, `lib/schema.ts` | `owner` required in Zod but nullable in DB | Data inconsistency possible | Align both or make optional in Zod |

| **MINOR** | UX States | `app/*/[id]/` | No `not-found.tsx` files | Uses programmatic `notFound()` but missing fallback page | Add `not-found.tsx` |

## 2. Top 8 Actionable Fixes

### Fix 1: Add Database Indexes (BLOCKER)

**Before:**

```typescript:lib/schema.ts
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  // ... other fields
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

**After:**

```typescript:lib/schema.ts
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  // ... other fields
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (table) => ({
  deletedAtIdx: index("projects_deleted_at_idx").on(table.deletedAt),
  createdAtIdx: index("projects_created_at_idx").on(table.createdAt),
  titleIdx: index("projects_title_idx").on(table.title),
}));

export const projectsHistory = sqliteTable("projects_history", {
  // ... fields
}, (table) => ({
  entityVersionIdx: index("projects_history_entity_version_idx")
    .on(table.entityId, table.versionNumber),
}));
```

Apply same pattern to `tickets`, `members`, and their history tables.

**Migration:** Run `bun run db:generate` and `bun run db:migrate`.

---

### Fix 2: Add Structured Error Returns (MAJOR)

**Before:**

```typescript:app/projects/actions.ts
export async function createProject(values: ProjectFormValues) {
  const validated = projectFormSchema.parse(values); // Throws on error
  await db.insert(projects).values(validated);
  revalidateTag(PROJECT_LIST_TAG);
}
```

**After:**

```typescript:app/projects/actions.ts
type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; errors: { _form?: string; [key: string]: string } };

export async function createProject(
  values: ProjectFormValues
): Promise<ActionResult> {
  try {
    const validated = projectFormSchema.parse(values);
    await db.insert(projects).values(validated);
    revalidateTag(PROJECT_LIST_TAG);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.flatten().fieldErrors as Record<string, string>
      };
    }
    return { 
      success: false, 
      errors: { _form: "Failed to create project" }
    };
  }
}
```

Update client to handle:

```typescript:app/projects/components/project-sheet.tsx
const onSubmit = async (values: ProjectFormValues) => {
  startTransition(async () => {
    const result = await createProject(values);
    if (!result.success) {
      // Map errors to form fields
      Object.entries(result.errors).forEach(([field, message]) => {
        if (field === '_form') {
          toast.error(message);
        } else {
          form.setError(field as keyof ProjectFormValues, { message });
        }
      });
      return;
    }
    toast.success("Project created");
    onOpenChange(false);
  });
};
```

---

### Fix 3: Add Authorization Checks (BLOCKER)

**Create auth helper:**

```typescript:lib/auth.ts
// Placeholder - integrate with your auth provider
export async function getCurrentUserId(): Promise<string | null> {
  // Return user ID from session/token
  return null; // Replace with real implementation
}

export async function assertAuthenticated(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

export async function assertOwnership(
  entity: { owner?: string | null },
  userId: string
): Promise<void> {
  if (entity.owner && entity.owner !== userId) {
    throw new Error("Forbidden: You don't own this resource");
  }
}
```

**Apply to actions:**

```typescript:app/projects/actions.ts
export async function updateProject(id: number, values: ProjectFormValues) {
  const userId = await assertAuthenticated();
  
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);
    
    if (!current) throw new Error("Project not found");
    await assertOwnership(current, userId);
    
    // ... rest of update logic
  });
}
```

---

### Fix 4: Add not-found.tsx Files (MINOR)

**Create:**

```typescript:app/tickets/[id]/not-found.tsx
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function TicketNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-2xl font-semibold">Ticket not found</h2>
      <p className="text-muted-foreground">
        This ticket doesn't exist or may have been deleted.
      </p>
      <Button asChild>
        <Link href="/tickets">Back to tickets</Link>
      </Button>
    </div>
  );
}
```

---

### Fix 5: Fix Owner Field Consistency (MINOR)

**Option A - Make optional in Zod:**

```typescript:lib/zod.ts
export const projectFormSchema = z.object({
  slug: z.string().min(MIN_SLUG_LENGTH).regex(slugRegex),
  title: z.string().min(MIN_TEXT_LENGTH),
  description: z.string().optional(),
  status: z.enum(projectStatus),
  owner: z.string().min(MIN_TEXT_LENGTH).optional(), // Changed
});
```

**Option B - Make required in DB:**

```typescript:lib/schema.ts
const projectFields = {
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status", { enum: projectStatus }).notNull(),
  owner: text("owner").notNull(), // Remove .optional()
};
```

Choose based on business logic. Recommend Option A if auth will populate owner automatically.

---

### Fix 6: Add Integration Tests for Actions (MAJOR)

**Create:**

```typescript:tests/actions.test.ts
import { describe, expect, it, beforeEach } from "bun:test";
import { createProject, updateProject, deleteProject } from "@/app/projects/actions";
import { db } from "@/lib/db";
import { projects } from "@/lib/schema";

describe("Project Actions", () => {
  beforeEach(async () => {
    // Clean test data
    await db.delete(projects).execute();
  });

  it("creates a project and revalidates cache", async () => {
    const result = await createProject({
      slug: "test-project",
      title: "Test Project",
      status: "planned",
      owner: "user-123",
    });
    
    expect(result.success).toBe(true);
    
    const [created] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, "test-project"));
    
    expect(created).toBeDefined();
    expect(created.title).toBe("Test Project");
  });

  it("creates version history on update", async () => {
    // Create initial project
    await createProject({
      slug: "versioned-project",
      title: "Original Title",
      status: "planned",
      owner: "user-123",
    });
    
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, "versioned-project"));
    
    // Update it
    await updateProject(project.id, {
      ...project,
      title: "Updated Title",
    });
    
    // Check version history
    const history = await db
      .select()
      .from(projectsHistory)
      .where(eq(projectsHistory.entityId, project.id));
    
    expect(history).toHaveLength(1);
    expect(history[0].title).toBe("Original Title");
  });

  it("soft deletes project", async () => {
    await createProject({
      slug: "deletable",
      title: "Deletable",
      status: "planned",
      owner: "user-123",
    });
    
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, "deletable"));
    
    await deleteProject(project.id);
    
    const [deleted] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, project.id));
    
    expect(deleted.deletedAt).toBeDefined();
  });
});
```

---

### Fix 7: Add Composite Index for Version Queries (MAJOR)

Already shown in Fix 1, but specifically:

```typescript:lib/schema.ts
export const projectsHistory = sqliteTable("projects_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityId: integer("entity_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  changedAt: integer("changed_at", { mode: "timestamp" }).notNull().default(new Date()),
  // ... other fields
}, (table) => ({
  entityVersionIdx: index("projects_history_entity_version_idx")
    .on(table.entityId, table.versionNumber),
}));
```

This optimizes queries like `SELECT MAX(version_number) WHERE entity_id = ?`.

---

### Fix 8: Improve Transaction Error Handling (MINOR)

**Current issue:** If transaction fails after version creation, rollback happens but no error context is provided.

**Fix:**

```typescript:app/projects/actions.ts
export async function updateProject(id: number, values: ProjectFormValues) {
  const validated = projectFormSchema.parse(values);

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(projects)
        .where(eq(projects.id, id))
        .limit(1);

      if (!current) {
        throw new Error(`Project with id ${id} not found`);
      }

      // ... version creation ...
      
      await tx.update(projects).set(validated).where(eq(projects.id, id));
    });
  } catch (error) {
    console.error(`Failed to update project ${id}:`, error);
    throw new Error(`Update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  revalidateTag(PROJECT_LIST_TAG);
  revalidateTag(PROJECT_DETAIL_TAG(id));
  revalidateTag(PROJECT_VERSION_TAG(id));
}
```

---

### Fix 9: Optimize Version Number Generation (MINOR - Future)

**Current approach** calculates MAX on each transaction. **Alternative** uses a counter or sequence:

```typescript:lib/schema.ts
// Add version counter to main tables
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // ... existing fields
  currentVersion: integer("current_version").notNull().default(0),
});
```



```typescript:app/projects/actions.ts
await db.transaction(async (tx) => {
  const [current] = await tx
    .select()
    .from(projects)
    .where(eq(projects.id, id))
    .limit(1);

  if (current) {
    const nextVersion = current.currentVersion + 1;
    
    await tx.insert(projectsHistory).values({
      entityId: id,
      versionNumber: nextVersion,
      // ... rest
    });
    
    await tx
      .update(projects)
      .set({ ...validated, currentVersion: nextVersion })
      .where(eq(projects.id, id));
  }
});
```

**Trade-off:** Adds field to main table but eliminates MAX query.

---

### Fix 10: Add E2E Test Suite (MAJOR)

**Setup Playwright:**

```bash
bun add -D @playwright/test
npx playwright install
```

**Create:**

```typescript:e2e/projects.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test('creates a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=Add project');
    
    await page.fill('input[name="slug"]', 'e2e-test');
    await page.fill('input[name="title"]', 'E2E Test Project');
    await page.selectOption('select[name="status"]', 'planned');
    await page.fill('input[name="owner"]', 'Test Owner');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Project created')).toBeVisible();
    await expect(page.locator('text=E2E Test Project')).toBeVisible();
  });

  test('updates project optimistically', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=E2E Test Project');
    
    await page.fill('input[name="title"]', 'Updated Title');
    await page.click('button:has-text("Save")');
    
    // Should see optimistic update immediately
    await expect(page.locator('text=Updated Title')).toBeVisible();
  });

  test('shows version history', async ({ page }) => {
    await page.goto('/projects');
    await page.click('text=E2E Test Project');
    
    await page.click('button:has-text("v1")'); // Version badge
    await expect(page.locator('text=Version History')).toBeVisible();
  });
});
```

---

## 3. Architecture Notes

### RSC Boundaries

**Status: ✅ Good**

- Clean server/client split
- Minimal "use client" usage
- No unnecessary client components

### Stable Pagination After Deletes

**Status: ✅ Excellent**

- `cursorPaginate` with backfill logic works correctly
- Soft deletes maintain data integrity
- Version counts fetched efficiently (no N+1)

### Zod Validation on All Actions

**Status: ⚠️ Partial**

- All creates/updates validate with Zod
- Deletes/restores don't validate IDs (should add number validation)
- No validation of ownership/permissions

### Error/Load/Not-Found Per Route

**Status: ⚠️ Partial**

- Root: error.tsx ✅, loading.tsx ✅, not-found.tsx ❌
- Tickets detail: error.tsx ✅, loading.tsx ✅, not-found.tsx ❌
- Projects/Members: Use sheets, no detail routes

---

## 4. Proposed Simplifications

### 1. Unified Invalidation Strategy

Currently tags are defined per-file. **Centralize:**

```typescript:lib/cache-tags.ts
// Centralize all cache tag logic
export const TAGS = {
  projectList: () => "projects:list",
  projectDetail: (id: number) => `projects:detail:${id}`,
  projectVersions: (id: number) => `projects:versions:${id}`,
  
  ticketList: () => "tickets:list",
  ticketDetail: (id: number) => `tickets:detail:${id}`,
  ticketVersions: (id: number) => `tickets:versions:${id}`,
  
  memberList: () => "members:list",
  memberDetail: (id: number) => `members:detail:${id}`,
  memberVersions: (id: number) => `members:versions:${id}`,
} as const;

// Revalidation helpers
export function revalidateProject(id: number) {
  revalidateTag(TAGS.projectList());
  revalidateTag(TAGS.projectDetail(id));
  revalidateTag(TAGS.projectVersions(id));
}
```

---

### 2. Generic Versioning Helpers

Already done well in `lib/versioning.ts`, but could further abstract:

```typescript:lib/versioning.ts
// Generic action wrapper that handles versioning + revalidation
export async function withVersioning<T>(options: {
  entityType: EntityType;
  entityId: number;
  action: (tx: Transaction, current: T) => Promise<void>;
  revalidate: () => void;
}) {
  const { entityType, entityId, action, revalidate } = options;
  
  await db.transaction(async (tx) => {
    const current = await getCurrentEntity(tx, entityType, entityId);
    if (!current) throw new Error("Entity not found");
    
    await createVersion(tx, entityType, entityId, current);
    await action(tx, current);
  });
  
  revalidate();
}
```

---

## 5. Quick Wins (<1 hour)

1. Add database indexes (Fix 1) - 15 min
2. Add `not-found.tsx` files (Fix 4) - 10 min
3. Fix owner field consistency (Fix 5) - 5 min
4. Centralize cache tags (Simplification 1) - 20 min
5. Add JSDoc to public functions - 10 min

---

## 6. High-Leverage Refactors (½–2 days)

1. **Add authentication/authorization** (1 day)

   - Integrate auth provider (Clerk, Auth.js, etc.)
   - Add ownership checks to all actions
   - Update schema with user relationships

2. **Implement structured error handling** (½ day)

   - Convert all actions to return `ActionResult<T>`
   - Update all client forms to handle field errors
   - Add global error toast for unexpected failures

3. **Add comprehensive test suite** (2 days)

   - Integration tests for all actions (½ day)
   - E2E tests for critical flows (1 day)
   - Test versioning, optimistic updates, rollbacks (½ day)

4. **Performance optimization** (½ day)

   - Add indexes (already covered)
   - Consider version counter approach
   - Add query logging to identify slow queries

---

## 7. Security Checklist

- ❌ Authentication implemented
- ❌ Authorization checks on mutations
- ❌ IDOR protection (ID validation + ownership)
- ✅ SQL injection prevented (parameterized queries)
- ⚠️ XSS prevention (shadcn sanitizes, but validate user content)
- ❌ Rate limiting on actions
- ⚠️ CSRF tokens (Next.js handles for Server Actions in production)
- ❌ Audit logging of sensitive operations

---

## 8. Final Recommendations

**Before Production:**

1. Add database indexes (blocker)
2. Implement authentication/authorization (blocker)
3. Add integration tests (blocker)
4. Structured error handling (major)

**Post-Launch:**

1. E2E test suite
2. Monitoring/logging for actions
3. Performance profiling with real data
4. Consider detail pages for projects/members

**Overall Grade: B+**

Solid architecture and good practices, but critical security and performance gaps must be addressed.

### To-dos

- [ ] Add history tables and deletedAt column to schema, generate and apply migration
- [ ] Create lib/versioning.ts with core versioning functions and types
- [ ] Update lib/queries.ts with version queries and soft-delete filters
- [ ] Update all server actions to create versions and handle soft delete
- [ ] Create version UI components (badge, history dialog, diff view, restore confirm)
- [ ] Integrate version badges and history buttons into existing list and detail components
- [ ] Update seed script to work with new schema
- [ ] Update AGENTS.md and README.md with versioning documentation