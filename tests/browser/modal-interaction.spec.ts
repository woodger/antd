import type { Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-modal-interaction-reference.json' with { type: 'json' };

/** Именует активный control одинаково для декларативной панели и подтверждения. */
function readFocus() {
  const active = document.activeElement;
  if (!active || active === document.body) {
    return 'body';
  }
  if (active.id.startsWith('interaction-')) {
    return active.id.slice('interaction-'.length);
  }
  const text = active.textContent?.trim();
  if (active.tagName === 'BUTTON' && (text === 'OK' || text === 'Cancel')) {
    return text;
  }
  if (active.closest('[data-ant-modal-close]')) {
    return 'close';
  }
  return active.closest('dialog.ant-svelte-dialog') ? 'dialog' : 'outside';
}

/** Читает состояние из фактического backdrop и нативной области прокрутки. */
function appearance() {
  const dialog = document.querySelector<HTMLDialogElement>('dialog.ant-svelte-dialog[open]');
  if (!dialog) {
    throw new Error('Interaction dialog has not opened');
  }

  const native = dialog.matches(':modal');
  const backdrop = dialog.querySelector('[data-ant-modal-mask]');
  const mask = native || Boolean(backdrop);
  const maskStyle = native ? getComputedStyle(dialog, '::backdrop')
    : backdrop ? getComputedStyle(backdrop) : undefined;
  const overflow = [document.body, document.documentElement].some(element =>
    ['hidden', 'clip'].includes(getComputedStyle(element).overflowY)
  );
  return { mask, blur: maskStyle?.backdropFilter ?? null, overflow };
}

/** Обновляет настройки владельца, даже когда native dialog держит фон inert. */
async function activate(page: Page, control: string) {
  await page.locator(control).evaluate(node => {
    if (node instanceof HTMLButtonElement) node.click();
  });
}

test.use({ viewport: { width: 900, height: 640 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/?fixture=modal-interaction');
  await page.getByRole('checkbox', { name: 'English locale', exact: true }).check();
});

for (const sample of reference.cases) {
  test(`Modal matches the source interaction for ${sample.profile.id}`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Modal interaction profile', exact: true })
      .selectOption(sample.profile.id);
    const dialog = page.getByRole('dialog', { name: 'Interaction probe', exact: true });
    await page.getByRole('button', { name: 'Open interaction panel', exact: true }).click();
    await expect(dialog).toBeVisible();

    // Нативный старый режим блокирует прокрутку также в inline и custom host.
    const nativeContainer = sample.profile.id === 'inline' || sample.profile.id === 'custom-host';
    const { mask, blur, overflow, initialFocus } = sample.appearance;
    await expect.poll(() => page.evaluate(appearance)).toEqual({
      mask, blur, overflow: nativeContainer || overflow
    });
    const usesNative = mask && sample.result.focus === 'opener'
      && sample.programmaticFocus !== 'background';
    await expect.poll(() => dialog.evaluate(node => node.matches(':modal'))).toBe(usesNative);
    const expectedFocus = sample.profile.id === 'confirm-null-focus' ? 'editor' : initialFocus;
    await expect.poll(() => page.evaluate(readFocus)).toBe(expectedFocus);
    if (sample.programmaticFocus === 'background') {
      // Свободный фокус должен оставаться доступным и скринридеру за границей панели.
      await expect(dialog).not.toHaveAttribute('aria-modal', 'true');
    }
    else {
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    }
    await page.locator('#interaction-background').evaluate(node => {
      if (node instanceof HTMLButtonElement) node.focus();
    });
    const outsideRequest = usesNative ? expectedFocus : sample.programmaticFocus;
    await expect.poll(() => page.evaluate(readFocus)).toBe(outsideRequest);

    await dialog.getByRole('textbox', { name: 'Interaction draft' }).focus();
    await page.mouse.move(22, 350);
    await page.mouse.wheel(0, 190);
    await page.evaluate(async () => {
      for (let frame = 0; frame < 4; frame++) await new Promise(requestAnimationFrame);
    });
    expect(await page.evaluate(() => window.scrollY > 0))
      .toBe(!nativeContainer && sample.pageScrolled);
    const bounds = await page.locator('#interaction-background').boundingBox();
    if (!bounds) {
      throw new Error('Missing background control');
    }

    await page.mouse.click(bounds.x + 10, bounds.y + 10);

    await expect(page.getByLabel('Interaction cancelled')).toHaveText(String(sample.pointer.cancelled));
    await expect(page.getByLabel('Interaction background')).toHaveText(String(sample.pointer.background));
    if (!sample.pointer.cancelled) {
      await expect(dialog).toBeVisible();
      await dialog.getByRole('textbox', { name: 'Interaction draft' }).focus();
      await activate(page, '#interaction-close');
    }
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel('Interaction closed')).toHaveText('1');
    await expect.poll(() => page.evaluate(readFocus)).toBe(sample.result.focus);
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  });
}

