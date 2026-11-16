<script lang="ts">
  import { onMount, tick, untrack } from 'svelte';
  import type {
    AutoCompleteProps,
    AutoCompleteSearchConfig,
    AutoCompleteInput,
    AutoCompleteOption
  } from './auto-complete.types';
  import type { SelectScrollConfig } from './select.types';
  import {
    filterAutoCompleteOptions,
    flattenAutoCompleteOptions,
    autoCompleteNext,
    autoCompleteOption
  } from './auto-complete.engine';
  import type { AutoCompleteEntry } from './auto-complete.engine';
  import SelectOptionList from './SelectOptionList.svelte';
  import { createSelectOptionList } from './select-option-list.model.svelte';
  import type { SelectOptionListItem, SelectOptionListRenderInfo } from './select-option-list.types';
  import { createSelectActive } from './select-active.model.svelte';
  import { useConfig } from './config-context';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getSelectPrefixCss } from './select-prefix.engine';
  import { useVariant } from './variant.svelte';
  import { useCompact } from './space-compact-context';
  import { compactClasses } from './space-compact.engine';
  import { useForm, useFormField } from './form-context';
  import { useFormItemStatusContext } from './form-item-status';
  import { useFormFeedback } from './form-feedback-context';
  import FormFeedbackIcon from './FormFeedbackIcon.svelte';
  import { connectPopup } from './popup.dom';
  import { createTreeSelectAlign } from './tree-select-align.dom';
  import { createOverlayStyle } from './overlay-style.model.svelte';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { createPopupContainer } from './popup-container.model.svelte.js';
  import { useComponentTheme } from './theme-component.svelte';
  import { useToken } from './theme-context.svelte';
  import { connectComponentTheme } from './theme-component.dom';
  import Icon from './Icon.svelte';

  let {
    prefixCls,
    options = [],
    value,
    defaultValue,
    open,
    defaultOpen = false,
    showSearch = true,
    onChange,
    onSelect,
    onOpenChange,
    onClear,
    onInputKeyDown,
    onFocus,
    onBlur,
    onPopupScroll,
    getPopupContainer,
    backfill = false,
    defaultActiveFirstOption = false,
    allowClear = false,
    notFoundContent,
    popupMatchSelectWidth,
    listHeight = 256,
    listItemHeight,
    showScrollBar,
    onActive,
    size,
    status,
    variant,
    children,
    class: className = '',
    rootClassName = '',
    classNames,
    style,
    id,
    name,
    disabled,
    readonly,
    nativeElement = $bindable(),
    inputElement = $bindable(),
    ...attributes
  }: AutoCompleteProps = $props();
  const config = useConfig();
  const tokens = useToken();
  let { virtual, ...nativeAttributes } = $derived(attributes);
  let effectiveVirtual = $derived(Object.hasOwn(attributes, 'virtual') ? virtual : config.virtual);
  let prefix = $derived(config.getPrefixCls('select', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let privateNamespace = $derived(rootPrefix.replaceAll('.', ''));
  let prefixCss = $derived(getSelectPrefixCss(prefix, rootPrefix));
  const variantContext = useVariant('select', () => ({ variant }));
  let appearance = $derived(variantContext.variant);
  const controlRef = {
    get nativeElement() {
      return nativeElement;
    },
    focus, blur
  };
  const field = useFormField(() => controlRef);
  const itemStatus = useFormItemStatusContext();
  const feedback = useFormFeedback();
  const form = useForm();
  const compact = useCompact();
  const componentTheme = useComponentTheme('Select');
  const generated = $props.id();
  let innerValue = $state<string | undefined>(untrack(() => value ?? defaultValue));
  let innerOpen = $state(untrack(() => open ?? defaultOpen));
  let actualValue = $derived(value ?? innerValue);
  let text = $derived(actualValue ?? '');
  let blocked = $derived(
    disabled ?? field?.disabled ?? form?.disabled ?? config.componentDisabled
  );
  let resolvedSize = $derived(size ?? compact?.size ?? config.componentSize);
  let resolvedStatus = $derived(status ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let showClear = $derived(Boolean(allowClear && text && !blocked && !readonly));
  let controlId = $derived(id ?? field?.id ?? `ant-auto-complete-${generated}`);
  let searchConfig = $derived<AutoCompleteSearchConfig>(
    { ...(typeof showSearch === 'object' ? showSearch : {}) }
  );
  let entries = $derived(
    flattenAutoCompleteOptions(
      filterAutoCompleteOptions(options, text, searchConfig.filterOption ?? false)
    )
  );
  let allEntries = $derived(flattenAutoCompleteOptions(options));
  let count = $derived(entries.length);
  let hydrated = $state(false);
  let visible = $derived(
    hydrated
    && !blocked
    && !readonly
    && (open
      ?? innerOpen)
    && Boolean(
      entries.length || notFoundContent
    )
  );
  let active = $state(-1);
  let preview = $state<string>();
  let focused = $state(false);
  let root = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let popup = $state<HTMLDivElement>();
  let shown = $state(false);
  let popupPlacement = $state<string>();
  let mounted = $state(false);
  const anchorWidthVariable = '--ant-native-auto-complete-anchor-width';
  let matchedWidth = $derived(popupMatchSelectWidth ?? config.popupMatchSelectWidth ?? true);
  let realVirtual = $derived(effectiveVirtual !== false && matchedWidth !== false);
  let itemHeight = $derived(listItemHeight ?? tokens.token.controlHeight);
  let listLabel = $derived(attributes['aria-label'] ?? attributes.placeholder ?? config.locale.searchText);
  let popupLayers = $derived([
    componentTheme.style,
    `${matchedWidth === true ? 'width' : 'min-width'}:var(${anchorWidthVariable})`,
    typeof matchedWidth === 'number' ? [['width', `${matchedWidth}px`]] as const : undefined
  ]);
  const popupStyle = createOverlayStyle(() => popupLayers, anchorWidthVariable, () => visible);
  const portal = createPopupContainer(() => ({
    open: visible,
    reference: root,
    getPopupContainer: getPopupContainer || config.getPopupContainer,
    themeStyle: serializeInlineStyleLayers(popupLayers),
    preserveVariables: [anchorWidthVariable]
  }));
  let enterLock = false;
  let pendingClearClose: MessageChannel | undefined;
  let previous = untrack(() => ({ value, open }));
  onMount(() => {
    hydrated = true;
    return cancelClearClose;
  });

  // Без bind: обновление spread props может сбросить локальное значение ref prop.
  $effect(() => {
    nativeElement = root;
    return () => { nativeElement = undefined; };
  });
  $effect(() => {
    inputElement = editor;
    return () => { inputElement = undefined; };
  });

  $effect(() => {
    const next = { value, open };
    if (next.value !== previous.value) {
      innerValue = next.value;
      preview = undefined;
    }
    if (next.open !== previous.open) {
      cancelClearClose();
      innerOpen = Boolean(next.open);
    }
    previous = next;
  });
  $effect(() => {
    void text;
    void count;
    const expanded = visible;
    untrack(() => {
      preview = undefined;
      if (expanded)
        mounted = true;
    });
  });
  $effect(() => {
    if (!visible || !popup || !root) return;
    const node = popup;
    const anchor = root;
    const source = untrack(() => createTreeSelectAlign(anchor, node, () => untrack(() => ({
      placement: config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft',
      popupOverflow: config.popupOverflow,
      open: visible,
      style: serializeInlineStyleLayers(popupLayers),
      container: getPopupContainer || config.getPopupContainer
        ? node.parentNode as HTMLElement | ShadowRoot : node.ownerDocument.body
    }))));
    const disconnect = untrack(() => connectPopup(node, anchor, {
      placement: 'bottom',
      autoAdjustOverflow: true,
      maxWidth: false,
      constrainWidth: false,
      allowOffscreenAnchor: true,
      preserveFocus: event => !event.composedPath().some(node =>
        node instanceof Element && node.classList.contains(`${prefix}-dropdown-list-scrollbar`)),
      anchorWidthVariable,
      getAnchorWidth: () => source.width,
      getPosition: (anchorRect, popupRect, viewport) => {
        optionList.prepare();
        return source.position(anchorRect, popupRect, viewport);
      },
      applyPosition: position => source.commitFrame(() => popupStyle.position(position, source.style)),
      onAlign: position => { popupPlacement = position.alignedPlacement; },
      onPlacement: () => { },
      onVisibilityChange: next => {
        shown = next;
      },
      onDismiss: () => requestOpen(false)
    }));
    source.connect(disconnect.forceAlign);
    source.forceAlign();
    return () => {
      disconnect();
      source.destroy();
    };
  });
  let listItems = $derived<SelectOptionListItem<AutoCompleteEntry>[]>(entries.map((entry, index) => ({
    key: entry.option.key ?? ('value' in entry.option ? entry.option.value : `rc-index-key-${index}`),
    originalIndex: index,
    item: entry,
    group: entry.group,
    ariaLabel: !entry.group && typeof entry.option.label === 'string' ? entry.option.label : undefined,
    ariaValue: 'value' in entry.option ? entry.option.value : undefined,
    get ariaSelected() {
      return String('value' in entry.option ? entry.option.value : undefined).toLowerCase() === text.toLowerCase();
    },
    ariaDisabled: 'disabled' in entry.option ? entry.option.disabled : undefined,
    disabled: 'disabled' in entry.option ? entry.option.disabled : undefined
  })));
  const notifyActive = createSelectActive<string>(() => onActive);
  let listVisited = false;
  let lastListLength = -1;
  let lastListSearch: string | undefined;
  $effect(() => {
    const expanded = visible;
    const rows = optionList.items;
    const query = text;
    if (!listVisited && !expanded) return;
    if (!listVisited || rows.length !== lastListLength || query !== lastListSearch) {
      listVisited = true;
      lastListLength = rows.length;
      lastListSearch = query;
      untrack(() => activate(defaultActiveFirstOption ? autoCompleteNext(rows.map(row => row.item), -1, 1) : -1));
    }
  });
  const optionList = createSelectOptionList<AutoCompleteEntry>({
    items: () => listItems,
    height: () => listHeight,
    estimate: () => itemHeight,
    realVirtual: () => realVirtual,
    open: () => visible,
    searchValue: () => text,
    selectedIndex: (): number => !actualValue ? -1 : optionList.items.findIndex(row =>
      !row.group && 'value' in row.item.option && (text
        ? row.item.option.value.startsWith(text) : row.item.option.value === actualValue)),
    onSelectedActive: index => activate(index)
  });

  function activate(index: number, keyboard = false) {
    active = index;
    const entry = optionList.items[index]?.item;
    notifyActive(entry && 'value' in entry.option ? entry.option.value : null);
    if (keyboard) optionList.scrollActive(index);
  }

  function register(element: HTMLInputElement | HTMLTextAreaElement) {
    editor = element;
    return {
      destroy() {
        if (editor === element)
          editor = undefined;
      }
    };
  }
  function requestOpen(next: boolean) {
    cancelClearClose();
    if (next && (blocked || readonly)) return;
    if (next !== visible)
      onOpenChange?.(next);
    innerOpen = next;
  }
  function clearPointerDown(event: PointerEvent) {
    event.preventDefault();
    if (!visible) return;
    cancelClearClose();
    // rc-select closes after the pointer click's clear/change/search callbacks.
    const channel = new MessageChannel();
    pendingClearClose = channel;
    channel.port1.onmessage = () => {
      if (pendingClearClose === channel) requestOpen(false);
    };
    channel.port2.postMessage(null);
  }
  function cancelClearClose() {
    pendingClearClose?.port1.close();
    pendingClearClose?.port2.close();
    pendingClearClose = undefined;
  }
  function change(next: string | undefined, before = actualValue) {
    innerValue = next;
    if (next !== before) {
      const option = allEntries.find(
        entry => !entry.group && 'value' in entry.option && entry.option.value === next
      )?.option;
      onChange?.(next, next === undefined ? undefined : option ? { ...option } : {});
    }
  }
  function handleInput(event: Event) {
    const control = event.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    if (blocked || readonly) return;
    const next = control.value;
    preview = undefined;
    if (next !== text) {
      change(next);
      searchConfig.onSearch?.(next);
    }
    if (next)
      requestOpen(true);
    void tick().then(() => {
      if (control.isConnected && value !== undefined && control.value !== text)
        control.value = text;
    });
  }
  function choose(option: AutoCompleteOption) {
    if (blocked || readonly || option.disabled) return;
    change(option.value);
    onSelect?.(option.value, { ...option });
    preview = undefined;
    requestOpen(false);
    editor?.focus({ preventScroll: true });
  }
  function clear() {
    if (blocked || readonly) return;
    const before = actualValue;
    const beforeText = text;
    onClear?.();
    editor?.focus({ preventScroll: true });
    change(undefined, before);
    // Rc-select вызывает отдельный search-путь после очистки display values.
    if (beforeText) {
      change('', before);
      searchConfig.onSearch?.('');
    }
    preview = undefined;
  }
  function handleKeydown(event: KeyboardEvent) {
    onInputKeyDown?.(event);
    if (event.defaultPrevented || event.isComposing || blocked || readonly) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!visible) {
        if (!(editor instanceof HTMLTextAreaElement))
          requestOpen(true);
        return;
      }
      event.preventDefault();
      const rows = optionList.items.map(row => row.item);
      activate(autoCompleteNext(
        rows,
        active < 0 && event.key === 'ArrowUp' ? rows.length : active,
        event.key === 'ArrowDown' ? 1 : -1
      ), true);
      if (backfill)
        preview = autoCompleteOption(entries, active)?.value;
    } else if ((event.key === 'Enter' || event.key === 'Tab') && visible && !enterLock) {
      const option = autoCompleteOption(entries, active);
      if (event.key === 'Enter')
        enterLock = true;
      if (option && !option.disabled) {
        event.preventDefault();
        choose(option);
      }
      else requestOpen(false);
    } else if (event.key === 'Escape' && visible) {
      event.preventDefault();
      event.stopPropagation();
      preview = undefined;
      requestOpen(false);
    } else if ((event.key === 'Enter' || event.key === ' ') && !visible)
      requestOpen(true);
    else if (!event.ctrlKey && !event.altKey && !event.metaKey && event.keyCode
      && event.code !== 'Semicolon' && event.code !== 'Equal' && !/^F(?:[1-9]|1[0-2])$/.test(event.key)
      && !['Escape', 'Shift', 'Backspace', 'Tab', 'Meta', 'OS', 'Alt', 'Control', 'CapsLock',
        'ContextMenu', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key))
      requestOpen(true);
  }
  function handleBlur(event: FocusEvent) {
    focused = false;
    enterLock = false;
    preview = undefined;
    requestOpen(false);
    field?.onBlur();
    onBlur?.(event);
  }
  function handleReset(event: Event) {
    if (event.target !== editor?.form) return;
    queueMicrotask(() => {
      if (!event.defaultPrevented && editor?.isConnected) {
        innerValue = defaultValue;
        preview = undefined;
        innerOpen = false;
        editor.value = text;
      }
    });
  }
  let input = $derived<AutoCompleteInput>({
    attributes: {
      id: controlId,
      value: visible && preview !== undefined ? preview : text,
      name: name ?? field?.name,
      placeholder: attributes.placeholder,
      disabled: blocked,
      readonly,
      required: attributes.required ?? field?.required,
      dir: attributes.dir ?? config.direction,
      autocomplete: attributes.autocomplete ?? 'off',
      role: 'combobox',
      'aria-label': attributes['aria-label'] ?? field?.label,
      'aria-expanded': visible,
      'aria-controls': visible ? `${controlId}_list` : undefined,
      'aria-activedescendant': visible && active >= 0 ? `${controlId}_list_${active}` : undefined,
      'aria-autocomplete': 'list',
      'aria-invalid': field?.invalid || resolvedStatus === 'error' || attributes['aria-invalid'] || undefined,
      'aria-describedby': [attributes['aria-describedby'], field?.describedBy].filter(Boolean).join(
        ' '
      )
        || undefined,
      oninput: handleInput,
      onkeydown: handleKeydown,
      onkeyup: event => {
        if (event.key === 'Enter')
          enterLock = false;
      },
      onclick: () => requestOpen(true),
      onfocus: event => {
        focused = true;
        onFocus?.(event);
      },
      onblur: handleBlur
    },
    register
  });
  export function focus(options?: FocusOptions) {
    editor?.focus(options);
  }
  export function blur() {
    editor?.blur();
  }
  export function scrollTo(config?: SelectScrollConfig | null) {
    optionList.scrollTo(config);
  }
</script>

<style>
  .auto-complete { display: inline-flex; width: 100%; min-width: 0; }
  .auto-complete[data-ant-auto-complete-customize] { height: auto; min-height: var(--ant-native-select-height); padding: 0; }
  [data-ant-auto-complete-content] { flex: 1; min-width: 0; }
  .auto-complete [data-ant-auto-complete-input] { position: relative; inset: auto; width: 100%; min-width: 0; padding: 0; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; line-height: inherit; opacity: 1; }
  [data-ant-auto-complete-input]::placeholder { color: var(--ant-color-text-placeholder); }
  .auto-complete:focus-within { outline: 2px solid var(--ant-color-primary); outline-offset: 2px; }
  .auto-complete[data-ant-auto-complete-source-theme]:focus-within { outline: 0; outline-offset: 0; }
  .auto-complete[data-ant-auto-complete-source-theme][data-ant-auto-complete-customize] { min-height: 0; }
  .clear { display: flex; flex: none; padding: 0; border: 0; background: none; color: var(--ant-color-text-tertiary); cursor: pointer; }
  .clear:focus-visible { outline: 2px solid var(--ant-color-primary); }
  .feedback-suffix { display: flex; flex: none; pointer-events: none; }
  /* The retained native popup is a child; Source's portal does not affect :last-child. */
  .auto-complete[data-ant-select-prefix]:not(:has(> .clear)) > .feedback-suffix { opacity: 1; }
  [data-ant-auto-complete-source-theme] .clear { display: inline-block; color: var(--ant-color-text-quaternary); }
  [data-ant-auto-complete-source-theme] .clear:hover { color: var(--ant-color-icon); }
  [data-ant-auto-complete-source-theme] .clear:focus-visible { opacity: 1; }
  .popup { position: fixed; margin: 0; border: 0; overflow: visible; }
  [data-ant-auto-complete-item] { display: block; width: 100%; border: 0; background: transparent; color: inherit; font: inherit; text-align: start; }
  /* Options повторяют flex column rc-select, пустая выдача остаётся обычным блоком. */
  .popup[data-ant-auto-complete-source-popup]:not([hidden]) { display: flex; flex-direction: column; }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item] { flex: none; font-size: var(--ant-select-option-font-size); line-height: var(--ant-select-option-line-height); font-weight: 400; color: var(--ant-color-text); }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item-option] { display: flex; }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item-group] { font-size: var(--ant-font-size-sm); color: var(--ant-color-text-description); }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item-option-disabled] { color: var(--ant-color-text-disabled); }
