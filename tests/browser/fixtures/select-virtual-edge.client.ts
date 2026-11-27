import '@woodger/antd/styles.css';
import { mount, tick, unmount } from 'svelte';
import SelectVirtualEdgeCase from './SelectVirtualEdgeCase.svelte';
import { selectVirtualEdgeSamples } from './select-virtual-edge-cases';

type Fixture = ReturnType<typeof SelectVirtualEdgeCase>;
declare global {
  interface Window {
    selectVirtualEdge?: {
      refs: Fixture['readRefs']; events: Fixture['readEvents']; getSizeCalls: Fixture['readGetSizeCalls'];
      model: Fixture['readModel']; query: Fixture['readQuery']; receipts: Fixture['readReceipts'];
      dispose: () => Promise<void>;
      cleaned?: {
        root: boolean;
        anchor: boolean;
        editor: boolean;
        control: boolean;
        publicRoot: boolean;
        publicEditor: boolean
      };
    };
  }
}
const id = new URL(location.href).searchParams.get('sample');
const sample = selectVirtualEdgeSamples.find(sample => sample.id === id);
if (!sample) {
  throw Error(`Unknown AutoComplete virtual edge sample: ${id}`);
}
const instance = mount(
  SelectVirtualEdgeCase,
  { target: document.getElementById('root')!, props: { sample } }
);
await tick();
const state: NonNullable<Window['selectVirtualEdge']> = {
  refs: () => instance.readRefs(), events: () => instance.readEvents(), getSizeCalls: () => instance.readGetSizeCalls(),
  model: () => instance.readModel(), query: () => instance.readQuery(), receipts: () => instance.readReceipts(),
  async dispose() {
    await unmount(instance);
    await tick();
    const refs = instance.readRefs();
    state.cleaned = { root: refs.root == null, anchor: refs.anchor == null, editor: refs.editor == null,
      control: refs.control == null, publicRoot: refs.publicRoot == null, publicEditor: refs.publicEditor == null };
  }
};
window.selectVirtualEdge = state;
