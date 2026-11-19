<script lang="ts">
  import { untrack } from 'svelte';
  import dayjs from 'dayjs';
  import {
    Calendar, CascaderPanel, ColorPicker, ConfigProvider, DatePicker, Mentions, Pagination,
    Tooltip, enUS, type ConfigProviderProps
  } from 'antd-svelte';
  import {
    popupOverflowData, popupOverflowGeometry,
    type PopupOverflowAction, type PopupOverflowDescriptor, type PopupOverflowSmokeSample
  } from './popup-overflow-cases';
  import type { PopupOverflowNestedLayoutSample } from './popup-overflow-nested-layout-cases';

  let { sample }: { sample: PopupOverflowSmokeSample | PopupOverflowNestedLayoutSample } = $props();
  const data = untrack(() => popupOverflowData(sample));
  const date = dayjs('2024-05-10');
  const theme = { token: { motion: false }, cssVar: { key: 'popup-overflow' } };
  const position = popupOverflowGeometry.edge;
  let outer = $state(untrack(() => sample.outer));
  let inner = $state(untrack(() => sample.inner));
  let model = $state<unknown>(untrack(() => sample.family === 'mentions' ? '' : null));
  let query = $state('');
  let events = $state<unknown[][]>([]);
  let getterCalls = $state<{ tag: string; anchor: boolean }[]>([]);
  let host = $state<HTMLElement>();
  let shadow = $state<ShadowRoot>();
  let publicRoot = $state<HTMLDivElement>();
  let control = $state<object>();

  function provider(value: PopupOverflowDescriptor): Partial<ConfigProviderProps> {
    return value === 'omitted' ? {} : { popupOverflow: value === 'undefined' ? undefined : value };
  }
  function getPopupContainer(trigger?: HTMLElement) {
    untrack(() => {
      getterCalls.push({ tag: trigger?.tagName.toLowerCase() ?? 'undefined',
        anchor: Boolean(trigger) && trigger === readRefs().anchor });
    });
    return sample.globalContainer === 'shadow' ? shadow! : document.body;
  }
  let outerProps = $derived({
    ...provider(outer), ...(sample.globalContainer ? { getPopupContainer } : {})
  });
  let innerProps = $derived(provider(inner));

  function change(next: unknown) {
    model = next ?? null;
    events.push(['change', next ?? null]);
  }
  function copyShadowStyles() {
    if (!shadow) return;
    for (const node of shadow.querySelectorAll('[data-overflow-shadow-style]')) node.remove();
    for (const original of document.head.querySelectorAll('style,link[rel="stylesheet"]')) {
      const node = original.cloneNode(true) as HTMLElement;
      node.setAttribute('data-overflow-shadow-style', '');
      shadow.append(node);
    }
  }
  export function update(action: PopupOverflowAction) {
    if (action.type === 'context') {
      if (action.layer === 'outer') outer = action.value;
      else inner = action.value;
    }
  }
  export function readRefs() {
    const root = sample.family === 'color-picker'
      ? host?.ownerDocument.querySelector<HTMLElement>('.ant-color-picker-format-select')
      : sample.family === 'pagination' || sample.family === 'calendar'
        ? host?.querySelector<HTMLElement>('.ant-select')
        : host?.querySelector<HTMLElement>('.popup-overflow-control');
    const anchor = host?.querySelector<HTMLElement>('[data-overflow-anchor]') ?? root;
    const editor = root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input[role="combobox"],input,textarea')
      ?? (root?.matches('input,textarea') ? root as HTMLInputElement | HTMLTextAreaElement : undefined);
    return { root, anchor, editor, control, publicRoot, getterCalls };
  }
  export function readEvents() { return events; }
  export function readModel() { return model; }
  export function readQuery() { return query; }
  export function readContext() {
    const receipt = (value: PopupOverflowDescriptor) => {
      const props = provider(value);
      return { keyPresent: Object.hasOwn(props, 'popupOverflow'),
        type: typeof props.popupOverflow, value: props.popupOverflow ?? null };
    };
    return {
      outer: receipt(outer),
      inner: receipt(inner),
      globalContainer: sample.globalContainer ?? 'default'
    };
  }
  export function readGetterCalls() { return getterCalls; }
