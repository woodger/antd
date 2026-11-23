import '@woodger/antd/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import type { TreeSelectRef } from '@woodger/antd';
import TreeSelectInertApiHydration from './TreeSelectInertApiHydration.svelte';
import { treeSelectInertApiSamples, type TreeSelectInertApiMode } from './tree-select-inert-api-cases';

declare global {
  interface Window {
    treeSelectInertApiHydration?: {
      root: HTMLElement;
      editor: HTMLInputElement;
      editorParent: Node | null;
      outside: HTMLInputElement;
      refs: () => {
        root?: HTMLDivElement | HTMLButtonElement;
        editor?: HTMLInputElement;
        control?: TreeSelectRef
      };
      events: () => unknown[][];
      update: (mode: TreeSelectInertApiMode) => Promise<void>;
      dispose: () => Promise<void>;
      cleaned?: { root: boolean; editor: boolean; control: boolean };
    };
  }
}

const sample = treeSelectInertApiSamples.find(sample => sample.id === 'inert-live-controls')!;
const target = document.getElementById('root')!;
const root = target.querySelector<HTMLElement>('[data-inert-api-case] .ant-select')!;
const editor = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const editorParent = editor.parentNode;
const outside = target.querySelector<HTMLInputElement>('[aria-label="Inert API outside draft"]')!;
const instance = hydrate(TreeSelectInertApiHydration, { target, props: { sample }, recover: false });
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['treeSelectInertApiHydration']> = {
  root, editor, editorParent, outside, refs: () => fixture.readRefs(), events: () => fixture.readEvents(),
  async update(mode) {
    fixture.update(mode);
    await tick();
  },
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
window.treeSelectInertApiHydration = state;
