import type { FormFilterFunc, FormInstance } from '@woodger/antd';
import type { Dayjs } from 'dayjs';
import { expectTypeOf } from 'vitest';

type Values = {
  email: string;
  rows: readonly { id: number; label: string }[];
  range: readonly [Dayjs, Dayjs];
};

export function checkFormSelection(form: FormInstance<Values>, filter?: FormFilterFunc) {
  expectTypeOf(form.getFieldsValue(true)).toEqualTypeOf<Values>();
  expectTypeOf(form.getFieldsValue(true, undefined)).toEqualTypeOf<Values>();
  expectTypeOf(form.getFieldsValue([[]])).toEqualTypeOf<Values>();

  const mounted = form.getFieldsValue();
  expectTypeOf(mounted.email).toEqualTypeOf<string | undefined>();
  expectTypeOf(form.getFieldsValue(true, filter)).toEqualTypeOf<typeof mounted>();
  expectTypeOf(form.getFieldsValue([[]], filter)).toEqualTypeOf<typeof mounted>();
  expectTypeOf(form.getFieldsValue({ filter })).toEqualTypeOf<typeof mounted>();

  const selected = form.getFieldsValue([['rows', 2, 'label']]);
  expectTypeOf(selected.rows).toEqualTypeOf<
    readonly ({ id?: number; label?: string } | undefined)[] | undefined
  >();
  expectTypeOf(selected.range).toEqualTypeOf<readonly [Dayjs?, Dayjs?] | undefined>();

  // @ts-expect-error Even a required store field may be absent from a selection.
  form.getFieldsValue([]).email.toLowerCase();
}
