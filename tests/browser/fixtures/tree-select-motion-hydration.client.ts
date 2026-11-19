import 'antd-svelte/styles.css';
import { hydrate, tick, unmount } from 'svelte';
import type { TreeSelectRef } from 'antd-svelte';
import TreeSelectMotionHydration from './TreeSelectMotionHydration.svelte';
import {
  treeSelectMotionSamples, type TreeSelectMotionAction
} from './tree-select-motion-cases';

declare global {
  interface Window {
    treeSelectMotionHydration?: {
      root: HTMLElement;
      editor: HTMLInputElement | null;
      editorParent: Node | null;
      outside: HTMLInputElement;
      initialPopup: HTMLElement | null;
      initialDraft: HTMLInputElement | null;
      refs: () => {
        root?: HTMLElement;
        editor?: HTMLInputElement;
        control?: TreeSelectRef;
        getterArguments: HTMLElement[];
        shadow?: ShadowRoot;
      };
      events: () => unknown[][];
      update: (action: TreeSelectMotionAction) => Promise<void>;
      dispose: () => Promise<void>;
      cleaned?: { root: boolean; editor: boolean; control: boolean };
    };
  }
}

const id = new URL(location.href).searchParams.get('sample');
const sample = treeSelectMotionSamples.find(sample => sample.id === id);
if (!sample) {
  throw Error(`Unknown TreeSelect motion hydration sample: ${id}`);
}
const target = document.getElementById('root')!;
const host = target.querySelector<HTMLElement>('[data-motion-case]')!;
const selectPrefix = sample.local ?? `${sample.prefix ?? 'ant'}-select`;
const root = host.querySelector<HTMLElement>('[data-motion-root]')
  ?? host.querySelector<HTMLElement>(`.${CSS.escape(selectPrefix)}`)!;
const editor = root.querySelector<HTMLInputElement>('[data-motion-editor],input[role="combobox"]');
const editorParent = editor?.parentNode ?? null;
const outside = target.querySelector<HTMLInputElement>('[aria-label="Motion outside draft"]')!;
const initialPopup = target.querySelector<HTMLElement>('.motion-audit-popup');
const initialDraft = initialPopup?.querySelector<HTMLInputElement>('[data-motion-draft]') ?? null;
const instance = hydrate(TreeSelectMotionHydration, { target, props: { sample }, recover: false });
await tick();
const fixture = instance.fixtureApi()!;
const state: NonNullable<Window['treeSelectMotionHydration']> = {
  root, editor, editorParent, outside, initialPopup, initialDraft,
  refs: () => fixture.readRefs(),
  events: () => fixture.readEvents(),
  async update(action) {
    fixture.update(action);
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
window.treeSelectMotionHydration = state;
