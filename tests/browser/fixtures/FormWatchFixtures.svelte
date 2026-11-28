<script lang="ts">
  import {
    createForm, Form, FormItem, FormList, Input, useFormInstance, useFormWatch, type NamePath
  } from '@woodger/antd';
  import FormWatchContextProbe from './FormWatchContextProbe.svelte';
  import {
    selectProfile, selectHidden, describeSelection, WatchToken, type WatchSampleValues
  } from './form-watch-sample';

  const firstToken = new WatchToken('first');
  const secondToken = new WatchToken('second');
  const first = createForm<WatchSampleValues>({ initialValues: {
    title: 'alpha', hidden: 'private A', profile: { name: 'Anna', age: 31 },
    'profile.name': 'literal', rows: [{ label: 'first' }, { label: 'second' }],
    opaque: firstToken, vector: [undefined]
  } });
  const second = createForm<WatchSampleValues>({
    initialValues: { title: 'beta', hidden: 'private B', profile: { name: 'Boris' } }
  });
  const inner = createForm<WatchSampleValues>({ initialValues: { title: 'inner' } });
  const contextOne = createForm<WatchSampleValues>({ initialValues: { title: 'context one' } });
  const contextTwo = createForm<WatchSampleValues>({ initialValues: { title: 'context two' } });
  let contextModel = $state.raw(contextOne);

  let mounted = $state(true);
  let titleField = $state(true);
  let active = $state<'first' | 'second'>('first');
  let includeUnregistered = $state(false);
  let watchedPath = $state<NamePath>('hidden');
  const chosenModel = $derived(active === 'first' ? first : second);
  let effects = $state.raw<string[]>([]);

  const outside = useFormInstance();
  const outsideWatch = useFormWatch('title');
  const registered = useFormWatch('title', first);
  const full = useFormWatch('title', { form: first, preserve: true });
  const all = useFormWatch(null, { form: first, preserve: true });
  const allKeys = $derived(all.value && Object.keys(all.value).sort());
  const selected = useFormWatch({ get path() { return watchedPath; } }, {
    form: first,
    get preserve() { return includeUnregistered; }
  });
  const chosen = useFormWatch('title', { get form() { return chosenModel; } });
  const nested = useFormWatch(['profile', 'name'], first);
  const literal = useFormWatch('profile.name', first);
  const row = useFormWatch(['rows', 0, 'label'], first);
  const profile = useFormWatch(selectProfile, first);
  const hidden = useFormWatch(selectHidden, { form: first, preserve: true });
  const registeredHidden = useFormWatch(selectHidden, first);
  const opaque = useFormWatch('opaque', { form: first, preserve: true });
  const vector = useFormWatch('vector', { form: first, preserve: true });

  function addProfileEffect(name: string) {
    effects = [...effects, name];
  }

  function batchWrites() {
    first.setFieldValue(['profile', 'name'], 'intermediate');
    first.setFieldValue(['profile', 'name'], 'final name');
  }

  function changeOpaqueValues() {
    first.setFieldValue('vector', [null]);
    first.setFieldValue('opaque', secondToken);
  }
</script>

<main id="form-watch-fixture">
  <output data-watch="outer">{describeSelection({
    outside: outside.current === undefined, outsideWatch: outsideWatch.value,
    registered: registered.value, full: full.value, allKeys, selected: selected.value,
    chosen: chosen.value, nested: nested.value, literal: literal.value, row: row.value,
    profile: profile.value, hidden: hidden.value, registeredHidden: registeredHidden.value,
    opaque: opaque.value, vector: vector.value
  })}</output>

  {#if mounted}
    <Form form={first} name="A" clearOnDestroy>
      {#if titleField}
        <FormItem name="title">
          <Input id="title-A" value={first.values.title}
            onValueChange={(value) => first.changeFieldValue('title', value)} />
        </FormItem>
      {/if}
      <FormItem name={['profile', 'name']}>
        <Input id="name-A" value={first.values.profile?.name} />
      </FormItem>
      <FormItem name="profile.name">
        <Input id="literal-A" value={first.values['profile.name']} />
      </FormItem>
      <FormList name="rows">
        {#snippet children(rows, operations)}
          {#each rows as field (field.key)}
            <FormItem name={[field.name, 'label']}>
              <Input id={'row-' + field.name} value={first.values.rows?.[field.name]?.label} />
            </FormItem>
          {/each}
          <button type="button" id="move-rows" onclick={() => operations.move(0, 1)}>Move rows</button>
        {/snippet}
      </FormList>
      <FormWatchContextProbe id="A-context" expected={first} writeTitle="context write"
        onProfile={addProfileEffect} />
      <Form form={inner} component={false}>
        <FormItem name="title"><Input id="inner-title" value={inner.values.title} /></FormItem>
        <FormWatchContextProbe id="inner-context" expected={inner} />
      </Form>
    </Form>
  {/if}

  <Form form={second} name="B">
    <FormItem name="title"><Input id="title-B" value={second.values.title} /></FormItem>
    <FormWatchContextProbe id="B-context" expected={second} />
  </Form>

  <Form form={contextModel} component={false}>
    <FormItem name="title"><Input id="context-title" value={contextModel.values.title} /></FormItem>
    <FormWatchContextProbe id="swap-context" expected={contextModel} writeTitle="swapped write" />
  </Form>

  <button id="clear-effects" onclick={() => effects = []}>Clear effects</button>
  <button id="merge-registered" onclick={() => first.setFieldsValue({ profile: { name: 'merged model' } })}>
    Merge values
  </button>
  <button id="write-field" onclick={() => first.setFields([{name: ['profile', 'name'], value: 'field packet'}])}>
    Write fields
  </button>
  <button id="reset-field" onclick={() => first.resetFields([['profile', 'name']])}>Reset field</button>
  <button id="write-hidden" onclick={() => first.setFieldValue('hidden', 'private update')}>
    Write hidden value
  </button>
  <button id="toggle-preserve" onclick={() => includeUnregistered = !includeUnregistered}>
    Toggle preserve
  </button>
  <button id="batch-writes" onclick={batchWrites}>Batch writes</button>
  <button id="change-opaque" onclick={changeOpaqueValues}>Replace opaque values</button>
  <button id="toggle-title" onclick={() => titleField = !titleField}>Toggle title field</button>
  <button id="watch-profile" onclick={() => watchedPath = ['profile', 'name']}>Watch profile</button>
  <button id="watch-second" onclick={() => active = 'second'}>Watch second model</button>
  <button id="write-new-model" onclick={() => second.setFieldValue('title', 'B changed')}>Write second</button>
  <button id="write-old-model" onclick={() => first.setFieldValue('title', 'old model write')}>Write first</button>
  <button id="toggle-model" onclick={() => mounted = !mounted}>Toggle first form</button>
  <button id="detached-write" onclick={() => first.setFieldValue('title', 'detached')}>Write while detached</button>
  <button id="swap-context-model"
    onclick={() => contextModel = contextOne === contextModel ? contextTwo : contextOne}>
    Swap contextual model
  </button>
  <pre id="watch-effects">{JSON.stringify(effects)}</pre>
</main>
