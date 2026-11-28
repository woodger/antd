import type { FormInstance, FormModel, FormProps, FormProviderProps } from '@woodger/antd';

type Values = { profile: { title: string }; rows: number[]; };

export function editFields(form: FormModel<Values>) {
  const instance: FormInstance<Values> = form;
  instance.setFieldValue(['profile', 'title'], 'Before');
  form.changeFieldValue(['profile', 'title'], 'After');
  form.changeFieldValue(['rows', 0], 0);

  // @ts-expect-error A numeric field cannot take a string edit.
  form.changeFieldValue(['rows', 0], 'invalid');
}

export const callbacks: Pick<FormProps<Values>, 'onValuesChange' | 'onFieldsChange'> = {
  onValuesChange(changed, all) {
    const editedTitle: string | undefined = changed.profile?.title;
    const row: number | undefined = all.rows?.[0];
    return [editedTitle, row];
  },
  onFieldsChange(changed, all) {
    const snapshot = all.find((field) => field === changed[0]);
    return snapshot?.name;
  }
};

export const provider: FormProviderProps = {
  onFormFinish(name, { values, forms }) {
    if (name !== undefined) {
      forms[name]?.setFieldValue('title', values.title);
    }
  }
};
