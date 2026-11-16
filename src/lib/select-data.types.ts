import type { SelectFieldNames, SelectScrollKey } from './select.types';

export type SelectDataValue = string | number;
export type SelectDataFields = Required<SelectFieldNames>;

/** Raw metadata Source; индекс задаёт позиция в flattened массиве, включая headers. */
export interface SelectDataRow<Value extends SelectDataValue, Data extends object> {
  key: SelectScrollKey;
  data: Data & Readonly<Record<string, unknown>>;
  label: unknown;
  value?: Value;
  group?: boolean;
  groupOption?: boolean;
}

export interface SelectDataMaps<Value extends SelectDataValue, Data extends object> {
  valueOptions: ReadonlyMap<Value | undefined, Data>;
  labelOptions: ReadonlyMap<unknown, Data>;
  /** Native token lookup сохраняет только собственные label/search поля. */
  nativeLabelOptions: ReadonlyMap<unknown, Data>;
}

export interface SelectDataFilter<Data extends object> {
  filterOption?: boolean | ((search: string, option: Data) => boolean);
  optionFilterProp?: string | readonly string[];
  /** Только implicit default: сохраняет прежний Native label trim/NFKD matcher. */
  defaultMatch?: (search: string, option: Data, fields: SelectDataFields, group: boolean) => boolean;
}

export interface SelectDataDisplay<Value extends SelectDataValue, Data extends object> {
  value: Value;
  label: unknown;
  data: Data | undefined;
  disabled: boolean | undefined;
  title: unknown;
}

/** Display label и исходный callback option кешируются независимо. */
export interface SelectDataCache<Value extends SelectDataValue, Data extends object> {
  labels: ReadonlyMap<Value, unknown>;
  options: ReadonlyMap<Value, Data | undefined>;
  display: readonly SelectDataDisplay<Value, Data>[];
}

export interface SelectDataAttributes {
  physical: Readonly<Record<string, unknown>>;
  aria: Readonly<Record<string, unknown>>;
}
