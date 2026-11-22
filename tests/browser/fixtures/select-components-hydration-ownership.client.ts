import '@woodger/antd-svelte/styles.css';
import { hydrate, tick, unmount, flushSync } from 'svelte';
import Owner from './SelectComponentsHydrationOwnershipCase.svelte';
import { ownershipOwnerSample, type HydrationOwnershipOwnerKey, type HydrationOwnershipUpdate } from '../select-components-hydration-ownership-cases.mjs';
import { describeOwnershipNode, readHydrationOwnership, type HydrationOwnershipCapture } from '../select-components-hydration-ownership-metrics.mjs';

const probe = window.hydrationOwnershipProbe;
if (!probe) {
  throw Error('Parse actual independent SSR and initialize its ownership probe before loading the client');
}
const captures = new Map<HydrationOwnershipOwnerKey, HydrationOwnershipCapture>();
for (const key of probe.scenario.environment.owners) {
  const record = probe.roots[key]!;
  const capture: HydrationOwnershipCapture = { onAuthoredRef: describeOwnershipNode };
  captures.set(key, capture);
  record.raw.current = { read: () => capture.read?.() ?? null, readRefs: () => capture.readRefs?.() ?? {},
    update: action => capture.update!(action) };
  capture.onCommit = () => {
    record.raw.hydrationCommitted = true;
    record.committed = structuredClone(readHydrationOwnership());
  };
}
window.hydrationOwnershipNative = {
  ready: true,
  hydrate(key: HydrationOwnershipOwnerKey) {
    const record = probe.roots[key], capture = captures.get(key);
    if (!record || !capture || record.app) {
      throw Error('Unknown or already hydrated ownership root');
    }
    record.app = hydrate(Owner, { target: record.target, recover: false,
      props: { sample: ownershipOwnerSample(probe.scenario, key), capture } });
    return readHydrationOwnership();
  },
  async tick() { await tick(); },
  update(key: HydrationOwnershipOwnerKey, action: HydrationOwnershipUpdate) {
    const capture = captures.get(key);
    if (!capture?.update) {
      throw Error('Ownership root is not hydrated');
    }
    flushSync(() => capture.update!(action));
  },
  async dispose(key: HydrationOwnershipOwnerKey) {
    const record = probe.roots[key];
    if (!record?.app) {
      throw Error('Ownership root is not hydrated');
    }
    const app = record.app;
    record.app = null;
    await unmount(app);
    await tick();
    return readHydrationOwnership();
  }
};
