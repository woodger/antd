<script module lang="ts">
  export type AutomaticFormValues = {
    word?: string;
    local?: string;
    rows?: { text: string }[];
    modelOnly?: string;
  };
</script>

<script lang="ts">
  import { Form, FormItem, FormList, Input, type FormInstance } from '@woodger/antd';
  import FormInitialValuesProbe from './FormInitialValuesProbe.svelte';

  let { id = 'auto', form }: { id?: string; form?: FormInstance<AutomaticFormValues> } = $props();
  const values = { word: 'from form', rows: [{ text: 'from form list' }] };
  let events = $state.raw<unknown[]>([]);
  let submitted = $state.raw<AutomaticFormValues>();
</script>

<Form {form} name={id} initialValues={values}
  onValuesChange={(...args) => { events = [...events, args]; }}
  onFinish={(values) => { submitted = values; }}>
  <FormItem name="word" label="Word" initialValue="item fallback">
    {#snippet control(editor)}
      <Input {...editor.props} id={id + '-word'} onChange={(event) => editor.emit('onChange', event)} />
    {/snippet}
  </FormItem>
  <FormItem name="local" label="Local" initialValue="from item">
    {#snippet control(editor)}<Input {...editor.props} id={id + '-local'} />{/snippet}
  </FormItem>
  <FormList name="rows" initialValue={[{ text: 'list fallback' }]}>
    {#snippet children(fields)}
      {#each fields as row (row.key)}
        <FormItem name={[row.name, 'text']}>
          {#snippet control(editor)}<Input {...editor.props} class={id + '-row'} />{/snippet}
        </FormItem>
      {/each}
    {/snippet}
  </FormList>
  <FormInitialValuesProbe {id} />
  <button id={id + '-submit'} type="submit">Submit</button>
</Form>
<output id={id + '-events'}>{JSON.stringify(events)}</output>
<output id={id + '-submitted'}>{JSON.stringify(submitted)}</output>
