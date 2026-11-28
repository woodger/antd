import type { FormInstance, FormProps } from '@woodger/antd';
import type { Snippet } from 'svelte';

type Values = {
  profile: { name: string; active: boolean };
  rows: { text: string }[];
};

export function checkFormDefaults(children: Snippet, model: FormInstance<Values>) {
  const automatic: FormProps<Values> = {
    children,
    initialValues: { profile: { active: false } }
  };
  const supplied: FormProps<Values> = {
    children, form: model,
    initialValues: { rows: [{ text: 'row' }] }
  };
  const invalid: FormProps<Values> = {
    children, form: model,
    // @ts-expect-error Initial values retain the model's nested field types.
    initialValues: { profile: { active: 'disabled' } }
  };

  return { automatic, supplied, invalid };
}
