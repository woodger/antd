import type { Locator, Page } from '@playwright/test';
import { test, expect } from './test';
import appearance from './fixtures/ant-design-dropdown-appearance-reference.json' with { type: 'json' };
import providers from './fixtures/ant-design-dropdown-provider-reference.json' with { type: 'json' };

const fixture = '/?fixture=dropdown-appearance&sample=';

// Extending the status of the owner does not take the focus from Dropdown.
async function update(page: Page, id: string) {
  await page.locator('#' + id).evaluate((button: HTMLButtonElement) => button.click());
}

// Receives only the classes specified by the public settings of this fixture.
function providerClasses(node: Element) {
  return Array.from(node.classList).filter(token =>
    /^(?:outer-|inner-|local-(?:root|item)$|provider-study$)/.test(token));
}

// Removes the final values of CSS, regardless of the order of serialization of declarations.
async function readStyle(locator: Locator, properties: string[]) {
  return locator.evaluate((node, names) => {
    const style = getComputedStyle(node);
    return Object.fromEntries(names.map(name => [name, style.getPropertyValue(name)]));
  }, properties);
}

for (const { profile, frames } of appearance.passes[0]) {
  test(`Dropdown matches trigger classes and ref for ${profile.id}`, async ({ page }) => {
    await page.goto(fixture + profile.id);
    const trigger = page.locator('#trigger');
    const popup = page.locator('[data-ant-dropdown-popup]');
    const reference = page.locator('#trigger-reference');
    const handles = new Map<number, Awaited<ReturnType<Locator['elementHandle']>>>();

    for (const { step, state } of frames) {
      if (step === 'open' || step === 'close') await trigger.click();
      else if (step === 'escape') await page.keyboard.press('Escape');
      else if (step !== 'initial') await update(page, step);

      const events = state.events.map(([open]) => open);
      if (profile.controlled && (step === 'escape' || step === 'unmount')) {
        // React sends two identical Escape requests when the owner leaves the panel open.
        expect(events.slice(-2)).toEqual([false, false]);
        events.pop();
      }
      await expect(page.locator('#appearance-events')).toHaveText(JSON.stringify(events));

      if (!state.trigger) {
        await expect(trigger).toHaveCount(0);
        await expect(popup).toHaveCount(0);
        await expect(reference).toHaveText('none');
        await expect(reference).toHaveAttribute('data-alias', 'false');
        continue;
      }

      await expect(reference, step).toHaveText(state.reference?.tag ?? 'none');
      await expect(reference).toHaveAttribute('data-alias', String(state.alias));
      const triggerClass = state.trigger.classes.find(token => token.endsWith('-trigger'));
      if (!triggerClass) throw new Error('Missing original Dropdown trigger class');

      // The basic class belongs to the existing Svelte-wraver, the direction is taken from the provider.
      const rtlClass = triggerClass.replace(/-trigger$/, '-rtl');
      const classes = state.trigger.classes.filter(token => token !== triggerClass && token !== rtlClass);
      await expect.poll(() => trigger.evaluate(node => Array.from(node.classList).sort()))
        .toEqual(Array.from(new Set(classes)).sort());
      const wrapper = trigger.locator('..');
      await expect(wrapper).toHaveClass(/\bdropdown-class\b/);
      expect(await wrapper.evaluate((node, token) => node.classList.contains(token), triggerClass))
        .toBe(true);
      await expect(trigger).toHaveCSS('direction', profile.rtl ? 'rtl' : 'ltr');
      await expect(trigger).not.toHaveClass(/provider-popup|popup-only|revised-root|\bshared\b/);

      const previous = handles.get(state.trigger.identity);
      if (previous) {
        expect(await trigger.evaluate((node, before) => node === before, previous)).toBe(true);
      }
      else {
        const existing = Array.from(handles.values());
        expect(await trigger.evaluate((node, before) => before.includes(node), existing)).toBe(false);
        handles.set(state.trigger.identity, await trigger.elementHandle());
      }

      if (state.visible) await expect(popup).toBeVisible();
      else await expect(popup).toBeHidden();
      if (state.popup) {
        const classes = state.popup.classes.filter(token =>
          /^(?:shared|revised-root|provider-popup|popup-only)$/.test(token));
        expect(await popup.evaluate(node => Array.from(node.classList).filter(token =>
          /^(?:shared|revised-root|provider-popup|popup-only)$/.test(token)))).toEqual(classes);
      }
    }
  });
}

