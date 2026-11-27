import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-row-attributes-reference.json' with { type: 'json' };

type SourceCase = (typeof source.cases)[number];
type Snapshot = SourceCase['states'][number]['state'];

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-row-attributes';
const root = '#table-row-attributes-fixture';
const events = '#table-row-attributes-events';

/** Reads the attributes of real tr, separately from the service lines of details and spacer. */
function snapshot() {
  const table = document.querySelector<HTMLTableElement>('#table-row-attributes-fixture table');
  if (!table) throw new Error('Missing row attributes fixture');

  const heads = Array.from(table.tHead?.rows ?? [], row => [
    row.id, row.dataset.headAttrs, row.getAttribute('aria-label'), row.tabIndex,
    [...row.classList].find(name => name.startsWith('fixture-head-')) ?? null,
    row.style.getPropertyValue('--fixture-head-color').trim() || null
  ]);
  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>(
    'tbody tr[data-row-attrs]'
  ), row => [
    Number(row.dataset.rowKey), row.id, row.dataset.rowAttrs, row.getAttribute('aria-label'),
    row.tabIndex, row.classList.contains('fixture-base'),
    [...row.classList].find(name => name.startsWith('fixture-row-')) ?? null,
    row.style.getPropertyValue('--fixture-row-color').trim() || null,
    row.dataset.antTablePart === 'span-row', !!row.dataset.entered
  ]);
  const details = Array.from(table.querySelectorAll<HTMLElement>('[data-detail]'), detail => [
    Number(detail.dataset.detail), !detail.closest('tr')?.hidden
  ]);
  const events = JSON.parse(document.getElementById('table-row-attributes-events')?.textContent
    ?? '[]');
  return { heads, rows, details, events };
}

/** Applies the same step through native control, string or ref Table. */
async function act(page: Page, action: string) {
  const [kind, key] = action.split('-');
  const row = page.locator(`${root} tr[data-ant-table-part="row"][data-row-key="${key}"]`);
  const name = row.locator('.fixture-name');

  switch (kind) {
    case 'row':
      if (await name.count()) await name.click();
      else await row.locator('td').last().click();
      return;
    case 'double':
      await name.dblclick();
      return;
    case 'context':
      await name.click({ button: 'right' });
      return;
    case 'key':
      await row.press('Enter');
      return;
    case 'icon':
      await row.locator('button.ant-table-row-expand-icon').click();
      return;
    case 'head':
      await page.locator(`thead #head-${key}`).locator('th').last().click();
      return;
    case 'headkey':
      await page.locator(`thead #head-${key}`).press('F2');
      return;
    case 'hover':
      await name.hover();
      return;
    case 'leave':
      await page.mouse.move(820, 580);
      return;
    case 'next':
      await page.locator('.ant-pagination-next button').click();
      return;
    case 'span':
      await page.locator(`tr[data-ant-table-part="span-row"][data-row-key="${key}"] .fixture-name`)
        .click();
      return;
    case 'scroll':
      await page.getByRole('button', { name: `Scroll to ${key}`, exact: true }).click();
      return;
    case 'narrow':
    case 'wide':
      await page.setViewportSize({
        ...source.reference.viewport, width: kind === 'narrow' ? 640 : source.reference.viewport.width
      });
      return;
    case 'revise':
      await page.getByRole('button', { name: 'Update row attributes' }).click();
      return;
    case 'hide':
      await page.getByRole('button', { name: key === 'leaf' ? 'Hide leaf' : 'Hide group' }).click();
      return;
    case 'toggle':
      await page.getByRole('button', { name: 'Toggle header' }).click();
      return;
    default:
      throw new Error(`Unknown row attributes action ${action}`);
  }
}

/** Takes into account the adopted lifecycle details and the protection of the identity of native lines. */
function expectedState(state: Snapshot, spans: boolean) {
  const heads = state.heads.map(head => {
    const revision = String(head[1]).split(':')[1];
    // HeaderRow React rubs the returned className and style semantic defaults.
    return [...head.slice(0, 4), `fixture-head-${revision}`, `head-${revision}`];
  });
  const rows = state.rows.map(row => {
    const duplicates = row[8] && state.rows.some(candidate => candidate[0] === row[0] && !candidate[8]);
    if (!duplicates) return row;
    const overlay = [...row];
    overlay[1] = '';
    overlay[4] = -1;
    return overlay;
  });
  const events = spans ? state.events.map(event =>
    event[0] === 'row' && event[1] === 0 ? [...event.slice(0, 4), '', ...event.slice(5)] : event
  ) : state.events;

  return { heads, rows, events, details: state.details.filter(row => row[1]) };
}

