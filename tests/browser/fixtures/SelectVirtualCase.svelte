<script lang="ts">
  import { createRawSnippet, untrack } from 'svelte';
  import {
    AutoComplete, ConfigProvider, Select, enUS,
    type AutoCompleteItem, type SelectFlattenOption, type SelectRef,
    type SelectScrollConfig, type SelectScrollOffsetInfo
  } from '@woodger/antd';
  import {
    selectVirtualChildHeight, selectVirtualData, selectVirtualGeometry, selectVirtualOptions,
    selectVirtualProps, selectVirtualProviderProps, selectVirtualReceipts,
    type SelectVirtualAction, type SelectVirtualSample, type SelectVirtualScrollTarget
  } from './select-virtual-cases';

  let { sample, named = false }: { sample: SelectVirtualSample; named?: boolean } = $props();
  const VirtualSelect = Select<string, 'multiple' | 'tags' | undefined>;
  const data = selectVirtualData();
  const autoData = untrack(() => data.map((option, index) => sample.variable ? {
    ...option,
    label: createRawSnippet(() => ({
      render: () => `<div data-select-virtual-render="${index}" data-select-virtual-key="${option.key}" style="height:${selectVirtualChildHeight(index)}px;display:block">${option.label}</div>`
    }))
  } : option));
  const theme = { token: { motion: false }, cssVar: { key: 'select-virtual' } };
  const position = untrack(() => sample.layout === 'rtl' ? selectVirtualGeometry.rtl
    : sample.layout === 'scaled-shadow'
      ? { left: selectVirtualGeometry.surface.rootLeft, top: selectVirtualGeometry.surface.rootTop,
        width: selectVirtualGeometry.plain.width } : selectVirtualGeometry.plain);
  let settings = $state(untrack(() => ({ ...sample })));
  let open = $state(false);
  let model = $state<unknown>(untrack(() => sample.initialValue ?? (sample.family === 'auto-complete' ? '' : null)));
  let query = $state<string>(untrack(() => sample.family === 'auto-complete' && typeof sample.initialValue === 'string'
    ? sample.initialValue : ''));
  let events = $state<unknown[][]>([]);
  let offsets = $state<unknown[]>([]);
  let renders = $state.raw<ReturnType<typeof renderReceipt>[]>([]);
  const renderMap = new Map<string | number | bigint, ReturnType<typeof renderReceipt>>();
  const shadowStyleCopies = new Map<HTMLStyleElement | HTMLLinkElement, HTMLStyleElement | HTMLLinkElement>();
  let host = $state<HTMLElement>();
  let shadow = $state<ShadowRoot>();
  let control = $state<SelectRef>();
  let publicRoot = $state<HTMLDivElement>();
  let selectEditor = $state<HTMLInputElement>();
  let autoEditor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let name = $derived(named ? 'virtual-selection' : undefined);
  let localProps = $derived(selectVirtualProps(settings));
  let outerProps = $derived({ ...selectVirtualProviderProps(settings.outer),
    ...(sample.layout === 'scaled-shadow' ? { getPopupContainer } : {}) });
  let innerProps = $derived(selectVirtualProviderProps(settings.inner));
  let options = $derived(selectVirtualOptions(data, settings.count));
  let autoOptions: readonly AutoCompleteItem[] = $derived(selectVirtualOptions(
    data,
    settings.count,
    sample.groups
  )
    .map(option => 'options' in option
      ? {
        ...option,
        options: option.options.map(item => autoData.find(original => original.key === item.key)!)
      }
      : autoData.find(original => original.key === option.key)!));

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
  function active(next: string | null) { record('active', next); }
  function focused() { record('focus'); }
  function blurred() { record('blur'); }
  function scrolled(event: UIEvent & { currentTarget: EventTarget & HTMLDivElement }) {
    const node = event.currentTarget;
    record('scroll', { trusted: event.isTrusted, tag: node.tagName,
      holder: node.classList.contains('ant-select-dropdown-list-holder'), top: node.scrollTop,
      left: node.scrollLeft, clientHeight: node.clientHeight, scrollHeight: node.scrollHeight });
  }
  function filterOption(text: string, option: { value: unknown }) {
    return String(option.value).includes(text);
  }
  function filterAutoOption(text: string, option: AutoCompleteItem) {
    return 'value' in option && String(option.value).includes(text);
  }
  function getPopupContainer() { return shadow!; }
  function copyShadowStyles() {
    if (!shadow) {
      return;
    }
    const originals = [...document.head.querySelectorAll<HTMLStyleElement | HTMLLinkElement>('style,link[rel="stylesheet"]')];
    for (const [original, copy] of shadowStyleCopies) {
      if (originals.includes(original)) continue;
      copy.remove();
      shadowStyleCopies.delete(original);
    }
    for (const [index, original] of originals.entries()) {
      let copy = shadowStyleCopies.get(original);
      if (!copy) {
        copy = original.cloneNode(true) as HTMLStyleElement | HTMLLinkElement;
        copy.setAttribute('data-select-virtual-copied', '');
        shadowStyleCopies.set(original, copy);
        const following = originals.slice(index + 1).map(node => shadowStyleCopies.get(node)).find(Boolean);
        shadow.insertBefore(copy, following ?? null);
      }
      else {
        for (const name of copy.getAttributeNames()) {
          if (name !== 'data-select-virtual-copied' && !original.hasAttribute(name)) copy.removeAttribute(name);
        }
        for (const attribute of original.attributes) {
          if (copy.getAttribute(attribute.name) !== attribute.value) {
            copy.setAttribute(
              attribute.name,
              attribute.value
            );
          }
        }
        if (original instanceof HTMLStyleElement && copy.textContent !== original.textContent)
          copy.textContent = original.textContent;
      }
    }
  }
  function attachShadow(node: HTMLElement) {
    return untrack(() => {
      const root = node.shadowRoot ?? node.attachShadow({ mode: 'open' });
      shadow = root;
      copyShadowStyles();
      return () => {
        for (const copy of shadowStyleCopies.values()) copy.remove();
        shadowStyleCopies.clear();
        if (shadow === root) shadow = undefined;
      };
    });
  }
  function renderReceipt(flat: SelectFlattenOption<string>, info: { index: number }) {
    return { key: flat.key, value: flat.value, index: info.index,
      sameOriginal: flat.data === data.find(option => option.value === flat.value),
      group: Boolean(flat.group), groupOption: Boolean(flat.groupOption) };
  }
  function rendered(flat: SelectFlattenOption<string>, info: { index: number }) {
    const receipt = renderReceipt(flat, info);
    if (JSON.stringify(renderMap.get(flat.key)) === JSON.stringify(receipt)) {
      return;
    }
    renderMap.set(flat.key, receipt);
    renders = [...renderMap.values()];
  }
  function sizeOffset(info: SelectScrollOffsetInfo) {
    const size = info.getSize('k-002', 'k-004');
    const value = Number(size.bottom) - size.top;
    offsets.push({ align: info.align ?? null, alignType: typeof info.align, start: 'k-002', end: 'k-004',
      size: { top: size.top, bottom: size.bottom ?? null }, value });
    return value;
  }
  function scrollTarget(target: SelectVirtualScrollTarget): SelectScrollConfig | null | undefined {
    if (target.kind === 'undefined') {
      return undefined;
    }
    if (target.kind === 'null') {
      return null;
    }
    if (target.kind === 'number') {
      return target.value;
    }
    if (target.kind === 'position') {
      return { ...('top' in target ? { top: target.top } : {}),
        ...('left' in target ? { left: target.left } : {}) };
    }
    const alignment = {
      ...('align' in target ? { align: target.align } : {}),
      ...('offset' in target ? { offset: target.offset === 'get-size' ? sizeOffset : target.offset } : {}) };
    if (target.kind === 'index') {
      return { index: target.index, ...alignment };
    }
    if (target.kind === 'key') {
      return { key: target.key, ...alignment };
    }
    return undefined;
  }
  export function update(action: SelectVirtualAction) {
    if (action.type === 'props') {
      settings = { ...settings, ...action.set };
    }
    else if (action.type === 'open') {
      open = action.value;
    }
    else if (action.type === 'value') {
      model = action.value;
      if (sample.family === 'auto-complete') query = typeof action.value === 'string' ? action.value : '';
    }
    else if (action.type === 'query') {
      query = action.text;
      if (sample.family === 'auto-complete') model = action.text;
    }
    else if (action.type === 'ref') {
      if (action.method === 'scrollTo') {
        control?.scrollTo(scrollTarget(action.target));
      }
      else if (action.method === 'focus') {
        control?.focus(action.options);
      }
      else {
        control?.blur();
      }
    }
  }
  export function readRefs() {
    const root = publicRoot ?? host?.querySelector<HTMLElement>('.select-virtual-control') ?? undefined;
    const publicEditor = sample.family === 'select' ? selectEditor : autoEditor;
    const editor = publicEditor ?? root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input,textarea') ?? undefined;
    return { root, anchor: root, editor, control, publicRoot, publicEditor, renders };
  }
  export function readReceipts() {
    return selectVirtualReceipts(settings, outerProps, innerProps, localProps);
  }
  export function readEvents() { return events; }
  export function readModel() { return model; }
  export function readQuery() { return query; }
  export function readOffsets() { return offsets; }
