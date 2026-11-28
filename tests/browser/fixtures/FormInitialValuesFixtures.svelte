<script lang="ts">
  import {
    createForm, Form, FormItem, FormList, FormValidationError, Input,
    type FormInstance, type PartialFormValues
  } from '@woodger/antd';
  import FormInitialValuesAuto, { type AutomaticFormValues } from './FormInitialValuesAuto.svelte';
  import FormInitialValuesAttachment from './FormInitialValuesAttachment.svelte';

  type Values = {
    shared?: string;
    profile?: { code: string; other: string };
    removable?: string;
    rows?: { text: string }[];
    zero?: number;
    falsy?: boolean;
    nil?: string | null;
    blank?: string;
    absent?: string;
    late?: string;
    additional?: string;
  };

  const first = {
    shared: 'from form', profile: { code: 'initial code', other: 'initial other' },
    removable: 'initial removable', rows: [{ text: 'from initial array' }, { text: 'unmerged row' }],
    zero: 0, falsy: false, nil: null, blank: '', absent: 'overwritten by undefined'
  };
  const next = {
    shared: 'next', profile: { code: 'next code', other: 'next other' },
    removable: 'next removable', rows: [{ text: 'new row' }], additional: 'added by reset'
  };
  const model = createForm<Values>({ initialValues: {} });
  model.setFieldsValue({
    shared: 'from model', profile: { code: 'pre-existing code' }, rows: [{ text: 'existing row' }]
  });
  model.setFieldValue('absent', undefined);

  let defaults = $state<PartialFormValues<Values> | undefined>(first);
  let present = $state(true);
  let events = $state.raw<string[]>([]);
  let dirty = $state.raw<readonly unknown[]>();
  const replacement = createForm<AutomaticFormValues>({
    initialValues: { word: 'replacement', modelOnly: 'constructor default' }
  });
  let supplied = $state.raw<FormInstance<AutomaticFormValues>>();

  async function validateDirty() {
    try {
      await model.validateFields({ dirty: true, validateOnly: true });
      dirty = [];
    }
    catch (error) {
      if (!(error instanceof FormValidationError)) {
        throw error;
      }

      dirty = error.errorFields.map(field => field.name);
    }
  }
</script>

<main id="form-initial-values-fixture">
  <FormInitialValuesAuto form={supplied} />
  <FormInitialValuesAuto id="other-auto" />
  <button id="replace-automatic" type="button"
    onclick={() => { supplied = supplied ? undefined : replacement; }}>Switch model</button>

  <Form form={model} name="external" initialValues={defaults}
    onFieldsChange={() => { events = [...events, 'fields']; }}
    onValuesChange={() => { events = [...events, 'values']; }}>
    <FormItem name="shared" label="Shared">
      {#snippet control(editor)}<Input {...editor.props} id="external-word" />{/snippet}
    </FormItem>
    <FormItem name={['profile', 'code']} label="Profile code">
      {#snippet control(editor)}<Input {...editor.props} id="external-code" />{/snippet}
    </FormItem>
    {#if present}
      <FormItem name="removable" label="Removable" preserve={false}>
        {#snippet control(editor)}<Input {...editor.props} id="external-removable" />{/snippet}
      </FormItem>
    {/if}
    <FormItem name="absent" label="Local fallback" initialValue="from item">
      {#snippet control(editor)}<Input {...editor.props} id="external-local" />{/snippet}
    </FormItem>
    <FormList name="rows" initialValue={[{ text: 'list fallback' }]}>
      {#snippet children(fields)}
        {#each fields as row (row.key)}
          <FormItem name={[row.name, 'text']}>
            {#snippet control(editor)}<Input {...editor.props} class="external-row" />{/snippet}
          </FormItem>
        {/each}
      {/snippet}
    </FormList>
    <FormItem name="late" rules={[{ required: true, message: 'Required late value' }]}>
      {#snippet control(editor)}<Input {...editor.props} id="external-late" />{/snippet}
    </FormItem>
  </Form>

  <output id="external-values">{JSON.stringify(model.getFieldsValue(true))}</output>
  <output id="external-events">{JSON.stringify(events)}</output>
  <output id="dirty-result">{JSON.stringify(dirty)}</output>
  <button id="change-defaults" type="button" onclick={() => { defaults = next; }}>Change defaults</button>
  <button id="toggle-removable" type="button" onclick={() => { present = !present; }}>Toggle field</button>
  <button id="reset-code" type="button" onclick={() => model.resetFields([['profile', 'code']])}>
    Reset code
  </button>
  <button id="reset-external" type="button" onclick={() => model.resetFields()}>Reset all</button>
  <button id="remove-defaults" type="button" onclick={() => { defaults = undefined; }}>Remove defaults</button>
  <button id="default-late" type="button" onclick={() => { defaults = { late: 'late default' }; }}>
    Set late default
  </button>
  <button id="validate-defaults" type="button" onclick={validateDirty}>Validate dirty</button>

  <FormInitialValuesAttachment id="preserve" />
  <FormInitialValuesAttachment id="clear" clearOnDestroy />
</main>
