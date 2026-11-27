import { mkdtemp, rm } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Locator, Page } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import reference from './fixtures/ant-design-button-loading-motion-reference.json' with {
  type: 'json'
};
import { expect, test } from './test';

type MotionFrame = (typeof reference.cases)[number]['trace'][number];

/** Retains compression and disclosure, taking into account the dimensions of the full-time SVG-icon of the package. */
function relativeWidth(frames: MotionFrame[]) {
  return frames.map(frame => ({
    ...frame,
    width: Number.parseFloat(frame.width) > 0 ? 'expanded' : frame.width
  }));
}

/** Records CSS-frames in mutations, including a short start phase. */
async function watchMotion(action: Locator, alternate: boolean, pauseLeave = false) {
  return action.evaluateHandle((root, { alternate, pauseLeave }) => {
    const prefix = alternate ? 'sample-button' : 'ant-btn';
    const name = prefix + '-loading-icon-motion-';
    const trace: MotionFrame[] = [];
    let lastPhase: string | undefined;

    /** The source of the width is only the full-time icon of the current Button. */
    function spinner() {
      return root.querySelector<HTMLElement>('.' + prefix + '-loading-icon');
    }

    /** Relieves the constant signs of the shell after the completion of the phases. */
    function read() {
      const span = spinner();
      const icon = root.querySelector<HTMLElement>('[data-kind]');
      return {
        tag: root.localName,
        kind: span ? 'default' : icon?.dataset.kind ?? null,
        inlineWidth: span?.style.width ?? null,
        duration: span ? getComputedStyle(span).transitionDuration : null
      };
    }

    /** The active phase can be delayed for a controlled reversal. */
    function record() {
      const span = spinner();
      const label = span && [...span.classList].find(chr =>
        chr.startsWith(name) && /-(start|active)$/.test(chr));
      if (!span || !label) {
        return;
      }
      const phase = label.slice(name.length);
      if (phase === lastPhase) {
        return;
      }
      lastPhase = phase;
      const { width, opacity, transform } = span.style;
      const css = getComputedStyle(span);
      const gap = phase === 'enter-start' || phase === 'appear-start'
        ? alternate ? css.marginInlineStart : css.marginInlineEnd
        : null;
      trace.push({ phase, width, opacity, transform, gap });
      if (pauseLeave && phase === 'leave-active') {
        for (const animation of span.getAnimations()) {
          animation.pause();
        }
      }
    }

    new MutationObserver(record).observe(root, { childList: true, attributes: true, subtree: true });
    return { read, spinner, trace };
  }, { alternate, pauseLeave });
}

/** Uploads a single profile through a public package assembly. */
async function openProfile(page: Page, id: string) {
  await page.goto(`/select-components-hydration.html?loading-motion=${id}`);
  await page.addScriptTag({ type: 'module', url: '/button-loading-motion.client.ts' });
  const action = page.locator('#action');
  await expect(action).toBeVisible();
  return { action, start: page.getByRole('button', { name: 'Start loading' }) };
}

for (const scenario of reference.cases) {
  test(`Button follows the loading indicator lifecycle for ${scenario.id}`, async ({ page }) => {
    const reduced = scenario.id === 'reduced';
    if (reduced) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    const { action, start } = await openProfile(page, scenario.id);
    const probe = await watchMotion(action, scenario.id === 'prefix-end-link');
    expect(await probe.evaluate(current => current.read())).toEqual(scenario.initial);
    // Reduced motion disables transition. Removing custom loading doesn't add a full-time badge.
    const expected = reduced || scenario.id === 'custom-loading-icon' ? [] : scenario.trace;
    const incoming = expected.filter(frame => !frame.phase.startsWith('leave-'));

    if (scenario.id !== 'initial') {
      await start.click();
    }
    if (scenario.id === 'appear') {
      await page.getByRole('button', { name: 'Remove ordinary icon' }).click();
    }

    if (incoming.length) {
      await expect.poll(async () => relativeWidth(await probe.evaluate(current => current.trace)))
        .toEqual(relativeWidth(incoming));
    }
    await expect(action).toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => probe.evaluate(current => current.read())).toEqual(scenario.shown);

    const retained = await probe.evaluate(current => {
      const previous = current.spinner();
      document.getElementById('stop-loading')?.click();
      return Boolean(previous && previous === current.spinner());
    });

    expect(retained).toBe(!reduced && scenario.retainedWhenHidden);
    await expect(action).not.toHaveAttribute('aria-busy', 'true');
    await expect.poll(() => probe.evaluate(current => current.read())).toEqual(scenario.hidden);
    expect(relativeWidth(await probe.evaluate(current => current.trace)))
      .toEqual(relativeWidth(expected));
  });
}

test('re-entering while the indicator leaves keeps the same live spinner', async ({ page }) => {
  const { action, start } = await openProfile(page, 'default');
  const probe = await watchMotion(action, false, true);
  const spinner = action.locator('.ant-btn-loading-icon');
  await start.click();
  await expect.poll(() => probe.evaluate(current => current.trace.map(frame => frame.phase)))
    .toEqual(['enter-start', 'enter-active']);
  await expect(spinner).not.toHaveClass(/-icon-motion/);
  const before = await spinner.elementHandle();

  await page.getByRole('button', { name: 'Stop loading' }).click();
  await expect(spinner).toHaveClass(/-leave-active/);
  await start.click();

  await expect(action).toHaveAttribute('aria-busy', 'true');
  await expect(spinner).not.toHaveClass(/-icon-motion/);
  expect(await spinner.evaluate((node, original) => node === original, before)).toBe(true);
});

test('hydrates the existing loading icon and animates its first leave', async ({ page }) => {
  const cacheDir = await mkdtemp(join(tmpdir(), 'antd-button-loading-motion-'));
  let server: ViteDevServer | undefined;
  try {
    server = await createServer({
      configFile: fileURLToPath(new URL('./vite.config.ts', import.meta.url)),
      server: { middlewareMode: true, hmr: { server: createHttpServer() }, watch: null },
      appType: 'custom',
      cacheDir
    });
    const entry = new URL('./fixtures/button-loading-motion.server.ts', import.meta.url);
    const { renderLoadingButton } = await server.ssrLoadModule(fileURLToPath(entry));
    const { head, body } = renderLoadingButton();
    await page.goto('/select-components-hydration.html?loading-motion=initial&ssr');
    await page.addScriptTag({ type: 'module', url: '/button-loading-motion.client.ts' });
    const root = page.locator('#root');
    await expect(root).toHaveAttribute('data-hydration-ready', 'true');
    await root.evaluate((target, markup) => {
      document.head.insertAdjacentHTML('beforeend', markup.head);
      target.innerHTML = markup.body;
    }, { head, body });
    const action = root.getByRole('button', { name: 'Save', exact: true });
    const spinner = action.locator('.ant-btn-loading-icon');
    const original = await spinner.elementHandle();
    const probe = await watchMotion(action, false);
    await expect(action).toBeDisabled();

    await root.dispatchEvent('hydrate-loading-button');

    await expect(root).toHaveAttribute('data-hydrated', 'true');
    expect(await spinner.evaluate((node, before) => node === before, original)).toBe(true);

    await page.getByRole('button', { name: 'Stop loading' }).click();

    await expect(action).toBeEnabled();
    await expect(spinner).toHaveCount(0);
    expect(await probe.evaluate(current => current.trace.map(frame => frame.phase)))
      .toEqual(['leave-start', 'leave-active']);
  }
  finally {
    await server?.close();
    await rm(cacheDir, { recursive: true, force: true });
  }
});
