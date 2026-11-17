<script lang="ts" generics="OptionType extends object = AutoCompleteItem">
  import { autoCompleteMatchesData, autoCompleteNext } from './auto-complete.engine';
  import { onMount, tick, untrack } from 'svelte';
  import type {
    AutoCompleteProps,
    AutoCompleteSearchConfig,
    AutoCompleteInput,
    AutoCompleteItem,
    AutoCompleteSemanticInfo
  } from './auto-complete.types';
  import type {
    SelectScrollConfig, SelectPopupContent as PopupContent, SelectConfigSemanticInfo,
    SelectClassNames, SelectStyles
  } from './select.types';
  import type { RenderEmptyContent } from './types';
  import {
    collectSelectData,
    copySelectData,
    emptySelectDataCache,
    filterSelectData,
    flattenSelectData,
    resolveSelectDataCache,
    selectDataAttributes,
    selectDataContent,
    selectDataTitle,
    selectFields
  } from './select-data.engine';
  import type { SelectDataRow } from './select-data.types';
  import { selectValueTitle } from './select-value.engine';
  import {
    hasSelectDisplayContent, mergeSelectSemanticMaps, mergeSelectStyle, resolveSelectSemanticValue, serializeSelectStyle
  } from './select-semantic.engine';
  import { createSelectStyle, selectStyleAttributes } from './select-style.model.svelte';
  import RenderContent from './RenderContent.svelte';
  import SelectPopupContent from './SelectPopupContent.svelte';
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
  import Icon from './Icon.svelte';

  let {
    nativeElement = $bindable(),
    inputElement = $bindable(),
    ...componentProps
  }: AutoCompleteProps<OptionType> = $props();
  let {
    prefixCls,
    prefix: prefixContent,
    options = [],
    fieldNames,
    value,
    defaultValue,
    open,
    defaultOpen = false,
    showSearch,
    onChange,
    onSelect,
    onDeselect: _onDeselect,
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
    styles,
    popupRender,
    style,
    id,
    name,
    disabled,
    readonly,
    ...attributes
  } = $derived(componentProps);
  type Entry = SelectDataRow<string, OptionType>;
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
  let semanticSize = $derived(size ?? compact?.size ?? config.explicitComponentSize);
  let resolvedSize = $derived(semanticSize ?? config.componentSize);
  let resolvedStatus = $derived(status ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let showClear = $derived(Boolean(allowClear && text && !blocked && !readonly));
  let effectiveShowSearch = $derived(showSearch ?? config.select?.showSearch);
  let controlId = $derived(id ?? field?.id ?? `ant-auto-complete-${generated}`);
  let searchConfig = $derived<AutoCompleteSearchConfig<OptionType>>(
    { ...(typeof effectiveShowSearch === 'object' ? effectiveShowSearch : {}) }
  );
  let fields = $derived(selectFields(fieldNames));
  let maps = $derived(collectSelectData<string, OptionType>(options, fields));
  let entries = $derived(flattenSelectData<string, OptionType>(
    filterSelectData(options, text, fields, { filterOption: searchConfig.filterOption ?? false,
      defaultMatch: autoCompleteMatchesData }),
    fields
  ));
  let previousCache = $state.raw(emptySelectDataCache<string, OptionType>());
  let cache = $derived(resolveSelectDataCache(
    actualValue === undefined ? [] : [actualValue], maps, fields, previousCache
  ));
  $effect(() => { previousCache = cache; });
  let displayValue = $derived(text ? cache.display[0] : undefined);
  let displayLabel = $derived((displayValue?.label ?? actualValue) as RenderEmptyContent);
  let selectedRow = $derived(displayValue
    ? entries.find(entry => !entry.group && entry.value === displayValue.value) : undefined);
  let selectedClass = $derived(typeof selectedRow?.data.className === 'string'
    ? selectedRow.data.className : undefined);
  let selectedStyle = $derived(selectedRow?.data.style);
  let hasSelectedStyle = $derived(Boolean(selectedClass || selectedStyle));
  let selectedTitle = $derived(attributes.title !== undefined ? attributes.title
    : selectValueTitle(selectedRow ? { label: selectedRow.data.label, title: selectedRow.data.title } : undefined)
      || selectValueTitle(displayValue ? { label: displayLabel, title: displayValue.title } : undefined));
  let hasDisplayValue = $derived(Boolean(displayValue && hasSelectDisplayContent(displayLabel)));
  let semantics = $derived.by(() => {
    const ownInfo: AutoCompleteSemanticInfo<OptionType> = {
      props: { ...componentProps, popupRender, onOpenChange, popupMatchSelectWidth }
    };
    const ownClasses = resolveSelectSemanticValue(classNames, ownInfo);
    const ownStyles = resolveSelectSemanticValue(styles, ownInfo);
    const own = mergeSelectSemanticMaps({}, { classes: ownClasses, styles: ownStyles });
    const finalClasses: SelectClassNames = {
      root: [`${prefix}-auto-complete`, className, rootClassName, own.classes.root,
        children && `${prefix}-customize`].filter(Boolean).join(' '),
      prefix: own.classes.prefix,
      input: own.classes.input,
      placeholder: own.classes.placeholder,
      content: own.classes.content,
      clear: own.classes.clear,
      popup: { root: own.classes.popup.root ?? '', list: own.classes.popup.list,
        listItem: own.classes.popup.listItem }
    };
    const finalStyles: SelectStyles = {
      root: mergeSelectStyle(own.styles.root, style) ?? {},
      input: own.styles.input,
      prefix: own.styles.prefix,
      placeholder: own.styles.placeholder,
      content: own.styles.content,
      clear: own.styles.clear,
      popup: { root: own.styles.popup.root ?? {}, list: own.styles.popup.list,
        listItem: own.styles.popup.listItem }
    };
    const { onOpenChange: _onOpenChange, allowClear: _allowClear, ...forwarded } = componentProps;
    const info: SelectConfigSemanticInfo = {
      props: { suffixIcon: null, ...forwarded, prefixCls: prefix, classNames: finalClasses,
        styles: finalStyles, mode: 'SECRET_COMBOBOX_MODE_DO_NOT_USE', popupRender, onOpenChange,
        popupMatchSelectWidth, allowClear, getInputElement: children ? () => children : undefined,
        children: [], variant: appearance, status: resolvedStatus, disabled: blocked, size: semanticSize }
    };
    const contextClasses = resolveSelectSemanticValue(config.select?.classNames, info);
    const contextStyles = resolveSelectSemanticValue(config.select?.styles, info);
    const merged = mergeSelectSemanticMaps({ classes: contextClasses, styles: contextStyles },
      { classes: finalClasses, styles: finalStyles }, config.select?.style, style ?? undefined);
    const controlSlots = ['root', 'prefix', 'input', 'placeholder', 'content', 'clear'] as const;
    const sourceControlColors = style != null && typeof style === 'object'
      || Boolean(config.select?.class) || config.select?.style != null
      || controlSlots.some(slot => Boolean(ownClasses?.[slot]) || ownStyles?.[slot] != null)
      || [...controlSlots, 'suffix' as const].some(slot =>
        Boolean(contextClasses?.[slot]) || contextStyles?.[slot] != null);
    return { ...merged, rootClass: [contextClasses?.root, rootClassName, own.classes.root]
      .filter(Boolean).join(' '), sourceControlColors };
  });
  let legacyColor = $derived(!children && !semantics.sourceControlColors
    && (typeof style === 'string' || Boolean(className)));
  let popupView = $derived.by(() => {
    void semantics;
    return { mounted, content: popupRender ? popupRender(menu) : menu };
  });
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
  let searchText = $derived(visible && preview !== undefined ? preview : text);
  let focused = $state(false);
  let root = $state<HTMLDivElement>();
  let editor = $state<HTMLInputElement | HTMLTextAreaElement>();
  let popup = $state<HTMLDivElement>();
  let menuElement = $state<HTMLDivElement>();
  let shown = $state(false);
  let popupPlacement = $state<string>();
  let mounted = $state(false);
  let customPopupVisited = $state(false);
  let customPopup = $derived(Boolean(popupRender) || customPopupVisited);
  $effect(() => { if (visible && popupRender && popup) customPopupVisited = true; });
  const rootStyle = createSelectStyle(() => semantics.styles.root, () => [
    componentTheme.style,
    [['--ant-native-select-height', `var(--${privateNamespace}-select-height)`],
      ['--ant-native-select-color', `var(--${privateNamespace}-select-color)`]] as const
  ]);
  const initialRootStyle = untrack(rootStyle.initialStyle);
  const contentStyle = createSelectStyle(() => semantics.styles.content);
  const initialContentStyle = untrack(contentStyle.initialStyle);
  const inputStyle = createSelectStyle(() => semantics.styles.input);
  let initialInputStyle = $state(untrack(inputStyle.initialStyle));
  $effect(() => {
    const control = editor;
    if (control) return untrack(() => inputStyle.attach(control));
  });
  const anchorWidthVariable = '--ant-native-auto-complete-anchor-width';
  let matchedWidth = $derived(popupMatchSelectWidth ?? config.popupMatchSelectWidth ?? true);
  let realVirtual = $derived(effectiveVirtual !== false && matchedWidth !== false);
  let itemHeight = $derived(listItemHeight ?? tokens.token.controlHeight);
  let listLabel = $derived(attributes['aria-label'] ?? attributes.placeholder ?? config.locale.searchText);
  let popupBefore = $derived([
    componentTheme.style,
    `${matchedWidth === true ? 'width' : 'min-width'}:var(${anchorWidthVariable})`
  ]);
  let popupAfter = $derived([
    typeof matchedWidth === 'number' ? [['width', `${matchedWidth}px`]] as const : undefined
  ]);
  let popupLayers = $derived([
    ...popupBefore, serializeSelectStyle(semantics.styles.popup.root), ...popupAfter
  ]);
  const popupStyle = createOverlayStyle(() => popupBefore, anchorWidthVariable, () => visible,
    { style: () => semantics.styles.popup.root, after: () => popupAfter });
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
      get dismissOnEscape() { return !customPopup || Boolean(menuElement); },
      preserveFocus: event => {
        const path = event.composedPath();
        if (path.some(node => node instanceof Element
          && node.classList.contains(`${prefix}-dropdown-list-scrollbar`))) return false;
        return !customPopup || path.some(node => node instanceof Element
          && (node.classList.contains(`${prefix}-dropdown-list`)
            || node.classList.contains(`${prefix}-item-empty`)));
      },
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
  let listItems = $derived<SelectOptionListItem<Entry>[]>(entries.map((entry, index) => ({
    key: entry.key,
    originalIndex: index,
    item: entry,
    group: entry.group,
    ariaLabel: !entry.group && typeof entry.label === 'string' ? entry.label : undefined,
    // Source srlist text reads literal data.value; selection remains logically mapped.
    ariaValue: entry.data.value as string | number | undefined,
    get ariaSelected() {
      return !entry.group && String(entry.value).toLowerCase() === text.toLowerCase();
    },
    ariaDisabled: entry.data.disabled as boolean | undefined,
    disabled: Boolean(entry.data.disabled),
    ariaAttributes: selectDataAttributes(entry, fields).aria as SelectOptionListItem<Entry>['ariaAttributes']
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
  const optionList = createSelectOptionList<Entry>({
    items: () => listItems,
    height: () => listHeight,
    estimate: () => itemHeight,
    realVirtual: () => realVirtual,
    open: () => visible,
    searchValue: () => text,
    // Source selected-prefix lookup deliberately reads literal data.value.
    selectedIndex: (): number => !actualValue ? -1 : optionList.items.findIndex(row => text
      ? String(row.item.data.value).startsWith(text) : row.item.data.value === actualValue),
    onSelectedActive: index => activate(index)
  });

  function activate(index: number, keyboard = false) {
    active = index;
    const entry = optionList.items[index]?.item;
    notifyActive(entry?.value ?? null);
    if (keyboard) optionList.scrollActive(index);
  }

  function register(element: HTMLInputElement | HTMLTextAreaElement) {
    if (untrack(() => editor) !== element) initialInputStyle = untrack(inputStyle.initialStyle);
    editor = element;
    return {
      destroy() {
        if (untrack(() => editor) === element)
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
    scheduleClose();
  }
  function scheduleClose() {
    cancelClearClose();
    // Source закрывает следующим task: query/activation завершаются перед onOpenChange(false).
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
      const option = maps.valueOptions.get(next) ?? (next === undefined ? undefined : cache.options.get(next));
      onChange?.(next, next === undefined ? undefined : copySelectData(option));
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
  function choose(entry: Entry) {
    if (blocked || readonly || entry.group || entry.data.disabled || entry.value === undefined) return;
    change(entry.value);
    const option = maps.valueOptions.get(entry.value) ?? cache.options.get(entry.value);
    onSelect?.(entry.value, copySelectData(option) as OptionType);
    preview = undefined;
    scheduleClose();
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
    if (visible && customPopup && !menuElement) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') event.preventDefault();
      return;
    }
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
        preview = optionList.items[active]?.item.value;
    } else if ((event.key === 'Enter' || event.key === 'Tab') && visible && !enterLock) {
      const option = optionList.items[active]?.item;
      if (event.key === 'Enter')
        enterLock = true;
      if (option && !option.group && !option.data.disabled) {
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
    if (!customPopup || !(event.relatedTarget instanceof Node && popup?.contains(event.relatedTarget)))
      requestOpen(false);
    field?.onBlur();
    onBlur?.(event);
  }
  function handlePopupFocusOut(event: FocusEvent & { currentTarget: HTMLDivElement }) {
    if (!customPopup || !event.currentTarget.isConnected) return;
    const next = event.relatedTarget;
    if (next instanceof Node && (root?.contains(next) || popup?.contains(next))) return;
    focused = false;
    enterLock = false;
    preview = undefined;
    requestOpen(false);
  }
  function handleRootMouseDown(event: MouseEvent) {
    const target = event.target;
    if (blocked || readonly || !(target instanceof Node) || popup?.contains(target)
      || target === editor || editor?.contains(target)
      || target instanceof Element && target.closest('button')) return;
    event.preventDefault();
    editor?.focus({ preventScroll: true });
    requestOpen(true);
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
      ...selectStyleAttributes(semantics.styles.input),
      id: controlId,
      value: searchText,
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
      'aria-controls': visible && (!customPopup || menuElement) ? `${controlId}_list` : undefined,
      'aria-activedescendant': visible && active >= 0 && (!customPopup || menuElement)
        ? `${controlId}_list_${active}` : undefined,
      'aria-autocomplete': 'list',
      'aria-invalid': field?.invalid || resolvedStatus === 'error' || attributes['aria-invalid'] || undefined,
      'aria-describedby': [attributes['aria-describedby'], field?.describedBy].filter(Boolean).join(
        ' '
      )
        || undefined,
      class: semantics.classes.input,
      style: initialInputStyle,
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
  .auto-complete [data-ant-auto-complete-input] { position: absolute; inset: 0; width: 100%; min-width: 0; padding: 0; border: 0; outline: 0; background: transparent; color: var(--ant-native-select-color, var(--ant-color-text)); font: inherit; line-height: inherit; opacity: 1; }
  .auto-complete:where([data-ant-auto-complete-legacy-color]) > [data-ant-auto-complete-content] { -webkit-text-fill-color: transparent; }
  .auto-complete:where([data-ant-auto-complete-legacy-color]) > :where([data-ant-auto-complete-content]) > [data-ant-auto-complete-input] { color: inherit; -webkit-text-fill-color: currentColor; }
  .auto-complete:where([data-ant-auto-complete-legacy-color]) > :where([data-ant-auto-complete-content]) > [data-ant-auto-complete-placeholder] { -webkit-text-fill-color: currentColor; }
  .auto-complete:where([data-ant-auto-complete-legacy-color]) > :where([data-ant-auto-complete-content]) > :not([data-ant-auto-complete-input]):not([data-ant-auto-complete-placeholder]) { opacity: 0; -webkit-text-fill-color: currentColor; }
  [data-ant-auto-complete-input]::placeholder { color: var(--ant-color-text-placeholder); }
  [data-ant-auto-complete-content]:has(> [data-ant-auto-complete-placeholder]) > [data-ant-auto-complete-input]::placeholder { color: transparent; }
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
  .popup[data-ant-auto-complete-custom-popup]:not([hidden]) { display: block; }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item] { flex: none; font-size: var(--ant-select-option-font-size); line-height: var(--ant-select-option-line-height); font-weight: 400; color: var(--ant-color-text); }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item-option] { display: flex; }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item-group] { font-size: var(--ant-font-size-sm); color: var(--ant-color-text-description); }
  [data-ant-auto-complete-source-popup] [data-ant-auto-complete-item-option-disabled] { color: var(--ant-color-text-disabled); }
</style>

<svelte:document onreset={handleReset} />
{#snippet menu()}
{#snippet optionRow(entry: Entry, info: SelectOptionListRenderInfo)}
  {@const index = info.index}
  {@const content = selectDataContent(entry) as RenderEmptyContent}
  {@const title = selectDataTitle(entry) as string | undefined}
  {@const physical = selectDataAttributes(entry, fields).physical}
  {@const aria = info.virtual
    ? { 'aria-selected': undefined, 'aria-disabled': info.attributes['aria-disabled'] }
    : info.attributes}
  {#if entry.group}<div data-ant-auto-complete-item data-ant-auto-complete-item-group
    class={[`${prefix}-item ${prefix}-item-group`, entry.data.className as string | undefined]}
    {title} {@attach info.attach}><RenderContent value={content} /></div>
  {:else}
    {@const rowStyle = createSelectStyle(() => mergeSelectStyle(semantics.styles.popup.listItem, entry.data.style))}
    {@const initialRowStyle = untrack(rowStyle.initialStyle)}
    <button data-ant-auto-complete-item data-ant-auto-complete-item-option
      {...physical}
      data-ant-auto-complete-item-option-disabled={entry.data.disabled || undefined}
      type="button" tabindex={Object.hasOwn(physical, 'tabindex') ? physical.tabindex as number | undefined : -1}
      disabled={Boolean(entry.data.disabled)}
      {...aria}
      {@attach info.attach}
      class={[
          `${prefix}-item ${prefix}-item-option`,
          componentTheme.className && entry.groupOption && `${prefix}-item-option-grouped`,
          index === active && `${prefix}-item-option-active`,
          entry.data.disabled && `${prefix}-item-option-disabled`,
          entry.data.className as string | undefined,
          entry.data.class as string | undefined,
          semantics.classes.popup.listItem
        ]}
      {...selectStyleAttributes(mergeSelectStyle(semantics.styles.popup.listItem, entry.data.style))} style={initialRowStyle} {title}
      {@attach rowStyle.attach}
      onpointermove={event => {
          const callback = physical.onpointermove;
          if (typeof callback === 'function') callback(event);
          if (!entry.data.disabled && index !== active) {
            activate(index);
          }
        }}
      onmousemove={() => {
          if (!entry.data.disabled && index !== active) {
            activate(index);
          }
        }}
      onclick={() => choose(entry)}>
      <span class={componentTheme.className ? `${prefix}-item-option-content` : undefined}>
        <RenderContent value={content} />
      </span>
    </button>
  {/if}
{/snippet}
{#if optionList.items.length}
  <SelectOptionList model={optionList} renderItem={optionRow} id={`${controlId}_list`}
    prefixCls={prefix} class={semantics.classes.popup.list} style={semantics.styles.popup.list}
    bind:listElement={menuElement}
    direction={config.direction} {showScrollBar} activeIndex={active} ariaLabel={listLabel}
    onScroll={onPopupScroll} />
{:else}<div bind:this={menuElement} class={`${prefix}-item-empty`} role="listbox" id={`${controlId}_list`} aria-label={listLabel}>{#if typeof notFoundContent === 'function'}{@render notFoundContent()}{:else}{notFoundContent ?? ''}{/if}</div>{/if}
{/snippet}

{#snippet body(view: { mounted: boolean; content: PopupContent })}
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`auto-complete-prefix:${prefix}:${rootPrefix}`} />{/if}<!-- svelte-ignore a11y_no_static_element_interactions (Корень перенаправляет mouse focus нативному input; клавиатурой управляет input.) --><div data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
  data-ant-auto-complete-source-theme={Boolean(componentTheme.className) || undefined}
  data-ant-auto-complete-customize={Boolean(children) || undefined}
  data-ant-auto-complete-legacy-color={legacyColor || undefined}
  bind:this={root} dir={config.direction}
  {...selectStyleAttributes(semantics.styles.root)} style={initialRootStyle} {@attach rootStyle.attach}
  onmousedown={handleRootMouseDown}
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
      config.select?.class,
      className,
      semantics.rootClass
    ]}>
  {#if prefixContent}{@const prefixStyle = createSelectStyle(() => semantics.styles.prefix)}{@const initialPrefixStyle = untrack(prefixStyle.initialStyle)}<div class={[`${prefix}-prefix`, semantics.classes.prefix]}
    {...selectStyleAttributes(semantics.styles.prefix)} style={initialPrefixStyle} {@attach prefixStyle.attach}><RenderContent value={prefixContent} /></div>{/if}<div data-ant-auto-complete-content class={[`${prefix}-content`,
      !legacyColor && hasDisplayValue && `${prefix}-content-has-value`,
      !legacyColor && searchText && `${prefix}-content-has-search-value`,
      !legacyColor && hasSelectedStyle && `${prefix}-content-has-option-style`, semantics.classes.content]}
    {...selectStyleAttributes(semantics.styles.content)} style={initialContentStyle} {@attach contentStyle.attach}
    title={hasSelectedStyle ? undefined : selectedTitle}>
    {#if children}{@render children(input)}{:else}
      {#if displayValue}
        {#if hasSelectedStyle}{@const valueStyle = createSelectStyle(() => mergeSelectStyle(searchText ? { visibility: 'hidden' } : undefined, selectedStyle))}{@const initialValueStyle = untrack(valueStyle.initialStyle)}<div class={[`${prefix}-content-value`, selectedClass]}
          {...selectStyleAttributes(mergeSelectStyle(searchText ? { visibility: 'hidden' } : undefined, selectedStyle))} style={initialValueStyle} {@attach valueStyle.attach}
          title={selectedTitle}><RenderContent value={displayLabel} /></div>
        {:else}<RenderContent value={displayLabel} />{/if}
      {:else}{@const placeholderStyle = createSelectStyle(() => mergeSelectStyle(searchText ? { visibility: 'hidden' } : undefined, semantics.styles.placeholder))}{@const initialPlaceholderStyle = untrack(placeholderStyle.initialStyle)}<div data-ant-auto-complete-placeholder class={[`${prefix}-placeholder`, semantics.classes.placeholder]}
          {...selectStyleAttributes(mergeSelectStyle(searchText ? { visibility: 'hidden' } : undefined, semantics.styles.placeholder))} style={initialPlaceholderStyle} {@attach placeholderStyle.attach}>{attributes.placeholder}</div>
      {/if}<input {...nativeAttributes} {...input.attributes} use:register data-ant-auto-complete-input
        class={[`${prefix}-input`, semantics.classes.input]} type="text" />
    {/if}
  </div>{#if feedback.hasFeedback}{@const suffixStyle = createSelectStyle(() => semantics.styles.suffix)}{@const initialSuffixStyle = untrack(suffixStyle.initialStyle)}<div class={[`${prefix}-suffix`, 'feedback-suffix', semantics.classes.suffix]} {...selectStyleAttributes(semantics.styles.suffix)} style={initialSuffixStyle} {@attach suffixStyle.attach}>{#if feedback.icon}<FormFeedbackIcon descriptor={feedback.icon} />{/if}</div>{/if}{#if showClear}{@const clearStyle = createSelectStyle(() => semantics.styles.clear)}{@const initialClearStyle = untrack(clearStyle.initialStyle)}<button type="button" class={['clear', componentTheme.className && `${prefix}-clear`, semantics.classes.clear]} {...selectStyleAttributes(semantics.styles.clear)} style={initialClearStyle} {@attach clearStyle.attach} aria-label={config.locale.clearText} onpointerdown={clearPointerDown} onclick={clear}>
    {#if typeof allowClear === 'object' && allowClear.clearIcon}{@render allowClear.clearIcon()}{:else}<Icon name="close" />{/if}
  </button>{/if}{#if view.mounted}
    {@const initialPopupStyle = untrack(() => popupStyle.initialStyle())}
    <div data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
      data-ant-auto-complete-source-popup={Boolean(componentTheme.className) && entries.length > 0 || undefined}
      data-ant-auto-complete-custom-popup={customPopup || undefined}
      bind:this={popup} popover="manual" hidden={!visible || !shown}
      class={[`popup ${prefix}-dropdown ant-select-css-var`, componentTheme.className,
          componentTheme.className && entries.length > 0 && `${prefix}-source-popup`,
          componentTheme.className && config.direction === 'rtl' && `${prefix}-dropdown-rtl`,
          popupPlacement && `${prefix}-dropdown-placement-${popupPlacement}`,
          rootClassName, semantics.classes.popup.root]} dir={config.direction}
      {...selectStyleAttributes(semantics.styles.popup.root)} style={initialPopupStyle}
      onfocusout={handlePopupFocusOut}
      {@attach popupStyle.attach}
      {@attach portal}
      aria-label={attributes['aria-label']
          ?? attributes.placeholder
          ?? config.locale.searchText}>
      <SelectPopupContent value={view.content} origin={menu} active={visible} isolate={Boolean(popupRender)} />
    </div>
  {/if}
</div>

{/snippet}

{@render body(popupView)}
