// Complies with Form rules and collects errors separately from warnings. Transform applies only
// within the rule. Completion depends on validateFirst.
import {
  matchesValidationType, normalizeValidationType, type ValidationRuleType
} from './validation-type.engine';
import { matchesValidationPattern } from './validation-format.engine';
import type { FormInstance } from './form.model.svelte';
import {
  collectValidationMessages, validateNestedRule,
  type ValidationMessages, type ValidationAncestor
} from './validation-nested.engine';
import {
  formatValidationMessages, resolveValidationMessage, type ValidationMessageContext
} from './validation-message.engine';
export type { ValidationRuleType } from './validation-type.engine';

/** The value of the field can be a scalar, an attached container or an instance of a class. */
export type FormValue = unknown;
export type FormValues = Record<string, FormValue>;
export type FieldName<Values> = Extract<keyof Values, string>;

export interface ValidationRule<Values extends FormValues = FormValues> {
  /** The explicit type includes the original rules of empty values and the choice of the sparks. */
  type?: ValidationRuleType;
  required?: boolean;
  /** By default false; the message falls into the warnings and does not block submit. */
  warningOnly?: boolean;
  min?: number;
  max?: number;
  /** The exact number/length; the date compares timestamp. Priority over min/max. */
  len?: number;
  /** In implicit/string, the rule rejects a non-empty string only from whitespace. */
  whitespace?: boolean;
  pattern?: RegExp | string;
  /** Strict comparison without coercion; used in type='enum'. */
  enum?: readonly FormValue[];
  /** Rules for named child values when type is 'object' or 'array'. */
  fields?: Readonly<Record<string, ValidationRule<Values> | readonly ValidationRule<Values>[]>>;
  /** The rule of array elements; for object is applied to keys without its own fields rule. */
  defaultField?: ValidationRule<Values>;
  message?: string;
  /** Synchronously converts the value only for this rule, without recording the result in Form. */
  transform?: (value: FormValue) => FormValue;
  /** An explicit type replaces built-in validation while retaining the native value/values signature. */
  validator?: (
    value: FormValue,
    values: Readonly<Values>
  ) => string | void | Promise<string | void>;
}

/** A clean customization factory receives the current form model; is called before the rules are checked. */
export type ValidationRuleFactory<Values extends FormValues = FormValues> =
  (form: FormInstance<Values>) => ValidationRule<Values>;

export type FormRule<Values extends FormValues = FormValues> =
  ValidationRule<Values> | ValidationRuleFactory<Values>;

export type FormRules<Values extends FormValues> = Partial<
  Record<FieldName<Values>, readonly FormRule<Values>[]>
>;

// Reveals factories relative to the current Form, keeping an array without factories.
export function resolveValidationRules<Values extends FormValues>(
  rules: readonly FormRule<Values>[],
  form: FormInstance<Values>
): readonly ValidationRule<Values>[] {
  // Object-only arrays retain their existing identity and capture semantics.
  if (rules.every(rule => typeof rule !== 'function')) {
    return rules;
  }

  return rules.map(rule => typeof rule === 'function' ? rule(form) : rule);
}

export type FieldErrors<Values extends FormValues> = Partial<Record<FieldName<Values>, string[]>>;

/** Field errors retain the original path segments, including the difference between strings and numbers. */
export interface FieldError {
  name: (string | number)[];
  errors: string[];
  warnings: string[];
}

// Returns blocking messages for the previous flat API check.
export async function validateValue<Values extends FormValues>(
  value: FormValue,
  values: Readonly<Values>,
  rules: readonly ValidationRule<Values>[]
): Promise<string[]> {
  const result = await validateFieldValue(value, values, rules);
  return result.errors;
}

// Begins to check the field without the state of recursion on the nested values.
export async function validateFieldValue<Values extends FormValues>(
  value: FormValue,
  values: Readonly<Values>,
  rules: readonly ValidationRule<Values>[],
  validateFirst: boolean | 'parallel' = false,
  context?: ValidationMessageContext
): Promise<{ errors: string[]; warnings: string[] }> {
  return validateRules(value, values, rules, validateFirst, undefined, context);
}

