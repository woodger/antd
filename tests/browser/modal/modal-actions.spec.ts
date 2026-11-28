import type { Page } from '@playwright/test';
import { expect, test } from '../test';
import reference from '../fixtures/ant-design-modal-actions-reference.json' with { type: 'json' };

/** Is waiting for an open dialogue and the first notification of its owner. */
async function open(page: Page, kind: string, profile: string, confirmation = false) {
  await page.goto(`/modal-actions.html?kind=${kind}&profile=${profile}`);
  await expect(page.locator('#root')).toHaveAttribute('data-ready', 'true');
  if (confirmation) {
    await page.locator('#action-open').click();
  }
  await expect(page.locator('dialog.actions-probe')).toHaveAttribute('open', '');
  await expect(page.locator('#action-events')).toContainText('["afterOpenChange",true]');
}

/** Removes the buttons belonging to the current panel, and their common with the reference DOM-properties. */
async function readActions(page: Page) {
  return page.locator('dialog.actions-probe').evaluate(panel => {
    const nodes = [...panel.querySelectorAll<HTMLButtonElement>('button')];
    const controls = nodes.map(button => ({
      label: button.getAttribute('aria-label'),
      text: button.textContent.trim(),
      id: button.id || null,
      title: button.title || null,
      disabled: button.disabled,
      classes: [...button.classList].filter(name =>
        name.startsWith('ant-') && name !== 'ant-btn-css-var').sort(),
      rich: Boolean(button.querySelector('[data-source-rich]'))
    }));
    const closeIndex = nodes.findIndex(button => button.hasAttribute('data-ant-modal-close'));
    const close = nodes[closeIndex];
    const icon = close?.querySelector('[data-probe-close-icon], [data-confirm-close], [data-source-icon]');
    const closeIcon = icon?.getAttribute('data-probe-close-icon')
      ?? icon?.getAttribute('data-confirm-close')
      ?? icon?.getAttribute('data-source-icon')
      ?? null;
    const confirmBody = panel.querySelector('.ant-modal-confirm-body');
    const confirmationIcon = confirmBody?.querySelector('[data-source-icon]');
    return {
      controls,
      buttons: controls.filter((_, index) => index !== closeIndex),
      close: close ? {
        ...controls[closeIndex],
        icon: closeIcon,
        hasSvg: Boolean(close.querySelector('svg')),
        describedBy: close.getAttribute('aria-describedby'),
        marker: close.getAttribute('data-probe-close')
      } : null,
      footer: panel.querySelector('[data-footer-contract]')?.getAttribute('data-footer-contract') ?? null,
      icon: confirmationIcon?.getAttribute('data-source-icon') ?? null,
      hasIcon: Boolean(confirmationIcon || confirmBody?.querySelector(':scope > .anticon'))
    };
  });
}

/** Brings the order of user notifications from the page. */
async function readEvents(page: Page) {
  const output = await page.locator('#action-events').textContent();
  return JSON.parse(output ?? '[]') as unknown[][];
}

/** Repeats the actual user input and explicit actions of the owner. */
async function act(page: Page, action: string) {
  const dialog = page.locator('dialog.actions-probe');
  switch (action) {
    case 'escape':
      await page.keyboard.press('Escape');
      break;
    case 'mask':
      await page.mouse.click(4, 4);
      break;
    case 'close':
      await dialog.locator('[data-ant-modal-close]').click();
      break;
    case 'external':
      await page.locator('#action-close').dispatchEvent('click');
      break;
    case 'destroy':
      await page.locator('#action-destroy').dispatchEvent('click');
      break;
    default:
      await dialog.getByRole('button', { name: action === 'cancel' ? 'Cancel' : 'OK', exact: true })
        .click();
  }
}

/** The Svelte handle resolves when closing is requested. The other callbacks run in the same order. */
async function expectConfirmationEvents(page: Page, fromSource: unknown[][], destroyed = false) {
  const effects = fromSource.filter(event => event[0] !== 'result');
  const result = destroyed ? ['result', false] : fromSource.find(event => event[0] === 'result');
  await expect.poll(() => readEvents(page)).toHaveLength(effects.length + Number(Boolean(result)));
  const recorded = await readEvents(page);
  expect(recorded.filter(event => event[0] !== 'result')).toEqual(effects);
  expect(recorded.filter(event => event[0] === 'result')).toEqual(result ? [result] : []);
  if (result) {
    const resultIndex = recorded.findIndex(event => event[0] === 'result');
    const closeIndex = recorded.findIndex(event => event[0] === 'afterClose');
    expect(resultIndex).toBeLessThan(closeIndex);
  }
}

