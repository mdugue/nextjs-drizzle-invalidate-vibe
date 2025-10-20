// Placeholder auth helpers - integrate with your auth provider (Clerk, Auth.js, etc.)

/**
 * Gets the current user ID from the session/token
 * @returns The user ID or null if not authenticated
 */
export function getCurrentUserId(): Promise<string | null> {
  // TODO: Replace with real implementation
  // Example with Next-Auth:
  // const session = await getServerSession(authOptions);
  // return session?.user?.id ?? null;

  // Example with Clerk:
  // const { userId } = await auth();
  // return userId;

  return Promise.resolve(null);
}

/**
 * Asserts that a user is authenticated and returns their ID
 * @throws Error if user is not authenticated
 * @returns The authenticated user ID
 */
export async function assertAuthenticated(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
}

/**
 * Asserts that the current user owns the specified entity
 * @param entity - The entity to check ownership of
 * @param userId - The current user's ID
 * @throws Error if user doesn't own the entity
 */
export function assertOwnership(
  entity: { owner?: string | null },
  userId: string
): void {
  if (entity.owner && entity.owner !== userId) {
    throw new Error("Forbidden: You don't own this resource");
  }
}
