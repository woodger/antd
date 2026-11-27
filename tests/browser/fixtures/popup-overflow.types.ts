import type { ConfigProviderProps, PopupOverflow } from '@woodger/antd';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;
type PopupOverflowProps = Pick<ConfigProviderProps, 'popupOverflow'>;

export type PopupOverflowTypeAssertions = [
  Assert<Equal<PopupOverflow, 'viewport' | 'scroll'>>,
  Assert<Equal<ConfigProviderProps['popupOverflow'], PopupOverflow | undefined>>
];

export const popupOverflowProviders: readonly PopupOverflowProps[] = [
  {}, { popupOverflow: undefined }, { popupOverflow: 'viewport' }, { popupOverflow: 'scroll' }
];

export function popupOverflowInvalidValues() {
  // @ts-expect-error Internal alignment regions are not ConfigProvider values.
  const visible: PopupOverflowProps = { popupOverflow: 'visible' };
  // @ts-expect-error Internal alignment priority is not a global overflow mode.
  const visibleFirst: PopupOverflowProps = { popupOverflow: 'visibleFirst' };
  // @ts-expect-error The public global mode is not a boolean flag.
  const flag: PopupOverflowProps = { popupOverflow: false };
  // @ts-expect-error Explicit null is not part of the public type.
  const empty: PopupOverflowProps = { popupOverflow: null };
  // @ts-expect-error The public mode is not an alignment configuration object.
  const alignment: PopupOverflowProps = { popupOverflow: { htmlRegion: 'scroll' } };
  return { visible, visibleFirst, flag, empty, alignment };
}
