import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-summary-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const root = '#table-summary-fixture';
const scrollport = `${root} [data-ant-table-part="content"]`;

type Sample = (typeof source.cases)[number];
type Action = NonNullable<Sample['states'][number]['action']>;

/** Opens fixture outside the general elements of the stand, as in the measurement of Source. */
async function open(page: Page, query: string) {
  await page.goto(`/select-components-hydration.html?${query}`);
  await page.addScriptTag({ type: 'module', url: '/table-summary.client.ts' });
}

/** Measures bands and cell positions in the logical coordinates of a common table. */
function snapshot(rtl: boolean) {
  const viewport = document.querySelector<HTMLDivElement>(
    '#table-summary-fixture [data-ant-table-part="content"]'
  );
  const table = viewport?.querySelector('table');
  if (!viewport || !table) {
    throw new Error('Missing summary table');
  }

  const rect = viewport.getBoundingClientRect();
  const head = table.tHead;
  const headerTop = head?.rows[0]?.cells[0]?.getBoundingClientRect().top ?? null;
  const headHeight = head?.offsetHeight ?? 0;
  const foot = table.tFoot;
  const summaryTop = foot?.getBoundingClientRect().top ?? null;
  const summaryHeight = foot?.offsetHeight ?? 0;
  const placement = foot?.dataset.fixed;
  const rows = Array.from(foot?.rows ?? [], row => ({
    keys: JSON.parse(row.dataset.summaryKeys ?? 'null'),
    cells: Array.from(row.cells, cell => {
      const bounds = cell.getBoundingClientRect();
      const fixed = cell.className.includes('-cell-fix-start') ? 'start'
        : cell.className.includes('-cell-fix-end') ? 'end' : null;
      return {
        text: cell.innerText.trim(),
        colSpan: cell.colSpan,
        rowSpan: cell.rowSpan,
        fixed,
        align: getComputedStyle(cell).textAlign,
        x: rtl ? rect.right - bounds.right : bounds.left - rect.left,
        width: bounds.width
      };
    })
  }));
  const bar = viewport.parentElement?.querySelector('.ant-table-sticky-scroll');
  const barRect = bar?.getBoundingClientRect();
  const virtualTrack = viewport.parentElement?.querySelector(
    '.ant-table-tbody-virtual-scrollbar-vertical'
  );
  const trackRect = virtualTrack?.getBoundingClientRect();
  return {
    rows, headerTop, headHeight, summaryTop, summaryHeight,
    clip: [
      rect.top + headHeight + (placement === 'top' ? summaryHeight : 0),
      viewport.clientHeight - headHeight - (placement ? summaryHeight : 0)
    ],
    viewportEnd: rect.top + viewport.clientHeight,
    stickyBar: barRect ? [barRect.top, barRect.height] : null,
    virtualBar: trackRect ? [trackRect.top, trackRect.height] : null,
    positions: [
      viewport.scrollTop, viewport.scrollLeft, window.scrollY,
      document.querySelector('#summary-owner')?.scrollTop ?? 0
    ],
    keys: Array.from(table.querySelectorAll<HTMLElement>('[data-ant-table-part="row"]'),
      row => row.dataset.rowKey)
  };
}

/** Performs scrolling of the desired owner and actions over the current page. */
async function act(page: Page, action: Action, scrollIndex: number) {
  if ('scroll' in action && action.scroll) {
    await page.getByTestId(`summary-scroll-${scrollIndex}`).click();
  }
  else if ('wheel' in action && action.wheel) {
    const { clip, headerTop, headHeight } = await page.evaluate(snapshot, false);
    const y = Math.max(clip[0], (headerTop ?? 0) + headHeight) + 40;
    await page.mouse.move(200, Math.min(330, y));
    await page.mouse.wheel(action.wheel[0], action.wheel[1]);
  }
  else if ('page' in action && action.page) {
    await page.evaluate(top => window.scrollTo({ top }), action.page);
  }
  else if ('outer' in action && action.outer) {
    await page.locator('#summary-owner').evaluate((owner, top) => { owner.scrollTop = top; },
      action.outer);
  }
  else if ('sort' in action && action.sort) {
    await page.getByRole('button', { name: 'Rank' }).click();
  }
  else if ('next' in action && action.next) {
    await page.locator(`${root} .ant-pagination-next button`).click();
  }
}

/** Compares the values and available cells. Geometry is checked for each profile. */
function values(
  rows: ReturnType<typeof snapshot>['rows'] | Sample['states'][number]['state']['rows']
) {
  return rows.map(({ keys, cells }) => ({
    keys,
    cells: cells.map(({ x: _x, width: _width, ...cell }) => cell)
  }));
}

