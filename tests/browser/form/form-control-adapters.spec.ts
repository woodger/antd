import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { createServer } from 'vite';
import { test, expect } from '../test';
import observation from '../fixtures/ant-design-form-control-adapters-observation.json' with { type: 'json' };

async function openFixture(page: Page) {
  await page.goto('/?fixture=form-control-adapters');
  await expect(page.locator('#adapter-code')).toHaveValue(observation.ssr.code);
}

async function readAdapterState(page: Page) {
  return page.evaluate(() => {
    const state = document.getElementById('adapter-state')?.textContent;
    const code = document.querySelector<HTMLInputElement>('#adapter-code');
    const checkbox = document.querySelector<HTMLInputElement>('#adapter-checkbox');
    const amount = document.getElementById('amount-shown');

    return {
      ...JSON.parse(state ?? ''),
      code: code?.value,
      checkbox: checkbox?.checked,
      amount: amount?.textContent,
      mapped: code?.getAttribute('data-mapped')
    };
  });
}

async function compareAndClear(page: Page, stage: keyof typeof observation.cases) {
  await expect.poll(() => readAdapterState(page), { message: stage }).toEqual(observation.cases[stage]);
  await page.locator('#adapter-clear').dispatchEvent('click');
}

test('FormItem maps editor props and separates extraction, writes and validation', async ({ page }) => {
  await openFixture(page);
  const code = page.locator('#adapter-code');
  const checkbox = page.locator('#adapter-checkbox');
  await expect(code).toHaveAttribute('data-mapped', observation.ssr.mapped);
  expect(await page.locator('#amount-shown').getAttribute('data-amount')).toBeNull();
  await compareAndClear(page, 'initial');

  const original = await code.elementHandle();
  await code.fill('  seed  ');
  await compareAndClear(page, 'sameAfterNormalize');
  await expect(code).toBeFocused();
  expect(await code.evaluate((node, prior) => node === prior, original)).toBe(true);
  await code.fill('  bad  ');
  await compareAndClear(page, 'invalid');
  await expect(code).toHaveAccessibleDescription('Invalid code');

  await checkbox.click();
  await compareAndClear(page, 'checked');
  await checkbox.click();
  await compareAndClear(page, 'unchecked');
  await page.locator('#preview').click();
  await compareAndClear(page, 'ignoredTrigger');
  await page.locator('#commit').click();
  await compareAndClear(page, 'customTrigger');
  await page.locator('#check').click();
  await compareAndClear(page, 'customValidation');
  await page.locator('#adapter-set').click();
  await compareAndClear(page, 'programmatic');
  await page.locator('#adapter-reset').click();
  await compareAndClear(page, 'reset');
});

test('FormItem uses the emitting editor for a shared path and drops its dispatcher when unmounted', async ({ page }) => {
  await openFixture(page);
  const left = page.locator('#left');
  const right = page.locator('#right');
  const state = page.locator('#adapter-pair-data');

  const snapshot = async () => ({
    ...JSON.parse((await state.textContent()) ?? ''),
    left: await left.inputValue(),
    right: await right.inputValue()
  });

  await right.fill('x');
  await expect.poll(snapshot).toEqual(observation.pair.right);
  await left.fill('y');
  await expect.poll(snapshot).toEqual(observation.pair.left);

  await page.getByRole('button', { name: 'Remove right editor' }).click();
  await expect(right).toHaveCount(0);
  await page.getByRole('button', { name: 'Dispatch from removed editor' }).click();

  await expect(left).toHaveValue(observation.pair.left.left);
  expect(JSON.parse((await state.textContent()) ?? '')).toEqual({
    value: observation.pair.left.value, validators: observation.pair.left.validators
  });
});

test('FormItem normalizes explicit model edits and dispatches a forwarded blur once', async ({ page }) => {
  await openFixture(page);
  const manual = page.locator('#adapter-manual');
  await manual.fill('NEW');
  await expect(manual).toHaveValue('new');
  await expect(page.locator('#adapter-manual-value')).toHaveText('new');

  const blur = page.locator('#adapter-blur');
  await blur.fill('updated');
  await expect(page.locator('#adapter-blur-checks')).toHaveText('0');
  await blur.press('Tab');

  await expect(page.locator('#adapter-blur-checks')).toHaveText('1');
});

test('FormItem adapters hydrate their mapped server editor and normalize its first edit', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-form-adapter-hydration-'));
  const server = await createServer({
    appType: 'custom', cacheDir,
    configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
    server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null }
  });

  try {
    const fixturePath = fileURLToPath(new URL(
      '../fixtures/form-control-adapters-hydration.server.ts', import.meta.url
    ));
    const { renderFormControlAdapters } = await server.ssrLoadModule(fixturePath);
    const { head, body } = renderFormControlAdapters();
    await page.goto('/tree-select-surface-hydration.html');
    await page.evaluate(({ head, body }) => {
      document.head.insertAdjacentHTML('beforeend', head);
      const target = document.getElementById('root');
      if (!target) {
        throw new Error('The hydration host is missing');
      }
      target.innerHTML = body;
    }, { head, body });
    const input = page.locator('#adapter-code');
    await expect(input).toHaveValue(observation.ssr.code);
    await expect(input).toHaveAttribute('data-mapped', observation.ssr.mapped);
    await input.focus();

    await page.addScriptTag({ type: 'module', url: '/form-control-adapters-hydration.client.ts' });
    await page.waitForFunction(() => window.formAdapterHydration !== undefined);

    await expect(input).toBeFocused();
    expect(await input.evaluate(node => node === window.formAdapterHydration?.input)).toBe(true);
    await input.fill('  bad  ');
    await compareAndClear(page, 'invalid');
    await page.evaluate(() => window.formAdapterHydration?.dispose());
    await expect(page.locator('form')).toHaveCount(0);
  }
  finally {
    await server.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
