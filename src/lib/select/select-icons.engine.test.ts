import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import { resolveSelectClear, resolveSelectMenuIcon, resolveSelectRemoveIcon, resolveSelectSuffix } from './select-icons.engine';
import type { SelectMenuItemIconInfo, SelectSuffixInfo } from './select-icons.types';

const defaults = { down: 'down', search: 'search', loading: 'loading' };
const suffixInfo = (extra: Partial<SelectSuffixInfo> = {}): SelectSuffixInfo => ({
  searchValue: 'query', open: false, focused: false, showSearch: true, loading: undefined, ...extra
});
const menuInfo = (isSelected = false): SelectMenuItemIconInfo<string | number> => ({
  value: 'a', disabled: false, isSelected
});

describe('resolveSelectSuffix', () => {
  it('keeps raw scalar visibility distinct from the root suffix class', () => {
    for (const suffix of [false, 0, '']) {
      expect(resolveSelectSuffix({ suffix, info: suffixInfo(), hasFeedback: true }, defaults))
        .toEqual({ content: suffix, appendFeedback: false, hasSuffix: true, visible: false });
    }
  });

  it('retains the wrapped affix for false, zero, empty string and context null', () => {
    for (const suffixIcon of [false, 0, '']) {
      expect(resolveSelectSuffix({ suffixIcon, info: suffixInfo() }, defaults))
        .toEqual({ content: suffixIcon, appendFeedback: false, hasSuffix: true, visible: true });
    }
    expect(resolveSelectSuffix({ context: { suffixIcon: null }, info: suffixInfo() }, defaults))
      .toEqual({ content: null, appendFeedback: false, hasSuffix: true, visible: true });
  });

  it('hides local null but retains feedback independently', () => {
    expect(resolveSelectSuffix(
      { suffixIcon: null, context: { suffixIcon: 'context' }, info: suffixInfo() },
      defaults
    ))
      .toEqual({ content: null, appendFeedback: false, hasSuffix: false, visible: false });
    expect(resolveSelectSuffix(
      { suffixIcon: null, hasFeedback: true, info: suffixInfo() },
      defaults
    ))
      .toEqual({ content: false, appendFeedback: true, hasSuffix: true, visible: true });
  });

  it('calls a raw producer once with five own fields and an unbound receiver', () => {
    const receivers: unknown[] = [];
    let arity = 0;
    let supplied: SelectSuffixInfo | undefined;
    const info = { ...suffixInfo(), unrelated: 'excluded' };
    const result = resolveSelectSuffix({ info, suffix: function (this: unknown, value) {
      receivers.push(this);
      arity = arguments.length;
      supplied = value;
      return [];
    } }, defaults);

    expect(receivers).toEqual([undefined]);
    expect(arity).toBe(1);
    expect(supplied).toEqual(suffixInfo());
    expect(supplied).not.toBe(info);
    expect(Object.keys(supplied!)).toEqual(['searchValue', 'open', 'focused', 'showSearch', 'loading']);
    expect(Object.values(Object.getOwnPropertyDescriptors(supplied!)).every(descriptor =>
      descriptor.enumerable && descriptor.configurable && descriptor.writable && Object.hasOwn(
        descriptor,
        'value'
      ))).toBe(true);
    expect(result).toEqual({ content: [], appendFeedback: false, hasSuffix: true, visible: true });
  });

  it('does not compose feedback or a fallback after a raw undefined result', () => {
    expect(resolveSelectSuffix(
      { suffix: () => undefined, suffixIcon: 'own', hasFeedback: true, info: suffixInfo() },
      defaults
    ))
      .toEqual({ content: undefined, appendFeedback: false, hasSuffix: false, visible: false });
  });

  it('falls through nullish raw suffix and preserves local loading priority', () => {
    expect(resolveSelectSuffix(
      {
        suffix: null,
        suffixIcon: 'own',
        loadingIcon: 'unused',
        info: suffixInfo({ loading: true })
      },
      defaults
    ).content)
      .toBe('own');
    expect(resolveSelectSuffix(
      {
        loadingIcon: false,
        context: { loadingIcon: 'context' },
        info: suffixInfo({ loading: true })
      },
      defaults
    ).content)
      .toBe(false);
    expect(resolveSelectSuffix(
      { context: { loadingIcon: 'context' }, info: suffixInfo({ loading: true }) },
      defaults
    ).content)
      .toBe('context');
  });

  it('uses effective search state and undefined-only search icon fallback', () => {
    const info = suffixInfo({ open: true });

    expect(resolveSelectSuffix(
      { showSearch: false, context: { showSearch: { searchIcon: 'context' } }, info },
      defaults
    ).content).toBeNull();
    expect(resolveSelectSuffix(
      { showSearch: true, context: { showSearch: { searchIcon: 'context' } }, info },
      defaults
    ).content).toBe('context');
    expect(resolveSelectSuffix({ showSearch: { searchIcon: 0 }, info }, defaults).content).toBe(0);
    expect(resolveSelectSuffix({ context: { suffixIcon: 'closed' }, info }, defaults).content).toBe('search');
    expect(resolveSelectSuffix(
      { context: { suffixIcon: 'closed' }, info: { ...info, showSearch: false } },
      defaults
    ).content).toBe('closed');
  });

  it('keeps opaque node-only templates and returned content unevaluated', () => {
    let calls = 0;
    const node = createRawSnippet(() => {
      calls++;
      return { render: () => '<i>icon</i>' };
    });
    const content = [node];

    expect(resolveSelectSuffix({ suffixIcon: node, info: suffixInfo() }, defaults).content).toBe(node);
    expect(resolveSelectSuffix({ suffix: content, info: suffixInfo() }, defaults).content).toBe(content);
    expect(resolveSelectSuffix({ suffix: () => node, info: suffixInfo() }, defaults).content).toBe(node);
    expect(calls).toBe(0);
  });
});

