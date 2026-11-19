<script lang="ts">
  import { createRawSnippet, onDestroy, untrack, type Snippet } from 'svelte';
  import { ConfigProvider, Select, enUS, type RenderEmptyContent, type SelectLabelRenderInfo,
    type SelectLabelValue, type SelectProps, type SelectRef } from 'antd-svelte';
  import { encodeSelectValue, materializeSelectValue, selectValueData, selectValueFieldNames,
    selectValueGeometry, selectValueNodeRecipe, selectValueNodeTokens, selectValueOwn, selectValueRender,
    type SelectValueAction, type SelectValueDataset, type SelectValueRenderer,
    type SelectValueSample } from './select-value-cases';

  type RawValue = string | number;
  type RawOption = Record<string, unknown>;
  type ValueItem = RawValue | SelectLabelValue<RawValue>;
  type OwnedValue = ValueItem | ValueItem[] | null | undefined;
  type NativeProps = SelectProps<RawValue, 'multiple' | 'tags' | undefined, RawOption, boolean>;
  type PassedProps = Pick<NativeProps, 'value' | 'defaultValue' | 'mode' | 'tokenSeparators'
    | 'fieldNames' | 'labelInValue' | 'optionLabelProp' | 'labelRender'>;
  let { sample, name, required, capture }: { sample: SelectValueSample; name?: string; required?: boolean;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs> } } = $props();
  const ValueSelect = Select<RawValue, 'multiple' | 'tags' | undefined, RawOption, boolean>;
  const theme = { token: { motion: false }, cssVar: { key: 'select-value' } };
  const position = selectValueGeometry.root;
  const nodes = new Map<string, Snippet>();
  const nodeTokens = new Map<unknown, string>();
  const datasets = new Map<SelectValueDataset, RawOption[]>();
  const originals = new Map<string, RawOption>();
  const events = $state.raw<unknown[][]>([]);
  const rawEvents: unknown[][] = [];
  const producerCalls: unknown[] = [];
  const producers = new Map<string, unknown>();
  const renderers = new Map<SelectValueRenderer, NonNullable<NativeProps['labelRender']>>();
  for (const token of selectValueNodeTokens) {
    const recipe = selectValueNodeRecipe(token);
    const attributes = Object.entries(recipe.attributes).map(([key, value]) => `${key}="${escape(value)}"`).join(' ');
    const node = createRawSnippet(() => ({ render: () => `<${recipe.tag} ${attributes}>${escape(recipe.text)}</${recipe.tag}>` }));
    nodes.set(token, node);
    nodeTokens.set(node, token);
  }
  for (const kind of ['text', 'undefined', 'null', 'false', 'empty', 'zero', 'rich', 'array'] as const) {
    renderers.set(kind, (item: SelectLabelRenderInfo<RawValue>) => {
      const result = selectValueRender(kind, { ...item }, rich);
      const receipt = {
        kind,
        argument: encode(item),
        ownProperties: selectValueOwn(item),
        result: encode(result)
      };
      producerCalls.push({ ...receipt, rawArgument: rawEncode(item), rawResult: rawEncode(result) });
      producers.set(JSON.stringify(receipt), receipt);
      return result as RenderEmptyContent;
    });
  }
  const initial = untrack(() => materializeSelectValue(sample.initial, rich));
  let settings = $state.raw<SelectValueSample>(untrack(() => ({ ...sample })));
  let model = $state.raw<unknown>(initial);
  let query = $state('');
  let open = $state(false);
  let revision = $state(0);
  let host = $state<HTMLElement>();
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement>();
  let options = $derived(data(settings.dataset));
  let passed = $derived(propsFor());
  let alive = true;
  let latestReceipts = untrack(() => receiptsFor(propsFor(), data(settings.dataset)));
  $effect(() => { latestReceipts = receiptsFor(passed, options); });
  onDestroy(() => { alive = false; });

  function escape(value: string) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll(
      '"',
      '&quot;'
    );
  }
  function rich(token: string) {
    const node = nodes.get(token);
    if (!node) {
      throw Error(`Unknown authored Select label node: ${token}`);
    }
    return node;
  }
  function encode(value: unknown) { return encodeSelectValue(value, nodeTokens); }
  function rawEncode(value: unknown) { return encodeSelectValue(value); }
  function register(value: unknown) {
    if (!value || typeof value !== 'object' || nodeTokens.has(value)) {
      return;
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    if (typeof descriptors.auditToken?.value === 'string') {
      originals.set(
        descriptors.auditToken.value,
        value as RawOption
      );
    }
    for (const descriptor of Object.values(descriptors)) {
      if ('value' in descriptor) register(descriptor.value);
    }
  }
  function data(dataset: SelectValueDataset) {
    let rows = datasets.get(dataset);
    if (!rows) {
      rows = selectValueData(dataset, rich);
      register(rows);
      datasets.set(dataset, rows);
    }
    return rows;
  }
  function item(value: unknown): ValueItem {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }
    if (value && typeof value === 'object') {
      const raw = Reflect.get(value, 'value');
      if (typeof raw === 'string' || typeof raw === 'number') {
        return value as SelectLabelValue<RawValue>;
      }
    }
    throw Error('Frozen Select value input must contain a primitive or labeled primitive');
  }
  function owned(value: unknown): OwnedValue {
    if (value === null || value === undefined) {
      return value;
    }
    if (!Array.isArray(value)) {
      return item(value);
    }
    value.forEach(item);
    return value as ValueItem[];
  }
  function propsFor(): PassedProps {
    const props: PassedProps = {};
    if (sample.owner === 'value') props.value = owned(model);
    else props.defaultValue = owned(initial);
    if (sample.mode) props.mode = sample.mode;
    if (sample.tokens) props.tokenSeparators = [','];
    const fields = selectValueFieldNames(settings.dataset);
    if (fields !== undefined) props.fieldNames = fields;
    if (settings.labelInValue !== 'omitted') props.labelInValue = settings.labelInValue === 'true';
    if (settings.optionLabelProp !== 'omitted') {
      props.optionLabelProp = settings.optionLabelProp === 'undefined'
        ? undefined : settings.optionLabelProp === 'empty' ? '' : settings.optionLabelProp;
    }
    if (settings.renderer !== 'omitted') props.labelRender = renderers.get(settings.renderer);
    return props;
  }
  function option(value: unknown) {
    const descriptors = value && typeof value === 'object' ? Object.getOwnPropertyDescriptors(value) : {};
    const token = typeof descriptors.auditToken?.value === 'string' ? descriptors.auditToken.value : null;
    const original = token ? originals.get(token) : undefined;
    const common = { data: encode(value), enumerableKeys: value && typeof value === 'object' ? Object.keys(value) : [],
      originalToken: token, sameOriginal: Boolean(original && original === value),
      nestedMetaSame: Boolean(original && descriptors.meta?.value === Object.getOwnPropertyDescriptor(
        original,
        'meta'
      )?.value) };
    return { common, raw: { ...common, data: rawEncode(value), semanticData: common.data,
      ownProperties: selectValueOwn(value), originalOwnProperties: selectValueOwn(original) } };
  }
  function record(...event: unknown[]) {
    events.push(event);
    rawEvents.push(event);
    revision += 1;
  }
  function recordOption(kind: string, value: unknown, argument: unknown) {
    const receipt = Array.isArray(argument) ? argument.map(option) : option(argument);
    events.push([kind, encode(value), Array.isArray(receipt) ? receipt.map(entry => entry.common) : receipt.common]);
    rawEvents.push([kind, rawEncode(value), Array.isArray(receipt) ? receipt.map(entry => entry.raw) : receipt.raw,
      { semanticValue: encode(value), ownProperties: selectValueOwn(value),
        entries: Array.isArray(value) ? value.map(entry => selectValueOwn(entry)) : null }]);
    revision += 1;
  }
  function changed(value: unknown, argument: unknown) {
    model = value;
    recordOption('change', value, argument);
  }
  function selected(value: unknown, argument: unknown) { recordOption('select', value, argument); }
  function deselected(value: unknown, argument: unknown) {
    recordOption('deselect', value, argument);
  }
  function cleared() { record('clear'); }
  function opening(value: boolean) {
    open = value;
    record('open', value);
  }
  function active(value: RawValue | null) { record('active', encode(value)); }
  function searched(value: string) {
    query = value;
    record('search', value);
  }
  function receiptsFor(props: PassedProps, passedOptions: RawOption[]) {
    return { owner: sample.owner,
      value: { present: Object.hasOwn(props, 'value'), value: encode(props.value) },
      defaultValue: {
        present: Object.hasOwn(props, 'defaultValue'),
        value: encode(props.defaultValue)
      },
      mode: encode(props.mode), labelInValue: {
        present: Object.hasOwn(props, 'labelInValue'),
        value: encode(props.labelInValue)
      },
      optionLabelProp: {
        present: Object.hasOwn(props, 'optionLabelProp'),
        value: encode(props.optionLabelProp)
      },
      labelRender: { present: Object.hasOwn(props, 'labelRender'), kind: settings.renderer,
        sameOriginal: props.labelRender === renderers.get(settings.renderer) },
      fieldNames: { present: Object.hasOwn(props, 'fieldNames'), value: encode(props.fieldNames) },
      options: { sameOriginal: passedOptions === data(settings.dataset), data: encode(passedOptions),
        rows: [...originals.values()].filter(entry => String(entry.auditToken).startsWith(settings.dataset + ':')).map(option) },
      searchOwner: { whileOpenCallback: true, whileClosedOwnUndefined: true } };
  }
  export function update(action: SelectValueAction) {
    if (action.type === 'props') settings = { ...settings, ...action.set };
    else if (action.type === 'value') model = materializeSelectValue(action.value, rich);
    else if (action.type === 'query') query = action.text;
    else if (action.type === 'open') open = action.value;
  }
  export function readRefs() {
    const root = publicRoot ?? host?.querySelector<HTMLElement>('.select-value-control') ?? undefined;
    return { root, editor, control, publicRoot, publicEditor: editor };
  }
  export function read() {
    return { settings, open, model: encode(model), rawModel: rawEncode(model), query, events, rawEvents,
      producerCalls, producers: [...producers.values()], receipts: alive ? receiptsFor(
        passed,
        options
      ) : latestReceipts };
  }
  export function readEvents() { return events; }
  export function readModel() { return encode(model); }
  export function readQuery() { return query; }
  function liveOutput(value: unknown) {
    void revision;
    return JSON.stringify(value);
  }

  // React owner creates its outputs before Select renders and invokes labelRender.
  const serverOutputs = untrack(() => typeof window === 'undefined' ? {
    receipts: receiptsFor(propsFor(), data(settings.dataset)), model: encode(model), query,
    events: JSON.stringify(events), producers: JSON.stringify([...producers.values()])
  } : undefined);
  untrack(() => { if (capture) {
    capture.read = read;
    capture.readRefs = readRefs;
  } });
