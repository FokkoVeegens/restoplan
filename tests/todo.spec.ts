import { test, expect } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

test.beforeAll(async () => {
  // These UI tests run without sign-in (Phase 4 adds the authenticated flow).
  // The API must be started with auth disabled, e.g.:
  //   dotnet run --DisableAuth=true   (or set "DisableAuth": true in appsettings.Development.json)
  // Fail fast with a clear message if the API is enforcing auth.
  const apiBase = process.env.VITE_API_BASE_URL || "http://localhost:3100";
  const response = await fetch(`${apiBase}/projects`);
  if (response.status === 401) {
    throw new Error(
      `API at ${apiBase} requires authentication. Start it with DisableAuth=true for UI tests (see docs/PHASE2_API_AUTH.md).`
    );
  }
});

test("Create and delete project test", async ({ page }) => {
  await page.goto("/", { waitUntil: 'load' });

  const guid = uuidv4();
  console.log(`Creating project with name: ${guid}`);

  await page.locator('[placeholder="New Project"]').focus();
  await page.locator('[placeholder="New Project"]').type(guid);
  await page.locator('[placeholder="New Project"]').press("Enter");

  console.log(`Verifying project: ${guid}`);
  await expect(page.locator(`text=${guid}`).first()).toBeVisible();

  await page.waitForURL(/\/projects\//);
  const actionsButton = page.locator('button[title="Project Actions"]');
  await expect(actionsButton).toBeEnabled();
  await actionsButton.click();
  await page.locator('button[role="menuitem"]:has-text("Delete Project")').click();

  await expect(page.locator(`text=${guid}`).first()).toBeHidden();
});
