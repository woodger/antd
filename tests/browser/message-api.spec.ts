import type { Page } from '@playwright/test';
import reference from './fixtures/ant-design-message-api-reference.json' with { type: 'json' };
import { expect, test } from './test';

type Sample = typeof reference.cases[number];
type Frame = Sample['frames'][number];

/** Снимает видимую поверхность. Порядок карточек проверяется по их координатам. */
function readFrame(page: Page) {
  return page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-ant-message-root]:popover-open');
    const prefix = root?.dataset.antMessagePrefix;
    if (!root || !prefix) {
      return null;
    }

    /** Изолирует пользовательские классы и заданные в сценарии CSS-переменные. */
    function appearance(node: HTMLElement | null) {
      if (!node) {
        return null;
      }
      const names = [...node.style].filter(name =>
        /^--(?:configured|provider|holder|notice|winner|extra|shared)$/.test(name));
      return {
        classes: [...node.classList].filter(name =>
          /^(?:configured|provider|holder|notice)-/.test(name)).sort(),
        styles: Object.fromEntries(names.map(name => [name, node.style.getPropertyValue(name).trim()]))
      };
    }

    const content = root.querySelector<HTMLElement>('[data-ant-message-content]');
    const nodes = [...root.querySelectorAll<HTMLElement>('[data-ant-message-notice]')];
    const notices = nodes.map(node => {
      const title = node.querySelector<HTMLElement>('[data-ant-message-title]');
      const wrapper = node.querySelector<HTMLElement>('[data-ant-message-wrapper]');
      const icon = node.querySelector<HTMLElement>('[data-ant-message-icon]');
      const type = [...node.classList].map(name =>
        name.match(/-notice-(info|success|warning|error|loading)$/)?.[1]).find(Boolean);
      return {
        text: title?.textContent ?? null,
        type: type ?? null,
        role: node.getAttribute('role'),
        opacity: getComputedStyle(node).opacity,
        root: appearance(node), title: appearance(title), wrapper: appearance(wrapper),
        icon: appearance(icon)
      };
    });
    const visualOrder = nodes.filter(node => getComputedStyle(node).opacity !== '0')
      .sort((first, second) => first.getBoundingClientRect().y - second.getBoundingClientRect().y)
      .map(node => node.querySelector('[data-ant-message-title]')?.textContent ?? null);
    return {
      prefix, notices, visualOrder,
      list: appearance(root), listContent: appearance(content),
      stack: root.classList.contains(`${prefix}-stack`),
      expanded: root.classList.contains(`${prefix}-stack-expanded`),
      rtl: root.classList.contains(`${prefix}-rtl`),
      top: root.style.getPropertyValue('--notification-top'),
      target: root.parentElement === document.body ? 'body' : root.closest('[id]')?.id ?? 'inline',
      placeholder: content && getComputedStyle(content, '::before').opacity
    };
  });
}

/** Контекстная очередь сохраняет собственные role=status и inline-контейнер. */
function contextualFrame(frame: Frame) {
  return {
    ...frame,
    notices: frame.notices.map(notice => ({ ...notice, role: 'status' })),
    target: frame.target === 'body' ? 'app' : frame.target
  };
}

/** Читает фактическую форму handle и результат разрешения настроек экземпляра. */
function readBefore(page: Page) {
  return page.evaluate(() => {
    const probe = window.messageProbe;
    return {
      hooks: Object.fromEntries(Object.entries(probe.handles).map(([name, handle]) =>
        [name, { keys: Object.keys(handle).sort(), promise: 'promise' in handle }])),
      props: Object.fromEntries(Object.entries(probe.arguments).map(([name, props]) =>
        [name, Object.fromEntries(Object.entries(props).map(([key, value]) => [key, value ?? null]))])),
      sameNode: probe.original
        ? probe.original === document.querySelector('[data-ant-message-title]') : null,
      containerArity: [...new Set(probe.containerCalls)]
    };
  });
}

/** Svelte вызывает onClose и завершает handle после программного закрытия и FIFO. */
const manualCloses: Record<string, readonly string[]> = {
  'context-family': ['Plain', 'Zero', 'Blank', 'info', 'success', 'warning', 'error', 'loading'],
  'context-queue': ['Removed', 'Updated'],
  'context-typed': ['positional'],
  'context-semantics': ['Decorated'],
  'context-portal': ['Visible'],
  'provider-portal': ['Visible'],
  'app-message': ['One', 'Two', 'Three', 'Four'],
  stack: ['Three', 'One', 'Two'],
  motion: ['Visible'],
  'motion-disabled': ['Visible']
};

