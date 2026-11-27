<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Select, ConfigProvider, enUS, type SelectProps } from '@woodger/antd';

  const Single = Select<string>;
  const RichSingle = Select<string, undefined, { value: string; label: string | Snippet }>;
  const Multiple = Select<string, 'multiple'>;
  const originalOptions = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  const nextOptions = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta next' }];
  const theme = { token: { motion: false }, cssVar: { key: 'select-value-ownership' } };
  let revision = $state(0);
  let relabeled = $state(false);
  let controlledValue = $state<string | undefined>('a');
  let singleChanges = $state<(string | undefined)[]>([]);
  let multipleChanges = $state<string[][]>([]);
  let controlledChanges = $state<(string | undefined)[]>([]);
  let options = $derived(relabeled ? nextOptions : originalOptions);

  function singleChanged(value: string | undefined) {
    singleChanges = [...singleChanges, value];
    revision += 1;
  }
  function multipleChanged(value: string[]) {
    multipleChanges = [...multipleChanges, [...value]];
    revision += 1;
  }
  function controlledChanged(value: string | undefined) {
    controlledValue = value;
    controlledChanges = [...controlledChanges, value];
    revision += 1;
  }
  // The new record simulates the usual parent spread; the default controls value is absent.
  let singleProps = $derived<SelectProps<string>>({ options, defaultValue: 'a', allowClear: true,
    name: 'default-single', 'aria-label': 'Default single', 'data-parent-revision': revision,
    onChange: singleChanged });
  let multipleProps = $derived<SelectProps<string, 'multiple'>>({ options, defaultValue: ['a'], mode: 'multiple',
    allowClear: true, name: 'default-multiple', 'aria-label': 'Default multiple', 'data-parent-revision': revision,
    onChange: multipleChanged });
  let controlledProps = $derived<SelectProps<string>>({ options, value: controlledValue,
    name: 'controlled', 'aria-label': 'Controlled single', 'data-parent-revision': revision,
    onChange: controlledChanged });
</script>

{#snippet richLabel()}<strong>Beta rich</strong>{/snippet}

<section id="select-value-ownership-fixture">
  <ConfigProvider locale={enUS} {theme}>
    <form data-value-ownership-form style={'display:grid;'
      + 'gap:16px;'
      + 'width:320px'}>
      <Single {...singleProps} />
      <Multiple {...multipleProps} />
      <Single {...controlledProps} />
      <RichSingle options={[{ value: 'a', label: 'Alpha' }, { value: 'b', label: richLabel }]}
        defaultValue="a" name="rich-selection" aria-label="Rich single"
        data-parent-revision={revision} />
    </form>
    <!-- Owner commands remain reachable while the multiple popup is open. -->
    <div style={'position:fixed;'
      + 'right:16px;'
      + 'top:120px;'
      + 'display:grid;'
      + 'gap:8px'}>
      <button type="button" onclick={() => revision += 1}>Unrelated revision</button>
      <button type="button" onclick={() => {
        relabeled = true;
        revision += 1;
      }}>Relabel options</button>
      <button type="button" onclick={() => {
        controlledValue = undefined;
        revision += 1;
      }}>Clear controlled owner</button>
    </div>
    <output aria-label="Single changes">{JSON.stringify(singleChanges)}</output>
    <output aria-label="Multiple changes">{JSON.stringify(multipleChanges)}</output>
    <output aria-label="Controlled changes">{JSON.stringify(controlledChanges)}</output>
  </ConfigProvider>
</section>
