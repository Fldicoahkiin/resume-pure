import { expect, test } from '@playwright/test';

test('keeps the font search field inside the editor viewport', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('i18nextLng', 'en'));
  await page.goto('/builder/', { waitUntil: 'networkidle' });

  const editorViewport = page.locator('#builder-grid [class~="overflow-y-auto"]').first();
  const trigger = page.getByRole('button', { name: '思源黑体' });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();

  const search = page.getByPlaceholder('Search fonts...');
  await expect(search).toBeVisible();
  const [viewportBox, searchBox] = await Promise.all([
    editorViewport.boundingBox(),
    search.boundingBox(),
  ]);

  expect(viewportBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(searchBox!.y).toBeGreaterThanOrEqual(viewportBox!.y);
  expect(searchBox!.y + searchBox!.height).toBeLessThanOrEqual(viewportBox!.y + viewportBox!.height);
});
