import '@woodger/antd/styles.css';
import { hydrate, tick, unmount, type ComponentProps } from 'svelte';
import SelectSurfaceHydrationCase from './SelectSurfaceHydrationCase.svelte';
import { selectSurfaceHydrationSamples } from './select-surface-hydration-cases';

type Capture = NonNullable<ComponentProps<typeof SelectSurfaceHydrationCase>['capture']>;
export interface SelectSurfaceHydrationState {
  owner: HTMLElement;
  outer: HTMLElement;
  root: HTMLElement;
  content: HTMLElement;
  editor: HTMLInputElement;
  parent: Node | null;
  command: HTMLElement;
  outside: HTMLInputElement;
  initialValue: string;
  initialCaret: (number | null)[];
  initialNodes: { owner: boolean; outer: boolean; root: boolean; content: boolean; editor: boolean;
    parent: boolean; command: boolean; prefix: boolean };
  read: NonNullable<Capture['read']>;
  refs: NonNullable<Capture['readRefs']>;
  dispose(): Promise<void>;
  cleaned?: {
    root: boolean;
    editor: boolean;
    control: boolean;
    publicRoot: boolean;
    publicEditor: boolean
  };
}
declare global { interface Window { selectSurfaceHydration?: SelectSurfaceHydrationState } }
const id = new URL(location.href).searchParams.get('sample');
const sample = selectSurfaceHydrationSamples.find(sample => sample.id === id);
if (!sample) {
  throw Error(`Unknown Select surface hydration sample: ${id}`);
}
const target = document.querySelector<HTMLElement>('[data-select-surface-hydration-target]')!;
const owner = target.querySelector<HTMLElement>('[data-surface-case]')!;
const outer = owner.querySelector<HTMLElement>('.surface-control')!;
const root = owner.querySelector<HTMLElement>('.ant-select')!;
const content = root.querySelector<HTMLElement>('.ant-select-content')!;
const editor = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
const parent = editor.parentNode;
const command = owner.querySelector<HTMLElement>('[data-surface-command]')!;
const prefix = [...root.querySelectorAll('[data-surface-node="hydration-prefix"]')];
const initialValue = editor.value;
const initialCaret = [editor.selectionStart, editor.selectionEnd];
const outside = document.querySelector<HTMLInputElement>('[aria-label="Surface outside draft"]')!;
const capture: Capture = {};
const instance = hydrate(
  SelectSurfaceHydrationCase,
  { target, props: { sample, capture }, recover: false }
);
await tick();
if (!capture.read || !capture.readRefs) {
  throw Error('Hydrated surface must expose its actual public owner');
}
const current = capture.readRefs();
let disposed = false;
const state: SelectSurfaceHydrationState = {
  owner, outer, root, content, editor, parent, command, outside, initialValue, initialCaret,
  initialNodes: { owner: owner === target.querySelector('[data-surface-case]'),
    outer: outer === target.querySelector('.surface-control'), root: root === current.root,
    content: content === current.root?.querySelector('.ant-select-content'), editor: editor === current.editor,
    parent: parent === current.editor?.parentNode, command: command === target.querySelector('[data-surface-command]'),
    prefix: prefix.every((node, index) => node === current.root?.querySelectorAll('[data-surface-node="hydration-prefix"]')[index])
      && prefix.length === current.root?.querySelectorAll('[data-surface-node="hydration-prefix"]').length },
  read: capture.read, refs: capture.readRefs,
  async dispose() {
    if (disposed) {
      return;
    }
    disposed = true;
    await unmount(instance);
    await tick();
    const refs = capture.readRefs!();
    state.cleaned = { root: refs.root == null, editor: refs.editor == null, control: refs.control == null,
      publicRoot: refs.publicRoot == null, publicEditor: refs.publicEditor == null };
  }
};
window.selectSurfaceHydration = state;