// Starts blocking rules before warningOnly. The usual mode preserves the order of results.
async function validateRules<Values extends FormValues>(
  value: FormValue,
  values: Readonly<Values>,
  rules: readonly ValidationRule<Values>[],
  validateFirst: boolean | 'parallel' = false,
  ancestor?: ValidationAncestor,
  context?: ValidationMessageContext
): Promise<ValidationMessages> {
  const ordered = [...rules].sort((first, second) =>
    Number(Boolean(first.warningOnly)) - Number(Boolean(second.warningOnly))
  );

  if (validateFirst === true) {
    let warnings: string[] | undefined;
    for (const rule of ordered) {
      if (rule.warningOnly && warnings) {
        return { errors: [], warnings };
      }
      const messages = await validateRuleValue(value, values, rule, ancestor, context);
      if (messages.errors.length) {
        return { errors: messages.errors, warnings: [] };
      }
      if (messages.warnings.length) warnings ??= messages.warnings;
    }

    return { errors: [], warnings: warnings ?? [] };
  }

  const checks = ordered.map((rule) => validateRuleValue(value, values, rule, ancestor, context));
  if (validateFirst === 'parallel') {
    return checks.length ? firstParallelResult(checks, ordered) : { errors: [], warnings: [] };
  }

  const results = await Promise.all(checks);
  const errors: string[] = [];
  const warnings: string[] = [];
  results.forEach((messages) => {
    errors.push(...messages.errors);
    warnings.push(...messages.warnings);
  });

  return { errors, warnings };
}

// He's making his first mistake. The warning can complete the result when all blocking rules have
// already been checked.
function firstParallelResult(
  checks: readonly Promise<ValidationMessages>[],
  ordered: readonly { warningOnly?: boolean }[]
): Promise<ValidationMessages> {
  return new Promise((resolve, reject) => {
    let remaining = checks.length;
    let blocking = ordered.filter((rule) => !rule.warningOnly).length;
    let warning: string[] | undefined;

    checks.forEach((check, index) => {
      check.then((messages) => {
        remaining--;
        if (!ordered[index].warningOnly) {
          blocking--;
          if (messages.errors.length) {
            resolve({ errors: messages.errors, warnings: [] });
            return;
          }
        }
        if (messages.warnings.length) warning ??= messages.warnings;

        if (!blocking && warning) {
          resolve({ errors: [], warnings: warning });
        }
        else if (!remaining) {
          resolve({ errors: [], warnings: [] });
        }
      }, reject);
    });
  });
}

// Applies transform to scalar and nested rules, maintaining the original value.
async function validateRuleValue<Values extends FormValues>(
  originalValue: FormValue,
  values: Readonly<Values>,
  configuration: ValidationRule<Values>,
  ancestor?: ValidationAncestor,
  context?: ValidationMessageContext
): Promise<ValidationMessages> {
  const copyConfiguration = ancestor || (configuration.type === 'object' || configuration.type === 'array')
    && (configuration.fields || configuration.defaultField);
  const rule = copyConfiguration ? { ...configuration } : configuration;
  let transformedValue = originalValue;
  if (rule.transform) {
    try {
      transformedValue = rule.transform(originalValue);
    }
    catch (error) {
      // Excluding transform is taken into account in the inspection, including warningOnly.
      const message = rule.message ?? (error instanceof Error ? error.message : 'Проверьте значение.');
      const formatted = formatValidationMessages([message], rule, context);
      return collectValidationMessages(rule, formatted, []);
    }
  }

  const primitiveMessages = await validatePrimitiveRule(transformedValue, values, rule, context);
  const messages = formatValidationMessages(primitiveMessages, rule, context);

  return validateNestedRule(
    transformedValue,
    originalValue,
    rule,
    messages,
    (child, rules, parent, key) => validateRules(
      child,
      values,
      rules,
      false,
      parent,
      { ...context, name: context?.name ? `${context.name}.${key}` : key }
    ),
    ancestor,
    configuration,
    context
  );
}

