import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-pagination-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-pagination&profile=';
const root = '#table-pagination-fixture';
const wrapper = root + ' [data-ant-table-part="wrapper"]';
const spinContent = wrapper + ' > [data-ant-spin-root] > [data-ant-spin-part="container"]';
const table = '[data-ant-table-part="table"]';

type Edge = 'top' | 'bottom';

/** Choose a visible pager at the location relative to the table container. */
function pager(page: Page, edge: Edge) {
  return page.locator(edge === 'top'
    ? spinContent + ' > nav:has(~ ' + table + ')'
    : spinContent + ' > ' + table + ' ~ nav');
}

/** Removes the composition and order of the pagers and their total condition from DOM package. */
function snapshot() {
  const root = document.getElementById('table-pagination-fixture');
  const table = root?.querySelector('[data-ant-table-part="table"]');
  const wrapper = table?.parentElement;
  if (!root || !table || !wrapper) {
    throw new Error('Missing table pagination fixture');
  }

  const owner = table.getAttribute('data-ant-table-prefix');
  const lists = wrapper.querySelectorAll<HTMLElement>(':scope > nav > ul[data-ant-pagination]');
  const pagers = Array.from(lists, list => {
    const navigation = list.closest<HTMLElement>('nav');
    const prefix = list.getAttribute('data-ant-pagination-prefix');
    if (!navigation || !prefix) {
      throw new Error('Missing navigation or pagination prefix');
    }

    const relation = navigation.compareDocumentPosition(table);
    const beforeTable = Boolean(relation & Node.DOCUMENT_POSITION_FOLLOWING);
    const alignment = ['start', 'center', 'end'].find(value =>
      list.classList.contains(owner + '-pagination-' + value));
    const selected = list.querySelector('[aria-current="page"]');
    const input = list.querySelector<HTMLInputElement>('.' + prefix + '-simple-pager input');
    const computed = getComputedStyle(list);

    return {
      edge: beforeTable ? 'top' : 'bottom',
      alignment,
      justify: computed.justifyContent,
      direction: computed.direction,
      current: selected?.textContent ?? input?.value ?? null,
      mini: list.classList.contains(prefix + '-mini'),
      customClass: list.classList.contains('observed-pager-class'),
      ownClass: navigation.classList.contains('observed-pager-root'),
      tableClass: navigation.classList.contains('observed-table-pager'),
      pageSize: navigation.style.getPropertyValue('--observed-page-size').trim(),
      layer: navigation.style.getPropertyValue('--observed-pager-layer').trim(),
      showTotal: list.querySelector('.' + prefix + '-total-text')?.textContent ?? null,
      quick: Boolean(list.querySelector('.' + prefix + '-options-quick-jumper')),
      disabledPrev: list.querySelector<HTMLButtonElement>('[data-ant-pagination-prev] button')
        ?.disabled ?? null,
      disabledNext: list.querySelector<HTMLButtonElement>('[data-ant-pagination-next] button')
        ?.disabled ?? null
    };
  });

  const rows = table.querySelectorAll('tbody tr[data-row-key]');
  const events = root.querySelector('#pagination-events')?.textContent;

  return {
    pagers,
    rows: Array.from(rows, row => row.getAttribute('data-row-key')),
    title: table.querySelector('.' + owner + '-title')?.textContent ?? null,
    footer: table.querySelector('.' + owner + '-footer')?.textContent ?? null,
    events: JSON.parse(events ?? '[]')
  };
}

/** Repeats the choice of size in a particular pager, including the portal list. */
async function selectSize(page: Page, edge: Edge, size: string) {
  await pager(page, edge).getByRole('combobox').click();
  await page.getByRole('option', { name: size + ' / page', exact: true }).click();
}