</script>

<section data-overflow-case={sample.id} data-overflow-family={sample.family}
  data-overflow-reader={sample.reader} data-overflow-bound={Boolean(host)} bind:this={host}
  style="font-family:initial;font-size:16px;line-height:normal;direction:ltr">
  <ConfigProvider {...outerProps} direction={sample.direction ?? 'ltr'} {theme} locale={enUS}>
    <ConfigProvider {...innerProps}>
      <div data-overflow-position
        style={`position:absolute;left:${position.left}px;top:${position.top}px;width:${position.width}px`}>
        {#if sample.family === 'pagination'}
          <Pagination id="overflow-field" class="popup-overflow-control"
            style={'publicStyle' in sample ? sample.publicStyle : 'width:100%'}
            total={500} current={1} pageSize={10} showSizeChanger bind:this={control} />
        {:else if sample.family === 'calendar'}
          <Calendar id="overflow-field" class="popup-overflow-control" style="width:100%"
            value={date} fullscreen={false} bind:this={control} bind:nativeElement={publicRoot} />
        {:else if sample.family === 'color-picker'}
          <ColorPicker id="overflow-field" class="popup-overflow-control" style="width:100%"
            value="#1677ff" open={true} bind:this={control} />
        {:else if sample.family === 'tooltip'}
          <Tooltip title="Overflow tooltip" trigger="click">
            <button type="button" class="popup-overflow-control" style="width:100%">Tooltip trigger</button>
          </Tooltip>
        {:else if sample.family === 'date-picker'}
          <DatePicker id="overflow-field" class="popup-overflow-control" style="width:100%"
            value={date} bind:this={control} bind:nativeElement={publicRoot} />
        {:else if sample.family === 'mentions'}
          <Mentions id="overflow-field" class="popup-overflow-control" style="width:100%"
            value={typeof model === 'string' ? model : ''} onChange={change}
            options={[{ value: 'alpha', label: 'Alpha' }, { value: 'beta', label: 'Beta' }]}
            bind:this={control} bind:nativeElement={publicRoot} />
        {:else}
          <CascaderPanel id="overflow-field" class="popup-overflow-control" style="width:100%"
            options={data.cascader} bind:this={control} bind:nativeElement={publicRoot} />
        {/if}
      </div>
    </ConfigProvider>
  </ConfigProvider>
  <div data-overflow-shadow style="display:contents" {@attach node => untrack(() => {
    const root = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
    shadow = root;
    copyShadowStyles();
    return () => { if (shadow === root) shadow = undefined; };
  })}></div>
  <button type="button" data-overflow-outside style="position:fixed;left:16px;top:80px">Outside overflow</button>
  <output data-overflow-context hidden>{JSON.stringify(readContext())}</output>
  <output data-overflow-model hidden>{JSON.stringify(model)}</output>
  <output data-overflow-query hidden>{JSON.stringify(query)}</output>
  <output data-overflow-events hidden>{JSON.stringify(events)}</output>
  <output data-overflow-getters hidden>{JSON.stringify(getterCalls)}</output>
  <div data-overflow-command hidden {@attach node => {
    const command = (event: Event) => update((event as CustomEvent<PopupOverflowAction>).detail);
    const refs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('overflowupdate', command);
    node.addEventListener('overflowrefs', refs);
    node.addEventListener('overflowstyles', copyShadowStyles);
    return () => {
      node.removeEventListener('overflowupdate', command);
      node.removeEventListener('overflowrefs', refs);
      node.removeEventListener('overflowstyles', copyShadowStyles);
    };
  }}></div>
</section>

<style>
  :global(body) { margin:0;min-width:2200px;min-height:2000px; }
</style>
