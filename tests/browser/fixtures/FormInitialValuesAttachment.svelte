<script lang="ts">
  import { createForm, Form, FormItem, Input } from '@woodger/antd';

  let { id, clearOnDestroy }: { id: string; clearOnDestroy?: boolean } = $props();
  type Values = { keep?: string; discarded?: string; extra?: string };
  const model = createForm<Values>({ initialValues: {} });
  let defaults = $state<Values>({ keep: 'first keep', discarded: 'first remove' });
  let open = $state(true);

  function detach() {
    model.setFieldsValue({ keep: 'draft', discarded: 'removed draft' });
    open = false;
  }

  function editWhileDetached() {
    defaults = { keep: 'next keep', discarded: 'next remove', extra: 'next extra' };
    model.setFieldsValue({ keep: 'detached keep', discarded: 'detached remove' });
  }
</script>

{#if open}
  <Form form={model} name={id} initialValues={defaults} {clearOnDestroy}>
    <FormItem name="keep">
      {#snippet control(editor)}<Input {...editor.props} id={id + '-keep'} />{/snippet}
    </FormItem>
    <FormItem name="discarded" preserve={false}>
      {#snippet control(editor)}<Input {...editor.props} id={id + '-remove'} />{/snippet}
    </FormItem>
  </Form>
{/if}
<output id={id + '-values'}>{JSON.stringify(model.getFieldsValue(true))}</output>
<button id={id + '-detach'} type="button" onclick={detach}>Detach</button>
<button id={id + '-edit'} type="button" onclick={editWhileDetached}>Edit detached model</button>
<button id={id + '-attach'} type="button" onclick={() => { open = true; }}>Attach</button>
<button id={id + '-reset'} type="button" onclick={() => model.resetFields()}>Reset</button>
