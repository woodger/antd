// Collect messages FormItem and its noStyle-descendant. Entries with the same full path are taken
// into account once.
import { formNamePath, type NamePath } from './form-store.engine';
import type { FormValidationMessage } from './validation-messages.types';

export interface FormItemMessages {
  readonly name: NamePath;
  readonly errors: readonly FormValidationMessage[];
  readonly warnings: readonly FormValidationMessage[];
}

// Saves your own messages at the beginning and adds messages of daughter fields.
export function mergeFormItemMessages(
  errors: readonly FormValidationMessage[],
  warnings: readonly FormValidationMessage[],
  fields: readonly FormItemMessages[]
) {
  const unique = new Map<string | symbol, FormItemMessages>();
  for (const field of fields) {
    const path = formNamePath(field.name);
    // Typed segments exclude conflicts of 0/'0' and dividers within a literal name.
    const key = path.some(part => typeof part === 'number' && Number.isNaN(part))
      ? Symbol() : JSON.stringify(path.map(part => [typeof part, String(part)]));
    unique.set(key, field);
  }

  return {
    errors: [...errors, ...[...unique.values()].flatMap(field => field.errors)],
    warnings: [...warnings, ...[...unique.values()].flatMap(field => field.warnings)]
  };
}
