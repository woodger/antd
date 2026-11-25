<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Drawer, Form, FormItem, Input, Modal, Select, createForm
  } from '@woodger/antd';
  import FormStatusReadout from './FormStatusReadout.svelte';

  let { component = 'drawer', initial = false, messages = false }: {
    component?: 'drawer' | 'modal';
    initial?: boolean;
    messages?: boolean;
  } = $props();
  let selected = $state(untrack(() => component));
  let open = $state(untrack(() => initial));
  let outer = $state<'error' | 'warning'>('error');
  const options = [{ value: 'one' }];
  const model = createForm({ initialValues: { owner: '' }, rules: { owner: [{}] } });
  if (untrack(() => messages)) {
    model.setFields([{ name: 'owner', errors: ['Invalid'], warnings: ['Check'] }]);
  }
</script>

{#snippet footer()}
  <div data-style-probe="footer-input"><Input defaultValue="Footer value" /></div>
{/snippet}

{#snippet controls()}
  <div data-style-probe="dialog-input"><Input id="dialog-value" defaultValue="Inner value" /></div>
  <div data-style-probe="dialog-select"><Select {options} value="one" /></div>
  <div data-style-probe="explicit-input"><Input status="warning" /></div>
  <FormItem validateStatus="error" hasFeedback>
    <div data-style-probe="local-input"><Input /></div>
    <div data-style-probe="local-select"><Select {options} value="one" /></div>
  </FormItem>
  <FormStatusReadout scope="dialog-style" />
{/snippet}

{#snippet owner(name?: string)}
  <FormItem {name} validateStatus={outer} hasFeedback>
    <div data-style-probe="owner-input"><Input defaultValue="Outer value" /></div>
    <div data-style-probe="owner-select"><Select {options} value="one" /></div>
    <FormStatusReadout scope="owner-style" />
    {#if selected === 'drawer'}
      <Drawer title="Form style boundary" bind:open getContainer={false} {footer}>
        {@render controls()}
      </Drawer>
    {:else}
      <Modal title="Form style boundary" bind:open getContainer={false} {footer}>
        {@render controls()}
      </Modal>
    {/if}
  </FormItem>
{/snippet}

<section id="dialog-form-style-fixture">
  <label>
    Style boundary <select bind:value={selected}>
      <option value="drawer">Drawer</option>
      <option value="modal">Modal</option>
    </select>
  </label>
  <button type="button" onclick={() => { open = true; }}>Open style boundary</button>
  <button type="button" onclick={() => { outer = 'warning'; }}>Change outer status</button>
  <ConfigProvider theme={{ token: { motion: false } }}>
    {#if messages}
      <Form form={model} component={false}>{@render owner('owner')}</Form>
    {:else}
      {@render owner()}
    {/if}
  </ConfigProvider>
</section>
