import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { createServer } from 'vite';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-controlled-fields-observation.json' with { type: 'json' };

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-controlled-fields');
  await expect(page.locator('#controlled-title')).toHaveValue(observation.cases.initial.title);
}

async function readSnapshot(page: Page) {
  return page.evaluate(() => {
    const model = document.querySelector('output[aria-label="Controlled fields state"]')?.textContent;
    const title = document.querySelector<HTMLInputElement>('#controlled-title');
    const email = document.querySelector<HTMLInputElement>('#controlled-email');
    const late = document.querySelector<HTMLInputElement>('#controlled-late');

    return { ...JSON.parse(model ?? ''), title: title?.value, email: email?.value,
      late: late?.value ?? { missing: true } };
  });
}

test('Form fields replaces values and metadata without callbacks when external records change', async ({ page }) => {
  await openFixture(page);
  const title = page.locator('#controlled-title');
  const email = page.locator('#controlled-email');
  await expect(email).toHaveAccessibleDescription('Server error Server warning');
  expect(await page.locator('form[name="controlled"]').getAttribute('fields')).toBeNull();
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.initial);

  await title.fill('User edit');
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.edit);
  const original = await title.elementHandle();

  await page.getByRole('button', { name: 'Reuse records' }).dispatchEvent('click');
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.sameRecords);
  await page.getByRole('button', { name: 'Replace records' }).dispatchEvent('click');
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.freshRecords);
  await expect(title).toBeFocused();
  expect(await title.evaluate((input, previous) => input === previous, original)).toBe(true);

  await page.getByRole('button', { name: 'Patch records' }).click();
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.patch);
  await expect(email).toHaveAccessibleDescription('New warning');
  await page.getByRole('button', { name: 'Remove records' }).click();
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.drop);
  await page.getByRole('button', { name: 'Mount late field' }).click();
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.mountLate);
  await page.getByRole('button', { name: 'Apply sparse records' }).click();
  await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.sparse);
  await expect(email).toHaveAccessibleDescription('Sparse error');
});

test('Form fields keeps a running validator when the owner feeds back allFields', async ({ page }) => {
  await openFixture(page);
  const echo = page.locator('#echo-value');
  const output = page.getByLabel('Echo state', { exact: true });
  const readEcho = async () => JSON.parse((await output.textContent()) ?? '');
  await expect.poll(readEcho).toEqual(observation.cases.echoInitial);

  await echo.fill('Candidate');
  await expect.poll(readEcho).toEqual(observation.cases.echoPending);
  await page.getByRole('button', { name: 'Complete first validation' }).click();
  await expect.poll(readEcho).toEqual(observation.cases.echoComplete);
  await expect(echo).toHaveAccessibleDescription('Rejected by validator');

  await echo.fill('Old candidate');
  await expect.poll(readEcho).toEqual(observation.cases.echoSecondPending);
  await page.getByRole('button', { name: 'Override pending field' }).click();
  await expect.poll(readEcho).toEqual(observation.cases.echoOverride);
  await page.getByRole('button', { name: 'Complete obsolete validation' }).click();
  await expect(page.getByLabel('Completed validators')).toHaveText('[0,1]');

  // The source callback reapplies the obsolete error. Our model keeps the external override.
  expect(observation.cases.echoStaleCompletion.meta.errors).toEqual(['Too late']);
  await expect.poll(readEcho).toEqual(observation.cases.echoOverride);
  await expect(echo).toHaveValue('External replacement');
  await expect(echo).toHaveAccessibleDescription('External message');
});

test('Form fields follows deep reactive edits, model replacement and values read from the model', async ({ page }) => {
  await openFixture(page);
  const title = page.locator('#controlled-title');
  const email = page.locator('#controlled-email');

  await page.getByRole('button', { name: 'Mutate a record in place' }).click();
  await expect(title).toHaveValue('External mutation');
  await expect(email).toHaveAccessibleDescription('Mutated error Server warning');

  await title.fill('Draft in old model');
  const original = await title.elementHandle();
  await page.getByRole('button', { name: 'Switch controlled model' }).dispatchEvent('click');
  await expect(title).toHaveValue('External mutation');
  await expect(email).toHaveAccessibleDescription('Mutated error Server warning');
  await expect(page.getByLabel('Inactive model title')).toHaveText('Draft in old model');
  await expect(title).toBeFocused();
  expect(await title.evaluate((input, previous) => input === previous, original)).toBe(true);

  await page.getByRole('button', { name: 'Use a value from the store' }).click();
  await expect(email).toHaveValue('From the model');
  await email.fill('Changed again');
  await expect.poll(() => readSnapshot(page)).toMatchObject({
    values: { profile: { email: 'Changed again' } }, email: 'Changed again'
  });
});

test('Form fields applies external data after strict hydration without replacing the server editor', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-controlled-fields-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixturePath = fileURLToPath(new URL(
      '../fixtures/form-controlled-fields-hydration.server.ts', import.meta.url
    ));
    const { renderControlledFields } = await server.ssrLoadModule(fixturePath);
    const { head, body } = renderControlledFields();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      const root = document.getElementById('root');
      if (!root) {
        throw new Error('The hydration host is missing');
      }
      root.innerHTML = body;
    }, { head, body });
    const title = page.locator('#controlled-title');
    await expect(title).toHaveValue(observation.ssr.title);
    await title.focus();

    await page.addScriptTag({ type: 'module', url: '/form-controlled-fields-hydration.client.ts' });
    await page.waitForFunction(() => window.controlledFieldsHydration !== undefined);
    await expect(title).toBeFocused();
    expect(await title.evaluate(node => node === window.controlledFieldsHydration?.input)).toBe(true);
    await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.initial);

    await title.fill('User edit');
    await expect.poll(() => readSnapshot(page)).toEqual(observation.cases.edit);
    await page.evaluate(() => window.controlledFieldsHydration?.dispose());
    await expect(page.locator('form')).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
