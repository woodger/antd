// Resolves rule messages, formats string templates, and projects model metadata.
// The message list owns snippet rendering.
import type { FormValues, ValidationRule } from './validation.engine';
import type {
  FormFieldMessages, FormValidationMessage, ValidateMessages
} from './validation-messages.types';

export interface ValidationMessageContext {
  readonly name?: string;
  readonly variables?: Readonly<Record<string, string>>;
  readonly messages?: ValidateMessages;
}

/** Preserves the string API without evaluating a snippet outside component rendering. */
export function validationMessageTexts(messages: readonly FormValidationMessage[]): readonly string[] {
  if (messages.every(message => typeof message === 'string')) {
    return messages;
  }

  return messages.map(message => {
    if (typeof message === 'function') return '';
    return message !== null && typeof message === 'object' ? message.text : message;
  });
}

/** Exposes the full list only when the text projection omits rendered content. */
export function richValidationMessages(messages: readonly FormValidationMessage[]) {
  const hasContent = messages.some(message => typeof message === 'function'
    || message !== null && typeof message === 'object');
  return hasContent ? messages : undefined;
}

/** Copies message records at model boundaries while retaining the original snippet. */
export function copyValidationMessages(messages: readonly FormValidationMessage[]) {
  return Array.from(messages, message => {
    if (message === null || typeof message !== 'object') return message;
    return { text: message.text, content: message.content };
  });
}

/** Detaches field snapshots and keeps their string-only shape for ordinary messages. */
export function snapshotValidationMessages(
  errors: readonly FormValidationMessage[] = [],
  warnings: readonly FormValidationMessage[] = []
): FormFieldMessages & { errors: string[]; warnings: string[] } {
  const errorMessages = richValidationMessages(errors);
  const warningMessages = richValidationMessages(warnings);

  return {
    errors: [...validationMessageTexts(errors)],
    warnings: [...validationMessageTexts(warnings)],
    ...(errorMessages && { errorMessages: copyValidationMessages(errorMessages) }),
    ...(warningMessages && { warningMessages: copyValidationMessages(warningMessages) })
  };
}

/** Locale and ConfigProvider unite groups; Form replaces their top-level spread separately. */
export function mergeValidationMessages(
  ...layers: readonly (ValidateMessages | undefined)[]
): ValidateMessages {
  let merged: ValidateMessages = {};
  for (const layer of layers) {
    if (!layer) continue;
    const previous = merged;
    merged = { ...previous, ...layer };

    for (const key of ['date', 'types', 'string', 'number', 'array', 'pattern'] as const) {
      if (layer[key]) merged[key] = { ...previous[key], ...layer[key] };
    }
  }

  return merged;
}

// Limits fallback serialization %j. Errors of the entire template are processed by the causing code.
function serializeMessageValue(value: unknown): string {
  try {
    return JSON.stringify(value) ?? 'undefined';
  }
  catch {
    return '[Circular]';
  }
}

/** Template formatting is adapted from async-validator; MIT: vendor/LICENSE.rc-async-validator. */
export function resolveValidationMessage<Values extends FormValues>(
  rule: ValidationRule<Values>,
  context: ValidationMessageContext | undefined,
  path: string | readonly [string, string],
  fallback: string,
  args: readonly unknown[] = [context?.name]
): FormValidationMessage {
  if (rule.message !== undefined) {
    return rule.message;
  }

  try {
    let template: unknown = context?.messages;
    for (const key of typeof path === 'string' ? [path] : path) {
      template = template && typeof template === 'object' && Object.hasOwn(template, key)
        ? Reflect.get(template, key) : undefined;
    }
    if (typeof template === 'function') {
      const result = Reflect.apply(template, null, args);
      return typeof result === 'string' ? result : fallback;
    }
    if (typeof template !== 'string') {
      return fallback;
    }

    let index = 0;
    // Only the unscrewed placeholder consumes the following argument.
    return template.replace(/%[sdj%]/g, placeholder => {
      if (placeholder === '%%') {
        return '%';
      }
      if (index >= args.length) {
        return placeholder;
      }
      const value = args[index++];
      if (placeholder === '%s') {
        return String(value);
      }
      if (placeholder === '%d') {
        return String(Number(value));
      }

      return serializeMessageValue(value);
    });
  }
  catch {
    // The template error should not break validation or create source console/page errors.
    return fallback;
  }
}

/** rc-form single-pass substitution. A backslash preserves the literal ${variable}. */
export function formatValidationMessages<Values extends FormValues>(
  messages: readonly FormValidationMessage[],
  rule: ValidationRule<Values>,
  context?: ValidationMessageContext
): readonly FormValidationMessage[] {
  if (!messages.some(message => typeof message === 'string' && message.includes('${'))) {
    return messages;
  }

  const variables: Record<string, unknown> = {
    ...rule,
    name: context?.name,
    label: context?.name,
    enum: Array.isArray(rule.enum) ? rule.enum.map(value => value == null ? '' : String(value))
      .join(', ') : '',
    ...context?.variables
  };

  return messages.map(message => typeof message === 'string'
    ? message.replace(/\\?\$\{\w+\}/g, substituteVariable) : message);

  // Substitutes only the context's own variables. A backslash preserves the literal.
  function substituteVariable(placeholder: string) {
    if (placeholder.startsWith('\\')) {
      return placeholder.slice(1);
    }

    const key = placeholder.slice(2, -1);
    // Inherited constructor/toString are not template variables.
    const value = Object.hasOwn(variables, key) ? variables[key] : undefined;
    try {
      return String(value);
    }
    catch {
      return 'undefined';
    }
  }
}
