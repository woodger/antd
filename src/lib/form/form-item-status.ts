import { getContext, setContext } from 'svelte';
import type { FormValidateStatus } from './form-error-list.types';
import { provideFormFeedback } from './form-feedback-context';

/** Jet state of the nearest FormItem; errors and warnings are read-only. */
export interface FormItemStatus {
  /** '' inside pristine FormItem; undefined outside Item and abroad invested Form. */
  readonly status: FormValidateStatus | undefined;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

const statusKey = Symbol('ant-design-form-item-status');
const defaultStatus: Partial<FormItemStatus> = {};

export function useFormItemStatusContext(): Partial<FormItemStatus> {
  return getContext<Partial<FormItemStatus> | undefined>(statusKey) ?? defaultStatus;
}

export function provideFormItemStatus(status: Partial<FormItemStatus>) {
  setContext(statusKey, status);
}

/** Isolates the design of the external FormItem and preserves its errors and warnings. */
export function isolateFormItemStyle() {
  const parent = useFormItemStatusContext();
  provideFormItemStatus(Object.create(parent, { status: { value: undefined } }));
  provideFormFeedback({});
}

/**
 * Analogue Form.Item.useStatus; caused by the initialization of the component. Read the getter
 * field of the returned object: destructuring fixes snapshot.
 */
export function useFormItemStatus(): FormItemStatus {
  const context = useFormItemStatusContext();
  const errors: readonly string[] = [];
  const warnings: readonly string[] = [];

  return {
    get status() { return context.status; },
    get errors() { return context.errors ?? errors; },
    get warnings() { return context.warnings ?? warnings; }
  };
}