</style>

<svelte:document onreset={handleReset} />
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`auto-complete-prefix:${prefix}:${rootPrefix}`} />{/if}<div data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
  data-ant-auto-complete-source-theme={Boolean(componentTheme.className) || undefined}
  data-ant-auto-complete-customize={Boolean(children) || undefined}
  style:--ant-native-select-height={`var(--${privateNamespace}-select-height)`}
  bind:this={root} dir={config.direction}
  style={[componentTheme.style, style].filter(Boolean).join(';') || undefined}
  class={[
      `auto-complete ${prefix} ant-select-css-var ${prefix}-single ${prefix}-auto-complete ${prefix}-show-search`,
      componentTheme.className,
      componentTheme.className && `${prefix}-source-theme`,
      componentTheme.className && showClear && `${prefix}-allow-clear`,
      componentTheme.className && config.direction === 'rtl' && `${prefix}-rtl`,
      `${prefix}-${appearance}`,
      resolvedSize === 'large' && `${prefix}-lg`,
      resolvedSize === 'small' && `${prefix}-sm`,
      focused && `${prefix}-focused`,
      visible && `${prefix}-open`,
      blocked && `${prefix}-disabled`,
      resolvedStatus && `${prefix}-status-${resolvedStatus}`,
      feedback.hasFeedback && `${prefix}-has-feedback ${prefix}-show-arrow`,
      feedback.isFormItemInput && `${prefix}-in-form-item`,
      children && `${prefix}-customize`,
      compactClasses(prefix, config.direction, compact),
      className,
      rootClassName
    ]}>
  <div data-ant-auto-complete-content class={`${prefix}-content`}>
    {#if children}{@render children(input)}{:else}<input {...nativeAttributes} {...input.attributes} use:register data-ant-auto-complete-input class={`${prefix}-input`} type="text" />{/if}
  </div>
  {#if feedback.hasFeedback}<div class={[`${prefix}-suffix`, 'feedback-suffix']}>{#if feedback.icon}<FormFeedbackIcon descriptor={feedback.icon} />{/if}</div>{/if}
  {#if showClear}<button type="button" class={['clear', componentTheme.className && `${prefix}-clear`]} aria-label={config.locale.clearText} onpointerdown={clearPointerDown} onclick={clear}>
    {#if typeof allowClear === 'object' && allowClear.clearIcon}{@render allowClear.clearIcon()}{:else}<Icon name="close" />{/if}
  </button>{/if}
  {#if mounted}
    {@const initialPopupStyle = untrack(() => popupStyle.initialStyle())}
    <div data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
      data-ant-auto-complete-source-popup={Boolean(componentTheme.className) && entries.length > 0 || undefined}
      bind:this={popup} popover="manual" hidden={!visible || !shown}
      class={[`popup ${prefix}-dropdown ant-select-css-var`, componentTheme.className,
          componentTheme.className && entries.length > 0 && `${prefix}-source-popup`,
          componentTheme.className && config.direction === 'rtl' && `${prefix}-dropdown-rtl`,
          popupPlacement && `${prefix}-dropdown-placement-${popupPlacement}`,
          classNames?.popup?.root]} dir={config.direction} style={initialPopupStyle}
      {@attach popupStyle.attach}
      {@attach node => connectComponentTheme(node, componentTheme.style)}
      {@attach portal}
      aria-label={attributes['aria-label']
          ?? attributes.placeholder
          ?? config.locale.searchText}>
      {#snippet optionRow(entry: AutoCompleteEntry, info: SelectOptionListRenderInfo)}
        {@const index = info.index}
        {#if entry.group}<div data-ant-auto-complete-item data-ant-auto-complete-item-group class={`${prefix}-item ${prefix}-item-group`} {@attach info.attach}>{#if typeof entry.option.label === 'function'}{@render entry.option.label()}{:else}{entry.option.label ?? ''}{/if}</div>
        {:else if 'value' in entry.option}
          <button data-ant-auto-complete-item data-ant-auto-complete-item-option
            data-ant-auto-complete-item-option-disabled={entry.option.disabled || undefined}
            type="button" tabindex="-1" disabled={entry.option.disabled}
            {...info.attributes}
            {@attach info.attach}
            class={[
                `${prefix}-item ${prefix}-item-option`,
                componentTheme.className && entry.grouped && `${prefix}-item-option-grouped`,
                index === active && `${prefix}-item-option-active`,
                entry.option.disabled && `${prefix}-item-option-disabled`,
                entry.option.class
              ]}
            style={entry.option.style} title={entry.option.title
                ?? (typeof entry.option.label === 'string'
                  ? entry.option.label
                  : entry.option.value)}
            onpointermove={() => {
                if ('value' in entry.option && !entry.option.disabled && index !== active) {
                  activate(index);
                }
              }}
            onclick={() => {
                const option = autoCompleteOption(entries, index);
                if (option)
                  choose(option);
              }}>
            <span class={componentTheme.className ? `${prefix}-item-option-content` : undefined}>
              {#if typeof entry.option.label === 'function'}{@render entry.option.label()}{:else}{entry.option.label ?? entry.option.value}{/if}
            </span>
          </button>
        {/if}
      {/snippet}
      {#if optionList.items.length}
        <SelectOptionList model={optionList} renderItem={optionRow} id={`${controlId}_list`}
          prefixCls={prefix}
          direction={config.direction} {showScrollBar} activeIndex={active} ariaLabel={listLabel}
          onScroll={onPopupScroll} />
      {:else}<div class={`${prefix}-item-empty`} role="listbox" id={`${controlId}_list`} aria-label={listLabel}>{#if typeof notFoundContent === 'function'}{@render notFoundContent()}{:else}{notFoundContent ?? ''}{/if}</div>{/if}
    </div>
  {/if}
</div>
