import 'antd-svelte/styles.css';
import { mount, hydrate, tick, flushSync, unmount } from 'svelte';
import Owner from './SelectComponentsControlledRemovalCase.svelte';
import { readControlledRemovalNode, type ControlledRemovalCapture, type ControlledRemovalPoint,
  type ControlledRemovalSample, type ControlledRemovalEditor } from '../select-components-controlled-removal-cases';
let sample: ControlledRemovalSample, parsed: ControlledRemovalEditor | null, mounted: ControlledRemovalEditor | null, capture: ControlledRemovalCapture = {}, app: ReturnType<typeof mount>;
const target = document.getElementById('root')!;
const read = (): ControlledRemovalPoint => {
  const editor = target.querySelector<ControlledRemovalEditor>('[data-controlled-removal-editor]');
  return { node: readControlledRemovalNode(editor), owner: capture.read?.() ?? null, sameParsedEditor: parsed ? editor === parsed : null, sameMountedEditor: mounted ? editor === mounted : null };
};
window.controlledRemoval = {
  ready: true,
  initialize(next, body) {
    sample = next; target.innerHTML = body; parsed = target.querySelector('[data-controlled-removal-editor]');
    capture = {}; mounted = null; return read();
  },
  start() {
    capture.onCommit = () => {
      mounted = capture.readRefs?.().editor ?? null;
      window.controlledRemoval.firstCommit = structuredClone(read());
    };
    app = (sample.entry === 'csr' ? mount : hydrate)(Owner, { target, recover: false, props: { sample, capture } });
    mounted = target.querySelector('[data-controlled-removal-editor]');
    return read();
  },
  read, async tick() { await tick(); },
  focus() { const editor = capture.readRefs!().editor!; editor.focus(); editor.setSelectionRange(1, 4, 'backward'); },
  update(phase) { flushSync(() => capture.update!(phase)); return read(); },
  async dispose() { await unmount(app); await tick(); return read(); }
};
