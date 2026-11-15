import 'antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import type { TreeSelectRef } from 'antd-svelte';
import TreeSelectAlignHydration from './TreeSelectAlignHydration.svelte';
import { treeSelectAlignSamples, type TreeSelectAlignAction } from './tree-select-align-cases';

declare global {
  interface Window {
    treeSelectAlignHydration?: {
      root: HTMLElement;
      editor: HTMLInputElement;
      editorParent: Node | null;
      outside: HTMLInputElement;
      refs: () => { root?: HTMLDivElement | HTMLButtonElement | HTMLSpanElement; editor?: HTMLInputElement;
        control?: TreeSelectRef; getterArguments: HTMLElement[]; shadow?: ShadowRoot };
      events: () => unknown[][];
      update: (action: TreeSelectAlignAction) => Promise<void>;
      dispose: () => Promise<void>;
      cleaned?: { root: boolean; editor: boolean; control: boolean };
    };
  }
}

const id = new URL(location.href).searchParams.get('sample');
const sample = treeSelectAlignSamples.find(sample => sample.id === id);
if (!sample) throw Error(`Unknown align hydration sample: ${id}`);
const target = document.getElementById('root')!;
const host = target.querySelector<HTMLElement>('[data-align-case]')!;
const root = host.querySelector<HTMLElement>('[data-align-root]') ?? host.querySelector<HTMLElement>('.ant-select')!;
const editor = root.querySelector<HTMLInputElement>('[data-align-editor],input[role="combobox"]')!;
const editorParent = editor.parentNode;
const outside = target.querySelector<HTMLInputElement>('[aria-label="Align outside draft"]')!;
const instance = hydrate(TreeSelectAlignHydration, { target, props: { sample }, recover: false });
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['treeSelectAlignHydration']> = {
  root, editor, editorParent, outside, refs: () => fixture.readRefs(), events: () => fixture.readEvents(),
  async update(action) { fixture.update(action); await tick(); },
  async dispose() {
    await unmount(instance);
    await tick();
    const refs = fixture.readRefs();
    state.cleaned = { root: refs.root == null, editor: refs.editor == null, control: refs.control == null };
  }
};
window.treeSelectAlignHydration = state;
