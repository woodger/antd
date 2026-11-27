import type {
  AutoCompleteProps, CascaderProps, ConfigProviderProps, SelectProps, TreeSelectProps
} from '@woodger/antd';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
type Width = boolean | number | undefined;
type WidthProps = Pick<ConfigProviderProps, 'popupMatchSelectWidth'>;

export type PopupWidthTypeAssertions = [
  Assert<Equal<ConfigProviderProps['popupMatchSelectWidth'], Width>>,
  Assert<Equal<SelectProps['popupMatchSelectWidth'], Width>>,
  Assert<Equal<AutoCompleteProps['popupMatchSelectWidth'], Width>>,
  Assert<Equal<TreeSelectProps['popupMatchSelectWidth'], Width>>,
  Assert<Equal<CascaderProps['popupMatchSelectWidth'], Width>>
];

export const popupWidthProps: readonly WidthProps[] = [
  {}, { popupMatchSelectWidth: undefined }, { popupMatchSelectWidth: true },
  { popupMatchSelectWidth: false }, { popupMatchSelectWidth: 0 },
  { popupMatchSelectWidth: -0 }, { popupMatchSelectWidth: 360 },
  { popupMatchSelectWidth: -1 }, { popupMatchSelectWidth: Number.NaN },
  { popupMatchSelectWidth: Number.POSITIVE_INFINITY }
];

export function popupWidthInvalidValues() {
  // @ts-expect-error CSS lengths are not the current public width API.
  const css: WidthProps = { popupMatchSelectWidth: '360px' };
  // @ts-expect-error Explicit null is not a public provider value.
  const empty: WidthProps = { popupMatchSelectWidth: null };
  // @ts-expect-error Width configuration is a scalar, not an options object.
  const config: WidthProps = { popupMatchSelectWidth: { width: 360 } };
  // @ts-expect-error The local Select width has the same scalar contract.
  const select: Pick<SelectProps, 'popupMatchSelectWidth'> = { popupMatchSelectWidth: 'auto' };
  return { css, empty, config, select };
}
