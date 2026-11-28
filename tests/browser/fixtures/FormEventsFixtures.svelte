<script lang="ts">
  import {
    createForm, Form, FormItem, FormList, FormProvider, Input,
    type FormFieldSnapshot, type FormModel, type FormProviderForms, type FormProviderProps
  } from '@woodger/antd';

  type Values = {
    plain: string;
    profile?: { title: string; };
    list?: string[];
    unbound?: number;
  };

  const original = createForm<Values>({
    initialValues: { profile: { title: '' }, plain: '', list: ['first', 'second'], unbound: 7 }
  });
  const replacement = createForm<Values>({
    initialValues: { profile: { title: '' }, plain: 'replacement', list: [], unbound: 8 }
  });
  const peer = createForm<Values>({ initialValues: { plain: '' } });
  const unnamed = createForm<Values>({ initialValues: { plain: '' } });
  const empty = createForm<Values>({ initialValues: { plain: '' } });
  let alpha = $state.raw(original);
  let alphaName = $state('alpha');
  let peerName = $state('peer');
  let showPeer = $state(true);
  let showAlpha = $state(true);
  let trace = $state.raw<unknown[][]>([]);
  let pending = $state.raw<string[]>([]);
  let finished = $state.raw<string[]>([]);
  let identities = $state.raw<object>({});
  const tables = { inner: [] as FormProviderForms[], outer: [] as FormProviderForms[] };
  const resolvers = new Map<string, (message?: string) => void>();

  function record(...event: unknown[]) {
    trace = [...trace, JSON.parse(JSON.stringify(event))];
  }

  function formTable(forms: FormProviderForms) {
    const defined = { alpha, peer, unnamed, empty };
    return Object.fromEntries(Object.entries(forms).map(([name, model]) =>
      [name, Object.keys(defined).find((id) => defined[id as keyof typeof defined] === model) ?? '?']
    ));
  }

  function observe(scope: 'inner' | 'outer'): FormProviderProps {
    function captureTable(forms: FormProviderForms) {
      tables[scope].push(forms);
      const { inner, outer } = tables;
      identities = {
        outerBeforeRename: outer[0] === outer[1],
        innerBeforeRename: inner[0] === inner[1],
        firstOuter: formTable(outer[0] ?? {}),
        firstInner: formTable(inner[0] ?? {}),
        lastOuter: formTable(outer.at(-1) ?? {}),
        lastInner: formTable(inner.at(-1) ?? {})
      };
    }

    return {
      onFormChange(name, { changedFields, forms }) {
        captureTable(forms);
        record(scope + '-change', name ?? null, changedFields, formTable(forms));
      },
      onFormFinish(name, { values, forms }) {
        captureTable(forms);
        record(scope + '-finish', name ?? null, values, formTable(forms));
      }
    };
  }

  const outer = observe('outer');
  const inner = observe('inner');

  function validateTitle(value: unknown) {
    if (typeof value !== 'string' || (value !== 'bad' && !value.startsWith('wait'))) {
      return;
    }

    return new Promise<string | void>((resolve) => {
      resolvers.set(value, resolve);
      pending = [...resolvers.keys()];
    });
  }

  async function release(value: string, message?: string) {
    const resolve = resolvers.get(value);
    if (!resolve) {
      throw new Error('No pending validation for ' + value);
    }

    resolvers.delete(value);
    pending = [...resolvers.keys()];
    resolve(message);
    await new Promise<void>((done) => setTimeout(done));
    finished = [...finished, value];
  }

  function programmaticWrites() {
    alpha.setFieldValue(['profile', 'title'], 'ok');
    alpha.setFieldsValue({ plain: 'programmatic' });
    alpha.setFields([{ name: ['list', 0], value: 'programmatic row' }]);
  }

  function captureFields(id: string, changed: FormFieldSnapshot[], all: FormFieldSnapshot[]) {
    if (changed.some((entry) => !all.includes(entry))) {
      throw new Error('Changed fields must be entries of all fields');
    }
    record(id + '-fields', changed, all);
  }
