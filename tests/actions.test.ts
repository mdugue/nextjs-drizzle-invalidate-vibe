import { beforeEach, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";

// Mock next/cache before importing actions
const mockRevalidateTag = mock(() => {});
mock.module("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
  unstable_cache: (fn: unknown) => fn,
}));

import {
  createProject,
  deleteProject,
  updateProject,
} from "@/app/projects/actions";
import { db } from "@/lib/db";
import {
  PROJECT_DETAIL_TAG,
  PROJECT_LIST_TAG,
  PROJECT_VERSION_TAG,
} from "@/lib/queries";
import { projects, projectsHistory } from "@/lib/schema";

const NON_EXISTENT_ID = 999_999;

describe("Project Actions", () => {
  beforeEach(async () => {
    // Clear mock calls
    mockRevalidateTag.mockClear();
    // Clean test data
    await db.delete(projectsHistory).execute();
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

    // Verify revalidation was called with correct tag
    expect(mockRevalidateTag).toHaveBeenCalledTimes(1);
    expect(mockRevalidateTag).toHaveBeenCalledWith(PROJECT_LIST_TAG);

    const [created] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, "test-project"));

    expect(created).toBeDefined();
    expect(created.title).toBe("Test Project");
  });

  it("returns validation errors for invalid data", async () => {
    const result = await createProject({
      slug: "a", // Too short
      title: "x", // Too short
      status: "planned",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.slug).toBeDefined();
      expect(result.errors.title).toBeDefined();
    }
  });

  it("returns error for duplicate slug", async () => {
    await createProject({
      slug: "duplicate-slug",
      title: "First Project",
      status: "planned",
    });

    const result = await createProject({
      slug: "duplicate-slug",
      title: "Second Project",
      status: "planned",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.slug).toContain("already taken");
    }
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

    // Clear mock to track only update calls
    mockRevalidateTag.mockClear();

    // Update it
    const updateResult = await updateProject(project.id, {
      slug: "versioned-project",
      title: "Updated Title",
      status: "active",
      owner: "user-123",
    });

    expect(updateResult.success).toBe(true);

    // Verify all three tags were revalidated
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
    expect(mockRevalidateTag).toHaveBeenCalledWith(PROJECT_LIST_TAG);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      PROJECT_DETAIL_TAG(project.id)
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      PROJECT_VERSION_TAG(project.id)
    );

    // Check version history
    const history = await db
      .select()
      .from(projectsHistory)
      .where(eq(projectsHistory.entityId, project.id));

    expect(history).toHaveLength(1);
    expect(history[0].title).toBe("Original Title");
    expect(history[0].versionNumber).toBe(1);
  });

  it("returns error when updating non-existent project", async () => {
    const result = await updateProject(NON_EXISTENT_ID, {
      slug: "non-existent",
      title: "Non Existent",
      status: "planned",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toContain("not found");
    }
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

    // Clear mock to track only delete calls
    mockRevalidateTag.mockClear();

    const deleteResult = await deleteProject(project.id);
    expect(deleteResult.success).toBe(true);

    // Verify all three tags were revalidated
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3);
    expect(mockRevalidateTag).toHaveBeenCalledWith(PROJECT_LIST_TAG);
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      PROJECT_DETAIL_TAG(project.id)
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith(
      PROJECT_VERSION_TAG(project.id)
    );

    const [deleted] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, project.id));

    expect(deleted.deletedAt).toBeDefined();
  });

  it("creates version history on delete", async () => {
    await createProject({
      slug: "delete-with-history",
      title: "Delete Me",
      status: "planned",
    });

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, "delete-with-history"));

    await deleteProject(project.id);

    const history = await db
      .select()
      .from(projectsHistory)
      .where(eq(projectsHistory.entityId, project.id));

    expect(history).toHaveLength(1);
    expect(history[0].title).toBe("Delete Me");
  });

  it("returns error when deleting non-existent project", async () => {
    const result = await deleteProject(NON_EXISTENT_ID);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors._form).toContain("not found");
    }
  });
});
