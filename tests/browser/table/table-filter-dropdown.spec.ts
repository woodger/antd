import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-filter-dropdown-reference.json' with { type: 'json' };

test.use({ viewport: source.reference.viewport, locale: 'en-US' });

const fixture = '/?fixture=table-filter-dropdown';

/** Removes the content and events on the public panel, including after transfer to the portal. */
function snapshot() {
  const root = document.getElementById('table-filter-dropdown-fixture');
  if (!root) {
    throw new Error('Missing Table filter dropdown fixture');
  }

  const panels = document.querySelectorAll('[data-ant-table-filter-part="dropdown"]');
  const dropdown = Array.from(panels).find(node => node.getClientRects().length > 0);
  const surface = dropdown?.closest<HTMLElement>('[data-ant-dropdown-popup]');
  const custom = dropdown?.querySelector('[data-custom-panel]');
  const choices = dropdown && !custom
    ? Array.from(dropdown.querySelectorAll<HTMLInputElement>('input[type="radio"]'), input => ({
      text: input.labels?.[0]?.textContent?.trim() ?? '', checked: input.checked
    }))
    : [];
  const rows = Array.from(root.querySelectorAll<HTMLElement>('tbody tr[data-row-key]'),
    row => Number(row.dataset.rowKey));
  const changes = JSON.parse(root.querySelector('[data-filter-dropdown-changes]')?.textContent ?? '[]');

  return {
    open: Boolean(dropdown),
    placement: surface?.dataset.antDropdownPlacement ?? null,
    wrapped: Boolean(dropdown?.closest('[data-custom-wrap]')),
    note: dropdown?.querySelector('[data-filter-note]')?.textContent ?? null,
    icon: root.querySelector('[data-filter-icon]')?.getAttribute('data-filter-icon') ?? null,
    custom: custom ? {
      prefix: custom.getAttribute('data-custom-prefix'),
      keys: JSON.parse(custom.getAttribute('data-custom-keys') ?? '[]'),
      options: JSON.parse(custom.getAttribute('data-custom-options') ?? 'null'),
      visible: custom.getAttribute('data-custom-visible') === 'true'
    } : null,
    choices, rows, changes
  };
}

/** Repeats the action of the run React through the button and the contents of the filter Svelte. */
async function act(page: Page, action: string) {
  const trigger = page.getByRole('button', { name: 'Filter: Score', exact: true });
  if (action === 'trigger') {
    await trigger.click();
    return;
  }
  if (action === 'hover') {
    await trigger.hover();
    await page.getByRole('button', { name: 'Apply custom', exact: true }).waitFor();
    return;
  }
  if (action === 'odd' || action === 'even') {
    await page.getByText(action === 'odd' ? 'Odd score' : 'Even score', { exact: true }).click();
    return;
  }
  if (action === 'menu-odd') {
    await page.getByRole('menuitem', { name: 'Odd command', exact: true }).click();
    return;
  }

  const labels: Record<string, string> = {
    outside: 'Outside',
    'hover-outside': 'Outside',
    'owner-open': 'Owner open',
    'owner-close': 'Owner close',
    apply: 'Apply custom',
    'apply-keep': 'Apply and keep',
    'reset-keep': 'Reset and keep',
    'reset-close': 'Reset and close',
    dismiss: 'Dismiss custom'
  };
  const target = page.getByRole('button', { name: labels[action], exact: true });
  if (action === 'hover-outside') {
    await target.hover();
    await page.getByRole('button', { name: 'Apply custom', exact: true }).waitFor({ state: 'hidden' });
  }
  else {
    await target.click();
  }
}

for (const { profile, states } of source.cases) {
  test(`Table filter dropdown matches Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }

      // Saves the format TableChange, which lists active criteria.
      const changes = state.changes.map(event => 'filters' in event && event.filters
        ? { ...event, filters: Object.fromEntries(Object.entries(event.filters)
          .filter(([, keys]) => keys?.length)) }
        : event);
      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} ${action ?? 'initial'}`
      }).toEqual({ ...state, changes });
    }
  });
}

