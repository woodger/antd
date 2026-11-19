<script lang="ts">
  import { createRawSnippet, onDestroy, untrack, type Snippet, type Component } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, Form, FormItem, createForm, type RenderEmptyContent,
    type SelectConfig, type SelectRef } from 'antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { SelectIconValue } from '../select-icons-cases.mjs';
  import type { SelectComponentsModesSettings as SelectIconSettings } from '../select-components-modes-cases.mjs';
  import type { SelectComponentsModesSample as SelectComponentsSample, SelectComponentsModesAction as SelectComponentsAction } from '../select-components-modes-cases.mjs';

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
  type Registration = HTMLElement | {
    nativeElement: HTMLElement;
    inputElement?: HTMLElement;
    focus?: (options?: FocusOptions) => void;
    blur?: () => void
  };
  type ReplacementContext = {
    attributes: Record<string, unknown>;
    register: (ref: Registration) => () => void
  };
  // Future props are intentionally accepted by the untouched baseline package.
  // Actual component props/context are captured below; no synthetic implementation.
  type CallerProps = Record<string, unknown> & {
    nativeElement?: HTMLElement;
    inputElement?: HTMLElement
  };
  type Slot = 'root' | 'input';
  let { sample, capture }: { sample: SelectComponentsSample;
    capture?: {
      read?: () => ReturnType<typeof read>;
      readRefs?: () => ReturnType<typeof readRefs>;
      update?: (action: SelectComponentsAction, index?: number) => void
    } } = $props();
  const initial = untrack(() => sample);
  const feedbackForm = createForm({ initialValues: {} });
  const Choice = Select as unknown as Component<CallerProps, SelectRef, 'nativeElement' | 'inputElement'>;
  const Completion = AutoComplete as unknown as Component<CallerProps, SelectRef, 'nativeElement' | 'inputElement'>;
  const recorder = createSelectSurfaceRecorder(), events: unknown[] = [], rawEvents: unknown[] = [], lifecycle: unknown[] = [];
  const nativeRemountClosures: unknown[] = [];
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
  let control = $state<SelectRef>(), root = $state<HTMLElement>(), selectEditor = $state<HTMLElement>();
  let completionEditor = $state<HTMLElement>();
  const elementRefs: Record<Slot, HTMLElement | undefined> = { root: undefined, input: undefined };
  const componentObservations: unknown[] = [], bodyActivity: unknown[] = [];
  const componentTypes = new Map<string, Snippet<[ReplacementContext]>>();
  const componentElements = new Map<string, {
    element: string;
    props: Record<string, unknown>;
    ref: (value: HTMLElement | null) => void
  }>();
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
    open = value;
    event('open', value);
  });
  const onInputKeyDown = handler(
    'input-keydown',
    (input: KeyboardEvent) => event('input-keydown', project(input))
  );
  const onRootMouseDown = handler(
    'root-mousedown',
    (input: MouseEvent) => event('root-mousedown', project(input))
  );
  const onOriginInputKeyDown = handler(
    'origin-input-keydown',
    (input: KeyboardEvent) => event('origin-input-keydown', project(input))
  );
  const onOriginInputChange = handler(
    'origin-input-change',
    (input: Event) => event('origin-input-change', (input.target as HTMLInputElement).value)
  );
  const onOriginRootMouseDown = handler(
    'origin-root-mousedown',
    (input: MouseEvent) => event('origin-root-mousedown', project(input))
  );
  const onPublicFocus = handler(
    'public-focus',
    (input: FocusEvent) => event('public-focus', project(input))
  );
  const onPublicBlur = handler(
    'public-blur',
    (input: FocusEvent) => event('public-blur', project(input))
  );
  const onOriginRootFocus = handler(
    'origin-root-focus',
    (input: FocusEvent) => event('origin-root-focus', project(input))
  );
  const onOriginRootBlur = handler(
    'origin-root-blur',
    (input: FocusEvent) => event('origin-root-blur', project(input))
  );
  const onOriginRootClick = handler(
    'origin-root-click',
    (input: MouseEvent) => event('origin-root-click', project(input))
  );
  const onSubmit = handler('form-submit', (input: SubmitEvent) => {
    input.preventDefault();
    event('form-submit', [...new FormData(input.currentTarget as HTMLFormElement)]);
  });
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
    if (kind === 'undefined') return undefined;
    if (kind === 'null') return null;
    if (kind === 'false') return false;
    if (kind === 'zero') return 0;
    if (kind === 'empty') return '';
    if (kind === 'empty-array') return [];
    if (kind === 'array') return [node(side + '-' + slot + '-array-first'), 0, null, false, node(side + '-' + slot + '-array-last')];
    return node(side + '-' + slot + '-function');
  }
  function renderer(slot: string, side: string, kind: string): Producer {
    const key = [slot, side, kind].join(':');
    if (!renderers.has(key)) renderers.set(key, handler(key, function iconsRenderNode(...args: unknown[]) {
      const rendered = result(kind, slot, side);
      return recorder.record(slot, side, args, rendered, { argumentCount: arguments.length,
        argumentOwnKeys: args.map(arg => arg != null && ['object', 'function'].includes(typeof arg) ? Reflect.ownKeys(arg as object) : null),
        argumentDescriptors: args.map(arg => arg != null && ['object', 'function'].includes(typeof arg) ? recorder.own(arg as object) : null) });
    }));
    return renderers.get(key)!;
  }
  function resolve(spec: unknown, slot: string, side: string): unknown {
    const item = spec as { kind?: string; token?: string; result?: string } | null | undefined;
    if (item?.kind === 'undefined') return undefined;
    if (item?.kind === 'node') {
      const token = item.token!, snippet = node(token);
      if (['suffix', 'menuItemSelectedIcon', 'removeIcon'].includes(slot)) {
        // Явный static content сохраняет Source visibility: function-иконка
        // вызывается и у unselected rows, статическая — только у selected.
        if (!literalNodes.has(token)) literalNodes.set(
          token,
          recorder.register([snippet], { node: 'icon-' + token })
        );
        return literalNodes.get(token);
      }
      return snippet;
    }
    if (item?.kind === 'function') return renderer(slot, side, item.result!);
    if (item?.kind === 'array' || item?.kind === 'empty-array') return result(item.kind, slot, side);
    return spec;
  }
  function search(spec: unknown, side: string): unknown {
    if ((spec as { kind?: string } | null)?.kind === 'undefined') return undefined;
    if (spec && typeof spec === 'object') {
      const config = { ...spec, onSearch } as Record<string, unknown>;
      if (Object.hasOwn(spec, 'searchIcon')) config.searchIcon = resolve(
        Reflect.get(spec, 'searchIcon'),
        'searchIcon',
        side
      );
      return config;
    }
    return spec;
  }
  function clear(spec: unknown, side: string): unknown {
    if ((spec as { kind?: string } | null)?.kind === 'undefined') return undefined;
    if (!spec || typeof spec !== 'object') return spec;
    const config = { ...spec } as Record<string, unknown>;
    if (Object.hasOwn(spec, 'clearIcon')) config.clearIcon = resolve(
      Reflect.get(spec, 'clearIcon'),
      'clearIcon',
      side
    );
    return config;
  }
  function icons(spec: Record<string, unknown>, side: string) {
    const record: Record<string, unknown> = {};
    for (const key of ['suffixIcon', 'suffix', 'loadingIcon', 'menuItemSelectedIcon', 'removeIcon'])
      if (Object.hasOwn(spec, key)) record[key] = resolve(spec[key], key, side);
    if (Object.hasOwn(spec, 'showSearch')) record.showSearch = search(spec.showSearch, side);
    if (Object.hasOwn(spec, 'allowClear')) record.allowClear = clear(spec.allowClear, side);
    return record;
  }
  function recordComponent(slot: Slot, kind: string, context: ReplacementContext) {
    // Snippet contexts are a public Svelte representation, recorded in full.
    // They are not fabricated React {props,ref}/forwardRef result graphs.
    const observation = { slot, kind, context: recorder.encode(context), rawContext: recorder.raw(context),
      attributes: recorder.encode(context.attributes), rawAttributes: recorder.raw(context.attributes),
      own: recorder.own(context.attributes), register: recorder.raw(context.register) };
    componentObservations.push(observation);
    return context.attributes;
  }
  function connectComponent(
    slot: Slot,
    kind: string,
    context: ReplacementContext,
    element: HTMLElement
  ) {
    const refCallback = (value: HTMLElement | undefined) => {
      elementRefs[slot] = value;
      lifecycle.push({ slot, event: value ? 'attach' : 'detach', tag: value?.tagName ?? null });
    };
    const registration: Registration = kind === 'composite' || kind === 'composite-native-only'
      ? { nativeElement: element, ...(kind === 'composite-native-only' ? {} : {
        focus: handler('composite-focus-' + slot, function focus(...args: [FocusOptions?]) {
          event('composite-focus', slot, args);
          element.focus(...args);
        }),
        blur: handler('composite-blur-' + slot, function blur(...args: unknown[]) {
          event('composite-blur', slot, args);
          element.blur();
        })
      }) } : element;
    const disconnect = context.register(registration);
    if (kind === 'element') refCallback(element);
    return () => {
      disconnect();
      if (kind === 'element') refCallback(undefined);
    };
  }
  function component(
    slot: Slot,
    kind: string,
    collisions = false,
    authoredTag?: string,
    authoredProps?: Record<string, unknown>
  ): unknown {
    const key = slot + ':' + kind;
    const tag = authoredTag ?? (slot === 'input' ? 'textarea' : 'input');
    if (kind === 'intrinsic') return tag;
    if (kind === 'function' || kind === 'composite' || kind === 'composite-native-only') {
      if (!componentTypes.has(key)) componentTypes.set(key, recorder.register(
        slot === 'root' ? kind === 'function' ? rootFunction : kind === 'composite' ? rootComposite : rootNativeOnly
          : kind === 'function' ? inputFunction : tag === 'input' ? inputCompositeInput : inputComposite, { component: key }));
      return componentTypes.get(key);
    }
    const elementKey = key + '/' + JSON.stringify(authoredProps ?? null);
    if (!componentElements.has(elementKey)) {
      const props: Record<string, unknown> = { 'data-select-icons-component': key,
        ...(slot === 'input' ? { onkeydown: onOriginInputKeyDown, oninput: onOriginInputChange,
          ...Object.fromEntries(Object.entries(authoredProps ?? {
            value: 'Authored input', className: 'select-icons-origin-input', placeholder: 'Origin textarea'
          }).map(([name, value]) => [name === 'className' ? 'class' : name, value])) }
          : { onmousedown: onOriginRootMouseDown,
            ...(settings.observeFocus ? {
              onfocusin: onOriginRootFocus,
              onfocusout: onOriginRootBlur,
              onclick: onOriginRootClick
            } : {}),
            placeholder: 'Origin root', defaultValue: 'Root draft',
            ...(collisions ? { id: 'origin-root-id', class: 'select-icons-origin-root', name: 'origin-root-field',
              style: 'color:rgb(63,17,31);width:197px' } : {}) }) };
      const ref = handler('component-ref-' + slot, (value: HTMLElement | null) => {
        elementRefs[slot] = value ?? undefined;
        lifecycle.push({ slot, event: value ? 'attach' : 'detach', tag: value?.tagName ?? null });
      });
      // Keep the ordinary authored style OBJECT. The old package must fail the
      // actual BEFORE if that new representation is not yet implemented.
      componentElements.set(elementKey, recorder.register({ element: tag, props, ref },
        { node: 'component-' + key }));
    }
    return componentElements.get(elementKey);
  }
  function prefixActivity() {
    bodyActivity.push({ prefix: 'render' });
    return '';
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
    for (const key of ['mode', 'loading', 'disabled', 'title', 'name']) if (Object.hasOwn(
      settings,
      key
    )) props[key] = settings[key];
    if (settings.observeFocus) {
      props.onFocus = onPublicFocus;
      props.onBlur = onPublicBlur;
    }
    if (settings.prefixProbe) props.prefix = recorder.register(
      prefixBody,
      { node: 'flow-prefix-element' }
    );
    if (settings.metadata) {
      props.classNames = semanticClasses;
      props.styles = semanticStyles;
    }
    if (settings.components) {
      const spec = settings.components as { slot: Slot; kind: string; collisions?: boolean };
      props.components = { [spec.slot]: component(
        spec.slot,
        spec.kind,
        spec.collisions,
        settings.componentTag,
        settings.componentProps
      ) };
      props.onMouseDown = onRootMouseDown;
    }
    return props;
  });
  let selectProps = $derived(ownerProps as CallerProps), completionProps = $derived(ownerProps as CallerProps);
  let provider = $derived({ theme: { token: { motion: false }, cssVar: { key: 'select-icons' } },
    popupOverflow: 'viewport' as const, select: icons(settings.config ?? {}, 'context') as SelectConfig });
  let inner = $derived(settings.inner === 'omitted' || settings.inner === undefined ? undefined
    : { select: icons(settings.inner, 'inner') as SelectConfig });
  export function update(action: SelectComponentsAction, actionIndex = -1) {
    if (action.type === 'model') model = action.value;
    else if (action.type === 'props') {
      const next: SelectIconSettings = { ...settings, ...action.set };
      for (const key of action.drop ?? []) delete next[key];
      settings = next;
    }
    else if (action.type === 'context') {
      const config = { ...settings.config, ...action.set };
      for (const key of action.drop ?? []) delete config[key];
      settings = { ...settings, config };
    }
    else if (action.type === 'inner') settings = { ...settings, inner: action.value };
  }
  export function readRefs() {
    return { control, root, editor: root?.matches('input,textarea') ? root
      : initial.control === 'autocomplete' ? completionEditor : selectEditor,
      authoredRoot: elementRefs.root, authoredInput: elementRefs.input };
  }
  export function read() {
    if (alive || !lastAuthored) lastAuthored = { authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
      authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider),
      authoredInnerProvider: recorder.encode(inner), rawAuthoredInnerProvider: recorder.raw(inner) };
    return { model: recorder.encode(model), rawModel: recorder.raw(model), open, query, settings: recorder.encode(settings),
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], lifecycle: [...lifecycle],
      nativeRemountClosures: [...nativeRemountClosures], componentObservations: [...componentObservations], bodyActivity: [...bodyActivity], alive, ...lastAuthored,
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
{#snippet rootFunction(context: ReplacementContext)}
  {@const attrs = recordComponent('root', 'function', context)}
  <input {...attrs} data-select-icons-component="root:function" {@attach element => connectComponent('root', 'function', untrack(() => context), element)} />
{/snippet}
{#snippet rootComposite(context: ReplacementContext)}
  {@const attrs = recordComponent('root', 'composite', context)}
  <input {...attrs} data-select-icons-component="root:composite" {@attach element => connectComponent('root', 'composite', untrack(() => context), element)} />
{/snippet}
{#snippet rootNativeOnly(context: ReplacementContext)}
  {@const attrs = recordComponent('root', 'composite-native-only', context)}
  <input {...attrs} data-select-icons-component="root:composite-native-only" {@attach element => connectComponent('root', 'composite-native-only', untrack(() => context), element)} />
{/snippet}
{#snippet inputFunction(context: ReplacementContext)}
  {@const attrs = recordComponent('input', 'function', context)}
  {@const { value, ...rest } = attrs}
  <textarea {...rest} value={value as string | undefined} data-select-icons-component="input:function" {@attach element => connectComponent('input', 'function', untrack(() => context), element)}></textarea>
{/snippet}
{#snippet inputComposite(context: ReplacementContext)}
  {@const attrs = recordComponent('input', 'composite', context)}
  {@const { value, ...rest } = attrs}
  <textarea {...rest} value={value as string | undefined} data-select-icons-component="input:composite" {@attach element => connectComponent('input', 'composite', untrack(() => context), element)}></textarea>
{/snippet}
{#snippet inputCompositeInput(context: ReplacementContext)}
  {@const attrs = recordComponent('input', 'composite', context)}
  {@const { value, ...rest } = attrs}
  <input {...rest} data-select-icons-component="input:composite" value={value as string | undefined} {@attach element => connectComponent('input', 'composite', untrack(() => context), element)} />
{/snippet}
{#snippet prefixBody()}{prefixActivity()}<strong data-select-icons-prefix-body>P</strong>{/snippet}
{#snippet formBody()}
  {#if settings.form}<form data-select-icons-form onsubmit={onSubmit}>{@render feedback()}</form>
  {:else}{@render feedback()}{/if}
{/snippet}
<section data-surface-case={initial.id} data-components-bound={Boolean(control)} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider}><div style="position:absolute;left:300px;top:200px;width:280px;font-family:initial;font-size:16px;line-height:normal">
    {#if inner}<ConfigProvider {...inner}>{@render formBody()}</ConfigProvider>{:else}{@render formBody()}{/if}
  </div></ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside icons</button>
  <div hidden data-surface-command {@attach element => {
    const updated = (event: Event) => update((event as CustomEvent<SelectComponentsAction>).detail);
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    element.addEventListener('selecticonsupdate', updated); element.addEventListener('surfacerefs', refs);
    return () => { element.removeEventListener('selecticonsupdate', updated); element.removeEventListener('surfacerefs', refs); };
  }}></div>
</section>
