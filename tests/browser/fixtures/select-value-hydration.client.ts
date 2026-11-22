import '@woodger/antd-svelte/styles.css';
import { hydrate, tick, unmount, type ComponentProps } from 'svelte';
import SelectValueCase from './SelectValueCase.svelte';
import { selectValueSamples } from './select-value-cases';

type Capture = NonNullable<ComponentProps<typeof SelectValueCase>['capture']>;
type Read = NonNullable<Capture['read']>;
type ReadRefs = NonNullable<Capture['readRefs']>;

declare global {
  interface Window {
    selectValueHydration?: {
      owner: HTMLElement;
      outer: HTMLElement;
      root: HTMLElement;
      content: HTMLElement;
      command: HTMLElement;
      editor: HTMLInputElement;
      parent: Node | null;
      outside: HTMLInputElement;
      initialValue: string;
      initialCaret: (number | null)[];
      initialNodes: { owner: boolean; outer: boolean; root: boolean; content: boolean;
        editor: boolean; parent: boolean; rich: boolean; tags: boolean; fields: boolean };
      read: Read;
      refs: ReadRefs;
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
const sample = selectValueSamples.find(sample => sample.id === id);
if (!sample) {
  throw Error(`Unknown Select value sample: ${id}`);
}
const target = document.querySelector<HTMLElement>('[data-select-value-hydration-target]')!;
const owner = target.querySelector<HTMLElement>('[data-select-value-case]')!;
const outer = owner.querySelector<HTMLElement>('.select-value-control')!;
const root = outer.querySelector<HTMLElement>('[data-ant-select-control]')!;
const content = root.querySelector<HTMLElement>('.ant-select-content')!;
const editor = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const parent = editor.parentNode;
const rich = [...root.querySelectorAll('[data-select-value-node]')];
const tags = [...root.querySelectorAll('.ant-select-selection-item')];
const fields = [...outer.querySelectorAll('input[type="hidden"][name="value-selection"]')];
const initialValue = editor.value;
const initialCaret = [editor.selectionStart, editor.selectionEnd];
const outside = document.querySelector<HTMLInputElement>('[aria-label="Value outside draft"]')!;
const capture: Capture = {};
const instance = hydrate(SelectValueCase, {
  target, props: { sample, name: 'value-selection', capture }, recover: false
});
await tick();
if (!capture.read || !capture.readRefs) {
  throw Error('The hydrated Select value fixture must expose its live owner');
}
const refs = capture.readRefs;
const sameNodes = (original: Element[], selector: string) => {
  const current = [...outer.querySelectorAll(selector)];
  return current.length === original.length && original.every((node, index) => node === current[index]);
};
const current = refs();
const state: NonNullable<Window['selectValueHydration']> = {
  owner, outer, root, content, command: owner.querySelector<HTMLElement>('[data-select-value-command]')!,
  editor, parent, outside, initialValue, initialCaret,
  initialNodes: {
    owner: owner === target.querySelector('[data-select-value-case]'),
    outer: outer === target.querySelector('.select-value-control'),
    root: root === current.root, content: content === root.querySelector('.ant-select-content'),
    editor: editor === current.editor, parent: parent === current.editor?.parentNode,
    rich: sameNodes(rich, '[data-select-value-node]'), tags: sameNodes(
      tags,
      '.ant-select-selection-item'
    ),
    fields: sameNodes(fields, 'input[type="hidden"][name="value-selection"]')
  },
  read: capture.read, refs,
  async dispose() {
    await unmount(instance);
    await tick();
    const current = refs();
    state.cleaned = { root: current.root == null, editor: current.editor == null, control: current.control == null,
      publicRoot: current.publicRoot == null, publicEditor: current.publicEditor == null };
  }
};
window.selectValueHydration = state;
