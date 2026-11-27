import type { Locator } from '@playwright/test';
import { expect, test } from '../test';

test.use({ viewport: { width: 360, height: 720 } });

/** Removes the width of the roots and the calculated styles of the fields inside each column. */
async function readColumn(column: Locator) {
  return column.evaluate(node => {
    const controls = [...node.querySelectorAll(':scope > [data-ant-picker-prefix]')];
    const editors = [...node.querySelectorAll('input, textarea')];

    return {
      widths: controls.map(control => control.getBoundingClientRect().width),
      editors: editors.map(editor => {
        const style = getComputedStyle(editor);
        const placeholder = getComputedStyle(editor, '::placeholder');
        const control = editor.closest('[data-ant-picker-prefix]');
        const bounds = editor.getBoundingClientRect();
        const field = control?.getBoundingClientRect();

        return {
          background: style.backgroundColor,
          border: style.borderTopWidth,
          color: style.color,
          fitsControl: Boolean(field && bounds.width > 0
            && bounds.left >= field.left && bounds.right <= field.right),
          font: style.fontFamily,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          placeholderColor: placeholder.color,
          resize: style.resize
        };
      })
    };
  });
}

const profiles = [
  { label: 'light', query: '', fontSize: '16px' },
  { label: 'dark', query: '&dark', fontSize: '16px' },
  { label: 'large with custom prefix and RTL', query: '&dark&size=large&prefix&rtl', fontSize: '19px' },
  { label: 'small and disabled', query: '&size=small&disabled', fontSize: '13px' }
];

for (const { label, query, fontSize } of profiles) {
  test(`built-in picker textarea fits the input column and uses theme styles in ${label}`, async ({
    page
  }) => {
    await page.goto(`/?fixture=picker-textarea${query}`);
    const input = page.locator('[data-picker-editor-column="input"]');
    const textarea = page.locator('[data-picker-editor-column="textarea"]');
    await expect(input.locator('input')).toHaveCount(6);
    await expect(textarea.locator('textarea')).toHaveCount(6);

    const ordinary = await readColumn(input);
    const replacement = await readColumn(textarea);

    expect(ordinary.widths).toEqual([288, 288, 288, 288]);
    expect(replacement.widths).toEqual(ordinary.widths);
    expect(replacement.editors).toEqual(ordinary.editors);
    for (const editor of replacement.editors) {
      expect(editor).toMatchObject({
        border: '0px',
        background: 'rgba(0, 0, 0, 0)',
        fitsControl: true,
        fontSize,
        resize: 'none'
      });
    }
  });
}
