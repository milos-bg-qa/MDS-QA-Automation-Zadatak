import { test, expect } from '@playwright/test';

test.describe('Adding device to rack from graphical view', () => {
  test('First time log in', async ({ page }) => {
    await page.goto('https://demo.netbox.dev/login/?next=/dcim/racks/39/');
    await page.locator('#id_username').fill('Milos');
    await page.locator('#id_password').fill('Marunic');
    await page.locator('[class="btn btn-primary w-100"]').click();
  });

  test('Successful addition of a new device to rack', async ({ page }) => {
    // Generate unique device name
    const uniqueId = Date.now();
    const deviceName = `TestDevice-${uniqueId}`;

    // Navigate to rack page and log in
    await page.goto('https://demo.netbox.dev/dcim/racks/39/');
    await page.locator('#id_username').fill('Milos');
    await page.locator('#id_password').fill('Marunic');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.locator('[class="btn btn-primary w-100"]').click(),
    ]);
    await page.waitForLoadState('networkidle');

    // Close login success toast
    const toastHeader = page.locator('div.toast-header.text-bg-success');
    
      await toastHeader.waitFor({ state: 'visible', timeout: 5000 });
      await expect(toastHeader).toContainText('Logged in as Milos.');
      await page.locator('div.toast-header.text-bg-success button.btn-close').click();
          

    // Wait for either Front or Back rack, or both views to load their embedded content
    const frontRack = page.locator("object").nth(0);
    //const rearRack = page.locator("object").nth(1);
    async function waitForObjectToLoad(objectLocator) {
      await page.waitForFunction(
        (el) => el?.contentDocument !== null,
        await objectLocator.elementHandle()
      );
    }
    await waitForObjectToLoad(frontRack);
    //await waitForObjectToLoad(rearRack);

    // Click a random "add device" link from the embedded SVG for Front or Back rack
    async function clickAddDevice(rackObject, face) {
      const rackFrameHandle = await rackObject.evaluateHandle((el) => el.contentDocument);
      await page.waitForFunction(
        (doc) => doc?.readyState === "complete",
        rackFrameHandle
      );
      const hrefs = await rackFrameHandle.evaluate((doc, face) => {
        return Array.from(doc.querySelectorAll("a"))
          .filter(a => {
            const textMatch = a.textContent?.toLowerCase().includes("add device");
            const faceMatch = a.getAttribute("xlink:href")?.includes(`face=${face}`);
            return textMatch && faceMatch;
          })
          .map(a => a.getAttribute("xlink:href"));
      }, face);
      if (!hrefs || hrefs.length === 0) {
        throw new Error(`No "add device" links found for face: ${face}`);
      }
      const randomIndex = Math.floor(Math.random() * hrefs.length);
      const href = hrefs[randomIndex];
      await page.evaluate((url) => (window.location.href = url), href);
    }
    await clickAddDevice(frontRack, "front");
    //await clickAddDevice(backRack, "back");

    // Verify navigation to Add Device page
    await expect(page).toHaveTitle('Add a new device | NetBox');

    // Fill in the device addition form
    const uniqueName = Date.now();
    const testName = `TestDevice-${uniqueName}`;
    const nameInput = page.locator('#id_name');
    await nameInput.fill(testName);
    await page.locator('input#id_name').click();
    await page.locator('input#id_role-ts-control').click();
    await page.locator('#id_role-opt-1').click();
    await page.locator('input#id_device_type-ts-control').click();
    await page.locator('#id_device_type-opt-3').click();
    const siteInput = page.locator('input#id_site-ts-control');
    const siteValue = await siteInput.inputValue();
    if (siteValue !== "") {
      await siteInput.click();
      await page.locator('#id_site-opt-2').click();
    }
    await page.locator('button[type="submit"][name="_create"]').click();

    // Verify that a toast appears with "Created device"
    const toastHeader1 = page.locator('div.toast-header.text-bg-success');
    await toastHeader1.waitFor({ state: 'visible', timeout: 10000 });
    await expect(toastHeader1).toContainText('Created device');
  });

  test('Duplicate device validation', async ({ page }) => {
    // Navigate to rack page and log in
    await page.goto('https://demo.netbox.dev/dcim/racks/39/');
    await page.locator('#id_username').fill('Milos');
    await page.locator('#id_password').fill('Marunic');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.locator('[class="btn btn-primary w-100"]').click(),
    ]);
    await page.waitForLoadState('networkidle');

    // Close login toast if present
    const toastHeader = page.locator('div.toast-header.text-bg-success');
    if (await toastHeader.isVisible()) {
      await toastHeader.waitFor({ state: 'visible', timeout: 5000 });
      await expect(toastHeader).toContainText('Logged in as Milos.');
      await page.locator('div.toast-header.text-bg-success button.btn-close').click();
    }

    // Wait for embedded Front and Rear rack views to load
    const frontRack1 = page.locator("object").nth(0);
    //const rearRack1 = page.locator("object").nth(1);
    async function waitForObjectToLoad(objectLocator) {
      await page.waitForFunction(
        (el) => el?.contentDocument !== null,
        await objectLocator.elementHandle()
      );
    }
    await waitForObjectToLoad(frontRack1);
    //await waitForObjectToLoad(rearRack1);

    // Reuse clickAddDevice to navigate to Add Device page for Front and Rear rack
    async function clickAddDevice(rackObject, face) {
      const rackFrameHandle = await rackObject.evaluateHandle((el) => el.contentDocument);
      await page.waitForFunction(
        (doc) => doc?.readyState === "complete",
        rackFrameHandle
      );
      const hrefs = await rackFrameHandle.evaluate((doc, face) => {
        return Array.from(doc.querySelectorAll("a"))
          .filter(a => {
            const textMatch = a.textContent?.toLowerCase().includes("add device");
            const faceMatch = a.getAttribute("xlink:href")?.includes(`face=${face}`);
            return textMatch && faceMatch;
          })
          .map(a => a.getAttribute("xlink:href"));
      }, face);
      const randomIndex = Math.floor(Math.random() * hrefs.length);
      const href = hrefs[randomIndex];
      await page.evaluate((url) => (window.location.href = url), href);
    }
    await clickAddDevice(frontRack1, "front");
    //await clickAddDevice(rearRack1, "rear");
    await expect(page).toHaveTitle('Add a new device | NetBox');

    // Create a device with a unique name
    const uniqueName = `TestDevice-${Date.now()}`;
    const nameInput = page.locator('#id_name');
    await nameInput.fill(uniqueName);
    await page.locator('input#id_role-ts-control').click();
    await page.locator('#id_role-opt-1').click();
    await page.locator('input#id_device_type-ts-control').click();
    await page.locator('#id_device_type-opt-3').click();
    const siteInput = page.locator('input#id_site-ts-control');
    if ((await siteInput.inputValue()) !== "") {
      await siteInput.click();
      await page.locator('#id_site-opt-2').click();
    }
    await page.locator('button[type="submit"][name="_create"]').click();

    // Verify success toast appears for creation
    const toastHeader2 = page.locator('div.toast-header.text-bg-success');
    await expect(toastHeader2).toBeVisible({ timeout: 10000 });
    await expect(toastHeader2).toContainText('Created device');

    // Attempt to create the same device again to trigger duplicate error
    await page.goto('https://demo.netbox.dev/dcim/racks/39/');
    const frontRack = page.locator("object").nth(0);
    //const rearRack = page.locator("object").nth(1);
    await clickAddDevice(frontRack, "front");
    //await clickAddDevice(rearRack, "rear");
    await page.locator('#id_name').fill(uniqueName);
    await page.locator('input#id_role-ts-control').click();
    await page.locator('#id_role-opt-1').click();
    await page.locator('input#id_device_type-ts-control').click();
    await page.locator('#id_device_type-opt-3').click();
    if ((await siteInput.inputValue()) !== "") {
      await siteInput.click();
      await page.locator('#id_site-opt-2').click();
    }
    await page.locator('button[type="submit"][name="_create"]').click();

    // Assert that an error message appears for duplicate device
    const duplicateError = page.locator('.errorlist');
    await expect(duplicateError).toBeVisible({ timeout: 5000 });
    await expect(duplicateError).toContainText('Device name must be unique per site.');
  });
});