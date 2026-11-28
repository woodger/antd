import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../test';
import reference from '../fixtures/ant-design-form-item-messages-observation.json' with { type: 'json' };

async function act(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true }).evaluate((element: HTMLButtonElement) => {
    element.click();
  });
}

async function measureLayout(item: Locator, prefix: string) {
  return item.evaluate((element, prefix) => {
    const row = element.querySelector(`.${prefix}-item-row`);
    const additional = element.querySelector<HTMLElement>(`.${prefix}-item-additional`);
    const offset = element.querySelector<HTMLElement>(`.${prefix}-item-margin-offset`);
    const sibling = document.getElementById('item-message-sibling');
    if (!row || !sibling) {
      throw new Error('The field row or its neighbor is missing');
    }

    const siblingTop = sibling.getBoundingClientRect().top;
    return {
      offset: offset?.style.marginBottom ?? null,
      offsetAfterRow: Boolean(offset && row.nextElementSibling === offset),
      minHeight: additional?.style.minHeight ?? null,
      gapAfterRow: Math.round((siblingTop - row.getBoundingClientRect().bottom) * 100) / 100,
      itemToSibling: Math.round((siblingTop - element.getBoundingClientRect().top) * 100) / 100
    };
  }, prefix);
}

async function observeMotion(item: Locator, prefix: string) {
  await item.evaluate((element: HTMLElement, prefix) => {
    const phases = new Set<string>();
    const observer = new MutationObserver(() => {
      const holder = element.querySelector(`.${prefix}-item-explain`);
      const offset = element.querySelector(`.${prefix}-item-margin-offset`);
      if (holder && offset) {
        for (const className of holder.classList) {
          if (className.startsWith(`${prefix}-show-help-`)) phases.add(className);
        }
      }
      element.dataset.messageMotion = JSON.stringify([...phases]);
    });
    observer.observe(element, { subtree: true, childList: true, attributeFilter: ['class'] });
  }, prefix);
}

const actions = new Map([
  ['appear', 'Show validation messages'],
  ['reorder-and-replace', 'Replace validation messages'],
  ['clear', 'Clear validation messages']
]);

for (const { profile, initial, observations } of reference.captures) {
  test(`FormItem matches message layout and held margin for ${profile.id}`, async ({ page }) => {
    await page.goto('/?fixture=form-item-messages');
    await page.getByRole('combobox', { name: 'Message profile', exact: true }).selectOption(profile.id);
    const prefix = `${profile.prefixCls}-form`;
    const item = page.locator('.motion-probe-item');
    const input = page.getByRole('textbox', { name: 'Title', exact: true });
    const holder = item.locator(`.${prefix}-item-explain`);
    await input.focus();
    await input.evaluate((element: HTMLInputElement) => element.setSelectionRange(1, 3));
    const editor = await input.elementHandle();
    const originalLayout = await measureLayout(item, prefix);
    await observeMotion(item, prefix);
    let beta: Awaited<ReturnType<Locator['elementHandle']>> | undefined;

    for (const { id, trace } of observations) {
      const expected = trace.at(-1);
      const action = actions.get(id);
      if (!expected || !action) {
        throw new Error(`Missing observation for ${id}`);
      }

      await act(page, action);

      await expect(holder).toHaveCount(expected.holderCount);
      if (expected.holderCount) {
        const connectedClass = new RegExp(`${prefix}-item-explain-connected`);
        await expect(holder).toHaveClass(connectedClass);
        await expect(holder.locator(':scope > div')).toHaveText(expected.entries.map(({ text }) => text));
        if (beta) {
          expect(await holder.getByText('Beta', { exact: true }).evaluate(
            (element, previous) => element === previous, beta
          )).toBe(true);
        }
        else {
          beta = await holder.getByText('Beta', { exact: true }).elementHandle();
        }
      }

      await expect.poll(() => measureLayout(item, prefix)).toMatchObject({
        offset: expected.offset, minHeight: expected.minHeight,
        offsetAfterRow: expected.offsetAfterRow, gapAfterRow: expected.gapAfterRow
      });
      const expectedShift = expected.itemToSibling - initial.itemToSibling;
      await expect.poll(async () => {
        const current = await measureLayout(item, prefix);
        return current.itemToSibling - originalLayout.itemToSibling;
      }).toBeCloseTo(expectedShift, 0);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('Text');
      expect(await input.evaluate((element: HTMLInputElement, previous) => ({
        sameEditor: element === previous,
        selection: [element.selectionStart, element.selectionEnd]
      }), editor)).toEqual({ sameEditor: true, selection: [1, 3] });
    }

    const phases = JSON.parse((await item.getAttribute('data-message-motion')) ?? '[]');
    expect(phases).toEqual(profile.motion ? expect.arrayContaining([
      `${prefix}-show-help-appear-start`, `${prefix}-show-help-leave-active`
    ]) : []);
    await beta?.dispose();
    await editor?.dispose();
  });
}

