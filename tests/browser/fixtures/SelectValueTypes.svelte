<script lang="ts">
  import { Select, type SelectLabelValue } from '@woodger/antd-svelte';

  interface Option {
    value: number;
    label: string;
    meta: { owner: string };
  }
  const options: readonly Option[] = [{ value: 0, label: 'Zero', meta: { owner: 'input' } }];
  const LabeledSelect = Select<number, undefined, Option, true>;
  const PrimitiveSelect = Select<number>;
  let selected = $state<SelectLabelValue<number>>({ value: 0, label: 'Owner zero' });
  let multiple = $state<SelectLabelValue<number>[]>([{ value: 0 }]);
  let primitive = $state<number>();
</script>

<Select labelInValue {options} value={selected}
  onChange={(value, option) => {
    const next: SelectLabelValue<number> | undefined = value;
    const owner: string | undefined = option?.meta.owner;
    void [next, owner];
  }} />
<Select mode="multiple" labelInValue {options} bind:value={multiple}
  onSelect={(value, option) => {
    const next: SelectLabelValue<number> = value;
    const owner: string = option.meta.owner;
    void [next, owner];
  }} />
<LabeledSelect {options} bind:value={selected}
  labelInValue labelRender={item => typeof item.label === 'string' ? item.label : item.value} />
<PrimitiveSelect options={options} bind:value={primitive} />
