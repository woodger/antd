import assert from 'node:assert/strict';
import type { SelectSurfaceSample } from './fixtures/select-surface-cases';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';

export function decodeSelectSurface(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  const encoded = value as Record<string, unknown>;
  if (encoded.$ === 'undefined') {
    return undefined;
  }
  if (encoded.$ === 'object' || encoded.$ === 'array') {
    const properties = encoded.properties as Array<{ key: unknown; value: unknown }>;
    const result: Record<string, unknown> = {};
    for (const property of properties) {
      const key = typeof property.key === 'string' ? property.key : JSON.stringify(property.key);
      result[key] = decodeSelectSurface(property.value);
    }
    if (encoded.$ !== 'array') {
      return result;
    }
    const array: unknown[] = [];
    array.length = Number(result.length);
    for (const [key, item] of Object.entries(result)) {
      if (key !== 'length') {
        Object.defineProperty(
          array,
          key,
          { value: item, enumerable: true, configurable: true, writable: true }
        );
      }
    }
    return array;
  }
  return Object.fromEntries(Object.entries(encoded).map(([key, item]) => [key, decodeSelectSurface(item)]));
}

function semanticArgument(call: SelectSurfaceProducerCall, sample: SelectSurfaceSample) {
  const argument = decodeSelectSurface(call.argument) as { props?: Record<string, unknown> };
  if (call.kind === 'popupRender' || !argument.props) {
    return argument;
  }
  const props = { ...argument.props };
  // class is an existing name Svelte prop; Source retains the original className.
  if (Object.hasOwn(props, 'class')) {
    props.className = props.class;
    delete props.class;
  }
  if (sample.control === 'select') {
    // Named bindables do not retain the difference of absent/own undefined in public $props rest.
    if (props.value === undefined) delete props.value;
    if (props.open === undefined) delete props.open;
  }
  return { ...argument, props };
}

export function verifySelectSurfaceProducerCalls(
  actual: readonly SelectSurfaceProducerCall[],
  original: readonly SelectSurfaceProducerCall[],
  sample: SelectSurfaceSample
) {
  assert.deepEqual(actual.map(call => [call.kind, call.side]), original.map(call => [call.kind, call.side]),
    `${sample.id} actual pure callback order/count`);
  for (const [index, call] of actual.entries()) {
    const source = original[index];
    assert.deepEqual(semanticArgument(call, sample), semanticArgument(source, sample),
      `${sample.id}/${index} whole public producer argument`);
    assert.deepEqual(decodeSelectSurface(call.result), decodeSelectSurface(source.result),
      `${sample.id}/${index} actual callback result`);
    assert.ok(Object.hasOwn(call, 'rawArgument') && Object.hasOwn(call, 'rawResult'),
      `${sample.id}/${index} retained Native raw graphs`);
    if (call.kind === 'popupRender') assert.equal(call.sameResultAsArgument, source.sameResultAsArgument,
      `${sample.id}/${index} origin/result identity`);
  }
}