test('FormItem describes current warnings and fallback help during message exit', async ({ page }) => {
  await page.goto('/?fixture=form-item-messages');
  const item = page.locator('.motion-probe-item');
  const input = page.getByRole('textbox', { name: 'Title', exact: true });
  const holder = item.locator('.ant-form-item-explain');
  await act(page, 'Enable fallback help');
  await expect(input).toHaveAccessibleDescription('Fallback help');

  await act(page, 'Show validation messages');
  await expect(input).toHaveAccessibleDescription('Alpha Beta Warning');
  await page.clock.install();
  await act(page, 'Warn without errors');
  await page.clock.runFor(24);

  await expect(holder).toHaveAttribute('role', 'status');
  await expect(input).toHaveAccessibleDescription('Warning');
  await expect(holder.getByText('Alpha', { exact: true })).toHaveAttribute('aria-hidden', 'true');

  await act(page, 'Clear validation messages');
  await page.clock.runFor(4);

  await expect(holder).toHaveAttribute('aria-hidden', 'true');
  await expect(input).toHaveAccessibleDescription('Fallback help');
  const description = await input.getAttribute('aria-describedby');
  if (!description) {
    throw new Error('The fallback description is missing');
  }
  await expect(item.locator('[id]').filter({ hasText: 'Fallback help' }))
    .toHaveAttribute('id', description);

  await act(page, 'Show validation messages');
  await page.clock.runFor(650);

  await expect(input).toHaveAccessibleDescription('Alpha Beta Warning');
  await expect(item.locator('.ant-form-item-margin-offset')).toHaveCount(1);
});

test('FormItem releases the margin after a noStyle descendant is removed', async ({ page }) => {
  await page.goto('/?fixture=form-item-messages');
  const item = page.locator('.motion-probe-item');
  const input = page.getByRole('textbox', { name: 'Title', exact: true });
  await act(page, 'Mount nested field');
  await expect(page.getByRole('textbox', { name: 'Nested', exact: true })).toBeVisible();
  await act(page, 'Show nested message');

  await expect(input).toHaveAccessibleDescription('Invalid child');
  await expect(item.locator('.ant-form-item-explain-connected')).toHaveCount(1);
  await expect(item.locator('.ant-form-item-margin-offset')).toHaveCount(1);

  await act(page, 'Remove nested field');

  await expect(input).toHaveAccessibleDescription('');
  await expect(item.locator('.ant-form-item-explain')).toHaveCount(0);
  await expect(item.locator('.ant-form-item-margin-offset')).toHaveCount(0);
});

for (const spacing of ['default', 'zero']) {
  test(`FormItem keeps the submit target stable when blur replaces help with ${spacing} margin`, async ({ page }) => {
    await page.goto('/?fixture=form');
    const input = page.getByLabel('Name', { exact: true });
    const submit = page.getByRole('button', { name: 'Submit form', exact: true });
    if (spacing === 'zero') {
      await input.evaluate((element) => {
        const item = element.closest<HTMLElement>('[data-ant-form-item]');
        if (!item) {
          throw new Error('The form item is missing');
        }

        item.style.marginBottom = '0px';
      });
    }
    await input.fill('');
    await expect(input).toHaveAccessibleDescription('Enter your name');
    await submit.scrollIntoViewIfNeeded();
    const before = await submit.boundingBox();
    if (!before) {
      throw new Error('The submit button is outside the layout');
    }

    await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
    await page.mouse.down();
    try {
      await expect(input).toHaveAccessibleDescription('Name is required');
      expect((await submit.boundingBox())?.y).toBe(before.y);
    }
    finally {
      await page.mouse.up();
    }

    await expect(input).toBeFocused();
  });
}

test('FormItem settles a leave on reduced motion and cancels pending work on removal', async ({ page }) => {
  await page.goto('/?fixture=form-item-messages');
  const item = page.locator('.motion-probe-item');
  const holder = item.locator('.ant-form-item-explain');
  const offset = item.locator('.ant-form-item-margin-offset');
  await act(page, 'Show validation messages');
  await expect(offset).toHaveCount(1);
  await page.clock.install();

  await act(page, 'Clear validation messages');
  await page.clock.runFor(80);

  await expect(holder).toHaveClass(/ant-form-show-help-leave-active/);
  await expect(offset).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(holder).toHaveCount(0);
  await expect(offset).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await act(page, 'Show validation messages');
  await page.clock.runFor(65);
  await expect(holder).toHaveClass(/ant-form-show-help-appear-active/);

  await act(page, 'Remove message field');
  await page.clock.runFor(600);

  await expect(item).toHaveCount(0);
  await expect(page.locator('#item-message-sibling')).toBeVisible();
});
