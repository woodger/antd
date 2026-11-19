<script lang="ts">
  import { createRawSnippet, onDestroy, untrack, type Snippet } from 'svelte';
  import { AutoComplete, ConfigProvider, enUS, type AutoCompleteInput, type AutoCompleteProps,
    type SelectFlattenOption, type SelectLabelRenderInfo, type SelectRef, type SelectTagInfo, type RenderEmptyContent } from 'antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { AutocompleteRenderSample, AutocompleteRenderSettings, AutocompleteRenderAction,
    AutocompleteRenderKind, AutocompleteLabelKind } from '../autocomplete-render-cases.mjs';

  type Data = Record<string, unknown>;
  type Option = SelectFlattenOption<string, Data>;
  type OptionRenderer = Snippet<[Option, { index: number }]>;
  type LabelRenderer = (info: SelectLabelRenderInfo<string>) => ReturnType<typeof labelValue>;
  type CompatibleProps = AutoCompleteProps<Data> & { optionRender?: OptionRenderer; labelRender?: LabelRenderer;
    tagRender?: Snippet<[SelectTagInfo<string>]>; components?: { input: string } };
  let { sample, capture }: { sample: AutocompleteRenderSample;
    capture?: {
      read?: () => ReturnType<typeof read>;
      readRefs?: () => ReturnType<typeof readRefs>;
      update?: (action: AutocompleteRenderAction) => void
    } } = $props();
  const initial = untrack(() => sample);
  const Completion = AutoComplete<Data>;
  const recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [];
  const lifecycle: Array<{
    kind: string;
    attached: boolean;
    tag: string | null;
    value: string | null
  }> = [];
  const datasets = new Map<string, Data[]>(), nodes = new Map<string, Snippet>();
  const descriptions = new Map<Snippet, unknown>();
  let settings = $state.raw<AutocompleteRenderSettings>({ ...initial, revision: 0 });
  let model = $state<string | undefined>(initial.initialValue);
  let open = $state(Boolean(initial.ssrState?.open));
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let childNode = $state<HTMLInputElement | HTMLTextAreaElement>();
  let alive = true;
  let lastAuthored: { authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
    rawChildSpecification: unknown } | undefined;
  onDestroy(() => { alive = false; });
  const callback = <Value,>(name: string, value: Value): Value => recorder.register(
    value,
    { callback: 'autocomplete-render-' + name }
  );
  const event = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const onChange = callback('change', (value: string | undefined, option: unknown) => {
    model = value;
    event('change', value, option);
  });
  const onSelect = callback(
    'select',
    (value: string, option: unknown) => event('select', value, option)
  );
  const onDeselect = callback(
    'deselect',
    (value: string, option: unknown) => event('deselect', value, option)
  );
  const onOpenChange = callback('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
  const onSearch = callback('search', (value: string) => event('search', value));
  const onClear = callback('clear', () => event('clear'));
  const childChange = callback('child-change', (input: Event) => {
    const node = input.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    event(
      'child-change',
      { value: node.value, tag: node.tagName, defaultPrevented: input.defaultPrevented }
    );
  });
  const childKey = callback('child-key', (input: KeyboardEvent) => {
    const node = input.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    event(
      'child-key',
      {
        key: input.key,
        value: node.value,
        tag: node.tagName,
        defaultPrevented: input.defaultPrevented
      }
    );
  });
  const childRefCallback = callback('child-ref', (node: HTMLInputElement | HTMLTextAreaElement | null) => {
    childNode = node ?? undefined;
    lifecycle.push({
      kind: 'child-ref',
      attached: Boolean(node),
      tag: node?.tagName ?? null,
      value: node?.value ?? null
    });
  });
  function childRegistration(
    node: HTMLInputElement | HTMLTextAreaElement,
    register: AutoCompleteInput['register']
  ) {
    const registration = register(node);
    childRefCallback(node);
    return { destroy() {
      registration.destroy();
      childRefCallback(null);
    } };
  }
  function escape(text: string) {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll(
      '"',
      '&quot;'
    );
  }
  function describe(value: unknown): unknown {
    if (typeof value === 'function') {
      const description = descriptions.get(value as Snippet);
      if (!description) {
        throw Error('Every actual returned snippet has an authored public node specification');
      }
      return description;
    }
    return Array.isArray(value) ? value.map(describe) : value === undefined ? { $: 'undefined' } : value;
  }
  function optionValue(kind: AutocompleteRenderKind, option: Option, info: { index: number }) {
    let result: string | number | boolean | null | undefined | Snippet | readonly unknown[];
    if (kind === 'null') {
      result = null;
    }
    else if (kind === 'scalar') {
      result = 'Scalar ' + info.index;
    }
    else if (kind === 'falsy' && info.index < 5) {
      result = [0, null, false, undefined, ''][info.index];
    }
    else {
      const falsyArray = kind === 'falsy', token = falsyArray ? 'falsy-array' : kind + ':' + info.index + ':' + option.value;
      if (!nodes.has(token)) {
        const text = falsyArray ? 'Array node' : kind + ':' + info.index + ':' + String(option.value);
        const attributes = falsyArray ? ' data-ac-render-result="array"' : ' data-ac-render-result="' + kind + '" data-ac-render-index="' + info.index + '"';
        const node = createRawSnippet(() => ({ render: () => '<strong' + attributes + '>' + escape(text) + '</strong>' }));
        descriptions.set(node, { node: { type: 'strong', key: falsyArray ? 'array' : null,
          props: {
            'data-ac-render-result': falsyArray ? 'array' : kind,
            ...(!falsyArray ? { 'data-ac-render-index': info.index } : {}),
            children: text
          } } });
        if (!falsyArray) {
          recorder.register(
            node,
            {
              node: 'autocomplete-render-option',
              renderer: kind,
              index: info.index,
              value: option.value
            }
          );
        }
        nodes.set(token, node);
      }
      const node = nodes.get(token)!;
      result = falsyArray ? [node, 0, null, ' tail'] : kind === 'array' ? [node, ' tail'] : node;
    }
    recorder.record('optionRender', 'own', [option, info], result, { renderer: kind,
      optionIdentity: recorder.identity(option), rawOptionIdentity: recorder.identity(option.data),
      sameRawAsAuthored: [...datasets.values()].some(options => options.some(item => item === option.data
        || (item.children as Data[] | undefined)?.includes(option.data))), resultDescription: describe(result) });
    return result as string | number | boolean | null | undefined | Snippet | readonly (string | number | boolean | null | undefined | Snippet)[];
  }
  function labelValue(kind: AutocompleteLabelKind, info: SelectLabelRenderInfo<string>) {
    const result = kind === 'zero' ? 0 : kind === 'null' ? null : labelNode;
    if (typeof result === 'function') {
      recorder.register(
        result,
        { node: 'autocomplete-render-label', renderer: kind, value: info.value }
      );
      descriptions.set(
        result,
        { node: {
          type: 'em',
          key: null,
          props: { 'data-ac-render-label': '', children: 'Display ' + String(info.value) }
        } }
      );
    }
    return recorder.record(
      'labelRender',
      'own',
      info,
      result,
      { renderer: kind, resultDescription: describe(result) }
    );
  }
  const labelRenderers = new Map<AutocompleteLabelKind, LabelRenderer>();
  for (const kind of ['rich', 'zero', 'null'] as const) {
    labelRenderers.set(
      kind,
      callback('label-' + kind, info => labelValue(kind, info))
    );
  }
  const optionRenderers = new Map<AutocompleteRenderKind, OptionRenderer>();
  for (const [kind, renderer] of [['rich', rich], ['array', array], ['null', empty], ['scalar', scalar], ['falsy', falsy]] as const)
    optionRenderers.set(kind, callback('option-' + kind, renderer));
  recorder.register(tag, { callback: 'autocomplete-render-tag' });
  recorder.register(child, { node: 'autocomplete-render-child-' + initial.input });
  function tagValue(info: SelectTagInfo<string>) {
    const result = createRawSnippet(() => ({ render: () => '<i data-ac-render-tag="">Unexpected tag</i>' }));
    recorder.register(result, { node: 'autocomplete-render-tag' });
    return recorder.record('tagRender', 'own', info, result);
  }
  function data(kind: AutocompleteRenderSample['dataset'], revision: number) {
    const key = kind + ':' + revision;
    if (!datasets.has(key)) {
      const label = (text: string) => revision ? text + ' revised' : text;
      let result: Data[];
      if (kind === 'mapped') {
        result = [
          { key: 'group-key', heading: label('Mapped group'), children: [
            {
              code: 'Alpha-key',
              text: label('Alpha raw'),
              title: 'Alpha title',
              extra: { role: 'alpha-extra' }
            },
            {
              code: 'Disabled-key',
              text: label('Disabled raw'),
              disabled: true,
              title: 'Disabled title'
            },
            {
              code: 'Beta-key',
              text: label('Beta raw'),
              title: 'Beta title',
              extra: { role: 'beta-extra' }
            }
          ] }, { code: 'Gamma-key', text: label('Gamma raw'), title: 'Gamma title' }
        ];
      }
      else if (kind === 'falsy') {
        result = [{ value: 'zero', label: 0 }, {
          value: 'false',
          label: false
        }, {
          value: 'null',
          label: null
        },
          { value: 'undefined', label: undefined }, { value: 'empty', label: '' }, {
            value: 'array',
            label: 'Array raw'
          }];
      }
      else if (kind === 'virtual') {
        result = Array.from({ length: 120 }, (_, index) => ({ value: 'item-' + index,
          label: label('Item ' + index), key: 'virtual-key-' + index, title: 'Title ' + index, extra: { index } }));
      }
      else {
        result = [{
          value: 'a',
          label: label('Alpha raw'),
          title: 'Alpha title',
          extra: { role: 'alpha-extra' }
        },
          { value: 'disabled', label: label('Disabled raw'), disabled: true, title: 'Disabled title' },
          { value: 'b', label: label('Beta raw'), title: 'Beta title', extra: { role: 'beta-extra' } }];
      }
      for (const item of result) {
        recorder.register(item, { data: kind, revision, key: item.key ?? item.value ?? item.code });
        for (const nested of item.children as Data[] | undefined ?? []) {
          recorder.register(
            nested,
            { data: kind, revision, key: nested.code }
          );
        }
      }
      datasets.set(key, result);
    }
    return datasets.get(key)!;
  }
  const provider = {
    theme: { token: { motion: false }, cssVar: { key: 'autocomplete-render' } },
    popupOverflow: 'viewport' as const
  };
  const childSpecification = initial.input ? { ref: childRefCallback, 'data-ac-render-child': initial.input,
    'aria-label': 'Surface value', className: 'ac-render-child', style: {
      color: 'rgb(9, 31, 57)',
      fontSize: 15
    },
    onChange: childChange, onKeyDown: childKey, ...(initial.input === 'textarea' ? { rows: 2 } : {}) } : undefined;
  let ownerProps = $derived.by(() => {
    const props: Record<string, unknown> = { id: 'autocomplete-render-field', class: 'surface-control ac-render-owner',
      style: { width: '100%' }, options: data(settings.dataset, settings.revision), value: model, open,
      'aria-label': 'Surface value', placeholder: 'AutoComplete render placeholder', listHeight: 140,
      showSearch: { filterOption: settings.filter, onSearch }, tagRender: tag, onChange, onSelect, onDeselect, onOpenChange, onClear,
      ...(settings.virtual ? { virtual: true, listItemHeight: 32 } : { virtual: false }) };
    if (settings.dataset === 'mapped') {
      props.fieldNames = {
        value: 'code',
        label: 'text',
        options: 'children',
        groupLabel: 'heading'
      };
    }
    if (settings.renderer !== 'omitted') props.optionRender = optionRenderers.get(settings.renderer);
    if (settings.labelRenderer !== 'omitted') props.labelRender = labelRenderers.get(settings.labelRenderer);
    if (settings.componentInput) props.components = { input: settings.componentInput };
    if (initial.input) props.children = child;
    return props;
  });
  let completionProps = $derived(ownerProps as CompatibleProps);
  export function update(action: AutocompleteRenderAction) {
    if (action.type === 'props') {
      settings = { ...settings, ...action.set };
    }
    else if (action.type === 'value') model = action.value;
  }
  export function readRefs() { return { control, root: publicRoot, editor, child: childNode }; }
  export function read() {
    if (alive) {
      lastAuthored = { authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
        authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider), rawChildSpecification: recorder.raw(childSpecification) };
    }
    if (!lastAuthored) {
      throw Error('Read the actual live owner before disposal');
    }
    return { settings: recorder.encode(settings), model: recorder.encode(model), open, alive,
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], lifecycle: [...lifecycle], ...lastAuthored };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
    initialCapture.update = update;
  }
