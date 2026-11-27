<script lang="ts">
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, enUS, type SelectProps, type AutoCompleteProps,
    type SelectRef, type SelectPopupRender } from '@woodger/antd';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { SelectSurfaceOmissionAction } from '../select-surface-omission-cases.mjs';
  import type { NativeSelectSurfaceOmissionSample } from './select-surface-omission-native-cases';
  import SelectSurfaceOmissionFooter from './SelectSurfaceOmissionFooter.svelte';

  type RawOption = Record<string, unknown>;
  let { sample, capture }: { sample: NativeSelectSurfaceOmissionSample;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs>;
      setAction?: (action: unknown) => void } } = $props();
  const OmissionSelect = Select<string, 'multiple' | undefined, RawOption>;
  const OmissionAutoComplete = AutoComplete<RawOption>;
  const recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [], lifecycle: Array<Record<string, unknown>> = [];
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  const classes = {
    root: 'surface-omission-root',
    input: 'surface-omission-input',
    popup: { root: 'surface-omission-popup' }
  };
  const sampleAxis = untrack(() => sample.axis);
  const isAutoComplete = untrack(() => sample.control === 'autocomplete');
  const isWidth = sampleAxis === 'width';
  const isOpenWidth = untrack(() => sample.id === 'select-surface-omission-width-open');
  const provider = {
    theme: {
      token: { motion: false },
      cssVar: { key: isOpenWidth ? 'select-surface-omission-width' : 'select-surface-omission' }
    },
    popupOverflow: 'viewport' as const
  };
  let popup = $state<'wrapped' | 'omitted'>(untrack(() => sample.initialPopup ?? 'wrapped'));
  let model = $state.raw<string | string[] | undefined>(untrack(() => typeof sample.initialValue === 'string' ? sample.initialValue : [...sample.initialValue]));
  let open = $state(untrack(() => Boolean(sample.initialOpen)));
  let query = $state(untrack(() => sample.initialQuery ?? ''));
  let fontSize = $state(untrack(() => sample.initialFontSize ?? 14));
  let unrelated = $state('parent-revision-0');
  let revision = $state(0);
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let selectEditor = $state<HTMLInputElement>();
  let autoCompleteEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let footerInstance = 0, footerNode: HTMLInputElement | null = null, wrapNode: HTMLDivElement | null = null;
  let action: unknown = 'mount', alive = true;
  let lastAuthored: { authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown;
    popupOwnKey: boolean; popupIsSameCallback: boolean | null } | undefined;
  onDestroy(() => { alive = false; });
  function callback<Value>(name: string, value: Value): Value {
    return recorder.register(value, { callback: (isOpenWidth ? 'width-' : 'omission-') + name });
  }
  function event(...args: unknown[]) {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
    revision += 1;
  }
  function trace(kind: string, details: Record<string, unknown> = {}) {
    lifecycle.push({ index: lifecycle.length, action, kind, ...details });
  }
  const onOpenChange = callback('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
  const onChange = callback('change', (value: string | string[] | undefined, option: unknown) => {
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
  const onClear = callback('clear', () => event('clear'));
  const onSearch = callback('search', (value: string) => {
    if (isWidth) query = value;
    event('search', value);
  });
  const onFooterInput = callback('footer-input', (value: string) => event('footer-input', value));
  const footerRef = callback('footer-ref', (node: HTMLInputElement | null) => {
    footerNode = node;
    trace('footer-ref', { attached: Boolean(node), connected: node ? node.isConnected : null });
  });
  const wrapRef = callback('wrap-ref', (node: HTMLDivElement | null) => {
    wrapNode = node;
    trace('wrap-ref', { attached: Boolean(node), connected: node ? node.isConnected : null });
  });
  recorder.register(SelectSurfaceOmissionFooter, { component: 'omission-footer' });
  recorder.register(wrapped, { node: 'popup-wrap', origin: 'same-argument' });
  const popupRender: SelectPopupRender = callback('popup-wrap-stable', menu => {
    recorder.register(menu, { node: 'origin-menu' });
    return recorder.record('popupRender', 'own', menu, wrapped, { renderer: 'wrap', sameResultAsArgument: false,
      originIdentity: recorder.identity(menu), callbackIdentity: recorder.identity(popupRender) });
  });
  let ownerProps = $derived.by(() => {
    void revision;
    const search = {
      filterOption: false as const,
      onSearch,
      ...(isWidth ? { searchValue: query } : {})
    };
    const props: Record<string, unknown> = {
      id: isOpenWidth ? 'surface-omission-width-field' : 'surface-omission-field', class: 'surface-control', style: { width: '100%' },
      classNames: classes, styles: isWidth ? { input: { fontSize } }
        : {
          root: { borderColor: 'rgb(31, 171, 61)' },
          popup: { root: { border: '1px solid rgb(21, 31, 41)' } }
        },
      options, value: model, open, listHeight: 140, placeholder: isOpenWidth ? 'Width query' : 'Omission value',
      'aria-label': isOpenWidth ? 'Surface width value' : 'Surface omission value', 'data-parent-revision': unrelated,
      showSearch: search, onOpenChange, onChange, onSelect, onDeselect, onClear,
    };
    if (isWidth) {
      props.mode = 'multiple';
    }
    else if (popup === 'wrapped') props.popupRender = popupRender;
    // Omitted mode has no own popupRender key; it is never assigned undefined.
    return props;
  });
  let selectProps = $derived(ownerProps as SelectProps<string, 'multiple' | undefined, RawOption>);
  let autoCompleteProps = $derived(ownerProps as AutoCompleteProps<RawOption>);
  export function update(next: SelectSurfaceOmissionAction) {
    if (next.type === 'popup-omit') {
      popup = 'omitted';
    }
    else if (next.type === 'popup-restore') {
      popup = 'wrapped';
    }
    else if (next.type === 'font') {
      fontSize = next.fontSize;
    }
    else if (next.type === 'unrelated') {
      unrelated = next.value;
    }
    else if (next.type === 'font-query') {
      fontSize = next.fontSize;
      query = next.query;
    }
  }
  export function setAction(next: unknown) { action = next; }
  export function readRefs() {
    return { control, root: publicRoot, editor: isAutoComplete ? autoCompleteEditor : selectEditor,
      ...(isOpenWidth ? {} : { wrap: wrapNode, footerInput: footerNode }),
      publicRoot, publicEditor: isAutoComplete ? autoCompleteEditor : selectEditor };
  }
  export function read() {
    if (alive) {
      lastAuthored = { authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
        authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider),
        popupOwnKey: Object.hasOwn(ownerProps, 'popupRender'),
        popupIsSameCallback: Object.hasOwn(ownerProps, 'popupRender') ? ownerProps.popupRender === popupRender : null };
    }
    if (!lastAuthored) {
      throw Error('Read the actual mounted omission owner before disposal');
    }
    const { popupOwnKey, popupIsSameCallback, ...authored } = lastAuthored;
    return { ...(isOpenWidth ? {} : { axis: sampleAxis, popup, popupOwnKey, popupIsSameCallback,
      popupCallbackIdentity: recorder.identity(popupRender) }),
      model: recorder.encode(model), rawModel: recorder.raw(model), open, query, fontSize, unrelated, alive,
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], lifecycle: [...lifecycle], ...authored };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
    initialCapture.setAction = setAction;
  }
</script>

{#snippet wrapped(origin: Snippet)}<div data-surface-popup="wrap" data-surface-omission-wrap
  {@attach node => {
    wrapRef(node);
    return () => wrapRef(null);
  }}><header data-surface-header>Authored header</header>{@render origin()}<SelectSurfaceOmissionFooter
    nextInstance={() => ++footerInstance} {trace} inputRef={footerRef} onInput={onFooterInput} /></div>{/snippet}

<section data-surface-case={sample.id} data-parent-revision={unrelated} data-surface-bound={Boolean(control)}
  style={'font-family:initial;'
    + 'font-size:16px;'
    + 'line-height:normal'}>
  <ConfigProvider {...provider} locale={enUS}>
    <div style={'position:absolute;'
      + 'left:300px;'
      + 'top:200px;'
      + 'width:280px;'
      + 'font-family:initial;'
      + 'font-size:16px;'
      + 'line-height:normal'}>
      {#if isAutoComplete}
        <OmissionAutoComplete {...autoCompleteProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoCompleteEditor} />
      {:else}
        <OmissionSelect {...selectProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={selectEditor} />
      {/if}
    </div>
  </ConfigProvider>
  <button type="button" data-surface-outside style={'position:fixed;'
    + 'left:16px;'
    + 'top:80px'}>Outside {isOpenWidth ? 'width' : 'omission'}</button>
  <output hidden data-surface-omission-owner>{JSON.stringify(read())}</output>
  <div hidden data-surface-command {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<SelectSurfaceOmissionAction>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('omissionupdate', updating); node.addEventListener('widthupdate', updating);
    node.addEventListener('omissionread', reading); node.addEventListener('surfacerefs', refs);
    return () => {
      node.removeEventListener('omissionupdate', updating); node.removeEventListener('widthupdate', updating);
      node.removeEventListener('omissionread', reading); node.removeEventListener('surfacerefs', refs);
    };
  }}></div>
</section>

<style>:global(body) {
    margin:0;
    min-width:2200px;
    min-height:1800px;
  }</style>
