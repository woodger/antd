import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-locale-reference.json' with { type: 'json' };
import { expectedTableLocale } from '../fixtures/table-locale-reference';

test.use({ viewport: source.reference.viewport, locale: 'en-US' });
const fixture = '/?fixture=table-locale&profile=';
const root = '#table-locale-fixture';

/** Reads the visible labels and the current state of the portal elements. */
function snapshot(kind: string | null) {
  const root = document.getElementById('table-locale-fixture');
  const table = root?.querySelector('[data-ant-table-part="table"]');
  if (!root || !table) {
    throw new Error('Missing Table locale fixture');
  }
  const cell = table.querySelector('.ant-table-placeholder td');
  const filter = document.querySelector(':popover-open [data-ant-table-filter-part="dropdown"]');
  const menu = document.querySelector('[data-ant-dropdown-popup]:popover-open [role="menu"]');
  const tooltip = document.querySelector('[data-ant-tooltip]:popover-open [data-ant-tooltip-container]');

  /** Decorative SVG contains metadata that are not included in the visible label. */
  function text(element: Element) {
    const copy = element.cloneNode(true);
    if (!(copy instanceof Element)) {
      throw new Error('Missing text owner');
    }
    for (const ornament of copy.querySelectorAll('svg')) {
      ornament.remove();
    }

    return copy.textContent.trim();
  }

  /** Describes one fragment together with a type of empty state. */
  function content(element: Element) {
    return {
      text: text(element),
      preset: Boolean(element.querySelector('[data-ant-empty]')),
      rich: Boolean(element.querySelector('[data-locale-rich]'))
    };
  }

  let filterState = null;
  if (filter) {
    const search = filter.querySelector<HTMLInputElement>('[data-ant-table-filter-search] input');
    const options = filter.cloneNode(true);
    if (!(options instanceof Element)) {
      throw new Error('Missing filter content');
    }
    options.querySelector('[data-ant-table-filter-part="buttons"]')?.remove();
    options.querySelector('[data-ant-table-filter-search]')?.remove();
    filterState = {
      buttons: Array.from(filter.querySelectorAll('[data-ant-table-filter-part="buttons"] button'), text),
      placeholder: search?.getAttribute('placeholder') ?? null,
      query: search?.value ?? null,
      checkAll: filter.querySelector('.ant-table-filter-dropdown-checkall')?.textContent.trim() ?? null,
      empty: kind === 'empty' ? content(options) : null
    };
  }

  return {
    empty: cell ? { ...content(cell), draft: cell.querySelector('input')?.value ?? null } : null,
    loading: table.querySelector('table')?.getAttribute('aria-busy') === 'true',
    rows: Array.from(table.querySelectorAll('tbody tr[data-row-key]'),
      node => node.getAttribute('data-row-key')),
    filter: filterState,
    sort: table.querySelector('th[aria-sort]')?.getAttribute('aria-sort') ?? null,
    tooltip: tooltip?.textContent.trim() ?? null,
    expand: Array.from(table.querySelectorAll('button.ant-table-row-expand-icon'), node => ({
      key: node.closest('[data-row-key]')?.getAttribute('data-row-key') ?? null,
      expanded: node.getAttribute('aria-expanded'),
      label: node.getAttribute('aria-label')
    })),
    selection: menu ? Array.from(menu.querySelectorAll('[role="menuitem"]'), text) : null,
    details: table.querySelector('.ant-table-expanded-row')?.textContent.trim() ?? null
  };
}

/** Repeats actions React on public elements Svelte. */
async function act(page: Page, action: string) {
  switch (action) {
    case 'filter':
      await page.locator(root + ' [data-ant-table-filter-part="trigger"]').click();
      return;
    case 'query':
      await page.locator('[data-ant-table-filter-search] input:visible').fill('Gre');
      return;
    case 'locale':
      await page.getByRole('button', { name: 'Change table locale', exact: true })
        .dispatchEvent('click');
      return;
    case 'sort-hover':
      await page.getByRole('button', { name: 'Name', exact: true }).hover();
      return;
    case 'sort':
      await page.getByRole('button', { name: 'Name', exact: true }).click();
      return;
    case 'selection':
      await page.getByRole('button', { name: 'Selection commands', exact: true }).hover();
      return;
    case 'expand':
      await page.locator(root + ' tr[data-row-key="1"] button[aria-expanded]').click();
      return;
    case 'finish':
      await page.getByRole('button', { name: 'Finish loading', exact: true }).click();
      return;
    default:
      throw new Error('Unexpected locale action ' + action);
  }
}

for (const { profile, states } of source.cases) {
  test('Table locale matches Ant Design for ' + profile.id, async ({ page }) => {
    await page.goto(fixture + profile.id);

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }

      const expected = expectedTableLocale(profile.id, state);
      await expect.poll(() => page.evaluate(snapshot, profile.kind ?? null), {
        message: profile.id + ' ' + (action ?? 'initial')
      }).toEqual(expected);
    }
  });
}

test('Table changes labels around an open filter and keeps its draft and focus', async ({ page }) => {
  await page.goto(fixture + 'filter-local');
  const trigger = page.getByRole('button', { name: 'Local filter: Name', exact: true });
  await trigger.click();
  await page.getByRole('checkbox', { name: 'Green', exact: true }).click();
  const search = page.getByRole('textbox', { name: 'Local search', exact: true });
  await search.fill('Gre');
  const original = await search.elementHandle();
  await search.evaluate((input: HTMLInputElement) => input.setSelectionRange(1, 3));

  await act(page, 'locale');

  const updated = page.getByRole('textbox', { name: 'Updated search', exact: true });
  await expect(updated).toHaveValue('Gre');
  await expect(updated).toBeFocused();
  expect(await updated.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await updated.evaluate((input: HTMLInputElement) => [
    input.selectionStart, input.selectionEnd
  ])).toEqual([1, 3]);
  await expect(page.getByRole('checkbox', { name: 'Green', exact: true })).toBeChecked();
  await expect(page.getByRole('dialog', { name: 'Updated filter: Name', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Updated apply', exact: true }).click();

  await expect(page.locator(root + ' tbody tr[data-row-key]')).toHaveText(['Green']);
});

test('Table keeps the interactive empty snippet through locale replacement', async ({ page }) => {
  await page.goto(fixture + 'body-snippet');
  const editor = page.getByRole('textbox', { name: 'Empty editor', exact: true });
  const original = await editor.elementHandle();
  await editor.fill('Draft kept');
  await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 6));

  await act(page, 'locale');

  await expect(editor).toHaveValue('Draft kept');
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await editor.evaluate((input: HTMLInputElement) => [
    input.selectionStart, input.selectionEnd
  ])).toEqual([2, 6]);
});

test('Table gives its empty snippet priority and confines the dictionary to its instance',
  async ({ page }) => {
    await page.goto(fixture + 'body-local&native-empty&peer');

    await expect(page.locator(root + ' tbody')).toHaveText('Own empty snippet');
    await expect(page.locator('#table-locale-peer tbody')).toHaveText('Shared Table');
  }
);

test('Table preserves the command behavior behind rich localized menu labels', async ({ page }) => {
  await page.goto(fixture + 'selection-expand');
  await expect(page.getByRole('checkbox', { name: 'Local page selection', exact: true })).toBeVisible();
  await act(page, 'locale');
  await act(page, 'selection');
  const command = page.getByRole('menuitem', { name: 'Updated dataset0', exact: true });
  await expect(command.locator('[data-locale-rich]')).toHaveText('Updated dataset');

  await command.click();

  await expect(page.getByLabel('Selected rows')).toHaveText('[1,2]');
});
