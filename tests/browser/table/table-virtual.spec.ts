import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-virtual-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

type Action = NonNullable<(typeof source.cases)[number]['states'][number]['action']>;

/** Reads the position of the lines from the upper body boundary, as in a separate holder Source. */
function snapshot({ rtl, previousScroll }: { rtl: boolean; previousScroll: number; }) {
  const root = document.getElementById('table-virtual-fixture');
  const viewport = root?.querySelector<HTMLDivElement>('[data-ant-table-virtual]');
  const table = root?.querySelector('table');
  if (!root || !table) {
    throw new Error('Missing virtual table fixture');
  }

  const clip = viewport?.getBoundingClientRect();
  const headers = (table.tHead?.offsetHeight ?? 0) + (table.caption?.offsetHeight ?? 0);
  const bodyTop = clip ? clip.top + headers : 0;
  const bodyRows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tr[data-row-key]'));
  const first = viewport ? bodyRows[0] : undefined;
  const lead = first?.querySelector('.lead')?.getBoundingClientRect();
  const middle = first?.querySelector('.rank')?.getBoundingClientRect();
  const end = first?.querySelector('.end')?.getBoundingClientRect();

  /** Compares the physical position CSS with the direction of the table. */
  const axis = (column: DOMRect, box: DOMRect) => rtl
    ? box.right - column.right : column.left - box.left;
  const fixed = clip && lead && middle && end ? {
    lead: axis(lead, clip), middle: axis(middle, clip),
    end: rtl ? end.left - clip.left : clip.right - end.right,
    widths: [lead.width, middle.width, end.width]
  } : null;
  const rows = bodyRows.map(row => {
    const cell = row.querySelector('.lead');
    const text = cell?.querySelector<HTMLElement>('[data-index]');
    const rect = row.getBoundingClientRect();

    return {
      key: row.dataset.rowKey,
      index: Number(text?.dataset.index),
      rowClass: [...row.classList].find(name => name.startsWith('user-row-')),
      top: clip ? rect.top - bodyTop : 0,
      height: rect.height,
      width: cell?.getBoundingClientRect().width
    };
  });
  const details = Array.from(table.querySelectorAll<HTMLElement>('[data-detail]'), item => {
    const rect = item.getBoundingClientRect();
    return { key: item.dataset.detail, height: rect.height, top: rect.top - bodyTop };
  });

  return {
    rootRef: root.dataset.rootRef === 'wrapper',
    virtual: !!viewport,
    top: viewport?.scrollTop ?? 0,
    height: viewport ? viewport.clientHeight - headers : 0,
    width: viewport?.clientWidth ?? 0,
    rows, fixed, details,
    activePage: root.querySelector('.ant-pagination-item-active')?.textContent?.trim() ?? null,
    empty: !!root.querySelector('.ant-table-placeholder'),
    didScroll: Number(root.dataset.scrollCount) > previousScroll,
    events: JSON.parse(document.getElementById('virtual-table-changes')?.textContent ?? '[]')
  };
}

/** Clicks on the visible part of the sticky header without automatic scrolling Playwright. */
async function clickHeader(page: Page, control: Locator, text = false) {
  const point = await control.evaluate((node, textOnly) => {
    let rect = node.getBoundingClientRect();
    if (textOnly) {
      const contents = document.createRange();
      contents.selectNodeContents(node);
      rect = contents.getBoundingClientRect();
    }

    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    if (!node.contains(document.elementFromPoint(x, y))) {
      throw new Error('Table header control is outside the visible scrollport');
    }

    return { x, y };
  }, text);
  await page.mouse.click(point.x, point.y);
}

/** Causes scrollTo via ref or interacts with the usual DOM. */
async function act(page: Page, action: Action, index: number) {
  if (action.scroll) {
    await page.getByTestId(`scroll-${index - 1}`).click();
  }
  else if ('wheel' in action && action.wheel) {
    const [x, y] = action.wheel;
    await page.locator('[data-ant-table-virtual]').hover();
    await page.mouse.wheel(x, y);
  }
  else if ('expand' in action && action.expand !== undefined) {
    await page.locator(`tr[data-row-key="${action.expand}"] button.ant-table-row-expand-icon`).click();
  }
  else if ('all' in action && action.all) {
    await clickHeader(page, page.locator('thead input[type="checkbox"]'));
  }
  else if ('next' in action && action.next) {
    await page.locator('.ant-pagination-next button').click();
  }
  else if ('sort' in action && action.sort) {
    const title = page.getByRole('button', { name: 'Rank', exact: true })
      .locator('.ant-table-column-title');
    await clickHeader(page, title, true);
  }
}

