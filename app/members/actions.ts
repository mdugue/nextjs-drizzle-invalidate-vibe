"use server";

import { eq, max } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import {
  MEMBER_DETAIL_TAG,
  MEMBER_LIST_TAG,
  MEMBER_VERSION_TAG,
} from "@/lib/queries";
import { members, membersHistory } from "@/lib/schema";
import {
  compareMemberVersions,
  getMemberVersions,
  restoreMemberVersion,
} from "@/lib/versioning";
import { type MemberFormValues, memberFormSchema } from "@/lib/zod";

export async function createMember(values: MemberFormValues) {
  const validated = memberFormSchema.parse(values);
  await db.insert(members).values(validated);
  revalidateTag(MEMBER_LIST_TAG);
}

export async function updateMember(id: number, values: MemberFormValues) {
  const validated = memberFormSchema.parse(values);

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);

    if (current) {
      const versionNumber =
        (await tx
          .select({ max: max(membersHistory.versionNumber) })
          .from(membersHistory)
          .where(eq(membersHistory.entityId, id))
          .limit(1)
          .then((r) => r[0]?.max)) ?? 0;

      await tx.insert(membersHistory).values({
        entityId: id,
        versionNumber: versionNumber + 1,
        changedAt: new Date(),
        slug: current.slug,
        email: current.email,
        name: current.name,
        status: current.status,
        bio: current.bio ?? null,
        role: current.role ?? null,
        createdAt: current.createdAt,
      });
    }

    await tx.update(members).set(validated).where(eq(members.id, id));
  });

  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
  revalidateTag(MEMBER_VERSION_TAG(id));
}

export async function deleteMember(id: number) {
  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(members)
      .where(eq(members.id, id))
      .limit(1);

    if (current) {
      const versionNumber =
        (await tx
          .select({ max: max(membersHistory.versionNumber) })
          .from(membersHistory)
          .where(eq(membersHistory.entityId, id))
          .limit(1)
          .then((r) => r[0]?.max)) ?? 0;

      await tx.insert(membersHistory).values({
        entityId: id,
        versionNumber: versionNumber + 1,
        changedAt: new Date(),
        slug: current.slug,
        email: current.email,
        name: current.name,
        status: current.status,
        bio: current.bio ?? null,
        role: current.role ?? null,
        createdAt: current.createdAt,
      });
    }

    await tx
      .update(members)
      .set({ deletedAt: new Date() })
      .where(eq(members.id, id));
  });

  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
  revalidateTag(MEMBER_VERSION_TAG(id));
}

export async function restoreMember(id: number, versionNumber: number) {
  await restoreMemberVersion(id, versionNumber);
  revalidateTag(MEMBER_LIST_TAG);
  revalidateTag(MEMBER_DETAIL_TAG(id));
  revalidateTag(MEMBER_VERSION_TAG(id));
}

export async function getMemberVersionHistory(id: number) {
  return await getMemberVersions(id);
}

export async function getMemberVersionDiff(
  id: number,
  fromVersion: number,
  toVersion: number
) {
  return await compareMemberVersions(id, fromVersion, toVersion);
}
