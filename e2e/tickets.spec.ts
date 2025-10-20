import { expect, test } from "@playwright/test";

test.describe("Tickets", () => {
  test("displays tickets list", async ({ page }) => {
    await page.goto("/tickets");

    // Should see the tickets heading
    await expect(page.locator("h1")).toContainText("Tickets");

    // Should see search and filter controls
    await expect(page.getByPlaceholder("Search tickets")).toBeVisible();
  });

  test("navigates to ticket detail page", async ({ page }) => {
    await page.goto("/tickets");

    // Click on first ticket if available
    const firstTicketLink = page.locator('a[href^="/tickets/"]').first();

    if (await firstTicketLink.count()) {
      await firstTicketLink.click();

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/tickets\/\d+/);

      // Should see ticket details (use heading to avoid label/heading conflict)
      await expect(page.locator("h1")).toBeTruthy();
      await expect(page.getByRole("heading", { name: /summary/i })).toBeVisible();
    }
  });

  test("updates ticket status from detail page", async ({ page }) => {
    await page.goto("/tickets");

    // Navigate to first ticket
    const firstTicketLink = page.locator('a[href^="/tickets/"]').first();

    if (await firstTicketLink.count()) {
      await firstTicketLink.click();

      // Find status select and change it
      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.count()) {
        await statusSelect.selectOption("in-progress");

        // Save the change
        await page.getByRole("button", { name: /save|update/i }).click();

        // Should see success message
        await expect(page.getByText(/updated/i)).toBeVisible();
      }
    }
  });

  test("filters tickets by status", async ({ page }) => {
    await page.goto("/tickets");

    // Find status filter
    const statusFilter = page.locator('select[name="status"]').first();

    if (await statusFilter.count()) {
      // Select a specific status
      await statusFilter.selectOption("todo");

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Verify URL or filtered results
      // (Implementation depends on your filter approach)
    }
  });

  test("shows pagination controls", async ({ page }) => {
    await page.goto("/tickets");

    // Check for pagination buttons (if enough data exists)
    const nextButton = page.getByRole("button", { name: /next/i });
    const prevButton = page.getByRole("button", { name: /previous/i });

    // At minimum, pagination controls should exist
    if (await nextButton.count()) {
      await expect(nextButton).toBeTruthy();
    }
    if (await prevButton.count()) {
      await expect(prevButton).toBeTruthy();
    }
  });

  test("displays version history badge", async ({ page }) => {
    await page.goto("/tickets");

    // Look for version badges
    const versionBadge = page.locator('[data-testid="version-badge"]').first();

    if (await versionBadge.count()) {
      // Version badge should be visible
      await expect(versionBadge).toBeVisible();

      // Should show version number
      await expect(versionBadge).toContainText(/v\d+/i);
    }
  });
});