</script>

{#snippet rendered(value: RenderEmptyContent)}{#if Array.isArray(value)}{#each value as item}{@render rendered(item)}{/each}{:else if typeof value === 'function'}{@render value()}{:else if typeof value !== 'boolean'}{value}{/if}{/snippet}
{#snippet rich(option: Option, info: { index: number })}{@const result = optionValue('rich', option, info)}{@render rendered(result)}{/snippet}
{#snippet array(option: Option, info: { index: number })}{@const result = optionValue('array', option, info)}{@render rendered(result)}{/snippet}
{#snippet empty(option: Option, info: { index: number })}{@const result = optionValue('null', option, info)}{@render rendered(result)}{/snippet}
{#snippet scalar(option: Option, info: { index: number })}{@const result = optionValue('scalar', option, info)}{@render rendered(result)}{/snippet}
{#snippet falsy(option: Option, info: { index: number })}{@const result = optionValue('falsy', option, info)}{@render rendered(result)}{/snippet}
{#snippet labelNode()}<em data-ac-render-label>Display {model}</em>{/snippet}
{#snippet tag(info: SelectTagInfo<string>)}{@const result = tagValue(info)}{@render rendered(result)}{/snippet}
{#snippet child(context: AutoCompleteInput)}
  {#if initial.input === 'textarea'}<textarea {...context.attributes} data-ac-render-child="textarea" aria-label="Surface value"
    class="ac-render-child" style="color:rgb(9,31,57);font-size:15px" rows="2" use:childRegistration={context.register}
    oninput={input => { childChange(input); context.attributes.oninput(input); }}
    onkeydown={input => { childKey(input); context.attributes.onkeydown(input); }}></textarea>
  {:else}<input {...context.attributes} data-ac-render-child="input" aria-label="Surface value"
    class="ac-render-child" style="color:rgb(9,31,57);font-size:15px" use:childRegistration={context.register}
    oninput={input => { childChange(input); context.attributes.oninput(input); }}
    onkeydown={input => { childKey(input); context.attributes.onkeydown(input); }} />{/if}
{/snippet}

<section data-surface-case={initial.id} data-surface-bound={Boolean(control)} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider} locale={enUS}><div style="position:absolute;left:300px;top:200px;width:280px;font-family:initial;font-size:16px;line-height:normal">
    <Completion {...completionProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={editor} />
  </div></ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside render</button>
  <output hidden data-ac-render-owner>{JSON.stringify(read())}</output>
  <div hidden data-ac-render-command data-surface-command {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<AutocompleteRenderAction>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('acrenderupdate', updating); node.addEventListener('acrenderread', reading); node.addEventListener('surfacerefs', refs);
    return () => { node.removeEventListener('acrenderupdate', updating); node.removeEventListener('acrenderread', reading); node.removeEventListener('surfacerefs', refs); };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
