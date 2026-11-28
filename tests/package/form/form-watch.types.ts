import {
  useFormInstance, useFormWatch,
  type FormInstance, type FormValueProjection, type FormWatchPath, type FormWatchValue
} from '@woodger/antd';

type Values = {
  title: string;
  profile: { active: boolean; name: string };
  rows: { label: string }[];
};

export function checkWatchTypes(form: FormInstance<Values>) {
  const title: FormWatchValue<string | undefined> = useFormWatch('title', form);
  const active: FormWatchValue<boolean | undefined> = useFormWatch(['profile', 'active'], form);
  const path: FormWatchPath<readonly ['rows', 0, 'label']> = { path: ['rows', 0, 'label'] };
  const label: FormWatchValue<string | undefined> = useFormWatch(path, { form, preserve: true });
  const whole: FormValueProjection<Values> | undefined = useFormWatch(undefined, form).value;
  const owner: FormInstance<Values> | undefined = useFormInstance<Values>().current;
  const count: number = useFormWatch((values) => values.rows?.length ?? 0, form).value;

  // @ts-expect-error A watched numeric path cannot be read as a required boolean.
  const invalid: boolean = useFormWatch(['rows', 0, 'label'], form).value;

  return { title, active, label, whole, owner, count, invalid };
}
