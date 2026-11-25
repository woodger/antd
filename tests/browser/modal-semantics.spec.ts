import type { Page } from '@playwright/test';
import reference from './fixtures/ant-design-modal-semantics-reference.json' with { type: 'json' };
import { expect, test } from './test';

type SourceCase = (typeof reference.cases)[number];
type SourceFrame = NonNullable<SourceCase['open' | 'updated' | 'reopened']>;
const interior = [
  'mask', 'container', 'close', 'header', 'title', 'body', 'footer',
  'confirm-title', 'confirm-content', 'confirm-btns', 'render'
] as const;

/** Читает оба слоя оболочки и оформляемые части внутри нативного dialog. */
function readFrame(page: Page) {
  return page.locator('dialog.explicit-root[open]').evaluate((dialog, names) => {
    const shell = dialog as HTMLDialogElement;
    const prefix = shell.dataset.antModalPrefix;

    /** Выделяет изменения, сделанные публичными props в контрольном примере. */
    function read(node: HTMLElement | null) {
      if (!node) {
        return null;
      }

      const relevant = [...node.classList].filter(name =>
        /^(provider-|local-|explicit-|replacement-|width-)/.test(name)).sort();
      const style = Object.fromEntries(Array.from(node.style)
        .filter(name => /^--(?:provider|local|winner|explicit|raw-root)(?:-|$)/.test(name))
        .map(name => [name, node.style.getPropertyValue(name)]));
      return {
        classNames: relevant, style, border: node.style.borderTopWidth || null,
        width: node.style.width || null, padding: node.style.padding || null,
        zIndex: node.style.zIndex || null, extra: node.getAttribute('data-extra'),
        ariaLabel: node.getAttribute('aria-label')
      };
    }

    const slots = Object.fromEntries(names.map(slot => {
      const selector = slot.startsWith('confirm-') ? `.${prefix}-${slot}`
        : `[data-ant-modal-${slot}]`;
      return [slot, read(shell.querySelector<HTMLElement>(selector))];
    }));
    const render = shell.querySelector('[data-custom-render]');
    const container = shell.querySelector('[data-ant-modal-container]');
    const editor = shell.querySelector<HTMLInputElement>('#modal-semantic-editor');
    const context = window as Window & { modalSemanticInputs?: unknown; };
    return {
      shell: read(shell), panel: read(shell.querySelector('[data-ant-modal-panel]')), slots,
      backdrop: getComputedStyle(shell, '::backdrop').backgroundColor,
      renderOwnsContainer: Boolean(render && container && render.contains(container)),
      inputValue: editor?.value ?? null,
      inputs: context.modalSemanticInputs
    };
  }, interior);
}

/** Сравнивает с измерением Source с учётом объявленного отображения на native dialog. */
async function expectFrame(page: Page, source: SourceFrame, confirmation: boolean) {
  const frame = await readFrame(page);

  const { root, wrapper } = source.slots;
  const { tag: _rootTag, ...rootPart } = root;
  const { tag: _wrapperTag, ...wrapperPart } = wrapper;
  const { tag: _panelTag, ...panelPart } = source.panel;
  const shellClasses = [
    ...rootPart.classNames, ...wrapperPart.classNames,
    ...panelPart.classNames.filter(name => name === 'explicit-panel')
  ].sort();
  const rootStyle = confirmation ? {} : { '--winner': 'rawRootStyle', '--raw-root': 'raw-root' };
  const { '--raw-wrap': _deprecatedWrap, '--winner': wrapperWinner, ...wrapperStyle }
    = wrapperPart.style;
  const winner = wrapperWinner === 'wrapStyle' ? {} : { '--winner': wrapperWinner };
  expect(frame.shell).toEqual({
    ...wrapperPart, classNames: shellClasses,
    style: { ...rootStyle, ...rootPart.style, ...wrapperStyle, ...winner },
    border: wrapperPart.border ?? rootPart.border,
    width: panelPart.width
  });
  expect(frame.panel).toEqual({
    ...panelPart, width: null,
    classNames: panelPart.classNames.filter(name => name !== 'explicit-panel')
  });

  for (const name of interior) {
    const expected = source.slots[name];
    if (!expected || confirmation && (name === 'header' || name === 'title')) {
      expect(frame.slots[name], name).toBeNull();
      continue;
    }
    if (name === 'mask' && expected.classNames.length === 0 && !Object.keys(expected.style).length) {
      expect(frame.slots.mask).toBeNull();
      expect(frame.backdrop).toBe('rgba(0, 0, 0, 0.45)');
      continue;
    }

    const { tag: _tag, ...part } = expected;
    expect(frame.slots[name], name).toEqual(part);
  }
  expect(frame.inputs).toEqual(source.inputs);
  expect(frame.renderOwnsContainer).toBe(source.renderOwnsContainer);
  expect(frame.inputValue).toBe(source.inputValue);
  const events = page.locator('#semantic-events');
  await expect(events).toHaveText(JSON.stringify(source.callbacks));
  if (source.ref) {
    await expect(page.locator('#semantic-ref')).toHaveText(JSON.stringify(source.ref));
  }
}

