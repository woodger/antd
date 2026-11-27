import { test, expect } from '../test';
import { prepareSelectSurface, drainSelectSurface } from '../select-surface-driver';
import { selectIconsGeometry } from '../select-components-modes-cases.mjs';
import {
  readSelectComponentsModesCase,
  selectComponentsModesSamples as selectComponentsSamples
} from '../select-components-modes-reference';
import { settleNativeSelectComponentsModes as settleNativeSelectComponents, verifySelectComponentsModesPoint as verifySelectComponentsPoint } from '../select-components-modes-assertions';
import type { ComponentProps } from 'svelte';
import { selectComponentsModesPopupSource } from '../select-components-modes-key-collision';
import type SelectComponentsModesCase from '../fixtures/SelectComponentsModesCase.svelte';
type Capture = Required<NonNullable<ComponentProps<typeof SelectComponentsModesCase>['capture']>> & { dispose: () => void };
test.use({ viewport: selectIconsGeometry.viewport });
for (const sample of selectComponentsSamples) test(`Select component modes complete Original ${sample.id}`, async (
  { page },
  testInfo
) => {
  const source = readSelectComponentsModesCase(sample.id);
  const trace: unknown[] = [], failures: string[] = [];
  await page.goto('/?fixture=select-components-modes');
  await page.getByRole('combobox', { name: 'Select component modes sample', exact: true }).selectOption(sample.id);

  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-case', sample.id);
  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-components-bound', 'true');
  await prepareSelectSurface(page);
  const capture = await page.evaluateHandle(() => {
    const detail = {} as Capture;
    document.querySelector('[data-select-components-fixture-command]')!.dispatchEvent(new CustomEvent(
      'selectcomponentscapture',
      { detail }
    ));
    if (!detail.read || !detail.readRefs || !detail.update || !detail.dispose) {
      throw Error('Complete actual component bridge required');
    }
    Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
    return detail;
  });
  const verify = async (point: typeof source.initial, label: string) => {
    const actual = await settleNativeSelectComponents(page), boundary = selectComponentsModesPopupSource(
      point,
      source
    );
    trace.push({
      label,
      actual,
      ...(boundary ? { sourceBoundary: {
        name: boundary.name,
        canonical: boundary.canonical,
        keyed: boundary.keyed
      } } : {})
    });
    failures.push(...verifySelectComponentsPoint(actual, point, source, sample, label));
  };
  const editor = async () => {
    const handle = await capture.evaluateHandle(owner => owner.readRefs().editor);
    const element = handle.asElement();
    if (!element) {
      throw Error('Actual public editor ref absent');
    }
    return element;
  };
  try {
    await verify(source.initial, 'initial');
    for (const [index, step] of source.steps.entries()) {
      const action = sample.actions[index];
      expect(action).toEqual(step.action);
      if (action.type === 'props' || action.type === 'context' || action.type === 'inner' || action.type === 'model') {
        await capture.evaluate(
          (owner, value) => owner.update(value.action, value.index),
          { action, index }
        );
      }
      else if (action.type === 'focus-method') {
        await capture.evaluate(
          (owner, options) => owner.readRefs().control!.focus(options),
          'options' in action ? action.options : undefined
        );
      }
      else if (action.type === 'blur-method') {
        await capture.evaluate(owner => owner.readRefs().control!.blur());
      }
      else if (action.type === 'outside') {
        await page.locator('[data-surface-outside]').click();
      }
      else if (action.type === 'root-click') {
        const handle = await capture.evaluateHandle(owner => owner.readRefs().root);
        const element = handle.asElement();
        if (!element) {
          throw Error('Actual public root ref absent');
        }
        await element.click();
        await handle.dispose();
      }
      else if (action.type === 'fill' || action.type === 'component-key') {
        const element = await editor();
        if (action.type === 'fill') {
          await element.fill(action.text);
        }
        else {
          await element.press(action.key);
        }
        await element.dispose();
      }
      else if (action.type === 'remove') {
        await page.locator('.ant-select-selection-item').filter({ hasText: action.value }).locator('.ant-select-selection-item-remove').click();
      }
      else if (action.type === 'clear') {
        const button = page.locator('.ant-select-clear');
        if (action.activation === 'pointer') {
          await button.click();
        }
        else {
          await button.focus();
          await button.press(action.activation);
        }
      }
      else {
        throw Error('Unknown frozen component mode action ' + action.type);
      }
      await page.mouse.move(0, 0);
      await verify(step, index + '/' + JSON.stringify(action));
    }
    const before = await capture.evaluate(owner => owner.read());
    await capture.evaluate(owner => owner.dispose());
    await expect(page.locator('[data-surface-case]')).toHaveCount(0);
    await drainSelectSurface(page);
    const cleanup = async () => ({ owner: await capture.evaluate(owner => owner.read()),
      refs: await capture.evaluate(owner => Object.fromEntries(Object.entries(owner.readRefs()).map(([key, value]) => [key, value == null]))),
      retained: await page.evaluate(() => {
        const observer = (globalThis as unknown as { raw: { iconsObserver: { retained: Map<number, Node> } } }).raw.iconsObserver;
        return [...observer.retained].map(([id, node]) => ({ id, connected: node.isConnected }));
      }), popupCount: await page.locator('.ant-select-dropdown').count() });
    const disposed = await cleanup();
    trace.push({ label: 'disposed', actual: disposed });
    expect(disposed.popupCount).toBe(0);
    expect(disposed.retained.every(n => !n.connected)).toBe(true);
    expect(Object.values(disposed.refs).every(Boolean)).toBe(true);
    expect(disposed.owner.alive).toBe(false);
    for (const key of ['events', 'rawEvents', 'calls'] as const) expect(disposed.owner[key]).toEqual(before[key]);
    await page.waitForTimeout(1000);
    expect(await cleanup()).toEqual(disposed);
    expect(failures).toEqual([]);
  } finally {
    await testInfo.attach(
      'actual-select-components-modes-complete-raw',
      {
        body: JSON.stringify({ sample, trace, failures }, null, 2),
        contentType: 'application/json'
      }
    );
    await capture.dispose();
  }
});
