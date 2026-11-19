import 'antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import PopupWidthHydration from './PopupWidthHydration.svelte';
import { popupWidthSamples } from './popup-width-cases';

type Fixture = NonNullable<ReturnType<ReturnType<typeof PopupWidthHydration>['fixtureApi']>>;
declare global {
  interface Window {
    popupWidthHydration?: {
      root: HTMLElement;
      editor: HTMLInputElement;
      parent: Node | null;
      outside: HTMLInputElement;
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
const sample = popupWidthSamples.find(sample => sample.id === id);
if (!sample?.live) throw Error(`Unknown live popup width sample: ${id}`);
const target = document.getElementById('root')!;
const root = target.querySelector<HTMLElement>('[data-ant-select-control]')
  ?? target.querySelector<HTMLElement>('.popup-width-control')!;
const editor = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const parent = editor.parentNode;
const initialCaret = [editor.selectionStart, editor.selectionEnd];
const outside = target.querySelector<HTMLInputElement>('[aria-label="Width outside draft"]')!;
const instance = hydrate(PopupWidthHydration, { target, props: { sample }, recover: false });
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['popupWidthHydration']> = {
  root, editor, parent, outside, initialCaret,
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
window.popupWidthHydration = state;
