<script lang="ts">
  import { createRawSnippet, onDestroy, untrack } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, enUS, type SelectProps, type AutoCompleteProps,
    type SelectRef, type SelectPopupRender } from 'antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { selectSurfaceEdgePaintStyles, type SelectSurfaceEdgeSample } from './select-surface-edge-cases';

  type RawOption = Record<string, unknown>;
  let { sample, capture }: { sample: SelectSurfaceEdgeSample;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs> } } = $props();
  const EdgeSelect = Select<string, undefined, RawOption>;
  const EdgeAutoComplete = AutoComplete<RawOption>;
  const recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [];
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  const classes = { placeholder: 'surface-edge-empty-placeholder' };
  const styles = {
    placeholder: { ...selectSurfaceEdgePaintStyles.placeholder },
    input: { ...selectSurfaceEdgePaintStyles.input }
  };
  const theme = { token: { motion: false }, cssVar: { key: 'select-surface-edge' } };
  const prefix = recorder.register(createRawSnippet(() => ({
    render: () => '<strong data-surface-node="edge-prefix">Prefix edge</strong>'
  })), { node: 'edge-prefix' });
  const panel = recorder.register(createRawSnippet(() => ({
    render: () => '<div data-surface-edge-panel="">Passive replacement panel</div>'
  })), { node: 'edge-passive-panel' });
  let model = $state.raw<string | undefined>(untrack(() => sample.initialValue));
  let open = $state(false);
  let revision = $state(0);
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let selectEditor = $state<HTMLInputElement>();
  let autoCompleteEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  const isSelect = untrack(() => sample.control === 'select');
  let alive = true;
  let lastAuthoredProps: Record<string, unknown> = {};
  onDestroy(() => { alive = false; });

  function event(...args: unknown[]) {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
    revision += 1;
  }
  function callback<Value extends (...args: never[]) => unknown>(name: string, fn: Value) {
    return recorder.register(fn, { callback: 'edge-' + name });
  }
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
  const onClear = callback('clear', () => event('clear'));
  const onOpenChange = callback('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
  const onSearch = callback('search', (query: string) => event('search', query));
  const popupRender: SelectPopupRender = callback('popup', (menu: Parameters<SelectPopupRender>[0]) => {
    recorder.register(menu, { node: 'origin-menu' });
    return recorder.record('popupRender', 'own', menu, panel,
      { originIdentity: recorder.identity(menu), sameResultAsArgument: false });
  });
  function ownProps() {
    void revision;
    const props: Record<string, unknown> = {
      id: 'surface-edge-field', class: 'surface-control', style: { width: '100%' },
      value: model, open, options, listHeight: 140, allowClear: true, 'aria-label': 'Surface edge value',
      showSearch: { filterOption: false, onSearch }, onChange, onSelect, onDeselect, onClear, onOpenChange
    };
    if (sample.placeholder === 'text') {
      props.placeholder = 'Edge value';
    }
    else if (sample.placeholder === 'empty') props.placeholder = '';
    if (sample.axis === 'replacement') props.popupRender = popupRender;
    if (sample.axis === 'prefix') props.prefix = prefix;
    if (sample.axis === 'placeholder') {
      props.classNames = classes;
      props.styles = styles;
    }
    lastAuthoredProps = props;
    return props;
  }
  let ownerProps = $derived(ownProps());
  let selectProps = $derived(ownerProps as SelectProps<string, undefined, RawOption>);
  let autoCompleteProps = $derived(ownerProps as AutoCompleteProps<RawOption>);
  export function readRefs() {
    return { control, root: publicRoot, editor: isSelect ? selectEditor : autoCompleteEditor };
  }
  export function read() {
    const authoredProps = alive ? ownerProps : lastAuthoredProps;
    return { model: recorder.encode(model), rawModel: recorder.raw(model), open,
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], alive,
      authoredProps: recorder.encode(authoredProps), rawAuthoredProps: recorder.raw(authoredProps) };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
  }
</script>

<section data-surface-case={sample.id} data-surface-bound={Boolean(control)}
  style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {theme} locale={enUS} popupOverflow="viewport">
    <div style="position:absolute;left:300px;top:200px;width:280px;font-family:initial;font-size:16px;line-height:normal">
      {#if sample.control === 'autocomplete'}
        <EdgeAutoComplete {...autoCompleteProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoCompleteEditor} />
      {:else}
        <EdgeSelect {...selectProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={selectEditor} />
      {/if}
    </div>
  </ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside edge</button>
  <div data-surface-command hidden {@attach node => {
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('surfaceread', reading); node.addEventListener('surfacerefs', refs);
    return () => {
      node.removeEventListener('surfaceread', reading);
      node.removeEventListener('surfacerefs', refs);
    };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
