import { test, expect } from '@playwright/test';

test.describe('TradeFlow E2E Smoke & Public Portal Tests', () => {
  test('E2E-01: Landing page renders value proposition & navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TradeFlow/);
    await expect(page.locator('h1')).toContainText('Quote-to-Invoice');
    await expect(page.getByText('$39')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start 14-Day Free Trial/i }).first()).toBeVisible();
  });

  test('E2E-02: Sign in and sign up pages render responsive forms', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign In to TradeFlow/i })).toBeVisible();
    await expect(page.getByPlaceholder('dave@davesplumbing.com')).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Create TradeFlow Account/i })).toBeVisible();
    await expect(page.getByPlaceholder("Dave's Fast Plumbing")).toBeVisible();
  });

  test('E2E-03: API health endpoint returns healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });
});
