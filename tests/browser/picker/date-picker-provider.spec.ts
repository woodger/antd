import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import type { ElementHandle, Locator, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import {
  authoredClasses, observedProperties, projectPickerStyle, readPickerProviderBrowser,
  type PickerProviderState
} from '../date-picker-provider-reference';
import type { PickerProviderProfile } from '../fixtures/DatePickerProviderFixtures.svelte';
import { expect, test } from '../test';

const reference = readPickerProviderBrowser();
const rootSelector = '[data-picker-control] .ant-picker';
const popupSelector = '[data-picker-popup]:not([hidden])';

test.use({ viewport: { width: 1280, height: 900 }, timezoneId: 'UTC' });

/** Opens the assembled package with public props of the selected source profile. */
async function openProfile(page: Page, profile: PickerProviderProfile) {
  await page.clock.setFixedTime(new Date('2024-06-19T12:00:00Z'));
  const params = new URLSearchParams({
    fixture: 'date-picker-provider', profile: JSON.stringify(profile)
  });
  await page.goto('/?' + params.toString());
  await expect(page.locator('[data-picker-control]')).toHaveAttribute('data-picker-ref', 'true');
}

/** Applies a change of customization without translating the focus on the stand button. */
async function pressOwnerControl(page: Page, id: string) {
  await page.locator('#' + id).evaluate((button: HTMLButtonElement) => button.click());
}

/** Compares each calendar slot, discarding popup service coordinates. */
function expectedFrame(state: PickerProviderState) {
  const { producers: _producers, slots, ...props } = state;
  const entries = Object.fromEntries(Object.entries(slots).map(([name, slot]) => [
    name,
    {
      count: slot.count, semanticCount: slot.semanticCount,
      all: slot.all.map(node => ({
        tag: node.tag, classes: node.classes.toSorted(), style: projectPickerStyle(node.inline)
      }))
    }
  ]));

  return { ...props, samePopup: true, slots: entries };
}

/** Removes the published classes, CSS and the state of the editor on the real DOM. */
function readFrame(control: Locator, nodes: {
  root: ElementHandle;
  input: ElementHandle;
  popup: ElementHandle | null;
}) {
  return control.evaluate((element, { nodes, pattern, properties, popupSelector }) => {
    const matches = new RegExp(pattern);
    const popup = document.querySelector<HTMLElement>(popupSelector);
    const inputs = Array.from(element.querySelectorAll<HTMLInputElement>('input'));
    const slots = {
      root: [element as HTMLElement],
      prefix: [...element.querySelectorAll<HTMLElement>('.ant-picker-prefix')],
      input: inputs,
      suffix: [...element.querySelectorAll<HTMLElement>('.ant-picker-suffix')],
      popup: popup ? [popup] : [],
      header: [...popup?.querySelectorAll<HTMLElement>('.ant-picker-header') ?? []],
      body: [...popup?.querySelectorAll<HTMLElement>('.ant-picker-body') ?? []],
      content: [...popup?.querySelectorAll<HTMLElement>('.ant-picker-content') ?? []],
      item: [...popup?.querySelectorAll<HTMLElement>('.ant-picker-cell, .ant-picker-time-panel-cell') ?? []],
      footer: [...popup?.querySelectorAll<HTMLElement>('.ant-picker-footer') ?? []],
      container: [...popup?.querySelectorAll<HTMLElement>('.ant-picker-panel-container') ?? []]
    };

    /** Reads only the declarations that the booth sets through classNames and styles. */
    function readSlot(node: HTMLElement) {
      return {
        tag: node.tagName,
        classes: [...node.classList].filter(token => matches.test(token)).sort(),
        style: properties.map(name => node.style.getPropertyValue(name))
      };
    }

    return {
      sameRoot: element === nodes.root,
      sameInput: inputs[0] === nodes.input,
      samePopup: popup === nodes.popup,
      focused: document.activeElement === nodes.input,
      clear: element.querySelectorAll('[data-picker-clear]').length,
      markers: [...element.querySelectorAll('[data-marker]')].map(node => node.getAttribute('data-marker')),
      inputs: inputs.map(input => ({ value: input.value, disabled: input.disabled })),
      slots: Object.fromEntries(Object.entries(slots).map(([name, elements]) => [
        name, {
          count: elements.length,
          semanticCount: elements.filter(el =>
            [...el.classList].some(token => token.startsWith('slot-'))).length,
          all: elements.map(readSlot)
        }
      ]))
    };
  }, { nodes, pattern: authoredClasses, properties: observedProperties, popupSelector });
}

for (const { profile, frames } of reference.passes[0]) {
  test(`DatePicker provider retains the editor while updating ${profile.id}`, async ({ page }) => {
    await openProfile(page, profile);
    const control = page.locator(rootSelector);
    const editor = control.locator('input').first();
    const popup = page.locator(popupSelector);
    const first = frames[0].state;
    if (first.focused) await editor.focus();
    await expect(popup).toHaveCount(first.slots.popup.count);
    const nodes = {
      root: await control.elementHandle(),
      input: await editor.elementHandle(),
      popup: first.slots.popup.count ? await popup.elementHandle() : null
    };

    try {
      for (const [index, { mode, state }] of frames.entries()) {
        if (index > 0) await pressOwnerControl(page, mode);
        await expect.poll(() => readFrame(control, nodes), { message: profile.id + ' ' + mode })
          .toEqual(expectedFrame(state));

        if (!profile.time) {
          await pressOwnerControl(page, 'read-producers');
          const json = await page.locator('#picker-producers').textContent();
          const actual: unknown = JSON.parse(json ?? 'null');
          expect(actual).toEqual(expect.arrayContaining(state.producers));
          expect(actual).toHaveLength(state.producers.length);
        }
        await expect(page.locator('#picker-changes')).toHaveText('0');
      }
    }
    finally {
      await nodes.root.dispose();
      await nodes.input.dispose();
      await nodes.popup?.dispose();
    }
  });
}

for (const range of [false, true]) {
  test(`DatePicker configuration preserves a draft and caret (range=${range})`, async ({ page }) => {
    await openProfile(page, { id: 'draft', picker: 'date', range });
    const editor = page.locator(rootSelector).locator('input').first();
    await editor.fill('2024-06-');
    await editor.evaluate((node: HTMLInputElement) => node.setSelectionRange(2, 6, 'backward'));

    for (const next of ['replace', 'empty', 'inherit']) {
      await pressOwnerControl(page, next);

      await expect(editor).toBeFocused();
      await expect(editor).toHaveValue('2024-06-');
      expect(await editor.evaluate((node: HTMLInputElement) =>
        [node.selectionStart, node.selectionEnd, node.selectionDirection])).toEqual([2, 6, 'backward']);
      await expect(page.locator('#picker-changes')).toHaveText('0');
    }
  });
}

test('DatePicker changes popup styles without hiding a focused calendar cell', async ({ page }) => {
  await openProfile(page, { id: 'focused-cell', picker: 'date', showTime: true });
  const popup = page.locator(popupSelector);
  const cell = popup.locator('button[data-picker-date="2024-06-13"]');
  await cell.focus();
  const original = await cell.elementHandle();

  try {
    await pressOwnerControl(page, 'replace');

    await expect(popup).toHaveCSS('color', 'rgb(70, 71, 72)');
    await expect(cell).toBeFocused();
    expect(await cell.evaluate((node, initial) => node === initial, original)).toBe(true);
  }
  finally {
    await original.dispose();
  }
});

test('DatePicker clear button uses the provider icon and publishes one clear', async ({ page }) => {
  await openProfile(page, { id: 'clear', picker: 'date' });
  const root = page.locator(rootSelector);
  const clear = root.locator('[data-picker-clear]');
  await expect(clear).toHaveAccessibleName('Clear');
  await expect(clear.locator('[data-marker="date-clear"]')).toHaveText('date clear');

  await root.hover();
  await clear.click();

  await expect(root.locator('input')).toHaveValue('');
  await expect(root.locator('input')).toBeFocused();
  await expect(clear).toHaveCount(0);
  await expect(page.locator('#picker-changes')).toHaveText('1');
});

test('DatePicker provider hydrates both fields and updates the existing range', async ({ page }) => {
  const artifacts = new URL('../../../.upstream/artifacts/date-picker-provider-hydration-', import.meta.url);
  const cache = await mkdtemp(fileURLToPath(artifacts));
  let server: ViteDevServer | undefined;
  const handles: ElementHandle[] = [];

  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir: cache
    });
    const path = new URL('../fixtures/date-picker-provider-hydration.server.ts', import.meta.url);
    const { renderPickerProviderFixture } = await server.ssrLoadModule(fileURLToPath(path));
    const { head, body } = renderPickerProviderFixture();
    await page.goto('/select-components-hydration.html');
    await page.evaluate(({ head, body }) => {
      const root = document.getElementById('root');
      if (!root) {
        throw Error('Missing DatePicker provider hydration target');
      }
      document.head.insertAdjacentHTML('beforeend', head);
      root.innerHTML = body;
    }, { head, body });
    const control = page.locator(rootSelector);
    const inputs = control.locator('input');
    handles.push(await control.elementHandle(), await inputs.first().elementHandle(),
      await inputs.nth(1).elementHandle());
    await expect(control).toHaveClass(/\bslot-date-root\b/);
    await expect(inputs.first()).toHaveValue('2024-06-13 16:30:00');

    await page.addScriptTag({ type: 'module', url: '/date-picker-provider-hydration.client.ts' });
    await expect(page.locator('[data-picker-control]')).toHaveAttribute('data-picker-ref', 'true');
    await inputs.first().click();
    await pressOwnerControl(page, 'replace');

    await expect(control).toHaveClass(/\bslot-inner-root\b/);
    await expect(inputs.first()).toBeFocused();
    await expect(inputs.nth(1)).toHaveValue('2024-06-15 16:30:00');
    await expect(page.locator(popupSelector)).toHaveCSS('color', 'rgb(70, 71, 72)');
    expect(await control.evaluate((node, original) => node === original, handles[0])).toBe(true);
    expect(await inputs.first().evaluate((node, original) => node === original, handles[1])).toBe(true);
    expect(await inputs.nth(1).evaluate((node, original) => node === original, handles[2])).toBe(true);
    await expect(page.locator('#picker-changes')).toHaveText('0');

    await page.evaluate(() => Reflect.get(window, 'disposePickerProvider')());
    await expect(page.locator(rootSelector)).toHaveCount(0);
    await expect(page.locator(popupSelector)).toHaveCount(0);
  }
  finally {
    for (const handle of handles) await handle.dispose();
    await server?.close();
    await rm(cache, { recursive: true, force: true });
  }
});
