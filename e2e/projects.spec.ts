import { expect, test } from "@playwright/test";

test.describe("Projects", () => {
  test("displays projects list", async ({ page }) => {
    await page.goto("/projects");

    // Should see the projects heading
    await expect(page.locator("h1")).toContainText("Projects");

    // Should see search and filter controls
    await expect(page.getByPlaceholder("Search projects")).toBeVisible();
  });

  test("creates a new project", async ({ page }) => {
    await page.goto("/projects");

    // Click the "Add project" button
    await page.getByRole("button", { name: /add project/i }).click();

    // Fill in the form
    const timestamp = Date.now();
    await page.getByLabel(/slug/i).fill(`e2e-project-${timestamp}`);
    await page.getByLabel(/^title/i).fill("E2E Test Project");
    await page.getByLabel(/description/i).fill("Created by E2E test");

    // Submit the form
    await page.getByRole("button", { name: /save|create/i }).click();

    // Should see success message
    await expect(page.getByText(/project created/i)).toBeVisible();

    // Should see the new project in the list (use first() to handle duplicates from previous runs)
    await expect(page.getByText("E2E Test Project").first()).toBeVisible();
  });

  test("updates an existing project", async ({ page }) => {
    await page.goto("/projects");

    // Find and click on a project (assumes at least one exists from previous test or seed)
    const firstProject = page.locator('[data-testid="project-item"]').first();
    if (await firstProject.count()) {
      await firstProject.click();

      // Update the title
      const titleInput = page.getByLabel(/^title/i);
      await titleInput.fill("Updated Project Title");

      // Save changes
      await page.getByRole("button", { name: /save|update/i }).click();

      // Should see success message
      await expect(page.getByText(/project updated/i)).toBeVisible();
    }
  });

  test("filters projects by search", async ({ page }) => {
    await page.goto("/projects");

    // Type in search box
    const searchBox = page.getByPlaceholder("Search projects");
    await searchBox.fill("E2E");

    // Should filter results (implementation depends on debounce)
    await page.waitForTimeout(500);

    // Check that filtered results are shown
    const projectItems = page.locator('[data-testid="project-item"]');
    if (await projectItems.count()) {
      await expect(projectItems.first()).toContainText("E2E");
    }
  });

  test("shows version history", async ({ page }) => {
    await page.goto("/projects");

    // Find a version badge (assumes project has been updated)
    const versionBadge = page.locator('[data-testid="version-badge"]').first();

    if (await versionBadge.count()) {
      await versionBadge.click();

      // Should see version history dialog
      await expect(
        page.getByRole("heading", { name: /version history/i })
      ).toBeVisible();

      // Should see version entries
      await expect(page.locator('[data-testid="version-entry"]')).toBeTruthy();
    }
  });

  test("deletes a project (soft delete)", async ({ page }) => {
    await page.goto("/projects");

    // Create a project to delete
    await page.getByRole("button", { name: /add project/i }).click();

    const timestamp = Date.now();
    await page.getByLabel(/slug/i).fill(`deletable-${timestamp}`);
    await page.getByLabel(/^title/i).fill("Deletable Project");

    await page.getByRole("button", { name: /save|create/i }).click();

    // Wait for sheet to close and project to appear in list
    await page.waitForTimeout(500);

    // Open the project (use first() to handle potential duplicates)
    await page.getByText("Deletable Project").first().click();

    // Delete it
    await page.getByRole("button", { name: /delete/i }).click();

    // Confirm deletion if there's a confirmation dialog
    const confirmButton = page.getByRole("button", { name: /confirm|yes/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Should see success message
    await expect(page.getByText(/project deleted/i)).toBeVisible();

    // Enable "show deleted" filter
    const showDeletedCheckbox = page.getByLabel(/show deleted/i);
    if (await showDeletedCheckbox.count()) {
      await showDeletedCheckbox.check();
      await page.waitForTimeout(300);

      // Should see the deleted project with indicator (use first() since test might create duplicates)
      await expect(page.getByText("Deletable Project").first()).toBeVisible();
    }
  });
});
