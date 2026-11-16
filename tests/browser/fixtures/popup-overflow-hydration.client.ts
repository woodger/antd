import 'antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import PopupOverflowHydration from './PopupOverflowHydration.svelte';
import { popupOverflowSamples } from './popup-overflow-cases';

type Fixture = NonNullable<ReturnType<ReturnType<typeof PopupOverflowHydration>['fixtureApi']>>;
declare global {
  interface Window {
    popupOverflowHydration?: {
      root: HTMLElement;
      anchor: HTMLElement;
      editor: HTMLInputElement;
      parent: Node | null;
      outside: HTMLInputElement;
      initialCaret: (number | null)[];
      refs: Fixture['readRefs'];
      events: Fixture['readEvents'];
      query: Fixture['readQuery'];
      model: Fixture['readModel'];
      context: Fixture['readContext'];
      dispose: () => Promise<void>;
      cleaned?: { root: boolean; anchor: boolean; editor: boolean; control: boolean;
        publicRoot: boolean; publicEditor: boolean };
    };
  }
}

const id = new URL(location.href).searchParams.get('sample');
const sample = popupOverflowSamples.find(sample => sample.id === id);
if (!sample?.live) throw Error(`Unknown live popup overflow sample: ${id}`);
const target = document.getElementById('root')!;
const root = target.querySelector<HTMLElement>('[data-ant-select-control]')
  ?? target.querySelector<HTMLElement>('.popup-overflow-control')!;
const anchor = target.querySelector<HTMLElement>('[data-overflow-anchor]') ?? root;
const editor = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const parent = editor.parentNode;
const initialCaret = [editor.selectionStart, editor.selectionEnd];
const outside = target.querySelector<HTMLInputElement>('[aria-label="Overflow outside draft"]')!;
const instance = hydrate(PopupOverflowHydration, { target, props: { sample }, recover: false });
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['popupOverflowHydration']> = {
  root, anchor, editor, parent, outside, initialCaret,
  refs: () => fixture.readRefs(), events: () => fixture.readEvents(), query: () => fixture.readQuery(),
  model: () => fixture.readModel(), context: () => fixture.readContext(),
  async dispose() {
    await unmount(instance);
    await tick();
    const refs = fixture.readRefs();
    state.cleaned = { root: refs.root == null, anchor: refs.anchor == null, editor: refs.editor == null,
      control: refs.control == null, publicRoot: refs.publicRoot == null, publicEditor: refs.publicEditor == null };
  }
};
window.popupOverflowHydration = state;
