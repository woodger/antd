<script lang="ts">
  import { createRawSnippet, onDestroy, tick, untrack, type Snippet } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, Form, FormItem, createForm, type RenderEmptyContent,
    type SelectProps, type AutoCompleteProps, type SelectConfig, type SelectRef } from 'antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { SelectIconSample, SelectIconSettings, SelectIconAction, SelectIconValue } from '../select-icons-cases.mjs';

  type Data = Record<string, unknown>;
  type Model = SelectIconValue | SelectIconValue[] | undefined;
  type Producer = (...args: unknown[]) => RenderEmptyContent;
  type RenderNode = Exclude<RenderEmptyContent, Snippet> | Producer;
  type NextIconProps = {
    suffixIcon?: RenderEmptyContent; loadingIcon?: RenderEmptyContent;
    suffix?: RenderNode; menuItemSelectedIcon?: RenderNode;
    removeIcon?: RenderNode;
    allowClear?: boolean | { clearIcon?: RenderEmptyContent; label?: string | null };
    showSearch?: boolean | {
      filterOption?: boolean;
      searchIcon?: RenderEmptyContent;
      onSearch?: (value: string) => void
    };
  };
  type AuthoredKeys = 'id' | 'class' | 'style' | 'options' | 'value' | 'open' | 'listHeight' | 'virtual' | 'placeholder'
    | 'aria-label' | 'onChange' | 'onSelect' | 'onDeselect' | 'onClear' | 'onOpenChange' | 'disabled' | 'title' | 'classNames' | 'styles';
  type ChoiceProps = Pick<SelectProps<SelectIconValue, 'multiple' | 'tags' | undefined, Data>, AuthoredKeys | 'mode' | 'loading'> & NextIconProps
    & { onInputKeyDown: (event: KeyboardEvent) => void };
  type CompletionProps = Pick<AutoCompleteProps<Data>, AuthoredKeys | 'onInputKeyDown'> & NextIconProps;
  let { sample, capture }: { sample: SelectIconSample;
    capture?: {
      read?: () => ReturnType<typeof read>;
      readRefs?: () => ReturnType<typeof readRefs>;
      update?: (action: SelectIconAction, index?: number) => void
    } } = $props();
  const initial = untrack(() => sample);
  const feedbackForm = createForm({ initialValues: {} });
  const Choice = Select<SelectIconValue, 'multiple' | 'tags' | undefined, Data>;
  const Completion = AutoComplete<Data>;
  const recorder = createSelectSurfaceRecorder(), events: unknown[] = [], rawEvents: unknown[] = [], lifecycle: unknown[] = [];
  const nativeRemountClosures: Array<{ actionIndex: number; eventIndex: number; rawEventIndex: number;
    before: boolean; after: boolean; wasFocused: boolean; connected: boolean }> = [];
  let retiringProvider: {
    actionIndex: number;
    before: boolean;
    after: boolean;
    editor: HTMLInputElement | HTMLTextAreaElement
  } | undefined;
  const nodes = new Map<string, Snippet>(), literalNodes = new Map<string, readonly Snippet[]>(), renderers = new Map<string, Producer>();
  const nodeSpecifications = new Map<string, {
    type: string;
    key: string;
    ref: null;
    props: Record<string, unknown>
  }>();
  let settings = $state.raw<SelectIconSettings>({ ...initial.settings });
  let model = $state.raw<Model>(Object.hasOwn(initial.settings, 'value') ? initial.settings.value : initial.settings.mode ? ['a', 'locked'] : 'a');
  let open = $state(Boolean(initial.settings.open)), query = $state('');
  let control = $state<SelectRef>(), root = $state<HTMLDivElement>(), selectEditor = $state<HTMLInputElement>();
  let completionEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let alive = true;
  let lastAuthored: { authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
    authoredInnerProvider: unknown; rawAuthoredInnerProvider: unknown } | undefined;
  onDestroy(() => { alive = false; });
  const event = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const handler = <Value,>(name: string, fn: Value): Value => recorder.register(
    fn,
    { callback: 'icons-' + name }
  );
  const project = (input: Event) => ({ type: input.type, key: (input as KeyboardEvent).key,
    defaultPrevented: input.defaultPrevented, propagationStopped: input.cancelBubble,
    target: (input.target as Element | null)?.tagName, currentTarget: (input.currentTarget as Element | null)?.tagName });
  const onChange = handler('change', (value: Model, option: unknown) => {
    model = value;
    event('change', value, option);
  });
  const onSelect = handler(
    'select',
    (value: SelectIconValue, option: unknown) => event('select', value, option)
  );
  const onDeselect = handler(
    'deselect',
    (value: SelectIconValue, option: unknown) => event('deselect', value, option)
  );
  const onClear = handler('clear', () => event('clear'));
  const onSearch = handler('search', (value: string) => {
    query = value;
    event('search', value);
  });
  const onOpenChange = handler('open', (value: boolean) => {
    const retiring = retiringProvider;
    if (!value && retiring?.editor.isConnected && document.activeElement !== retiring.editor) {
      // Native preserves a connected removal blur and its close request. This
      // controlled owner records that extra request while retaining its desired
      // open state for the replacement provider, as the Original owner does.
      nativeRemountClosures.push({ actionIndex: retiring.actionIndex, eventIndex: events.length,
        rawEventIndex: rawEvents.length, before: retiring.before, after: retiring.after,
        wasFocused: true, connected: retiring.editor.isConnected });
      retiringProvider = undefined;
    }
    else open = value;
    event('open', value);
  });
  const onInputKeyDown = handler(
    'input-keydown',
    (input: KeyboardEvent) => event('input-keydown', project(input))
  );
  const iconClick = handler(
    'authored-icon-click',
    (input: Event) => event('authored-icon-click', project(input))
  );
  const iconMouseDown = handler(
    'authored-icon-mousedown',
    (input: Event) => event('authored-icon-mousedown', project(input))
  );
  const options = recorder.register([
    { value: 'a', label: 'Alpha' }, { value: 1, label: 'Number one' },
    { value: '1', label: 'String one' }, { value: 'locked', label: 'Locked', disabled: true }
  ], { dataset: 'select-icons-values' });
  const escape = (text: string) => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll(
    '>',
    '&gt;'
  ).replaceAll(
    '"',
    '&quot;'
  );
  function node(token: string): Snippet {
    if (!nodes.has(token)) {
      const text = token.includes('clear') ? 'C' : token.includes('remove') ? 'R' : token.includes('item') ? 'M'
        : token.includes('loading') ? 'L' : token.includes('search') ? '?' : 'S';
      const props = { 'data-select-icons-node': token, onMouseDown: iconMouseDown, onClick: iconClick,
        style: { display: 'inline-block', width: 12, height: 12, lineHeight: '12px', fontSize: 10 }, children: text };
      nodeSpecifications.set(token, { type: 'span', key: token, ref: null, props });
      const rendered = createRawSnippet(() => ({
        render: () => '<span data-select-icons-node="' + escape(token) + '" style="display: inline-block; width: 12px; height: 12px; line-height: 12px; font-size: 10px;">' + escape(text) + '</span>',
        setup(element) {
          element.addEventListener('mousedown', iconMouseDown);
          element.addEventListener('click', iconClick);
          return () => {
            element.removeEventListener('mousedown', iconMouseDown);
            element.removeEventListener('click', iconClick);
          };
        }
      }));
      nodes.set(token, recorder.register(rendered, { node: 'icon-' + token }));
    }
    return nodes.get(token)!;
  }
  function result(kind: string, slot: string, side: string): RenderEmptyContent {
    if (kind === 'undefined') {
      return undefined;
    }
    if (kind === 'null') {
      return null;
    }
    if (kind === 'false') {
      return false;
    }
    if (kind === 'zero') {
      return 0;
    }
    if (kind === 'empty') {
      return '';
    }
    if (kind === 'empty-array') {
      return [];
    }
    if (kind === 'array') {
      return [node(side + '-' + slot + '-array-first'), 0, null, false, node(side + '-' + slot + '-array-last')];
    }
    return node(side + '-' + slot + '-function');
  }
  function renderer(slot: string, side: string, kind: string): Producer {
    const key = [slot, side, kind].join(':');
    if (!renderers.has(key)) {
      renderers.set(key, handler(key, function iconsRenderNode(...args: unknown[]) {
        const rendered = result(kind, slot, side);
        return recorder.record(slot, side, args, rendered, { argumentCount: arguments.length,
          argumentOwnKeys: args.map(arg => arg != null && ['object', 'function'].includes(typeof arg) ? Reflect.ownKeys(arg as object) : null),
          argumentDescriptors: args.map(arg => arg != null && ['object', 'function'].includes(typeof arg) ? recorder.own(arg as object) : null) });
      }));
    }
    return renderers.get(key)!;
  }
  function resolve(spec: unknown, slot: string, side: string): unknown {
    const item = spec as { kind?: string; token?: string; result?: string } | null | undefined;
    if (item?.kind === 'undefined') {
      return undefined;
    }
    if (item?.kind === 'node') {
      const token = item.token!, snippet = node(token);
      if (['suffix', 'menuItemSelectedIcon', 'removeIcon'].includes(slot)) {
        // Явный static content сохраняет Source visibility: function-иконка
        // вызывается и у unselected rows, статическая — только у selected.
        if (!literalNodes.has(token)) {
          literalNodes.set(
            token,
            recorder.register([snippet], { node: 'icon-' + token })
          );
        }
        return literalNodes.get(token);
      }
      return snippet;
    }
    if (item?.kind === 'function') {
      return renderer(slot, side, item.result!);
    }
    if (item?.kind === 'array' || item?.kind === 'empty-array') {
      return result(item.kind, slot, side);
    }
    return spec;
  }
  function search(spec: unknown, side: string): unknown {
    if ((spec as { kind?: string } | null)?.kind === 'undefined') {
      return undefined;
    }
    if (spec && typeof spec === 'object') {
      const config = { ...spec, onSearch } as Record<string, unknown>;
      if (Object.hasOwn(spec, 'searchIcon')) {
        config.searchIcon = resolve(
          Reflect.get(spec, 'searchIcon'),
          'searchIcon',
          side
        );
      }
      return config;
    }
    return spec;
  }
  function clear(spec: unknown, side: string): unknown {
    if ((spec as { kind?: string } | null)?.kind === 'undefined') {
      return undefined;
    }
    if (!spec || typeof spec !== 'object') {
      return spec;
    }
    const config = { ...spec } as Record<string, unknown>;
    if (Object.hasOwn(spec, 'clearIcon')) {
      config.clearIcon = resolve(
        Reflect.get(spec, 'clearIcon'),
        'clearIcon',
        side
      );
    }
    return config;
  }
  function icons(spec: Record<string, unknown>, side: string) {
    const record: Record<string, unknown> = {};
    for (const key of ['suffixIcon', 'suffix', 'loadingIcon', 'menuItemSelectedIcon', 'removeIcon']) {
      if (Object.hasOwn(spec, key)) record[key] = resolve(spec[key], key, side);
    }
    if (Object.hasOwn(spec, 'showSearch')) record.showSearch = search(spec.showSearch, side);
    if (Object.hasOwn(spec, 'allowClear')) record.allowClear = clear(spec.allowClear, side);
    return record;
  }
  const semanticClasses = handler('classNames', (info: unknown) => recorder.record('classNames', 'own', info,
    { root: 'select-icons-metadata-root', input: 'select-icons-metadata-input' }));
  const semanticStyles = handler('styles', (info: unknown) => recorder.record('styles', 'own', info,
    { suffix: { color: 'rgb(17,31,47)' }, itemRemove: { color: 'rgb(47,31,17)' } }));
  let ownerProps = $derived.by(() => {
    const props: Record<string, unknown> = { id: 'select-icons-field', class: 'surface-control select-icons-control',
      style: { width: '100%' }, options, value: model, open, listHeight: 160, virtual: false,
      placeholder: 'Choose icon value', 'aria-label': 'Icon value', onChange, onSelect, onDeselect, onClear,
      onOpenChange, onInputKeyDown, ...icons(settings, 'own') };
    for (const key of ['mode', 'loading', 'disabled', 'title']) {
      if (Object.hasOwn(settings, key)) props[key] = settings[key];
    }
    if (settings.metadata) {
      props.classNames = semanticClasses;
      props.styles = semanticStyles;
    }
    return props;
  });
  let selectProps = $derived(ownerProps as ChoiceProps), completionProps = $derived(ownerProps as CompletionProps);
  let provider = $derived({ theme: { token: { motion: false }, cssVar: { key: 'select-icons' } },
    popupOverflow: 'viewport' as const, select: icons(settings.config ?? {}, 'context') as SelectConfig });
  let inner = $derived(settings.inner === 'omitted' || settings.inner === undefined ? undefined
    : { select: icons(settings.inner, 'inner') as SelectConfig });
  export function update(action: SelectIconAction, actionIndex = -1) {
    if (action.type === 'model') model = action.value;
    else if (action.type === 'props') {
      const next = { ...settings, ...action.set };
      for (const key of action.drop ?? []) delete next[key];
      settings = next;
    }
    else if (action.type === 'context') {
      const config = { ...settings.config, ...action.set };
      for (const key of action.drop ?? []) delete config[key];
      settings = { ...settings, config };
    }
    else if (action.type === 'inner') {
      const before = inner !== undefined, after = action.value !== 'omitted' && action.value !== undefined;
      const editor = initial.control === 'autocomplete' ? completionEditor : selectEditor;
      if (before !== after && editor?.matches(':focus')) {
        const transition = { actionIndex, before, after, editor };
        retiringProvider = transition;
        void tick().then(() => {
          if (retiringProvider === transition) retiringProvider = undefined;
        });
      }
      settings = { ...settings, inner: action.value };
    }
  }
  export function readRefs() {
    return { control, root, editor: initial.control === 'autocomplete' ? completionEditor : selectEditor,
      authoredRoot: undefined, authoredInput: undefined };
  }
  export function read() {
    if (alive || !lastAuthored) {
      lastAuthored = { authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
        authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider),
        authoredInnerProvider: recorder.encode(inner), rawAuthoredInnerProvider: recorder.raw(inner) };
    }
    return { model: recorder.encode(model), rawModel: recorder.raw(model), open, query, settings: recorder.encode(settings),
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], lifecycle: [...lifecycle],
      nativeRemountClosures: [...nativeRemountClosures], alive, ...lastAuthored,
      nodeSpecifications: [...nodeSpecifications].map(([token, spec]) => ({
        role: { node: 'icon-' + token },
        raw: recorder.raw(spec)
      })) };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
    initialCapture.update = update;
  }