for (const { profile, states } of source.cases) {
  test(`Table summary matches the ${profile.id} scenario`, async ({ page }) => {
    await open(page, `profile=${profile.id}`);
    const table = page.locator(`${root} table`);
    await expect(table).toHaveCount(1);
    await expect(table.locator(':scope > tfoot > tr')).toHaveCount(2);
    let scrollIndex = 0;

    for (const { action, state: sourceState } of states) {
      if (action) {
        await act(page, action, scrollIndex);
        if ('scroll' in action && action.scroll) scrollIndex++;
      }

      await expect(async () => {
        const native = await page.evaluate(snapshot, Boolean(profile.rtl));
        expect(native.keys).toEqual(sourceState.keys);
        expect(native.headerTop).toBe(sourceState.headerTop);
        expect(native.stickyBar).toEqual(sourceState.stickyBar);
        if (action && 'page' in action) expect(native.positions[2]).toBe(sourceState.positions[2]);
        if (action && 'outer' in action) expect(native.positions[3]).toBe(sourceState.positions[3]);

        if (!sourceState.rows.length) {
          // Source loses tfoot in two modes. Native table retains the outcome of the whole page.
          expect(native.rows[0].keys).toEqual(Array.from({ length: profile.count }, (_, key) => key));
          expect(native.rows[0].cells[1].text).toBe(String(profile.count * (profile.count + 1) / 2));
          if (profile.headerless) {
            expect(native.summaryTop).toBe(170);
            expect(native.positions[0]).toBe(sourceState.positions[0]);
          }
          else {
            expect(native.positions[0]).toBe(sourceState.positions[0]);
            expect(native.summaryTop).toBeGreaterThanOrEqual(native.viewportEnd);
          }
          return;
        }

        expect(values(native.rows)).toEqual(values(sourceState.rows));
        expect(native.summaryHeight).toBe(sourceState.summaryHeight);
        for (const [index, measured] of native.rows[0].cells.entries()) {
          const expected = sourceState.rows[0].cells[index];
          expect(Math.abs(measured.width - expected.width)).toBeLessThan(1);
          expect(Math.abs(measured.x - expected.x)).toBeLessThan(1);
        }

        if (profile.id === 'scrolling' && action) {
          // scroll.y in the native table includes a cap. At the end, the limits of the result and viewport coincide.
          expect((native.summaryTop ?? 0) + native.summaryHeight).toBe(native.viewportEnd);
        }
        else {
          expect(native.summaryTop).toBe(sourceState.summaryTop);
          expect(native.positions[0]).toBe(sourceState.positions[0]);
        }

        if (profile.fixed && profile.y) {
          expect(native.clip).toEqual(sourceState.clip);
        }
        if (profile.virtual && profile.fixed) {
          expect(native.virtualBar).toEqual(sourceState.clip);
        }
      }).toPass({ timeout: 3000 });
    }
  });
}

test('Table summary sees filtered records and invokes the snippet for an empty page', async ({
  page
}) => {
  await open(page, 'profile=current-page&filter');
  await expect(page.locator(`${root} tfoot tr`).first())
    .toHaveAttribute('data-summary-keys', '[0,2,4,6,8]');

  await open(page, 'profile=current-page&empty');
  await expect(page.locator(`${root} tfoot tr`).first())
    .toHaveAttribute('data-summary-keys', '[]');
  await expect(page.locator(`${root} tfoot tr`).first().locator('td').nth(1)).toHaveText('0');
});

test('Table summary accounts for service columns and inherits the local prefix', async ({ page }) => {
  await open(page, 'profile=fixed-bottom&prefix=sample-grid&services');
  const footer = page.locator(`${root} tfoot.sample-grid-summary`);
  const service = footer.getByRole('cell', { name: 'Controls' });
  const grouping = footer.getByRole('cell', { name: 'Page' });

  await expect(service).toHaveAttribute('colspan', '2');
  await expect(service).toHaveClass(/sample-grid-cell-fix-start/);
  await expect(footer.getByRole('cell', { name: 'Total' }))
    .toHaveClass(/sample-grid-cell-fix-start/);
  await expect(grouping).toHaveAttribute('colspan', '4');
  await expect(grouping).not.toHaveClass(/sample-grid-cell-fix-/);
});

test('Table keyboard scrolling reaches a summary taller than the virtual body', async ({ page }) => {
  await open(page, 'profile=virtual-static&tall');
  const viewport = page.locator(scrollport);
  const last = page.getByRole('button', { name: 'Last summary control' });

  await viewport.press('End');

  await expect(last).toBeInViewport({ ratio: 1 });
  await expect(viewport).toBeFocused();
  await expect(viewport.locator('[data-ant-table-part="row"]').last())
    .toHaveAttribute('data-row-key', '45');

  await viewport.press('Home');

  await expect(viewport.locator('[data-ant-table-part="row"]').first())
    .toHaveAttribute('data-row-key', '0');
  await expect(last).not.toBeInViewport();
});

test('Table sticky scrollbar drags the body and detaches when sticky is disabled', async ({
  page
}) => {
  await open(page, 'profile=sticky-document&summary-offset=96&prefix=sample-grid&bar-theme');
  const bar = page.locator(`${root} .sample-grid-sticky-scroll`);
  const thumb = bar.locator('.sample-grid-sticky-scroll-bar');
  const viewport = page.locator(scrollport);
  const foot = viewport.locator('tfoot');
  await page.evaluate(() => window.scrollTo({ top: 225 }));
  await expect.poll(async () => (await foot.boundingBox())?.y).toBe(396);
  await expect(bar).toBeVisible();
  await expect(thumb).toHaveCSS('background-color', 'rgb(12, 34, 56)');
  await expect(thumb).toHaveCSS('border-radius', '4px');

  const bounds = await thumb.boundingBox();
  if (!bounds) {
    throw new Error('Missing sticky scrollbar thumb');
  }
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 50, y, { steps: 4 });
  await page.mouse.up();

  await expect.poll(() => viewport.evaluate(node => node.scrollLeft)).toBe(75);
  await expect.poll(() => page.evaluate(snapshot, false).then(state => state.rows[0].cells[1].x))
    .toBe(45);

  await page.getByRole('button', { name: 'Sticky', exact: true }).click();

  await expect(bar).toHaveCount(0);
  await expect.poll(() => viewport.evaluate(node =>
    node.style.getPropertyValue('--ant-table-sticky-head-top'))).toBe('');
  await expect(foot).not.toHaveAttribute('data-fixed');

  await page.getByRole('button', { name: 'Sticky', exact: true }).click();
  await expect(bar).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: 0 }));
  await page.setViewportSize({ width: 1000, height: 1700 });
  await expect(bar).toHaveCount(0);
});
