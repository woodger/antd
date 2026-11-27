import { expect, test } from './test';
import source from './fixtures/ant-design-table-dom-attributes-reference.json' with { type: 'json' };
import {
  expectedTableDomAttributes, tableAriaNames, tableDataNames
} from './fixtures/table-dom-attributes-reference';

const fixture = '/?fixture=table-dom-attributes&profile=';
test.use({ viewport: { width: 880, height: 480 }, reducedMotion: 'reduce' });

/** Reads DOM after Svelte-update, including removed and empty attributes. */
function capture({ ariaNames, dataNames, prefix }: {
  ariaNames: string[]; dataNames: string[]; prefix: string;
}) {
  const root = document.getElementById('table-dom-attributes-fixture');
  const outer = root?.querySelector('[data-ant-table-part="wrapper"]');
  const owner = root?.querySelector('[data-ant-table-part="table"]');
  if (!root || !outer || !owner) {
    throw new Error('Missing Table DOM attributes fixture');
  }

  /** Saves the distinction between an empty value and the missing attribute. */
  function readAttrs(node: Element, names: string[]) {
    return Object.fromEntries(names.map(name => [name, node.getAttribute(name)]));
  }

  const tables = Array.from(root.querySelectorAll('table'), table => {
    const label = table.caption;
    const band = table.closest<HTMLElement>('[data-ant-table-custom-band]');
    return {
      band: band?.dataset.antTableCustomBand ?? 'main', aria: readAttrs(table, ariaNames),
      data: readAttrs(table, dataNames), id: table.getAttribute('id'),
      customHeader: table.hasAttribute('data-probe-header'),
      caption: label && {
        text: label.textContent,
        class: Array.from(label.classList).find(name => name === prefix + '-caption') ?? '',
        rich: label.querySelector('[data-probe-caption]')?.localName ?? null
      }
    };
  });
  return {
    owner: { id: owner.id, aria: readAttrs(owner, ariaNames), data: readAttrs(owner, dataNames) },
    outer: { id: outer.getAttribute('id'), data: readAttrs(outer, dataNames) },
    tables, customBody: Boolean(root.querySelector('[data-probe-custom-body]'))
  };
}

for (const sample of source.cases) {
  const { profile } = sample;
  test(`Table places DOM attributes and caption for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    await expect(page.locator('#table-dom-attributes-fixture'))
      .toHaveAttribute('data-native-root', 'wrapper');
    const args = {
      ariaNames: tableAriaNames, dataNames: tableDataNames, prefix: profile.prefix ?? 'ant-table'
    };

    await expect.poll(() => page.evaluate(capture, args))
      .toEqual(expectedTableDomAttributes(sample, 'initial'));

    await page.getByRole('button', { name: 'Update attributes' }).dispatchEvent('click');

    await expect.poll(() => page.evaluate(capture, args))
      .toEqual(expectedTableDomAttributes(sample, 'updated'));
  });
}

test('Table updates accessible names and description without replacing the focused editor', async ({
  page
}) => {
  await page.goto(fixture + 'ordinary&editor');
  const grid = page.getByRole('grid', { name: 'Report heading' });
  const region = page.locator('[data-ant-table-part="content"]');
  const editor = page.getByRole('textbox', { name: 'Row draft' });
  const original = await editor.elementHandle();
  await editor.fill('Edited draft');
  await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 7));
  await expect(grid).toHaveAccessibleDescription('Detailed report');
  await expect(region).toHaveAccessibleName('Report heading');

  await page.getByRole('button', { name: 'Update attributes' }).dispatchEvent('click');

  const table = page.getByRole('table', { name: 'Updated table' });
  await expect(table).toHaveAccessibleDescription('Replacement details');
  await expect(region).toHaveAccessibleName('Updated caption');
  const captionId = await table.locator('caption').getAttribute('id');
  expect(captionId).toBeTruthy();
  await expect(region).toHaveAttribute('aria-labelledby', captionId ?? '');

  await page.getByRole('button', { name: 'Use plain caption' }).dispatchEvent('click');

  await expect(region).toHaveAccessibleName('Plain switch');
  await expect(region).not.toHaveAttribute('aria-labelledby');

  await page.getByRole('button', { name: 'Remove caption' }).dispatchEvent('click');

  await expect(table.locator('caption')).toHaveCount(0);
  await expect(region).toHaveAccessibleName('Updated table');
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Edited draft');
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await editor.evaluate((input: HTMLInputElement) => [
    input.selectionStart, input.selectionEnd
  ])).toEqual([2, 7]);
});

test('Table preserves the name and geometry of an empty caption', async ({ page }) => {
  await page.goto(fixture + 'empty-caption');
  const table = page.getByRole('table', { name: 'Table', exact: true });
  const caption = table.locator('caption');
  await expect(caption).toBeEmpty();
  expect(await caption.evaluate(node => node.getBoundingClientRect().height)).toBe(0);
});

test('virtual Table aligns pinned headers after the caption element changes', async ({ page }) => {
  await page.goto(fixture + 'virtual');
  const viewport = page.locator('[data-ant-table-virtual="true"]');
  await viewport.evaluate(node => { node.scrollTop = 64; });
  const positions = () => viewport.evaluate(node => {
    const table = node.querySelector('table');
    const caption = table?.caption?.getBoundingClientRect();
    const header = table?.tHead?.querySelector('th')?.getBoundingClientRect();
    if (!caption || !header) {
      throw new Error('Missing pinned table caption or header');
    }

    return { height: caption.height, gap: Math.abs(header.top - caption.bottom) };
  });
  await expect.poll(async () => (await positions()).gap).toBeLessThanOrEqual(1);
  const before = await positions();

  await page.getByRole('button', { name: 'Use plain caption' }).dispatchEvent('click');

  await expect(viewport.locator('caption')).toHaveText('Plain switch');
  await expect.poll(async () => (await positions()).height).toBeLessThan(before.height);
  await expect.poll(async () => (await positions()).gap).toBeLessThanOrEqual(1);
});
