<script lang="ts">
  import { Checkbox, createForm, Form, FormItem, Input } from '@woodger/antd';
  import type { FormItemUpdateInfo, FormValues } from '@woodger/antd';
  import FormItemUpdateExtended from './FormItemUpdateExtended.svelte';

  const original = createForm({ initialValues: { enabled: false, note: 'start' } });
  const replacement = createForm({ initialValues: { enabled: true, note: 'replacement' } });
  let model = $state.raw(original);
  let events = $state.raw<unknown[]>([]);

  function accept(
    previous: Readonly<FormValues>, next: Readonly<FormValues>, info: FormItemUpdateInfo
  ) {
    events = [...events, { previous, next, info }];
    return previous.enabled !== next.enabled;
  }

  function writeBatch() {
    model.setFields([
      { name: 'note', value: 'first' },
      { name: 'enabled', value: true },
      { name: 'note', value: 'last' }
    ]);
  }
</script>

<main id="form-item-update-fixture">
  <Form form={model}>
    <FormItem name="enabled" valuePropName="checked">
      {#snippet control(editor)}
        <Checkbox {...editor.props} id="enabled" onChange={(event) => editor.emit('onChange', event)}>
          Enabled
        </Checkbox>
      {/snippet}
    </FormItem>
    <FormItem name="note" label="Note" htmlFor="note">
      {#snippet control(editor)}
        <Input {...editor.props} id="note" onChange={(event) => editor.emit('onChange', event)} />
      {/snippet}
    </FormItem>
    <FormItem shouldUpdate>
      {#snippet render(view)}
        <output id="unconditional">{JSON.stringify(view.values)}</output>
        <input id="render-draft" aria-label="Local draft" value="local" />
      {/snippet}
    </FormItem>
    <FormItem noStyle shouldUpdate={accept}>
      {#snippet render(view)}<output id="predicate">{JSON.stringify(view.values)}</output>{/snippet}
    </FormItem>
    <FormItem noStyle dependencies={['enabled']}>
      {#snippet render(view)}<output id="dependent">{JSON.stringify(view.values)}</output>{/snippet}
    </FormItem>
  </Form>

  <output id="form-update-events">{JSON.stringify(events)}</output>
  <button id="clear-update-events" type="button" onclick={() => { events = []; }}>Clear events</button>
  <button id="external" type="button"
    onclick={() => model.setFieldsValue({ enabled: false, note: 'remote' })}>Merge values</button>
  <button id="single" type="button" onclick={() => model.setFieldValue('note', 'single')}>Set note</button>
  <button id="batch" type="button" onclick={writeBatch}>Set records</button>
  <button id="metadata" type="button"
    onclick={() => model.setFields([{ name: 'note', touched: true }])}>Touch note</button>
  <button id="resetOne" type="button" onclick={() => model.resetFields(['note'])}>Reset note</button>
  <button id="resetAll" type="button" onclick={() => model.resetFields()}>Reset all</button>
  <button id="swap-update-model" type="button" onclick={() => { model = replacement; }}>Switch model</button>
  <button id="write-inactive-model" type="button"
    onclick={() => original.setFieldsValue({ enabled: true, note: 'old model' })}>Write old model</button>

  <FormItemUpdateExtended />
</main>
