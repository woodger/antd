<script lang="ts">
  // Хранит черновик и связывает операции панели с применённым фильтром Table.
  // Настроенная панель использует Dropdown для размещения, портала и фокуса.
  import { untrack } from 'svelte';
  import { on } from 'svelte/events';
  import { useConfig } from './config-context';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { componentThemeVariables } from './theme-component-style.engine';
  import { provideZIndex, useZIndex } from './z-index-context.svelte';
  import type { DropdownProps } from './dropdown.types';
  import {
    areTableFilterOptionsEqual, snapshotTableFilterOptions
  } from './table-filter-options.engine';
  import type { TableFilterLocale } from './table-locale.engine';
  import { normalizeTableFilter } from './table.engine';
  import type {
    TableColumn, TableFilterConfirmOptions, TableFilterDropdownOptions, TableFilterDropdownProps,
    TableFilterMode, TableFilterOption, TableFilterResetOptions, TableFilterSearch, TableFilterValue
  } from './table.types';
  import Button from './Button.svelte';
  import Dropdown from './Dropdown.svelte';
  import Icon from './Icon.svelte';
  import RenderContent from './RenderContent.svelte';
  import TableFilterCustomContent from './TableFilterCustomContent.svelte';
  import TableFilterOptions from './TableFilterOptions.svelte';

  let {
    prefixCls, dropdownPrefix, rootClassName, title, titleReference, options, value, filtered, resetValues,
    multiple, disabled, strings,
    filterMode = 'menu', filterSearch = false, filterDropdown, filterDropdownProps,
    filterOnClose = false, filterIcon, getPopupContainer, onApply
  }: {
    prefixCls: string;
    dropdownPrefix: string;
    rootClassName?: string;
    title: string;
    titleReference?: string;
    options?: readonly TableFilterOption[];
    value: readonly TableFilterValue[];
    filtered?: boolean;
    resetValues?: readonly TableFilterValue[] | null;
    multiple: boolean;
    disabled: boolean;
    strings: TableFilterLocale;
    filterMode?: TableFilterMode;
    filterSearch?: TableFilterSearch;
    filterDropdown?: TableColumn<object>['filterDropdown'];
    filterDropdownProps?: TableFilterDropdownOptions;
    filterOnClose?: boolean;
    filterIcon?: TableColumn<object>['filterIcon'];
    getPopupContainer?: DropdownProps['getPopupContainer'];
    onApply: (values: TableFilterValue[]) => void;
  } = $props();

  const config = useConfig();
  const designTheme = useDesignTokenContext();
  const layer = useZIndex('popup');
  const id = $props.id();
  let trigger = $state<HTMLButtonElement>();
  let panel = $state<HTMLDivElement>();
  let content = $state<HTMLDivElement>();
  let nativeOpen = $state(false);
  let requestedOpen = $state(false);
  const tableContainer = $derived(getPopupContainer ?? config.getPopupContainer);
  const hasPanelOptions = $derived(Boolean(filterDropdown || filterDropdownProps || filterOnClose));
  let retainedDropdown = $state(untrack(() => Boolean(tableContainer)));
  const usesDropdown = $derived(hasPanelOptions || Boolean(tableContainer) || retainedDropdown);
  const dropdownLayerVariable = '--ant-dropdown-z-index-popup';
  const dropdownZIndex = $derived(designTheme.enabled
    ? componentThemeVariables('Dropdown', designTheme.state.token)[dropdownLayerVariable]
    : undefined);
  // Встроенная панель передаёт ненулевой слой. В ветке Dropdown он вычисляется там.
  provideZIndex(() => usesDropdown || !layer.zIndex ? layer.parentZIndex : layer.contextZIndex);
  const blocked = $derived(disabled || Boolean(filterDropdownProps?.disabled));
  const open = $derived(
    usesDropdown ? !blocked && (filterDropdownProps?.open ?? requestedOpen) : nativeOpen
  );
  const dropdownPlacement = $derived(filterDropdownProps?.placement
    ?? (config.direction === 'rtl' ? 'bottomLeft' : 'bottomRight'));
  let visited = $state(false);
  let draft = $state<TableFilterValue[]>(untrack(() => usesDropdown ? [...value] : []));
  let query = $state('');
  let openedValue: TableFilterValue[] = [];
  let openedOptions: ReturnType<typeof snapshotTableFilterOptions> = [];
  let openedMultiple = true;
  let openedMode: TableFilterMode = 'menu';
  let openedSearch: TableFilterSearch = false;
  let dropdownApplied: TableFilterValue[] | undefined;
  const active = $derived(value.length > 0 || Boolean(filtered));
  const filterLabelId = `ant-filter-label-${id}`;
  const filterTitle = $derived(strings.filterTitle);
  const label = $derived(`${filterTitle}: ${title}`);
  const labelReference = $derived(titleReference ? `${filterLabelId} ${titleReference}` : undefined);
  const dropdownLabelReference = $derived(filterDropdownProps?.['aria-labelledby']
    ?? (filterDropdownProps?.['aria-label'] === undefined ? labelReference : undefined));
  const dropdownRootClass = $derived(
    [rootClassName, filterDropdownProps?.rootClassName].filter(Boolean).join(' ') || undefined
  );
  const optionList = $derived(options ?? []);
  const optionSnapshot = $derived(snapshotTableFilterOptions(optionList));
  const advanced = $derived(
    filterMode === 'tree' || Boolean(filterSearch) || optionList.some(option => option.children)
  );
  const resetValue = $derived(filterDropdown
    ? normalizeTableFilter(undefined, resetValues)
    : normalizeTableFilter(optionList, resetValues, multiple)
  );
  const canReset = $derived(!sameValues(draft, resetValue));
  const dropdownInfo: TableFilterDropdownProps = $derived({
    prefixCls: `${dropdownPrefix}-custom`,
    selectedKeys: draft,
    setSelectedKeys,
    confirm,
    clearFilters,
    filters: options,
    close,
    visible: open
  });

  // После подтверждения без закрытия значения владельца остаются источником черновика.
  $effect.pre(() => {
    if (tableContainer && !retainedDropdown) {
      // После выбора портала сохраняем триггер и черновик при смене или удалении resolver.
      retainedDropdown = true;
      if (nativeOpen) {
        requestedOpen = true;
        dropdownApplied = openedValue;
      }
    }

    if (usesDropdown) {
      nativeOpen = false;
      if (blocked) {
        requestedOpen = false;
      }
    }
    else {
      requestedOpen = false;
    }

    if (!usesDropdown || !open) {
      if (dropdownApplied) {
        dropdownApplied = undefined;
        query = '';
      }
      return;
    }

    if (!dropdownApplied || !sameValues(value, dropdownApplied)) {
      dropdownApplied = [...value];
      draft = [...value];
    }
  });

  $effect(() => {
    if (!open || hasPanelOptions || (!usesDropdown && !panel)) {
      return;
    }

    const sameOptions = areTableFilterOptionsEqual(optionSnapshot, openedOptions);

    if (blocked || !sameValues(value, openedValue) || !sameOptions || multiple !== openedMultiple
      || filterMode !== openedMode || filterSearch !== openedSearch) {
      if (usesDropdown) {
        requestedOpen = false;
      }
      else {
        panel?.hidePopover();
      }
    }
  });

  $effect(() => {
    if (!nativeOpen || !panel || !trigger) {
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

  function sameValues(left: readonly TableFilterValue[], right: readonly TableFilterValue[]) {
    return left.length === right.length && left.every(value => right.includes(value));
  }

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
    const surface = usesDropdown ? content : panel;
    if (!surface) {
      return;
    }

    const checked = preferChecked ? surface.querySelector<HTMLElement>('input:checked') : null;
    const target = surface.querySelector<HTMLElement>('[data-ant-table-filter-search] input')
      ?? surface.querySelector<HTMLElement>('[role="tree"], [role="menu"]')
      ?? checked
      ?? surface.querySelector<HTMLElement>('input');
    target?.focus({ preventScroll: true });
  }

  /** Оставляет подменю внутри панели для фокуса и light dismiss. */
  function submenuContainer(anchor: HTMLElement) {
    return panel ?? content?.closest<HTMLElement>('[data-ant-dropdown-popup]')
      ?? anchor.ownerDocument.body;
  }

  /** Фиксирует применённые критерии и варианты на момент открытия штатной панели. */
  function snapshotOpenState() {
    openedValue = [...value];
    openedOptions = optionSnapshot;
    openedMultiple = multiple;
    openedMode = filterMode;
    openedSearch = filterSearch;
  }

  function beforeToggle(event: ToggleEvent) {
    if (event.newState === 'open') {
      if (blocked) {
        event.preventDefault();
        return;
      }

      snapshotOpenState();
      draft = [...value];
      panel?.style.setProperty('opacity', '0');
      panel?.style.setProperty('pointer-events', 'none');
      visited = true;
      nativeOpen = true;
    }
    else {
      nativeOpen = false;
      query = '';
    }
  }

  function requestDropdownOpen(nextOpen: boolean) {
    requestedOpen = nextOpen;
    filterDropdownProps?.onOpenChange?.(nextOpen);
  }

  function handleDropdownOpenChange(nextOpen: boolean) {
    if (nextOpen && !hasPanelOptions) {
      snapshotOpenState();
    }

    if (!nextOpen && filterOnClose && !filterDropdown) {
      confirm();
      return;
    }

    requestDropdownOpen(nextOpen);
  }

  function setSelectedKeys(keys: readonly TableFilterValue[]) {
    draft = [...keys];
  }

  function close() {
    if (usesDropdown) {
      requestDropdownOpen(false);
      return;
    }

    panel?.hidePopover();
    trigger?.focus();
  }

  function confirm({ closeDropdown }: TableFilterConfirmOptions = { closeDropdown: true }) {
    if (blocked) {
      return;
    }

    if (closeDropdown) {
      close();
    }
    onApply([...draft]);
  }

  function clearFilters({ confirm, closeDropdown }: TableFilterResetOptions = {}) {
    if (blocked) {
      return;
    }

    if (confirm) {
      onApply([]);
    }
    if (closeDropdown) {
      close();
    }

    query = '';
    draft = [...resetValue];
  }

  function reset() {
    focusOptions(false);
    clearFilters();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
    else {
      handleInputKeydown(event);
    }
  }

  function handleInputKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (!event.target.closest('[data-ant-table-filter-search]')) {
      confirm();
    }
  }

  /** Передаёт фокус Dropdown редактору или штатным вариантам фильтра. */
  function connectDropdownContent(element: HTMLDivElement) {
    if (!hasPanelOptions || filterDropdownProps?.autoFocus) {
      element.tabIndex = -1;
    }
    const disconnectFocus = hasPanelOptions ? undefined
      : on(element, 'focus', () => focusOptions());
    const disconnectInput = filterDropdown ? undefined : on(element, 'keydown', handleInputKeydown);

    return () => {
      disconnectFocus?.();
      disconnectInput?.();
      element.removeAttribute('tabindex');
    };
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
  .filter-popover { z-index: var(--ant-dropdown-z-index-popup, 1050); }
  .dropdown-content {
    max-inline-size: calc(100vw - 16px);
    max-block-size: calc(100dvh - 16px);
    overflow-y: auto;
    border-radius: var(--ant-border-radius-lg);
    background: var(--ant-color-bg-elevated);
    color: var(--ant-color-text);
    box-shadow: var(--ant-box-shadow-secondary);
    font: var(--ant-font-size)/var(--ant-line-height) var(--ant-font-family);
    text-align: start;
  }
  .dropdown-options {
    inline-size: min(260px, calc(100vw - 16px));
    max-block-size: min(360px, calc(100dvh - 16px));
  }
  .table-filter-source, .table-filter-source [data-ant-table-filter-part="dropdown"] { background: var(--ant-table-filter-dropdown-bg); }
  [data-ant-table-filter-part="buttons"] { display: flex; justify-content: space-between; gap: var(--ant-margin-xs); padding: var(--ant-padding-xs); border-top: var(--ant-line-width) solid var(--ant-color-border-secondary); }
  .table-filter-source [data-ant-table-filter-part="buttons"] { border-top-color: var(--ant-table-border-color); }
</style>

{#snippet renderTrigger(native: boolean)}
  <button
    data-ant-table-filter-part="trigger"
    bind:this={trigger}
    type="button"
    class={[`${prefixCls}-filter-trigger`, active && 'active']}
    disabled={blocked}
    aria-label={label}
    aria-labelledby={labelReference}
    aria-haspopup="dialog"
    aria-expanded={native ? nativeOpen : false}
    aria-controls={native ? `ant-filter-${id}` : undefined}
    popovertarget={native ? `ant-filter-${id}` : undefined}
  >
    {#if filterIcon}
      <span aria-hidden="true">
        {#if typeof filterIcon === 'function'}{@render filterIcon(active)}
        {:else}<RenderContent value={filterIcon} />{/if}
      </span>
    {:else}
      <Icon name="filter" />
    {/if}
  </button>
{/snippet}

{#snippet renderContent()}
  <div
    bind:this={content}
    data-ant-table-filter-part="dropdown"
    data-ant-table-prefix={prefixCls}
    data-ant-table-root-prefix={config.getPrefixCls()}
    class={`${prefixCls}-filter-dropdown`}
    class:dropdown-content={usesDropdown}
    class:dropdown-options={usesDropdown && !filterDropdown}
    class:table-filter-source={usesDropdown && designTheme.enabled}
    {@attach usesDropdown ? connectDropdownContent : undefined}
  >
    {#if filterDropdown}
      <TableFilterCustomContent content={filterDropdown} info={dropdownInfo} />
    {:else}
      {#if usesDropdown || visited || !advanced}
        <TableFilterOptions {prefixCls} {dropdownPrefix} {label} labelledby={labelReference}
          {id} {strings} options={optionList}
          {multiple} disabled={blocked} {open} mode={filterMode} search={filterSearch}
          bind:draft bind:query getPopupContainer={tableContainer ?? submenuContainer}
          retainDropdownPopup={usesDropdown} />
      {/if}
      <div data-ant-table-filter-part="buttons" class={`${prefixCls}-filter-dropdown-btns`}>
        <Button type="text" size="small" disabled={blocked || !canReset}
          onclick={reset}><RenderContent value={strings.filterReset} /></Button>
        <Button type="primary" size="small" disabled={blocked}
          onclick={() => confirm()}><RenderContent value={strings.filterApply} /></Button>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet renderDropdown()}
  {#if filterDropdownProps?.popupRender}
    {@render filterDropdownProps.popupRender(renderContent)}
  {:else}
    {@render renderContent()}
  {/if}
{/snippet}

{#if labelReference}
  <span id={filterLabelId} hidden>{filterTitle}:</span>
{/if}
{#if usesDropdown}
  <Dropdown
    {...filterDropdownProps}
    getPopupContainer={filterDropdownProps?.getPopupContainer ?? getPopupContainer}
    autoFocus={hasPanelOptions ? filterDropdownProps?.autoFocus : true}
    rootClassName={dropdownRootClass}
    {open}
    disabled={blocked}
    placement={dropdownPlacement}
    trigger={filterDropdownProps?.trigger ?? 'click'}
    aria-label={filterDropdownProps?.['aria-label'] ?? label}
    aria-labelledby={dropdownLabelReference}
    onOpenChange={handleDropdownOpenChange}
    popupRender={renderDropdown}
  >
    {@render renderTrigger(false)}
  </Dropdown>
{:else}
  {@render renderTrigger(true)}
  <div
    bind:this={panel}
    id={`ant-filter-${id}`}
    class={[`filter-popover ${config.getPrefixCls('dropdown')}`, rootClassName,
      designTheme.enabled && 'table-filter-source']}
    popover="auto"
    role="dialog"
    tabindex="-1"
    style:z-index={layer.zIndex}
    style:--ant-dropdown-z-index-popup={dropdownZIndex}
    aria-label={label}
    aria-labelledby={labelReference}
    dir={config.direction}
    onbeforetoggle={beforeToggle}
    onkeydown={handleKeydown}
    onfocusout={handleFocusOut}
  >
    {@render renderContent()}
  </div>
{/if}
