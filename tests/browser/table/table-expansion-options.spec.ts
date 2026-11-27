import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-expansion-options-reference.json'
  with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const root = '#table-expansion-options-fixture';
const events = '#table-expansion-options-events';
const fixture = '/?fixture=table-expansion-options';

/** Reads the parameters of the switch and the state of the mounted details. */
function snapshot() {
  const area = document.getElementById('table-expansion-options-fixture');
  if (!area) throw new Error('Missing Table expansion options fixture');

  /** An additional class contains the original index and the level of the tree. */
  function classOf(row: Element) {
    return [...row.classList].find(name => name.startsWith('fixture-expanded-')) ?? null;
  }

  const rows = Array.from(area.querySelectorAll<HTMLTableRowElement>(
    'tr[data-ant-table-part="row"]'
  ), row => {
    const icon = row.querySelector<HTMLElement>('[data-icon-state]');
    const standard = row.querySelector('[data-ant-table-part="expand-icon"]');
    return [
      Number(row.dataset.rowKey), classOf(row), icon?.dataset.iconState ?? null,
      (icon ?? standard)?.getAttribute('aria-expanded') ?? null
    ];
  });
  const details = Array.from(area.querySelectorAll<HTMLElement>('[data-detail-key]'), content => {
    const row = content.closest('tr');
    if (!row) throw new Error('Details are outside their table row');

    return [
      Number(content.dataset.detailKey), getComputedStyle(row).display !== 'none',
      content.dataset.detailState, classOf(row), content.querySelector('input')?.value
    ];
  });
  const events = JSON.parse(document.getElementById('table-expansion-options-events')?.textContent
    ?? '[]');
  return { rows, details, events };
}

/** Carries out user actions through regular DOM events and ref Table. */
async function act(page: Page, action: string) {
  const [kind, key] = action.split('-');
  const row = page.locator(`${root} tr[data-row-key="${key}"]`);

  switch (kind) {
    case 'icon':
    case 'key': {
      const trigger = row.locator('[data-icon-state], [data-ant-table-part="expand-icon"]');
      if (kind === 'key') await trigger.press('Enter');
      else await trigger.click();
      return;
    }
    case 'row':
      await row.locator('.fixture-name').click();
      return;
    case 'draft':
      await page.getByRole('textbox', { name: `Draft ${key}`, exact: true }).fill(`Edited ${key}`);
      return;
    case 'accept':
      await page.getByRole('button', { name: 'Accept expansion' }).click();
      return;
    case 'lock':
    case 'unlock':
      await page.getByRole('button', {
        name: kind === 'lock' ? 'Lock row' : 'Unlock row', exact: true
      }).click();
      return;
    case 'change':
      await page.getByRole('button', { name: 'Change provider' }).click();
      return;
    case 'scroll':
      await page.getByRole('button', { name: `Scroll to ${key}`, exact: true }).click();
      return;
    default:
      throw new Error(`Unknown expansion action ${action}`);
  }
}

/** Selects the total lines of two virtual windows where overscan sizes differ. */
function compareWindow(profile: string, action: string | null) {
  if (action === 'scroll-20') return [20];
  if (profile === 'virtual-tree') return [0, 101, 102];
  return [0, 2];
}

for (const { profile, states } of source.cases) {
  test(`Table expansion options match Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);
    await expect(page.locator(`${root} table`)).toBeVisible();

    for (const [index, { action, state }] of states.entries()) {
      if (action) await act(page, action);

      if (profile.virtual) {
        const keys = compareWindow(profile.id, action);
        await expect.poll(async () => {
          const native = await page.evaluate(snapshot);
          return {
            rows: native.rows.filter(row => keys.some(key => key === row[0])),
            details: native.details.filter(row => keys.some(key => key === row[0])),
            events: native.events
          };
        }).toEqual({
          rows: state.rows.filter(row => keys.some(key => key === row[0])),
          details: state.details.filter(row => keys.some(key => key === row[0])),
          events: state.events
        });
        const native = await page.evaluate(snapshot);
        expect(native.rows.length).toBeLessThan(36);
        if (profile.force) {
          expect(native.details.map(row => row[0])).toEqual(
            native.rows.filter(row => row[0] !== 1).map(row => row[0])
          );
        }
        continue;
      }

      let details = state.details;
      if (profile.id === 'lazy-normal') {
        // Without forceRender Native, the editor is released when folding.
        details = details.filter(row => row[1]);
        if (index === states.length - 1) {
          details = details.map(row => [...row.slice(0, 4), `Draft ${row[0]}`]);
        }
      }

      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} after ${action ?? 'mount'}`
      }).toEqual({ ...state, details });
    }
  });
}

test('Table hidden details retain the editor without occupying height or a Tab stop', async ({
  page
}) => {
  await page.goto(`${fixture}&profile=virtual-forced`);
  const trigger = page.getByRole('button', { name: 'Toggle 0', exact: true });
  const row = page.locator('tr[data-row-key="0"]');
  const locked = page.locator('tr[data-row-key="1"]');
  const details = page.locator('tr[data-ant-table-part="expanded-row"]', {
    has: page.locator('[data-detail-key="0"]')
  });
  const editor = details.locator('input');
  const original = await editor.elementHandle();
  const position = () => locked.evaluate((element: HTMLTableRowElement) => element.offsetTop);
  const closedPosition = await position();

  await expect(details).toHaveAttribute('hidden', '');
  await expect(details).toHaveCSS('display', 'none');
  await expect(page.getByRole('textbox', { name: 'Draft 0' })).toHaveCount(0);
  await trigger.focus();
  await trigger.press('Tab');
  await expect(page.getByRole('button', { name: 'Toggle 2', exact: true })).toBeFocused();

  await trigger.press('Space');

  await expect(editor).toBeVisible();
  expect(await position()).toBeGreaterThan(closedPosition + 20);
  const id = await trigger.getAttribute('aria-controls');
  await expect(details.locator('.expanded-content')).toHaveAttribute('id', id ?? '');
  await editor.fill('Kept while hidden');
  await trigger.press('Space');

  await expect(details).toHaveAttribute('hidden', '');
  expect(await position()).toBe(closedPosition);
  await expect(trigger).not.toHaveAttribute('aria-controls');
  await trigger.press('Space');

  await expect(editor).toHaveValue('Kept while hidden');
  expect(await editor.evaluate((element, before) => element === before, original)).toBe(true);
  await expect(row).toBeVisible();
});

test('Table passes the native expansion button through a wrapper snippet', async ({ page }) => {
  await page.goto(`${fixture}&profile=forced&wrapped`);
  const button = page.locator('[data-origin="0"]').getByRole('button');
  const original = await button.elementHandle();

  await button.press('Enter');

  await expect(button).toBeFocused();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(events)).toHaveText('[["expand",true,0],["keys",[0]]]');
  expect(await button.evaluate((element, before) => element === before, original)).toBe(true);

  await page.getByRole('button', { name: 'Toggle disabled' }).click();

  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator(events)).toHaveText('[["expand",true,0],["keys",[0]]]');
});
