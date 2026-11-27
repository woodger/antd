import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';
import type { ButtonProps, ButtonSlots } from '../button/button.types';
import type {
  InputChangeEvent,
  InputContent,
  InputProps,
  InputSemanticSlots,
  InputVariant
} from './input.types';

/**
 * Replacement React cloneElement for enterButton snippet. Apply the result to Button or native
 * button: save your own callbacks, disabled/loading and the order of handlers.
 */
export interface InputSearchButtonContext {
  /** Adds search class/size/loading; own callbacks are called first. */
  getButtonProps: (props?: ButtonProps) => ButtonProps;
  /** Saves native class/type; loading additionally blocks the native button. */
  getNativeProps: (props?: HTMLButtonAttributes) => HTMLButtonAttributes;
}

export type InputSearchSemanticSlots = InputSemanticSlots & { button?: ButtonSlots | string; };

/**
 * The callback receives the original props with the default enterButton and Search variant. As in
 * upstream, ConfigProvider does not override disabled here. A string in button is shorthand for
 * button.root.
 */
export type InputSearchSemantic =
  | InputSearchSemanticSlots
  | ((info: { props: InputSearchProps; }) => InputSearchSemanticSlots | undefined);

/** Settings ConfigProvider.inputSearch; the nested object replaces the parent whole. */
export interface InputSearchConfig {
  searchIcon?: InputContent;
  variant?: InputVariant;
  class?: string;
  style?: string;
  classNames?: InputSearchSemantic;
  styles?: InputSearchSemantic;
}

/**
 * Svelte-export Input.Search from bind:value and events Input. Class/style/hidden and data-* refer
 * to Compact root; inputElement/nativeElement and methods bind:this belong to Input.
 */
export interface InputSearchProps extends Omit<InputProps, 'classNames' | 'styles'> {
  /** CSS prefix root Search and its button states; empty/undefined inherit ConfigProvider. */
  prefixCls?: string;
  /** Independent CSS prefix nested Input; by default total prefix input. */
  inputPrefixCls?: string;
  /**
   * false by default: ordinary icon button; true — primary icon button; scalar — the text button
   * primary. Snippet replaces the whole button and receives context props.
   */
  enterButton?: string | number | boolean | null | Snippet<[InputSearchButtonContext]>;
  /**
   * The local value overrides the context; null/false hide the icon. It is used only for boolean
   * enterButton.
   */
  searchIcon?: InputContent;
  /** Blocks the button and search by Enter; the clearing stays available, as in upstream. */
  loading?: boolean;
  /** Clearing causes source=clear before onChange; Enter/button cause source=input. */
  onSearch?: (
    value: string,
    event?: InputChangeEvent | MouseEvent | KeyboardEvent,
    info?: { source?: 'input' | 'clear'; }
  ) => void;
  /** Blocked at loading/IME and is called before onSearch for Enter. */
  onPressEnter?: InputProps['onPressEnter'];
  classNames?: InputSearchSemantic;
  styles?: InputSearchSemantic;
}