for (const row of reference.ordinary) {
  test(`Modal matches source actions for ${row.profile.id}`, async ({ page }) => {
    await open(page, 'ordinary', row.profile.id);
    const initial = await readActions(page);
    const close = row.before.close;
    const loading = row.profile.loading === true;
    expect(initial.close && {
      label: initial.close.label, text: initial.close.text, icon: initial.close.icon,
      classNames: initial.close.classes, disabled: initial.close.disabled, id: initial.close.id,
      title: initial.close.title
    }).toEqual(close && { ...close, disabled: loading || close.disabled });
    expect(initial.footer).toBe(row.before.footer.receivedOrigin);
    expect(initial.buttons.map(button => button.text)).toEqual(row.before.footer.actions);
    const ok = initial.buttons.find(button => button.text === 'OK');
    const expected = row.before.footer.ok;
    expect(ok).toEqual(expected && {
      label: expected.label, text: expected.text, id: expected.id, title: expected.title,
      classes: expected.classNames, disabled: loading || expected.disabled, rich: false
    });

    await act(page, row.profile.action);

    // Public onOk and onCancel of the usual Svelte Modal keep the challenge without arguments.
    const events = row.events.map(event =>
      event[0] === 'ok' || event[0] === 'cancel' ? [event[0], 0] : event);
    await expect.poll(() => readEvents(page)).toEqual(events);
    await expect(page.locator('dialog.actions-probe[open]')).toHaveCount(Number(row.open));
  });
}

for (const row of reference.confirmation) {
  test(`context confirmation matches source actions for ${row.profile.id}`, async ({ page }) => {
    await open(page, 'confirmation', row.profile.id, true);
    const initial = await readActions(page);
    const read = (snapshot: Awaited<ReturnType<typeof readActions>>) =>
      snapshot.controls.map(({ label, rich: _rich, ...button }) => ({ ...button, aria: label }));
    expect(read(initial)).toEqual(row.initial.options);
    expect(initial.footer).toBe(row.initial.footer);
    expect(initial.close?.icon ?? null).toBe(row.initial.icon);

    if (row.profile.disabled) {
      await expect(page.locator('#local-ok')).toBeDisabled();
    }
    else {
      await act(page, row.profile.action);
    }
    if (row.pending) {
      const pending = row.pending.options.map(button => ({
        ...button, disabled: button.disabled || button.classes.includes('ant-btn-loading')
      }));
      await expect.poll(async () => read(await readActions(page))).toEqual(pending);
      if (row.profile.loading === false) {
        await act(page, 'ok');
      }
      await page.locator('#action-release').dispatchEvent('click');
    }

    await expectConfirmationEvents(page, row.events);
    await expect(page.locator('dialog.actions-probe:modal')).toHaveCount(Number(Boolean(row.open)));
  });
}

for (const row of reference.overrides) {
  test(`Modal resolves source action options for ${row.profile.id}`, async ({ page }) => {
    const confirmation = row.profile.method !== undefined;
    await open(page, 'overrides', row.profile.id, confirmation);
    const initial = await readActions(page);
    const close = initial.close;
    expect(close && {
      icon: close.icon, hasSvg: close.hasSvg, disabled: close.disabled,
      label: close.label, describedBy: close.describedBy, marker: close.marker
    }).toEqual(row.initial.close && {
      ...row.initial.close, disabled: row.initial.close.disabled || row.profile.loading === true
    });
    expect(initial.icon).toBe(row.initial.icon);
    expect(initial.hasIcon).toBe(row.initial.hasIcon);
    const expected = row.initial.buttons.map(button => ({
      ...button,
      disabled: button.disabled
        || (row.profile.loading === true && button.text === 'Cancel')
    }));
    expect(initial.buttons.map(button => ({
      text: button.text, disabled: button.disabled, rich: button.rich,
      danger: button.classes.includes('ant-btn-dangerous'),
      loading: button.classes.includes('ant-btn-loading')
    }))).toEqual(expected);

    const action = row.profile.action;
    if (action) {
      await act(page, action);
    }
    if (action === 'async') {
      await expect(page.locator('#action-events')).toContainText('["ok"]');
      await page.locator('#action-update').dispatchEvent('click');
      await page.locator('#action-release').dispatchEvent('click');
    }

    if (confirmation) {
      await expectConfirmationEvents(page, row.events, action === 'destroy');
    }
    else {
      await expect.poll(() => readEvents(page)).toEqual(row.events);
    }
    await expect(page.locator('dialog.actions-probe:modal')).toHaveCount(Number(!action));
  });
}

test('updates a link action in a custom confirmation footer and focuses the new control', async ({ page }) => {
  await open(page, 'live', 'live', true);
  const dialog = page.locator('dialog.actions-probe');
  const original = await dialog.elementHandle();
  const editor = dialog.getByRole('textbox', { name: 'Confirmation draft' });
  await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await editor.fill('User draft');

  await page.locator('#action-update').dispatchEvent('click');
  const link = dialog.getByRole('link', { name: 'OK' });

  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute('title', 'Updated OK');
  await expect(editor).toHaveValue('User draft');
  expect(await dialog.evaluate((node, before) => node === before, original)).toBe(true);
  await link.press('Enter');

  await expect.poll(() => readEvents(page)).toEqual([
    ['afterOpenChange', true], ['ok'], ['link', 'A', '#accepted'], ['result', true],
    ['afterClose'], ['afterOpenChange', false]
  ]);
  await expect(page.locator('#action-open')).toBeFocused();
  expect(new URL(page.url()).hash).toBe('');
});
