import '@woodger/antd-svelte/styles.css';
import { mount, tick, unmount } from 'svelte';
import SelectVirtualCase from './SelectVirtualCase.svelte';
import { selectVirtualSamples } from './select-virtual-cases';

type Fixture = ReturnType<typeof SelectVirtualCase>;
declare global {
  interface Window {
    selectVirtualInitialization?: {
      refs: Fixture['readRefs']; events: Fixture['readEvents']; offsets: Fixture['readOffsets'];
      dispose: () => Promise<void>;
      cleaned?: {
        root: boolean;
        editor: boolean;
        control: boolean;
        publicRoot: boolean;
        publicEditor: boolean
      };
    };
  }
}
const id = new URL(location.href).searchParams.get('sample');
const sample = selectVirtualSamples.find(sample => sample.id === id);
if (!sample || sample.scenario !== 'closed') {
  throw Error(`Unknown closed-ref initialization sample: ${id}`);
}
const instance = mount(
  SelectVirtualCase,
  { target: document.getElementById('root')!, props: { sample } }
);
await tick();
const state: NonNullable<Window['selectVirtualInitialization']> = {
  refs: () => instance.readRefs(), events: () => instance.readEvents(), offsets: () => instance.readOffsets(),
  async dispose() {
    await unmount(instance);
    await tick();
    const refs = instance.readRefs();
    state.cleaned = { root: refs.root == null, editor: refs.editor == null, control: refs.control == null,
      publicRoot: refs.publicRoot == null, publicEditor: refs.publicEditor == null };
  }
};
window.selectVirtualInitialization = state;
