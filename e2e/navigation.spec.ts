import { expect, test } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page redirects to projects", async ({ page }) => {
    await page.goto("/");

    // Should redirect to /projects or show projects
    await expect(page).toHaveURL(/\/(projects)?$/);
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/");

    // Navigate to Projects (use first link in sidebar)
    await page.getByRole("link", { name: /projects/i }).first().click();
    await expect(page).toHaveURL(/\/projects/);
    await expect(page.locator("h1")).toContainText("Projects");

    // Navigate to Tickets
    await page.getByRole("link", { name: /tickets/i }).click();
    await expect(page).toHaveURL(/\/tickets/);
    await expect(page.locator("h1")).toContainText("Tickets");

    // Navigate to Members
    await page.getByRole("link", { name: /members/i }).click();
    await expect(page).toHaveURL(/\/members/);
    await expect(page.locator("h1")).toContainText("Team members");
  });

  test("shows app title", async ({ page }) => {
    await page.goto("/");

    // Should see Pulseboard title in header (use role link to be specific)
    await expect(page.getByRole("link", { name: /pulseboard/i })).toBeVisible();
  });

  test("handles not found pages gracefully", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Should show 404 or not found message
    await expect(page.getByText(/not found|404/i)).toBeVisible();
  });

  test("ticket detail not found page", async ({ page }) => {
    await page.goto("/tickets/999999");

    // Should show ticket not found
    await expect(page.getByText(/ticket not found/i)).toBeVisible();

    // Should have back link
    await expect(
      page.getByRole("link", { name: /back to tickets/i })
    ).toBeVisible();
  });

  test("maintains navigation state during interactions", async ({ page }) => {
    await page.goto("/projects");

    // Open a project sheet/dialog
    const addButton = page.getByRole("button", { name: /add project/i });
    if (await addButton.count()) {
      await addButton.click();

      // Close without saving
      const cancelButton = page.getByRole("button", { name: /cancel/i });
      if (await cancelButton.count()) {
        await cancelButton.click();
      }

      // Should still be on projects page
      await expect(page).toHaveURL(/\/projects/);
    }
  });
});