/** Соответствие имени handle и обновлённой видимой записи, включая общий ключ. */
const closeLabel: Record<string, string> = {
  plain: 'Plain', 'same-first': 'Updated', 'same-last': 'Updated', removed: 'Removed',
  priority: 'positional', semantic: 'Decorated', single: 'Visible', zero: 'Zero', blank: 'Blank'
};

/** Отдельно проверяет запланированное завершение Svelte handles после DOM. */
async function assertCompletion(page: Page, sample: Sample) {
  const pending = Object.keys(sample.before.hooks);
  await expect.poll(() => page.evaluate(() =>
    window.messageProbe.events.filter(event => event[1] === 'then').length)).toBe(pending.length);
  const events = await page.evaluate(() => window.messageProbe.events);

  if (sample.kind === 'context-timeout') {
    expect(events).toEqual(sample.after.events);
    return;
  }

  const observed = events.filter(event => event[1] !== 'close' && event[1] !== 'then');
  expect(observed).toEqual(sample.after.events);
  const closed = events.filter(event => event[1] === 'close');
  expect(closed).toEqual(manualCloses[sample.kind].map(label => [label, 'close']));
  for (const name of pending) {
    const settled = events.findIndex(event => event[0] === name && event[1] === 'then');
    const label = closeLabel[name] ?? name;
    const close = events.findIndex(event => event[0] === label && event[1] === 'close');
    expect(close).toBeGreaterThanOrEqual(0);
    expect(settled).toBeGreaterThan(close);
    expect(events[settled]).toEqual([name, 'then', true]);
  }
}

for (const sample of reference.cases) {
  test(`matches Source Message for ${sample.kind}`, async ({ page }) => {
    const frames = sample.frames.map(contextualFrame);
    await page.setViewportSize({ width: 1100, height: 700 });
    await page.goto(`/message-api.html?kind=${sample.kind}`);
    if (sample.kind === 'motion') {
      await expect.poll(() => page.evaluate(() => window.messageProbe.motion)).toEqual(['message-enter']);
    }

    await expect.poll(() => readFrame(page)).toEqual(frames[0]);
    if (sample.before.sameNode !== null) {
      const editor = page.getByRole('textbox', { name: 'Outside editor' });
      await editor.evaluate((node: HTMLInputElement) => {
        node.focus();
        node.setSelectionRange(2, 6);
      });
      await page.evaluate(async () => {
        const probe = window.messageProbe;
        probe.original = document.querySelector('[data-ant-message-title]');
        await probe.move?.();
      });
      await expect.poll(() => readFrame(page)).toEqual(frames[1]);
      await expect(editor).toBeFocused();
      expect(await editor.evaluate((node: HTMLInputElement) =>
        [node.selectionStart, node.selectionEnd])).toEqual([2, 6]);
    }
    else if (sample.kind === 'stack') {
      await page.getByText('Three', { exact: true }).hover();
      await expect.poll(() => readFrame(page)).toEqual(frames[1]);
      await page.evaluate(() => window.messageProbe.handles.Three());
      await expect.poll(() => readFrame(page)).toEqual(frames[2]);
    }
    else if (sample.kind === 'context-semantics') {
      await page.getByText('Decorated', { exact: true }).click();
    }

    const hooks = Object.fromEntries(Object.keys(sample.before.hooks)
      .map(name => [name, { keys: ['then'], promise: false }]));
    await expect.poll(() => readBefore(page)).toEqual({ ...sample.before, hooks });

    await page.evaluate(() => window.messageProbe.finish());
    await expect(page.locator('[data-ant-message-root]')).toHaveCount(0);
    await assertCompletion(page, sample);
    expect(await page.evaluate(() => window.messageProbe.motion)).toEqual(sample.after.motion);
  });
}

test('pauses all hover-enabled Message deadlines while the stack is expanded', async ({ page }) => {
  await page.clock.install();
  await page.goto('/message-api.html?kind=stack-timeout');
  const list = page.locator('[data-ant-message-root]');
  const messages = list.locator('[data-ant-message-title]');
  await expect(list).toHaveClass(/\bant-message-stack\b/);
  await expect(list).not.toHaveClass(/\bant-message-stack-expanded\b/);
  await expect(messages).toHaveText(['One', 'Two', 'Three', 'Four']);

  await page.getByText('Four', { exact: true }).hover();
  await expect(list).toHaveClass(/\bant-message-stack-expanded\b/);
  await page.clock.fastForward(3000);

  await expect(messages).toHaveText(['One', 'Three', 'Four']);
  await page.getByRole('textbox', { name: 'Outside editor' }).hover();
  await page.clock.fastForward(3000);

  await expect(messages).toHaveText(['Four']);
  await page.evaluate(() => window.messageProbe.finish());
  await expect(list).toHaveCount(0);
});
