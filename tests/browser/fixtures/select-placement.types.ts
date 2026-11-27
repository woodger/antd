import type { SelectProps } from '@woodger/antd';

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;
type Assert<Value extends true> = Value;

export type SelectPlacementAssertion = Assert<Equal<SelectProps['placement'],
  'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight' | undefined>>;

export const selectPlacementProps: readonly SelectProps[] = [
  {}, { placement: undefined }, { placement: 'bottomLeft' }, { placement: 'bottomRight' },
  { placement: 'topLeft' }, { placement: 'topRight' }
];

export function selectPlacementInvalidProps() {
  // @ts-expect-error Select exposes four corners, not centered popup placements.
  const centered: SelectProps = { placement: 'top' };
  // @ts-expect-error Logical names are not part of the Source public Select declaration.
  const logical: SelectProps = { placement: 'bottomStart' };
  // @ts-expect-error Explicit null is not part of the public placement type.
  const empty: SelectProps = { placement: null };
  return { centered, logical, empty };
}
