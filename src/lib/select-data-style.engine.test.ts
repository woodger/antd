import { describe, expect, it } from 'vitest';
import { serializeSelectDataStyle } from './select-data-style.engine';

describe('raw Select option style', () => {
  it('preserves Native CSS strings and keeps absent style absent', () => {
    const style = 'min-height: 40px; --LabelCase: "a;b"; color: red !important';

    expect(serializeSelectDataStyle(style)).toBe(style);
    expect(serializeSelectDataStyle('')).toBe('');
    expect(serializeSelectDataStyle(undefined)).toBeUndefined();
    expect(serializeSelectDataStyle(null)).toBeUndefined();
  });

  it('adds lengths while preserving unitless numeric fields and custom property case', () => {
    expect(serializeSelectDataStyle({
      minHeight: 40, marginTop: -2, padding: 0, lineHeight: 1.5, opacity: 0.5,
      fontWeight: 600, zIndex: 3, gridRow: 2, '--OptionHeight': 40
    })).toBe('min-height:40px;margin-top:-2px;padding:0;line-height:1.5;opacity:0.5;'
      + 'font-weight:600;z-index:3;grid-row:2;--OptionHeight:40');
  });

  it('keeps vendor prefixes and their unitless variants', () => {
    expect(serializeSelectDataStyle({
      WebkitLineClamp: 2, msFlex: 1, MozBoxFlex: 3, OAnimationIterationCount: 4,
      msTransition: ' opacity 1s ', WebkitMarginStart: 5
    })).toBe('-webkit-line-clamp:2;-ms-flex:1;-moz-box-flex:3;'
      + '-o-animation-iteration-count:4;-ms-transition:opacity 1s;-webkit-margin-start:5px');
  });

  it('omits empty values without changing or inheriting owner properties', () => {
    const style = Object.assign(Object.create({ minHeight: 80 }), {
      minHeight: 40, color: null, margin: undefined, visibility: false, display: '',
      '--empty': true, border: ' 0 solid red '
    });
    const descriptors = Object.getOwnPropertyDescriptors(style);

    expect(serializeSelectDataStyle(style)).toBe('min-height:40px;border:0 solid red');
    expect(Object.getOwnPropertyDescriptors(style)).toEqual(descriptors);
    expect(serializeSelectDataStyle({ color: undefined })).toBeUndefined();
    expect(serializeSelectDataStyle({ color: '   ' })).toBeUndefined();
  });

  it('rejects invalid scalar styles', () => {
    expect(() => serializeSelectDataStyle(40)).toThrow(TypeError);
    expect(() => serializeSelectDataStyle(false)).toThrow(TypeError);
  });
});
