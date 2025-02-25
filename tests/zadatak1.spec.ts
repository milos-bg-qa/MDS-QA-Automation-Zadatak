import { test, expect } from '@playwright/test';

test.describe('Login tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('https://demo.netbox.dev/');
    await page.getByRole('link', { name: 'Log In' }).click();

  });

  test('creation of new user', async ({ page }) => {
    await page.getByRole('link', { name: 'Click here' }).click();
    await page.locator('#id_username').fill('Milos');
    await page.locator('#id_password').fill('Marunic');
    await page.locator('[class="btn btn-primary w-100 mt-4"]').click();
    const toastLocator = page.locator('.toast.toast-dark');
    await expect(toastLocator.locator('.class="toast-header text-bg-success"'));
  });

  test('successfull login with valid credentials', async ({ page }) => {
    await page.locator('#id_username').fill('Milos');
    await page.locator('#id_password').fill('Marunic');
    await page.locator('[class="btn btn-primary w-100"]').click();

    await expect(page.locator('[class="navbar-nav flex-row align-items-center order-md-last"]')).toContainText('Milos');
  });

  test('should display error message with invalid username', async ({ page }) => {
    await page.locator('#id_username').fill('invalid_username');
    await page.locator('#id_password').fill('Marunic');
    await page.locator('[class="btn btn-primary w-100"]').click();

    await expect(page.locator('[class="alert alert-danger"]')).toHaveText(/Please enter a correct username and password. Note that both fields may be case-sensitive./);
  });

  test('should display error message with invalid password', async ({ page }) => {
    await page.locator('#id_username').fill('Milos');
    await page.locator('#id_password').fill('invalid_password');
    await page.locator('[class="btn btn-primary w-100"]').click();

    await expect(page.locator('[class="alert alert-danger"]')).toHaveText(/Please enter a correct username and password. Note that both fields may be case-sensitive./);
  });

  test('empty username and password fields should be red if empty', async ({ page }) => {
    await page.locator('[class="btn btn-primary w-100"]').click();

    await expect(page.locator('#id_username')).toHaveClass(/.*is-invalid.*/);
    await expect(page.locator('#id_password')).toHaveClass(/.*is-invalid.*/);
  });

  test('special characters validation', async ({ page }) => {
    await page.locator('#id_username').fill('!@#$%^&*');
    await page.locator('#id_password').fill('!@#$%^&*');
    await page.locator('[class="btn btn-primary w-100"]').click();

    await expect(page.locator('[class="alert alert-danger"]')).toHaveText(/Please enter a correct username and password. Note that both fields may be case-sensitive./);

  })

  test('empty leading and trailing spaces in username and password', async ({ page }) => {
    await page.locator('#id_username').fill('   Milos   ');
    await page.locator('#id_password').fill('   Marunic   ');
    await page.locator('[class="btn btn-primary w-100"]').click();

    await expect(page.locator('[class="alert alert-danger"]')).toHaveText(/Please enter a correct username and password. Note that both fields may be case-sensitive./);


  })

});