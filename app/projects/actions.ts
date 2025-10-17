"use server";

import { eq, max } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import {
  PROJECT_DETAIL_TAG,
  PROJECT_LIST_TAG,
  PROJECT_VERSION_TAG,
} from "@/lib/queries";
import { projects, projectsHistory } from "@/lib/schema";
import {
  compareProjectVersions,
  getProjectVersions,
  restoreProjectVersion,
} from "@/lib/versioning";
import { type ProjectFormValues, projectFormSchema } from "@/lib/zod";

export async function createProject(values: ProjectFormValues) {
  const validated = projectFormSchema.parse(values);
  await db.insert(projects).values(validated);
  revalidateTag(PROJECT_LIST_TAG);
}

export async function updateProject(id: number, values: ProjectFormValues) {
  const validated = projectFormSchema.parse(values);

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (current) {
      const versionNumber =
        (await tx
          .select({ max: max(projectsHistory.versionNumber) })
          .from(projectsHistory)
          .where(eq(projectsHistory.entityId, id))
          .limit(1)
          .then((r) => r[0]?.max)) ?? 0;

      await tx.insert(projectsHistory).values({
        entityId: id,
        versionNumber: versionNumber + 1,
        changedAt: new Date(),
        slug: current.slug,
        title: current.title,
        description: current.description ?? null,
        status: current.status,
        owner: current.owner ?? null,
        createdAt: current.createdAt,
      });
    }

    await tx.update(projects).set(validated).where(eq(projects.id, id));
  });

  revalidateTag(PROJECT_LIST_TAG);
  revalidateTag(PROJECT_DETAIL_TAG(id));
  revalidateTag(PROJECT_VERSION_TAG(id));
}

export async function deleteProject(id: number) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (current) {
      const versionNumber =
        (await tx
          .select({ max: max(projectsHistory.versionNumber) })
          .from(projectsHistory)
          .where(eq(projectsHistory.entityId, id))
          .limit(1)
          .then((r) => r[0]?.max)) ?? 0;

      await tx.insert(projectsHistory).values({
        entityId: id,
        versionNumber: versionNumber + 1,
        changedAt: new Date(),
        slug: current.slug,
        title: current.title,
        description: current.description ?? null,
        status: current.status,
        owner: current.owner ?? null,
        createdAt: current.createdAt,
      });
    }

    await tx
      .update(projects)
      .set({ deletedAt: new Date() })
      .where(eq(projects.id, id));
  });

  revalidateTag(PROJECT_LIST_TAG);
  revalidateTag(PROJECT_DETAIL_TAG(id));
  revalidateTag(PROJECT_VERSION_TAG(id));
}

export async function restoreProject(id: number, versionNumber: number) {
  await restoreProjectVersion(id, versionNumber);
  revalidateTag(PROJECT_LIST_TAG);
  revalidateTag(PROJECT_DETAIL_TAG(id));
  revalidateTag(PROJECT_VERSION_TAG(id));
}

export async function getProjectVersionHistory(id: number) {
  return await getProjectVersions(id);
}

export async function getProjectVersionDiff(
  id: number,
  fromVersion: number,
  toVersion: number
) {
  return await compareProjectVersions(id, fromVersion, toVersion);
}
