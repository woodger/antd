<script lang="ts">
  import { createRawSnippet, onDestroy, untrack, type Snippet } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, enUS, type ComponentSize,
    type SelectProps, type AutoCompleteProps, type SelectConfig,
    type SelectRef, type SelectPopupContent, type SelectPopupRender } from 'antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { selectSurfaceData, selectSurfaceGeometry, selectSurfaceRootStyle, selectSurfaceSemantic,
    type SelectSurfaceSample, type SelectSurfaceAction, type SelectSurfaceSemantic } from './select-surface-cases';

  type RawOption = Record<string, unknown>;
  type NativeSelectProps = SelectProps<string, 'multiple' | 'tags' | undefined, RawOption>;
  type NativeAutoCompleteProps = AutoCompleteProps<RawOption>;
  let { sample, capture }: { sample: SelectSurfaceSample;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs> } } = $props();
  const SurfaceSelect = Select<string, 'multiple' | 'tags' | undefined, RawOption>;
  const SurfaceAutoComplete = AutoComplete<RawOption>;
  const recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [];
  const nodes = new Map<string, Snippet>();
  const semanticObjects = new Map<string, unknown>(), semanticCallbacks = new Map<string, unknown>();
  const popupCallbacks = new Map<string, SelectPopupRender>();
  const datasets = new Map<string, RawOption[]>(), rootStyles = new Map<string | undefined, ReturnType<typeof selectSurfaceRootStyle>>();
  const theme = { token: { motion: false }, cssVar: { key: 'select-surface' } };
  const position = selectSurfaceGeometry.root;
  let settings = $state.raw<SelectSurfaceSample>(untrack(() => ({ ...sample })));
  let model = $state.raw<string | string[] | undefined>(untrack(() => sample.value));
  let open = $state(untrack(() => Boolean(sample.defaultOpen)));
  let revision = $state(0);
  let host = $state<HTMLElement>();
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let selectEditor = $state<HTMLInputElement>();
  let autoCompleteEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let alive = true;
  let lastAuthored: { authoredProps: unknown; rawAuthoredProps: unknown;
    authoredProvider: unknown; rawAuthoredProvider: unknown } | undefined;
  onDestroy(() => { alive = false; });

  function escape(text: string) {
    return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }
  for (const [token, tag, text] of [['prefix', 'strong', 'Pfx'], ['replacement', 'div', 'Replacement panel'],
    ['rich', 'strong', 'Rich replacement'], ['array-header', 'header', 'Array header'], ['not-found', 'em', 'Authored empty']]) {
    const node = createRawSnippet(() => ({ render: () => `<${tag} data-surface-node="${token}">${escape(text)}</${tag}>` }));
    nodes.set(token, recorder.register(node, { node: token }));
  }
  function event(...args: unknown[]) {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
    revision += 1;
  }
  function handler<Value extends (...args: never[]) => unknown>(name: string, callback: Value) {
    return recorder.register(callback, { callback: name });
  }
  const changed = handler('change', (value: string | string[] | undefined, option: unknown) => {
    model = value;
    event('change', value, option);
  });
  const selected = handler(
    'select',
    (value: string, option: unknown) => event('select', value, option)
  );
  const deselected = handler(
    'deselect',
    (value: string, option: unknown) => event('deselect', value, option)
  );
  const cleared = handler('clear', () => event('clear'));
  const opening = handler('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
  const searched = handler('own-search', (value: string) => event('search', value));
  const contextSearched = handler(
    'context-search',
    (value: string) => event('context-search', value)
  );
  const footerClicked = handler('footer-click', () => event('footer-click'));
  const footerInput = handler('footer-input', (input: Event) =>
    event('footer-input', (input.currentTarget as HTMLInputElement).value));
  const footerMouse = new Map<'plain' | 'prevent', (event: MouseEvent) => void>();
  for (const policy of ['plain', 'prevent'] as const) {
    footerMouse.set(policy, handler('footer-mousedown-' + policy, (input: MouseEvent) => {
      if (policy === 'prevent') {
        input.preventDefault();
        input.stopPropagation();
      }
      event('footer-mousedown', policy, { defaultPrevented: input.defaultPrevented,
        propagationStopped: input.cancelBubble, target: (input.target as Element).tagName });
    }));
  }
  recorder.register(
    wrappedPlain,
    { node: 'popup-wrap', origin: 'same-argument', footerPolicy: 'plain' }
  );
  recorder.register(
    wrappedPrevent,
    { node: 'popup-wrap', origin: 'same-argument', footerPolicy: 'prevent' }
  );
  for (const kind of ['origin', 'wrap', 'replace', 'null', 'undefined', 'false', 'empty', 'zero', 'array', 'rich'] as const) {
    for (const policy of ['plain', 'prevent'] as const) {
      const callback: SelectPopupRender = origin => {
        recorder.register(origin, { node: 'origin-menu' });
        let result: SelectPopupContent;
        if (kind === 'origin') {
          result = origin;
        }
        else if (kind === 'null') {
          result = null;
        }
        else if (kind === 'undefined') {
          result = undefined;
        }
        else if (kind === 'false') {
          result = false;
        }
        else if (kind === 'empty') {
          result = '';
        }
        else if (kind === 'zero') {
          result = 0;
        }
        else if (kind === 'replace') {
          result = nodes.get('replacement');
        }
        else if (kind === 'rich') {
          result = nodes.get('rich');
        }
        else if (kind === 'array') {
          result = [nodes.get('array-header'), origin];
        }
        else {
          result = policy === 'prevent' ? wrappedPrevent : wrappedPlain;
        }
        return recorder.record('popupRender', 'own', origin, result, { renderer: kind,
          sameResultAsArgument: result === origin, originIdentity: recorder.identity(origin) });
      };
      popupCallbacks.set(kind + ':' + policy, handler('popup-' + kind + '-' + policy, callback));
    }
  }
  function semantic(
    kind: SelectSurfaceSemantic,
    side: 'own' | 'context',
    category: 'classes' | 'styles',
    component: 'select' | 'autocomplete'
  ) {
    const key = [kind, side, category, component].join(':');
    if (kind === 'function') {
      if (!semanticCallbacks.has(key)) {
        semanticCallbacks.set(key, handler(key, (info: { props: unknown }) => {
          const result = selectSurfaceSemantic(
            kind,
            side,
            component,
            info.props as Record<string, unknown>
          )[category];
          return recorder.record(category === 'classes' ? 'classNames' : 'styles', side, info, result);
        }));
      }
      return semanticCallbacks.get(key);
    }
    if (!semanticObjects.has(key)) {
      semanticObjects.set(
        key,
        selectSurfaceSemantic(kind, side, component)[category]
      );
    }
    return semanticObjects.get(key);
  }
  function data() {
    const key = settings.dataset + ':' + Boolean(settings.rawStyles);
    if (!datasets.has(key)) {
      datasets.set(
        key,
        selectSurfaceData(settings.dataset, Boolean(settings.rawStyles))
      );
    }
    return datasets.get(key)!;
  }
  function rootStyle(kind?: 'context' | 'own' | 'next') {
    if (!rootStyles.has(kind)) {
      rootStyles.set(kind,
        recorder.register(selectSurfaceRootStyle(kind), { rootStyle: kind ?? 'base' }));
    }
    return rootStyles.get(kind)!;
  }
  function search(kind: SelectSurfaceSample['search'], context = false) {
    return kind === 'object' ? {
      filterOption: false,
      onSearch: context ? contextSearched : searched
    } : kind === 'true';
  }
  function size(value: SelectSurfaceSample['size']): ComponentSize | undefined {
    return value === 'middle' ? 'medium' : value;
  }
  function ownProps() {
    void revision;
    const props: Record<string, unknown> = {
      id: 'surface-field', class: 'surface-control' + (settings.className ? ' surface-own-class' : ''),
      rootClassName: 'surface-owner-root', style: rootStyle(settings.rootStyle), options: data(),
      listHeight: 140, placeholder: 'Choose surface', 'aria-label': 'Surface value',
      onChange: changed, onSelect: selected, onDeselect: deselected, onClear: cleared, onOpenChange: opening
    };
    if (settings.valueOwner === 'controlled') {
      props.value = model;
    }
    else {
      props.defaultValue = sample.value;
    }
    if (settings.openOwner === 'controlled') {
      props.open = open;
    }
    else {
      props.defaultOpen = settings.defaultOpen;
    }
    if (settings.mode) props.mode = settings.mode;
    if (settings.popup !== 'omitted') props.popupRender = popupCallbacks.get(settings.popup + ':' + (settings.footerPolicy ?? 'plain'));
    if (settings.classes !== 'omitted') {
      props.classNames = semantic(
        settings.classes,
        'own',
        'classes',
        settings.control
      );
    }
    if (settings.styles !== 'omitted') {
      props.styles = semantic(
        settings.styles,
        'own',
        'styles',
        settings.control
      );
    }
    if (settings.prefix) props.prefix = nodes.get('prefix');
    if (settings.notFound) props.notFoundContent = nodes.get('not-found');
    const ownSettings: SelectSurfaceSample & { virtual?: boolean } = settings;
    for (const key of ['allowClear', 'size', 'disabled', 'variant', 'status', 'virtual'] as const) {
      if (Object.hasOwn(ownSettings, key)) props[key] = key === 'size' ? size(settings.size) : ownSettings[key];
    }
    if (settings.search !== 'omitted') props.showSearch = search(settings.search);
    return props;
  }
  function providerSelect() {
    const config = settings.config;
    const select: Record<string, unknown> = {};
    if (config.className) select.class = 'surface-context-class';
    if (config.rootStyle) select.style = rootStyle('context');
    if (config.classes && config.classes !== 'omitted') {
      select.classNames = semantic(
        config.classes,
        'context',
        'classes',
        'select'
      );
    }
    if (config.styles && config.styles !== 'omitted') {
      select.styles = semantic(
        config.styles,
        'context',
        'styles',
        'select'
      );
    }
    if (Object.hasOwn(config, 'allowClear')) select.allowClear = config.allowClear;
    if (Object.hasOwn(config, 'variant')) select.variant = config.variant;
    if (config.search) select.showSearch = search(config.search, true);
    return select;
  }
  let ownerProps = $derived(ownProps());
  let select = $derived(providerSelect());
  let selectProps = $derived(ownerProps as NativeSelectProps);
  let autoCompleteProps = $derived(ownerProps as NativeAutoCompleteProps);
  let providerProps = $derived({
    select: select as SelectConfig,
    ...(Object.hasOwn(settings.config, 'size') ? { componentSize: size(settings.config.size) } : {}),
    ...(Object.hasOwn(settings.config, 'disabled') ? { componentDisabled: settings.config.disabled } : {})
  });
  let authoredProvider = $derived({ theme, popupOverflow: 'viewport', ...providerProps });

  export function update(action: SelectSurfaceAction) {
    if (action.type === 'props') settings = { ...settings, ...action.set };
  }
  export function readRefs() {
    const actualEditor = settings.control === 'autocomplete' ? autoCompleteEditor : selectEditor;
    return {
      control,
      root: publicRoot,
      editor: actualEditor,
      publicRoot,
      publicEditor: actualEditor
    };
  }
  export function read() {
    if (alive) {
      lastAuthored = {
        authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
        authoredProvider: recorder.encode(authoredProvider), rawAuthoredProvider: recorder.raw(authoredProvider)
      };
    }
    if (!lastAuthored) {
      throw Error('Read the actual mounted surface owner before disposal');
    }
    return { settings: recorder.encode(settings), model: recorder.encode(model), open,
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], alive,
      ...lastAuthored };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
  }
