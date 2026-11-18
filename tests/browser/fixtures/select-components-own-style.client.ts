import 'antd-svelte/styles.css';
import { mount, hydrate, tick, unmount, flushSync, type ComponentProps } from 'svelte';
import OwnStyleCase from './SelectComponentsOwnStyleCase.svelte';
import { selectOwnStyleInitSamples, selectOwnStyleInitEntryPaths, selectOwnStyleInitClientProfile,
  type SelectOwnStyleInitEntryPath } from '../select-components-own-style-init-cases.mjs';
import { initializeSelectOwnStyleProbe, readSelectOwnStyleAuthoredRef, readSelectIcons, readSelectOwnStyleDetails } from '../select-components-own-style-init-metrics.mjs';

type Capture = NonNullable<ComponentProps<typeof OwnStyleCase>['capture']>;
const query = new URL(location.href).searchParams;
const sample = selectOwnStyleInitSamples.find(sample => sample.id === query.get('sample'));
const entryPath = (query.get('entryPath') ?? 'csr') as SelectOwnStyleInitEntryPath;
if (!sample || !selectOwnStyleInitEntryPaths.includes(entryPath)) throw Error('Unknown own-style owner or entry path');
// A hydration driver inserts actual package SSR and applies the frozen optional
// ordinary pre-hydration CSS edits before loading this client module.
if (entryPath !== 'csr' && !window.ownStyleProbe) initializeSelectOwnStyleProbe(entryPath);
const capture: Capture = {};
const fallback = window.raw?.current ?? { read: () => ({ ownerCommitted: false }), readRefs: () => ({}) };
window.raw ??= { current: fallback };
const point = () => {
  // Match the frozen Source observation order, including identity allocation.
  const details = readSelectOwnStyleDetails();
  const icons = readSelectIcons();
  return { icons, details, owner: window.raw.current.read() };
};
capture.onAuthoredRef = readSelectOwnStyleAuthoredRef;
if (entryPath !== 'csr') capture.onCommit = () => { window.ownStyleProbe.commit = point(); window.ownStyleProbe.hydrationCommitted = true; };
window.raw.current = { read: () => capture.read ? capture.read() : fallback.read(),
  readRefs: () => capture.readRefs ? capture.readRefs() : fallback.readRefs(),
  update: (action, index) => capture.update!(action, index) };
const props = { sample: { ...sample, profile: selectOwnStyleInitClientProfile(entryPath) }, capture };
const target = document.getElementById('root')!;
const app = entryPath === 'csr' ? mount(OwnStyleCase, { target, props })
  : hydrate(OwnStyleCase, { target, props, recover: false });
if (entryPath === 'csr') {
  await tick();
  initializeSelectOwnStyleProbe(entryPath);
  window.ownStyleProbe.afterCall = point();
} else {
  window.ownStyleProbe.afterCall = point();
  await tick();
}
window.ownStyleProbe.observe = point;
window.ownStyleProbe.flushUpdate = action => flushSync(() => capture.update!(action));
window.ownStyleProbe.dispose = async () => { await unmount(app); await tick(); };
window.ownStyleProbe.ready = true;
