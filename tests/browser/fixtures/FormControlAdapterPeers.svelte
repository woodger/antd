<script lang="ts">
  import { createForm, Form, FormItem, Input, type FormItemControl } from '@woodger/antd';

  const model = createForm({ initialValues: { shared: 'seed' } });
  const manual = createForm({ initialValues: { slug: 'ready' } });
  const blur = createForm({ initialValues: { text: 'ready' } });
  let showRight = $state(true);
  let validators = $state.raw<unknown[][]>([]);
  let blurChecks = $state(0);
  let retained: FormItemControl | undefined;

  function validateShared(editor: string, value: unknown) {
    validators = [...validators, [editor, value]];
  }

  function validateBlur() {
    blurChecks++;
  }
</script>

<Form form={model}>
  <FormItem
    name="shared"
    normalize={(value) => 'left:' + String(value)}
    rules={[{ validator: (value) => validateShared('left', value) }]}
  >
    {#snippet control(editor)}
      <Input {...editor.props} id="left" onChange={(event) => editor.emit('onChange', event)} />
    {/snippet}
  </FormItem>
  {#if showRight}
    <FormItem
      name="shared"
      normalize={(value) => 'right:' + String(value)}
      rules={[{ validator: (value) => validateShared('right', value) }]}
    >
      {#snippet control(editor)}
        <Input {...editor.props} id="right" onChange={(event) => {
          retained = editor;
          editor.emit('onChange', event);
        }} />
      {/snippet}
    </FormItem>
  {/if}
</Form>
<output id="adapter-pair-data">{JSON.stringify({ value: model.getFieldValue('shared'), validators })}</output>
<button type="button" onclick={() => { showRight = false; }}>Remove right editor</button>
<button type="button" onclick={() => retained?.emit('onChange', 'retired')}>Dispatch from removed editor</button>

<Form form={manual}>
  <FormItem name="slug" normalize={(value: string) => value.toLowerCase()}>
    <Input
      id="adapter-manual"
      value={manual.getFieldValue('slug')}
      onValueChange={(value) => manual.changeFieldValue('slug', value)}
    />
  </FormItem>
</Form>
<output id="adapter-manual-value">{manual.getFieldValue('slug')}</output>

<Form form={blur}>
  <FormItem name="text" validateTrigger="onBlur" rules={[{ validator: validateBlur }]}>
    {#snippet control(editor)}
      <Input
        {...editor.props}
        id="adapter-blur"
        onChange={(event) => editor.emit('onChange', event)}
        onBlur={(event) => editor.emit('onBlur', event)}
      />
    {/snippet}
  </FormItem>
</Form>
<output id="adapter-blur-checks">{blurChecks}</output>
