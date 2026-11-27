import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
import type { ComponentSize } from '../types';
import type { InputVariant } from './input.types';

export type InputOTPSemanticSlots = Partial<Record<'root' | 'input' | 'separator', string>>;
/** Callback receives the original Props with default length and authorized variant. */
export type InputOTPSemantic =
  | InputOTPSemanticSlots
  | ((info: { props: InputOTPProps; }) => InputOTPSemanticSlots | undefined);

export type InputOTPSeparatorContent = string | number | boolean | null | Snippet<[number]>;

/**
 * Settings ConfigProvider.otp; local Props take precedence, nested config is replaced entirely.
 */
export interface InputOTPConfig {
  variant?: InputVariant;
  class?: string;
  style?: string;
  classNames?: InputOTPSemantic;
  styles?: InputOTPSemantic;
}

/**
 * Svelte-export Input.OTP. Each cell stores one UTF-16 code unit; normal input accepts any text.
 * Native attributes refer to div role=group, except for explicit input Props.
 */
export interface InputOTPProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> {
  /** CSS prefix groups, cells, masks and separator; empty/undefined inherited ConfigProvider. */
  prefixCls?: string;
  /** Number of cells; by default 6. */
  length?: number;
  /**
   * Synchronizes the cells when modifying the prop, without formatter. As in the upstream, the
   * unchanged value does not deflect local input; bind:value is not provided. At SSR used
   * defaultValue, value is applied after mount.
   */
  value?: string;
  /** Initial value; formatter is applied once, subsequent changes are ignored. */
  defaultValue?: string;
  /** Applied to the whole row with spaces instead of empty cells to the restriction of length. */
  formatter?: (value: string) => string;
  /** Is called at each input before onChange; the array retains empty intermediate cells. */
  onInput?: (cells: string[]) => void;
  /**
   * Only a fully filled changed code; clearing and incomplete input do not cause a callback.
   */
  onChange?: (value: string) => void;
  /** Scalar or factory(index); for rich content return Snippet through () = > snippet. */
  separator?: string | number | boolean | null
    | ((index: number) => InputOTPSeparatorContent | undefined);
  /** true shows •, the line sets its own mask. The initial value is maintained. */
  mask?: boolean | string;
  /** Has priority over type=password when using; without mask by default text. */
  type?: HTMLInputAttributes['type'];
  autoComplete?: HTMLInputAttributes['autocomplete'];
  inputMode?: HTMLInputAttributes['inputmode'];
  /** Focuses only the first cell. */
  autoFocus?: boolean;
  /** By default, size ConfigProvider; Compact continues to operate on internal Input. */
  size?: ComponentSize | 'medium';
  disabled?: boolean;
  status?: 'error' | 'warning' | '';
  /** Priority: local variant, Form, otp, input, global variant, */
  variant?: InputVariant;
  /** Is called for cells, including a focus redirected to the first empty cell. */
  onFocus?: HTMLInputAttributes['onfocus'];
  onBlur?: HTMLInputAttributes['onblur'];
  class?: string;
  rootClassName?: string;
  classNames?: InputOTPSemantic;
  styles?: InputOTPSemantic;
  /** bind:nativeElement returns div groups; bind:this provides focus() and blur(). */
  nativeElement?: HTMLDivElement;
}