describe('resolveSelectMenuIcon', () => {
  it('shows static templates only on selected rows and never invokes a default template', () => {
    let calls = 0;
    const node = createRawSnippet(() => {
      calls++;
      return { render: () => '<i>check</i>' };
    });
    const content = [node];

    expect(resolveSelectMenuIcon(content, undefined, null, menuInfo())).toEqual({
      visible: false,
      content: undefined,
      fallback: false
    });
    expect(resolveSelectMenuIcon(content, undefined, null, menuInfo(true))).toEqual({
      visible: true,
      content,
      fallback: false
    });
    expect(resolveSelectMenuIcon(undefined, undefined, node, menuInfo())).toEqual({
      visible: false,
      content: undefined,
      fallback: false
    });
    expect(resolveSelectMenuIcon(undefined, undefined, node, menuInfo(true)).content).toBe(node);
    expect(calls).toBe(0);
  });

  it('retains falsy static content on unselected rows without using a fallback', () => {
    for (const content of [null, false, 0, '']) {
      expect(resolveSelectMenuIcon(content, undefined, 'default', menuInfo())).toEqual({
        visible: true,
        content,
        fallback: false
      });
    }
    expect(resolveSelectMenuIcon([], undefined, 'default', menuInfo())).toEqual({
      visible: false,
      content: undefined,
      fallback: false
    });
  });

  it('calls the producer for every row with typed values and exact metadata', () => {
    const seen: unknown[] = [], receivers: unknown[] = [], arities: number[] = [];
    for (const value of [1, '1', undefined]) {
      const info = { value, disabled: true, isSelected: false, unrelated: 'excluded' };
      expect(resolveSelectMenuIcon(function (this: unknown, supplied) {
        seen.push(supplied);
        receivers.push(this);
        arities.push(arguments.length);
        return null;
      }, undefined, 'default', info)).toEqual({ visible: true, content: null, fallback: false });
    }
    expect(seen).toEqual([1, '1', undefined].map(value => ({
      value,
      disabled: true,
      isSelected: false
    })));
    expect(seen.map(value => Object.keys(value as object))).toEqual(Array(3).fill(['value', 'disabled', 'isSelected']));
    expect(receivers).toEqual([undefined, undefined, undefined]);
    expect(arities).toEqual([1, 1, 1]);
  });

  it('uses the TransBtn span only after a producer returns undefined', () => {
    expect(resolveSelectMenuIcon(() => undefined, undefined, 'default', menuInfo()))
      .toEqual({ visible: true, content: null, fallback: true });
    expect(resolveSelectMenuIcon(() => undefined, undefined, 'default', menuInfo(true)))
      .toEqual({ visible: true, content: '✓', fallback: true });
    expect(resolveSelectMenuIcon(() => false, undefined, 'default', menuInfo(true)))
      .toEqual({ visible: true, content: false, fallback: false });
  });

  it('chooses the first non-undefined definition before evaluating it', () => {
    let contextCalls = 0;
    const context = () => {
      contextCalls++;
      return 'context';
    };

    expect(resolveSelectMenuIcon(() => undefined, context, 'default', menuInfo(true)).fallback).toBe(true);
    expect(contextCalls).toBe(0);
    expect(resolveSelectMenuIcon(undefined, context, 'default', menuInfo(true)).content).toBe('context');
    expect(contextCalls).toBe(1);
  });
});

