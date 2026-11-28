<script lang="ts">
  import {
    createForm, Form, FormItem, FormList, Input,
    type FormFieldSnapshot, type FormListRule, type FormRule, type FormValidateTrigger, type NamePath,
    type ValidationRule
  } from '@woodger/antd';

  const triggerForm = createForm({
    initialValues: {
      inherited: '', both: '', disabled: '', unmatched: '', write: 'before blur',
      custom: '', rows: [] as string[]
    }
  });
  type TriggerInput = Exclude<keyof typeof triggerForm.values, 'rows'>;

  type DependencyValues = {
    source: string;
    alternate: string;
    direct: number;
    tail: string;
    clean?: string;
    afterClean: boolean;
    rows: { rowValue: string }[];
    watchedRow: string;
    wrongPath: string;
    watchedList: string;
  };
  type DependencyInput = Exclude<keyof DependencyValues, 'rows' | 'direct' | 'afterClean'>;
  const dependencyForm = createForm<DependencyValues>({
    initialValues: {
      source: 'start', alternate: 'other', direct: 0, tail: '', afterClean: false,
      rows: [{ rowValue: 'first' }], watchedRow: 'watch', wrongPath: 'wrong',
      watchedList: 'list watch'
    }
  });
  const cycleForm = createForm({ initialValues: { cycleA: '', cycleB: '' } });
  let trigger = $state<FormValidateTrigger>('onBlur');
  let dependencyName = $state('source');
  let category = $state('initial');
  let showDirect = $state(true);
  let trace = $state.raw<unknown[][]>([]);

  function record(...event: unknown[]) {
    trace = [...trace, JSON.parse(JSON.stringify(event))];
  }

  function recordFields(fields: FormFieldSnapshot[]) {
    record('fields', fields.map(({ name, validating, errors, touched, validated }) =>
      [name, validating, errors, touched, validated]
    ));
  }

  function rule(
    id: string,
    validateTrigger?: ValidationRule['validateTrigger'],
    read?: () => unknown
  ): FormListRule {
    return {
      validateTrigger,
      validator(value) {
        record('rule', id, value ?? null, read?.() ?? null);
      }
    };
  }

  function writeDuringBlur() {
    record('user-blur', triggerForm.getFieldValue('write'));
    triggerForm.setFieldValue('write', 'from blur handler');
  }

  function writeValidator(value: unknown) {
    record('rule', 'write', value, null);
    if (value === 'before blur') {
      return 'Stale blur error';
    }
  }

  function directRule() {
    // Capture the current render's rule inputs when the dependency check resolves its factory.
    const currentCategory = category;
    return rule('direct', 'onBlur', () => [currentCategory, dependencyForm.getFieldValue('source')]);
  }

  function writeProgrammatically() {
    dependencyForm.setFieldValue('source', 'set field');
    dependencyForm.setFieldsValue({ source: 'set fields' });
    dependencyForm.setFields([{ name: 'source', value: 'set metadata' }]);
  }
</script>

{#snippet triggerField(
  name: TriggerInput,
  rules: readonly FormRule[],
  validateTrigger?: FormValidateTrigger
)}
  <FormItem {name} {rules} {validateTrigger}>
    <Input
      id={name}
      value={triggerForm.values[name]}
      onValueChange={(value) => triggerForm.changeFieldValue(name, value)}
    />
  </FormItem>
{/snippet}

{#snippet dependencyField(
  name: DependencyInput,
  dependencies?: readonly NamePath[],
  rules?: readonly FormRule[],
  validateTrigger?: FormValidateTrigger
)}
  <FormItem {name} {dependencies} {rules} {validateTrigger}>
    <Input
      id={name}
      value={dependencyForm.values[name]}
      onValueChange={(value) => dependencyForm.changeFieldValue(name, value)}
    />
  </FormItem>
{/snippet}

