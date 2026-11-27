import type { RenderEmptyContent } from './types';

/** Visual field/help status; '' disables metadata FormItem automatic status. */
export type FormValidateStatus = 'success' | 'warning' | 'error' | 'validating' | '';

/** Messages FormList; strings/numbers and Svelte snippets replace ReactNode. */
export interface FormErrorListProps {
  /** Specifies the container id `${fieldId}_help`; an empty string doesn't create an id. */
  fieldId?: string;
  /** Any value other than null/undefined replaces errors and warnings including false/0/''. */
  help?: RenderEmptyContent;
  /** There is no color class without a help class; errors/warnings set their status themselves. */
  helpStatus?: FormValidateStatus;
  errors?: readonly RenderEmptyContent[];
  warnings?: readonly RenderEmptyContent[];
  class?: string;
  /** After the appearance/hidden; is not called for the original blank list and after unmount. */
  onVisibleChanged?: (visible: boolean) => void;
}
