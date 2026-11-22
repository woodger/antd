import type { Snippet } from 'svelte';
import type {
  AutoCompleteClassNames, AutoCompleteProps, AutoCompleteSemanticInfo, SelectClassNames,
  SelectConfig, SelectCSSProperties, SelectLabelValue, SelectPopupContent, SelectPopupRender, SelectProps,
  SelectSemanticInfo, SelectStyle
} from '@woodger/antd-svelte';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
interface Option { id: number; text: string; marker: boolean }
interface NamedCSSProperties { color: string; borderWidth?: number }
const namedCSSProperties: NamedCSSProperties = { color: 'red', borderWidth: 2 };

export const interfaceStyle: SelectCSSProperties = namedCSSProperties;
export const customStyle: SelectCSSProperties = {
  color: 'red', '--surface-color': 'blue', WebkitTextFillColor: 'currentColor', MozUserSelect: 'none'
};
// @ts-expect-error A CSS object cannot replace the writer's complete declaration text.
export const cssTextStyle: SelectCSSProperties = { cssText: 'color:red' };
// @ts-expect-error CSSStyleDeclaration methods are not authored CSS properties.
export const methodStyle: SelectCSSProperties = { setProperty: () => undefined };
// @ts-expect-error Unknown properties must not widen the public CSS object contract.
export const unknownStyle: SelectCSSProperties = { arbitraryProperty: 'red' };

export type SelectSurfaceContracts = [
  Assert<Equal<Exclude<keyof SelectClassNames, keyof AutoCompleteClassNames>,
    'suffix' | 'item' | 'itemContent' | 'itemRemove'>>,
  Assert<Equal<SelectSemanticInfo<number, 'multiple', Option, true>['props']['value'],
    SelectLabelValue<number>[] | null | undefined>>,
  Assert<Equal<SelectSemanticInfo<number>['props']['disabled'], boolean>>,
  Assert<Equal<SelectSemanticInfo<number>['props']['size'], 'small' | 'medium' | 'large' | undefined>>,
  Assert<Equal<AutoCompleteSemanticInfo<Option>['props']['value'], string | undefined>>,
  Assert<Equal<AutoCompleteSemanticInfo<Option>['props']['popupRender'], SelectPopupRender | undefined>>,
  Assert<Equal<NonNullable<AutoCompleteProps<Option>['children']>, Snippet<[import('@woodger/antd-svelte').AutoCompleteInput]>>>
];

export const popup: SelectPopupRender = origin => [0, false, null, undefined, origin];
export const nullStyle: SelectStyle = null;
export const styledMultiple: SelectProps<number, 'multiple', Option, true> = {
  mode: 'multiple', labelInValue: true, value: [{ value: 0, label: 'Zero' }],
  options: [{ id: 0, text: 'Zero', marker: true }], fieldNames: { value: 'id', label: 'text' },
  style: { width: 240, '--surface-control': 'owner' }, prefix: ['Prefix', 0], popupRender: popup,
  classNames(info) {
    const options: readonly Option[] | undefined = info.props.options;
    const values: SelectLabelValue<number>[] | null | undefined = info.props.value;
    const disabled: boolean = info.props.disabled;
    void [options, values, disabled];
    return { root: 'typed-root', popup: 'typed-popup' };
  },
  styles: () => ({
    root: { color: undefined },
    popup: { root: { height: 120 }, listItem: { opacity: 0.5 } }
  })
};
export const autocomplete: AutoCompleteProps<Option> = {
  classNames: { root: 'complete-root', popup: 'complete-popup' },
  styles: { placeholder: { height: 20, backgroundColor: 'red' } },
  popupRender: () => [null, '', 0] satisfies SelectPopupContent,
  style: null
};
export const provider: SelectConfig = {
  class: 'provider', style: { color: 'red' }, allowClear: true,
  showSearch: { filterOption: false },
  classNames({ props }) { return { root: props.disabled ? 'disabled' : 'enabled' }; },
  styles({ props }) { return { input: { opacity: props.size === 'small' ? 0.5 : 1 } }; }
};
