import {
  Select,
  type SelectLabelRenderInfo,
  type SelectLabelValue,
  type SelectOption,
  type SelectProps,
  type SelectValueElement
} from 'antd-svelte';
import type {
  ComponentProps,
  Snippet
} from 'svelte';

interface Option {
  uid: number;
  text: string;
  alternate?: unknown;
  meta: { owner: string };
}

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;

export type SelectValueContracts = [
  Assert<Equal<SelectProps<number>['options'], readonly SelectOption<number>[] | undefined>>,
  Assert<Equal<SelectProps<number>['value'], number | null | undefined>>,
  Assert<Equal<SelectProps<number, 'multiple'>['value'], number[] | null | undefined>>,
  Assert<Equal<SelectProps<number, 'tags'>['value'], (number | string)[] | null | undefined>>,
  Assert<Equal<SelectProps<number, undefined, Option, true>['value'], SelectLabelValue<number> | null | undefined>>,
  Assert<Equal<SelectProps<number, 'multiple', Option, true>['value'], SelectLabelValue<number>[] | null | undefined>>,
  Assert<Equal<SelectProps<number, 'tags', Option, true>['value'], SelectLabelValue<number | string>[] | null | undefined>>,
  Assert<Equal<SelectValueElement<number, boolean>, number | SelectLabelValue<number>>>,
  Assert<Equal<ComponentProps<typeof Select<number>>['labelInValue'], false | undefined>>,
  Assert<Equal<SelectLabelRenderInfo<number>['label'], unknown>>,
  Assert<Equal<SelectLabelRenderInfo<number>['key'], number>>,
  Assert<Equal<Parameters<NonNullable<SelectProps<number, undefined, Option, true>['onChange']>>[1], Option | undefined>>,
  Assert<Equal<Parameters<NonNullable<SelectProps<number, 'multiple', Option, true>['onChange']>>[1], Option[]>>
];

export const labeled: SelectProps<number, 'multiple', Option, true> = {
  mode: 'multiple',
  labelInValue: true,
  options: [{ uid: 0, text: 'Zero', meta: { owner: 'input' } }],
  fieldNames: { value: 'uid', label: 'text' },
  optionLabelProp: 'alternate',
  value: [{ value: 0, label: ['Owner', 0, false] }],
  labelRender(item) {
    const value: number = item.value;
    const key: number = item.key;
    const disabled: boolean | undefined = item.disabled;
    const title: unknown = item.title;
    void [value, key, disabled, title];
    return typeof item.label === 'string' ? item.label : ['Rendered', item.value];
  },
  onChange(values, options) {
    const selected: SelectLabelValue<number>[] = values;
    const records: Option[] = options;
    void [selected, records];
  },
  onSelect(value, option) {
    const selected: SelectLabelValue<number> = value;
    const owner: string = option.meta.owner;
    void [selected, owner];
  }
};

export function snippetLabel(snippet: Snippet): SelectProps<number, undefined, Option, true> {
  return { labelInValue: true, value: { value: 0, label: snippet }, labelRender: () => snippet };
}

export const invalidDefault: SelectProps<number> = {
  // @ts-expect-error Omitted labelInValue preserves the existing primitive domain.
  value: { value: 0, label: 'Zero' }
};
export const invalidLabeled: SelectProps<number, undefined, Option, true> = {
  labelInValue: true,
  // @ts-expect-error Labeled mode requires the labeled payload.
  value: 0
};
export const invalidTypedKey: SelectLabelValue<number> = {
  // @ts-expect-error The selected primitive still follows the first generic.
  value: '0'
};
export const invalidRenderer: SelectProps<number> = {
  // @ts-expect-error Raw arbitrary objects need an explicit renderer, not DOM stringification.
  labelRender: () => ({ arbitrary: true })
};
