import { test, expect } from '@playwright/test';

test.describe('Creating device type tests', () => {

    // Login before each test
    test.beforeEach(async ({ page }) => {
        await page.goto('https://demo.netbox.dev/login/?next=/');
        await page.locator('#id_username').fill('Milos');
        await page.locator('#id_password').fill('Marunic');
        await page.locator('[class="btn btn-primary w-100"]').click();
        // Verify login via toast message
        const toastLocator = page.locator('.toast.toast-dark');
        await expect(toastLocator.locator('.toast-body')).toContainText('Logged in as Milos.', { timeout: 10000 });
    });

    test('Successfull creation of device', async ({ page }) => {
        await page.goto('https://demo.netbox.dev/dcim/device-types/add/');
        const uniqueId = Date.now();
        const modelName = `TestModel-${uniqueId}`;
        const slugName = `TestSlug-${uniqueId}`;
        await page.locator('#id_manufacturer-ts-control').click();
        await page.locator('#id_manufacturer-opt-1').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator(`[data-value="11"]`).click();
        await page.fill('#id_model', modelName);
        await page.fill('#id_slug', slugName);
        await page.fill('#id_u_height', '2');
        await page.click('button[name="_create"]');

        // Wait for toast and verify its text
        const toastLocator = page.locator('.toast.toast-dark');
        await toastLocator.waitFor({ state: 'visible', timeout: 5000 });
        const toastBodyLocator = toastLocator.locator('.toast-body');
        await toastBodyLocator.waitFor({ state: 'visible', timeout: 5000 });
        await expect(toastBodyLocator).toContainText('Created device type ', { timeout: 5000 });
        await toastLocator.locator('.btn-close').click();
    });

    test('Checking empty fields validation', async ({ page }) => {
        await page.goto('https://demo.netbox.dev/dcim/device-types/add/');

        // Manufacturer is a dropdown so no validation error is expected
        await page.fill('#id_model', '');
        await page.fill('#id_slug', '');
        await page.fill('#id_u_height', '');
        await page.click('button[name="_create"]');

        await expect(page.locator('#id_manufacturer-ts-control')).not.toHaveClass(/is-invalid/);
        await expect(page.locator('#id_model')).toHaveClass(/is-invalid/);
        await expect(page.locator('#id_model + .invalid-feedback')).toHaveText('This field is required.');
        await expect(page.locator('#id_slug')).toHaveClass(/is-invalid/);
        await expect(page.locator('#id_u_height')).toHaveClass(/is-invalid/);
        await expect(page.locator('#id_u_height + .invalid-feedback')).toHaveText('This field is required.');
    });

    test('Attempt to create a device type with an invalid U height (negative value)', async ({ page }) => {
        const uniqueId = Date.now();
        const modelName = `TestModel-${uniqueId}`;
        const slugName = `TestSlug-${uniqueId}`;

        await page.goto('https://demo.netbox.dev/dcim/device-types/add/');
        await page.locator('#id_manufacturer-ts-control').click();
        await page.locator('#id_manufacturer-opt-1').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator(`[data-value="11"]`).click();
        await page.fill('#id_model', modelName);
        await page.fill('#id_slug', slugName);
        await page.fill('#id_u_height', '-1');
        await page.click('button[name="_create"]');

        // Wait for table to load and assert that the device type is present
        await page.waitForSelector('table', { timeout: 10000 });
        await expect(page.locator('table')).toContainText(modelName);
    });

    test('Attempt to create a device type with an invalid U height (entering 0 as a number)', async ({ page }) => {
        const uniqueId = Date.now();
        const modelName = `TestModel-${uniqueId}`;
        const slugName = `TestSlug-${uniqueId}`;

        await page.goto('https://demo.netbox.dev/dcim/device-types/add/');
        await page.locator('#id_manufacturer-ts-control').click();
        await page.locator('#id_manufacturer-opt-1').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator(`[data-value="11"]`).click();
        await page.fill('#id_model', modelName);
        await page.fill('#id_slug', slugName);
        await page.fill('#id_u_height', '0');
        await page.click('button[name="_create"]');

        const toastLocator = page.locator('.toast.toast-dark');
        await toastLocator.waitFor({ state: 'visible', timeout: 5000 });
        await toastLocator.locator('.btn-close').click();

        await page.waitForSelector('table', { timeout: 10000 });
        await expect(page.locator('table')).toContainText(modelName);
    });

    test('Creation of a duplicate device type', async ({ page }) => {
        const uniqueId = Date.now();
        const modelName = `DuplicateTestModel-${uniqueId}`;
        const slugName = `DuplicateTestSlug-${uniqueId}`;

        // Create the device type for the first time
        await page.goto('https://demo.netbox.dev/dcim/device-types/add/');
        await page.locator('#id_manufacturer-ts-control').click();
        await page.locator('#id_manufacturer-opt-1').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator(`[data-value="11"]`).click();
        await page.fill('#id_model', modelName);
        await page.fill('#id_slug', slugName);
        await page.fill('#id_u_height', '2');
        await page.click('button[name="_create"]');

        let toastLocator = page.locator('.toast.toast-dark');
        await toastLocator.waitFor({ state: 'visible', timeout: 5000 });
        await toastLocator.locator('.btn-close').click();

        // Attempt to create the same device type again
        await page.goto('https://demo.netbox.dev/dcim/device-types/add/');
        await page.locator('#id_manufacturer-ts-control').click();
        await page.locator('#id_manufacturer-opt-1').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator(`[data-value="11"]`).click();
        await page.fill('#id_model', modelName);
        await page.fill('#id_slug', slugName);
        await page.fill('#id_u_height', '2');
        await page.click('button[name="_create"]');

        const duplicateToasts = page.locator('.toast.toast-dark .toast-body');
        await expect(duplicateToasts).toHaveCount(2, { timeout: 10000 });
        const toastTexts = await duplicateToasts.allTextContents();

        expect(toastTexts.some(text => text.includes("Device type with this Manufacturer and Model already exists."))).toBeTruthy();
        expect(toastTexts.some(text => text.includes("Device type with this Manufacturer and Slug already exists."))).toBeTruthy();
    });

});