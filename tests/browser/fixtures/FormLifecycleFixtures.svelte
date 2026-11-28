<script lang="ts">
  import {
    createForm, Form, FormItem, FormList, Input,
    type FormFieldSnapshot, type FormInstance, type FormItemProps, type FormValues, type NamePath
  } from '@woodger/antd';

  type PreserveValues = {
    inherited: string;
    kept: string;
    zero: number;
    nullable: string | null;
    nested: { sibling: string; extra?: string };
    duplicate: string;
    rename: { first: string; second: string };
    itemOnly?: string;
  };
  const preserveForm = createForm<PreserveValues>({
    initialValues: {
      inherited: 'initial', kept: 'kept', zero: 0, nullable: null,
      nested: { sibling: 'stay' }, duplicate: 'duplicate initial',
      rename: { first: 'first initial', second: 'second initial' }
    }
  });
  let inherit = $state(false);
  let show = $state(true);
  let showFirst = $state(true);
  let showSecond = $state(true);
  let rename = $state<'first' | 'second'>('first');
  let keepRenamed = $state(false);

  const dependencyForm = createForm({
    initialValues: { driver: 'initial', dependent: 'watch' }
  });
  let showDriver = $state(true);
  let dependencyEvents = $state.raw<unknown[][]>([]);

  type DetachValues = { title: string; hidden: string; description?: string; free?: string; };
  const detachDefaults = { title: 'model initial', hidden: 'unregistered' };
  const clearCases = ['keep', 'clear', 'switched'] as const;
  const detachModels = {
    keep: createForm<DetachValues>({ initialValues: detachDefaults }),
    clear: createForm<DetachValues>({ initialValues: detachDefaults }),
    switched: createForm<DetachValues>({ initialValues: detachDefaults })
  };
  let detachShown = $state({ keep: true, clear: true, switched: true });
  let clearFlags = $state({ keep: false, clear: true, switched: false });

  const sharedForm = createForm({ initialValues: { value: 'shared initial' } });
  let sharedFirst = $state(true);
  let sharedSecond = $state(true);

  const listForm = createForm({ initialValues: {
    rows: [
      { id: 'A', nested: { text: 'A initial' }, plain: 'A keep', sub: [{ title: 'sub A' }] },
      { id: 'B', nested: { text: 'B initial' }, plain: 'B keep', sub: [{ title: 'sub B' }] }
    ]
  } });
  let showList = $state(true);
  let showA = $state(true);
  let showDirect = $state(true);
  let showSub = $state(false);

  const original = createForm({ initialValues: { value: 'first default' } });
  const replacement = createForm({ initialValues: { value: 'replacement default' } });
  let swappedForm = $state.raw(original);

  const submitForm = createForm({ initialValues: { value: 'submit default' } });
  let showSubmit = $state(true);
  let submissionCount = 0;
  let submissions = $state.raw<number[]>([]);
  const release = new Map<number, (error?: Error) => void>();

  function serialize(value: unknown) {
    return JSON.stringify(value, (_, item) => item === undefined ? { missing: true } : item);
  }

  function report(model: FormInstance<FormValues>, events?: readonly unknown[][]) {
    return serialize({
      values: model.getFieldsValue(true),
      fields: model.getFieldsValue(),
      ...(events ? { events } : {})
    });
  }

  function recordMetadata(fields: FormFieldSnapshot[]) {
    const changed = fields.map((field) => [field.name, field.validating]);
    dependencyEvents = [...dependencyEvents, ['fields', changed]];
  }

  function holdSubmission(): Promise<void> {
    const submission = ++submissionCount;
    submissions = [...submissions, submission];
    return new Promise((resolve, reject) => {
      release.set(submission, (error) => {
        release.delete(submission);
        if (error) reject(error);
        else resolve();
      });
    });
  }

  function rejectExpiredSubmission() {
    const error = new Error('Expired submission');
    release.get(1)?.(error);
  }

  function writePreserveDrafts() {
    preserveForm.setFieldsValue({
      inherited: 'draft', kept: 'kept draft', itemOnly: 'item draft',
      nested: { extra: 'nested draft' }, zero: 9, nullable: 'edited'
    });
  }

  function writeDetachedDrafts() {
    for (const id of clearCases) {
      detachModels[id].setFieldsValue({
        title: 'title draft', description: 'description draft', free: 'unregistered draft'
      });
    }
  }

  function writeListDrafts() {
    listForm.setFieldsValue({ rows: [
      { id: 'A', nested: { text: 'A live' }, plain: 'A keep', sub: [{ title: 'nested A' }] },
      { id: 'B', nested: { text: 'B live' }, plain: 'B keep', sub: [{ title: 'nested B' }] }
    ] });
  }

  function writeSparseRows() {
    const rows: typeof listForm.values.rows = [];
    rows[0] = { id: 'A', nested: { text: 'sparse A' }, plain: 'A keep', sub: [] };
    rows[2] = { id: 'B', nested: { text: 'sparse B' }, plain: 'B keep', sub: [] };
    listForm.setFieldsValue({ rows });
  }
