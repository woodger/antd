<script lang="ts">
  import { untrack } from 'svelte';
  import { AutoComplete, ConfigProvider, Select, TreeSelect } from '@woodger/antd-svelte';
  import {
    popupWidthData, popupWidthGeometry, popupWidthProps, popupWidthReceipt,
    type PopupWidthAction, type PopupWidthSample
  } from './popup-width-cases';

  let { sample, named = false }: { sample: PopupWidthSample; named?: boolean } = $props();
  const data = untrack(() => popupWidthData(sample));
  const theme = { token: { motion: false }, cssVar: { key: 'popup-width' } };
  const initialPosition = untrack(() => sample.layout === 'rtl'
    ? popupWidthGeometry.rtl : sample.layout === 'scaled-shadow'
      ? { left: popupWidthGeometry.surface.rootLeft, top: popupWidthGeometry.surface.rootTop,
        width: popupWidthGeometry.plain.width } : popupWidthGeometry.plain);
  let outer = $state(untrack(() => sample.outer));
  let inner = $state(untrack(() => sample.inner));
  let local = $state(untrack(() => sample.local));
  let anchorWidth = $state<number>(untrack(() => initialPosition.width));
  let outerProps = $derived(popupWidthProps(outer));
  let innerProps = $derived(popupWidthProps(inner));
  // The object keeps signed zero intact across Svelte's primitive derived equality.
  let localProps = $derived({ value: popupWidthProps(local) });
  let open = $state(false);
  let model = $state<unknown>(untrack(() => sample.family === 'auto-complete' ? '' : null));
  let query = $state('');
  let events = $state<unknown[][]>([]);
  let getterCalls = $state<{ tag: string; anchor: boolean }[]>([]);
  let host = $state<HTMLElement>();
  let shadow = $state<ShadowRoot>();
  let publicRoot = $state<HTMLDivElement>();
  let treeEditor = $state<HTMLInputElement>();
  let autoEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let control = $state<object>();
  let name = $derived(named ? 'width-selection' : undefined);
  let positionStyle = $derived(`position:absolute;left:${initialPosition.left}px;top:${initialPosition.top}px;width:${anchorWidth}px`);

  function record(...entry: unknown[]) { events.push(entry); }
  function change(next: unknown) {
    model = next ?? null;
    if (sample.family === 'auto-complete') query = typeof next === 'string' ? next : '';
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
  function getPopupContainer(trigger?: HTMLElement) {
    untrack(() => getterCalls.push({ tag: trigger?.tagName.toLowerCase() ?? 'none',
      anchor: Boolean(trigger && trigger === readRefs().anchor) }));
    return shadow!;
  }
  let containerProps = $derived(sample.layout === 'scaled-shadow' ? { getPopupContainer } : {});
  function copyShadowStyles() {
    if (!shadow) {
      return;
    }
    for (const node of shadow.querySelectorAll('[data-width-shadow-style]')) node.remove();
    for (const original of document.head.querySelectorAll('style,link[rel="stylesheet"]')) {
      const node = original.cloneNode(true) as HTMLElement;
      node.setAttribute('data-width-shadow-style', '');
      shadow.append(node);
    }
  }
  function attachShadow(node: HTMLElement) {
    return untrack(() => {
      const root = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
      shadow = root;
      copyShadowStyles();
      return () => { if (shadow === root) shadow = undefined; };
    });
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
    else if (action.type === 'open') open = action.value;
  }
  export function readRefs() {
    const publicEditor = treeEditor ?? autoEditor;
    const root = host?.querySelector<HTMLElement>('[data-ant-select-control]')
      ?? publicRoot ?? host?.querySelector<HTMLElement>('.popup-width-control');
    const editor = publicEditor ?? root?.querySelector<HTMLInputElement>('input[role="combobox"]');
    return { root, anchor: root, editor, control, publicRoot, publicEditor, getterCalls };
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

{#snippet field()}
  {#if sample.family === 'tree-select'}
    <TreeSelect {...localProps.value} id="width-field" class="popup-width-control" style="width:100%" {name}
      treeData={data.tree} value={typeof model === 'string' ? model : null} {open}
      showSearch={{ searchValue: query, filterTreeNode: false, onSearch: search }}
      onOpenChange={opening} onChange={change}
      bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={treeEditor} />
  {:else if sample.family === 'select'}
    <Select {...localProps.value} id="width-field" class="popup-width-control" style="width:100%" {name}
      options={data.flat} value={typeof model === 'string' ? model : undefined} {open}
      showSearch={{ searchValue: query, filterOption: false, onSearch: search }}
      onOpenChange={opening} onValueChange={change} bind:this={control} />
  {:else}
    <AutoComplete {...localProps.value} id="width-field" class="popup-width-control" style="width:100%" {name}
      options={data.flat} value={typeof model === 'string' ? model : ''} {open}
      showSearch={{ filterOption: false, onSearch: search }} onOpenChange={opening} onChange={change}
      bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoEditor} />
  {/if}
{/snippet}

<section data-width-case={sample.id} data-width-family={sample.family} data-width-bound={Boolean(control)}
  bind:this={host} style="font-family:initial;font-size:16px;line-height:normal;direction:ltr">
  <ConfigProvider {...outerProps} {...containerProps} popupOverflow="viewport"
    direction={sample.layout === 'rtl' ? 'rtl' : 'ltr'} {theme}>
    <ConfigProvider {...innerProps}>
      {#if sample.layout === 'scaled-shadow'}
        <div data-width-surface style={`position:absolute;left:${popupWidthGeometry.surface.left}px;top:${popupWidthGeometry.surface.top}px;width:${popupWidthGeometry.surface.width}px;height:${popupWidthGeometry.surface.height}px;transform:scale(${popupWidthGeometry.surface.scale});transform-origin:0 0`}>
          <div data-width-position style={positionStyle}>{@render field()}</div>
          <div data-width-shadow style="display:contents" {@attach attachShadow}></div>
        </div>
      {:else}<div data-width-position style={positionStyle}>{@render field()}</div>{/if}
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
    node.addEventListener('widthstyles', copyShadowStyles);
    return () => {
      node.removeEventListener('widthupdate', command);
      node.removeEventListener('widthrefs', refs);
      node.removeEventListener('widthstyles', copyShadowStyles);
    };
  }}></div>
</section>

<style>:global(body) { margin:0;min-width:2200px;min-height:1800px; }</style>