// Verifies the type, obligation and limitations. An explicit type with a validator delegates a check to it.
async function validatePrimitiveRule<Values extends FormValues>(
  transformedValue: FormValue,
  values: Readonly<Values>,
  rule: ValidationRule<Values>,
  context?: ValidationMessageContext
): Promise<string[]> {
  const messages: string[] = [];
  const type = rule.type;
  if (type && rule.validator) {
    return validateCustomRule(transformedValue, values, rule, context);
  }

  // Sets the path of the field and the arguments of a particular limitation into a localized message.
  const message = (
    path: string | readonly [string, string],
    fallback: string,
    ...args: unknown[]
  ) => resolveValidationMessage(rule, context, path, fallback, [context?.name, ...args]);

  const value = normalizeValidationType(transformedValue, type);
  const array = Array.isArray(value);
  const missing = value === null || value === undefined;
  const empty = type ? missing
    || ['string', 'date', 'email', 'url', 'hex', 'tel', 'pattern'].includes(type) && value === ''
    : missing || typeof value === 'string' && !value.trim() || array && value.length === 0;

  if (rule.required && (empty || type === 'array' && array && value.length === 0)) {
    messages.push(message('required', 'Заполните это поле.'));
    return messages;
  }

  if (!type && rule.whitespace === true && typeof value === 'string' && value !== '' && !value.trim()) {
    return [message('whitespace', 'Поле не может состоять только из пробелов.')];
  }

  const exactLength = typeof rule.len === 'number';
  if (empty && !rule.validator && !(exactLength
    && (array || typeof value === 'string' && value.length > 0))) {
    return messages;
  }

  if (type && !matchesValidationType(value, type)) {
    return [message(['types', type], `Проверьте тип значения: ${type}.`, type)];
  }
  const choices = Array.isArray(rule.enum) ? rule.enum : [];
  if (type === 'enum' && choices.indexOf(value) === -1) {
    if (rule.message !== undefined) {
      return [rule.message];
    }

    return [message(
      'enum',
      choices.length ? `Значение должно быть одним из: ${choices.map(String).join(', ')}.`
        : 'Недопустимое значение.',
      choices.map(value => value == null ? '' : String(value)).join(', ')
    )];
  }
  if (type && ['boolean', 'object', 'regexp', 'method', 'any',
    'enum', 'email', 'url', 'hex', 'tel'].includes(type)) {
    return [];
  }

  const length = type === 'pattern' ? undefined : array
    ? value.length
    : typeof value === 'string'
      ? [...value].length
      : typeof value === 'number' ? value
        : type === 'date' && value instanceof Date ? value.getTime() : undefined;
  const rangeType = array ? 'array' : typeof value === 'string' ? 'string' : 'number';

  if (length !== undefined && exactLength && length !== rule.len) {
    return [message(
      [rangeType, 'len'],
      `${array ? 'Точное количество элементов'
        : typeof value === 'string' ? 'Точная длина' : 'Точное значение'}: ${rule.len}.`,
      rule.len
    )];
  }

  if (!exactLength && length !== undefined && rule.min !== undefined && length < rule.min) {
    messages.push(
      message(
        [rangeType, rule.max !== undefined ? 'range' : 'min'],
        `${array ? 'Минимальное количество' : 'Минимальное значение'}: ${rule.min}.`,
        ...(rule.max !== undefined ? [rule.min, rule.max] : [rule.min])
      )
    );
    return messages;
  }

  if (!exactLength && length !== undefined && rule.max !== undefined && length > rule.max) {
    messages.push(
      message(
        [rangeType, rule.min !== undefined ? 'range' : 'max'],
        `${array ? 'Максимальное количество' : 'Максимальное значение'}: ${rule.max}.`,
        ...(rule.min !== undefined ? [rule.min, rule.max] : [rule.max])
      )
    );
    return messages;
  }

  if ((!type || type === 'string' || type === 'pattern') && !empty
    && (!array || type === 'pattern')
    && rule.pattern
    && !matchesValidationPattern(value, rule.pattern, !type || type === 'string')) {
    messages.push(message(
      ['pattern', 'mismatch'],
      'Проверьте формат значения.',
      value,
      rule.pattern
    ));
    return messages;
  }

  if (type === 'string' && rule.whitespace === true && value !== ''
    && typeof value === 'string' && !value.trim()) {
    return [message('whitespace', 'Поле не может состоять только из пробелов.')];
  }

  return validateCustomRule(value, values, rule, context);
}

// Accepts validator text or normalizes its exclusion into the field message.
async function validateCustomRule<Values extends FormValues>(
  value: FormValue,
  values: Readonly<Values>,
  rule: ValidationRule<Values>,
  context?: ValidationMessageContext
): Promise<string[]> {
  const messages: string[] = [];
  if (rule.validator) {
    try {
      const message = await rule.validator(value, values);

      if (message) {
        messages.push(message);
      }
    }
    catch (error) {
      messages.push(rule.message
        ?? (error instanceof Error
          ? error.message
          : resolveValidationMessage(rule, context, 'default', 'Проверьте значение.')));
    }
  }

  return messages;
}
