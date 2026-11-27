import type { ElementHandle, Locator, Page } from '@playwright/test';
import { test, expect } from '../test';
import commitReference from '../fixtures/ant-design-dialog-container-commit-reference.json' with { type: 'json' };
import reference from '../fixtures/ant-design-drawer-container-timing-reference.json' with { type: 'json' };

const fixture = {
  selector: ['drawer-missing-selector', 'panel-never'],
  getter: ['drawer-late-getter', 'panel-late-target'],
  provider: ['drawer-late-provider', 'panel-late-target']
} as const;

/** Connects the container from the outside, saving the link to the getter and the selector string. */
async function appendTarget(page: Page, id: string) {
  await page.evaluate(targetId => {
    const target = document.createElement('div');
    target.id = targetId;
    target.dataset.drawerDestination = '';
    document.body.append(target);
  }, id);
}

/** Converts a new container and field state with an Ant Design shot. */
async function measure(draft: Locator, previous?: ElementHandle) {
  return draft.evaluate((node, old) => {
    if (!(node instanceof HTMLInputElement)) {
      throw new Error('Missing Drawer draft input');
    }

    const destination = node.closest('dialog')?.parentElement;
    return {
      destination: destination?.hasAttribute('data-drawer-destination') ? 'target' : 'default',
      draft: node.value,
      sameInput: node === old
    };
  }, previous);
}

/** Compares the call form, as React and Svelte update Portal at different times. */
async function getterPayloads(page: Page) {
  const text = await page.getByLabel('Panel container calls', { exact: true }).textContent();
  const calls: { getter: string; args: number; body: boolean; }[] = JSON.parse(text ?? '[]');
  const signatures = calls.map(({ getter, args, body }) =>
    getter === 'parent' ? ['provider', args, body] : [getter, args]);
  return [...new Map(signatures.map(signature => [JSON.stringify(signature), signature])).values()];
}

for (const sample of reference.cases) {
  test(`Drawer resolves ${sample.selection} when open changes for ${sample.timing}`, async ({ page }) => {
    await page.goto('/?fixture=dialog-container');
    const [name, targetId] = fixture[sample.selection as keyof typeof fixture];
    const sameTarget = sample.timing === 'same-target';
    if (sameTarget) await appendTarget(page, targetId);
    await page.getByLabel('Dialog reference', { exact: true }).selectOption(name);
    const parent = sameTarget ? `#${targetId}` : 'body';
    await expect(page.locator(`${parent} > dialog.ant-svelte-drawer`)).toHaveCount(1);
    await expect.poll(() => getterPayloads(page)).toEqual(sample.calls);

    const opener = page.getByRole('button', { name: 'Open container panel', exact: true });
    const drawer = page.getByRole('dialog', { name: 'Container panel', exact: true });
    const draft = drawer.getByRole('textbox', { name: 'Panel draft', exact: true });
    let previous: ElementHandle | undefined;
    if (sample.before) {
      await opener.click();
      await expect.poll(() => measure(draft)).toEqual(sample.before);
      await draft.fill('Draft before move');
      previous = await draft.elementHandle();
      await page.getByRole('button', { name: 'Close container panel', exact: true })
        .evaluate(button => {
          if (button instanceof HTMLButtonElement) button.click();
        });
      await expect(drawer).toBeHidden();
    }

    if (!sameTarget) await appendTarget(page, targetId);
    await opener.click();

    await expect.poll(() => measure(draft, previous)).toEqual(sample.after);
    await expect.poll(() => getterPayloads(page)).toEqual(sample.calls);
    await expect(page.locator('dialog.ant-svelte-drawer')).toHaveCount(1);
  });
}

for (const sample of commitReference.cases) {
  const { component, selection, order } = sample;
  test(`${component} finds a same-update ${selection} container mounted ${order} it`, async ({ page }) => {
    await page.goto('/?fixture=dialog-container');
    const preset = selection === 'selector' ? 'missing-selector' : `late-${selection}`;
    await page.getByLabel('Dialog reference', { exact: true }).selectOption(`${component}-${preset}`);
    await page.getByRole('combobox', { name: 'Destination with open', exact: true }).selectOption(order);
    await expect(page.locator('body > dialog')).toHaveCount(1);
    await expect(page.locator('[data-panel-container="late"]')).toHaveCount(0);

    const opener = page.getByRole('button', { name: 'Open container panel', exact: true });
    await opener.click();

    const dialog = page.getByRole('dialog', { name: 'Container panel', exact: true });
    await expect(dialog).toBeVisible();
    const destination = page.locator(`[data-panel-container="${sample.destination}"] > dialog`);
    await expect(destination).toHaveCount(1);
    await expect.poll(() => getterPayloads(page)).toEqual(sample.calls);
    await expect.poll(() => dialog.evaluate(node => node.contains(document.activeElement))).toBe(true);
    if (component === 'drawer') {
      await expect(page.getByLabel('Panel opening destinations', { exact: true }))
        .toHaveText(JSON.stringify([sample.destination]));
    }

    await page.getByRole('button', { name: 'Close container panel', exact: true })
      .evaluate(button => {
        if (button instanceof HTMLButtonElement) button.click();
      });

    await expect(dialog).toBeHidden();
    await expect(destination).toHaveCount(0);
    await expect(opener).toBeFocused();
    await expect(page.locator('html')).not.toHaveCSS('overflow', 'hidden');
  });
}
