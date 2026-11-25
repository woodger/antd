import type { Page } from '@playwright/test';
import reference from './fixtures/ant-design-modal-static-reference.json' with { type: 'json' };
import { expect, test } from './test';

/** Сопоставляет статические и контекстные окна по публичным стилям и содержимому. */
function readDialogs(page: Page) {
  return page.evaluate(() => [...document.querySelectorAll<HTMLDialogElement>('dialog.static-probe[open]')]
    .map(dialog => ({
      prefix: dialog.dataset.antModalPrefix,
      type: [...dialog.classList].find(name => /-confirm-(confirm|warning|success|error|info)$/.test(name)),
      rtl: [...dialog.classList].some(name => name.endsWith('-confirm-rtl')),
      title: dialog.querySelector('[class*="-confirm-title"]')?.textContent ?? '',
      content: dialog.querySelector('[data-static-content]')?.getAttribute('data-static-content') ?? null,
      target: Boolean(dialog.closest('#static-target')),
      actions: [...dialog.querySelectorAll('button')].map(button => ({
        text: button.textContent?.trim() ?? '',
        title: button.title || null,
        class: [...button.classList].find(name => /^(ant|global|holder|scope)-btn$/.test(name))
      }))
    })).sort((first, second) => first.title.localeCompare(second.title)));
}

/** Читает видимый снимок одного статического окна после вызова handle. */
function readLifecycle(page: Page) {
  return page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>('dialog.lifecycle-root[open]');
    if (!dialog) {
      return null;
    }

    const icon = dialog.querySelector('[class*="-confirm-body"] > span');
    return {
      kind: [...dialog.classList].find(name => /-confirm-(confirm|info)$/.test(name)),
      title: dialog.querySelector('[class*="-confirm-title"]')?.textContent ?? null,
      body: dialog.querySelector('[class*="-confirm-content"]')?.textContent ?? null,
      rtl: [...dialog.classList].some(name => name.endsWith('-confirm-rtl')),
      icon: icon?.classList[0] ?? null,
      buttons: [...dialog.querySelectorAll('[data-ant-modal-action]')].map(button => ({
        label: button.textContent?.trim() ?? '',
        title: button.getAttribute('title'),
        classes: [...button.classList].filter(name => /-btn(?:-loading)?$/.test(name))
      }))
    };
  });
}

/** Даёт нативному close event и удалению корня завершить работу. */
function nextFrames(page: Page) {
  return page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() =>
    requestAnimationFrame(() => resolve()))));
}

for (const sample of reference.cases) {
  const profile = sample.profile;
  test(`matches Source static Modal for ${profile.id}`, async ({ page }) => {
    await page.goto(`/modal-static.html?id=${profile.id}`);
    const opener = page.locator('#static-opener');
    const dialogs = page.locator('dialog.static-probe');
    await opener.click();

    await expect.poll(() => readDialogs(page)).toEqual(sample.before.dialogs);
    await expect(page.locator('#static-handles')).toHaveText(JSON.stringify(sample.before.handle));

    if (sample.updated) {
      await page.locator('#static-update-object').dispatchEvent('click');
      await expect(dialogs.getByRole('button', { name: 'Applied object' })).toBeVisible();
      await page.locator('#static-update-function').dispatchEvent('click');
      await expect.poll(() => readDialogs(page)).toEqual(sample.updated.dialogs);
    }
    if (profile.multiple) {
      await page.locator('#static-destroy-all').dispatchEvent('click');
    }
    else if (profile.destroy) {
      await page.locator('#static-destroy').dispatchEvent('click');
    }
    else {
      await dialogs.locator('[data-ant-modal-action="ok"]').click();
    }

    await expect(dialogs).toHaveCount(0);
    const log = page.locator('#static-events');
    if (profile.multiple) {
      const expected = [...sample.events, ['Context', 'result', false]]
        .sort((first, second) => JSON.stringify(first).localeCompare(JSON.stringify(second)));
      await expect.poll(async () => {
        const rows: (string | boolean)[][] = JSON.parse(await log.innerText());
        return rows.sort((first, second) => JSON.stringify(first).localeCompare(JSON.stringify(second)));
      }).toEqual(expected);
    }
    else {
      await expect(log).toHaveText(JSON.stringify(sample.events));
      await expect(opener).toBeFocused();
    }
  });
}

