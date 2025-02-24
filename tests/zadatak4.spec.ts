import { test, expect } from '@playwright/test';

// Function to delete a device type
async function deleteDeviceType(page) {
    // Navigate to the user's profile page
    await page.goto('https://demo.netbox.dev/user/profile/');

    // Locate and click the first active device type link
    const activeDeviceType = page.locator('.table.table-hover.object-list tbody tr:has(td .badge.text-bg-green) td:nth-child(6) a').first();
    await activeDeviceType.waitFor({ state: 'visible', timeout: 60000 });
    if (await activeDeviceType.isVisible()) {
        await activeDeviceType.click();
    }

    // Click the delete button and confirm deletion in the modal
    const deleteButton = page.locator('a.btn.btn-red:has-text("Delete")');
    await deleteButton.waitFor({ state: 'visible', timeout: 60000 });
    await deleteButton.click();
    await expect(page.locator('h5.modal-title')).toHaveText('Confirm Deletion', { timeout: 60000 });
    const confirmButton = page.locator('button.btn.btn-danger:has-text("Delete")');
    await confirmButton.waitFor({ state: 'visible', timeout: 60000 });
    await confirmButton.click();

    // Wait for navigation back to the device types page and verify toast message
    await page.waitForURL('https://demo.netbox.dev/dcim/device-types/', { timeout: 60000 });
    await expect(page.locator('.toast-header.text-bg-success')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('.toast-body')).toHaveText(/Deleted device type/, { timeout: 60000 });
}

test.beforeEach(async ({ page }) => {
    await page.goto('https://demo.netbox.dev/login/?next=/');
    await page.locator('#id_username').fill('Milos');
    await page.locator('#id_password').fill('Marunic');
    await page.locator('[class="btn btn-primary w-100"]').click();
});

test.describe('Device Type Deletion Flow', () => {
    test('Click on a device type from the object column and assert title', async ({ page }) => {
        await page.goto('https://demo.netbox.dev/user/profile/');
        const objectLink = page.locator('.table.table-hover.object-list tbody tr:has(td .badge.text-bg-green) td:nth-child(6) a').first();
        await objectLink.waitFor({ state: 'visible', timeout: 60000 });
        if (await objectLink.isVisible()) {
            const deviceTypeName = await objectLink.innerText();
            await objectLink.click();
            await expect(page).toHaveTitle(new RegExp(deviceTypeName, 'i'), { timeout: 60000 });
        } else {
            throw new Error('No active device type found to click');
        }
    });

    test('Verify delete modal appears when delete button is clicked', async ({ page }) => {
        await deleteDeviceType(page);
    });

    test('Cancel deletion and verify user remains on the same page', async ({ page }) => {
        await page.goto('https://demo.netbox.dev/user/profile/');
        const activeDeviceType = page.locator('.table.table-hover.object-list tbody tr:has(td .badge.text-bg-green) td:nth-child(6) a').first();
        await activeDeviceType.waitFor({ state: 'visible', timeout: 60000 });
        if (await activeDeviceType.isVisible()) {
            await activeDeviceType.click();
        } else {
            throw new Error('No active device type found to click');
        }
        await page.locator('a.btn.btn-red:has-text("Delete")').click();
        // Cancel deletion
        await page.locator('button.btn.btn-outline-secondary:has-text("Cancel")').click();
    });

    test('Verify successful deletion and toast message', async ({ page }) => {
        await page.goto('https://demo.netbox.dev/user/profile/');
        await deleteDeviceType(page);
    });
});