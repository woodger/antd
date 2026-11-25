import { expect, test } from './test';
import source from './fixtures/ant-design-table-filter-static-content-reference.json' with { type: 'json' };

const fixture = '/?fixture=table-filter-static-content&profile=';
const filterName = 'Filter: Value';
test.use({ viewport: { width: 820, height: 550 }, reducedMotion: 'reduce' });

/** Снимает иконку, индикацию фильтра и ключи строк перед открытием панели. */
function snapshotTable() {
  const root = document.getElementById('table-filter-static-content-fixture');
  if (!root) {
    throw new Error('Missing Table static filter content fixture');
  }

  const button = root.querySelector('[data-ant-table-filter-part="trigger"]');
  const trigger = button && {
    text: button.textContent.trim(),
    marks: Array.from(button.querySelectorAll('[data-probe-node]'),
      mark => mark.getAttribute('data-probe-node')),
    active: button.classList.contains('active'),
    defaultIcon: Boolean(button.querySelector(':scope > svg'))
  };
  const rows = Array.from(root.querySelectorAll('tbody tr[data-row-key]'),
    row => row.getAttribute('data-row-key'));
  return { trigger, rows };
}

/** Читает содержимое открытого popover, включая состояние пустой пользовательской панели. */
function snapshotPanel() {
  const popup = document.querySelector('[data-ant-dropdown-popup]:popover-open');
  const panel = popup?.querySelector('[data-ant-table-filter-part="dropdown"]');
  if (!panel) {
    return null;
  }

  const options = Array.from(panel.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    option => option.labels?.[0]?.textContent?.trim() ?? '');
  const hasFilters = options.length > 0;
  return {
    text: hasFilters ? null : panel.textContent.trim(),
    marks: Array.from(panel.querySelectorAll('[data-probe-node]'),
      mark => mark.getAttribute('data-probe-node')),
    hasFilters,
    options,
    commands: Array.from(panel.querySelectorAll('button'), button => button.textContent.trim())
  };
}

for (const { profile, initial, panel, changes } of source.cases) {
  test(`Table matches Ant Design static filter content for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const trigger = page.getByRole('button', { name: filterName, exact: true });

    await expect.poll(() => page.evaluate(snapshotTable)).toEqual(initial);
    if (initial.trigger) {
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await trigger.click();

      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      // Подписи вариантов и команд проверяются независимо от пробелов между контролами.
      const expectedPanel = panel?.hasFilters ? { ...panel, text: null } : panel;
      await expect.poll(() => page.evaluate(snapshotPanel)).toEqual(expectedPanel);

      await page.getByRole('button', { name: 'Outside', exact: true }).click();

      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect.poll(() => page.evaluate(snapshotPanel)).toBeNull();
    }
    else {
      await expect(trigger).toHaveCount(0);
    }
    await expect(page.locator('[data-open-events]')).toHaveText(JSON.stringify(changes));
    await expect(page.locator('[data-filter-changes]')).toHaveText('[]');
  });
}

test('Table uses the current panel when deciding whether to apply a draft on close', async ({
  page
}) => {
  await page.goto(fixture + 'transition');
  const trigger = page.getByRole('button', { name: filterName, exact: true });
  await trigger.press('Enter');
  const panel = page.getByRole('dialog', { name: filterName, exact: true });
  const original = await panel.elementHandle();
  const rows = page.locator('tbody tr[data-row-key]');
  const option = panel.getByRole('radio', { name: 'Alpha only', exact: true });
  await option.press('Space');
  await expect(option).toBeChecked();

  await page.getByRole('button', { name: 'Use static panel', exact: true }).dispatchEvent('click');

  await expect(panel).toHaveText('Panel 0');
  expect(await panel.evaluate((node, before) => node === before, original)).toBe(true);
  await panel.press('Escape');
  await expect(panel).toBeHidden();
  await expect(rows).toHaveCount(2);
  const openEvents = page.locator('[data-open-events]');
  const changes = page.locator('[data-filter-changes]');
  await expect(openEvents).toHaveText('[true,false]');
  await expect(changes).toHaveText('[]');

  await page.getByRole('button', { name: 'Use option list', exact: true }).dispatchEvent('click');
  await trigger.press('Enter');
  await expect(option).not.toBeChecked();
  await option.press('Space');
  await option.press('Enter');

  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(openEvents).toHaveText('[true,false,true,false]');
  await expect(changes).toHaveText('[{"filters":{"value":["Alpha"]},"rows":["a"]}]');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute('data-row-key', 'a');
});