</script>

{#snippet wrapped(origin: Snippet, policy: 'plain' | 'prevent')}
  <div data-surface-popup="wrap"><header data-surface-header>Authored header</header>{@render origin()}<button
    type="button" data-surface-footer onmousedown={footerMouse.get(policy)} onclick={footerClicked}>Footer action</button><input
    data-surface-footer-input aria-label="Footer note" value="" oninput={footerInput} /></div>
{/snippet}
{#snippet wrappedPlain(origin: Snippet)}{@render wrapped(origin, 'plain')}{/snippet}
{#snippet wrappedPrevent(origin: Snippet)}{@render wrapped(origin, 'prevent')}{/snippet}

<section data-surface-case={sample.id} data-surface-bound={Boolean(control)} bind:this={host}
  style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...providerProps} {theme} locale={enUS} popupOverflow="viewport">
    <!-- Сохраняем заданный родителю Source font поверх существующего provider reset. -->
    <div data-surface-position style={`position:absolute;left:${position.left}px;top:${position.top}px;width:${position.width}px;font-family:initial;font-size:16px;line-height:normal`}>
      {#if settings.control === 'autocomplete'}
        <SurfaceAutoComplete {...autoCompleteProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoCompleteEditor} />
      {:else}
        <SurfaceSelect {...selectProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={selectEditor} />
      {/if}
    </div>
  </ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside surface</button>
  <output data-surface-owner hidden>{JSON.stringify(read())}</output>
  <div data-surface-command hidden {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<SelectSurfaceAction>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('surfaceupdate', updating);
    node.addEventListener('surfaceread', reading);
    node.addEventListener('surfacerefs', refs);
    return () => {
      node.removeEventListener('surfaceupdate', updating);
      node.removeEventListener('surfaceread', reading);
      node.removeEventListener('surfacerefs', refs);
    };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
