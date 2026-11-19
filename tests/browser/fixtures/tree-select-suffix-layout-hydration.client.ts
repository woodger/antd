import 'antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import TreeSelectSuffixLayoutHydration from './TreeSelectSuffixLayoutHydration.svelte';
import { treeSelectSuffixLayoutSamples } from './tree-select-suffix-layout-cases';

declare global {
  interface Window {
    treeSelectSuffixLayoutHydration?: {
      root: HTMLElement;
      editor: HTMLInputElement | HTMLTextAreaElement;
      editorParent: Node | null;
      suffix: Element | null;
      prefix: Element | null;
      outside: HTMLInputElement;
      focus: () => void;
      refs: () => {
        root?: HTMLDivElement;
        input?: HTMLInputElement | HTMLTextAreaElement;
        control?: unknown
      };
      dispose: () => Promise<void>;
      cleaned?: { root: boolean; input: boolean; control: boolean };
    };
  }
}
const id = new URL(location.href).searchParams.get('sample');
const sample = treeSelectSuffixLayoutSamples.find(sample => sample.id === id);
if (!sample) {
  throw Error(`Unknown suffix hydration sample: ${id}`);
}
const target = document.getElementById('root')!;
const root = target.querySelector<HTMLElement>('[data-ant-tree-choice-control]')!;
const editor = root.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-suffix-layout-editor]')!;
const editorParent = editor.parentNode;
const suffix = editor.closest('[data-ant-tree-choice-input-suffix]');
const prefix = root.querySelector('[data-suffix-layout-prefix]');
const outside = target.querySelector<HTMLInputElement>('[aria-label="Suffix layout outside draft"]')!;
const instance = hydrate(
  TreeSelectSuffixLayoutHydration,
  { target, props: { sample }, recover: false }
);
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['treeSelectSuffixLayoutHydration']> = {
  root, editor, editorParent, suffix, prefix, outside, focus: () => fixture.focus(), refs: () => fixture.readRefs(),
  async dispose() {
    await unmount(instance);
    await tick();
    const refs = fixture.readRefs();
    state.cleaned = {
      root: refs.root == null,
      input: refs.input == null,
      control: refs.control == null
    };
  }
};
window.treeSelectSuffixLayoutHydration = state;