describe('resolveSelectRemoveIcon', () => {
  it('distinguishes raw null from a producer null or undefined result', () => {
    expect(resolveSelectRemoveIcon(null, 'context', 'default')).toEqual({
      content: '×',
      fallback: false
    });
    expect(resolveSelectRemoveIcon(undefined, null, 'default')).toEqual({
      content: '×',
      fallback: false
    });
    expect(resolveSelectRemoveIcon(() => null, 'context', 'default')).toEqual({
      content: null,
      fallback: false
    });
    expect(resolveSelectRemoveIcon(() => undefined, 'context', 'default')).toEqual({
      content: '×',
      fallback: true
    });
  });

  it('passes one undefined argument and preserves an unbound receiver', () => {
    const receivers: unknown[] = [];
    let arity = 0, actual: unknown = 'unset';
    const result = resolveSelectRemoveIcon(function (this: unknown, value) {
      receivers.push(this);
      arity = arguments.length;
      actual = value;
      return 0;
    }, undefined, 'default');

    expect(result).toEqual({ content: 0, fallback: false });
    expect(receivers).toEqual([undefined]);
    expect(arity).toBe(1);
    expect(actual).toBeUndefined();
  });

  it('keeps static empty content and opaque default templates', () => {
    let calls = 0;
    const node = createRawSnippet(() => {
      calls++;
      return { render: () => '<i>close</i>' };
    });
    for (const content of [false, 0, '', []])
      expect(resolveSelectRemoveIcon(content, undefined, node)).toEqual({ content, fallback: false });
    expect(resolveSelectRemoveIcon(undefined, undefined, node).content).toBe(node);
    expect(calls).toBe(0);
  });
});

describe('resolveSelectClear', () => {
  it('uses the default icon for boolean true and raw multiplication sign for an object', () => {
    const input = { displayCount: 1, searchValue: '' };

    expect(resolveSelectClear({ ...input, allowClear: true }, 'filled-circle'))
      .toEqual({ visible: true, content: 'filled-circle', label: 'Clear' });
    expect(resolveSelectClear(
      { ...input, allowClear: {}, contextAllowClear: { clearIcon: 'context', label: 'Context' } },
      'filled-circle'
    ))
      .toEqual({ visible: true, content: '×', label: 'Clear' });
  });

  it('uses icon truthiness while preserving empty labels and a localized default', () => {
    for (const clearIcon of [undefined, null, false, 0, '']) {
      expect(resolveSelectClear(
        { allowClear: { clearIcon, label: '' }, displayCount: 1, searchValue: 'a' },
        'unused',
        'Очистить'
      ))
        .toEqual({ visible: true, content: '×', label: '' });
    }
    const clearIcon: readonly never[] = [];

    expect(resolveSelectClear(
      { allowClear: { clearIcon, label: null }, displayCount: 1, searchValue: 'a' },
      'unused',
      'Очистить'
    ))
      .toEqual({ visible: true, content: clearIcon, label: 'Очистить' });
  });

  it('honors local false and context fallback without opening opaque templates', () => {
    let calls = 0;
    const node = createRawSnippet(() => {
      calls++;
      return { render: () => '<i>clear</i>' };
    });

    expect(resolveSelectClear(
      { allowClear: false, contextAllowClear: true, displayCount: 1, searchValue: 'a' },
      node
    ).visible).toBe(false);
    expect(resolveSelectClear({ contextAllowClear: true, displayCount: 1, searchValue: 'a' }, node).content).toBe(node);
    expect(calls).toBe(0);
  });

  it('hides disabled, empty and empty-combobox clears but keeps an ordinary search clear', () => {
    for (const state of [{ disabled: true, displayCount: 1, searchValue: 'a' },
      { displayCount: 0, searchValue: '' }, { combobox: true, displayCount: 1, searchValue: '' }]) {
      expect(resolveSelectClear({ ...state, allowClear: true }, 'icon')).toEqual({
        visible: false,
        content: null,
        label: ''
      });
    }
    expect(resolveSelectClear({ displayCount: 0, searchValue: 'query', allowClear: true }, 'icon').visible).toBe(true);
  });
});