</script>

<section data-select-value-case={sample.id} data-select-value-bound={Boolean(control)} bind:this={host}
  style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {theme} popupOverflow="viewport" locale={enUS}>
    <!-- Restore the authored Source owner font inside Native ConfigProvider's reset wrapper. -->
    <div data-select-value-position style={`position:absolute;left:${position.left}px;top:${position.top}px;width:${position.width}px;font-family:initial;font-size:16px;line-height:normal`}>
      <ValueSelect {...passed} id="value-field" class="select-value-control" style="width:100%" {name} {required}
        {options} {open} allowClear listHeight={140} placeholder="Choose value" aria-label="Selected values"
        showSearch={{ searchValue: query, filterOption: settings.filter, onSearch: open ? searched : undefined }}
        onChange={changed} onSelect={selected} onDeselect={deselected} onClear={cleared}
        onOpenChange={opening} onActive={active}
        bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={editor} />
    </div>
  </ConfigProvider>
  <button type="button" data-select-value-outside style="position:fixed;left:16px;top:80px">Outside value</button>
  <output data-select-value-receipts hidden>{JSON.stringify(serverOutputs?.receipts ?? read().receipts)}</output>
  <output data-select-value-model hidden>{JSON.stringify(serverOutputs?.model ?? read().model)}</output>
  <output data-select-value-query hidden>{JSON.stringify(serverOutputs ? serverOutputs.query : query)}</output>
  <output data-select-value-events hidden>{serverOutputs ? serverOutputs.events : liveOutput(events)}</output>
  <output data-select-value-producers hidden>{serverOutputs ? serverOutputs.producers : liveOutput([...producers.values()])}</output>
  <div data-select-value-command hidden {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<SelectValueAction>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('valueupdate', updating); node.addEventListener('valueread', reading); node.addEventListener('valuerefs', refs);
    return () => { node.removeEventListener('valueupdate', updating); node.removeEventListener('valueread', reading);
      node.removeEventListener('valuerefs', refs); };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
