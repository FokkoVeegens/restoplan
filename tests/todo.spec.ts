import { test, expect } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

test("Create and delete project test", async ({ page }) => {
  await page.goto("/", { waitUntil: 'load' });

  const guid = uuidv4();
  console.log(`Creating project with name: ${guid}`);

  await page.locator('[placeholder="New Project"]').focus();
  await page.locator('[placeholder="New Project"]').type(guid);
  await page.locator('[placeholder="New Project"]').press("Enter");

  console.log(`Verifying project: ${guid}`);
  await expect(page.locator(`text=${guid}`).first()).toBeVisible();

  await page.locator('button[title="Project Actions"]').click();
  await page.locator('button[role="menuitem"]:has-text("Delete Project")').click();

  await expect(page.locator(`text=${guid}`).first()).toBeHidden();
});
