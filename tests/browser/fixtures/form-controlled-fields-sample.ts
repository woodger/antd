// Projects public model state into the fields captured from the upstream browser run.
import type { FormInstance, FormValues, NamePath } from '@woodger/antd';

/** Reads metadata without relying on any state stored on the field component. */
export function readFieldState<Values extends FormValues>(model: FormInstance<Values>, name: NamePath) {
  return {
    touched: model.isFieldTouched(name),
    validating: model.isFieldValidating(name),
    errors: model.getFieldError(name),
    warnings: model.getFieldWarning(name)
  };
}

/** Keeps an explicit undefined write visible in the JSON used for comparisons. */
export function formatFieldState(data: unknown) {
  return JSON.stringify(data, (_, value) => value === undefined ? { missing: true } : value);
}
