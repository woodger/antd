import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import source from '../fixtures/ant-design-table-semantic-reference.json' with { type: 'json' };
import { expectedTableSemantics } from '../fixtures/table-semantic-reference';

test.use({ viewport: source.reference.viewport, locale: 'en-US' });
const fixture = '/?fixture=table-semantic';

/** Removes table slots and portable panel without hashes CSS themes. */
function snapshot() {
  const root = document.getElementById('table-semantic-fixture');
  if (!root) {
    throw new Error('Missing Table semantic fixture');
  }

  /** Classes of the theme and internal layout are excluded from the comparison. */
  function markers(node: Element | null | undefined) {
    return Array.from(node?.classList ?? []).filter(name => name.startsWith('observed-'));
  }

  const nodes = root.querySelectorAll<HTMLElement>(
    '[class*="observed-"],[style*="--observed-slot"]'
  );
  // A native popover can be inside the tables DOM and measured separately.
  const tableNodes = Array.from(nodes).filter(node => !node.closest('[data-ant-dropdown-popup]'));
  const semantic = tableNodes.map(node => {
    const parent = node.tagName === 'LI' ? node.closest('nav') : node.parentElement;
    return {
      tag: node.tagName.toLowerCase(),
      classes: markers(node),
      value: node.style.getPropertyValue('--observed-slot').trim(),
      providerValue: node.style.getPropertyValue('--observed-provider-slot').trim(),
      row: node.closest('[data-row-key]')?.getAttribute('data-row-key') ?? null,
      parent: markers(parent)
    };
  });
  const popup = document.querySelector('[data-ant-dropdown-popup]:popover-open');
  const content = tableNodes.find(node => markers(node).some(name => name.endsWith('-content')));

  return {
    semantic,
    popupClasses: markers(popup),
    contentLimit: content ? [content.style.maxHeight, content.style.scrollPaddingTop] : null,
    title: root.querySelector('.ant-table-title')?.textContent ?? null,
    footer: root.querySelector('.ant-table-footer')?.textContent ?? null
  };
}

/** Repeats change props or opening the filter from the React. */
async function act(page: Page, action: string) {
  const labels: Record<string, string> = {
    filter: 'Filter: Name',
    outside: 'Outside',
    update: 'Update semantics',
    restore: 'Restore semantics'
  };
  await page.getByRole('button', { name: labels[action], exact: true }).click();
}

for (const { profile, states } of source.cases) {
  test(`Table semantic slots match Ant Design for ${profile.id}`, async ({ page }) => {
    await page.goto(`${fixture}&profile=${profile.id}`);

    for (const { action, state } of states) {
      if (action) {
        await act(page, action);
      }

      await expect.poll(() => page.evaluate(snapshot), {
        message: `${profile.id} ${action ?? 'initial'}`
      }).toEqual(expectedTableSemantics(profile.id, state));
    }
  });
}

test('Live table semantics keep the edited cell, its draft and caller styles', async ({ page }) => {
  await page.goto(`${fixture}&profile=reactive`);
  const editor = page.getByRole('textbox', { name: 'Name 0', exact: true });
  const cell = editor.locator('..');
  const original = await editor.elementHandle();
  await editor.fill('Uncommitted value');
  await editor.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 5));

  await page.getByRole('button', { name: 'Update semantics', exact: true }).dispatchEvent('click');

  await expect(cell).toHaveClass(/observed-updated-body-cell/);
  await expect(cell).toHaveClass(/observed-caller-cell/);
  await expect(cell).not.toHaveClass(/observed-local-body-cell/);
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Uncommitted value');
  expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  expect(await editor.evaluate((input: HTMLInputElement) => [
    input.selectionStart, input.selectionEnd
  ])).toEqual([2, 5]);

  const header = page.locator('thead tr');
  const pager = page.locator('nav.observed-updated-pager');
  await expect(header).toHaveCSS('--caller-header-row', 'kept');
  await expect(pager).toHaveCSS('--pager-owner-size', '3');
  await expect(pager).toHaveCSS('--observed-slot', 'updated-pager');
});
