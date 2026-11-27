import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-drawer-dom-reference.json' with { type: 'json' };

type EventEntry = (typeof reference.events.events.key)[number];
type AttributeFrame = (typeof reference.attributes)[number];

/** Launches the action of the owner even with native modality. */
async function owner(page: Page, name: string) {
  await page.locator(`#dom-${name}`).evaluate(node => {
    if (node instanceof HTMLButtonElement) node.click();
  });
}

/** Reads the desired types of events separately from the automatic focus and movements of the pointer. */
async function drain(page: Page, kinds: string[]): Promise<EventEntry[]> {
  const output = await page.locator('#dom-events').textContent();
  const events: EventEntry[] = JSON.parse(output ?? '[]');
  await owner(page, 'clear');
  return events.filter(event => kinds.includes(event.kind));
}

/** Waiting for the real dialog to be opened after selecting a profile. */
async function show(page: Page, profile: string) {
  await page.goto('/?fixture=drawer-dom');
  await page.getByRole('combobox', { name: 'Drawer DOM profile' }).selectOption(profile);
  await page.locator('#dom-open').click();
  const dialog = page.locator('.probe-drawer');
  await expect(dialog).toHaveAttribute('open', '');
  await owner(page, 'clear');
  return dialog;
}

/** Distinguishes the existence of the domain, its text and the relationship of the title with the available name. */
async function readContent(dialog: Locator) {
  return dialog.evaluate(node => {
    const title = node.querySelector('[data-ant-drawer-title]');
    const extra = node.querySelector('[data-ant-drawer-extra]');
    const footer = node.querySelector('[data-ant-drawer-footer]');
    const labelId = node.getAttribute('aria-labelledby');
    return {
      header: Boolean(node.querySelector('[data-ant-drawer-header]')),
      title: title?.textContent.trim() ?? null,
      extra: extra?.textContent.trim() ?? null,
      footer: footer?.textContent.trim() ?? null,
      linked: Boolean(title?.id && labelId === title.id),
      hasLabelledBy: Boolean(labelId)
    };
  });
}

/** Removes ARIA, data and classes from the actual DOM owners after the portal. */
async function readAttributes(dialog: Locator, sample: AttributeFrame) {
  return dialog.evaluate((root, names) => {
    const wrapper = root.querySelector(':scope > [data-ant-drawer-content-wrapper]');
    const section = wrapper?.querySelector(':scope > [data-ant-drawer-section]');
    const mask = root.querySelector(':scope > [data-ant-drawer-mask]');
    const location = (attribute: string) =>
      [root, wrapper, section].map(node => Boolean(node?.hasAttribute(attribute)));
    return {
      aria: Object.fromEntries(names.aria.map(name => [name, root.getAttribute(name)])),
      data: Object.fromEntries(names.data.map(name => [name, wrapper?.getAttribute(name)])),
      role: root.getAttribute('role'),
      idAt: location('id'),
      ariaAt: location('aria-label'),
      dataAt: location('data-state'),
      maskClasses: ['ant-drawer-mask', 'mask-custom', 'mask-semantic'].map(name =>
        Boolean(mask?.classList.contains(name)))
    };
  }, { aria: Object.keys(sample.aria), data: Object.keys(sample.data) });
}

test.use({ viewport: { width: 1000, height: 680 }, reducedMotion: 'reduce' });

test('Drawer matches content presence, zero and arrays from React', async ({ page }) => {
  const dialog = await show(page, 'content');
  await expect(page.getByRole('dialog', { name: '0', exact: true })).toBeVisible();

  const select = page.getByRole('combobox', { name: 'Drawer content' });
  for (const { name, ...expected } of reference.content) {
    await select.selectOption(name);
    await expect.poll(() => readContent(dialog), { message: name }).toEqual(expected);
  }
});