for (const sample of reference.cases) {
  const { profile } = sample;
  test(`matches measured Modal semantics for ${profile.id}`, async ({ page }) => {
    await page.goto(`/modal-semantics.html?id=${profile.id}`);
    if (profile.confirm) {
      await page.locator('#modal-semantic-confirm').click();
    }

    const editor = page.locator('#modal-semantic-editor');
    const activeDialog = page.locator('dialog.explicit-root[open]');
    await expect(activeDialog).toBeVisible();
    await expect(page.locator('#semantic-events')).toHaveText('[true]');
    await expectFrame(page, sample.open, Boolean(profile.confirm));

    if (sample.updated) {
      await editor.focus();
      const element = await editor.elementHandle();
      await page.locator('#semantic-update').dispatchEvent('click');
      await expect(activeDialog).toHaveCSS('width', sample.updated.panel.width);
      await expectFrame(page, sample.updated, false);
      await expect(editor).toBeFocused();
      expect(await editor.evaluate((node, before) => node === before, element)).toBe(true);
    }
    if (sample.closed && sample.reopened) {
      await editor.fill('Draft');
      await page.locator('#semantic-close').dispatchEvent('click');
      await expect(activeDialog).toHaveCount(0);
      await expect(page.locator('#semantic-events')).toHaveText(JSON.stringify(sample.closed.callbacks));
      await expect(page.locator('#semantic-ref')).toHaveText(JSON.stringify(sample.closed.ref));
      if (sample.closed.inputValue === null) {
        await expect(editor).toHaveCount(0);
      }
      else {
        await expect(editor).toHaveValue(sample.closed.inputValue);
      }

      await page.locator('#semantic-open').click();
      await expect(activeDialog).toBeVisible();
      await expect(page.locator('#semantic-events')).toHaveText(JSON.stringify(sample.reopened.callbacks));
      await expectFrame(page, sample.reopened, false);
    }
  });
}

test('keeps the customized mask below the editor and gives the wrapper its click handler', async ({ page }) => {
  await page.goto('/modal-semantics.html?id=interactive-mask');
  const dialog = page.locator('dialog.explicit-root[open]');
  const mask = dialog.locator('[data-ant-modal-mask]');
  const editor = dialog.getByRole('textbox', { name: 'Draft' });
  await expect(mask).toHaveCSS('background-color', 'rgb(20, 30, 40)');
  await expect(mask).toHaveCSS('z-index', '1500');
  await expect(mask).toHaveCSS('pointer-events', reference.pointer.maskPointerEvents);

  await editor.click();
  await expect(editor).toBeFocused();
  await page.mouse.click(4, 4);
  const events = page.locator('#semantic-events');
  await expect(events).toHaveText(JSON.stringify([true, ...reference.pointer.pointerEvents]));
  await expect(dialog).toBeVisible();

  await mask.dispatchEvent('click');
  await expect(events).toHaveText('[true,"wrapper-click","mask-click"]');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('dismisses a managed dialog through the styled backdrop hit area', async ({ page }) => {
  await page.goto('/modal-semantics.html?id=managed-mask');
  const dialog = page.locator('dialog.explicit-root[open]');
  const events = page.locator('#semantic-events');
  await expect(dialog).toHaveAttribute('data-ant-modal-managed');
  await expect(events).toHaveText('[true]');

  await page.mouse.click(4, 4);

  await expect(dialog).toHaveCount(0);
  await expect(events).toHaveText('[true,"close",false]');
});

test('uses the real styled mask as the target of stock motion', async ({ page }) => {
  await page.goto('/modal-semantics.html?id=animated-mask');
  const dialog = page.locator('dialog.explicit-root[open]');
  const mask = dialog.locator('[data-ant-modal-mask]');
  await expect.poll(() => mask.evaluate(node => node.getAnimations().some(animation =>
    animation.effect instanceof KeyframeEffect && animation.effect.target === node))).toBe(true);
  await page.mouse.click(4, 4);
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#semantic-events')).toHaveText('["close",false]');
});

test('keeps the styled mask attached through its independent CSS leave', async ({ page }) => {
  await page.goto('/modal-semantics.html?id=named-mask');
  const dialog = page.locator('dialog.explicit-root');
  const mask = dialog.locator('[data-ant-modal-mask]');
  await expect(dialog).toHaveAttribute('open', '');
  await expect(page.locator('#semantic-events')).toHaveText('[true]');
  const original = await mask.elementHandle();

  await page.locator('#semantic-close').dispatchEvent('click');

  await expect(dialog).not.toHaveAttribute('open');
  await expect(page.locator('#semantic-events')).toHaveText('[true,"close",false]');
  await expect(mask).toHaveClass(/\bsemantic-mask-leave-active\b/);
  expect(await mask.evaluate((node, before) => node === before, original)).toBe(true);
  await mask.evaluate(node => {
    for (const animation of node.getAnimations()) animation.finish();
  });
  await expect(mask).toHaveCount(0);
});

test('tracks the confirmation ref and afterClose when modalRender replaces every child', async ({ page }) => {
  await page.goto('/modal-semantics.html?id=replace-confirmation');
  await page.locator('#modal-semantic-confirm').click();
  const dialog = page.getByRole('dialog', { name: 'Replacement confirmation' });
  const replace = dialog.getByRole('button', { name: 'Finish' });
  await expect(replace).toBeFocused();
  await expect(dialog.locator('[data-ant-modal-container]')).toHaveCount(0);
  await expect(page.locator('#semantic-events')).toHaveText('["ref-set",true]');
  await expect(page.locator('#semantic-ref')).toHaveText(
    '{"attached":true,"role":"dialog","isPanel":true}'
  );

  await replace.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#semantic-events')).toHaveText('["ref-set",true,"close",false,"ref-clear"]');
  await expect(page.locator('#semantic-ref')).toHaveText(
    '{"attached":false,"role":null,"isPanel":false}'
  );
});
