import '@woodger/antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import SelectVirtualHydration from './SelectVirtualHydration.svelte';
import { selectVirtualSamples } from './select-virtual-cases';

type Fixture = NonNullable<ReturnType<ReturnType<typeof SelectVirtualHydration>['fixtureApi']>>;
declare global {
  interface Window {
    selectVirtualHydration?: {
      outer: HTMLElement;
      root: HTMLElement;
      editor: HTMLInputElement | HTMLTextAreaElement;
      parent: Node | null;
      outside: HTMLInputElement;
      initialValue: string;
      initialCaret: (number | null)[];
      refs: Fixture['readRefs'];
      events: Fixture['readEvents'];
      query: Fixture['readQuery'];
      model: Fixture['readModel'];
      receipts: Fixture['readReceipts'];
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
if (!sample) {
  throw Error(`Unknown Select virtual sample: ${id}`);
}
const target = document.getElementById('root')!;
const outer = target.querySelector<HTMLElement>('.select-virtual-control')!;
const root = sample.family === 'select'
  ? target.querySelector<HTMLElement>('[data-ant-select-control]')! : outer;
const editor = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[role="combobox"],textarea[role="combobox"]')!;
const parent = editor.parentNode;
const initialValue = editor.value;
const initialCaret = [editor.selectionStart, editor.selectionEnd];
const outside = target.querySelector<HTMLInputElement>('[aria-label="Virtual outside draft"]')!;
const instance = hydrate(SelectVirtualHydration, { target, props: { sample }, recover: false });
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['selectVirtualHydration']> = {
  outer, root, editor, parent, outside, initialValue, initialCaret,
  refs: () => fixture.readRefs(), events: () => fixture.readEvents(), query: () => fixture.readQuery(),
  model: () => fixture.readModel(), receipts: () => fixture.readReceipts(),
  async dispose() {
    await unmount(instance);
    await tick();
    const refs = fixture.readRefs();
    state.cleaned = { root: refs.root == null, editor: refs.editor == null, control: refs.control == null,
      publicRoot: refs.publicRoot == null, publicEditor: refs.publicEditor == null };
  }
};
window.selectVirtualHydration = state;
