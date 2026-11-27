import { describe, expect, it } from 'vitest';
import { diffSelectStyle, resolveSelectStyleFrame, selectStyleValue, snapshotSelectStyle } from './select-style.engine';

describe('diffSelectStyle', () => {
  it('updates a changed longhand without replaying an unchanged later shorthand', () => {
    expect(diffSelectStyle({ borderColor: 'red', border: '1px solid black' },
      { borderColor: 'green', border: '1px solid black' }))
      .toEqual([{ property: 'borderColor', value: 'green' }]);
  });
  it('clears removed keys before writing next keys in their authored order', () => {
    expect(diffSelectStyle({ marginLeft: 10, color: 'red' }, { margin: 20, color: 'blue' }))
      .toEqual([{ property: 'marginLeft', value: undefined }, { property: 'margin', value: 20 },
        { property: 'color', value: 'blue' }]);
  });
  it('compares raw values and copies snapshots before caller mutation', () => {
    const style = { color: ' red ', opacity: 1 };
    const previous = snapshotSelectStyle(style);
    style.color = 'red';

    expect(diffSelectStyle(previous, style)).toEqual([{ property: 'color', value: 'red' }]);
    expect(diffSelectStyle({ color: 'red', opacity: 1 }, { opacity: 1, color: 'red' })).toEqual([]);
  });
  it('preserves an explicit clear and restores a raw value after it', () => {
    expect(diffSelectStyle({ borderColor: 'green', border: '1px solid black' },
      { borderColor: undefined, border: '1px solid black' })).toEqual([{
        property: 'borderColor',
        value: undefined
      }]);
    expect(diffSelectStyle({ borderColor: undefined, border: '1px solid black' },
      { borderColor: 'red', border: '1px solid black' })).toEqual([{
        property: 'borderColor',
        value: 'red'
      }]);
  });
});

describe('resolveSelectStyleFrame', () => {
  it('keeps Source measured variable after authored input styles and absent during SSR', () => {
    const initial = resolveSelectStyleFrame({ width: 20, '--select-input-width': 999 }, [],
      [[['--select-input-width', '']]]);
    const measured = resolveSelectStyleFrame({ width: undefined, '--select-input-width': 999 }, [],
      [[['--select-input-width', '45']]]);

    expect(initial.text).toBe('width:20px');
    expect(measured.text).toBe('--select-input-width:45');
    expect(measured.authored.has('--select-input-width')).toBe(false);
    expect(measured.properties.width).toBeUndefined();
  });
  it('lets an own undefined width suppress framework measurement before serialization', () => {
    const frame = resolveSelectStyleFrame({ width: undefined, color: 'red' }, [[['width', '37px']]]);

    expect(frame.properties).toEqual({ width: undefined, color: 'red' });
    expect(frame.authored.has('width')).toBe(true);
    expect(frame.text).toBe('color:red');
  });
  it('retains object order and applies the final framework projection once', () => {
    const frame = resolveSelectStyleFrame({
      borderColor: 'red',
      border: '1px solid black',
      left: 12
    },
      ['--accent:blue;left:3px'], [[['left', '0px', 'important']]]);

    expect(Object.keys(frame.properties)).toEqual(['--accent', 'left', 'borderColor', 'border']);
    expect(frame.priorities.left).toBe('important');
    expect(frame.authored.has('left')).toBe(false);
    expect(frame.authored.has('border')).toBe(true);
    expect(frame.text).toBe('--accent:blue;left:0px !important;border-color:red;border:1px solid black');
  });
  it('formats Source units and custom values without a DOM parser', () => {
    expect(selectStyleValue('paddingLeft', 3)).toBe('3px');
    expect(selectStyleValue('opacity', 0.5)).toBe('0.5');
    expect(selectStyleValue('WebkitLineClamp', 2)).toBe('2');
    expect(selectStyleValue('--token:part', ' red:blue ')).toBe('red:blue');
    expect(selectStyleValue('color', undefined)).toBe('');
  });
});
