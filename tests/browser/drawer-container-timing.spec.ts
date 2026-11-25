import type { ElementHandle, Locator, Page } from '@playwright/test';
import { test, expect } from './test';
import reference from './fixtures/ant-design-drawer-container-timing-reference.json' with { type: 'json' };

const fixture = {
  selector: ['drawer-missing-selector', 'panel-never'],
  getter: ['drawer-late-getter', 'panel-late-target'],
  provider: ['drawer-late-provider', 'panel-late-target']
} as const;

/** Подключает контейнер снаружи, сохраняя ссылку на getter и строку селектора. */
async function appendTarget(page: Page, id: string) {
  await page.evaluate(targetId => {
    const target = document.createElement('div');
    target.id = targetId;
    target.dataset.drawerDestination = '';
    document.body.append(target);
  }, id);
}

/** Сверяет новый контейнер и состояние поля со снимком Ant Design. */
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

/** Сравнивает форму вызова, поскольку React и Svelte обновляют Portal в разное время. */
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
