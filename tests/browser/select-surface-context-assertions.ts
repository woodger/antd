import assert from 'node:assert/strict';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { SelectSurfaceContextDOM, SelectSurfaceContextNode } from './select-surface-context-metrics.mjs';
import type { SelectSurfaceContextPoint } from './select-surface-context-reference';
import { decodeSelectSurface } from './select-surface-receipts';

function contextClasses(node: SelectSurfaceContextNode) {
  return node.classes.filter(name => /-status-|-compact-|has-feedback|in-form-item/.test(name)).sort();
}
function variantClasses(node: SelectSurfaceContextNode) {
  return node.classes.filter(name => /^ant-(?:input|select)-(?:outlined|underlined|borderless|filled)$/.test(name)).sort();
}
export function verifySelectSurfaceContextDOM(
  actual: SelectSurfaceContextDOM,
  original: SelectSurfaceContextDOM,
  label: string
) {
  assert.deepEqual(Object.fromEntries(actual.status.map(status => [status.side, decodeSelectSurface(status.value)])),
    Object.fromEntries(original.status.map(status => [status.side, decodeSelectSurface(status.value)])), `${label} public hook values`);
  const actualSlots = new Map(actual.controls.map(slot => [slot.slot, slot.nodes]));
  assert.deepEqual(
    [...actualSlots.keys()].sort(),
    original.controls.map(slot => slot.slot).sort(),
    `${label} retained public controls`
  );
  for (const slot of original.controls) {
    const nodes = actualSlots.get(slot.slot)!;
    assert.equal(nodes.length, slot.nodes.length, `${label}/${slot.slot} physical control roots`);
    for (const [index, source] of slot.nodes.entries()) {
      const node = nodes[index];
      assert.equal(node.tag, source.tag, `${label}/${slot.slot}/${index} element role`);
      assert.equal(node.value, source.value, `${label}/${slot.slot}/${index} retained input value`);
      assert.equal(
        node.disabled,
        source.disabled,
        `${label}/${slot.slot}/${index} inherited Form.disabled`
      );
      assert.deepEqual(
        contextClasses(node),
        contextClasses(source),
        `${label}/${slot.slot}/${index} Form/Compact classes`
      );
      assert.deepEqual(
        variantClasses(node),
        variantClasses(source),
        `${label}/${slot.slot}/${index} Form.variant`
      );
      assert.deepEqual(node.classes.filter(name => name.startsWith('surface-context-nested-')).sort(),
        source.classes.filter(name => name.startsWith('surface-context-nested-')).sort(), `${label}/${slot.slot}/${index} resolved semantic callback`);
      assert.equal(
        node.box.height > 0,
        source.box.height > 0,
        `${label}/${slot.slot}/${index} hidden subtree visibility`
      );
      if (source.box.height > 0) {
        assert.equal(
          node.box.height,
          source.box.height,
          `${label}/${slot.slot}/${index} Compact isolation height`
        );
        for (const property of ['color', 'backgroundColor', 'fontSize', 'borderTopStyle', 'borderTopWidth', 'borderTopColor']) {
          assert.equal(
            node.css[property],
            source.css[property],
            `${label}/${slot.slot}/${index} ${property}`
          );
        }
      }
    }
  }
  assert.equal(
    actual.popup.length,
    original.popup.length,
    `${label} lazy popup presence and retention`
  );
  assert.deepEqual(actual.popup.map(node => node.box.height > 0), original.popup.map(node => node.box.height > 0),
    `${label} retained popup visibility`);
  assert.equal(actual.editor.disabled, original.editor.disabled, `${label} parent disabled`);
}

export function verifySelectSurfaceContextPoint(actual: { dom: SelectSurfaceContextDOM;
  state: { open?: boolean; disabled?: boolean; variant?: string; events?: unknown[];
    fieldErrors?: unknown; fieldWarnings?: unknown; fieldValue?: unknown } }, original: SelectSurfaceContextPoint,
  label: string, originalCalls: readonly SelectSurfaceProducerCall[]) {
  assert.deepEqual({ open: actual.state.open, disabled: actual.state.disabled, variant: actual.state.variant,
    events: actual.state.events, fieldErrors: actual.state.fieldErrors, fieldWarnings: actual.state.fieldWarnings },
  { open: original.state.open, disabled: original.state.disabled, variant: original.state.variant,
    events: original.state.events, fieldErrors: original.state.fieldErrors, fieldWarnings: original.state.fieldWarnings },
  `${label} public owner state`);
  const parent = originalCalls.slice(0, original.state.callCount).reverse()
    .find(call => call.kind === 'classNames' && call.side === 'parent');
  assert.ok(parent, `${label} original parent value receipt`);
  const originalProps = (decodeSelectSurface(parent.argument) as { props: Record<string, unknown> }).props;
  assert.deepEqual(
    actual.state.fieldValue,
    originalProps.value,
    `${label} nested inputs are not the parent field`
  );
  verifySelectSurfaceContextDOM(actual.dom, original.dom, label);
}

export function verifySelectSurfaceContextSSRCalls(
  actual: readonly SelectSurfaceProducerCall[],
  original: readonly SelectSurfaceProducerCall[]
) {
  assert.deepEqual(
    actual.map(call => [call.kind, call.side]),
    original.map(call => [call.kind, call.side]),
    'actual closed SSR producer/hook order'
  );
  for (const [index, call] of actual.entries()) {
    const source = original[index];
    assert.deepEqual(
      decodeSelectSurface(call.result),
      decodeSelectSurface(source.result),
      `SSR/${index} actual public result`
    );
    if (call.kind === 'classNames') {
      const normalized = (item: SelectSurfaceProducerCall) => {
        const props = (decodeSelectSurface(item.argument) as { props: Record<string, unknown> }).props;
        return Object.fromEntries(['size', 'status', 'disabled', 'variant'].map(key =>
          [key, { own: Object.hasOwn(props, key), value: props[key] }]));
      };
      assert.deepEqual(
        normalized(call),
        normalized(source),
        `SSR/${index} actual resolved metadata and presence`
      );
    }
    assert.ok(
      Object.hasOwn(call, 'rawArgument') && Object.hasOwn(call, 'rawResult'),
      `SSR/${index} complete Native raw receipt`
    );
  }
}
