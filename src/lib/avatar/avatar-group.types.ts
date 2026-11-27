import type { AvatarProps, AvatarShape, AvatarSize } from './avatar.types';
import type { PopoverProps } from '../popover.types';

export type AvatarGroupKey = string | number;
export interface AvatarGroupItem extends Omit<AvatarProps, 'nativeElement'> {
  key: AvatarGroupKey;
  label: string;
  text?: string;
}
export interface AvatarGroupMax {
  count?: number;
  style?: string;
  /**
   * Svelte Popover settings. children remains the +N button. content replaces the list and title
   * replaces the heading. destroyOnHidden defaults to true. open is controlled with onOpenChange.
   * Without open, state is internal.
   */
  popover?: Omit<PopoverProps, 'children'>;
}
/** Groups avatars with a visible limit and a Popover for the rest. */
export interface AvatarGroupProps {
  items: readonly AvatarGroupItem[];
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Local group or popup prefix. Otherwise inherits ConfigProvider. Member Avatar components resolve their own prefix. */
  prefixCls?: string;
  max?: AvatarGroupMax;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** Bindable div. Avatar config's own class and style do not apply to the group root. */
  nativeElement?: HTMLDivElement;
}
