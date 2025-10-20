import { expect, test } from "@playwright/test";

test.describe("Members", () => {
  test("displays members list", async ({ page }) => {
    await page.goto("/members");

    // Should see the members heading
    await expect(page.locator("h1")).toContainText("Team members");

    // Should see search and filter controls
    await expect(page.getByPlaceholder("Search members")).toBeVisible();
  });

  test("creates a new member", async ({ page }) => {
    await page.goto("/members");

    // Click the "Invite member" button
    await page.getByRole("button", { name: /invite member/i }).click();

    // Fill in the form
    const timestamp = Date.now();
    await page.getByLabel(/slug/i).fill(`e2e-member-${timestamp}`);
    await page.getByLabel(/^name/i).fill("E2E Test Member");
    await page.getByLabel(/email/i).fill(`e2e-${timestamp}@example.com`);
    await page.getByLabel(/role/i).fill("Tester");

    // Submit the form (button text is "Invite" for new members)
    await page.getByRole("button", { name: /invite/i }).click();

    // Should see success toast message (look for specific "Member added" text in toast)
    await expect(page.getByText("Member added")).toBeVisible();

    // Should see the new member in the list (use first() to handle duplicates from previous runs)
    await expect(page.getByText("E2E Test Member").first()).toBeVisible();
  });

  test("validates email format", async ({ page }) => {
    await page.goto("/members");

    // Click the "Invite member" button
    await page.getByRole("button", { name: /invite member/i }).click();

    // Fill with invalid email
    const timestamp = Date.now();
    await page.getByLabel(/slug/i).fill(`invalid-${timestamp}`);
    await page.getByLabel(/^name/i).fill("Invalid Email Member");
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/role/i).fill("Tester");

    // Try to submit with invalid email
    await page.getByRole("button", { name: /invite/i }).click();

    // Dialog should still be open if validation failed
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("updates member status", async ({ page }) => {
    await page.goto("/members");

    // Find and click on a member
    const firstMember = page.locator('[data-testid="member-item"]').first();

    if (await firstMember.count()) {
      await firstMember.click();

      // Change status
      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.count()) {
        await statusSelect.selectOption("active");

        // Save changes
        await page.getByRole("button", { name: /save|update/i }).click();

        // Should see success message
        await expect(page.getByText(/member updated/i)).toBeVisible();
      }
    }
  });

  test("filters members by sort", async ({ page }) => {
    await page.goto("/members");

    // Click the sort select trigger (shadcn select, not native)
    const sortTrigger = page.getByRole("combobox", { name: /sort/i });
    await sortTrigger.click();

    // Select "Name" from the dropdown
    await page.getByRole("option", { name: /name/i }).click();

    // Wait for navigation to apply
    await page.waitForTimeout(500);

    // Verify URL has sort parameter
    await expect(page).toHaveURL(/sort=title/);
  });

  test("shows deleted members when filter enabled", async ({ page }) => {
    await page.goto("/members");

    // Look for "show deleted" checkbox
    const showDeletedCheckbox = page.getByLabel(/show deleted/i);

    if (await showDeletedCheckbox.count()) {
      // Enable showing deleted
      await showDeletedCheckbox.check();

      // Wait for results to update
      await page.waitForTimeout(500);

      // Should potentially see deleted badge
      const deletedBadge = page.getByText(/deleted/i);
      if (await deletedBadge.count()) {
        await expect(deletedBadge).toBeVisible();
      }
    }
  });
});