</script>

{#snippet field(
  model: FormInstance<FormValues>,
  name: NamePath,
  id: string,
  settings: Pick<FormItemProps, 'preserve' | 'initialValue'> = {}
)}
  <FormItem {name} {...settings}>
    <Input {id} value={String(model.getFieldValue(name) ?? '')} />
  </FormItem>
{/snippet}

<main id="form-lifecycle-fixture">
  <Form form={preserveForm} name="preserve" preserve={inherit}>
    {#if show}
      {@render field(preserveForm, 'inherited', 'inherited')}
      {@render field(preserveForm, 'kept', 'kept', { preserve: true })}
      {@render field(preserveForm, 'itemOnly', 'item-only', {
        preserve: false, initialValue: 'item initial'
      })}
      {@render field(preserveForm, ['nested', 'extra'], 'extra', {
        preserve: false, initialValue: 'nested initial'
      })}
      {@render field(preserveForm, 'zero', 'zero')}
      {@render field(preserveForm, 'nullable', 'nullable')}
    {/if}
    {#if showFirst}{@render field(preserveForm, 'duplicate', 'first-duplicate')}{/if}
    {#if showSecond}{@render field(preserveForm, 'duplicate', 'second-duplicate')}{/if}
    {@render field(preserveForm, ['rename', rename], 'rename', { preserve: keepRenamed })}
  </Form>

  <Form form={dependencyForm} name="dependencies" validateTrigger={false}
    onFieldsChange={recordMetadata}
    onValuesChange={(values) => dependencyEvents = [...dependencyEvents, ['values', values]]}>
    {#if showDriver}
      {@render field(dependencyForm, 'driver', 'driver', { preserve: false })}
    {/if}
    <FormItem name="dependent" dependencies={['driver']} rules={[{
      validator() {
        dependencyEvents = [...dependencyEvents, ['read', dependencyForm.getFieldValue('driver')]];
      }
    }]}>
      <Input id="dependent" value={dependencyForm.values.dependent} />
    </FormItem>
  </Form>

  {#each clearCases as id}
    {@const form = detachModels[id]}
    {#if detachShown[id]}
      <Form {form} name={id} clearOnDestroy={clearFlags[id]}>
        {@render field(form, 'title', id + '-title')}
        {@render field(form, 'description', id + '-description', { initialValue: 'item initial' })}
      </Form>
    {/if}
    <button id={'toggle-' + id} onclick={() => detachShown[id] = !detachShown[id]}>Toggle {id}</button>
    <pre data-model={id}>{report(form)}</pre>
  {/each}

  {#if sharedFirst}
    <Form form={sharedForm} name="shared-first" clearOnDestroy>
      {@render field(sharedForm, 'value', 'shared-first-value')}
    </Form>
  {/if}
  {#if sharedSecond}
    <Form form={sharedForm} name="shared-second" clearOnDestroy>
      {@render field(sharedForm, 'value', 'shared-second-value')}
    </Form>
  {/if}

  <Form form={listForm} name="lists" preserve={false}>
    {#if showList}
      <FormList name="rows">
        {#snippet children(rows, operations)}
          {#each rows as row (row.key)}
            {@const id = listForm.values.rows[row.name]?.id}
            <section id={'row-' + id}>
              {#if id === 'A' && showA}
                <FormItem name={[row.name, 'nested', 'text']} preserve={false}>
                  <Input id="item-A" value={listForm.values.rows[row.name]?.nested.text} />
                </FormItem>
              {/if}
              {#if id === 'A' && showDirect}
                <FormItem name={row.name}><span id="direct-A">Direct</span></FormItem>
              {/if}
              {#if id === 'A' && showSub}
                <FormList name={[row.name, 'sub']}>
                  {#snippet children(items)}
                    {#each items as item (item.key)}
                      <FormItem name={[item.name, 'title']} preserve={false}>
                        <Input id="sub-A" value={listForm.values.rows[row.name]?.sub[item.name]?.title} />
                      </FormItem>
                    {/each}
                  {/snippet}
                </FormList>
              {/if}
            </section>
          {/each}
          <button type="button" id="move-rows" onclick={() => operations.move(0, 1)}>Move</button>
          <button type="button" id="remove-row" onclick={() => operations.remove(0)}>Remove row</button>
        {/snippet}
      </FormList>
    {/if}
  </Form>

  <Form form={swappedForm} clearOnDestroy component={false}>
    {@render field(swappedForm, 'value', 'swapped-value')}
  </Form>

  {#if showSubmit}
    <Form form={submitForm} name="pending-submission" clearOnDestroy onFinish={holdSubmission}>
      {@render field(submitForm, 'value', 'submission-value')}
      <button id="submit-form" type="submit">Submit</button>
    </Form>
  {/if}

  <button id="field-drafts" onclick={writePreserveDrafts}>Write field drafts</button>
  <button id="toggle-fields" onclick={() => show = !show}>Toggle fields</button>
  <button id="change-inheritance" onclick={() => {
    inherit = !inherit;
    if (inherit) preserveForm.setFieldValue('inherited', 'retained after toggle');
  }}>Set preserve</button>
  <button id="duplicate-draft" onclick={() => preserveForm.setFieldValue('duplicate', 'duplicate draft')}>
    Write duplicate
  </button>
  <button id="remove-first" onclick={() => showFirst = false}>Remove first duplicate</button>
  <button id="remove-second" onclick={() => showSecond = false}>Remove second duplicate</button>
  <button id="rename-drafts" onclick={() => preserveForm.setFieldsValue({
    rename: { first: 'draft first', second: 'draft second' }
  })}>Write rename drafts</button>
  <button id="rename-field" onclick={() => rename = rename === 'first' ? 'second' : 'first'}>
    Rename field
  </button>
  <button id="preserve-renamed" onclick={() => keepRenamed = true}>Keep renamed field</button>
  <button id="driver-draft" onclick={() => dependencyForm.setFieldValue('driver', 'driver draft')}>
    Write driver
  </button>
  <button id="remove-driver" onclick={() => showDriver = false}>Remove driver</button>
  <button id="detach-drafts" onclick={writeDetachedDrafts}>Write detach drafts</button>
  <button id="detached-write" onclick={() => detachModels.clear.setFieldsValue({
    title: 'detached write', free: 'new unregistered'
  })}>Write while detached</button>
  <button id="switch-clear" onclick={() => clearFlags.switched = true}>Set clear on destroy</button>
  <button id="shared-draft" onclick={() => sharedForm.setFieldValue('value', 'shared draft')}>
    Write shared draft
  </button>
  <button id="remove-first-owner" onclick={() => sharedFirst = false}>Remove first owner</button>
  <button id="remove-second-owner" onclick={() => sharedSecond = false}>Remove second owner</button>
  <button id="toggle-list" onclick={() => showList = !showList}>Toggle list</button>
  <button id="toggle-A" onclick={() => showA = !showA}>Toggle A field</button>
  <button id="remove-direct" onclick={() => showDirect = false}>Remove direct field</button>
  <button id="toggle-sub" onclick={() => showSub = !showSub}>Toggle nested list</button>
  <button id="list-drafts" onclick={writeListDrafts}>Write list drafts</button>
  <button id="sparse-rows" onclick={writeSparseRows}>Write sparse rows</button>
  <button id="swap-model" onclick={() => swappedForm = swappedForm === original ? replacement : original}>
    Swap model
  </button>
  <button id="toggle-submit" onclick={() => showSubmit = !showSubmit}>Toggle submit form</button>
  <button id="reject-old" onclick={rejectExpiredSubmission}>
    Reject old submission
  </button>
  <button id="complete-new" onclick={() => release.get(2)?.()}>Complete new submission</button>

  <pre data-model="preserve">{report(preserveForm)}</pre>
  <pre data-model="dep">{report(dependencyForm, dependencyEvents)}</pre>
  <pre data-model="shared">{report(sharedForm)}</pre>
  <pre data-model="list">{report(listForm)}</pre>
  <pre data-model="original">{report(original)}</pre>
  <pre data-model="replacement">{report(replacement)}</pre>
  <pre id="submit-starts">{serialize(submissions)}</pre>
  <pre id="submit-busy">{String(submitForm.isSubmitting)}</pre>
  <pre id="submit-error">{String(submitForm.submissionError ?? '')}</pre>
</main>