/** The overscan size differs, the indexes of the general records coincide. */
function observedKeys(profile: SourceCase['profile'], action: string | null) {
  if (action === 'scroll-20' || action === 'key-20') return [20];
  return profile.tree ? [0, 100, 101] : [0, 1, 2];
}

for (const { profile, states } of source.cases) {
  test(`Table row callbacks match Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);
    await expect(page.locator(`${root} table`)).toBeVisible();

    for (const { action, state } of states) {
      if (action) await act(page, action);
      const expected = expectedState(state, !!profile.spans);
      const keys = profile.virtual ? observedKeys(profile, action) : undefined;
      if (keys) {
        expected.rows = expected.rows.filter(row => keys.some(key => key === row[0]));
      }

      await expect.poll(async () => {
        const native = await page.evaluate(snapshot);
        if (keys) {
          native.rows = native.rows.filter(row => keys.some(key => key === row[0]));
        }
        return native;
      }, { message: `${profile.id} after ${action ?? 'mount'}` }).toEqual(expected);
    }
  });
}

test('Table keeps an editor and sticky header offsets when row attributes change', async ({ page }) => {
  await page.goto(`${fixture}&profile=grouped&editor`);
  const body = page.locator('tbody #body-0');
  const head = page.locator('thead #head-1');
  const editor = page.getByRole('textbox', { name: 'Row editor' });
  const before = await editor.elementHandle();
  const headerOffset = () => head.evaluate(node => {
    const value = node.style.getPropertyValue('--ant-table-header-row-offset');
    return Number.parseFloat(value);
  });

  await expect.poll(headerOffset).toBeGreaterThan(20);
  const initialOffset = await headerOffset();
  await editor.click();
  await editor.fill('Draft living in the original cell');
  await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(4, 10));

  await page.getByRole('button', { name: 'Update row attributes' }).dispatchEvent('click');

  await expect(body).toHaveAttribute('data-row-attrs', '0:1');
  await expect(head).toHaveClass(/fixture-head-1/);
  await expect.poll(headerOffset).toBe(initialOffset);
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Draft living in the original cell');
  expect(await editor.evaluate((node, original) => node === original, before)).toBe(true);
  expect(await editor.evaluate((node: HTMLInputElement) => [
    node.selectionStart, node.selectionEnd
  ])).toEqual([4, 10]);
  await expect(page.locator(events)).toHaveText('[["row",0,0,0,"body-0",false]]');
  await expect(page.locator('[data-detail="0"]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Remove row hooks' }).dispatchEvent('click');
  await expect(body).toHaveCount(0);
  await expect(head).toHaveCount(0);
  await expect(editor).toBeFocused();

  await page.locator('tr[data-row-key="0"] .fixture-tail').click();

  await expect(page.locator('[data-detail="0"]')).toBeVisible();
  await expect(page.locator(events)).toHaveText(
    '[["row",0,0,0,"body-0",false],["expand",0,true],["keys",[0]]]'
  );
});

test('Table links expanded branches to caller IDs and keeps one Tab stop for span rows', async ({
  page
}) => {
  await page.goto(`${fixture}&profile=virtual-tree`);
  const parent = page.locator('#body-0 [data-ant-table-part="expand-icon"]');
  const child = page.locator('#body-100 [data-ant-table-part="expand-icon"]');

  await expect(parent).toHaveAttribute('aria-controls', 'body-100');
  await expect(child).toHaveAttribute('aria-controls', 'body-101');

  await page.goto(`${fixture}&profile=virtual-spans`);
  const overlay = page.locator('tr[data-ant-table-part="span-row"][data-row-key="0"]');

  await expect(overlay).toHaveCount(1);
  await expect(overlay).not.toHaveAttribute('tabindex');
  await expect(page.locator('#body-0')).toHaveCount(1);
  await expect(page.locator('#body-0')).toHaveAttribute('tabindex', '0');
});
