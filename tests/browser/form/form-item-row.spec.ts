import type { Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-form-item-row-observation.json' with { type: 'json' };

async function readItem(page: Page) {
  return page.evaluate(() => {
    const field = document.querySelector<HTMLElement>('.row-observation');
    const child = document.querySelector<HTMLButtonElement>('[data-row-child]');
    const row = field?.querySelector<HTMLElement>('.ant-form-item-row, .probe-item-row');
    const col = row?.lastElementChild;
    const prefix = row?.classList.contains('ui-row') ? 'ui-row' : 'ant-row';
    const classes = row ? [...row.classList]
      .filter(name => name === prefix || name.startsWith(prefix + '-')).sort() : [];

    return {
      hasRow: Boolean(row),
      hasChild: Boolean(child),
      field: field ? {
        tag: field.tagName,
        class: field.classList.contains('item-root'),
        hidden: getComputedStyle(field).display === 'none',
        data: field.getAttribute('data-audit'),
        title: field.getAttribute('title'),
        color: field.style.color
      } : null,
      row: row ? {
        tag: row.tagName,
        role: row.getAttribute('role'),
        label: row.getAttribute('aria-label'),
        ariaHidden: row.getAttribute('aria-hidden'),
        title: row.getAttribute('title'),
        data: row.getAttribute('data-audit'),
        custom: row.getAttribute('customtag'),
        dir: row.getAttribute('dir'),
        tabIndex: row.tabIndex,
        color: row.style.color,
        margin: row.style.marginInline,
        gap: row.style.rowGap,
        columnPadding: col instanceof HTMLElement ? col.style.paddingInline : null,
        classes,
        legacy: ['id', 'fieldkey', 'labelwrap'].filter(key => row.hasAttribute(key))
      } : null
    };
  });
}

test('FormItem forwards current row settings and events to the styled Grid row', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?fixture=form-item-row');
  const row = page.locator('.ant-form-item-row, .probe-item-row');
  const initialRow = await row.elementHandle();
  const child = page.locator('[data-row-child]');
  const clicks = page.getByRole('status', { name: 'Row click log' });

  for (const stage of ['initial', 'changed', 'unstyled', 'hidden'] as const) {
    if (stage !== 'initial') {
      await page.getByRole('button', { name: `Set ${stage}`, exact: true }).click();
    }

    // The initial row is aria-hidden and the last one is display:none.
    await child.evaluate((button: HTMLButtonElement) => button.click());

    const { row: expectedRow, clicks: expectedClicks, ...item } = reference[stage];
    const rowSnapshot = expectedRow && { ...expectedRow, classes: [...expectedRow.classes].sort() };
    await expect.poll(() => readItem(page)).toEqual({ ...item, row: rowSnapshot });
    await expect(clicks).toHaveText(JSON.stringify(expectedClicks));
    if (stage === 'changed') {
      expect(await row.evaluate((element, initial) => element === initial, initialRow))
        .toBe(reference.stableRow);
    }
  }
});