for (const { profile, states } of source.cases) {
  test(`virtual Table matches the independent ${profile.id} profile`, async ({ page }) => {
    await page.goto(`/?fixture=table-virtual&profile=${profile.id}`);
    const root = page.locator('#table-virtual-fixture');
    await expect(root).toHaveAttribute('data-root-ref', 'wrapper');

    const events: unknown[] = [];
    for (const [index, { action, state }] of states.entries()) {
      const previousScroll = Number(await root.getAttribute('data-scroll-count'));
      if (action) {
        await act(page, action, index);
      }

      events.push(...state.events);
      const compareTarget = profile.id === 'fallback' && action?.scroll && !('top' in action.scroll);
      const { top, ...geometry } = state;
      await expect.poll(async () => {
        const result = await page.evaluate(snapshot, { rtl: !!profile.rtl, previousScroll });
        const { top, ...observed } = result;

        // In transfer strings, the final length of the prefix depends on the lines already
        // measured. For scrollTo on the key we compare the window, heights and position of each
        // line in viewport.
        return compareTarget ? observed : { ...observed, top };
      }, {
        message: `${profile.id} state ${index} ${JSON.stringify(action)}`
      }).toEqual({ ...geometry, events, ...(compareTarget ? {} : { top }) });
    }
  });
}

test('virtual Table scrolls a semantic table with the keyboard and keeps its caption and header',
  async ({ page }) => {
    await page.goto('/?fixture=table-virtual&caption&editor');
    const region = page.getByRole('region', { name: 'Virtual table' });
    const table = region.getByRole('table', { name: 'Virtual table' });
    const head = region.getByRole('columnheader', { name: 'Name' });
    const caption = table.locator('caption');
    await expect(table).toHaveAttribute('aria-rowcount', '81');
    await expect(table.locator('tr[data-row-key="0"]')).toHaveAttribute('aria-rowindex', '2');
    const headerBefore = await head.boundingBox();
    const captionBefore = await caption.boundingBox();

    await region.focus();
    await region.press('PageDown');

    await expect(region).toBeFocused();
    await expect.poll(() => region.evaluate(node => node.scrollTop)).toBeGreaterThan(0);
    expect(await head.boundingBox()).toEqual(headerBefore);
    expect(await caption.boundingBox()).toEqual(captionBefore);
    await expect(table.locator('tr[data-row-key="79"]')).toHaveCount(0);

    await page.getByRole('button', { name: 'Toggle virtual' }).click();

    await expect(table.locator('tr[data-row-key]')).toHaveCount(80);
    await expect(region).not.toHaveAttribute('data-ant-table-virtual');
  });

test('virtual Table observes a mounted detail changing its height', async ({ page }) => {
  await page.goto('/?fixture=table-virtual&profile=expanded-details');
  const region = page.locator('[data-ant-table-virtual]');
  await region.locator('tr[data-row-key="0"] button').click();
  await expect(region.locator('[data-detail="0"]')).toBeVisible();

  await page.getByRole('button', { name: 'Resize details' }).click();
  await page.getByTestId('scroll-1').click();

  await expect(region.locator('[data-detail="0"]')).toHaveCSS('height', '181px');
  await expect.poll(() => region.evaluate(node => node.scrollTop)).toBe(27);
});

test('virtual Table scrolls from a drag on its vertical scrollbar', async ({ page }) => {
  await page.goto('/?fixture=table-virtual');
  const region = page.locator('[data-ant-table-virtual]');
  const thumb = page.locator('.ant-table-tbody-virtual-scrollbar-vertical')
    .locator('.ant-table-tbody-virtual-scrollbar-thumb');
  await expect(thumb).toBeVisible();
  const rect = await thumb.boundingBox();
  if (!rect) {
    throw new Error('Missing virtual scrollbar thumb');
  }
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 80, { steps: 4 });
  await expect.poll(() => region.evaluate(node => node.scrollTop)).toBeGreaterThan(1000);
  await page.mouse.up();

  await expect(region.locator('tr[data-row-key="0"]')).toHaveCount(0);
  await expect(page.locator('#table-virtual-fixture')).not.toHaveAttribute('data-scroll-count', '0');
});
