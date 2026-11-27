import type { Page } from '@playwright/test';
import { expect, test } from './test';
import reference from './fixtures/ant-design-locales-browser-reference.json' with { type: 'json' };

test.use({ viewport: { width: 1440, height: 1400 } });

/** Removes translations around editors, tables and navigation. */
async function readLocale(page: Page) {
  return page.evaluate(() => {
    /** Removes the gap difference between text nodes React and Svelte. */
    function text(selector: string) {
      return document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    }
    const fields = [...document.querySelectorAll<HTMLInputElement>('#picker-fields input')];
    const calendar = [...document.querySelectorAll('#probe-calendar thead th')];
    const pagination = document.querySelector('#probe-pagination');
    const previous = pagination?.querySelector('.ant-pagination-prev');
    const next = pagination?.querySelector('.ant-pagination-next');
    const jump = pagination?.querySelector('.ant-pagination-options-quick-jumper input');

    return {
      placeholders: fields.map(field => field.getAttribute('placeholder')),
      dateValue: fields.find(field => field.id === 'probe-date')?.value,
      timeValue: fields.find(field => field.id === 'probe-time')?.value,
      weekdays: calendar.map(cell => cell.textContent?.trim()),
      pagination: [
        previous?.getAttribute('title'),
        next?.getAttribute('title'),
        jump?.previousSibling?.textContent?.trim() ?? '',
        jump?.nextSibling?.textContent?.trim() ?? ''
      ],
      empty: text('#probe-empty .ant-empty-description'),
      table: text('#probe-table .ant-empty-description')
    };
  });
}

/** Changes the state of fixture without translating the focus from the current editor. */
async function command(page: Page, name: string) {
  await page.getByRole('button', { name, exact: true })
    .evaluate(button => (button as HTMLButtonElement).click());
}

for (const { sample, initial, modal, popconfirm, changed } of reference.cases) {
  test(`published ${sample.code} locale renders labels from Ant Design`, async ({ page }) => {
    await page.clock.setFixedTime(new Date(reference.reference.now));
    await page.goto('/locale-catalog.html?code=' + sample.code);

    await expect(page.locator('#probe-calendar thead th')).toHaveCount(7);
    await expect.poll(() => readLocale(page)).toEqual(initial);

    await command(page, 'Show locale modal');
    await expect(page.locator('.ant-modal-footer button')).toHaveText(modal);

    await command(page, 'Show locale popconfirm');
    await expect(page.locator('.ant-popconfirm-buttons button')).toHaveText(popconfirm);

    if (changed) {
      await command(page, 'Hide locale dialogs');
      const editor = page.locator('#probe-date');
      await editor.focus();
      const original = await editor.elementHandle();

      await command(page, 'Load German locale');
      await expect.poll(() => readLocale(page)).toEqual(changed.data);
      expect(await editor.evaluate((node, previous) => node === previous, original))
        .toBe(changed.sameEditor);
      expect(await editor.evaluate(node => node === document.activeElement)).toBe(changed.focused);
    }
  });
}

test('a nested Svelte locale can override one label from an imported dictionary', async ({ page }) => {
  await page.goto('/locale-catalog.html?code=fr_FR');
  const override = page.locator('#probe-pagination-override');
  const parent = page.locator('#probe-pagination');

  await expect(override.locator('.ant-pagination-next')).toHaveAttribute('title', 'Next chapter');
  await expect(override.locator('.ant-pagination-prev')).toHaveAttribute('title', 'Page précédente');
  await expect(parent.locator('.ant-pagination-next')).toHaveAttribute('title', 'Page suivante');
});
