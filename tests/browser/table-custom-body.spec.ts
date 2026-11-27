import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-custom-body-reference.json' with { type: 'json' };
import wideGutter from './fixtures/ant-design-table-custom-body-gutter-reference.json'
  with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US', reducedMotion: 'reduce' });
const fixture = '/?fixture=table-custom-body&profile=';
const bodySelector = '[data-probe-body]';
const headerSelector = '[data-ant-table-custom-band="header"]';
type Action = NonNullable<(typeof source.cases)[number]['states'][number]['action']>;

/** Reads the alignment of the strips and the condition of the user body from DOM. */
function snapshot() {
  const root = document.querySelector('[data-custom-body-fixture]');
  if (!root) {
    throw new Error('Missing custom Table body fixture');
  }

  const body = root.querySelector<HTMLElement>('[data-probe-body]');
  const header = root.querySelector<HTMLElement>('[data-ant-table-custom-band="header"],'
    + '[data-ant-table-virtual]');
  const footer = root.querySelector<HTMLElement>('[data-ant-table-custom-band="summary"]');
  const summary = root.querySelector('[data-probe-summary]');
  const placement = footer?.contains(summary) ? 'bottom'
    : header?.contains(summary) ? 'top' : summary ? 'inline' : null;
  const sourceRows = (body ?? root).querySelectorAll<HTMLElement>('[data-row-key]');
  const cells = header?.querySelectorAll('thead th') ?? [];

  return {
    custom: body !== null,
    keys: Array.from(sourceRows, row => row.dataset.rowKey),
    top: body?.scrollTop ?? null,
    left: body?.scrollLeft ?? null,
    headerLeft: header?.scrollLeft ?? null,
    summaryLeft: footer?.scrollLeft ?? null,
    summary: placement,
    widths: Array.from(cells, node => Math.round(node.getBoundingClientRect().width)),
    scrollbar: body ? Number(body.dataset.scrollbar) : null,
    gutterWidth: body ? body.offsetWidth - body.clientWidth : null,
    empty: Boolean(root.querySelector('.ant-table-placeholder')),
    changes: JSON.parse(root.querySelector('[data-probe-changes]')?.textContent ?? '[]'),
    selected: JSON.parse(root.querySelector('[data-probe-keys]')?.textContent ?? '[]'),
    requests: JSON.parse(root.querySelector('[data-probe-requests]')?.textContent ?? '[]'),
    callbackCount: Number(root.querySelector('[data-probe-callbacks]')?.textContent)
  };
}

/** Interacts with public ref, table and scrolling of the owner. */
async function act(page: Page, action: Action, index: number) {
  const [kind, value] = action;
  switch (kind) {
    case 'scroll':
    case 'signal':
      await page.getByTestId(`${kind}-${index}`).dispatchEvent('click');
      return;
    case 'sort':
      await page.locator('.ant-table-column-sorters .ant-table-column-title').click();
      return;
    case 'page':
      await page.locator('.ant-pagination-next button').click();
      return;
    case 'select':
      await page.locator('thead input[type=checkbox]').check();
      return;
  }

  if (typeof value !== 'number') {
    throw new Error(`Missing offset for ${kind}`);
  }
  if (kind === 'left') {
    await page.locator(bodySelector).evaluate((node, left) => { node.scrollLeft = left; }, value);
  }
  else if (kind === 'wheel') {
    await page.locator(headerSelector).dispatchEvent('wheel', {
      deltaX: value, bubbles: true, cancelable: true
    });
  }
}

for (const { profile, states } of source.cases) {
  test(`Table custom scroll body matches Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    await expect(page.locator('[data-custom-body-fixture]')).toHaveAttribute('data-root-part', 'wrapper');
    const hasGutter = profile.gutter && await page.locator(bodySelector)
      .evaluate(node => node instanceof HTMLElement && node.offsetWidth > node.clientWidth);
    if (profile.gutter) {
      test.info().annotations.push({
        type: 'scrollbar', description: hasGutter ? 'visible' : 'hidden'
      });
    }
    const frames = hasGutter ? wideGutter.cases[0].states : states;
    for (const [index, { action, state }] of frames.entries()) {
      if (action) {
        await act(page, action, index - 1);
      }

      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} state ${index}`
      }).toEqual(state);
    }
  });
}

test('Table rebinds a custom body owner around the same focused editor', async ({ page }) => {
  await page.goto(fixture + 'dom');
  const body = page.locator(bodySelector);
  const editor = body.getByRole('textbox', { name: 'Editor' });
  const original = await editor.elementHandle();
  await editor.fill('Persistent draft');
  await editor.focus();

  await page.getByRole('button', { name: 'Use proxy', exact: true }).dispatchEvent('click');
  const scroll = page.getByRole('button', { name: 'Scroll to 43', exact: true });
  await scroll.dispatchEvent('click');

  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Persistent draft');
  expect(await editor.evaluate((node, previous) => node === previous, original)).toBe(true);
  const requests = page.locator('[data-probe-requests]');
  await expect(requests).toHaveText('[{"target":{"top":43},"receiver":true}]');

  await page.getByRole('button', { name: 'Use standard body', exact: true }).click();
  await expect(body).toHaveCount(0);
  await scroll.click();

  const content = page.locator('[data-ant-table-part="content"]');
  await expect.poll(() => content.evaluate(node => node.scrollTop)).toBe(43);
  await expect(requests).toHaveText('[{"target":{"top":43},"receiver":true}]');
});

test('Table hands the sticky scrollbar to the custom body and both bands', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 180 });
  await page.goto(fixture + 'sticky');
  await page.locator(headerSelector).evaluate(header => {
    window.scrollBy(0, header.getBoundingClientRect().top - 25);
  });
  const thumb = page.locator('.ant-table-sticky-scroll-bar');
  await expect(thumb).toBeVisible();
  const rect = await thumb.boundingBox();
  if (!rect) {
    throw new Error('Missing sticky scrollbar thumb');
  }

  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 35, y);
  await page.mouse.up();

  await expect.poll(async () => {
    const { left, headerLeft, summaryLeft } = await page.evaluate(snapshot);
    return Boolean(left && left > 0 && left === headerLeft && left === summaryLeft);
  }).toBe(true);
});
