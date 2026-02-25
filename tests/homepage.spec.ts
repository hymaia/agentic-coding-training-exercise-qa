import { test, expect } from '@playwright/test';

test('minimal bootstrap navigation of leboncoin homepage', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();
  await expect(page).toHaveURL(/leboncoin\.fr/);
});
