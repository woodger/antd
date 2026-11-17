import { describe, expect, it } from 'vitest';
import { hasSelectControlSemantics, mergeSelectSemanticMaps, mergeSelectStyle, resolveSelectSemanticValue, serializeSelectStyle } from './select-semantic.engine';

describe('hasSelectControlSemantics', () => {
  it('keeps popup-only maps outside the new control color domain', () => {
    expect(hasSelectControlSemantics({}, { classes: { popup: 'popup-only' },
      styles: { popup: { root: { color: 'red' }, listItem: { color: 'blue' } } } })).toBe(false);
    expect(hasSelectControlSemantics({ classes: { root: '' }, styles: { input: undefined } })).toBe(false);
  });
  it('recognizes authored control classes and explicit CSS property clears', () => {
    expect(hasSelectControlSemantics({ classes: { content: 'content-owner' } })).toBe(true);
    expect(hasSelectControlSemantics({ styles: { input: { color: undefined } } })).toBe(true);
    expect(hasSelectControlSemantics({ styles: { item: { opacity: 0 } } })).toBe(true);
  });
});

describe('mergeSelectStyle', () => {
  it('merges raw CSS keys and retains explicit clears before serialization', () => {
    const before = { color: 'red', backgroundColor: 'blue', padding: 4, opacity: 0.5 };
    const after = { color: undefined, backgroundColor: null, padding: '', opacity: 0 };
    const result = mergeSelectStyle(before, after);
    expect(result).toEqual(after);
    expect(serializeSelectStyle(result)).toBe('opacity:0');
    expect(before).toEqual({ color: 'red', backgroundColor: 'blue', padding: 4, opacity: 0.5 });
  });
  it('keeps legacy CSS declarations and handles object overrides without losing clears', () => {
    expect(mergeSelectStyle('color:red;background-color:blue;padding:4px', { color: undefined, padding: 2 }))
      .toBe('background-color:blue;padding:2px');
    expect(mergeSelectStyle({ padding: 2 }, 'padding:3px;--owner:0')).toBe('padding:3px;--owner:0');
    expect(mergeSelectStyle('color:red!important', { color: 'blue' })).toBe('color:red !important');
    expect(mergeSelectStyle('color:red', 'color:blue')).toBe('color:red;color:blue');
  });
  it('lets raw option keys override semantic row keys including undefined', () => {
    expect(serializeSelectStyle(mergeSelectStyle({ color: 'red', fontWeight: 700 },
      { color: undefined, backgroundColor: 'blue' }))).toBe('font-weight:700;background-color:blue');
  });
});

describe('mergeSelectSemanticMaps', () => {
  it('normalizes the public popup string shorthand before merging nested classes', () => {
    expect(mergeSelectSemanticMaps({ classes: { popup: 'context-popup' } },
      { classes: { popup: { root: 'own-popup', list: 'own-list' } } }).classes.popup)
      .toEqual({ root: 'context-popup own-popup', list: 'own-list', listItem: undefined });
  });
  it('keeps classes cumulative and applies the four Source root style layers', () => {
    const result = mergeSelectSemanticMaps({ classes: { root: 'same', popup: { root: 'ctx', list: 'ctx-list' } },
      styles: { root: { color: 'red', padding: 1 }, input: { color: 'red', opacity: 0.5 } } },
    { classes: { root: 'same', popup: { root: 'own' } },
      styles: { root: { color: 'blue' }, input: { color: undefined } } },
    { color: 'green', padding: 2 }, { padding: 4 });
    expect(result.classes.root).toBe('same same');
    expect(result.classes.popup).toEqual({ root: 'ctx own', list: 'ctx-list', listItem: undefined });
    expect(result.styles.root).toEqual({ color: 'blue', padding: 4 });
    expect(result.styles.input).toEqual({ color: undefined, opacity: 0.5 });
  });
  it('replaces nested popup CSS leaves and preserves explicit AC wrapper undefined', () => {
    const result = mergeSelectSemanticMaps({ styles: { popup: {
      root: { color: 'red', padding: 4 }, list: { color: 'red' }, listItem: { color: 'red', opacity: 0.5 }
    } } }, { styles: { popup: { root: {}, list: undefined, listItem: { color: 'blue' } } } });
    expect(result.styles.popup).toEqual({ root: {}, list: undefined, listItem: { color: 'blue' } });
    expect(Object.hasOwn(result.styles.popup, 'list')).toBe(true);
  });
  it('resolves pure producers with the identical supplied props without defaults or mutation', () => {
    const props = { mode: 'multiple', ownUndefined: undefined };
    const info = { props };
    const seen: unknown[] = [];
    const result = resolveSelectSemanticValue(input => { seen.push(input); return { root: input.props.mode }; }, info);
    expect(result).toEqual({ root: 'multiple' });
    expect(seen[0]).toBe(info);
    expect(Object.keys(props)).toEqual(['mode', 'ownUndefined']);
    expect(resolveSelectSemanticValue(undefined, info)).toBeUndefined();
  });
});
