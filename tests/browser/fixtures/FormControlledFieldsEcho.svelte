<script lang="ts">
  import { createForm, Form, FormItem, Input, type FormFieldData, type FormFieldSnapshot } from '@woodger/antd';
  import { formatFieldState, readFieldState } from './form-controlled-fields-sample';

  const model = createForm({ initialValues: { value: 'Initial echo' } });
  let fields = $state<readonly FormFieldData[]>([{ name: ['value'], value: 'External echo' }]);
  let trace = $state.raw<unknown[][]>([]);
  let requests = $state.raw<unknown[]>([]);
  let finished = $state.raw<number[]>([]);
  const pending: ((message: string) => void)[] = [];

  function validate(value: unknown) {
    return new Promise<string>((resolve) => {
      requests = [...requests, value];
      pending.push(resolve);
    });
  }

  function echo([field]: FormFieldSnapshot[], allFields: FormFieldSnapshot[]) {
    if (field) {
      trace = [...trace, [field.value, field.validating, field.errors]];
    }
    fields = allFields;
  }

  function override() {
    fields = [{
      name: 'value', value: 'External replacement', validating: false, errors: ['External message']
    }];
  }

  async function finish(index: number, error: string) {
    const resolve = pending[index];
    if (!resolve) {
      throw new Error('The validation request has not started');
    }

    resolve(error);
    // The next frame lets validation consume the settled promise before publishing this signal.
    await new Promise<void>((done) => requestAnimationFrame(() => done()));
    finished = [...finished, index];
  }
</script>

<Form form={model} name="echo" {fields} onFieldsChange={echo}>
  <FormItem name="value" label="Echo" rules={[{ validator: validate }]}>
    <Input
      id="echo-value"
      value={model.getFieldValue('value')}
      onValueChange={(value) => model.changeFieldValue('value', value)}
    />
  </FormItem>
</Form>

<output aria-label="Echo state">{formatFieldState({
  value: model.getFieldValue('value'), meta: readFieldState(model, 'value'), trace, requests
})}</output>
<output aria-label="Completed validators">{JSON.stringify(finished)}</output>
<button type="button" onclick={() => finish(0, 'Rejected by validator')}>Complete first validation</button>
<button type="button" onclick={override}>Override pending field</button>
<button type="button" onclick={() => finish(1, 'Too late')}>Complete obsolete validation</button>
