<script module lang="ts">
  export type FormHost = 'form' | 'section' | 'custom' | 'bare' | 'no-ref';
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import {
    createForm, Form, FormItem, Input,
    type FormComponentProps, type FormRef, type FormRenderContext
  } from '@woodger/antd';
  import FormHostShell from './FormHostShell.svelte';
  import FormHostWithoutRef from './FormHostWithoutRef.svelte';

  type Values = { word: string; untouched: string; };
  let {
    initialHost = 'form', initialRender = false, formAttributes = {}, includeField = true
  }: {
    initialHost?: FormHost;
    initialRender?: boolean;
    formAttributes?: Pick<FormComponentProps<Values>, 'id'>;
    includeField?: boolean;
  } = $props();

  const model = createForm({ initialValues: { word: 'start', untouched: 'extra' } });
  const replacement = createForm({ initialValues: { word: 'replacement', untouched: 'other' } });
  let submitCalls = $state(0);
  const submit = model.submit;
  model.submit = (finish) => {
    submitCalls++;
    return submit(finish);
  };
  let currentForm = $state.raw(model);
  let ref = $state.raw<FormRef<Values>>();
  let retained = $state.raw<FormRef<Values>>();
  let previousElement = $state.raw<HTMLElement>();
  let scope = $state<HTMLDivElement>();
  let root = $state(untrack(() => initialHost));
  let showRender = $state(untrack(() => initialRender));
  let visible = $state(true);
  let disabled = $state(false);
  let events = $state.raw<unknown[]>([]);
  let prevented = $state<boolean>();
  let returnType = $state<string>();
  let draft = $state('');
  let hold = $state(false);
  let release: (() => void) | undefined;

  const hosts = {
    form: 'form', section: 'section', custom: FormHostShell, bare: false, 'no-ref': FormHostWithoutRef
  } as const;

  function record(event: unknown) {
    events = [...events, event];
  }

  function finish(values: Values) {
    record({ type: 'finish', values });
    if (hold) {
      return new Promise<void>(resolve => { release = resolve; });
    }
  }

  function dispatch(type: 'submit' | 'reset') {
    const target = ref?.nativeElement;
    if (target) {
      const event = new Event(type, { bubbles: true, cancelable: true });
      target.dispatchEvent(event);
      prevented = event.defaultPrevented;
    }
  }
</script>

{#snippet field()}
  <FormItem name="word" label="Word" rules={[{ required: true }]}>
    {#snippet control(editor)}
      <Input {...editor.props} data-editor="" onChange={event => editor.emit('onChange', event)} />
    {/snippet}
  </FormItem>
{/snippet}

{#snippet renderContent(view: FormRenderContext<Values>)}
  {#if includeField}{@render field()}{/if}
  <output id="root-value">{JSON.stringify(view.values)}</output>
  <output id="render-model-word">{view.form.getFieldValue('word')}</output>
  <output id="render-handle-bound">{Boolean(view.ref && view.ref === ref)}</output>
  <button id="submit-from-render" type="button" onclick={view.ref?.submit}>Submit from render</button>
  <button id="reset-from-render" type="button" onclick={() => view.form.resetFields()}>
    Reset from render
  </button>
{/snippet}

<section id="form-host-fixture" aria-label="Form host and ref">
  <label for="host-kind">Host kind</label>
  <select id="host-kind" bind:value={root}>
    {#each Object.keys(hosts) as host}
      <option value={host}>{host}</option>
    {/each}
  </select>
  <label for="host-draft">Next word</label>
  <input id="host-draft" bind:value={draft} />
  <button id="host-write" type="button" onclick={() => ref?.setFieldValue('word', draft)}>
    Write through ref
  </button>
  <button id="host-show-render" type="button" onclick={() => { showRender = true; }}>Render values</button>
  <button id="host-native-submit" type="button" onclick={() => dispatch('submit')}>Native submit</button>
  <button id="host-native-reset" type="button" onclick={() => dispatch('reset')}>Native reset</button>
  <button id="host-ref-submit" type="button" onclick={() => { returnType = typeof ref?.submit(); }}>
    Submit through ref
  </button>
  <button id="host-model-submit" type="button" onclick={() => { returnType = typeof currentForm.submit(); }}>
    Submit through model
  </button>
  <button id="host-direct-ref-submit" type="button" onclick={ref?.submit}>Submit directly through ref</button>
  <button id="host-direct-model-submit" type="button" onclick={currentForm.submit}>Submit directly through model</button>
  <button id="host-explicit-submit" type="button" onclick={async () => {
    const result = await ref?.submit(values => record({ type: 'explicit', values }));
    if (result) record({ type: 'result', status: result.status });
  }}>Submit with explicit callback</button>
  <button id="host-replace-model" type="button" onclick={() => { currentForm = replacement; }}>
    Replace model
  </button>
  <button id="host-remember" type="button" onclick={() => {
    retained = ref;
    previousElement = ref?.nativeElement;
  }}>Remember ref</button>
  <button id="host-disable" type="button" onclick={() => { disabled = true; }}>Disable form</button>
  <button id="host-hold" type="button" onclick={() => { hold = true; }}>Hold finish</button>
  <button id="host-release" type="button" onclick={() => {
    hold = false;
    release?.();
    release = undefined;
  }}>Release finish</button>
  <button id="host-remove" type="button" onclick={() => { visible = false; }}>Unmount form</button>
  <button id="host-retained-submit" type="button" onclick={() => retained?.submit()}>
    Submit through retained ref
  </button>

  <div bind:this={scope}
    onsubmit={event => record({ type: 'outer-submit', prevented: event.defaultPrevented })}
    onreset={event => record({ type: 'outer-reset', prevented: event.defaultPrevented })}>
    {#if visible}
      <Form {...formAttributes} bind:ref form={currentForm} name="named-owner" data-owner="root"
        component={hosts[root]} {disabled} rootClassName="form-host-root" style="padding-top:4px"
        children={includeField ? field : undefined} render={showRender ? renderContent : undefined}
        onFinish={finish}
        onFinishFailed={error => record({
          type: 'failed', names: error.errorFields.map(field => field.name)
        })}
        onreset={event => record({
          type: 'reset', prevented: event.defaultPrevented, values: { ...ref?.getFieldsValue(true) }
        })}
      />
    {/if}
  </div>

  <output id="form-host-state">{JSON.stringify({
    refTag: ref?.nativeElement?.tagName ?? null,
    nativeMatches: Boolean(ref?.nativeElement && ref.nativeElement === scope?.querySelector('[data-owner]')),
    store: ref?.getFieldsValue(true) ?? currentForm.getFieldsValue(true),
    originalRefConnected: previousElement?.isConnected,
    bound: Boolean(ref),
    sameRef: retained !== undefined && ref === retained,
    retainedHost: retained?.nativeElement?.tagName ?? null,
    prevented, returnType, submitCalls, events
  })}</output>
</section>
