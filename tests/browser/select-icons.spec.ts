import { test, expect } from './test';
import { prepareSelectSurface, drainSelectSurface } from './select-surface-driver';
import { selectIconSamples, selectIconsGeometry } from './select-icons-cases.mjs';
import { readSelectIconPair, readSelectIconEmptyCounterpart, readSelectIconCloseCounterpart } from './select-icons-reference';
import { createIconIdentityLedger, settleNativeSelectIcons, verifySelectIconPoint, type NativeIconOwner } from './select-icons-assertions';
import type { ComponentProps } from 'svelte';
import type SelectIconsCase from './fixtures/SelectIconsCase.svelte';
type Capture = Required<NonNullable<ComponentProps<typeof SelectIconsCase>['capture']>> & { dispose: () => void };
test.use({ viewport: selectIconsGeometry.viewport });
for (const sample of selectIconSamples) test(`Select icon contracts match complete Original ${sample.id}`, async (
  { page },
  testInfo
) => {
  const entries = readSelectIconPair(sample.id), [source, repeat] = entries;
  const emptyCounterpart = readSelectIconEmptyCounterpart(sample.id);
  const closeCounterpart = readSelectIconCloseCounterpart(sample.id);
  if (closeCounterpart) {
    expect(closeCounterpart.events).toEqual(source.events);
    for (const [index, point] of [source.initial, ...source.steps].entries()) {
      const counterpart = [closeCounterpart.initial, ...closeCounterpart.steps][index];
      expect(counterpart.dom).toEqual(point.dom);
      for (const key of ['settings', 'model', 'open', 'query', 'authoredProps', 'authoredProvider', 'authoredInnerProvider',
        'eventCount', 'rawEventCount', 'lifecycleCount'] as const) {
        expect(
          counterpart.owner[key],
          key
        ).toEqual(point.owner[key]);
      }
    }
  }
  const identity = createIconIdentityLedger();
  const trace: unknown[] = [], failures: string[] = [];
  await page.goto('/?fixture=select-icons');
  await page.getByRole('combobox', { name: 'Select icon sample', exact: true }).selectOption(sample.id);

  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-surface-case', sample.id);
  await expect(page.locator('[data-surface-case]')).toHaveAttribute('data-icons-bound', 'true');
  await prepareSelectSurface(page);
  const capture = await page.evaluateHandle(() => {
    const detail = {} as Capture;
    document.querySelector('[data-select-icons-fixture-command]')!.dispatchEvent(new CustomEvent(
      'selecticonscapture',
      { detail }
    ));
    if (!detail.read || !detail.readRefs || !detail.update || !detail.dispose) {
      throw Error('Actual Native icon capture incomplete');
    }
    Object.assign(globalThis, { raw: { current: { readRefs: detail.readRefs } } });
    return detail;
  });
  let resources: Awaited<ReturnType<typeof settleNativeSelectIcons>>['icons']['resources'] | undefined;
  const verify = async (
    point: typeof source.initial,
    repeated: typeof source.initial,
    label: string
  ) => {
    const actual = await settleNativeSelectIcons(page);
    trace.push({ label, actual });
    const index = point === source.initial ? -1 : source.steps.indexOf(point as typeof source.steps[number]);
    const closePoint = index < 0 ? closeCounterpart?.initial : closeCounterpart?.steps[index];
    failures.push(...verifySelectIconPoint(actual, point, repeated, entries, sample, label, identity,
      index < 0 ? emptyCounterpart?.initial : emptyCounterpart?.steps[index], closeCounterpart && closePoint
        ? closeCounterpart.producerCalls.slice(0, closePoint.owner.producerCount) : undefined));
    resources ??= actual.icons.resources;
    if (JSON.stringify(actual.icons.resources) !== JSON.stringify(resources)) failures.push(label + '/new external resource');
    const stableBindings = await capture.evaluate((owner, phase) => {
      const environment = globalThis as unknown as { raw: { nativeIconBindings?: Map<number, ReturnType<typeof owner.readRefs> & {
        focus?: unknown;
        blur?: unknown;
        scrollTo?: unknown
      }> } };
      const bindings = environment.raw.nativeIconBindings ??= new Map();
      const current = owner.readRefs();
      if (!bindings.has(phase)) {
        bindings.set(phase, { ...current, focus: current.control?.focus,
          blur: current.control?.blur, scrollTo: current.control?.scrollTo });
      }
      const prior = bindings.get(phase)!;
      return { root: current.root === prior.root, editor: current.editor === prior.editor, control: current.control === prior.control,
        focus: current.control?.focus === prior.focus, blur: current.control?.blur === prior.blur, scrollTo: current.control?.scrollTo === prior.scrollTo };
    }, point.icons.current.root!.identity);
    if (!Object.values(stableBindings).every(Boolean)) failures.push(label + '/public Native bindings changed within the same Original root phase: ' + JSON.stringify(stableBindings));
  };
  try {
    await verify(source.initial, repeat.initial, 'initial');
    for (const [index, step] of source.steps.entries()) {
      // The frozen module preserves shared objects within an authored action;
      // JSON reference storage cannot carry those aliases across properties.
      const action = sample.actions[index];
      expect(action).toEqual(step.action);
      const editor = () => page.locator('[data-surface-case]').getByRole(
        'combobox',
        { name: 'Icon value', exact: true }
      );
      if (action.type === 'props' || action.type === 'context' || action.type === 'inner' || action.type === 'model') {
        await capture.evaluate(
          (value, input) => value.update(input.action, input.index),
          { action, index }
        );
      }
      else if (action.type === 'click') await page.locator('[data-surface-case] .surface-control').click();
      else if (action.type === 'outside') await page.locator('[data-surface-outside]').click();
      else if (action.type === 'fill') await editor().fill(action.text);
      else if (action.type === 'choose') {
        await page.locator('.ant-select-dropdown:visible .ant-select-item-option-content')
          .filter({ hasText: new RegExp('^' + action.text + '$') }).click();
      }
      else if (action.type === 'remove') await page.locator('.ant-select-selection-item').filter({ hasText: action.value }).locator('.ant-select-selection-item-remove').click();
      else if (action.type === 'clear') {
        const clear = page.locator('.ant-select-clear');
        if (action.activation === 'pointer') await clear.click(); else {
          await clear.focus();
          await clear.press(action.activation);
        }
      }
      else if (action.type === 'suffix-click') {
        const box = await page.locator('.ant-select-suffix').boundingBox();
        if (!box) {
          throw Error('Actual suffix absent for physical hit test');
        }
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
      else throw Error('Unexpected action in the full icon corpus: ' + action.type);
      await page.mouse.move(0, 0);
      await verify(step, repeat.steps[index], index + '/' + JSON.stringify(action));
    }
    const before = await capture.evaluate(value => value.read());
    await capture.evaluate(value => value.dispose());
    await expect(page.locator('[data-surface-case]')).toHaveCount(0);
    await drainSelectSurface(page);
    const cleanup = async () => ({ owner: await capture.evaluate(value => value.read()) as NativeIconOwner,
      refs: await capture.evaluate(value => Object.fromEntries(Object.entries(value.readRefs()).map(([key, value]) => [key, value == null]))),
      retained: await page.evaluate(() => {
        const observer = (globalThis as unknown as { raw: { iconsObserver: { retained: Map<number, Node> } } }).raw.iconsObserver;
        return [...observer.retained].map(([identity, node]) => ({
          identity,
          connected: node.isConnected
        }));
      }), popupCount: await page.locator('.ant-select-dropdown').count() });
    const disposed = await cleanup();
    trace.push({ label: 'disposed', actual: disposed });
    expect(disposed.popupCount).toBe(0);
    expect(disposed.retained.every(node => !node.connected)).toBe(true);
    expect(Object.values(disposed.refs).every(Boolean)).toBe(true);
    expect(disposed.owner.alive).toBe(false);
    for (const key of ['events', 'rawEvents', 'calls', 'lifecycle'] as const) expect(disposed.owner[key]).toEqual(before[key]);
    await page.waitForTimeout(1000);
    expect(await cleanup()).toEqual(disposed);
    expect(failures).toEqual([]);
  } finally {
    await testInfo.attach(
      'actual-select-icons-complete-raw',
      {
        body: JSON.stringify({ sample, trace, failures }, null, 2),
        contentType: 'application/json'
      }
    );
    await capture.dispose();
  }
});