</script>

{#snippet formView(id: string, model: FormModel<Values>, name?: string)}
  <Form
    {name}
    form={model}
    onValuesChange={(changed, all) => record(id + '-values', changed, all)}
    onFieldsChange={(changed, all) => captureFields(id, changed, all)}
    onFinish={(values) => record(id + '-finish', values)}
    onFinishFailed={({ errorFields, outOfDate }) => record(id + '-failed', errorFields, outOfDate)}
  >
    {#if id === 'alpha'}
      <FormItem
        name={['profile', 'title']}
        rules={[
          { validator: validateTitle },
          { min: 4, message: 'Too short', warningOnly: true }
        ]}
      >
        <Input
          id="alpha-title"
          value={model.values.profile?.title}
          onValueChange={(value) => model.changeFieldValue(['profile', 'title'], value)}
        />
      </FormItem>
    {/if}

    <FormItem name="plain">
      <Input
        id={id + '-plain'}
        value={model.values.plain}
        onValueChange={(value) => model.changeFieldValue('plain', value)}
      />
    </FormItem>

    {#if id === 'alpha'}
      <FormList name="list">
        {#snippet children(fields, operations)}
          {#each fields as field (field.key)}
            <FormItem name={field.name}>
              <Input
                value={model.values.list?.[field.name]}
                onValueChange={(value) => model.changeFieldValue(['list', field.name], value)}
              />
            </FormItem>
          {/each}
          <button id="list-add" type="button" onclick={() => operations.add('added', 1)}>Add</button>
          <button id="list-move" type="button" onclick={() => operations.move(2, 0)}>Move</button>
          <button id="list-remove" type="button" onclick={() => operations.remove(1)}>Remove</button>
        {/snippet}
      </FormList>
    {/if}

    <button id={id + '-submit'} type="submit">Submit</button>
  </Form>
{/snippet}

<main id="form-events-fixture">
  <FormProvider {...outer}>
    <FormProvider {...inner} prefixCls="unused-prefix">
      {#if showAlpha}{@render formView('alpha', alpha, alphaName)}{/if}
      {@render formView('unnamed', unnamed)}
      {@render formView('empty', empty, '')}
    </FormProvider>
    {#if showPeer}{@render formView('peer', peer, peerName)}{/if}
  </FormProvider>

  <button id="clear-form-events" onclick={() => trace = []}>Clear events</button>
  <button id="write-form-values" onclick={programmaticWrites}>Write</button>
  <button id="validate-form-values" onclick={() => void alpha.validateFields()}>Validate</button>
  <button id="validate-only" onclick={() => void alpha.validateFields({ validateOnly: true })}>
    Validate only
  </button>
  <button id="reset-form-values" onclick={() => alpha.resetFields()}>Reset</button>
  <button id="submit-peer-model" onclick={() => void peer.submit((values) => record('peer-finish', values))}>
    Submit peer programmatically
  </button>
  <button id="rename-alpha" onclick={() => { alphaName = 'renamed'; showPeer = false; }}>Rename</button>
  <button id="replace-alpha" onclick={() => alpha = replacement}>Replace model</button>
  <button id="show-duplicate" onclick={() => { peerName = 'renamed'; showPeer = true; }}>Duplicate</button>
  <button id="drop-alpha" onclick={() => showAlpha = false}>Remove alpha</button>
  <button id="drop-peer" onclick={() => showPeer = false}>Remove peer</button>
  <button id="reject-bad" onclick={() => void release('bad', 'Rejected')}>Reject bad</button>
  <button id="accept-second" onclick={() => void release('wait-second')}>Accept second</button>
  <button id="reject-first" onclick={() => void release('wait-first', 'Stale rejection')}>
    Reject first
  </button>

  <pre id="form-events">{JSON.stringify(trace)}</pre>
  <pre id="form-event-pending">{JSON.stringify(pending)}</pre>
  <pre id="form-event-finished">{JSON.stringify(finished)}</pre>
  <pre id="form-event-tables">{JSON.stringify(identities)}</pre>
</main>