test('Modal switches its live interaction mode with the same draft and restores its original opener', async ({ page }) => {
  const opener = page.getByRole('button', { name: 'Open interaction panel' });
  const dialog = page.getByRole('dialog', { name: 'Interaction probe', exact: true });
  await opener.click();
  const draft = dialog.getByRole('textbox', { name: 'Interaction draft' });
  await draft.fill('Kept draft');
  await draft.evaluate(node => {
    if (node instanceof HTMLInputElement) node.setSelectionRange(1, 5);
  });
  const first = await draft.elementHandle();

  await activate(page, '#interaction-free');

  await expect(dialog).toHaveAttribute('data-ant-modal-managed');
  await expect(draft).toBeFocused();
  await expect.poll(() => page.evaluate(appearance)).toEqual({ mask: false, blur: null, overflow: false });
  await activate(page, '#interaction-native');

  await expect(dialog).not.toHaveAttribute('data-ant-modal-managed');
  await expect(draft).toBeFocused();
  await expect(draft).toHaveValue('Kept draft');
  const draftState = await draft.evaluate((node, previous) => ({
    same: previous === node,
    selection: node instanceof HTMLInputElement ? [node.selectionStart, node.selectionEnd] : []
  }), first);
  expect(draftState).toEqual({ same: true, selection: [1, 5] });
  await expect(page.getByLabel('Interaction closed')).toHaveText('0');

  await page.keyboard.press('Escape');

  await expect(dialog).toBeHidden();
  await expect(page.getByLabel('Interaction closed')).toHaveText('1');
  await expect(opener).toBeFocused();
});

test('Modal updates the confirmation action focus and keeps the draft', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Modal interaction profile' })
    .selectOption('confirm-default');
  await page.getByRole('button', { name: 'Open interaction panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Interaction probe' });
  const draft = dialog.getByRole('textbox', { name: 'Interaction draft' });
  await draft.fill('Kept draft');
  const original = await draft.elementHandle();

  for (const sample of reference.focusUpdates) {
    await draft.focus();
    const control = sample.autoFocusButton === 'cancel'
      ? '#interaction-autofocus-cancel' : '#interaction-autofocus-none';
    await activate(page, control);

    if (sample.autoFocusButton === null) {
      await expect(dialog.locator('button[autofocus]')).toHaveCount(0);
      await page.evaluate(() => new Promise(requestAnimationFrame));
    }
    const focus = sample.autoFocusButton === null ? 'editor' : sample.focus;
    await expect.poll(() => page.evaluate(readFocus)).toBe(focus);
    expect(await draft.evaluate((node, previous) => ({
      same: node === previous,
      value: node instanceof HTMLInputElement ? node.value : undefined
    }), original)).toEqual({ same: sample.same, value: sample.value });
  }
});

test('Modal releases scroll and restores focus when its managed panel unmounts', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Modal interaction profile' })
    .selectOption('free-focus-masked');
  const opener = page.getByRole('button', { name: 'Open interaction panel' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Interaction probe' });
  await expect(dialog).toBeFocused();
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden');

  await activate(page, '#interaction-unmount');

  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  await expect(page.getByLabel('Interaction closed')).toHaveText('0');
});

test('Modal can keep Tab inside a panel with no visible mask', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Modal interaction profile' })
    .selectOption('unmasked-trap');
  await page.getByRole('button', { name: 'Open interaction panel' }).click();
  const dialog = page.getByRole('dialog', { name: 'Interaction probe' });
  const last = dialog.getByRole('button', { name: 'Last interaction control' });
  await last.focus();

  await page.keyboard.press('Tab');

  await expect(dialog.getByRole('button', { name: 'Close', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(last).toBeFocused();
});

for (const [host, profile] of [['native', 'free-focus-masked'], ['managed', 'default']] as const) {
  test(`Modal ESC respects its Select and ${host} Drawer host`, async ({ page }) => {
    await page.getByRole('combobox', { name: 'Modal interaction host' }).selectOption(host);
    await page.getByRole('combobox', { name: 'Modal interaction profile' }).selectOption(profile);
    const trigger = page.getByRole('button', { name: 'Open interaction panel' });
    await trigger.click();
    const parent = page.getByRole('dialog', { name: 'Interaction Drawer' });
    const nestedOpener = parent.getByRole('button', { name: 'Open nested interaction panel' });
    await nestedOpener.click();
    const dialog = page.getByRole('dialog', { name: 'Interaction probe' });
    const choice = dialog.getByRole('combobox', { name: 'Nested interaction choice' });
    await choice.click();
    await expect(choice).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');

    await expect(choice).toHaveAttribute('aria-expanded', 'false');
    await expect(dialog).toBeVisible();
    await expect(parent).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    await expect(parent).toBeVisible();
    await expect(nestedOpener).toBeFocused();

    await page.keyboard.press('Escape');

    await expect(parent).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
