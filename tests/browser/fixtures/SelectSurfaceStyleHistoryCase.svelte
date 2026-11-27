<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { Select, AutoComplete, ConfigProvider, enUS, type SelectProps, type AutoCompleteProps,
    type SelectRef } from '@woodger/antd';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { selectSurfaceStyleHistoryMaps, type SelectSurfaceStylePhase } from './select-surface-style-history-cases';

  type RawOption = Record<string, unknown>;
  type Sample = { readonly id: string; readonly control: 'select' | 'autocomplete' };
  let { sample, capture }: { sample: Sample;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs> } } = $props();
  const HistorySelect = Select<string, undefined, RawOption>;
  const HistoryAutoComplete = AutoComplete<RawOption>;
  const recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [];
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  const theme = { token: { motion: false }, cssVar: { key: 'select-surface-style-history' } };
  const isSelect = untrack(() => sample.control === 'select');
  let phase = $state<SelectSurfaceStylePhase>('red');
  let model = $state<string | undefined>('a');
  let open = $state(false);
  let revision = $state(0);
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let selectEditor = $state<HTMLInputElement>();
  let autoCompleteEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let alive = true;
  let lastAuthored: {
    maps: unknown;
    rawMaps: unknown;
    authoredProps: unknown;
    rawAuthoredProps: unknown
  } | undefined;
  onDestroy(() => { alive = false; });

  function callback<Value>(name: string, value: Value): Value {
    return recorder.register(value, { callback: 'style-history-' + name });
  }
  function event(...args: unknown[]) {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
    revision += 1;
  }
  const onOpenChange = callback('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
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
  const onSearch = callback('search', (value: string) => event('search', value));
  let maps = $derived.by(() => {
    void revision;
    return selectSurfaceStyleHistoryMaps(phase);
  });
  let ownerProps = $derived({ id: 'surface-style-history-field', class: 'surface-control',
    style: maps.style, styles: maps.styles, value: model, open, options,
    placeholder: 'History value', 'aria-label': 'Style history value', showSearch: {
      filterOption: false,
      onSearch
    },
    onOpenChange, onChange, onSelect, onDeselect, listHeight: 140 });
  let selectProps = $derived(ownerProps as SelectProps<string, undefined, RawOption>);
  let autoCompleteProps = $derived(ownerProps as AutoCompleteProps<RawOption>);
  export function update(action: { type: 'color'; phase: SelectSurfaceStylePhase }) {
    if (action.type === 'color') phase = action.phase;
  }
  export function readRefs() {
    return { root: publicRoot, editor: isSelect ? selectEditor : autoCompleteEditor, control };
  }
  export function read() {
    if (alive) {
      lastAuthored = { maps: recorder.encode(maps), rawMaps: recorder.raw(maps),
        authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps) };
    }
    if (!lastAuthored) {
      throw Error('Read the actual style history owner before disposal');
    }
    return { phase, open, model: recorder.encode(model), rawModel: recorder.raw(model), alive,
      events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], ...lastAuthored };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
  }
</script>

<section data-surface-case={sample.id} data-surface-bound={Boolean(control)}
  style={'font-family:initial;'
    + 'font-size:16px;'
    + 'line-height:normal'}>
  <ConfigProvider {theme} locale={enUS} popupOverflow="viewport">
    <!-- Сохраняем заданный Source parent font поверх существующего provider reset. -->
    <div style={'position:absolute;'
      + 'left:300px;'
      + 'top:200px;'
      + 'width:280px;'
      + 'font-family:initial;'
      + 'font-size:16px;'
      + 'line-height:normal'}>
      {#if sample.control === 'autocomplete'}
        <HistoryAutoComplete {...autoCompleteProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoCompleteEditor} />
      {:else}
        <HistorySelect {...selectProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={selectEditor} />
      {/if}
    </div>
  </ConfigProvider>
  <button type="button" data-surface-outside style={'position:fixed;'
    + 'left:16px;'
    + 'top:80px'}>Outside history</button>
  <output hidden data-surface-history-owner>{JSON.stringify(read())}</output>
  <div hidden data-surface-command {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<{ type: 'color'; phase: SelectSurfaceStylePhase }>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('historyupdate', updating);
    node.addEventListener('historyread', reading);
    node.addEventListener('surfacerefs', refs);
    return () => {
      node.removeEventListener('historyupdate', updating);
      node.removeEventListener('historyread', reading);
      node.removeEventListener('surfacerefs', refs);
    };
  }}></div>
</section>

<style>:global(body) {
    margin:0;
    min-width:2200px;
    min-height:1800px;
  }</style>