/** Performs a single action of the owner or pager from the magazine React. */
async function act(page: Page, action: string) {
  const labels: Record<string, string> = {
    trim: 'Trim rows',
    'restore-rows': 'Restore rows',
    'top-align': 'Center top',
    'hide-top': 'Hide top',
    'hide-all': 'Hide all',
    'restore-placement': 'Restore placement'
  };
  if (labels[action]) {
    await page.getByRole('button', { name: labels[action], exact: true }).click();
    return;
  }
  if (action === 'filter') {
    await page.getByRole('button', { name: 'Filter: Name', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Odd', exact: true }).check();
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    return;
  }

  const [edge, control, size] = action.split('-');
  if (edge !== 'top' && edge !== 'bottom') {
    throw new Error('Unknown pager edge ' + edge);
  }
  if (control === 'size') {
    await selectSize(page, edge, size);
    return;
  }
  if (control === 'jump') {
    const input = pager(page, edge).locator('[data-ant-pagination-quick]').getByRole('textbox');
    await input.fill(size);
    await input.press('Enter');
    return;
  }

  const side = control === 'previous' ? 'prev' : 'next';
  await pager(page, edge).locator('[data-ant-pagination-' + side + '] button').click();
}

for (const { profile, states } of source.cases) {
  test('Table pagination matches Ant Design for ' + profile.id, async ({ page }) => {
    await page.goto(fixture + profile.id);

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }

      await expect.poll(() => page.evaluate(snapshot), {
        message: profile.id + ' ' + (action ?? 'initial')
      }).toEqual(state);
    }
  });
}

test('Table keeps the focused pager and body editor through placement changes', async ({ page }) => {
  await page.goto(fixture + 'live');
  const top = pager(page, 'top');
  const jump = top.locator('[data-ant-pagination-quick]').getByRole('textbox');
  const originalJump = await jump.elementHandle();
  await jump.fill('4');

  await page.getByRole('button', { name: 'Center top', exact: true }).dispatchEvent('click');

  await expect(top.locator('ul')).toHaveCSS('justify-content', 'center');
  await expect(jump).toBeFocused();
  await expect(jump).toHaveValue('4');
  expect(await jump.evaluate((node, before) => node === before, originalJump)).toBe(true);

  await jump.fill('');
  const editor = page.getByRole('textbox', { name: 'Editor 2', exact: true });
  const originalEditor = await editor.elementHandle();
  await editor.fill('Draft row');
  await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 6));

  for (const label of ['Hide top', 'Hide all', 'Restore placement']) {
    await page.getByRole('button', { name: label, exact: true }).dispatchEvent('click');

    await expect(editor).toBeFocused();
    await expect(editor).toHaveValue('Draft row');
    expect(await editor.evaluate((node, before) => node === before, originalEditor)).toBe(true);
  }

  expect(await editor.evaluate((node: HTMLInputElement) => [
    node.selectionStart, node.selectionEnd
  ])).toEqual([2, 6]);
  await expect(page.getByLabel('Pagination events')).toHaveText('[]');
});

test('Table keeps root bindings and server total ahead of nested settings', async ({ page }) => {
  await page.goto(fixture + 'native-bound-server');
  const owner = page.getByLabel('Bound owner');
  const report = page.getByLabel('Pagination events');
  const rows = page.locator(root + ' tbody tr[data-row-key]');
  await expect(owner).toHaveText('4 / 3');
  await expect(page.locator(wrapper + ' [aria-current="page"]')).toHaveText(['4', '4']);
  await expect(pager(page, 'top').locator('.ant-pagination-total-text')).toHaveText('12 / 10-12');

  await act(page, 'bottom-previous');
  await selectSize(page, 'top', '4');

  await expect(owner).toHaveText('3 / 4');
  await expect(page.locator(wrapper + ' [aria-current="page"]')).toHaveText(['3', '3']);
  await expect(rows).toHaveText(['Record 0', 'Record 1', 'Record 2']);
  const expected = JSON.stringify([
    ['page', 3, 3], ['table', 'paginate', 3, 3, [0, 1, 2]],
    ['size', 3, 4], ['page', 3, 4], ['table', 'paginate', 3, 4, [0, 1, 2]]
  ]);
  await expect(report).toHaveText(expected);

  await page.getByRole('button', { name: 'Clear total', exact: true }).click();

  await expect(page.locator(spinContent + ' > nav')).toHaveCount(0);
  await expect(owner).toHaveText('3 / 4');
  await expect(rows).toHaveText(['Record 0', 'Record 1', 'Record 2']);
  await expect(report).toHaveText(expected);
});
