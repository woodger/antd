<script lang="ts">
  import { untrack } from 'svelte';
  import {
    AutoComplete, Cascader, ConfigProvider, Select, TreeSelect,
    type CascaderTriggerInfo, type ConfigProviderProps
  } from 'antd-svelte';
  import {
    popupOverflowData, popupOverflowGeometry,
    type PopupOverflowAction, type PopupOverflowDescriptor, type PopupOverflowSample
  } from './popup-overflow-cases';

  let { sample, named = false }: { sample: PopupOverflowSample; named?: boolean } = $props();
  const data = untrack(() => popupOverflowData(sample));
  const theme = { token: { motion: false }, cssVar: { key: 'popup-overflow' } };
  let outer = $state(untrack(() => sample.outer));
  let inner = $state(untrack(() => sample.inner));
  let open = $state(false);
  let model = $state<unknown>(untrack(() => sample.family === 'auto-complete' ? ''
    : sample.family === 'cascader' ? [] : null));
  let query = $state('');
  let events = $state<unknown[][]>([]);
  let getterCalls = $state<{ tag: string; anchor: boolean }[]>([]);
  let host = $state<HTMLElement>();
  let clip = $state<HTMLDivElement>();
  let shadow = $state<ShadowRoot>();
  let publicRoot = $state<HTMLDivElement>();
  let treeEditor = $state<HTMLInputElement>();
  let autoEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let cascaderEditor = $state<HTMLInputElement>();
  let control = $state<object>();
  const position = untrack(() => sample.layout === 'right' ? popupOverflowGeometry.right
    : sample.layout === 'document' ? popupOverflowGeometry.documentRoot
      : sample.layout === 'clip'
        ? { left: popupOverflowGeometry.clip.rootLeft, top: popupOverflowGeometry.clip.rootTop,
          width: popupOverflowGeometry.clip.rootWidth }
        : popupOverflowGeometry.edge);

  function provider(value: PopupOverflowDescriptor): Partial<ConfigProviderProps> {
    return value === 'omitted' ? {} : { popupOverflow: value === 'undefined' ? undefined : value };
  }
  function getPopupContainer(trigger?: HTMLElement) {
    untrack(() => {
      getterCalls.push({ tag: trigger?.tagName.toLowerCase() ?? 'none',
        anchor: Boolean(trigger && trigger === readRefs().anchor) });
    });
    return sample.globalContainer === 'clip' ? clip! : sample.globalContainer === 'shadow'
      ? shadow! : document.body;
  }
  let outerProps = $derived({
    ...provider(outer),
    ...(sample.globalContainer ? { getPopupContainer } : {})
  });
  let innerProps = $derived(provider(inner));
  const rootStyle = 'width:100%';
  let positionStyle = $derived(`position:absolute;left:${position.left}px;top:${position.top}px;width:${position.width}px`);
  let name = $derived(named ? 'overflow-selection' : undefined);

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
    } else if (action.type === 'open') open = action.value;
  }
  export function readRefs() {
    const publicEditor = treeEditor ?? autoEditor ?? cascaderEditor;
    const root = host?.querySelector<HTMLElement>('[data-ant-select-control]')
      ?? publicRoot ?? host?.querySelector<HTMLElement>('.popup-overflow-control');
    const anchor = host?.querySelector<HTMLElement>('[data-overflow-anchor]') ?? root;
    const editor = publicEditor ?? root?.querySelector<HTMLInputElement>('input[role="combobox"]');
    return { root, anchor, editor, control, publicRoot, publicEditor, getterCalls };
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
    return { outer: receipt(outer), inner: receipt(inner), globalContainer: sample.globalContainer ?? 'default' };
  }
  export function readGetterCalls() { return getterCalls; }
</script>

{#snippet trigger(info: CascaderTriggerInfo)}
  <button type="button" data-overflow-anchor style="width:180px;height:40px"
    disabled={info.disabled} aria-expanded={info['aria-expanded']} aria-controls={info['aria-controls']}
    onclick={info.onClick} onkeydown={info.onKeyDown} onkeyup={info.onKeyUp}>Custom trigger</button>
{/snippet}

{#snippet field()}
  {#if sample.family === 'tree-select'}
    <TreeSelect id="overflow-field" class="popup-overflow-control" style={rootStyle} {name}
      treeData={data.tree} value={typeof model === 'string' ? model : null} {open}
      showSearch={{ searchValue: query, filterTreeNode: false, onSearch: search }} virtual={false}
      placement={sample.placement} popupAlign={sample.popupAlign} builtinPlacements={sample.builtinPlacements}
      popupMatchSelectWidth={sample.popupMatchSelectWidth}
      onOpenChange={opening} onChange={change}
      bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={treeEditor} />
  {:else if sample.family === 'select'}
    <Select id="overflow-field" class="popup-overflow-control" style={rootStyle} {name}
      options={data.flat} value={typeof model === 'string' ? model : undefined} {open} placement={sample.placement}
      showSearch={{ searchValue: query, filterOption: false, onSearch: search }}
      onOpenChange={opening} onValueChange={change} bind:this={control} />
  {:else if sample.family === 'auto-complete'}
    <AutoComplete id="overflow-field" class="popup-overflow-control" style={rootStyle} {name}
      options={data.flat} value={typeof model === 'string' ? model : ''} {open}
      showSearch={{ filterOption: false, onSearch: search }} popupMatchSelectWidth={sample.popupMatchSelectWidth}
      onOpenChange={opening} onChange={change}
      bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoEditor} />
  {:else}
    <Cascader id="overflow-field" class="popup-overflow-control" style={rootStyle}
      options={data.cascader} value={Array.isArray(model) ? model : []} {open}
      showSearch={{ filter: () => true, searchValue: query, onSearch: search }}
      placement={sample.placement} popupMatchSelectWidth={sample.popupMatchSelectWidth}
      children={sample.customTrigger ? trigger : undefined}
      onOpenChange={opening} onChange={change}
      bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={cascaderEditor} />
  {/if}
{/snippet}

<section data-overflow-case={sample.id} data-overflow-family={sample.family}
  data-overflow-bound={Boolean(control)} bind:this={host}
  style="font-family:initial;font-size:16px;line-height:normal;direction:ltr">
  <ConfigProvider {...outerProps} direction={sample.direction ?? 'ltr'} {theme}>
    <ConfigProvider {...innerProps}>
      {#if sample.layout === 'clip'}
        <div data-overflow-clip bind:this={clip} style={`position:absolute;left:${popupOverflowGeometry.clip.left}px;top:${popupOverflowGeometry.clip.top}px;width:${popupOverflowGeometry.clip.width}px;height:${popupOverflowGeometry.clip.height}px;overflow:auto`}>
          <div data-overflow-clip-content style={`position:relative;width:${popupOverflowGeometry.clip.contentWidth}px;height:${popupOverflowGeometry.clip.contentHeight}px`}>
            <div data-overflow-position style={positionStyle}>{@render field()}</div>
          </div>
        </div>
      {:else}<div data-overflow-position style={positionStyle}>{@render field()}</div>{/if}
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
