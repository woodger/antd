<script lang="ts">
  import { Checkbox, createForm, Form, FormItem, Input } from '@woodger/antd';
  import type { FormFieldSnapshot, FormItemControl, FormValues, InputChangeEvent } from '@woodger/antd';
  import FormControlAdapterPeers from './FormControlAdapterPeers.svelte';

  const model = createForm({
    initialValues: { code: 'seed', enabled: false, amount: 10, outside: 'private' }
  });
  let trace = $state.raw<unknown[][]>([]);
  let firstPrevious = $state.raw<Readonly<FormValues>>();

  function record(...event: unknown[]) {
    trace = [...trace, event];
  }

  function recordFields(fields: FormFieldSnapshot[]) {
    for (const { name, value, validating, errors } of fields) {
      record('field', name, value, validating, errors);
    }
  }

  function codeProps(value: unknown) {
    return value === 'bad' ? { value } : { value, 'data-mapped': 'code' };
  }

  function normalizeCode(value: string, previous: unknown, previousValues: Readonly<FormValues>) {
    firstPrevious ??= previousValues;
    record('normalize', value, previous, previousValues.code,
      previousValues.outside, model.isFieldTouched('code'));
    return value.trim();
  }

  function validateCode(value: unknown) {
    record('validator', 'code', value);
    if (value === 'bad') {
      return 'Invalid code';
    }
  }

  function changeCode(editor: FormItemControl, event: InputChangeEvent) {
    editor.emit('onChange', event);
    record('child', 'code', event.target.value, model.getFieldValue('code'));
  }

  function extractAmount(packet: { target: { amount: number } }, factor: number) {
    const { amount } = packet.target;
    record('extract', amount, factor, model.isFieldTouched('amount'));
    return amount * factor;
  }

  function normalizeAmount(value: unknown, previous: unknown, store: Readonly<FormValues>) {
    record('amount-normalize', value, previous, store.enabled);
    return value;
  }

  function validateAmount(value: unknown) {
    record('validator', 'amount', value);
    if (value === 0) {
      return 'Zero amount';
    }
  }

  function preview(editor: FormItemControl) {
    const packet = { target: { amount: 9 } };
    editor.emit('onChange', packet, 3);
    record('child-preview', packet.target.amount, 3);
  }

  function commit(editor: FormItemControl) {
    const packet = { target: { amount: 0 } };
    editor.emit('onCommit', packet, 3);
    record('child-commit', packet.target.amount, 3, model.getFieldValue('amount'));
  }

  function check(editor: FormItemControl) {
    editor.emit('onCheck');
    record('child-check', model.isFieldValidating('amount'));
  }

  const snapshot = $derived(JSON.stringify({
    values: model.getFieldsValue(true),
    touched: ['code', 'enabled', 'amount'].map(name => model.isFieldTouched(name)),
    validation: ['code', 'amount'].map(name => model.getFieldError(name)),
    trace,
    firstPreviousCode: firstPrevious?.code
  }, (_, value) => value === undefined ? { missing: true } : value));
</script>

<main id="form-control-adapters-fixture">
  <Form
    form={model}
    name="adapter"
    onValuesChange={(changed, values) => record('values', changed, values)}
    onFieldsChange={recordFields}
  >
    <FormItem
      name="code"
      label="Code"
      htmlFor="adapter-code"
      getValueProps={codeProps}
      normalize={normalizeCode}
      rules={[{ validator: validateCode }]}
    >
      {#snippet control(editor)}
        <Input {...editor.props} id="adapter-code" onChange={(event) => changeCode(editor, event)} />
      {/snippet}
    </FormItem>
    <FormItem name="enabled" valuePropName="checked">
      {#snippet control(editor)}
        <Checkbox {...editor.props} id="adapter-checkbox" onChange={(event) => editor.emit('onChange', event)}>
          Enabled
        </Checkbox>
      {/snippet}
    </FormItem>
    <FormItem
      name="amount"
      trigger="onCommit"
      validateTrigger="onCheck"
      valuePropName="amount"
      getValueProps={(amount) => ({ shown: '#' + String(amount) })}
      getValueFromEvent={extractAmount}
      normalize={normalizeAmount}
      rules={[{ validator: validateAmount }]}
    >
      {#snippet control(editor)}
        <output id="amount-shown" data-amount={editor.props.amount}>{editor.props.shown}</output>
        <button id="preview" type="button" onclick={() => preview(editor)}>Preview</button>
        <button id="commit" type="button" onclick={() => commit(editor)}>Commit</button>
        <button id="check" type="button" onclick={() => check(editor)}>Check</button>
      {/snippet}
    </FormItem>
  </Form>

  <output id="adapter-state">{snapshot}</output>
  <button id="adapter-clear" type="button" onclick={() => { trace = []; }}>Clear trace</button>
  <button id="adapter-set" type="button" onclick={() => model.setFieldValue('code', ' raw server ')}>
    Set code
  </button>
  <button id="adapter-reset" type="button" onclick={() => model.resetFields()}>Reset</button>

  <FormControlAdapterPeers />
</main>
