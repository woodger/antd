<script lang="ts">
  // Хранит черновик условий фильтра до confirm/reset. Popup управляет фокусом отдельно от
  // применённых фильтров Table.
  import { useConfig } from './config-context';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { snapshotTableFilterOptions } from './table-filter-options.engine';
  import { normalizeTableFilter } from './table.engine';
  import type {
    TableFilterMode, TableFilterOption, TableFilterSearch, TableFilterValue
  } from './table.types';
  import { ruRU } from './types';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import TableFilterOptions from './TableFilterOptions.svelte';

  let {
    prefixCls, dropdownPrefix, title, options, value, filtered, resetValues, multiple, disabled,
    filterMode = 'menu', filterSearch = false, onApply
  }: {
    prefixCls: string;
    dropdownPrefix: string;
    title: string;
    options: readonly TableFilterOption[];
    value: readonly TableFilterValue[];
    filtered?: boolean;
    resetValues?: readonly TableFilterValue[] | null;
    multiple: boolean;
    disabled: boolean;
    filterMode?: TableFilterMode;
    filterSearch?: TableFilterSearch;
    onApply: (values: TableFilterValue[]) => void;
  } = $props();

  const config = useConfig();
  const designTheme = useDesignTokenContext();
  const id = $props.id();
  let trigger = $state<HTMLButtonElement>();
  let panel = $state<HTMLDivElement>();
  let open = $state(false);
  let visited = $state(false);
  let draft = $state<TableFilterValue[]>([]);
  let query = $state('');
  let openedValue: TableFilterValue[] = [];
  let openedOptions: ReturnType<typeof snapshotTableFilterOptions> = [];
  let openedMultiple = true;
  let openedMode: TableFilterMode = 'menu';
  let openedSearch: TableFilterSearch = false;
  let label = $derived(`${config.locale.table?.filterTitle ?? ruRU.table.filterTitle}: ${title}`);
  const optionSnapshot = $derived(snapshotTableFilterOptions(options));
  const advanced = $derived(
    filterMode === 'tree' || Boolean(filterSearch) || options.some(option => option.children)
  );
  const resetValue = $derived(normalizeTableFilter(options, resetValues, multiple));
  const canReset = $derived(
    draft.length !== resetValue.length || draft.some(value => !resetValue.includes(value))
  );

  $effect(() => {
    if (!open || !panel) {
      return;
    }

    const sameValue = value.length === openedValue.length
      && value.every(
        (item) => openedValue.includes(item)
      );
    const sameOptions = optionSnapshot.length === openedOptions.length
      && optionSnapshot.every(
        (item, index) => Object.is(item.value, openedOptions[index].value)
          && item.text === openedOptions[index].text
          && item.children === openedOptions[index].children
      );

    if (disabled || !sameValue || !sameOptions || multiple !== openedMultiple
      || filterMode !== openedMode || filterSearch !== openedSearch) {
      panel.hidePopover();
    }
  });

  $effect(() => {
    if (!open || !panel || !trigger) {
      return;
    }

    positionPanel();
    const focusFrame = requestAnimationFrame(() => {
      positionPanel();

      if (panel?.matches(':popover-open')
        && (document.activeElement === panel
          || !panel.contains(
            document.activeElement
          ))) {
        focusOptions();
      }
    });
    const observer = new ResizeObserver(positionPanel);
    observer.observe(panel);
    for (const cell of trigger.closest('tr')?.cells ?? [])
      observer.observe(cell);
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);

    return () => {
      cancelAnimationFrame(focusFrame);
      observer.disconnect();
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
    };
  });

  function positionPanel() {
    if (!panel?.matches(':popover-open') || !trigger) {
      return;
    }

    const anchor = trigger.getBoundingClientRect();
    const bounds = panel.getBoundingClientRect();
    const start = config.direction === 'rtl' ? anchor.right - bounds.width : anchor.left;
    panel.style.left = `${Math.max(8, Math.min(start, window.innerWidth - bounds.width - 8))}px`;
    const below = anchor.bottom + 4;
    panel.style.top = `${Math.max(
      8,
      Math.min(
        below + bounds.height <= window.innerHeight - 8 ? below : anchor.top - bounds.height - 4,
        window.innerHeight - bounds.height - 8
      )
    )}px`;
    panel.style.opacity = '1';
    panel.style.pointerEvents = 'auto';
  }

  /** Фокусирует поиск, навигацию Menu/Tree или выбранный нативный input. */
  function focusOptions(preferChecked = true) {
    if (!panel) {
      return;
    }

    const checked = preferChecked ? panel.querySelector<HTMLElement>('input:checked') : null;
    const target = panel.querySelector<HTMLElement>('[data-ant-table-filter-search] input')
      ?? panel.querySelector<HTMLElement>('[role="tree"], [role="menu"]')
      ?? checked
      ?? panel.querySelector<HTMLElement>('input');
    target?.focus({ preventScroll: true });
  }

  /** Оставляет подменю внутри панели для фокуса и light dismiss. */
  function submenuContainer(anchor: HTMLElement) {
    return panel ?? anchor.ownerDocument.body;
  }

  function beforeToggle(event: ToggleEvent) {
    if (event.newState === 'open') {
      if (disabled) {
        event.preventDefault();
        return;
      }

      openedValue = [...value];
      openedOptions = optionSnapshot;
      openedMultiple = multiple;
      openedMode = filterMode;
      openedSearch = filterSearch;
      draft = [...value];
      panel?.style.setProperty('opacity', '0');
      panel?.style.setProperty('pointer-events', 'none');
      visited = true;
      open = true;
    }
    else {
      open = false;
      query = '';
    }
  }

  function close() {
    panel?.hidePopover();
    trigger?.focus();
  }

  function confirm() {
    if (disabled) {
      return;
    }

    const selected = [...draft];
    close();
    onApply(selected);
  }

  function reset() {
    focusOptions(false);
    query = '';
    draft = [...resetValue];
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
    else if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      event.stopPropagation();
      if (!event.target.closest('[data-ant-table-filter-search]')) {
        confirm();
      }
    }
  }

  function handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;

    if (next instanceof Node && (panel?.contains(next) || next === trigger)) {
      return;
    }

    if (panel?.matches(':popover-open')) {
      panel.hidePopover();
    }
  }
