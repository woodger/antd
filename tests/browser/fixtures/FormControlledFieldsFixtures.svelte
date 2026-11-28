<script lang="ts">
  import { createForm, Form, FormItem, FormProvider, Input, type FormFieldData } from '@woodger/antd';
  import FormControlledFieldsEcho from './FormControlledFieldsEcho.svelte';
  import { formatFieldState, readFieldState } from './form-controlled-fields-sample';

  type Values = {
    title: string;
    profile: { email: string };
    hidden?: string;
    flags?: { checked: boolean; count: number; note: string; empty: null };
  };

  const emailPath = ['profile', 'email'] as const;
  const original = createForm<Values>({
    initialValues: { title: 'Initial title', profile: { email: 'initial@example.com' }, hidden: 'default' }
  });
  const replacement = createForm<Values>({
    initialValues: { title: 'Replacement title', profile: { email: 'replacement@example.com' } }
  });
  let active = $state.raw(original);
  let late = $state(false);
  let events = $state.raw<unknown[][]>([]);
  let fields = $state<FormFieldData[] | undefined>([
    { name: 'title', value: 'External title' },
    {
      name: emailPath, value: 'outside@example.com', touched: true,
      errors: ['Server error'], warnings: ['Server warning']
    },
    { name: 'flags', value: { checked: false, count: 0, note: '', empty: null } },
    { name: 'hidden', value: undefined, touched: true, errors: ['Not registered'] }
  ]);
  let mirrorProfile = $state(false);
  const controlled = $derived(mirrorProfile ? [{ name: 'profile', value: active.values.profile }] : fields);
  const snapshot = $derived(formatFieldState({
    values: active.getFieldsValue(true),
    titleMeta: readFieldState(active, 'title'),
    emailMeta: readFieldState(active, emailPath),
    hiddenMeta: readFieldState(active, 'hidden'),
    events
  }));

  function record(...event: unknown[]) {
    events = [...events, event];
  }

  function patch() {
    fields = [
      { name: emailPath, value: '', errors: [] },
      { name: emailPath, touched: false, warnings: ['New warning'] },
      { name: 'flags', value: { checked: true, count: 0, note: '', empty: null } }
    ];
  }

  function applySparseRecords() {
    const entries: FormFieldData[] = [];
    entries[1] = { name: emailPath, value: 'sparse@example.com', warnings: [] };
    entries[3] = { name: emailPath, touched: true, errors: ['Sparse error'] };
    fields = entries;
  }

  function mutateRecord() {
    if (fields) {
      fields[0].value = 'External mutation';
      fields[1].errors = ['Mutated error'];
    }
  }

  function useStoreProfile() {
    mirrorProfile = true;
    active.setFieldValue(emailPath, 'From the model');
  }
</script>

<main id="form-controlled-fields-fixture">
  <FormProvider onFormChange={(name) => record('provider', name)}>
    <Form
      form={active}
      name="controlled"
      fields={controlled}
      onValuesChange={(changed) => record('value', changed)}
      onFieldsChange={(changed) => record('fields', changed.map(({ name }) => name))}
    >
      <FormItem name="title" label="Title">
        <Input
          id="controlled-title"
          value={active.getFieldValue('title')}
          onValueChange={(value) => active.changeFieldValue('title', value)}
        />
      </FormItem>
      <FormItem name={emailPath} label="Email">
        <Input
          id="controlled-email"
          value={active.getFieldValue(emailPath)}
          onValueChange={(value) => active.changeFieldValue(emailPath, value)}
        />
      </FormItem>
      {#if late}
        <FormItem name="hidden" label="Late field">
          <Input id="controlled-late" value={active.getFieldValue('hidden')} />
        </FormItem>
      {/if}
    </Form>
  </FormProvider>

  <output aria-label="Controlled fields state">{snapshot}</output>
  <output aria-label="Inactive model title">{original.getFieldValue('title')}</output>
  <button type="button" onclick={() => { if (fields) fields = [...fields]; }}>Reuse records</button>
  <button type="button" onclick={() => { fields = fields?.map(field => ({ ...field })); }}>
    Replace records
  </button>
  <button type="button" onclick={patch}>Patch records</button>
  <button type="button" onclick={() => { fields = undefined; }}>Remove records</button>
  <button type="button" onclick={() => { late = true; }}>Mount late field</button>
  <button type="button" onclick={applySparseRecords}>Apply sparse records</button>
  <button type="button" onclick={mutateRecord}>Mutate a record in place</button>
  <button type="button" onclick={() => { active = replacement; }}>Switch controlled model</button>
  <button type="button" onclick={useStoreProfile}>Use a value from the store</button>

  <FormControlledFieldsEcho />
</main>