<main id="form-validation-trigger-fixture">
  <Form name="triggers" form={triggerForm} validateTrigger={trigger}
    onValuesChange={(changed) => record('values', changed)} onFieldsChange={recordFields}>
    {@render triggerField('inherited', [rule('inherited')])}
    {@render triggerField('both', [
      rule('change-only', 'onChange'), rule('blur-only', ['onBlur']), rule('all')
    ], ['onChange', 'onBlur'])}
    {@render triggerField('disabled', [rule('disabled')], [])}
    {@render triggerField('unmatched', [rule('unmatched', 'onBlur')], 'onChange')}
    <FormItem name="write" rules={[{ validator: writeValidator }]}>
      <Input
        id="write"
        value={triggerForm.values.write}
        onValueChange={(value) => triggerForm.changeFieldValue('write', value)}
        onblur={writeDuringBlur}
      />
    </FormItem>
    <FormItem name="custom" validateTrigger={['onPick', 'onCheck']}
      rules={[rule('custom-pick', 'onPick'), rule('custom-check', 'onCheck')]}>
      <button id="pick" type="button"
        onclick={() => triggerForm.changeFieldValue('custom', 'selected', 'onPick')}>Pick</button>
      <button id="custom-check" type="button"
        onclick={() => triggerForm.validateFieldOn('custom', 'onCheck')}>Check</button>
    </FormItem>
    <FormList name="rows" rules={[rule('list')]}>
      {#snippet children(_, operations)}
        <button id="add-trigger-row" type="button" onclick={() => operations.add('row')}>Add</button>
      {/snippet}
    </FormList>
  </Form>

  <Form name="dependencies" form={dependencyForm} validateTrigger={false}
    onValuesChange={(changed) => {
      record('values', changed);
      if (changed.source === 'next') {
        category = 'updated';
      }
    }}
    onFieldsChange={recordFields}>
    {@render dependencyField('source', undefined, [rule('source')], 'onChange')}
    {@render dependencyField('alternate')}
    {#if showDirect}
      <FormItem name="direct" dependencies={[dependencyName, dependencyName]}
        rules={[directRule]} validateDebounce={5000}>
        <span id="direct">{dependencyForm.values.direct}</span>
      </FormItem>
    {/if}
    {@render dependencyField('tail', ['direct', 'source'], [rule('tail')])}
    {@render dependencyField('clean', ['source'], [rule('clean')])}
    <FormItem name="afterClean" dependencies={['clean']} rules={[rule('after-clean')]}>
      <span id="after-clean">{String(dependencyForm.values.afterClean)}</span>
    </FormItem>
    <FormList name="rows">
      {#snippet children(fields, operations)}
        {#each fields as field (field.key)}
          <FormItem name={[field.name, 'rowValue']}>
            <Input
              id={'row-' + field.name}
              value={dependencyForm.values.rows[field.name].rowValue}
              onValueChange={(value) => dependencyForm.changeFieldValue(
                ['rows', field.name, 'rowValue'], value
              )}
            />
          </FormItem>
        {/each}
        <button id="move-row" type="button"
          onclick={() => operations.add({ rowValue: 'inserted' }, 0)}>Insert row</button>
      {/snippet}
    </FormList>
    {@render dependencyField('watchedRow', [['rows', 0, 'rowValue']], [rule('row')])}
    {@render dependencyField('wrongPath', [['rows', '0', 'rowValue']], [rule('string-row')])}
    {@render dependencyField('watchedList', ['rows'], [rule('list-path')])}
  </Form>

  <Form name="cycle" form={cycleForm} validateTrigger={false}
    onValuesChange={(changed) => record('values', changed)} onFieldsChange={recordFields}>
    <FormItem name="cycleA" dependencies={['cycleB']} validateTrigger="onChange" rules={[rule('cycle-a')]}>
      <Input id="cycleA" value={cycleForm.values.cycleA}
        onValueChange={(value) => cycleForm.changeFieldValue('cycleA', value)} />
    </FormItem>
    <FormItem name="cycleB" dependencies={['cycleA']} rules={[rule('cycle-b')]}>
      <Input id="cycleB" value={cycleForm.values.cycleB}
        onValueChange={(value) => cycleForm.changeFieldValue('cycleB', value)} />
    </FormItem>
  </Form>

  <button id="clear-trace" onclick={() => trace = []}>Clear trace</button>
  <button id="change-trigger" onclick={() => trigger = 'onChange'}>Change trigger</button>
  <button id="manual-check"
    onclick={() => void triggerForm.validateFields(['both', 'disabled', 'unmatched'])}>Validate</button>
  <button id="programmatic-writes" onclick={writeProgrammatically}>Write</button>
  <button id="rebind-dependencies" onclick={() => dependencyName = 'alternate'}>Rebind</button>
  <button id="reset-dependencies" onclick={() => dependencyForm.resetFields()}>Reset</button>
  <button id="remove-dependent" onclick={() => showDirect = false}>Remove dependent field</button>
  <pre id="validation-trigger-trace">{JSON.stringify(trace)}</pre>
  <output id="blur-write-errors">{JSON.stringify(triggerForm.getFieldError('write'))}</output>
  <output id="dependency-pending">{dependencyForm.isFieldValidating('direct')}</output>
</main>
