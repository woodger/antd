<script lang="ts">
  import { createForm, Form, FormItem, Input } from '@woodger/antd';
  import type { FormItemUpdateInfo, FormValues } from '@woodger/antd';

  const model = createForm({ initialValues: { enabled: false, note: 'start', guard: 'valid' } });
  let showBranch = $state(false);
  let events = $state.raw<unknown[]>([]);
  let named = $state.raw<unknown[]>([]);
  let finished = $state(0);
  const guard = { label: 'initial' };

  function accept(
    previous: Readonly<FormValues>, next: Readonly<FormValues>, info: FormItemUpdateInfo
  ) {
    events = [...events, { previous, next, info, same: previous === next }];
    return previous.enabled !== next.enabled;
  }

  function compareNamed(
    previous: Readonly<FormValues>, next: Readonly<FormValues>, info: FormItemUpdateInfo
  ) {
    named = [...named, { previous, next, info, same: previous === next }];
    return false;
  }

  function setIntermediate() {
    model.setFields([
      { name: 'enabled', value: true },
      { name: 'note', value: 'middle' },
      { name: 'enabled', value: false },
      { name: 'note', value: 'final' }
    ]);
  }

  function clear() {
    events = [];
    named = [];
  }

  function writeMetadata() {
    guard.label = 'after metadata';
    model.setFields([{ name: 'note', touched: false }]);
  }

  async function validate(validateOnly: boolean) {
    await model.validateFields({ validateOnly });
    finished++;
  }
</script>

<Form form={model}>
  <FormItem name="note" shouldUpdate={compareNamed}>
    {#snippet control(editor)}
      <Input {...editor.props} id="other-note" onChange={(event) => editor.emit('onChange', event)} />
    {/snippet}
  </FormItem>
  <FormItem
    name="guard"
    shouldUpdate
    getValueProps={(value) => ({ value, 'data-guard': guard.label })}
    rules={[{ required: true }]}
  >
    {#snippet control(editor)}<Input {...editor.props} id="guard" />{/snippet}
  </FormItem>
  <FormItem noStyle shouldUpdate>
    {#snippet render(view)}<output id="always">{JSON.stringify(view.values)}</output>{/snippet}
  </FormItem>
  <FormItem noStyle shouldUpdate={accept}>
    {#snippet render(view)}<output id="gated">{JSON.stringify(view.values)}</output>{/snippet}
  </FormItem>
  <FormItem noStyle dependencies={['enabled']}>
    {#snippet render(view)}<output id="related">{JSON.stringify(view.values)}</output>{/snippet}
  </FormItem>
  {#if showBranch}
    <FormItem name="branch" initialValue="visible" preserve={false}>
      {#snippet control(editor)}<Input {...editor.props} id="branch" />{/snippet}
    </FormItem>
  {/if}
</Form>

<output id="extra-events">{JSON.stringify(events)}</output>
<output id="named-events">{JSON.stringify(named)}</output>
<output id="extra-finished">{finished}</output>
<button id="extra-clear" type="button" onclick={clear}>Clear extended events</button>
<button id="externalSibling" type="button"
  onclick={() => model.setFieldsValue({ note: 'external A' })}>First external sibling</button>
<button id="externalSiblingAgain" type="button"
  onclick={() => model.setFieldsValue({ note: 'external B' })}>Second external sibling</button>
<button id="sameSingle" type="button"
  onclick={() => model.setFieldValue('note', 'external B')}>Write same note</button>
<button id="intermediateOnly" type="button" onclick={setIntermediate}>Accept an intermediate patch</button>
<button id="metadataOnly" type="button" onclick={writeMetadata}>Write metadata</button>
<button id="mountBranch" type="button" onclick={() => { showBranch = true; }}>Mount branch</button>
<button id="unmountBranch" type="button" onclick={() => { showBranch = false; }}>Unmount branch</button>
<button id="validate" type="button" onclick={() => validate(false)}>Validate display</button>
<button id="validateOnly" type="button" onclick={() => validate(true)}>Validate silently</button>