</script>

<style>
  [data-ant-table-filter-part="trigger"] { flex: none; min-width: 24px; min-height: 24px; border: 0; background: transparent; font: inherit; }
  [data-ant-table-filter-part="trigger"]:disabled { cursor: not-allowed; }
  [data-ant-table-filter-part="trigger"]:focus-visible { outline: var(--ant-line-width-focus) solid var(--ant-color-primary-border); outline-offset: 2px; }
  /* visibility наследуется Checkbox с transition: all и задерживает фокус при открытии. */
  .filter-popover { position: fixed; inset: auto; width: min(260px, calc(100vw - 16px)); max-height: min(360px, calc(100dvh - 16px)); margin: 0; padding: 0; overflow-y: auto; opacity: 0; pointer-events: none; border: 0; border-radius: var(--ant-border-radius-lg); background: var(--ant-color-bg-container); color: var(--ant-color-text); box-shadow: var(--ant-box-shadow-secondary); font: var(--ant-font-size)/var(--ant-line-height) var(--ant-font-family); font-weight: 400; text-align: start; }
  .table-filter-source, .table-filter-source [data-ant-table-filter-part="dropdown"] { background: var(--ant-table-filter-dropdown-bg); }
  [data-ant-table-filter-part="buttons"] { display: flex; justify-content: space-between; gap: var(--ant-margin-xs); padding: var(--ant-padding-xs); border-top: var(--ant-line-width) solid var(--ant-color-border-secondary); }
  .table-filter-source [data-ant-table-filter-part="buttons"] { border-top-color: var(--ant-table-border-color); }
</style>

<button
  data-ant-table-filter-part="trigger"
  bind:this={trigger}
  type="button"
  class={[`${prefixCls}-filter-trigger`, (value.length > 0 || filtered) && 'active']}
  {disabled}
  aria-label={label}
  aria-haspopup="dialog"
  aria-expanded={open}
  aria-controls={`ant-filter-${id}`}
  popovertarget={`ant-filter-${id}`}
><Icon name="filter" /></button>
<div bind:this={panel} id={`ant-filter-${id}`} class={[`filter-popover ${config.getPrefixCls('dropdown')}`, designTheme.enabled && 'table-filter-source']} popover="auto" role="dialog" tabindex="-1" aria-label={label} dir={config.direction} onbeforetoggle={beforeToggle} onkeydown={handleKeydown} onfocusout={handleFocusOut}>
  <div data-ant-table-filter-part="dropdown" data-ant-table-prefix={prefixCls} data-ant-table-root-prefix={config.getPrefixCls()} class={`${prefixCls}-filter-dropdown`}>
    {#if visited || !advanced}
      <TableFilterOptions {prefixCls} {dropdownPrefix} {label} {id} {options} {multiple}
        {disabled} {open} mode={filterMode} search={filterSearch} bind:draft bind:query
        getPopupContainer={submenuContainer} />
    {/if}
    <div data-ant-table-filter-part="buttons" class={`${prefixCls}-filter-dropdown-btns`}>
      <Button type="text" size="small" disabled={disabled || !canReset} onclick={reset}>{config.locale.table?.filterReset ?? ruRU.table.filterReset}</Button>
      <Button type="primary" size="small" {disabled} onclick={confirm}>{config.locale.table?.filterApply ?? ruRU.table.filterApply}</Button>
    </div>
  </div>
</div>
