<script lang="ts">
  // Владелец принимает или отклоняет выбор и управляет той же выдачей options.
  import { ConfigProvider, Select, enUS, type SelectProps } from '@woodger/antd';
  import reference from './ant-design-select-immediate-cache-reference.json' with { type: 'json' };

  type Value = number | string;
  type Option = {
    value?: Value;
    label?: string;
    code?: Value;
    caption?: string;
    compact?: string;
    meta: { id: number; };
  };
  type Props = SelectProps<Value, 'multiple' | undefined, Option, boolean>;
  type Model = Props['value'];

  const sample = new URLSearchParams(location.search).get('sample');
  const profile = reference.passes[0].find(entry => entry.profile.id === sample)?.profile;
  const directBinding = sample === 'bound';
  const functionBinding = sample === 'rejected' || sample === 'rejected-removal';
  if (!profile && !directBinding && !functionBinding) throw new Error('Missing Select owner sample');

  const Subject = Select<Value, 'multiple' | undefined, Option, boolean>;
  const mode = profile?.multiple || directBinding || functionBinding ? 'multiple' : undefined;
  const raw = profile?.fieldNames ? 0 : 'apple';
  const original: Option = profile?.fieldNames
    ? { code: raw, caption: 'Apple label', compact: 'Compact label', meta: { id: 1 } }
    : { value: raw, label: 'Apple label', meta: { id: 1 } };
  const fresh: Option = { ...original, label: 'Fresh label', meta: { id: 2 } };
  const theme = { token: { motion: false } };
  let ownerValue = $state.raw<Model>(mode === 'multiple' ? [] : undefined);
  let listed = $state<'original' | 'hidden' | 'fresh'>('original');
  let rejecting = $state(sample === 'rejected');
  let bindingRequest = $state.raw<Model>();
  let events = $state.raw<unknown[][]>([]);
  let deselectedMetadata = $state(false);
  const hiddenByBinding = $derived(directBinding && Array.isArray(ownerValue) && ownerValue.length > 0);
  const options = $derived(hiddenByBinding || listed === 'hidden'
    ? [] : [listed === 'fresh' ? fresh : original]);
  const props = $derived<Props>({
    mode,
    name: 'fruit',
    'aria-label': 'Fruit',
    options,
    allowClear: true,
    labelInValue: profile?.labelInValue,
    fieldNames: profile?.fieldNames ? { value: 'code', label: 'caption' } : undefined,
    optionLabelProp: profile?.fieldNames ? 'compact' : undefined,
    onChange: change,
    onValueChange: next => record('value', next),
    onSelect: (next, option) => record('select', next, option),
    onDeselect: deselect
  });

  /** Читает принятый владельцем model при каждом запросе из Select. */
  function readValue() {
    return ownerValue;
  }

  /** Function binding позволяет отклонить запрос, сохранив прежнее значение. */
  function writeValue(next: Model) {
    bindingRequest = next;
    if (!rejecting) ownerValue = next;
  }

  /** Ведёт журнал публичных callbacks в фактическом порядке. */
  function record(name: string, next: unknown, option?: Option | Option[]) {
    events = [...events, [name, next ?? null, option ?? null]];
  }

  /** В one-way варианте значение и список обновляются одним вызовом. */
  function change(next: Model, option: Option | Option[] | undefined) {
    record('change', next, option);
    if (!functionBinding && !directBinding) ownerValue = next;
    if (!profile?.delayed && !directBinding) listed = 'hidden';
  }

  /** Проверяет передачу поверхностной копии с исходным вложенным объектом. */
  function deselect(next: unknown, option: Option) {
    deselectedMetadata = option !== original && option !== fresh
      && (option.meta === original.meta || option.meta === fresh.meta);
    record('deselect', next, option);
  }
</script>

<section id="select-immediate-cache-fixture">
  <ConfigProvider locale={enUS} {theme}>
    <form data-select-cache-form style="width: 300px">
      {#if functionBinding}<Subject {...props} bind:value={readValue, writeValue} />
      {:else if directBinding}<Subject {...props} bind:value={ownerValue} />
      {:else if profile?.uncontrolled}<Subject {...props} />
      {:else}<Subject {...props} value={ownerValue} />{/if}
    </form>
  </ConfigProvider>
  <button id="hide" type="button" onclick={() => { listed = 'hidden'; }}>Hide option</button>
  <button id="reappear" type="button" onclick={() => { listed = 'fresh'; }}>Replace option</button>
  <button id="adopt" type="button" onclick={() => { ownerValue = [raw]; }}>Adopt raw value</button>
  <button id="reject" type="button" onclick={() => { rejecting = true; }}>Reject changes</button>
  <button id="accept" type="button" onclick={() => { rejecting = false; }}>Accept changes</button>
  <output id="cache-events">{JSON.stringify(events)}</output>
  <output id="cache-owner">{JSON.stringify(ownerValue ?? null)}</output>
  <output id="cache-binding-request">{JSON.stringify(bindingRequest ?? null)}</output>
  <output id="cache-metadata">{String(deselectedMetadata)}</output>
</section>
