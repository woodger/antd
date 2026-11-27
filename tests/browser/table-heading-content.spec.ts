import { expect, test } from './test';
import source from './fixtures/ant-design-table-heading-content-reference.json' with { type: 'json' };
import { expectedTableHeadingContent } from './fixtures/table-heading-content-observations';

const fixture = '/?fixture=table-heading-content&profile=';
test.use({ viewport: { width: 880, height: 550 }, reducedMotion: 'reduce' });

/** Reads the real titles, label and order of the lines. */
function snapshot() {
  const root = document.getElementById('table-heading-content-fixture');
  if (!root) {
    throw new Error('Missing Table heading content fixture');
  }

  /** Notes the built-in markings in the order of withdrawal. */
  function readMarkers(node: Element) {
    const selector = '[data-probe-title]:not([data-ant-dropdown-popup] *)';
    return Array.from(node.querySelectorAll<HTMLElement>(selector),
      marker => marker.dataset.probeTitle);
  }

  const headings = Array.from(root.querySelectorAll<HTMLTableCellElement>('thead th'), node => ({
    text: node.innerText.trim(),
    marks: readMarkers(node),
    checkboxes: node.querySelectorAll('input[type="checkbox"]').length,
    title: node.getAttribute('title'),
    menu: Boolean(node.querySelector('.ant-table-selection-extra'))
  }));
  const caption = root.querySelector('table caption');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('tbody tr[data-row-key]'),
    row => row.dataset.rowKey);
  return {
    caption: caption && { text: caption.textContent, marks: readMarkers(caption) },
    headers: headings,
    rows
  };
}

for (const { profile, initial, sort, command } of source.cases) {
  test(`Table matches Ant Design heading content for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);

    await expect.poll(() => page.evaluate(snapshot))
      .toEqual(expectedTableHeadingContent(profile, initial));

    if (sort) {
      const heading = page.locator('thead [data-probe-title="Data"]');
      await heading.click();

      await expect(heading.locator('xpath=ancestor::th')).toHaveAttribute('aria-sort', sort.order);
      await expect.poll(() => page.evaluate(snapshot)).toMatchObject({ rows: sort.rows });
    }
    if (command) {
      const trigger = page.getByRole('button', { name: 'Selection actions', exact: true });
      const item = page.getByRole('menuitem', { name: command.text, exact: true });
      await expect(item).toBeHidden();

      await trigger.press('ArrowDown');

      await expect(item).toBeFocused();
      await expect(item.locator('[data-probe-title="command"]')).toHaveCount(command.marker);

      await item.press('Enter');

      await expect(item).toBeHidden();
      await expect(trigger).toBeFocused();
      await expect(page.locator('[data-heading-events]')).toHaveText(JSON.stringify(command.events));
    }
  });
}

test('Table keeps accessible fallbacks for empty array headings and caption', async ({ page }) => {
  await page.goto(fixture + 'empty-array');
  const root = page.locator('#table-heading-content-fixture');
  const caption = root.locator('caption');

  await expect(root.locator('[data-ant-table-part="content"]')).toHaveAccessibleName('Report');
  await expect(caption).toBeEmpty();
  expect(await caption.evaluate(node => node.getBoundingClientRect().height)).toBe(0);
  await expect(root.getByRole('columnheader', { name: 'Expand column', exact: true })).toBeVisible();
  await expect(root.getByRole('button', { name: 'data', exact: true })).toBeVisible();
});
