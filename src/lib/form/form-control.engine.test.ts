import { describe, expect, it } from 'vitest';
import { readFormControlValue } from './form-control.engine';

describe('readFormControlValue', () => {
  it.each([undefined, null, false, 0, ''])('preserves a direct value of %s', (value) => {
    expect(readFormControlValue('value', [value, 'extra argument'])).toBe(value);
  });

  it('reads a property exposed by a native-style target prototype', () => {
    const target = Object.create({ checked: false });
    const event = { target };

    expect(readFormControlValue('checked', [event])).toBe(false);
    expect(readFormControlValue('value', [event])).toBe(event);
  });

  it('distinguishes a supplied undefined target property from a missing property', () => {
    const event = { target: { value: undefined } };

    expect(readFormControlValue('value', [event])).toBeUndefined();
    expect(readFormControlValue('checked', [event])).toBe(event);
    expect(readFormControlValue('value', [])).toBeUndefined();
  });
});
