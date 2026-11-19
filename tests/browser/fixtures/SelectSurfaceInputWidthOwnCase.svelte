<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { Select, ConfigProvider, enUS, type SelectProps, type SelectRef } from 'antd-svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { SelectSurfaceInputWidthOwnSample, SelectSurfaceInputWidthOwnAction,
    SelectSurfaceInputWidthKind } from '../select-surface-input-width-own-cases.mjs';

  type RawOption = Record<string, unknown>;
  let { sample, capture, withoutTheme = false, initialQuery = 'WWWW' }: { sample: SelectSurfaceInputWidthOwnSample;
    withoutTheme?: boolean; initialQuery?: string;
    capture?: { read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs> } } = $props();
  const sampleId = untrack(() => sample.id);
  const WidthSelect = Select<string, 'multiple', RawOption>;
  const recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [];
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  const classes = {
    root: 'surface-width-own-root',
    input: 'surface-width-own-input',
    popup: { root: 'surface-width-own-popup' }
  };
  const provider = untrack(() => withoutTheme ? { popupOverflow: 'viewport' as const }
    : {
      theme: { token: { motion: false }, cssVar: { key: 'select-surface-input-width-own' } },
      popupOverflow: 'viewport' as const
    });
  let widthState = $state.raw<{ kind: SelectSurfaceInputWidthKind }>(untrack(() => ({ kind: sample.initialWidthKind })));
  let query = $state(untrack(() => initialQuery));
  let open = $state(true);
  let model = $state.raw<string[]>([]);
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement>();
  let alive = true;
  let lastAuthored: { widthOwnKey: boolean; widthValue: unknown; inputStyle: unknown; rawInputStyle: unknown;
    styleOwnKeys: PropertyKey[]; inputStyleDescriptors: Array<Record<string, unknown>>;
    authoredProps: unknown; rawAuthoredProps: unknown; authoredProvider: unknown; rawAuthoredProvider: unknown } | undefined;
  onDestroy(() => { alive = false; });
  function callback<Value>(name: string, value: Value): Value {
    return recorder.register(value, { callback: 'input-width-own-' + name });
  }
  function event(...args: unknown[]) {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  }
  const onOpenChange = callback('open', (value: boolean) => {
    open = value;
    event('open', value);
  });
  const onSearch = callback('search', (value: string) => {
    query = value;
    event('search', value);
  });
  const onChange = callback('change', (value: string[], option: unknown) => {
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
  let inputStyle = $derived.by(() => {
    const style: { fontSize: number; width?: number } = {
      fontSize: 12,
      width: widthState.kind === 'numeric20' ? 20 : undefined
    };
    if (widthState.kind === 'omitted') delete style.width;
    return style;
  });
  let ownerProps = $derived({ id: 'surface-input-width-own-field', class: 'surface-control', style: { width: '100%' },
    classNames: classes, styles: { input: inputStyle }, mode: 'multiple' as const, options, value: model, open,
    listHeight: 140, placeholder: 'Width ownership', 'aria-label': 'Input width ownership',
    showSearch: { filterOption: false as const, searchValue: query, onSearch }, onOpenChange, onChange, onSelect, onDeselect, onClear });
  let selectProps = $derived(ownerProps as SelectProps<string, 'multiple', RawOption>);
  export function update(action: SelectSurfaceInputWidthOwnAction) {
    if (action.type === 'width-own') widthState = { kind: action.kind };
  }
  export function readRefs() {
    return { control, root: publicRoot, editor, publicRoot, publicEditor: editor };
  }
  export function read() {
    if (alive) lastAuthored = { widthOwnKey: Object.hasOwn(inputStyle, 'width'), widthValue: recorder.encode(inputStyle.width),
      inputStyle: recorder.encode(inputStyle), rawInputStyle: recorder.raw(inputStyle),
      styleOwnKeys: Reflect.ownKeys(inputStyle), inputStyleDescriptors: recorder.own(inputStyle),
      authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
      authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider) };
    if (!lastAuthored) throw Error('Read the actual mounted width ownership owner before disposal');
    return { widthKind: widthState.kind, fontSize: 12, query, open, model: recorder.encode(model), rawModel: recorder.raw(model),
      alive, events: [...events], rawEvents: [...rawEvents], calls: [...recorder.calls], ...lastAuthored };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
  }
</script>

<section data-surface-case={sampleId} data-surface-bound={Boolean(control)} style="font-family:initial;font-size:16px;line-height:normal">
  <ConfigProvider {...provider} locale={enUS}>
    <div style="position:absolute;left:300px;top:200px;width:280px;font-family:initial;font-size:16px;line-height:normal">
      <WidthSelect {...selectProps} bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={editor} />
    </div>
  </ConfigProvider>
  <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside width ownership</button>
  <output hidden data-surface-input-width-own-owner>{JSON.stringify(read())}</output>
  <div hidden data-surface-command {@attach node => {
    const updating = (event: Event) => update((event as CustomEvent<SelectSurfaceInputWidthOwnAction>).detail);
    const reading = (event: Event) => Object.assign((event as CustomEvent).detail, read());
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('inputwidthownupdate', updating); node.addEventListener('inputwidthownread', reading); node.addEventListener('surfacerefs', refs);
    return () => { node.removeEventListener('inputwidthownupdate', updating); node.removeEventListener('inputwidthownread', reading); node.removeEventListener('surfacerefs', refs); };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
