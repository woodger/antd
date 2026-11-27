import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-config-reference.json' with { type: 'json' };
import { expectedTableConfig, expectedTableConfigScroll } from '../fixtures/table-config-reference';

test.use({ viewport: { width: 880, height: 600 }, locale: 'en-US', reducedMotion: 'reduce' });
const fixture = '/?fixture=table-config&profile=';
const viewport = '#table-config-fixture [data-ant-table-part="content"]';

/** Measures an effective layout and string keys after action. */
function snapshot() {
  const root = document.getElementById('table-config-fixture');
  const owner = root?.querySelector('[data-ant-table-part="wrapper"]');
  const body = owner?.querySelector<HTMLElement>('[data-ant-table-part="content"]');
  const table = body?.querySelector('table');
  const layout = owner?.querySelector<HTMLElement>('[data-ant-table-size]');
  if (!root || !owner || !body || !table || !layout) {
    throw new Error('Missing Table config fixture');
  }

  return {
    keys: Array.from(table.querySelectorAll<HTMLElement>('tr[data-row-key]'), row => row.dataset.rowKey),
    maxHeight: body.style.maxHeight,
    width: table.style.width,
    minWidth: table.style.minWidth,
    tableLayout: table.style.tableLayout,
    scroll: [body.scrollLeft, body.scrollTop],
    header: body.classList.contains('table-pin-head'),
    size: layout.dataset.antTableSize,
    tableOverride: owner.classList.contains('override-table'),
    rtl: owner.classList.contains('ant-table-wrapper-rtl'),
    events: JSON.parse(root.querySelector('output')?.textContent ?? '[]')
  };
}

/** Performs actions from the benchmark via scrollport and public ref. */
async function act(page: Page, action: string, rtl: boolean) {
  if (action === 'move') {
    await page.locator(viewport).evaluate((element, direction) => {
      element.scrollLeft = direction ? -51 : 51;
      element.scrollTop = 85;
    }, rtl);
    return;
  }

  const label = action === 'sort' ? 'Name' : 'Scroll by inherited key';
  await page.getByRole('button', { name: label, exact: true }).dispatchEvent('click');
}

for (const sample of source.cases) {
  test(`Table resolves provider defaults for ${sample.profile.id}`, async ({ page }) => {
    await page.goto(fixture + sample.profile.id);

    for (const [index, { action, state }] of sample.states.entries()) {
      if (action) {
        await act(page, action, state.rtl);
      }

      const expected = {
        ...expectedTableConfig(state), scroll: expectedTableConfigScroll(sample, index)
      };
      await expect.poll(() => page.evaluate(snapshot), {
        message: `${sample.profile.id} ${action ?? 'initial'}`
      }).toEqual(expected);
    }
  });
}

test('Table reapplies inherited scroll around the same focused editor', async ({ page }) => {
  await page.goto(fixture + 'inherit&editor');
  const body = page.locator(viewport);
  const editor = body.getByRole('textbox', { name: 'Editor 0', exact: true });
  const original = await editor.elementHandle();
  await editor.fill('Draft in inherited layout');
  await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(3, 8));

  await page.getByRole('button', { name: 'Resize from provider' }).dispatchEvent('click');

  await expect(body).toHaveCSS('max-height', '150px');
  await expect(body.locator('table')).toHaveCSS('min-width', '640px');
  await expect(editor).toBeFocused();

  await page.getByRole('button', { name: 'Set local scroll' }).dispatchEvent('click');

  await expect(body).toHaveCSS('max-height', 'none');
  await expect(body.locator('table')).toHaveCSS('min-width', '0px');
  await expect(editor).toBeFocused();

  await page.getByRole('button', { name: 'Inherit scroll' }).dispatchEvent('click');

  await expect(body).toHaveCSS('max-height', '150px');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Draft in inherited layout');
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await editor.evaluate((input: HTMLInputElement) => [
    input.selectionStart, input.selectionEnd
  ])).toEqual([3, 8]);
  await expect(page.getByLabel('Table config events')).toHaveText('[]');
});

test('Table updates inherited keys and keeps an explicit key during the same provider change',
  async ({ page }) => {
    for (const [profile, expected] of [['inherit', 'local-0'], ['local-function', 'computed-0']]) {
      await page.goto(fixture + profile + '&editor');
      const row = page.locator(`${viewport} tbody tr[data-row-key]`).first();
      const before = await row.getAttribute('data-row-key');
      expect(before).toBe(profile === 'inherit' ? 'provider-0' : 'computed-0');

      await page.getByRole('button', { name: 'Change provider key' }).dispatchEvent('click');

      await expect(row).toHaveAttribute('data-row-key', expected);
      await expect(page.getByLabel('Table config events')).toHaveText('[]');
    }
  }
);

test('virtual Table uses provider dimensions and scrolls to a key outside the window', async ({
  page
}) => {
  await page.goto(fixture + 'inherit&virtual');
  const body = page.locator(viewport);
  const target = body.locator('tr[data-row-key="provider-20"]');
  await expect(body).toHaveAttribute('data-ant-table-virtual', 'true');
  await expect(body.getByRole('columnheader', { name: 'Name', exact: true }))
    .toHaveCSS('position', 'sticky');
  await expect(body.locator('tr[data-row-key="provider-0"]')).toHaveCount(1);
  await expect(target).toHaveCount(0);

  await page.getByRole('button', { name: 'Scroll by inherited key' }).dispatchEvent('click');

  await expect(target).toBeVisible();
  await expect.poll(() => target.evaluate(row => {
    const table = row.closest('table');
    const head = table?.tHead?.querySelector('th')?.getBoundingClientRect();
    return head ? Math.round(row.getBoundingClientRect().top - head.bottom) : null;
  })).toBe(0);
  await expect(page.getByLabel('Table config events')).toHaveText('[]');
});