for (const sample of reference.lifecycle) {
  test(`matches Source static Modal scheduling for ${sample.id}`, async ({ page }) => {
    await page.goto(`/modal-static.html?id=${sample.id}`);
    await page.locator('#static-opener').click();
    const dialog = page.locator('dialog.lifecycle-root');
    const log = page.locator('#static-events');

    await expect(page.locator('#static-immediate')).toHaveText(String(sample.immediate));
    if (sample.id === 'abandon') {
      await nextFrames(page);
      await expect(dialog).toHaveCount(0);
      await expect(log).toHaveText('[]');
      return;
    }

    await expect.poll(() => readLifecycle(page)).toEqual(sample.frames[0]);
    if (sample.id === 'async') {
      const ok = dialog.locator('[data-ant-modal-action="ok"]');
      await ok.click();
      await expect(ok).toHaveClass(/\bant-btn-loading\b/);
      await ok.dispatchEvent('click');
      await expect.poll(() => readLifecycle(page)).toEqual(sample.frames[1]);
      await page.locator('#static-release').dispatchEvent('click');
    }
    else if (sample.id === 'hide-reopen') {
      const original = await dialog.elementHandle();
      await page.locator('#static-hide').dispatchEvent('click');
      await expect.poll(() => readLifecycle(page)).toEqual(sample.frames[1]);
      await page.locator('#static-reopen').dispatchEvent('click');
      await expect.poll(() => readLifecycle(page)).toEqual(sample.frames[2]);
      expect(await dialog.evaluate((node, previous) => node === previous, original)).toBe(true);
      await page.locator('#static-destroy').dispatchEvent('click');
    }
    else if (sample.frames.length > 1) {
      const original = await dialog.elementHandle();
      await page.locator('#static-update').dispatchEvent('click');
      await expect.poll(() => readLifecycle(page)).toEqual(sample.frames[1]);
      expect(await dialog.evaluate((node, previous) => node === previous, original)).toBe(true);
      if (sample.id === 'escape-updated') {
        await page.keyboard.press('Escape');
      }
      else if (sample.id === 'cancel-updated') {
        await dialog.locator('[data-ant-modal-action="cancel"]').click();
      }
      else {
        await page.locator('#static-destroy').dispatchEvent('click');
      }
    }
    else {
      await page.locator('#static-destroy').dispatchEvent('click');
    }

    await expect(dialog).toHaveCount(0);
    await expect(log).toHaveText(JSON.stringify(sample.events));
  });
}

test('releases a static dialog whose explicit target was never connected', async ({ page }) => {
  await page.goto('/modal-static.html?id=detached');
  const ref = page.locator('#static-ref');
  await page.locator('#static-opener').click();
  await expect(ref).toHaveText('detached');

  await page.locator('#static-destroy').click();

  await expect(ref).toHaveText('empty');
  await expect(page.locator('#static-events')).toHaveText('[]');
});

test('ignores an action result from before a static dialog was hidden and reopened', async ({ page }) => {
  await page.goto('/modal-static.html?id=stale-async');
  await page.locator('#static-opener').click();
  const dialog = page.locator('dialog.lifecycle-root');
  const ok = dialog.locator('[data-ant-modal-action="ok"]');
  await ok.click();
  await expect(ok).toHaveClass(/\bant-btn-loading\b/);
  await page.locator('#static-hide').dispatchEvent('click');
  await expect(dialog).not.toHaveAttribute('open');
  await page.locator('#static-reopen').dispatchEvent('click');
  await expect(dialog).toHaveAttribute('open');

  const release = page.locator('#static-release');
  await release.dispatchEvent('click');
  await nextFrames(page);

  await expect(dialog).toHaveAttribute('open');
  await expect(ok).not.toHaveClass(/\bant-btn-loading\b/);
  await ok.click();
  await expect(ok).toHaveClass(/\bant-btn-loading\b/);
  await release.dispatchEvent('click');
  await expect(dialog).toHaveCount(0);
});
