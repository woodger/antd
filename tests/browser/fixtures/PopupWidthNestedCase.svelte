<script lang="ts">
  import { untrack } from 'svelte';
  import dayjs from 'dayjs';
  import { Calendar, Cascader, ColorPicker, ConfigProvider, Pagination, enUS } from 'antd-svelte';
  import {
    popupWidthData, popupWidthGeometry, popupWidthProps, popupWidthReceipt,
    type PopupWidthAction, type PopupWidthNestedSample
  } from './popup-width-cases';

  let { sample }: { sample: PopupWidthNestedSample } = $props();
  const data = untrack(() => popupWidthData(sample));
  const date = dayjs('2024-05-10');
  const theme = { token: { motion: false }, cssVar: { key: 'popup-width' } };
  let outer = $state(untrack(() => sample.outer));
  let inner = $state(untrack(() => sample.inner));
  let local = $state(untrack(() => sample.local));
  let anchorWidth = $state<number>(untrack(() => sample.family === 'calendar' ? 320 : popupWidthGeometry.plain.width));
  let outerProps = $derived(popupWidthProps(outer));
  let innerProps = $derived(popupWidthProps(inner));
  // Keep the actual scalar in an object so signed zero survives Svelte's primitive equality.
  let localProps = $derived({ value: popupWidthProps(local) });
  let open = $state(false);
  let outerOpen = $state(false);
  let model = $state<unknown>(untrack(() => sample.family === 'cascader' ? [] : null));
  let query = $state('');
  let events = $state<unknown[][]>([]);
  let getterCalls = $state<{ tag: string; anchor: boolean; scope: 'global' | 'user';
    role: 'outer' | 'inner' | 'year' | 'month' | 'other' }[]>([]);
  let host = $state<HTMLElement>();
  let control = $state<object>();
  let publicRoot = $state<HTMLDivElement>();
  let cascaderEditor = $state<HTMLInputElement>();
  let positionStyle = $derived(`position:absolute;left:${popupWidthGeometry.plain.left}px;top:${popupWidthGeometry.plain.top}px;width:${anchorWidth}px`);

  function getRoot() {
    if (!host) {
      return undefined;
    }
    if (sample.family === 'calendar') return host.querySelector<HTMLElement>(
      `.ant-picker-calendar-${host.dataset.widthActive ?? 'year'}-select [data-ant-select-control]`
    ) ?? undefined;
    if (sample.family === 'pagination') {
      return host.querySelector<HTMLElement>('[data-ant-select-control]') ?? undefined;
    }
    if (sample.family === 'color-picker') {
      return host.ownerDocument.querySelector<HTMLElement>(
        '.ant-color-picker-format-select [data-ant-select-control]'
      ) ?? host.querySelector<HTMLElement>('.ant-color-picker-trigger') ?? undefined;
    }
    return publicRoot ?? host.querySelector<HTMLElement>('.popup-width-control') ?? undefined;
  }
  function getter(scope: 'global' | 'user', trigger?: HTMLElement) {
    untrack(() => {
      const role = sample.family === 'color-picker'
        ? trigger?.matches('.ant-color-picker-trigger') ? 'outer'
          : trigger?.closest('.ant-color-picker-format-select') ? 'inner' : 'other'
        : sample.family === 'calendar'
          ? trigger?.closest('.ant-picker-calendar-month-select') ? 'month' : 'year' : 'inner';
      getterCalls.push({ tag: trigger?.tagName.toLowerCase() ?? 'undefined',
        anchor: Boolean(trigger) && trigger === getRoot(), scope, role });
    });
    return document.body;
  }
  const globalContainer = (trigger?: HTMLElement) => getter('global', trigger);
  const userContainer = (trigger: HTMLElement) => getter('user', trigger);
  let sizeChangerProps = $derived.by(() => {
    const override = local !== 'omitted' || sample.container && sample.container !== 'default';
    return override ? { ...localProps.value, options: data.page,
      ...(sample.container === 'undefined' ? { getPopupContainer: undefined }
        : sample.container === 'body' ? { getPopupContainer: userContainer } : {}) } : true;
  });
  function record(...entry: unknown[]) { events.push(entry); }
  function change(next: unknown) {
    model = next ?? null;
    record('change', next ?? null);
  }
  function search(next: string) {
    query = next;
    record('search', next);
  }
  function opening(next: boolean) {
    open = next;
    record('open', next);
  }
  function outerOpening(next: boolean) {
    outerOpen = next;
    record('outer-open', next);
  }
  export function update(action: PopupWidthAction) {
    if (action.type === 'width') {
      if (action.layer === 'outer') {
        outer = action.value;
      }
      else if (action.layer === 'inner') {
        inner = action.value;
      }
      else {
        local = action.value;
      }
    }
    else if (action.type === 'anchor') {
      anchorWidth = action.width;
    }
    else if (action.type === 'open') {
      open = action.value;
    }
    else if (action.type === 'outer') outerOpen = action.value;
  }
  export function readRefs() {
    const root = getRoot();
    const editor = cascaderEditor ?? root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[role="combobox"],input,textarea')
      ?? undefined;
    return {
      root,
      anchor: root,
      editor,
      control,
      publicRoot,
      publicEditor: cascaderEditor,
      getterCalls
    };
  }
  export function readReceipts() {
    return { outer: popupWidthReceipt(outer, outerProps), inner: popupWidthReceipt(
      inner,
      innerProps
    ),
      local: popupWidthReceipt(local, localProps.value) };
  }
  export function readEvents() { return events; }
  export function readModel() { return model; }
  export function readQuery() { return query; }
  export function readGetterCalls() { return getterCalls; }
