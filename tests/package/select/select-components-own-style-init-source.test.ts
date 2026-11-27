import { expect, it } from 'vitest';
import { readSelectComponentsOwnStyleInitSource, readSelectComponentsOwnStyleInitSSR,
  verifySelectComponentsOwnStyleInitRepeat, selectComponentsOwnStyleInitManifest } from '../../browser/select-components-own-style-init-reference';
import { selectOwnStyleInitSamples, selectOwnStyleInitEntryPaths, createSelectOwnStyleInitFrames,
  selectOwnStyleInitClientProfile, selectOwnStyleInitPrehydrateSetters } from '../../browser/select-components-own-style-init-cases.mjs';
import { ownStyleComputedProperties, verifyOwnStyleComputed, verifyNativeOwnStyleComputed, ownStyleNativeComputedBridge } from '../../browser/select-components-own-style-init-assertions';
import { createSelectSurfaceRecorder } from '../../browser/select-surface-producers.mjs';
import { verifySelectComponentsGraph } from '../../browser/select-components-producers';

function elementGraph(style: { present: boolean; value?: unknown }, native: boolean) {
  const recorder = createSelectSurfaceRecorder();
  const ref = recorder.register(function ref() {}, { callback: 'component-ref-input' });
  const props = {
    [native ? 'class' : 'className']: 'select-own-style-editor',
    ...(style.present ? { style: style.value } : {})
  };
  const node = native ? { element: 'input', props, ref } : {
    $$typeof: Symbol.for('react.element'),
    type: 'input',
    key: null,
    ref,
    props,
    _owner: null
  };
  recorder.register(node, { node: 'component-input:element' });
  return recorder.raw({ components: { input: node } });
}
it('compares full intrinsic style object/null/undefined/omitted raw graphs', () => {
  const frames = [{
    present: true,
    value: { borderTopColor: 'red', border: '2px solid black', paddingInlineStart: undefined }
  },
    { present: true, value: null }, { present: true, value: undefined }, { present: false }];
  for (const frame of frames) {
    expect(() => verifySelectComponentsGraph(
      elementGraph(frame, true),
      elementGraph(frame, false),
      'same public style graph'
    )).not.toThrow();
  }
  expect(() => verifySelectComponentsGraph(
    elementGraph({ present: false }, true),
    elementGraph({ present: true, value: undefined }, false),
    'own undefined is not omission'
  )).toThrow();
  expect(() => verifySelectComponentsGraph(elementGraph(
    {
      present: true,
      value: { border: '2px solid black', borderTopColor: 'red', paddingInlineStart: undefined }
    },
    true
  ),
    elementGraph(frames[0], false), 'style object order')).toThrow();
});

