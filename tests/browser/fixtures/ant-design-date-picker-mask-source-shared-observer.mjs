import assert from 'node:assert/strict';
import { createSelectSurfaceRecorder } from '../../../tests/browser/select-surface-producers.mjs';

// This existing recorder is only an observer. Ambient Window is a leaf, as in Source v2.
export function sourceSharedScript() {
  let recorder = createSelectSurfaceRecorder.toString();
  const encode = "if (typeof Node !== 'undefined' && item instanceof Node) return";
  const raw = "if (typeof Node !== 'undefined' && item instanceof Node) {";
  assert.equal(recorder.split(encode).length, 2);
  assert.equal(recorder.split(raw).length, 2);
  recorder = recorder.replace(encode,
    "if (typeof Window !== 'undefined' && item instanceof Window) "
    + "return { $: 'ambient-window' };\n      " + encode);
  recorder = recorder.replace(raw,
    "if (typeof Window !== 'undefined' && item instanceof Window) { "
    + "node.opaque = 'ambient-window'; return { ref: identity }; }\n      " + raw);
  return '({dayjs:dayjs,recorder:' + recorder + '})';
}