for (const { profile, frames } of providers.passes[0]) {
  test(`Dropdown applies provider semantic layers for ${profile}`, async ({ page }) => {
    await page.goto(fixture + profile);
    const popup = page.locator('[data-ant-dropdown-popup]');
    const command = popup.locator('[role="menuitem"]');
    const title = command.locator('[class$="-title"], [class*="-title "]');
    const trigger = page.locator('#trigger');
    const inputs = page.locator('#semantic-inputs');
    const popupIdentity = await popup.elementHandle();
    const commandIdentity = await command.elementHandle();
    const triggerIdentity = await trigger.elementHandle();
    await command.focus();

    for (const { step, state } of frames) {
      if (step === 'close') await update(page, 'owner-close');
      else if (step === 'open') await update(page, 'owner-open');
      else if (step !== 'initial') await update(page, step);

      if (!state.panel || !state.item) {
        await expect(popup).toHaveCount(0);
        await expect(trigger).toHaveCount(0);
        await expect(page.locator('#trigger-reference')).toHaveText('none');
        continue;
      }

      if (state.panel.visible) await expect(popup).toBeVisible();
      else await expect(popup).toBeHidden();
      expect(await popup.evaluate(providerClasses)).toEqual(state.panel.classes.filter(token =>
        /^(?:outer-|inner-|local-(?:root|item)$|provider-study$)/.test(token)));
      expect(await command.evaluate(providerClasses)).toEqual(state.item.classes.filter(token =>
        /^(?:outer-|inner-|local-(?:root|item)$|provider-study$)/.test(token)));
      expect(await trigger.evaluate(providerClasses)).toEqual([]);
      expect(await readStyle(popup, Object.keys(state.panel.style))).toEqual(state.panel.style);
      expect(await readStyle(command, Object.keys(state.item.style))).toEqual(state.item.style);
      if (state.title) {
        expect(await title.evaluate(providerClasses)).toEqual(state.title.classes.filter(token =>
          /^(?:outer-|inner-)/.test(token)));
        expect(await readStyle(title, Object.keys(state.title.style))).toEqual(state.title.style);
      }
      expect(await popup.evaluate((node, original) => node === original, popupIdentity)).toBe(true);
      expect(await command.evaluate((node, original) => node === original, commandIdentity)).toBe(true);
      expect(await trigger.evaluate((node, original) => node === original, triggerIdentity)).toBe(true);
      if (step === 'initial' || step === 'update') await expect(command).toBeFocused();
      if (step === 'close') await expect(trigger).toBeFocused();

      await update(page, 'inspect');
      const actual = JSON.parse(await inputs.innerText());
      const expected = Object.fromEntries(Object.entries(state.semanticInputs).map(([key, props]) => [
        key, key.startsWith('local:') ? { ...props, leaveDelay: null, overflow: null } : props
      ]));
      // Local callbacks retain the entrance props, including the absence of fields not specified by the owner.
      expect(actual).toEqual(expected);
      await expect(page.locator('#appearance-events')).toHaveText('[]');
    }
  });
}

test('Dropdown restores focus to the same SVG ref and merges live trigger classes', async ({ page }) => {
  await page.goto(fixture + 'svg');
  const trigger = page.locator('#trigger');
  await expect(page.locator('#trigger-reference')).toHaveText('svg');

  await trigger.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'First' })).toBeFocused();
  await update(page, 'trigger-reclass');
  await expect(trigger).toHaveClass(/\bcaller-next\b/);
  await expect(trigger).toHaveClass(/\bant-dropdown-open\b/);
  await expect(trigger).not.toHaveClass(/\bowned\b/);

  await page.keyboard.press('Escape');

  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveClass(/\bcaller-next\b/);
  await expect(trigger).not.toHaveClass(/\bant-dropdown-open\b/);
});
