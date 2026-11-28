import type { Snippet } from 'svelte';

/** Rule content can carry explicit text for consumers that read only the string metadata. */
export type FormValidationMessage = string | Snippet | {
  readonly text: string;
  readonly content: Snippet;
};

/** When present, a message list includes the strings and snippets in their original order. */
export interface FormFieldMessages {
  errorMessages?: readonly FormValidationMessage[];
  warningMessages?: readonly FormValidationMessage[];
}

/** Message pattern; function is called when the corresponding Sext error is errors. */
export type ValidateMessage = string | (() => string);

/**
 * Partial Form templates: Missing keys save native Russian messages. The strings support the source
 * printf and the subsequent ${variables} substation.
 */
export interface ValidateMessages {
  default?: ValidateMessage;
  required?: ValidateMessage;
  enum?: ValidateMessage;
  whitespace?: ValidateMessage;
  date?: {
    format?: ValidateMessage;
    parse?: ValidateMessage;
    invalid?: ValidateMessage;
  };
  types?: {
    string?: ValidateMessage;
    method?: ValidateMessage;
    array?: ValidateMessage;
    object?: ValidateMessage;
    number?: ValidateMessage;
    date?: ValidateMessage;
    boolean?: ValidateMessage;
    integer?: ValidateMessage;
    float?: ValidateMessage;
    regexp?: ValidateMessage;
    email?: ValidateMessage;
    tel?: ValidateMessage;
    url?: ValidateMessage;
    hex?: ValidateMessage;
  };
  string?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  number?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  array?: {
    len?: ValidateMessage;
    min?: ValidateMessage;
    max?: ValidateMessage;
    range?: ValidateMessage;
  };
  pattern?: { mismatch?: ValidateMessage };
}
