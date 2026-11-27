import type { Snippet } from 'svelte';

export interface InputCountInfo {
  value: string;
  count: number;
  maxLength?: number;
}

export type InputCountContent =
  | string
  | number
  | boolean
  | null
  | undefined
  | Snippet<[InputCountInfo]>;
export type InputCountFormatter = (info: InputCountInfo) => InputCountContent;

/** The general configuration of the counter is Input and TextArea; by default it considers UTF-16 units code. */
export interface InputCountConfig {
  /** Soft limit with exceedance indication; 0 removes the limit. In itself, the input does not trim. */
  max?: number;
  strategy?: (value: string) => number;
  /** Takes precedence over showCount; the formatter can return snippet from InputCountInfo. */
  show?: boolean | InputCountFormatter;
  /** Converts user input when max is exceeded after completion of composition. */
  exceedFormatter?: (value: string, info: { max: number; }) => string;
}

/** Clear button settings; disabled hides the button by saving it in DOM. */
export interface InputAllowClear {
  disabled?: boolean;
  clearIcon?: string | number | false | null | Snippet;
}

export type InputShowCount = boolean | { formatter: InputCountFormatter; };
