<script lang="ts">
  import {
    createForm, Form, FormItem, FormProvider, Input, useFormInstance,
    type FormInstance, type FormProviderChangeInfo, type FormProviderFinishInfo, type FormRef
  } from '@woodger/antd';
  import FormContextSubmitControl from './FormContextSubmitControl.svelte';

  type Values = { name: string; };
  const original = createForm({ initialValues: { name: 'Ada' } });
  const backing = createForm({ initialValues: { name: 'External' } });
  const shadow = createForm({ initialValues: { name: 'Shadow' } });
  const probe = createForm({ initialValues: {} });
  const outside = useFormInstance<Values>();
  let externalCalls = $state(0);
  const external: FormInstance<Values> = Object.freeze({
    ...backing,
    submit(finish: (values: Values) => void | Promise<void>) {
      if (this !== external) {
        throw new Error('The structural model lost its receiver');
      }
      externalCalls++;
      return backing.submit(finish);
    }
  });

  let model = $state.raw<FormInstance<Values>>(original);
  let ownerRef = $state.raw<FormRef<Values>>();
  let shadowRef = $state.raw<FormRef<Values>>();
  let retained = $state.raw<FormRef<Values>>();
  let visible = $state(true);
  let showShadow = $state(false);
  let finishes = $state.raw<unknown[][]>([]);
  let requests = $state.raw<unknown[]>([]);
  let providerInfo = $state.raw<FormProviderFinishInfo>();
  let providerChanges = $state.raw<FormProviderChangeInfo>();
  let heldInfo = $state.raw<FormProviderFinishInfo>();

  function record(...event: unknown[]) {
    finishes = [...finishes, event];
  }

  function onFormFinish(name: string | undefined, info: FormProviderFinishInfo) {
    providerInfo = info;
    if (name === 'checkout') {
      record('provider', name, info.values);
    }
  }

  function submit(source: string, instance?: FormInstance<Values>, handle?: FormRef<Values>) {
    const result = handle?.submit();
    requests = [...requests, {
      source, sameModel: instance === model, sameRef: Boolean(handle && handle === ownerRef),
      returnType: typeof result
    }];
  }

  function submitNamed() {
    const instance = providerInfo?.forms.checkout;
    const handle = providerInfo?.refs?.checkout;
    const result = handle?.submit();
    requests = [...requests, {
      source: 'provider', sameModel: instance === model, sameRef: Boolean(handle && handle === ownerRef),
      returnType: typeof result
    }];
  }

  async function explicit() {
    const result = await providerInfo?.refs?.checkout?.submit(values => record('explicit', values));
    record('result', result?.status);
  }

  function edit() {
    original.changeFieldValue('name', 'Grace');
  }
</script>

<section id="form-context-actions-fixture">
  <FormProvider {onFormFinish} onFormChange={(_, info) => { providerChanges = info; }}>
    {#if visible}
      <Form component={false} name="checkout" bind:ref={ownerRef} form={model}
        onFinish={values => record('finish', values)}>
        {#snippet render(view)}
          <FormItem name="name"><Input value={model.getFieldValue('name')} /></FormItem>
          <FormContextSubmitControl {submit} />
          <button type="button" onclick={() => submit('render', view.form, view.ref)}>
            Submit from render
          </button>
          <FormItem shouldUpdate>
            {#snippet render(item)}
              <button type="button" onclick={item.ref?.submit}>Submit from item</button>
              <output id="item-context">{JSON.stringify({
                sameModel: item.form === model, sameRef: Boolean(item.ref && item.ref === ownerRef)
              })}</output>
            {/snippet}
          </FormItem>
          <output id="render-context">{JSON.stringify({
            sameModel: view.form === model, sameRef: Boolean(view.ref && view.ref === ownerRef)
          })}</output>
        {/snippet}
      </Form>
    {/if}
    {#if showShadow}
      <Form component={false} name="checkout" form={shadow} bind:ref={shadowRef}
        onFinish={values => record('shadow', values)} />
    {/if}
    <Form component={false} name="probe" form={probe} />
  </FormProvider>

  <button type="button" onclick={() => probe.submit()}>Read registry</button>
  <button type="button" onclick={submitNamed}>Submit from provider</button>
  <button type="button" onclick={explicit}>Submit explicit callback</button>
  <button type="button" onclick={edit}>Edit watched field</button>
  <button type="button" onclick={() => { retained = ownerRef; heldInfo = providerInfo; }}>
    Remember owner
  </button>
  <button type="button" onclick={() => { model = external; }}>Use external model</button>
  <button type="button" onclick={() => { showShadow = !showShadow; }}>Toggle duplicate name</button>
  <button type="button" onclick={() => { visible = false; }}>Detach owner</button>
  <button type="button" onclick={() => retained?.submit()}>Submit remembered owner</button>

  <output id="context-actions-state">{JSON.stringify({
    bound: Boolean(ownerRef), outside: Boolean(outside.current || outside.ref),
    requests, finishes, externalCalls,
    registeredModel: providerInfo?.forms.checkout === model ? 'owner'
      : providerInfo?.forms.checkout === shadow ? 'shadow' : null,
    registeredRef: ownerRef && providerInfo?.refs?.checkout === ownerRef ? 'owner'
      : shadowRef && providerInfo?.refs?.checkout === shadowRef ? 'shadow' : null,
    sameChangeRef: Boolean(ownerRef && providerChanges?.refs?.checkout === ownerRef),
    sameChangeModel: providerChanges?.forms.checkout === model,
    onlyNamedRefs: providerInfo?.refs !== undefined && providerInfo.refs.toString === undefined,
    retainedMatches: Boolean(retained && retained === ownerRef),
    retainedHost: retained?.nativeElement?.tagName ?? null,
    snapshotModel: heldInfo?.forms.checkout === original ? 'original' : null,
    snapshotRef: Boolean(retained && heldInfo?.refs?.checkout === retained)
  })}</output>
</section>