</script>

{#snippet choice()}
  {#if initial.control === 'autocomplete'}<Completion {...completionProps} bind:this={control} bind:nativeElement={root} bind:inputElement={completionEditor} />
  {:else}<Choice {...selectProps} bind:this={control} bind:nativeElement={root} bind:inputElement={selectEditor} />{/if}
{/snippet}
{#snippet feedback()}
  {#if settings.feedback}<Form form={feedbackForm}><FormItem hasFeedback validateStatus="error" help="Icon feedback">{@render choice()}</FormItem></Form>
  {:else}{@render choice()}{/if}
{/snippet}
<section data-surface-case={initial.id} data-icons-bound={Boolean(control)} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider}><div style="position:absolute;left:300px;top:200px;width:280px">
    {#if inner}<ConfigProvider {...inner}>{@render feedback()}</ConfigProvider>{:else}{@render feedback()}{/if}
  </div></ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside icons</button>
  <div hidden data-surface-command {@attach element => {
    const updated = (event: Event) => update((event as CustomEvent<SelectIconAction>).detail);
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    element.addEventListener('selecticonsupdate', updated); element.addEventListener('surfacerefs', refs);
    return () => { element.removeEventListener('selecticonsupdate', updated); element.removeEventListener('surfacerefs', refs); };
  }}></div>
</section>