test('Table accepts typed criteria chosen by a custom filter outside the suggested list', async ({
  page
}) => {
  await page.goto(`${fixture}&profile=custom-typed`);
  await act(page, 'trigger');
  await page.getByRole('button', { name: 'Typed criteria', exact: true }).click();
  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    custom: { keys: [false, 0], options: ['even', 'odd'] }, rows: [0, 1, 2]
  });

  await act(page, 'apply');

  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    open: false, rows: [0, 2], changes: [
      { open: true }, { open: false }, { filters: { score: [false, 0] }, rows: [0, 2] }
    ]
  });
});

test('Server Table reports a custom criterion without filtering the supplied page', async ({ page }) => {
  await page.goto(`${fixture}&profile=custom-remote`);
  await act(page, 'trigger');
  await act(page, 'odd');

  await act(page, 'apply');

  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    open: false, rows: [0, 1, 2], changes: [
      { open: true }, { open: false }, { filters: { score: ['odd'] }, rows: [0, 1, 2] }
    ]
  });
});

test('An open custom filter follows a controlled value and emits only the requested selection', async ({
  page
}) => {
  await page.goto(`${fixture}&profile=custom-values`);
  await act(page, 'trigger');
  await act(page, 'odd');

  await act(page, 'apply-keep');

  const changes = [{ open: true }, { filters: { score: ['odd'] }, rows: [1] }];
  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    open: true, rows: [0, 2], changes
  });
  await act(page, 'even');
  await page.getByRole('button', { name: 'Owner values', exact: true }).dispatchEvent('click');
  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    open: true, custom: { keys: ['odd'] }, rows: [1], changes
  });
});

test('The filter container and dropdown prefix follow the column options', async ({ page }) => {
  await page.goto(`${fixture}&profile=custom-container`);
  const trigger = page.getByRole('button', { name: 'Filter: Score', exact: true });

  await trigger.click();

  const host = page.locator('[data-custom-popup-host]');
  const popup = host.getByRole('dialog', { name: 'Filter: Score', exact: true });
  await expect(popup).toHaveClass(/filter-hosted/);
  await expect(popup).toHaveAttribute('data-ant-dropdown-prefix', 'filter-surface');
  await expect(popup.locator('[data-custom-panel]')).toHaveAttribute('data-custom-prefix', 'choices-custom');
  const content = popup.locator('[data-ant-table-filter-part="dropdown"]');
  await expect(content).toBeFocused();

  await content.press('Escape');

  await expect(popup).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const destroy of [false, true]) {
  test(`Table filter applies destroyOnHidden=${destroy} to the panel input`, async ({ page }) => {
    const profile = destroy ? 'custom-destroy' : 'custom-retain';
    await page.goto(`${fixture}&profile=${profile}`);
    await act(page, 'trigger');
    const input = page.getByRole('textbox', { name: 'Panel draft', exact: true });
    await input.fill('Draft text');

    await act(page, 'dismiss');
    await expect(input).toBeHidden();
    await act(page, 'trigger');

    await expect(input).toHaveValue(destroy ? '' : 'Draft text');
    await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
      open: true, rows: [0, 1, 2], changes: [{ open: true }, { open: false }, { open: true }]
    });
  });
}

test('A force-rendered filter receives its initial keys while the popup is hidden', async ({ page }) => {
  await page.goto(`${fixture}&profile=custom-force`);
  const content = page.locator('[data-custom-panel]');
  await expect(content).toHaveAttribute('data-custom-keys', '["even"]');
  await expect(content).toHaveAttribute('data-custom-visible', 'false');
  await expect(content).toBeHidden();
  const initial = await content.elementHandle();

  await act(page, 'trigger');

  await expect(content).toBeVisible();
  await expect(content).toHaveAttribute('data-custom-visible', 'true');
  expect(await content.evaluate((node, before) => node === before, initial)).toBe(true);
  await expect.poll(() => page.evaluate(snapshot)).toMatchObject({
    open: true, rows: [0, 2], changes: [{ open: true }]
  });
});
