<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { AutoComplete, ConfigProvider, Select, enUS,
    type SelectFlattenOption, type SelectRef, type SelectScrollConfig, type SelectScrollOffsetInfo } from 'antd-svelte';
  import { encodeSelectData, selectDataFieldNames, selectDataGeometry, selectDataKeyValue, selectDataOwn,
    selectDataRaw, type SelectDataAction, type SelectDataDataset, type SelectDataMapping,
    type SelectDataSample, type SelectDataSettings } from './select-data-cases';

  type RawOption = Record<string, unknown>;
  let { sample, named = false, groupAttributes = false }: {
    sample: SelectDataSample;
    named?: boolean;
    groupAttributes?: boolean
  } = $props();
  const DataSelect = Select<string, 'multiple' | 'tags' | undefined, RawOption>;
  const DataAutoComplete = AutoComplete<RawOption>;
  const theme = { token: { motion: false }, cssVar: { key: 'select-data' } };
  const position = selectDataGeometry.root;
  const datasets = new Map<SelectDataDataset, RawOption[]>();
  const mappings = new Map<SelectDataMapping, ReturnType<typeof selectDataFieldNames>>();
  const originals = new Map<string, RawOption>();
  const producerCalls: Record<'filter' | 'sort' | 'render', unknown[]> = {
    filter: [],
    sort: [],
    render: []
  };
  const semantic = {
    filter: new Map<string, unknown>(),
    sort: new Map<string, unknown>(),
    render: new Map<string, unknown>()
  };
  const rawEvents: unknown[][] = [];
  let events = $state.raw<unknown[][]>([]);
  let offsets = $state.raw<unknown[]>([]);
  let settings = $state<SelectDataSettings>(untrack(() => ({ ...sample })));
  let open = $state(false);
  let model = $state<unknown>(untrack(() => sample.initialValue ?? (sample.mode ? [] : sample.family === 'auto-complete' ? '' : null)));
  let query = $state(untrack(() => sample.family === 'auto-complete' ? String(sample.initialValue ?? '') : ''));
  let host = $state<HTMLElement>();
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let selectEditor = $state<HTMLInputElement>();
  let autoEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let alive = true;
  let name = $derived(named ? 'data-selection' : undefined);
  let options = $derived(data(settings.dataset));
  let localProps = $derived(propsFor(settings));
  let filter = $derived(settings.filter === 'custom' ? customFilter : settings.filter === 'on');
  let sorter = $derived(settings.sort ? sort : undefined);
  let latestReceipts = untrack(() => receiptsFor(propsFor(settings), data(settings.dataset)));
  $effect(() => { latestReceipts = receiptsFor(localProps, options); });
  onDestroy(() => { alive = false; });

  function register(value: unknown) {
    if (!value || typeof value !== 'object') {
      return;
    }
    const own = Object.getOwnPropertyDescriptors(value);
    if (typeof own.auditToken?.value === 'string') {
      originals.set(
        own.auditToken.value,
        value as RawOption
      );
    }
    for (const descriptor of Object.values(own)) {
      if ('value' in descriptor) register(descriptor.value);
    }
  }
  function data(dataset: SelectDataDataset) {
    let records = datasets.get(dataset);
    if (!records) {
      records = selectDataRaw(dataset);
      if (groupAttributes) {
        for (const record of records) {
          if (Array.isArray(record.options)) {
            Object.assign(record, {
              className: 'data-audit-group-class authored-group', title: 'Authored group title',
              style: { minHeight: 72, backgroundColor: 'rgb(1, 2, 3)' },
              'data-group-extra': 'Authored group data', 'aria-label': 'Authored group aria', role: 'alert'
            });
          }
        }
      }
      register(records);
      datasets.set(dataset, records);
    }
    return records;
  }
  function mapping(value: SelectDataMapping) {
    if (!mappings.has(value)) mappings.set(value, selectDataFieldNames(value));
    return mappings.get(value);
  }
  function propsFor(current: SelectDataSettings) {
    const props: { fieldNames?: ReturnType<typeof selectDataFieldNames>; virtual?: false } = {};
    if (current.mapping !== 'omitted') props.fieldNames = mapping(current.mapping);
    if (current.virtual === 'false') props.virtual = false;
    return props;
  }
  function option(value: unknown) {
    const descriptors = value && typeof value === 'object' ? Object.getOwnPropertyDescriptors(value) : {};
    const token = typeof descriptors.auditToken?.value === 'string' ? descriptors.auditToken.value : null;
    const original = token ? originals.get(token) : undefined;
    const originalDescriptors = original ? Object.getOwnPropertyDescriptors(original) : {};
    const common = { data: encodeSelectData(value), enumerableKeys: value && typeof value === 'object' ? Object.keys(value) : [],
      originalToken: token, sameOriginal: Boolean(original && original === value),
      nestedMetaSame: Boolean(original && descriptors.meta?.value === originalDescriptors.meta?.value) };
    return {
      common,
      raw: {
        ...common,
        ownProperties: selectDataOwn(value),
        originalOwnProperties: selectDataOwn(original)
      }
    };
  }
  function producer(kind: keyof typeof producerCalls, receipt: unknown, rawReceipt = receipt) {
    producerCalls[kind].push(rawReceipt);
    semantic[kind].set(JSON.stringify(receipt), receipt);
  }
  function rendered(flat: SelectFlattenOption<string, RawOption>, info: { index: number }) {
    const receipt = { key: encodeSelectData(flat.key), value: encodeSelectData(flat.value), label: encodeSelectData(flat.label),
      group: encodeSelectData(flat.group), groupOption: encodeSelectData(flat.groupOption), data: option(flat.data).common, index: info.index };
    producer('render', receipt, { ...receipt, data: option(flat.data).raw });
    return info.index;
  }
  function record(...event: unknown[]) {
    events = [...events, event];
    rawEvents.push(event);
  }
  function recordOption(kind: string, value: unknown, argument: unknown) {
    const receipt = Array.isArray(argument) ? argument.map(option) : option(argument);
    events = [...events, [kind, encodeSelectData(value), Array.isArray(receipt) ? receipt.map(item => item.common) : receipt.common]];
    rawEvents.push([kind, encodeSelectData(value), Array.isArray(receipt) ? receipt.map(item => item.raw) : receipt.raw]);
  }
  function change(value: unknown, argument: unknown) {
    model = value ?? null;
    if (sample.family === 'auto-complete') query = String(value ?? '');
    recordOption('change', value, argument);
  }
  function selected(value: unknown, argument: unknown) { recordOption('select', value, argument); }
  function deselected(value: unknown, argument: unknown) {
    recordOption('deselect', value, argument);
  }
  function searched(text: string) {
    query = text;
    record('search', text);
  }
  function opening(value: boolean) {
    open = value;
    record('open', value);
  }
  function active(value: string | null) { record('active', encodeSelectData(value)); }
  function cleared() { record('clear'); }
  function scrolled(event: UIEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    const node = event.currentTarget;
    record('scroll', { trusted: event.isTrusted, top: node.scrollTop, left: node.scrollLeft,
      clientHeight: node.clientHeight, scrollHeight: node.scrollHeight, tag: node.tagName,
      holder: node.classList.contains('ant-select-dropdown-list-holder') });
  }
  function customFilter(text: string, item: RawOption) {
    producer('filter', { text, option: option(item).common }, { text, option: option(item).raw });
    return String(item.searchToken ?? '').includes(text);
  }
  function sort(a: RawOption, b: RawOption, info: { searchValue: string }) {
    producer('sort', { a: option(a).common, b: option(b).common, searchValue: info.searchValue },
      { a: option(a).raw, b: option(b).raw, searchValue: info.searchValue });
    return Number(a.rank ?? 0) - Number(b.rank ?? 0);
  }
  function sizeOffset(info: SelectScrollOffsetInfo) {
    const size = info.getSize('key-v-00', 'key-v-02');
    offsets = [...offsets, { align: encodeSelectData(info.align), size: encodeSelectData(size) }];
    return Number(size.bottom) - size.top;
  }
  function scrollTarget(action: Extract<SelectDataAction, { type: 'ref' }>): SelectScrollConfig {
    const target = action.target;
    if (target.kind === 'number') {
      return target.index;
    }
    const alignment = { ...('align' in target ? { align: target.align } : {}),
      ...('offset' in target ? { offset: target.offset === 'get-size' ? sizeOffset : target.offset } : {}) };
    return 'index' in target ? { index: target.index, ...alignment }
      : { key: selectDataKeyValue(target.key), ...alignment };
  }
  function receiptsFor(passed: ReturnType<typeof propsFor>, passedOptions: RawOption[]) {
    return { fieldNames: { present: Object.hasOwn(passed, 'fieldNames'), value: encodeSelectData(passed.fieldNames),
      sameOriginal: Object.is(passed.fieldNames, mapping(settings.mapping)) },
    options: { sameOriginal: passedOptions === data(settings.dataset), data: encodeSelectData(passedOptions),
      rows: [...originals.values()].filter(item => String(item.auditToken).startsWith(settings.dataset + ':')).map(option) },
    mode: encodeSelectData(sample.mode), virtual: {
      present: Object.hasOwn(passed, 'virtual'),
      value: encodeSelectData(passed.virtual)
    },
    searchOwner: { whileOpenCallback: true, whileClosedOwnUndefined: true } };
  }
  export function update(action: SelectDataAction) {
    if (action.type === 'props') {
      settings = { ...settings, ...action.set };
    }
    else if (action.type === 'open') {
      open = action.value;
    }
    else if (action.type === 'value') {
      model = action.value;
      if (sample.family === 'auto-complete') query = String(action.value ?? '');
    }
    else if (action.type === 'query') {
      query = action.text;
    }
    else if (action.type === 'ref') control?.scrollTo(scrollTarget(action));
  }
  export function readRefs() {
    const root = publicRoot ?? host?.querySelector<HTMLElement>('.select-data-control') ?? undefined;
    const publicEditor = sample.family === 'select' ? selectEditor : autoEditor;
    const editor = publicEditor ?? root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea') ?? undefined;
    return { root, anchor: root, editor, control, publicRoot, publicEditor };
  }
  export function read() {
    return { settings, open, model: encodeSelectData(model), query, events, rawEvents, offsets,
      receipts: alive ? receiptsFor(localProps, options) : latestReceipts, producerCalls,
      producers: Object.fromEntries(Object.entries(semantic).map(([key, map]) => [key, [...map.values()]])) };
  }
  export function readEvents() { return events; }
  export function readModel() { return encodeSelectData(model); }
  export function readQuery() { return query; }