test('Drawer updates attributes on the native dialog and the same portaled wrapper', async ({ page }) => {
  const dialog = await show(page, 'attrs');
  await expect(page.getByRole('alertdialog', { name: 'Queue', exact: true })).toBeVisible();
  await expect(page.locator('body > #product-dialog')).toBeVisible();
  const section = dialog.locator('[data-ant-drawer-section]');
  const original = await section.elementHandle();

  for (const [index, expected] of reference.attributes.entries()) {
    if (index > 0) await owner(page, 'next');
    // Native dialog is responsible for accessibility. React puts these attributes on the section.
    await expect.poll(() => readAttributes(dialog, expected)).toEqual({
      ...expected, idAt: [true, false, false], ariaAt: [true, false, false]
    });
  }
  expect(await section.evaluate((element, previous) => element === previous, original)).toBe(true);
});

test('Drawer emits native section events and picks up the latest handler', async ({ page }) => {
  const dialog = await show(page, 'events');
  const editor = dialog.locator('#editor');
  const expected = reference.events.events;

  await editor.focus();
  expect(await drain(page, ['focus'])).toEqual([{
    scope: 'outer', kind: 'focus', type: 'focusin', target: 'editor', current: 'section',
    key: null, prevented: false
  }]);
  await editor.hover();
  expect(await drain(page, ['enter', 'over'])).toEqual(expected.enter.map(event =>
    event.kind === 'enter' ? { ...event, target: 'section' } : event));
  await page.mouse.move(50, 320);
  expect(await drain(page, ['leave'])).toEqual(expected.leave.map(event =>
    ({ ...event, target: 'section' })));

  await page.keyboard.press('a');
  expect(await drain(page, ['down', 'up'])).toEqual(expected.key);
  const action = dialog.locator('#action');
  await action.click();
  expect(await drain(page, ['click'])).toEqual(expected.click);

  const input = await editor.elementHandle();
  await owner(page, 'next');
  await action.click();
  expect(await drain(page, ['click'])).toEqual(expected.updated);
  expect(await editor.evaluate((node, old) => node === old, input)).toBe(true);
  await expect(editor).toHaveValue('a');

  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await drain(page, ['click', 'request'])).toEqual(expected.close);
});

for (const profile of ['escape', 'escape-managed']) {
  test(`Drawer respects preventDefault on Escape in ${profile}`, async ({ page }) => {
    const dialog = await show(page, profile);
    await owner(page, 'next');
    await owner(page, 'guard');
    await dialog.locator('#action').focus();
    await owner(page, 'clear');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    expect(await drain(page, ['down', 'up', 'request'])).toEqual(
      reference.events.escape.guard.filter(event => event.kind !== 'request')
    );

    await owner(page, 'unguard');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    const requests = await drain(page, ['request']);
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ scope: 'next', type: 'cancel' });
  });
}

test('Drawer backdrop is outside the section click boundary', async ({ page }) => {
  const dialog = await show(page, 'mask');

  await page.mouse.click(50, 320);

  await expect(dialog).toBeHidden();
  expect(await drain(page, ['click', 'request'])).toEqual(reference.events.mask.click.map(event =>
    ({ ...event, type: 'pointerup', current: 'dom-root' })));
});

for (const profile of ['nested-inline', 'nested-portal'] as const) {
  test(`Drawer callbacks follow native ancestry in ${profile}`, async ({ page }) => {
    await show(page, profile);
    const expected = reference.events[profile];
    const usesInline = profile === 'nested-inline';
    const action = page.locator('#child-action');
    expect(await action.evaluate(node =>
      Boolean(node.closest('[data-ant-drawer-section]')))).toBe(true);
    expect(await action.evaluate(node =>
      Boolean(node.closest('.probe-drawer')))).toBe(usesInline);

    await action.click();
    expect(await drain(page, ['click'])).toEqual(
      expected.click.filter(event => usesInline || event.scope === 'inner')
    );
    await page.keyboard.press('Control');
    expect(await drain(page, ['down', 'up'])).toEqual(
      expected.key.filter(event => usesInline || event.scope === 'inner')
    );
  });
}