</script>

<section data-width-case={sample.id} data-width-family={sample.family} data-width-count={sample.count ?? 2}
  data-width-bound={Boolean(control)} bind:this={host}
  style="font-family:initial;font-size:16px;line-height:normal;direction:ltr">
  <ConfigProvider {...outerProps} getPopupContainer={globalContainer} popupOverflow="viewport" {theme} locale={enUS}>
    <ConfigProvider {...innerProps}>
      <div data-width-position style={positionStyle}>
        {#if sample.family === 'pagination'}
          <Pagination id="width-field" class="popup-width-control" style="width:max-content"
            total={500} current={1} pageSize={10} showSizeChanger={sizeChangerProps} bind:this={control} />
        {:else if sample.family === 'calendar'}
          <Calendar id="width-field" class="popup-width-control" style="width:100%"
            value={date} fullscreen={false} bind:this={control} bind:nativeElement={publicRoot} />
        {:else if sample.family === 'color-picker'}
          <ColorPicker id="width-field" class="popup-width-control" style="width:100%"
            value="#1677ff" open={outerOpen} onOpenChange={outerOpening} bind:this={control} />
        {:else}
          <Cascader {...localProps.value} id="width-field" class="popup-width-control" style="width:100%"
            options={data.cascader} value={Array.isArray(model) ? model : []} {open}
            showSearch={{ filter: () => true, searchValue: query, onSearch: search }}
            onOpenChange={opening} onChange={change}
            bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={cascaderEditor} />
        {/if}
      </div>
    </ConfigProvider>
  </ConfigProvider>
  <button type="button" data-width-outside style="position:fixed;left:16px;top:80px">Outside width</button>
  <output data-width-receipts hidden>{JSON.stringify(readReceipts())}</output>
  <output data-width-model hidden>{JSON.stringify(model)}</output>
  <output data-width-query hidden>{JSON.stringify(query)}</output>
  <output data-width-events hidden>{JSON.stringify(events)}</output>
  <output data-width-getters hidden>{JSON.stringify(getterCalls)}</output>
  <div data-width-command hidden {@attach node => {
    const command = (event: Event) => update((event as CustomEvent<PopupWidthAction>).detail);
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('widthupdate', command);
    node.addEventListener('widthrefs', refs);
    return () => {
      node.removeEventListener('widthupdate', command);
      node.removeEventListener('widthrefs', refs);
    };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