</script>

{#snippet optionRender(flat: SelectFlattenOption<string, RawOption>, info: { index: number })}
  <span data-select-data-render={rendered(flat, info)}>{flat.label}</span>
{/snippet}

<section data-select-data-case={sample.id} data-select-data-family={sample.family}
  data-select-data-bound={Boolean(control)} bind:this={host}
  style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {theme} popupOverflow="viewport" locale={enUS}>
    <div data-select-data-position style={`position:absolute;left:${position.left}px;top:${position.top}px;width:${position.width}px`}>
      {#if sample.family === 'select'}
        <DataSelect {...localProps} id="data-field" class="select-data-control" style="width:100%" {name}
          {options} value={Array.isArray(model) ? model : typeof model === 'string' ? model : undefined}
          {open} mode={sample.mode} allowClear listHeight={100}
          tokenSeparators={sample.tokens ? [','] : undefined}
          showSearch={{ searchValue: query, filterOption: filter, filterSort: sorter, onSearch: open ? searched : undefined }}
          optionRender={sample.render ? optionRender : undefined}
          onChange={change} onSelect={selected} onDeselect={deselected} onClear={cleared}
          onOpenChange={opening} onActive={active} onPopupScroll={scrolled}
          bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={selectEditor} />
      {:else}
        <DataAutoComplete {...localProps} id="data-field" class="select-data-control" style="width:100%" {name}
          {options} value={query} {open} allowClear listHeight={100}
          showSearch={{ filterOption: filter, onSearch: open ? searched : undefined }}
          onChange={change} onSelect={selected} onClear={cleared}
          onOpenChange={opening} onActive={active} onPopupScroll={scrolled}
          bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoEditor} />
      {/if}
    </div>
  </ConfigProvider>
  <button type="button" data-select-data-outside style="position:fixed;left:16px;top:80px">Outside data</button>
  <output data-select-data-receipts hidden>{JSON.stringify(read().receipts)}</output>
  <output data-select-data-model hidden>{JSON.stringify(read().model)}</output>
  <output data-select-data-query hidden>{JSON.stringify(query)}</output>
  <output data-select-data-events hidden>{JSON.stringify(events)}</output>
  <output data-select-data-offsets hidden>{JSON.stringify(offsets)}</output>
  <output data-select-data-producers hidden>{JSON.stringify(read().producers)}</output>
  <output data-select-data-producer-calls hidden>{JSON.stringify(producerCalls)}</output>
  <div data-select-data-command hidden {@attach node => {
    const onUpdate = (event: Event) => update((event as CustomEvent<SelectDataAction>).detail);
    const onRefs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    const onRead = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    node.addEventListener('dataupdate', onUpdate); node.addEventListener('datarefs', onRefs); node.addEventListener('dataread', onRead);
    return () => { node.removeEventListener('dataupdate', onUpdate); node.removeEventListener('datarefs', onRefs);
      node.removeEventListener('dataread', onRead); };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