it('preserves own undefined, absent style and restored object identity in the ordinary caller', () => {
  for (const profile of ['same', 'mismatch'] as const) {
    const frames = createSelectOwnStyleInitFrames(profile), undefinedFrame = frames.get('style-undefined'), omitted = frames.get('style-omitted');
    expect(Object.hasOwn(undefinedFrame, 'style')).toBe(true);
    expect(undefinedFrame.style).toBeUndefined();
    expect(Object.hasOwn(omitted, 'style')).toBe(false);
    expect(frames.get('style-null').style).toBeNull();
    expect(frames.get('restore-object').style).toBe(frames.get('left-logical').style);
    const initialStyle = frames.get('initial').style!;
    if (typeof initialStyle !== 'object') {
      throw Error('Frozen ordinary initial style is an object');
    }
    expect(Object.keys(initialStyle)).toEqual(['borderTopColor', 'border', 'borderLeftWidth', 'paddingInlineStart', 'padding', 'width', 'fontSize']);
    expect(initialStyle.fontSize).toBe(profile === 'same' ? 17 : 23);
  }
});
it('accepts only custom computed enumeration permutations and rejects standard drift', () => {
  const a = [{ name: 'border-top-width', value: '2px', priority: '' }, {
    name: 'font-size',
    value: '17px',
    priority: ''
  },
    { name: '--a', value: 'a', priority: '' }, { name: '--b', value: 'b', priority: '' }];
  const b = [a[0], a[1], a[3], a[2]];

  expect(() => verifyOwnStyleComputed(a, b, 'custom enumeration')).not.toThrow();
  expect(() => verifyOwnStyleComputed(a, [a[1], a[0], a[2], a[3]], 'standard order')).toThrow();
  expect(() => verifyOwnStyleComputed(a, [a[0], { ...a[1], value: '23px' }, a[2], a[3]], 'font')).toThrow();
  expect(() => verifyOwnStyleComputed(
    a,
    [a[0], a[1], { ...a[2], priority: 'important' }, a[3]],
    'custom priority'
  )).toThrow();
  expect(() => ownStyleComputedProperties([...a, a[0]])).toThrow();
  expect(a.map(value => value.name)).toEqual(['border-top-width', 'font-size', '--a', '--b']);
});
it('keeps all 8 independently measured paths and complete Source ref/event ledgers', () => {
  const csr = readSelectComponentsOwnStyleInitSource('csr'), hydration = readSelectComponentsOwnStyleInitSource('hydrate');
  const cases = [...csr.cases, ...hydration.cases];

  expect(cases).toHaveLength(8);
  expect(cases.reduce((count, value) => count + value.steps.length, 0)).toBe(96);
  expect(selectComponentsOwnStyleInitManifest.counts.clientInitialAndActionPoints).toBe(104);
  for (const sample of selectOwnStyleInitSamples) {
    for (const path of selectOwnStyleInitEntryPaths) {
      const entry = cases.find(value => value.id === sample.id && value.entryPath === path)!;
      expect(entry).toBeTruthy();
      expect(entry.profile).toBe(selectOwnStyleInitClientProfile(path));
      expect(entry.prehydrateEdits).toEqual(selectOwnStyleInitPrehydrateSetters(path));
      expect(entry.steps.map(value => value.action)).toEqual(sample.actions);
      expect(entry.producerCalls).toEqual([]);
      expect(entry.lifecycle).toHaveLength(45);
      expect(entry.cleanup.lifecycle).toEqual([...entry.lifecycle, {
        slot: 'input',
        event: 'detach',
        tag: null,
        observation: null
      }]);
      expect(entry.cleanup.events).toEqual(entry.events);
      expect(entry.cleanup.rawEvents).toEqual(entry.rawEvents);
      expect(entry.late).toEqual({ events: entry.cleanup.events, rawEvents: entry.cleanup.rawEvents,
        producerCalls: entry.cleanup.producerCalls, lifecycle: entry.cleanup.lifecycle, bodyActivity: entry.cleanup.bodyActivity });
      expect(entry.recoverableErrors).toEqual([]);
      expect(entry.network).toEqual({ requests: [], requestFailures: [], responses: [] });
      if (path !== 'csr') {
        expect(entry.parsed).toBeTruthy();
        expect(entry.beforeHydration).toBeTruthy();
        expect(entry.afterCall).toBeTruthy();
        expect(entry.commit).toBeTruthy();
        const initial = entry.initial.details.editor!, before = entry.beforeHydration!.details.hydration!.parsedEditor!;
        expect(initial.css.fontSize).toBe(path === 'hydrate-dirty-mismatch' ? '31px' : '17px');
        expect(before.css.fontSize).toBe(path === 'hydrate-dirty-mismatch' ? '31px' : '17px');
        expect(entry.initial.details.hydration!.owner).toBe(true);
        expect(entry.initial.details.hydration!.root).toBe(true);
        expect(entry.initial.details.hydration!.editor).toBe(true);
      }
    }
  }
});
it('limits the existing theme boundary to the exact three baseline fields', () => {
  const native = [{ name: 'color-scheme', value: 'light', priority: '' }, {
    name: 'font-size',
    value: '17px',
    priority: ''
  }];
  const source = [{ ...native[0], value: 'normal' }, native[1], {
    name: '--ant-pink',
    value: '#EB2F96',
    priority: ''
  },
    { name: '--ant-control-tmp-outline', value: 'rgba(0,0,0,0.02)', priority: '' }];

  expect(() => verifyNativeOwnStyleComputed(native, source, 'existing theme')).not.toThrow();
  expect(() => verifyNativeOwnStyleComputed(
    [{ ...native[0], value: 'dark' }, native[1]],
    source,
    'wrong scheme'
  )).toThrow();
  expect(() => verifyNativeOwnStyleComputed(
    native,
    source.map(property => property.name === '--ant-pink' ? { ...property, value: 'red' } : property),
    'wrong deprecated value'
  )).toThrow();
  expect(() => verifyNativeOwnStyleComputed(
    [...native, source[2]],
    source,
    'restored obsolete variable'
  )).toThrow();
  expect(() => verifyNativeOwnStyleComputed(
    [native[0], { ...native[1], value: '23px' }],
    source,
    'own font drift'
  )).toThrow();
});
it('rejects a broad private-variable prefix exemption', () => {
  const fake = Array.from(
    { length: 379 },
    (_, index) => ({
      name: '--ant-svelte-theme-base-unmeasured-' + index,
      value: '14px',
      priority: ''
    })
  );

  expect(() => ownStyleNativeComputedBridge(fake, [], 'select', 'wrong private alias set')).toThrow(/exact frozen base alias keys/);
  expect(() => ownStyleNativeComputedBridge(
    fake.slice(1),
    [],
    'autocomplete',
    'missing private alias'
  )).toThrow(/exact existing Native base aliases count/);
});
it('reconstructs both independent Source repeat captures with their original digests', async () => {
  const repeats = {
    csr: { bytes: 107628300, sha256: 'e5ba8b195d0128fd6d5146b9b3011d8d5b14857fb90ece66ff267076b3da2d87' },
    hydrate: { bytes: 367593608, sha256: '621a8db24097e23f6351b8ca7ba0a3a1cb6259ffb3fb0e006c89ec459176850a' }
  };
  for (const mode of ['csr', 'hydrate'] as const) {
    const reconstructed = await verifySelectComponentsOwnStyleInitRepeat(mode);
    const receipt = selectComponentsOwnStyleInitManifest.repeatProofs.find(value => value.mode === mode);

    expect(reconstructed).toEqual(repeats[mode]);
    expect(receipt).toMatchObject({
      wholePairByteEqual: false,
      otherRawDifferences: 0,
      allStandardNamesValuesPrioritiesAndOrderEqual: true,
      allCustomNamesValuesAndPrioritiesEqual: true,
      customOrderPermutations: mode === 'csr' ? 203 : 42
    });
  }
});
it('retains both real DOM-free Source serializers for the same two initial states', () => {
  const source = readSelectComponentsOwnStyleInitSSR();

  expect(source.cases).toHaveLength(2);
  for (const owner of source.cases) {
    const string = owner.server.renderToString, markup = owner.server.renderToStaticMarkup;
    expect(string.state).toEqual(markup.state);
    expect(string.rawHtml).toBe(markup.rawHtml);
    expect(string.resources).toEqual({ timers: 0, frames: 0, measurements: 0, microtasks: 0 });
    expect(string.state.lifecycle).toEqual([]);
    expect(Object.values(string.refs).every(Boolean)).toBe(true);
  }
});
