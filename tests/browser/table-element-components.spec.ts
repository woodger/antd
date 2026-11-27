import type { Page } from '@playwright/test';
import { expect, test } from './test';
import source from './fixtures/ant-design-table-element-components-reference.json' with { type: 'json' };

test.use({ viewport: { width: 880, height: 550 }, locale: 'en-US', reducedMotion: 'reduce' });
const fixture = '/?fixture=table-element-components&profile=';
const viewport = '[data-ant-table-part="content"]';
type Capture = (typeof source.cases)[number]['states'][number]['state'];
type Node = Capture['nodes'][number];

/** Saves the purpose of the slot and the structure of the native table in the virtual window. */
function nativeNode(node: Node): Node {
  if (node.tag !== 'div') {
    return node;
  }

  const tag = node.slot === 'body.wrapper' ? 'tbody'
    : node.slot === 'body.row' ? 'tr' : node.scope ? 'th' : 'td';
  return { ...node, tag };
}

/** Reads the real substituted elements, nesting and coordinates of the three stripes. */
function captureGeometry(wide: boolean) {
  const root = document.querySelector('[data-table-elements-fixture]');
  if (!root) {
    throw new Error('Missing Table element fixtures');
  }

  const nodes = root.querySelectorAll<HTMLElement>('[data-probe-slot]');
  const observed = Array.from(nodes, node => {
    const parent = node.parentElement?.closest<HTMLElement>('[data-probe-slot]');
    return {
      slot: node.dataset.probeSlot,
      tag: node.localName,
      parent: parent?.dataset.probeSlot ?? null,
      key: node.getAttribute('data-row-key'),
      scope: node.getAttribute('scope'),
      role: node.getAttribute('role'),
      data: node.getAttribute('data-probe-data'),
      empty: Boolean(node.closest('.ant-table-placeholder'))
    };
  });
  const events = JSON.parse(root.querySelector('[data-table-element-events]')?.textContent ?? '[]');
  if (!wide) {
    return { nodes: observed, events };
  }

  const body = root.querySelector('[data-ant-table-part="content"]');
  const header = root.querySelector('[data-ant-table-custom-band="header"]');
  const summary = root.querySelector('[data-ant-table-custom-band="summary"]');
  const headerCells = header?.querySelectorAll('thead th') ?? [];
  return {
    nodes: observed, events,
    geometry: [
      body?.scrollLeft, header?.scrollLeft, summary?.scrollLeft,
      ...Array.from(headerCells, node => Math.round(node.getBoundingClientRect().width))
    ]
  };
}

/** Performs actions through current elements and public ref Table. */
async function act(page: Page, action: string) {
  if (action === 'sort') {
    await page.locator('.ant-table-column-sorters .ant-table-column-title').click();
  }
  else if (action === 'row') {
    await page.locator('[data-probe-slot="body.row"][data-row-key="0"]').click();
  }
  else if (action === 'scroll') {
    await page.getByRole('button', { name: 'Scroll to 32', exact: true }).dispatchEvent('click');
  }
  else if (action === 'right') {
    await page.locator(viewport).evaluate(node => { node.scrollLeft = 121; });
  }
  else if (action === 'wheel') {
    await page.locator('[data-ant-table-custom-band="header"]').dispatchEvent('wheel', {
      deltaX: 29, bubbles: true, cancelable: true
    });
  }
}

for (const { profile, states } of source.cases) {
  test(`Table element components match Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    await expect(page.locator('[data-table-elements-fixture]'))
      .toHaveAttribute('data-root-part', 'wrapper');

    for (const [index, { action, state }] of states.entries()) {
      if (action) {
        await act(page, action);
      }

      const expected = { ...state, nodes: state.nodes.map(nativeNode) };
      await expect.poll(() => page.evaluate(captureGeometry, Boolean(profile.width)), {
        message: `${profile.id} state ${index}`
      }).toEqual(expected);
    }
  });
}

test('Table accepts an HTML tag as a body cell replacement', async ({ page }) => {
  await page.goto(fixture + 'single&string-tag');
  const row = page.locator('[data-probe-slot="body.row"][data-row-key="0"]');

  await expect(row.locator('th')).toHaveCount(2);
  await expect(row.locator('th[scope="row"]')).toHaveText('Row 0');
  await expect(row.locator('th[data-probe-data="key-0"]')).toHaveText('0');
  await row.click();
  await expect(page.locator('[data-table-element-events]')).toHaveText('[["row",0]]');
});

test('Table measures replaced virtual rows after their renderer and viewport change', async ({
  page
}) => {
  await page.goto(fixture + 'virtual');
  const content = page.locator(viewport);
  const target = content.locator('tr[data-row-key="32"]');
  await page.getByRole('button', { name: 'Replace renderer', exact: true }).dispatchEvent('click');
  await page.getByRole('button', { name: 'Resize viewport', exact: true }).dispatchEvent('click');

  await act(page, 'scroll');

  await expect(target).toHaveAttribute('data-alternate-row', 'true');
  await expect.poll(() => target.evaluate(node => {
    const holder = node.closest('[data-ant-table-part="content"]');
    return holder ? Math.round(node.getBoundingClientRect().top - holder.getBoundingClientRect().top)
      : null;
  })).toBe(0);
  await expect(content.locator('tr[data-row-key]')).not.toHaveCount(40);
  await expect.poll(() => content.evaluate(node => {
    const bars = node.parentElement?.querySelector('.table-virtual-bars');
    if (!bars) {
      throw new Error('Missing virtual scrollbars');
    }
    return Math.round(bars.getBoundingClientRect().bottom - node.getBoundingClientRect().bottom);
  })).toBe(0);
});

for (const direction of ['ltr', 'rtl']) {
  test(`Table reveals the focused header control and aligns the ${direction} bands`, async ({
    page
  }) => {
    await page.goto(fixture + 'fixed-wide');
    if (direction === 'rtl') {
      await page.getByLabel('Right to left', { exact: true }).check();
    }

    const body = page.locator(viewport);
    const header = page.locator('[data-ant-table-custom-band="header"]');
    const summary = page.locator('[data-ant-table-custom-band="summary"]');
    const button = header.getByRole('button', { name: 'Name', exact: true });
    const initialLeft = direction === 'rtl' ? -230 : 230;

    /** A negative number means that part of the button is closed by the lane boundary. */
    const visibleGap = () => button.evaluate(node => {
      const band = node.closest('[data-ant-table-custom-band="header"]');
      if (!band) {
        throw new Error('Missing fixed header');
      }
      const bounds = band.getBoundingClientRect();
      const rect = node.getBoundingClientRect();
      return Math.min(rect.left - bounds.left, bounds.right - rect.right);
    });

    await body.evaluate((node, left) => { node.scrollLeft = left; }, initialLeft);
    await expect.poll(() => header.evaluate(node => node.scrollLeft)).toBe(initialLeft);
    await expect.poll(visibleGap).toBeLessThan(-1);

    await body.press('Shift+Tab');

    await expect(button).toBeFocused();
    await expect.poll(visibleGap).toBeGreaterThanOrEqual(-1);
    const left = await header.evaluate(node => node.scrollLeft);
    await expect.poll(() => body.evaluate(node => node.scrollLeft)).toBe(left);
    await expect.poll(() => summary.evaluate(node => node.scrollLeft)).toBe(left);
  });
}
