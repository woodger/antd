import type { Component, Snippet } from 'svelte';
import {
  createForm, useFormInstance, type FormComponentProps, type FormInstance, type FormInstanceRef,
  type FormItemRenderContext, type FormProps, type FormProviderFinishInfo, type FormRef,
  type FormRenderContext, type FormRootProps, type SubmissionResult
} from '@woodger/antd';

type Values = { word: string; count: number };

export function formHostTypes(
  root: Component<FormRootProps>, ref: FormRef<Values>, children: Snippet,
  render: Snippet<[FormRenderContext<Values>]>, model: FormInstance<Values>
) {
  const previous: FormProps<Values> = { children, form: model };
  const standalone: FormComponentProps<Values> = { component: 'section' };
  const custom: FormComponentProps<Values> = { component: root, ref, render };
  const submitted: void = ref.submit();
  const explicit: Promise<SubmissionResult<Values>> = ref.submit(values => {
    ref.setFieldValue('count', values.count + 1);
  });
  const owned = createForm({ initialValues: { word: 'start', count: 0 } });
  const original = owned.submit;
  owned.submit = (onFinish) => original(onFinish);
  const submittedModel: void = owned.submit();
  const element: HTMLElement | undefined = ref.nativeElement;
  // @ts-expect-error The root ref keeps the supplied model's schema.
  ref.setFieldValue('count', 'wrong');

  return { previous, standalone, custom, submitted, explicit, submittedModel, element };
}

export function contextualFormSubmissions(
  model: FormInstance<Values>, view: FormRenderContext<Values>, item: FormItemRenderContext,
  info: FormProviderFinishInfo
) {
  const context = useFormInstance<Values>();
  const contextSubmit: void | undefined = context.ref?.submit();
  const renderSubmit: void | undefined = view.ref?.submit();
  const itemSubmit: void | undefined = item.ref?.submit();
  const providerSubmit: void | undefined = info.refs?.checkout?.submit();
  const explicit: Promise<SubmissionResult<Values>> | undefined = view.ref?.submit(values => {
    view.form.setFieldValue('count', values.count + 1);
  });
  const current: FormInstance<Values> | undefined = context.current;
  const contextSnapshot: FormInstanceRef<Values> = { current: model };
  const renderSnapshot: FormRenderContext<Values> = { values: model.values, form: model };
  const providerSnapshot: FormProviderFinishInfo = { values: model.values, forms: {} };

  return {
    contextSubmit, renderSubmit, itemSubmit, providerSubmit, explicit, current, contextSnapshot,
    renderSnapshot, providerSnapshot
  };
}