</script>

{#snippet optionRender(flat: SelectFlattenOption<string>, info: { index: number })}
  <div data-select-virtual-render={info.index} data-select-virtual-key={String(flat.key)}
    style={`height:${selectVirtualChildHeight(info.index)}px;`
      + `display:block`}
    {@attach () => untrack(() => rendered(flat, info))}>{flat.label}</div>
{/snippet}

{#snippet field()}
  {#if sample.family === 'select'}
    <VirtualSelect {...localProps} id="virtual-field" class="select-virtual-control" style="width:100%" {name}
      options={options as typeof data} mode={sample.mode}
      value={Array.isArray(model) ? model : typeof model === 'string' ? model : undefined} {open}
      showSearch={{ searchValue: query, filterOption: sample.scenario === 'search' ? filterOption : false, onSearch: search }}
      optionRender={sample.variable ? optionRender : undefined}
      onValueChange={change} onOpenChange={opening} onActive={active} onPopupScroll={scrolled}
      onfocus={sample.scenario === 'focus' ? focused : undefined} onblur={sample.scenario === 'focus' ? blurred : undefined}
      bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={selectEditor} />
  {:else}
    <AutoComplete {...localProps} id="virtual-field" class="select-virtual-control" style="width:100%" {name}
      options={autoOptions} value={query} {open}
      showSearch={{ filterOption: sample.scenario === 'search' ? filterAutoOption : false, onSearch: search }}
      onChange={change} onOpenChange={opening} onActive={active} onPopupScroll={scrolled}
      onFocus={sample.scenario === 'focus' ? focused : undefined} onBlur={sample.scenario === 'focus' ? blurred : undefined}
      bind:this={control} bind:nativeElement={publicRoot} bind:inputElement={autoEditor} />
  {/if}
{/snippet}

<section data-select-virtual-case={sample.id} data-select-virtual-family={sample.family}
  data-select-virtual-bound={Boolean(control)} bind:this={host}
  style={'font-family:initial;'
    + 'font-size:16px;'
    + 'line-height:normal;'
    + 'direction:ltr'}>
  <ConfigProvider {...outerProps} direction={sample.layout === 'rtl' ? 'rtl' : 'ltr'} {theme}
    popupOverflow="viewport" locale={enUS}>
    <ConfigProvider {...innerProps}>
      {#if sample.layout === 'scaled-shadow'}
        <div data-select-virtual-surface style={`position:absolute;`
          + `left:${selectVirtualGeometry.surface.left}px;`
          + `top:${selectVirtualGeometry.surface.top}px;`
          + `width:${selectVirtualGeometry.surface.width}px;`
          + `height:${selectVirtualGeometry.surface.height}px;`
          + `transform:scale(${selectVirtualGeometry.surface.scale});`
          + `transform-origin:0 0`}>
          <div data-select-virtual-position style={`position:absolute;`
            + `left:${position.left}px;`
            + `top:${position.top}px;`
            + `width:${position.width}px`}>{@render field()}</div>
          <div data-select-virtual-shadow style="display:contents" {@attach attachShadow}></div>
        </div>
      {:else}
        <div data-select-virtual-position style={`position:absolute;`
          + `left:${position.left}px;`
          + `top:${position.top}px;`
          + `width:${position.width}px`}>{@render field()}</div>
      {/if}
    </ConfigProvider>
  </ConfigProvider>
  <button type="button" data-select-virtual-outside style={'position:fixed;'
    + 'left:16px;'
    + 'top:80px'}>Outside virtual</button>
  <output data-select-virtual-receipts hidden>{JSON.stringify(readReceipts())}</output>
  <output data-select-virtual-model hidden>{JSON.stringify(model)}</output>
  <output data-select-virtual-query hidden>{JSON.stringify(query)}</output>
  <output data-select-virtual-events hidden>{JSON.stringify(events)}</output>
  <output data-select-virtual-offsets hidden>{JSON.stringify(offsets)}</output>
  <output data-select-virtual-renders hidden>{JSON.stringify(renders)}</output>
  <div data-select-virtual-command hidden {@attach node => {
    const onUpdate = (event: Event) => update((event as CustomEvent<SelectVirtualAction>).detail);
    const onRefs = (event: Event) => Object.assign((event as CustomEvent).detail, readRefs());
    node.addEventListener('virtualupdate', onUpdate);
    node.addEventListener('virtualrefs', onRefs);
    node.addEventListener('virtualstyles', copyShadowStyles);
    return () => {
      node.removeEventListener('virtualupdate', onUpdate);
      node.removeEventListener('virtualrefs', onRefs);
      node.removeEventListener('virtualstyles', copyShadowStyles);
    };
  }}></div>
</section>

<style>:global(body) {
    margin:0;
    min-width:2200px;
    min-height:1800px;
  }</style>
