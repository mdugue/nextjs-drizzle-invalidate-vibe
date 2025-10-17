"use server";

import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { PROJECT_DETAIL_TAG, PROJECT_LIST_TAG } from "@/lib/queries";
import { projects } from "@/lib/schema";
import { type ProjectFormValues, projectFormSchema } from "@/lib/zod";

export async function createProject(values: ProjectFormValues) {
  const validated = projectFormSchema.parse(values);
  await db.insert(projects).values(validated);
  revalidateTag(PROJECT_LIST_TAG);
}

export async function updateProject(id: number, values: ProjectFormValues) {
  const validated = projectFormSchema.parse(values);
  await db.update(projects).set(validated).where(eq(projects.id, id));
  revalidateTag(PROJECT_LIST_TAG);
  revalidateTag(PROJECT_DETAIL_TAG(id));
}

export async function deleteProject(id: number) {
  await db.delete(projects).where(eq(projects.id, id));
  /* revalidateTag(PROJECT_LIST_TAG); */
  /* revalidateTag(PROJECT_DETAIL_TAG(id)); */
}
