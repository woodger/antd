<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { AutoComplete, ConfigProvider, type AutoCompleteProps, type SelectFlattenOption, type SelectRef } from '@woodger/antd';
  import AutoCompleteCloseFixtures from './AutoCompleteCloseFixtures.svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import type { AutocompleteCloseSample } from '../autocomplete-close-reference';

  type Option = { value: string; label: string };
  let { sample, capture }: { sample?: AutocompleteCloseSample; capture?: {
    read?: () => ReturnType<typeof read>; readRefs?: () => ReturnType<typeof readRefs>;
    flags?: () => { selectionCallback: boolean }; dispose?: () => void;
  } } = $props();
  const initial = untrack(() => sample), recorder = createSelectSurfaceRecorder();
  const methods = ['direct-pointer', 'settled-hover-pointer', 'enter'] as const;
  const samples: AutocompleteCloseSample[] = [false, true].flatMap(virtual => methods.map(method => ({
    id: 'autocomplete-close-low-' + (virtual ? 'virtual' : 'full') + '-' + method, virtual, method
  })));
  let selected = $state(untrack(() => {
    const requested = typeof window === 'undefined' ? null : new URL(window.location.href).searchParams.get('sample');
    const matchingSample = samples.find(item => item.id === requested);
    return matchingSample?.id ?? samples[0].id;
  }));
  let selectedSample = $derived(samples.find(item => item.id === selected)!);
  let mounted = $state(true);
  let childCapture = $derived.by(() => {
    void selected;
    return {} as NonNullable<typeof capture>;
  });
  const options: Option[] = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' },
    ...Array.from(
      { length: 10 },
      (_, index) => ({ value: 'filler-' + index, label: 'Filler ' + index })
    )];
  for (const option of options) {
    recorder.register(
      option,
      { data: 'close-contrast-option', value: option.value }
    );
  }
  const events: unknown[] = [], rawEvents: unknown[] = [];
  let value = $state<string | undefined>(''), open = $state(false);
  let control = $state<SelectRef>(), root = $state<HTMLDivElement>(), editor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let alive = true, selectionCallback = false;
  let lastAuthored: {
    authoredProps: unknown;
    rawAuthoredProps: unknown;
    authoredProvider: unknown;
    rawAuthoredProvider: unknown
  } | undefined;
  onDestroy(() => { alive = false; });
  const record = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const callback = <Value,>(name: string, fn: Value): Value => recorder.register(
    fn,
    { callback: 'close-contrast-' + name }
  );
  const onChange = callback('change', (next: string | undefined, option: unknown) => {
    record('change', next, option);
    value = next;
  });
  const onSearch = callback('search', (query: string) => record('search', query));
  const onSelect = callback('select', (next: string, option: unknown) => {
    record('select', next, option);
    selectionCallback = next === 'b';
  });
  const onOpenChange = callback('open', (next: boolean) => {
    record('open', next);
    open = next;
  });
  const onActive = callback('active', (next: string | null) => record('active', next));
  recorder.register(optionRenderer, { callback: 'close-contrast-option' });
  function optionValue(option: SelectFlattenOption<string, Option>, info: { index: number }) {
    return recorder.record('optionRender', 'own', [option, info], option.label as string,
      { index: info.index, value: option.value, rawOptionIdentity: recorder.identity(option.data) });
  }
  const search = { filterOption: false, onSearch };
  const provider = {
    theme: { token: { motion: false }, cssVar: { key: 'autocomplete-close-contrast' } },
    popupOverflow: 'viewport' as const
  };
  let ownerProps = $derived<AutoCompleteProps<Option>>({ id: 'close-contrast-field', class: 'surface-control autocomplete-close-contrast',
    style: { width: '100%' }, options, value, open, virtual: initial?.virtual, listHeight: 96, listItemHeight: 32,
    'aria-label': 'Close contrast value', placeholder: 'Close contrast choice', defaultActiveFirstOption: false,
    showSearch: search, onChange, onSelect, onOpenChange, onActive, optionRender: optionRenderer });
  function readRefs() { return { control, root, editor }; }
  function read() {
    if (alive) {
      lastAuthored = { authoredProps: recorder.encode(ownerProps), rawAuthoredProps: recorder.raw(ownerProps),
        authoredProvider: recorder.encode(provider), rawAuthoredProvider: recorder.raw(provider) };
    }
    if (!lastAuthored) {
      throw Error('Read the actual live close owner before unmount');
    }
    return {
      value,
      query: value,
      open,
      alive,
      events: [...events],
      rawEvents: [...rawEvents],
      calls: [...recorder.calls],
      ...lastAuthored
    };
  }
  const initialCapture = untrack(() => capture);
  if (initialCapture) {
    initialCapture.read = read;
    initialCapture.readRefs = readRefs;
    initialCapture.flags = () => ({ selectionCallback });
  }
</script>

{#snippet optionRenderer(option: SelectFlattenOption<string, Option>, info: { index: number })}{optionValue(option, info)}{/snippet}
{#if initial}
  <section data-surface-case={initial.id} data-surface-bound={Boolean(control)} style="font-family:initial;font-size:16px;line-height:normal">
    <ConfigProvider {...provider}><div style="position:absolute;left:300px;top:200px;width:280px">
      <AutoComplete {...ownerProps} bind:this={control} bind:nativeElement={root} bind:inputElement={editor} />
    </div></ConfigProvider>
    <button type="button" data-surface-outside style="position:fixed;left:16px;top:80px">Outside contrast</button>
    <div hidden data-surface-command></div>
  </section>
{:else}
  <label id="autocomplete-close-fixture" style="position:fixed;left:0;top:0;z-index:1">AutoComplete close sample<select bind:value={selected} onchange={() => {
    mounted = true;
  }}>
    {#each samples as item}<option value={item.id}>{item.id}</option>{/each}
  </select></label>
  {#if mounted}{#key selected}<AutoCompleteCloseFixtures sample={selectedSample} capture={childCapture} />{/key}{/if}
  <div hidden data-autocomplete-close-command {@attach node => {
    const capturing = (event: Event) => Object.assign((event as CustomEvent).detail, childCapture,
      { dispose: () => { mounted = false; } });
    node.addEventListener('closecapture', capturing);
    return () => node.removeEventListener('closecapture', capturing);
  }}></div>
{/if}

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
