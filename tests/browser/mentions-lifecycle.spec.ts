import { createServer as createHttpServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import { expect, test } from './test';
import reference from './fixtures/ant-design-mentions-lifecycle-reference.json' with { type: 'json' };

type Snapshot = Pick<
  (typeof reference.cases)[number]['state']['open'],
  'open' | 'portal' | 'focused' | 'value' | 'selection'
  | 'popupMounts' | 'popupUnmounts' | 'events'
>;
type MotionRecord = { frames: string[][]; names: string[]; };

declare global {
  interface Window {
    mentionsMotion: { read: () => MotionRecord; reset: () => void; };
  }
}

const html = '/select-components-hydration.html';
const script = '/mentions-lifecycle.client.ts';
const popupClass = '.mentions-probe-panel';

test.use({ viewport: { width: 1000, height: 650 } });

/** Снимает классы самой панели и начало реальной CSSAnimation. */
async function recordMotion(page: Page) {
  await page.evaluate(popupClass => {
    const frames: string[][] = [];
    const names: string[] = [];

    function read() {
      const panel = document.querySelector(popupClass);
      const slots = Array.from(panel?.classList ?? [])
        .filter(name => /^mention-(enter|revised|absent)(-|$)/.test(name))
        .sort();
      const previous = frames.at(-1);
      if (JSON.stringify(previous) !== JSON.stringify(slots)) {
        frames.push(slots);
      }
      return { frames, names };
    }

    const observer = new MutationObserver(read);
    observer.observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class']
    });
    document.addEventListener('animationstart', event => {
      if (event.target instanceof Element && event.target.matches(popupClass)) {
        names.push(event.animationName);
      }
    });
    window.mentionsMotion = {
      read,
      reset() {
        frames.length = 0;
        names.length = 0;
      }
    };
    read();
  }, popupClass);
}

/** Сверяет видимость, фокус, каретку, портальный контейнер и порядок callback. */
async function expectSnapshot(page: Page, editor: Locator, state: Snapshot) {
  const open = page.locator(`${popupClass}:popover-open`);
  await expect(open).toHaveCount(Number(state.open));
  if (state.open) {
    await expect(page.locator(`#portal > ${popupClass}:popover-open`))
      .toHaveCount(Number(state.portal));
  }
  if (state.focused) {
    await expect(editor).toBeFocused();
  }
  else {
    await expect(editor).not.toBeFocused();
  }
  await expect(editor).toHaveValue(state.value);
  await expect.poll(() => editor.evaluate((node: HTMLTextAreaElement) =>
    [node.selectionStart, node.selectionEnd])).toEqual(state.selection);
  await expect(page.locator('#probe-events')).toHaveText(JSON.stringify(state.events));
  await expect(page.locator('#probe-mounts')).toHaveText(
    `${state.popupMounts},${state.popupUnmounts}`
  );
}

/** Новый кадр сравнивается с накопленным журналом Source. */
async function expectMotion(page: Page, sample: MotionRecord) {
  await expect.poll(() => page.evaluate(() => window.mentionsMotion.read())).toEqual(sample);
  await page.evaluate(() => window.mentionsMotion.reset());
}

for (const { profile, state } of reference.cases) {
  test(`Mentions matches popup lifecycle for ${profile.id}`, async ({ page }) => {
    if (profile.reduced) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    await page.goto(`${html}?mentions-lifecycle=${profile.id}`);
    await page.addScriptTag({ type: 'module', url: script });
    const editor = page.getByRole('combobox', { name: 'Mention editor' });
    const surface = page.locator(popupClass);
    await expectSnapshot(page, editor, state.initial);
    const original = await editor.elementHandle();
    await recordMotion(page);

    await editor.press('@');
    if (state.interrupted && state.firstMotion) {
      await expect(surface).toHaveClass(/\bmention-enter-appear-active\b/);
      await expect.poll(async () => (await page.evaluate(() => window.mentionsMotion.read())).names)
        .toEqual(state.firstMotion.names);
      await editor.press('Escape');
      await expectSnapshot(page, editor, state.interrupted);
      await expectMotion(page, state.firstMotion);
      // Между двумя открытиями пользователь успевает нажать Escape во время появления.
      await page.evaluate(() => window.mentionsMotion.read());
      await editor.press('@');
    }

    await expectSnapshot(page, editor, state.open);
    await expectMotion(page, state.motion);

    if (state.afterEnter) {
      const mark = page.locator('.probe-mentions-measure span').first();
      await expect.poll(async () => {
        const keyword = await mark.boundingBox();
        const panel = await surface.boundingBox();
        return keyword && panel && panel.x + panel.width <= keyword.x + 0.5 ? 'left' : 'other';
      }).toBe(state.open.side);
      await editor.press('Enter');
      await expectSnapshot(page, editor, state.afterEnter);
      await page.getByRole('option', { name: 'Alice', exact: true }).click();
    }
    else if (profile.loading) {
      await editor.press('Enter');
    }
    else {
      if (state.whileRenamed && state.renameMotion) {
        const previous = await surface.elementHandle();
        await page.getByRole('button', { name: 'Rename motion' }).dispatchEvent('click');
        await expectSnapshot(page, editor, state.whileRenamed);
        await expectMotion(page, state.renameMotion);
        expect(await surface.evaluate((node, before) => node === before, previous)).toBe(true);
      }
      await editor.press('Escape');
    }
    await expectSnapshot(page, editor, state.closed);
    await expectMotion(page, state.closeMotion);
    if (profile.transitionName) {
      await expect(surface).toHaveCount(0);
    }
    if (state.reopened && state.reopenMotion) {
      await page.evaluate(() => window.mentionsMotion.read());
      await editor.press('@');
      await expectSnapshot(page, editor, state.reopened);
      await expectMotion(page, state.reopenMotion);
    }
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  });
}

test('Mentions hydrates before opening its first named appearance', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-mentions-lifecycle-'));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/mentions-lifecycle.server.ts', import.meta.url);
    const { renderMentionsLifecycle } = await server.ssrLoadModule(fileURLToPath(entry));
    const { head, body } = renderMentionsLifecycle();
    await page.goto(`${html}?mentions-lifecycle=named&ssr`);
    await page.addScriptTag({ type: 'module', url: script });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { head, body });
    const editor = page.getByRole('combobox', { name: 'Mention editor' });
    await editor.focus();
    const original = await editor.elementHandle();

    await root.dispatchEvent('hydrate-mentions-lifecycle');
    await expect(root).toHaveAttribute('data-hydrated', 'true');
    await expect(editor).toBeFocused();
    await expect(page.locator(popupClass)).toHaveCount(0);
    await recordMotion(page);
    await editor.press('@');

    const sample = reference.cases.find(item => item.profile.id === 'named');
    if (!sample) {
      throw new Error('Missing Source Mentions appear capture');
    }
    await expectSnapshot(page, editor, sample.state.open);
    await expectMotion(page, sample.state.motion);
    expect(await editor.evaluate((node, before) => node === before, original)).toBe(true);
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
