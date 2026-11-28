<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Form, FormErrorList, FormItem, FormList, FormValidationError, Input,
    createForm, type FieldError, type FormFeedbackIcons, type FormFieldSnapshot, type FormListRule,
    type FormValidationMessage, type ValidationRule
  } from '@woodger/antd';
  import FormStatusReadout from './FormStatusReadout.svelte';

  let { initialMessages = false }: { initialMessages?: boolean } = $props();
  const initialName = untrack(() => initialMessages ? 'Ada' : '');
  const model = createForm({
    initialValues: { name: initialName, child: '', manual: '', items: [] as string[] },
    rules: { name: [{}], child: [{}], items: [{}] }
  });
  const warningMessage: FormValidationMessage = { text: 'Keep it concise', content: warning };
  const nameRules: ValidationRule[] = [
    { required: true, message: blocking },
    { required: true, warningOnly: true, message: warningMessage }
  ];
  const itemRules: FormListRule[] = [{
    validator() { throw new Error('The list needs an item'); },
    message: { text: 'Add at least one item', content: listMessage }
  }];
  const feedbackIcons: FormFeedbackIcons = info => ({
    error: info.errorMessages?.[0] === blocking ? feedback : undefined
  });
  let fields = $state.raw<FormFieldSnapshot[]>([]);
  let quiet = $state.raw<readonly FieldError[]>([]);
  let submitted = $state.raw<readonly FieldError[]>([]);
  const statuses = $derived(model.getFieldsError(['name', 'child', 'manual', 'items']));

  untrack(() => {
    if (initialMessages) {
      model.setFields([
        { name: 'name', errorMessages: [blocking], warningMessages: [warningMessage] },
        { name: 'child', errorMessages: [childMessage] },
        { name: 'items', errorMessages: ['Check the items', listMessage] }
      ]);
    }
  });

  async function validateQuietly() {
    try {
      await model.validateFields(['name'], { validateOnly: true });
    }
    catch (error) {
      if (!(error instanceof FormValidationError)) throw error;
      quiet = error.errorFields;
    }
  }

  function replaceMessages() {
    model.setFields([{ name: 'name', errorMessages: [external], warningMessages: [warningMessage] }]);
  }

  function clearMessages() {
    model.setFields([{ name: 'name', errors: [], warnings: [] }]);
  }
</script>

{#snippet blocking()}<strong data-message="rich-error">Enter a name</strong>{/snippet}
{#snippet warning()}<em data-message="rich-warning">Keep it concise</em>{/snippet}
{#snippet childMessage()}<a href="#details" data-message="rich-child">Read field details</a>{/snippet}
{#snippet listMessage()}<strong data-message="rich-list">Add at least one item</strong>{/snippet}
{#snippet external()}<span data-message="rich-external">External message</span>{/snippet}
{#snippet feedback()}<span data-rich-feedback>!</span>{/snippet}

<section id="form-rich-validation-fixture" aria-label="Rich validation messages">
  <button type="button" onclick={validateQuietly}>Validate quietly</button>
  <button type="button" onclick={replaceMessages}>Replace name messages</button>
  <button type="button" onclick={clearMessages}>Clear name messages</button>
  <ConfigProvider theme={{ token: { motion: false } }}>
    <Form name="audit" layout="vertical" form={model} {fields}
      onFieldsChange={(_, all) => { fields = all; }}
      onFinishFailed={error => { submitted = error.errorFields; }}
    >
      <FormItem name="name" label="Name" class="rich-name-item" rules={nameRules}
        hasFeedback={{ icons: feedbackIcons }}>
        <FormStatusReadout scope="rich-name"><Input value={model.values.name} /></FormStatusReadout>
      </FormItem>
      <FormItem label="Nested">
        <FormItem name="child" noStyle rules={[{ required: true, message: childMessage }]}>
          <Input aria-label="Nested field" />
        </FormItem>
      </FormItem>
      <FormItem name="manual" label="Manual help" help="Manually supplied help"
        rules={[{ required: true, message: blocking }]}>
        <Input />
      </FormItem>
      <FormList name="items" rules={itemRules}>
        {#snippet children(_entries, _operations, meta)}
          <FormErrorList errors={meta.errorMessages ?? meta.errors}
            warnings={meta.warningMessages ?? meta.warnings} />
        {/snippet}
      </FormList>
      <button type="submit">Submit form</button>
    </Form>
  </ConfigProvider>
  <div id="details">Details</div>
  <output data-testid="quiet-result">{quiet[0]?.errorMessages?.[0] === blocking}</output>
  <output data-testid="submitted-fields">{JSON.stringify(
    submitted.map(field => ({ name: field.name, rich: Boolean(field.errorMessages?.length) }))
  )}</output>
  <output data-testid="active-name-errors">{JSON.stringify(statuses[0]?.errors)}</output>
  <output data-testid="echoed-name-messages">{fields.find(field =>
    field.name[0] === 'name'
  )?.errorMessages?.[0] === blocking}</output>
</section>
