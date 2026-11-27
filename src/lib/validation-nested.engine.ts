// Bypasses the fields of nested object and array rules. Comparison of the rule and the reference
// value in the chain of ancestors interrupts cycles.
import type { FormValues, ValidationRule } from './validation.engine';
import {
  formatValidationMessages, resolveValidationMessage, type ValidationMessageContext
} from './validation-message.engine';

export interface ValidationMessages {
  errors: string[];
  warnings: string[];
}

export interface ValidationAncestor {
  readonly rule: object;
  readonly value: unknown;
  readonly parent?: ValidationAncestor;
}

type ValidateChildren<Values extends FormValues> = (
  value: unknown,
  rules: readonly ValidationRule<Values>[],
  ancestor: ValidationAncestor,
  key: string
) => Promise<ValidationMessages>;

// warningOnly also translates into warnings the errors of child rules.
export function collectValidationMessages<Values extends FormValues>(
  rule: ValidationRule<Values>,
  own: readonly string[],
  children: readonly ValidationMessages[]
): ValidationMessages {
  if (rule.warningOnly) {
    return { errors: [], warnings: [...own, ...children.flatMap(child =>
      [...child.errors, ...child.warnings])] };
  }

  return {
    errors: [...own, ...children.flatMap(child => child.errors)],
    warnings: children.flatMap(child => child.warnings)
  };
}

// Returns the container's own field, including an empty string and a numerical zero.
function ownValue(value: unknown, key: string): unknown {
  if (value == null) {
    return;
  }
  const source = Object(value);
  return Object.hasOwn(source, key) ? source[key] : undefined;
}

// Starts explicit fields before defaultField array. The order of messages of explicit fields is
// determined by the completion of checks.
export async function validateNestedRule<Values extends FormValues>(
  value: unknown,
  original: unknown,
  rule: ValidationRule<Values>,
  own: readonly string[],
  validate: ValidateChildren<Values>,
  ancestor?: ValidationAncestor,
  identity: object = rule,
  context?: ValidationMessageContext
): Promise<ValidationMessages> {
  const nested = (rule.type === 'object' || rule.type === 'array')
    && (rule.fields || rule.defaultField) && (rule.required || value);
  if (!nested) {
    return collectValidationMessages(rule, own, []);
  }

  if (rule.required && !value && (rule.fields || rule.type === 'object' && rule.defaultField)) {
    return collectValidationMessages(rule, own.length ? own
      : formatValidationMessages([
        resolveValidationMessage(rule, context, 'required', 'Заполните это поле.')
      ], rule, context), []);
  }

  for (let parent = ancestor; parent; parent = parent.parent) {
    if (parent.rule === identity && Object.is(parent.value, original)) {
      return collectValidationMessages(rule, formatValidationMessages(
        [rule.message ?? 'Вложенные правила образуют цикл.'], rule, context
      ), []);
    }
  }
  const current = { rule: identity, value: original, parent: ancestor };
  const fields = new Map<string, ValidationRule<Values> | readonly ValidationRule<Values>[]>();
  if (rule.type === 'object' && rule.defaultField && value != null) {
    for (const key of Object.keys(Object(value))) fields.set(key, rule.defaultField);
  }
  for (const [key, child] of Object.entries(rule.fields ?? {})) fields.set(key, child);

  // Schema.fields source reports the results at the end of the child.
  const children: ValidationMessages[] = [];
  const checks = [...fields].map(validateField);
  await Promise.all(checks);

  if (rule.type === 'array' && rule.defaultField && Array.isArray(value)
    && !own.length && !children.some(child => child.errors.length)) {
    // Rc-form defaultField bypasses all elements after fields; sparse holes are not data.
    const keys = Object.keys(value).filter(key => /^(?:0|[1-9]\d*)$/.test(key)
      && Number(key) < value.length);
    const checks = keys.map(key => {
      const item = ownValue(value, key);
      // Rule 2: The branch checks defaultField. The value is re-read for each element.
      return validate(item, [rule.defaultField!], current, key);
    });
    const defaults = await Promise.all(checks);
    children.push(...defaults);
  }

  return collectValidationMessages(rule, own, children);

  // Writes the result of the field upon completion, maintaining the order of readiness of messages.
  async function validateField(
    [key, child]: [string, ValidationRule<Values> | readonly ValidationRule<Values>[]]
  ) {
    const childValue = ownValue(value, key);
    const childRules = Array.isArray(child) ? child : [child as ValidationRule<Values>];
    const result = await validate(childValue, childRules, current, key);
    children.push(result);
  }
}
