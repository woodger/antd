<script lang="ts">
  import { untrack } from 'svelte';
  import { AutoComplete, ConfigProvider, Select, type SelectSuffixInfo } from '@woodger/antd';

  type Sample = { id: string; control: string; mode?: 'tags' | 'multiple'; showSearch?: boolean;
    query?: string; rejectOpen?: boolean; key?: string; prevent?: boolean; initialOpen?: boolean; stop?: boolean; menu?: boolean;
    maxCount?: number; clear?: boolean };
  let { sample }: { sample: Sample } = $props();
  const initial = untrack(() => sample);
  let root = $state<HTMLDivElement>();
  let model = $state<string | string[] | undefined>(untrack(() => initial.mode === 'multiple' ? ['a']
    : initial.mode === 'tags' ? [] : initial.control === 'autocomplete' ? '' : 'a'));
  let open = $state(Boolean(initial.initialOpen));
  const events: unknown[] = [], infos: unknown[] = [];
  const Choice = Select<string, 'tags' | 'multiple' | undefined>;
  const options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
  function suffix(info: SelectSuffixInfo) {
    infos.push({ searchValue: info.searchValue, open: info.open, focused: info.focused,
      showSearch: info.showSearch, loading: info.loading === undefined ? { $: 'undefined' } : info.loading,
      keys: Object.keys(info), argumentCount: arguments.length });
    return null;
  }
  function onChange(value: string | string[] | undefined) {
    events.push(['change', value]);
    model = value;
  }
  const onSelect = (value: string) => { events.push(['select', value]); };
  const onSearch = (value: string) => { events.push(['search', value]); };
  const onClear = () => { events.push(['clear']); };
  function onOpenChange(value: boolean) {
    events.push(['open', value]);
    if (!initial.rejectOpen) open = value;
  }
  function onInputKeyDown(event: KeyboardEvent) {
    events.push(['keydown', event.key, event.defaultPrevented]);
    if (initial.prevent) event.preventDefault();
    if (initial.stop) event.stopPropagation();
  }
  const menuItemSelectedIcon = initial.menu ? (info: { value: string | undefined }) =>
    info.value === 'b' ? menuB : menuA : undefined;
  const search = initial.showSearch === false ? false : { filterOption: false, onSearch,
    ...(initial.query === undefined ? {} : { searchValue: initial.query }) };
  function read() {
    const input = root?.querySelector<HTMLInputElement>('input[role=combobox]');
    return { model, open, events: [...events], infos: [...infos], input: input ? {
      value: input.value, readOnly: input.readOnly, expanded: input.getAttribute('aria-expanded'),
      active: input.getAttribute('aria-activedescendant')
    } : null };
  }
  function connect(node: HTMLElement) {
    const listener = (event: Event) => { (event as CustomEvent).detail.read = read; };
    node.addEventListener('iconedgecapture', listener);
    return () => node.removeEventListener('iconedgecapture', listener);
  }
</script>

{#snippet menuA()}<span data-icon-edge-menu="a" {...{ onmousedown: (event: MouseEvent) => {
  events.push(['menu-mousedown', event.defaultPrevented]);
}, onclick: (event: MouseEvent) => {
  events.push(['menu-click', event.defaultPrevented]);
} }}>M</span>{/snippet}
{#snippet menuB()}<span data-icon-edge-menu="b" {...{ onmousedown: (event: MouseEvent) => {
  events.push(['menu-mousedown', event.defaultPrevented]);
}, onclick: (event: MouseEvent) => {
  events.push(['menu-click', event.defaultPrevented]);
} }}>M</span>{/snippet}

<ConfigProvider theme={{ token: { motion: false }, cssVar: { key: 'icon-edges' } }}>
  <div data-icon-edge bind:this={root} style="width:300px" {@attach connect}>
    {#if initial.control === 'autocomplete'}
      <AutoComplete id="icon-edge-value" aria-label="Icon edge value" value={model as string} {open}
        {suffix} virtual={false} {options} {onChange} {onSelect} {onOpenChange} {onInputKeyDown}
        {onClear} {menuItemSelectedIcon} showSearch={search} />
    {:else}
      <Choice id="icon-edge-value" aria-label="Icon edge value" value={model} {open} mode={initial.mode}
        {suffix} virtual={false} {options} {onChange} {onSelect} {onOpenChange} {onInputKeyDown}
        {onClear} {menuItemSelectedIcon} showSearch={search} allowClear={initial.clear} maxCount={initial.maxCount} />
    {/if}
  </div>
</ConfigProvider>
