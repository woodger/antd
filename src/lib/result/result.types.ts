import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type ResultStatus =
  'success'
  | 'error'
  | 'info'
  | 'warning'
  | 403
  | 404
  | 500
  | '403'
  | '404'
  | '500';
export type ResultContent = string | number | boolean | null | Snippet
  | readonly (ResultContent | undefined)[];
export interface ResultSemanticSlots {
  root?: string;
  title?: string;
  subTitle?: string;
  body?: string;
  extra?: string;
  icon?: string;
}
export interface ResultSemanticInfo {
  props: ResultProps & { status: ResultStatus; };
}
export type ResultSemantic = ResultSemanticSlots
  | ((info: ResultSemanticInfo) => ResultSemanticSlots | undefined);
export interface ResultRef {
  readonly nativeElement: HTMLDivElement;
}
/** Design settings; local semantic styles and style priority. */
export type ResultConfig = Pick<ResultProps, 'class' | 'style' | 'classNames' | 'styles'>;

/** Result page with status, illustration, title/subTitle and actions. */
export interface ResultProps {
  /** @defaultValue 'info' */
  status?: ResultStatus;
  title?: ResultContent;
  subTitle?: ResultContent;
  /** Null/false hides the usual icon; exception illustrations take precedence. */
  icon?: ResultContent;
  extra?: ResultContent;
  children?: ResultContent;
  /** @defaultValue 2 */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  id?: string;
  /** A clear role is more priority than the native group created by aria-label/labelledby. */
  role?: HTMLAttributes<HTMLDivElement>['role'];
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string;
  style?: string;
  /** Local CSS prefix. Omission and an empty string inherit ConfigProvider. */
  prefixCls?: string;
  rootClassName?: string;
  /** Object/function slots; callbacks receive input props with authorized status. */
  classNames?: ResultSemantic;
  styles?: ResultSemantic;
  /** Assigned after mount and cleaned at unmount. */
  nativeElement?: HTMLDivElement;
  ref?: ResultRef;
  [attribute: `aria-${string}`]: unknown;
  [attribute: `data-${string}`]: unknown;
}
