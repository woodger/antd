<script lang="ts" generics="Item">
  import { untrack } from 'svelte';
  import { connectListyGestures } from './listy-gestures.dom';
  import ListyScrollbar from './ListyScrollbar.svelte';
  import type { SelectOptionListItem, SelectOptionListProps } from './select-option-list.types';
  import { createSelectStyle, selectStyleAttributes } from './select-style.model.svelte';

  let {
    model,
    renderItem,
    id,
    getItemId,
    prefixCls,
    class: className,
    style,
    direction = 'ltr',
    showScrollBar = 'optional',
    activeIndex = -1,
    ariaLabel,
    multiple,
    busy,
    onScroll,
    holderElement = $bindable(),
    listElement = $bindable()
  }: SelectOptionListProps<Item> = $props();

  let inner = $state<HTMLDivElement>();
  let connectedHolder: HTMLDivElement | undefined;
  const listStyle = createSelectStyle(() => style, () => ['position:relative']);
  const initialListStyle = untrack(listStyle.initialStyle);
  let listPrefix = $derived(`${prefixCls}-dropdown-list`);
  let viewport = $derived(model.viewport);
  let items = $derived(model.items);
  let range = $derived(viewport.range);
  let visible = $derived(items.slice(range.start, range.end + 1));
  let screenReaderItems = $derived([activeIndex - 1, activeIndex, activeIndex + 1]
    .flatMap(index => items[index] ? [items[index]] : []));

  function itemId(index: number) { return getItemId?.(index) ?? `${id}_${index}`; }
  function attributes(row: SelectOptionListItem<Item>) {
    const option = !model.realVirtual && !row.group;
    return { id: option ? itemId(row.originalIndex) : undefined,
      role: option ? 'option' as const : undefined,
      'aria-selected': option ? row.ariaSelected : undefined,
      'aria-disabled': row.group ? undefined : row.disabled ?? row.ariaDisabled };
  }

  $effect(() => {
    const holder = holderElement;
    const content = inner;
    const current = model;
    if (!holder || !content) return;
    return untrack(() => {
      connectedHolder = holder;
      const disconnect = current.connect(holder, content);
      return () => {
        if (connectedHolder === holder) connectedHolder = undefined;
        disconnect();
      };
    });
  });

  $effect(() => {
    const holder = holderElement;
    const current = viewport;
    const useVirtual = range.useVirtual;
    const virtual = range.virtual;
    if (!holder) return;
    return untrack(() => connectListyGestures(holder, {
      useVirtual,
      virtual,
      top: () => current.top,
      maximum: () => (current.range.scrollHeight ?? NaN) - (model.height ?? NaN),
      scrollBy: current.scrollBy
    }));
  });

  function handleScroll(event: UIEvent & { currentTarget: HTMLDivElement }) {
    if (event.currentTarget !== connectedHolder || !event.currentTarget.isConnected) return;
    if (model.initializingScroll(event)) return;
    const top = event.currentTarget.scrollTop;
    if (top !== viewport.top) viewport.sync(top);
    onScroll?.call(event.currentTarget, event);
  }
  function handleMouseEnter() {
    if (connectedHolder?.isConnected) viewport.flashScrollbar();
  }
</script>

{#if model.realVirtual}
  <div role="listbox" {id} aria-label={ariaLabel}
    aria-multiselectable={multiple || undefined} aria-busy={busy || undefined}
    style="height:0;width:0;overflow:hidden">
    {#each screenReaderItems as row (row.originalIndex)}
      <div aria-label={row.ariaLabel} {...row.ariaAttributes}
        role={row.group ? 'presentation' : 'option'} id={itemId(row.originalIndex)}
        aria-selected={row.ariaSelected} aria-disabled={row.ariaDisabled}>{row.ariaValue ?? ''}</div>
    {/each}
  </div>{/if}<div bind:this={listElement} class={[listPrefix, direction === 'rtl' && `${listPrefix}-rtl`, className]}
  dir={direction === 'rtl' ? 'rtl' : undefined} style={initialListStyle} {...selectStyleAttributes(style)} {@attach listStyle.attach}>
  <!-- svelte-ignore a11y_no_static_element_interactions (Source holder лишь показывает scrollbar; listbox принадлежит srlist либо inner.) -->
  <div bind:this={holderElement} class={`${listPrefix}-holder`} onscroll={handleScroll}
    onmouseenter={handleMouseEnter}
    style={model.height ? `max-height:${model.height}px;overflow-y:${range.useVirtual ? 'hidden' : 'auto'};overflow-anchor:none;${range.useVirtual && viewport.moving ? 'pointer-events:none' : ''}` : undefined}>
    <div style={range.offset !== undefined
      ? `height:${range.scrollHeight}px;position:relative;overflow:hidden` : undefined}>
      <div bind:this={inner} class={`${listPrefix}-holder-inner`}
        role={model.realVirtual ? undefined : 'listbox'} id={model.realVirtual ? undefined : id}
        aria-label={model.realVirtual ? undefined : ariaLabel}
        aria-multiselectable={model.realVirtual ? undefined : multiple || undefined}
        aria-busy={model.realVirtual ? undefined : busy || undefined}
        style={`display:flex;flex-direction:column;${range.offset !== undefined
          ? `position:absolute;left:0;right:0;top:0;transform:translateY(${range.offset}px);${direction === 'rtl' ? 'margin-right' : 'margin-left'}:0` : ''}`}>
        {#each visible as row (row.key)}
          {@render renderItem(row.item, { index: row.originalIndex, virtual: model.realVirtual,
            attach: node => viewport.attach(node, row.key), attributes: attributes(row) })}
        {/each}
      </div>
    </div>
  </div>{#if range.virtual && (range.scrollHeight ?? 0) > (model.height ?? 0)}
    <ListyScrollbar prefixCls={listPrefix} rtl={direction === 'rtl'} {showScrollBar}
      offset={viewport.top} range={range.scrollHeight ?? 0} size={viewport.holderHeight}
      flash={viewport.flash} onScroll={viewport.sync}
      onMoving={value => { viewport.moving = value; }} />
  {/if}
</div>
