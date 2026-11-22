import type {
  AutoCompleteProps, AutoCompleteRef, SelectProps, SelectRef, SelectScrollAlign, SelectScrollConfig,
  SelectScrollKey, SelectScrollOffset, SelectScrollOffsetInfo
} from '@woodger/antd-svelte';

export const stringKey: SelectScrollKey = 'k-020';
export const numberKey: SelectScrollKey = 20;
export const bigintKey: SelectScrollKey = 20n;
export const scrollAlign: SelectScrollAlign = 'auto';
export const scrollOffset: SelectScrollOffset = (info: SelectScrollOffsetInfo) => {
  const size = info.getSize(stringKey, bigintKey);
  const top: number = size.top;
  const bottom: number | undefined = size.bottom;
  const align: SelectScrollAlign | undefined = info.align;
  return align === 'bottom' ? (bottom ?? top) - top : top;
};
export const scrollTargets: SelectScrollConfig[] = [
  20,
  { index: 0 },
  { index: 20, align: 'bottom', offset: 7 },
  { key: stringKey, align: 'top', offset: scrollOffset },
  { key: numberKey, offset: 0 },
  { key: bigintKey },
  { top: 64, left: 9 },
  {}
];
export function useSelectRef(ref: SelectRef) {
  ref.focus({ preventScroll: true });
  ref.blur();
  ref.scrollTo();
  ref.scrollTo(undefined);
  ref.scrollTo(null);
  for (const target of scrollTargets) ref.scrollTo(target);
}
export function useAutoCompleteRef(ref: AutoCompleteRef) { useSelectRef(ref); }

export const selectVirtual = {
  virtual: true, listHeight: 100, listItemHeight: 16, showScrollBar: 'optional',
  nativeElement: undefined, inputElement: undefined,
  onActive: value => value?.toUpperCase(),
  onPopupScroll: event => {
    const top: number = event.currentTarget.scrollTop;
    return top;
  }
} satisfies SelectProps<string>;
export const selectVirtualUndefined = {
  virtual: undefined, listHeight: undefined, listItemHeight: undefined, showScrollBar: undefined
} satisfies SelectProps;
export const selectVirtualMultiple = {
  mode: 'multiple', value: [1, 2], virtual: false,
  onActive: value => value?.toFixed()
} satisfies SelectProps<number, 'multiple'>;
export const selectVirtualTags = {
  mode: 'tags', value: ['free', 'v-020'], showScrollBar: false,
  onActive: value => value?.toUpperCase()
} satisfies SelectProps<string, 'tags'>;
export const autoCompleteVirtual = {
  virtual: false, listHeight: 100, listItemHeight: 0, showScrollBar: true,
  nativeElement: undefined, inputElement: undefined,
  onActive: value => value?.toUpperCase(),
  onPopupScroll: event => {
    const top: number = event.currentTarget.scrollTop;
    return top;
  }
} satisfies AutoCompleteProps;
export const autoCompleteVirtualUndefined = {
  virtual: undefined, listHeight: undefined, listItemHeight: undefined, showScrollBar: undefined
} satisfies AutoCompleteProps;

// @ts-expect-error virtual accepts boolean, including an explicit undefined.
export const invalidVirtual: SelectProps = { virtual: 'true' };
// @ts-expect-error listHeight remains a number.
export const invalidHeight: AutoCompleteProps = { listHeight: '100' };
// @ts-expect-error listItemHeight remains a number.
export const invalidItemHeight: SelectProps = { listItemHeight: false };
// @ts-expect-error scrollbar mode accepts optional, not an arbitrary string.
export const invalidScrollbar: AutoCompleteProps = { showScrollBar: 'always' };
// @ts-expect-error row keys do not accept booleans.
export const invalidScrollKey: SelectScrollConfig = { key: true };
// @ts-expect-error index is numeric.
export const invalidScrollIndex: SelectScrollConfig = { index: '20' };
// @ts-expect-error alignment has three Source values.
export const invalidScrollAlign: SelectScrollConfig = { index: 20, align: 'center' };
// @ts-expect-error offset callbacks return a number.
export const invalidScrollOffset: SelectScrollConfig = { key: 'k-020', offset: () => '7' };
// @ts-expect-error Select onActive keeps its typed value.
export const invalidActive: SelectProps<number> = { onActive: (value: string | null) => value };
