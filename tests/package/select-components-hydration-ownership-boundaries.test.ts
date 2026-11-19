import { expect, it } from 'vitest';
import { createSelectSurfaceRecorder } from '../browser/select-surface-producers.mjs';
import { verifyOwnershipCallbacks } from '../browser/select-components-hydration-ownership-assertions';
function owner(args: unknown[][], controlKey = 'select-multiple-input') {
  const recorder = createSelectSurfaceRecorder();
  return {
    controlKey,
    events: args.map(value => recorder.encode(value)),
    rawEvents: args.map(value => recorder.raw(value))
  };
}
function payload(type: string, nativeType: string | null) {
  return { type, key: type === 'keydown' ? 'a' : undefined, code: type === 'keydown' ? 'KeyA' : undefined,
    defaultPrevented: false, propagationStopped: false,
    target: { tag: 'INPUT', ownerKey: 'B', connected: true, rootType: 11 },
    currentTarget: { tag: 'INPUT', ownerKey: 'B', connected: true, rootType: 11 }, relatedTarget: null, nativeType };
}
it('accepts only measured React/native keyboard and blur payload differences', () => {
  for (const [name, sourceType, nativeType] of [['input-keydown', 'keydown', 'keydown'], ['blur', 'blur', 'focusout']]) {
    const actual = owner([[name, payload(nativeType, null)]]), source = owner([[name, payload(
      sourceType,
      nativeType
    )]]);
    const before = JSON.stringify({ actual, source });
    expect(() => verifyOwnershipCallbacks(actual, source, name)).not.toThrow();
    expect(JSON.stringify({ actual, source })).toBe(before);
  }
});
it('checks every remaining event field, key, argument and raw descriptor', () => {
  const source = owner([['input-keydown', payload('keydown', 'keydown')]]);
  const invalid = [() => ({ ...payload('keydown', null), nativeType: 'wrong' }),
    () => ({ ...payload('keydown', null), defaultPrevented: true }),
    () => ({ ...payload('keydown', null), code: 'KeyB' }),
    () => ({
      ...payload('keydown', null),
      target: { tag: 'INPUT', ownerKey: 'A', connected: true, rootType: 11 }
    }),
    () => {
      const value = payload('keydown', null);
      delete (value as Partial<typeof value>).relatedTarget;
      return value;
    },
    () => {
      const value = payload('keydown', null);
      Object.defineProperty(value, 'nativeType', { writable: false });
      return value;
    },
    () => {
      const value = payload('keydown', null);
      value.currentTarget = value.target;
      return value;
    }];
  for (const create of invalid) {
    expect(() => verifyOwnershipCallbacks(
      owner([['input-keydown', create()]]),
      source,
      'negative'
    )).toThrow();
  }
  expect(() => verifyOwnershipCallbacks(
    owner([['input-keydown', payload('keydown', null), 'extra']]),
    source,
    'extra argument'
  )).toThrow();
  expect(() => verifyOwnershipCallbacks(owner([]), source, 'missing callback')).toThrow();
});
it('does not add an unmeasured focus or keyup normalizer', () => {
  expect(() => verifyOwnershipCallbacks(
    owner([['focus', payload('focusin', null)]]),
    owner([['focus', payload('focus', 'focusin')]]),
    'unmeasured focus'
  )).toThrow();
  expect(() => verifyOwnershipCallbacks(
    owner([['input-keydown', payload('keydown', null)]]),
    owner([['input-keydown', payload('keydown', 'keyup')]]),
    'wrong Source nativeType'
  )).toThrow();
});
it('accepts only the exact free AC option deprecated getter without evaluating it', () => {
  const option = Object.defineProperty({}, 'props', { configurable: false, enumerable: false, get() {
    throw Error('Getter must not be read');
  } });
  const actual = owner([['change', 'Owned B', {}]], 'ac-textarea'), source = owner(
    [['change', 'Owned B', option]],
    'ac-textarea'
  );

  expect(() => verifyOwnershipCallbacks(actual, source, 'known getter')).not.toThrow();
  expect(() => verifyOwnershipCallbacks(
    owner([['change', 'Other B', {}]], 'ac-textarea'),
    source,
    'value'
  )).toThrow();
  const extra = Object.defineProperty({ extra: 1 }, 'props', { configurable: false, enumerable: false, get() {
    return null;
  } });

  expect(() => verifyOwnershipCallbacks(
    actual,
    owner([['change', 'Owned B', extra]], 'ac-textarea'),
    'extra Source key'
  )).toThrow();
  const wrongDescriptor = Object.defineProperty({}, 'props', { configurable: true, enumerable: false, get() {
    return null;
  } });

  expect(() => verifyOwnershipCallbacks(
    actual,
    owner([['change', 'Owned B', wrongDescriptor]], 'ac-textarea'),
    'wrong getter descriptor'
  )).toThrow();
  expect(() => verifyOwnershipCallbacks(
    owner([['search', 'Owned B', {}]], 'ac-textarea'),
    owner([['search', 'Owned B', option]], 'ac-textarea'),
    'wrong callback'
  )).toThrow();
});
