import type {
  AutoCompleteProps,
  Select,
  SelectFieldNames,
  SelectFlattenOption,
  SelectOption,
  SelectProps,
  SelectSearchConfig
} from '@woodger/antd';
import type { ComponentProps } from 'svelte';

interface MappedOption {
  uid: string;
  text?: string | number | null;
  heading?: string;
  nodes?: readonly MappedOption[];
  audit: { source: string };
  disabled?: boolean;
}

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;

type TagProps = ComponentProps<typeof Select<string, 'tags', MappedOption>>;
type TagOption = Parameters<NonNullable<TagProps['onSelect']>>[1];

export type SelectDataContracts = [
  Assert<Equal<SelectProps<number>['options'], readonly SelectOption<number>[] | undefined>>,
  Assert<Equal<SelectProps<number>['value'], number | null | undefined>>,
  Assert<Equal<SelectProps<number, 'multiple'>['value'], number[] | null | undefined>>,
  Assert<Equal<SelectProps<number, 'tags'>['value'], (number | string)[] | null | undefined>>,
  Assert<Equal<SelectFlattenOption<string, MappedOption>['data']['audit'], { source: string }>>,
  Assert<Equal<SelectFlattenOption<string, MappedOption>['label'], unknown>>,
  Assert<Equal<Parameters<NonNullable<
    SelectSearchConfig<string, MappedOption>['filterSort']
  >>[0], MappedOption>>,
  Assert<Equal<Parameters<NonNullable<
    SelectProps<string, 'multiple', MappedOption>['onChange']
  >>[1], MappedOption[]>>,
  Assert<Equal<TagOption['audit'], MappedOption['audit'] | undefined>>,
  Assert<Equal<Parameters<NonNullable<TagProps['onChange']>>[1], TagOption[]>>,
  Assert<Equal<Parameters<NonNullable<TagProps['onDeselect']>>[1], TagOption>>,
  Assert<Equal<Parameters<NonNullable<
    AutoCompleteProps<MappedOption>['onSelect']
  >>[1], MappedOption>>
];

export function tagSource(option: TagOption): string | undefined {
  return option.uid === undefined ? undefined : option.audit.source;
}

export const mappedSelectFields = {
  value: 'uid', label: 'text', options: 'nodes', groupLabel: 'heading'
} satisfies SelectFieldNames;

const options: readonly MappedOption[] = [{
  uid: 'a', text: 'Alpha', audit: { source: 'owner' }
}];

export const mappedSelect: SelectProps<string, 'multiple', MappedOption> = {
  mode: 'multiple', options, fieldNames: mappedSelectFields, value: ['a'],
  showSearch: {
    filterOption: (search, option) => option.audit.source.includes(search),
    filterSort: (a, b, info) => a.uid.localeCompare(b.uid) + info.searchValue.length
  },
  onChange(values, rawOptions) {
    const selection: string[] = values;
    const records: MappedOption[] = rawOptions;
    void [selection, records];
  },
  onSelect(value, option) {
    const primitive: string = value;
    const source: string = option.audit.source;
    void [primitive, source];
  },
  onDeselect(value, option) {
    const primitive: string = value;
    const source: string = option.audit.source;
    void [primitive, source];
  },
  onClear() {}
};

export const mappedAutoComplete: AutoCompleteProps<MappedOption> = {
  options, fieldNames: mappedSelectFields, value: 'a',
  showSearch: { filterOption: (search, option) => option.uid.includes(search) },
  onChange(value, option) {
    const primitive: string | undefined = value;
    const source: string | undefined = option?.audit?.source;
    void [primitive, source];
  },
  onSelect(value, option) {
    const primitive: string = value;
    const source: string = option.audit.source;
    void [primitive, source];
  }
};

export const invalidMapping: SelectFieldNames = {
  // @ts-expect-error Field names are strings, not array indices.
  value: 0
};

export const invalidSelectValue: SelectProps<string, undefined, MappedOption> = {
  // @ts-expect-error The raw option generic does not change the primitive value domain.
  value: { uid: 'a' }
};

export const invalidAutoCompleteValue: AutoCompleteProps<MappedOption> = {
  // @ts-expect-error AutoComplete keeps free-form input as a string.
  value: 1
};
