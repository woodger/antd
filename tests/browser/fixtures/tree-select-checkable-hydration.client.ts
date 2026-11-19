import 'antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import type { TreeSelectRef } from 'antd-svelte';
import TreeSelectCheckableHydration from './TreeSelectCheckableHydration.svelte';
import { treeSelectCheckableSamples } from './tree-select-checkable-cases';

declare global {
  interface Window {
    treeSelectCheckableHydration?: {
      root: HTMLElement;
      editor: HTMLInputElement;
      parent: Node | null;
      outside: HTMLInputElement;
      initialCaret: (number | null)[];
      refs: () => { root?: HTMLElement; editor?: HTMLInputElement; control?: TreeSelectRef };
      events: () => unknown[][];
      ignored: () => { renderCalls: number; iteratorCalls: number; thenReads: number };
      dispose: () => Promise<void>;
      cleaned?: { root: boolean; editor: boolean; control: boolean };
    };
  }
}
const id = new URL(location.href).searchParams.get('sample');
const sample = treeSelectCheckableSamples.find(sample => sample.id === id);
if (!sample?.searchable) throw Error(`Unknown searchable checkable hydration sample: ${id}`);
const target = document.getElementById('root')!;
const root = target.querySelector<HTMLElement>('.checkable-audit-root')!;
const editor = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const parent = editor.parentNode;
const initialCaret = [editor.selectionStart, editor.selectionEnd];
const outside = target.querySelector<HTMLInputElement>('[aria-label="Checkable outside draft"]')!;
const instance = hydrate(
  TreeSelectCheckableHydration,
  { target, props: { sample }, recover: false }
);
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['treeSelectCheckableHydration']> = {
  root, editor, parent, outside, initialCaret,
  refs: () => fixture.readRefs(), events: () => fixture.readEvents(), ignored: () => fixture.readIgnored(),
  async dispose() {
    await unmount(instance);
    await tick();
    const refs = fixture.readRefs();
    state.cleaned = {
      root: refs.root == null,
      editor: refs.editor == null,
      control: refs.control == null
    };
  }
};
window.treeSelectCheckableHydration = state;
