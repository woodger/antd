<script lang="ts" generics="Value extends string | number = string, Mode extends 'multiple' | 'tags' | undefined = undefined, OptionType extends object = SelectOption<Mode extends 'tags' ? Value | string : Value>, LabelInValue extends boolean = false">
  import { onMount, tick, untrack, type Snippet } from 'svelte';
  import { useConfig } from './config-context';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getSelectPrefixCss } from './select-prefix.engine';
  import { useVariant } from './variant.svelte';
  import RenderEmpty from './RenderEmpty.svelte';
  import RenderContent from './RenderContent.svelte';
  import { useComponentTheme } from './theme-component.svelte';
  import { useToken } from './theme-context.svelte';
  import { connectComponentTheme } from './theme-component.dom';
  import SelectOptionList from './SelectOptionList.svelte';
  import { createSelectOptionList } from './select-option-list.model.svelte';
  import type { SelectOptionListItem, SelectOptionListRenderInfo } from './select-option-list.types';
  import { createSelectActive } from './select-active.model.svelte';
  import { connectPopup } from './popup.dom';
  import { createTreeSelectAlign } from './tree-select-align.dom';
  import { createOverlayStyle } from './overlay-style.model.svelte';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { createPopupContainer } from './popup-container.model.svelte.js';
  import { useCompact } from './space-compact-context';
  import { compactClasses } from './space-compact.engine';
  import { useFormField } from './form-context';
  import { useFormItemStatusContext } from './form-item-status';
  import { useFormFeedback } from './form-feedback-context';
  import FormFeedbackIcon from './FormFeedbackIcon.svelte';
  import {
    getEnabledIndex,
    isSelectCountReached,
    isSelectOptionDisabled,
    matchesSelectDataLabel
  } from './select.engine';
  import {
    selectFields,
    collectSelectData,
    flattenSelectData,
    filterSelectData,
    sortSelectData,
    copySelectData,
    selectDataAttributes,
    selectDataContent,
    selectDataTitle
  } from './select-data.engine';
  import type { SelectDataRow } from './select-data.types';
  import {
    emptySelectValueCache, resolveSelectValueCache, convertSelectValues, selectValueDrafts,
    selectValueRaw, selectValueEvent, selectValueOutput, selectValueText, selectValueTitle, keepSelectSuppliedValue,
    hasSelectLabelFeatures,
    type SelectValueItem
  } from './select-value.engine';
  import { serializeSelectDataStyle } from './select-data-style.engine';
  import { ruRU, type SelectOption, type RenderEmptyContent } from './types';
  import type {
    SelectProps,
    SelectScrollConfig,
    SelectFlattenOption,
    SelectSearchConfig,
    SelectTagPlaceholder,
    SelectTagInfo,
    SelectLabelRenderInfo
  } from './select.types';
  import { getSelectTagText } from './select-tag-text.engine';
  import { getSelectTagOptions } from './select-tags.engine';
  import { getSelectTagOverflow } from './select-tag-overflow.engine';
  import { connectSelectTagOverflow, measureSelectInput } from './select-tag-overflow.dom';
  import { resolveSelectTokenOptions, splitSelectTokens } from './select-token.engine';
  import Icon from './Icon.svelte';

  type RawValue = Value | string;
  type Row = SelectDataRow<RawValue, OptionType>;

  let {
    _autoWidth = false,
    prefixCls,
    options = [],
    fieldNames,
    optionLabelProp,
    labelInValue,
    labelRender,
    optionRender,
    mode,
    open = $bindable<boolean | undefined>(),
    open: providedOpen,
    defaultOpen,
    placement,
    popupMatchSelectWidth,
    listHeight = 256,
    listItemHeight,
    showScrollBar,
    defaultActiveFirstOption = true,
    onActive,
    tokenSeparators,
    maxCount,
    maxTagTextLength,
    maxTagCount,
    maxTagPlaceholder,
    tagRender,
    defaultValue,
    value = $bindable<SelectProps<Value, Mode, OptionType, LabelInValue>['value']>(),
    value: providedValue,
    size,
    variant,
    showSearch,
    loading = false,
    notFoundContent,
    onPopupScroll,
    getPopupContainer,
    allowClear = false,
    status,
    disabled,
    id,
    name,
    placeholder,
    onValueChange,
    onChange,
    onSelect,
    onDeselect,
    onClear,
    onOpenChange,
    onkeydown,
    onbeforeinput,
    onpaste,
    oncompositionstart,
    oncompositionend,
    onfocus,
    onblur,
    onclick,
    style,
    class: className = '',
    nativeElement = $bindable(),
    inputElement = $bindable(),
    ...attributes
  }: SelectProps<Value, Mode, OptionType, LabelInValue> = $props();

  const config = useConfig();
  const tokens = useToken();
  let { virtual, ...nativeAttributes } = $derived(attributes);
  let effectiveVirtual = $derived(Object.hasOwn(attributes, 'virtual') ? virtual : config.virtual);
  let prefix = $derived(config.getPrefixCls('select', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let privateNamespace = $derived(rootPrefix.replaceAll('.', ''));
  let prefixCss = $derived(getSelectPrefixCss(prefix, rootPrefix));
  const variantContext = useVariant('select', () => ({ variant }));
  const componentTheme = useComponentTheme('Select');
  const compact = useCompact();
  const controlRef = {
    get nativeElement() {
      return container;
    },
    focus,
    blur
  };
  const field = useFormField(() => controlRef);
  const itemStatus = useFormItemStatusContext();
  const feedback = useFormFeedback();
  let appearance = $derived(variantContext.variant);
  const generatedId = $props.id();
  const initialDefault = untrack(
    () => Array.isArray(defaultValue) ? [...defaultValue] : defaultValue
  );
  let useDefault = $state(true);
  let internalOpen = $state(untrack(() => defaultOpen ?? false));
  let isOpen = $derived(providedOpen ?? internalOpen);
  let previousOwnerOpen = untrack(() => providedOpen);
  let hydrated = $state(false);
  let focused = $state(false);
  let internalSearch = $state('');
  let searchConfig = $derived<SelectSearchConfig<RawValue, OptionType>>(
    { ...(typeof showSearch === 'object' ? showSearch : {}) }
  );
  let controlledSearch = $derived(searchConfig.searchValue);
  let search = $derived(controlledSearch ?? internalSearch);
  let searchCallback = $derived(searchConfig.onSearch);
  let filter = $derived(searchConfig.filterOption ?? true);
  let autoClearSearch = $derived(searchConfig.autoClearSearchValue ?? true);
  let cachedData = $state.raw(emptySelectValueCache<RawValue, OptionType>());
  let internalLabels = $state.raw<readonly SelectValueItem<RawValue>[]>();
  let uncontrolledLabels = $state.raw<readonly SelectValueItem<RawValue>[]>();
  let labelFeaturesUsed = $state(untrack(() => hasSelectLabelFeatures(
    labelInValue, optionLabelProp, labelRender,
    selectValueDrafts(value !== undefined ? value : initialDefault, mode === 'multiple' || mode === 'tags')
  )));
  let activeIndex = $state(-1);
  let container: HTMLDivElement;
  let reference = $state<HTMLDivElement>();
  let control = $state<HTMLInputElement>();
  let list = $state<HTMLDivElement>();
  let contentElement = $state<HTMLDivElement>();
  let responsiveCount = $state(Number.POSITIVE_INFINITY);
  const tagElements = new Map<RawValue, HTMLElement>();
  let shown = $state(false);
  let popupPlacement = $state<string>();
  let typeahead = '';
  let lastTyped = 0;
  let composing = false;
  let pastedText: string | undefined;
  let controlId = $derived(id ?? field?.id ?? `ant-select-${generatedId}`);
  let selectedValue = $derived(value !== undefined ? value : useDefault ? initialDefault : undefined);
  let tagMode = $derived(mode === 'tags');
  let multiple = $derived(mode === 'multiple' || tagMode);
  let canSearch = $derived(typeof showSearch === 'object' ? true : showSearch ?? multiple);
  // Readonly исключает input из нативной проверки; required multiple блокирует ввод через beforeinput.
  let isReadOnly = $derived(!canSearch && (!multiple || !attributes.required));
  let intrinsicWidth = $derived(_autoWidth && !multiple && isReadOnly);
  let localDrafts = $derived(selectValueDrafts(selectedValue, multiple));
  let labelFeatures = $derived(hasSelectLabelFeatures(labelInValue, optionLabelProp, labelRender, localDrafts, internalLabels));
  let valueDrafts = $derived(value === undefined && providedValue === undefined && uncontrolledLabels
    && (labelFeatures || labelFeaturesUsed) ? uncontrolledLabels : localDrafts);
  let selectedRaw = $derived(multiple ? undefined : selectValueRaw<RawValue>(valueDrafts[0]));
  let selectedValues = $derived(multiple ? valueDrafts.map(item => selectValueRaw<RawValue>(item)!) : []);
  let labeledDrafts = $derived(providedValue === undefined && internalLabels && (labelFeatures || labelFeaturesUsed)
    ? valueDrafts.map(draft => {
        const raw = selectValueRaw<RawValue>(draft);
        return draft && typeof draft === 'object' && Reflect.get(draft, 'label') !== undefined
          ? draft : internalLabels?.find(item => item.value === raw) ?? draft;
      }) : valueDrafts);
  $effect(() => {
    if (labelFeatures) labelFeaturesUsed = true;
  });
  $effect.pre(() => {
    if (providedValue !== undefined) uncontrolledLabels = undefined;
  });
  let selectedKeys = $derived(new Set(selectedValues));
  let countReached = $derived(multiple && isSelectCountReached(selectedValues.length, maxCount));
  let fields = $derived(selectFields(fieldNames));
  let dataMaps = $derived(collectSelectData<RawValue, OptionType>(
    options, fields, searchConfig.optionFilterProp, optionLabelProp
  ));
  let selectionData = $derived(resolveSelectValueCache(
    labeledDrafts, dataMaps, fields, cachedData, optionLabelProp
  ));
  let displayValues = $derived(selectionData.values.map(item => ({ ...item,
    label: (labelRender ? labelRender(item as SelectLabelRenderInfo<Mode extends 'tags' ? Value | string : Value>) : item.label) ?? item.value,
    disabled: selectionData.display.find(display => display.value === item.value)?.disabled
  })));
  let selectionOptions = $derived(new Map(displayValues.map(item => [item.value, item])));
  let selected = $derived(selectedRaw === undefined ? undefined : selectionOptions.get(selectedRaw));
  let tags = $derived(selectedValues.map(item => selectionOptions.get(item)!));
  let responsiveTags = $derived(multiple && maxTagCount === 'responsive');
  let tagOverflow = $derived(getSelectTagOverflow(tags,
    responsiveTags ? responsiveCount : typeof maxTagCount === 'number' ? maxTagCount : undefined));
  let renderedTags = $derived(responsiveTags ? tags : tagOverflow.visible);
  let visibleTagKeys = $derived(new Set(tagOverflow.visible.map(tag => tag.value)));
  let tagPlaceholder = $derived(maxTagPlaceholder as SelectTagPlaceholder<RawValue> | undefined);
  let renderTag = $derived(tagRender as Snippet<[SelectTagInfo<RawValue>]> | undefined);
  let tagPlaceholderTitle = $derived(tagPlaceholder == null
    ? `+ ${tagOverflow.omitted.length} ...`
    : typeof tagPlaceholder === 'string' || typeof tagPlaceholder === 'number'
      ? String(tagPlaceholder) : undefined);
  let filterConfig = $derived({
    filterOption: filter,
    optionFilterProp: searchConfig.optionFilterProp === '' ? [''] : searchConfig.optionFilterProp
  });
  let filteredOptions = $derived(tagMode
    ? getSelectTagOptions(options, selectionData.display, dataMaps, fields, search, filterConfig)
    : filterSelectData(options, search, fields, { ...filterConfig, defaultMatch: matchesSelectDataLabel }));
  let orderedOptions = $derived(sortSelectData(
    filteredOptions, search, searchConfig.filterSort
  ));
  let filtered = $derived(flattenSelectData<RawValue, OptionType>(orderedOptions, fields));
  let selectedOption = $derived(!multiple && selectedRaw !== undefined
    ? filtered.find(row => !row.group && row.value === selectedRaw)?.data : undefined);
  let selectedClass = $derived(typeof selectedOption?.className === 'string' ? selectedOption.className : undefined);
  let selectedStyle = $derived(selectedOption?.style);
  let hasSelectedStyle = $derived(Boolean(selectedClass || selectedStyle));
  let selectedTitle = $derived(attributes.title !== undefined ? attributes.title
    : selectValueTitle(selectedOption ? { label: selectedOption.label, title: selectedOption.title } : undefined)
      || selectValueTitle(selected));
  let selectedLayer = $derived(!multiple && Boolean(selected));
  let selectedHasValue = $derived(selected?.label != null && String(selected.label).trim() !== '');
  let selectedText = $derived(typeof selected?.label === 'string' || typeof selected?.label === 'number'
    ? String(selected.label) : '');
  let selectedLabelScope = $derived(labelFeatures || labelFeaturesUsed
    || typeof selected?.label === 'function' || Array.isArray(selected?.label));
  let renderOption = $derived(optionRender as Snippet<[
    SelectFlattenOption<RawValue, OptionType>, { index: number }
  ]> | undefined);

  function nativeTitle(title: unknown) {
    return typeof title === 'string' || typeof title === 'number' ? String(title) : undefined;
  }

  function getRenderOption(option: Row): SelectFlattenOption<RawValue, OptionType> {
    return option as SelectFlattenOption<RawValue, OptionType>;
  }
  $effect(() => {
    cachedData = selectionData;
  });
  $effect.pre(() => {
    const visible = new Set(tagOverflow.visible.map(tag => tag.value));
    const input = control;
    const active = input?.ownerDocument.activeElement;
    if (!input || !active || ![...tagElements].some(([value, node]) =>
      !visible.has(value) && node.contains(active))) return;

    // Скрытый native remove button передаёт фокус input, не отменяя новый выбор владельца.
    void tick().then(() => {
      if (!input.isConnected || active.isConnected && !active.closest('[inert]')) return;
      const doc = input.ownerDocument;
      if (!doc.activeElement || doc.activeElement === active || doc.activeElement === doc.body
        || doc.activeElement === doc.documentElement) input.focus();
    });
  });
  $effect(() => {
    if (!control || !multiple || !responsiveTags && !componentTheme.className) return;
    void search;
    const input = control;
    const previous = input.style.width;
    input.style.width = `${measureSelectInput(input)}px`;
    return () => { input.style.width = previous; };
  });
  $effect(() => {
    if (!contentElement || !responsiveTags) return;
    void tags;
    void maxTagTextLength;
    void tagPlaceholder;
    void renderTag;
    void search;
    const host = contentElement;
    let disposed = false;
    let disconnect: (() => void) | undefined;
    void tick().then(() => {
      if (!disposed) disconnect = connectSelectTagOverflow(host,
        count => { responsiveCount = count; });
    });
    return () => {
      disposed = true;
      disconnect?.();
    };
  });
  let resolvedDisabled = $derived(disabled ?? field?.disabled ?? config.componentDisabled);
  let resolvedStatus = $derived(status ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let resolvedSize = $derived(size ?? compact?.size ?? config.componentSize);
  let compactItemClasses = $derived(compactClasses(prefix, config.direction, compact));
  // Число 0 остаётся содержимым; null/empty string скрывают пустой список.
  let hiddenEmpty = $derived(filtered.length === 0
    && (notFoundContent === null || notFoundContent === false || notFoundContent === ''));
  let expanded = $derived(hydrated && isOpen && !resolvedDisabled && !hiddenEmpty);

  onMount(() => {
    hydrated = true;
    if (providedOpen === undefined) open = internalOpen;
  });

  $effect.pre(() => {
    const next = providedOpen;
    if (!Object.is(next, previousOwnerOpen)) {
      previousOwnerOpen = next;
      internalOpen = next ?? false;
      if (!next && !multiple) internalSearch = '';
    }
    if (resolvedDisabled) {
      internalOpen = false;
      focused = false;
    }
  });
  let popupContainerGetter = $derived(getPopupContainer || config.getPopupContainer);
  const anchorWidthVariable = '--ant-native-select-anchor-width';
  let matchedWidth = $derived(popupMatchSelectWidth ?? config.popupMatchSelectWidth ?? true);
  let realVirtual = $derived(effectiveVirtual !== false && matchedWidth !== false);
  let itemHeight = $derived(listItemHeight ?? tokens.token.controlHeight);
  let listLabel = $derived(attributes['aria-label'] ?? placeholder ?? config.locale.searchText);
  let popupLayers = $derived([
    componentTheme.style,
    `${matchedWidth === true ? 'width' : 'min-width'}:var(${anchorWidthVariable})`,
    typeof matchedWidth === 'number' ? [['width', `${matchedWidth}px`]] as const : undefined
  ]);
  const popupStyle = createOverlayStyle(() => popupLayers, anchorWidthVariable, () => expanded);
  const portal = createPopupContainer(() => ({
    open: expanded,
    rendered: expanded,
    reference,
    getPopupContainer: popupContainerGetter,
    themeStyle: serializeInlineStyleLayers(popupLayers),
    preserveVariables: [anchorWidthVariable]
  }));

  $effect(() => {
    if (!expanded || !list || !reference) return;

    const popup = list;
    const anchor = reference;
    const source = untrack(() => createTreeSelectAlign(anchor, popup, () => untrack(() => ({
      placement: placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'),
      popupOverflow: config.popupOverflow,
      open: expanded,
      style: serializeInlineStyleLayers(popupLayers),
      container: popupContainerGetter
        ? popup.parentNode as HTMLElement | ShadowRoot : popup.ownerDocument.body
    }))));
    const disconnect = untrack(() => connectPopup(popup, anchor, {
      placement: 'bottom',
      get trigger() { return untrack(() => popupContainerGetter ? anchor : container); },
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
      onPlacement: () => {},
      onVisibilityChange: next => { shown = next; },
      onDismiss: () => setOpen(false)
    }));
    source.connect(disconnect.forceAlign);
    source.forceAlign();

    return () => {
      disconnect();
      source.destroy();
    };
  });

  $effect(() => {
    if (!control || !multiple) return;

    const input = control;
    input.setCustomValidity(
      attributes.required && !selectedValues.length
        ? config.locale.selectRequiredText ?? ruRU.selectRequiredText
        : ''
    );

    return () => input.setCustomValidity('');
  });

  $effect(() => {
    nativeElement = reference;
    return () => { nativeElement = undefined; };
  });
  $effect(() => {
    inputElement = control;
    return () => { inputElement = undefined; };
  });

  let listItems = $derived<SelectOptionListItem<Row>[]>(filtered.map((option, index) => {
    const data = option.data;
    const selected = !option.group && option.value !== undefined
      && (multiple ? selectedKeys.has(option.value) : option.value === selectedRaw);
    return {
      key: option.key,
      originalIndex: index,
      item: option,
      group: option.group,
      ariaLabel: !option.group && typeof option.label === 'string' ? option.label : undefined,
      ariaValue: typeof data.value === 'string' || typeof data.value === 'number' ? data.value : undefined,
      ariaAttributes: selectDataAttributes(option, fields).aria as SelectOptionListItem<Row>['ariaAttributes'],
      ariaSelected: selected,
      ariaDisabled: data.disabled as boolean | undefined,
      disabled: isSelectOptionDisabled(data.disabled, selected, countReached)
    };
  }));
  const notifyActive = createSelectActive<RawValue>(
    () => onActive as ((value: RawValue | null) => void) | undefined
  );
  let listVisited = false;
  let lastListLength = -1;
  let lastListSearch: string | undefined;
  let openingKeyboardActivation: { index: number } | undefined;

  // Source сохраняет OptionList после первого открытия; условный Native DOM не сбрасывает activation.
  $effect(() => {
    const visible = expanded;
    const rows = optionList.items;
    const query = search;
    if (!listVisited && !visible) return;
    if (!listVisited || rows.length !== lastListLength || query !== lastListSearch) {
      listVisited = true;
      lastListLength = rows.length;
      lastListSearch = query;
      untrack(() => activate(openingKeyboardActivation?.index ?? (defaultActiveFirstOption
        ? getEnabledIndex(rows, -1, 'first') : -1)));
    }
  });
  const optionList = createSelectOptionList<Row>({
    items: () => listItems,
    height: () => listHeight,
    estimate: () => itemHeight,
    realVirtual: () => realVirtual,
    open: () => expanded,
    searchValue: () => search,
    selectedIndex: (): number => openingKeyboardActivation?.index ?? (multiple || selectedRaw === undefined
      ? -1 : optionList.items.findIndex(row =>
        search ? String(row.item.data.value).startsWith(search)
          : row.item.data.value === selectedRaw)),
    onSelectedActive: index => activate(index)
  });

  function activate(index: number, keyboard = false) {
    activeIndex = index;
    notifyActive(optionList.items[index]?.item.value ?? null);
    if (keyboard) optionList.scrollActive(index);
  }

  function enabledIndex(current: number, direction: 'next' | 'previous' | 'first' | 'last') {
    return getEnabledIndex(listItems, current, direction);
  }

  function setOpen(next: boolean) {
    if (next && resolvedDisabled) {
      return;
    }

    const notify = expanded !== next;
    internalOpen = next;
    open = next;
    if (notify) onOpenChange?.(next);
    // Принятый bind/callback сохраняет active, выбранный текущим keyboard event.
    if (providedOpen === next) previousOwnerOpen = next;

    if (!next && !tagMode && (!multiple || autoClearSearch)) {
      internalSearch = '';
    }
  }

  export function focus(options?: FocusOptions) {
    control?.focus(options);
  }
  export function blur() {
    control?.blur();
  }
  export function scrollTo(config?: SelectScrollConfig | null) {
    optionList.scrollTo(config);
  }

  function keepOpeningKeyboardActivation(index: number) {
    const request = { index };
    openingKeyboardActivation = request;
    // Native typeahead/ArrowUp задают цель до первого OptionList effect.
    void tick().then(() => {
      if (openingKeyboardActivation === request) openingKeyboardActivation = undefined;
    });
  }

  function openList(direction: 'first' | 'last' = 'first') {
    if (!isOpen) {
      if (!tagMode && (!multiple || autoClearSearch)) internalSearch = '';
      if (!listVisited) activeIndex = enabledIndex(-1, direction);
      if (direction === 'last') keepOpeningKeyboardActivation(enabledIndex(-1, 'last'));
    }

    setOpen(true);
  }

  function rememberLabels(items: readonly SelectValueItem<RawValue>[]) {
    // Snapshot нужен и при позднем включении label API после обычного выбора.
    internalLabels = items;
    uncontrolledLabels = providedValue === undefined ? items : undefined;
  }

  function changeMultiple(next: RawValue[], origin: 'select' | 'display' | 'raw' = 'select') {
    if (!multiple) return;
    const changed = next.length !== selectedValues.length
      || next.some((item, index) => item !== selectedValues[index]);
    const previous = origin === 'display' ? displayValues : selectionData.values;
    const drafts = next.map(raw => origin === 'raw' ? raw : previous.find(item => item.value === raw) ?? raw);
    const labeled = convertSelectValues(drafts, dataMaps, fields, optionLabelProp);
    const output = selectValueOutput(labeled, true, Boolean(labelInValue));
    const callback = onChange as ((value: unknown, options: OptionType[]) => void) | undefined;
    const rawOptions = callback && changed ? next.map(callbackOption) : undefined;
    useDefault = false;
    rememberLabels(labeled);
    // TypeScript не сужает generic Mode/LabelInValue при runtime проверке.
    value = output as typeof value;
    (onValueChange as ((value: unknown) => void) | undefined)?.(output);
    if (rawOptions) callback?.(output, rawOptions);
  }

  function optionData(value: RawValue) {
    return dataMaps.valueOptions.get(value) ?? selectionData.options.get(value);
  }

  function callbackOption(value: RawValue): OptionType {
    return copySelectData(optionData(value)) as OptionType;
  }

  function notifySelect(value: RawValue, data: OptionType | undefined, selected: boolean) {
    const callback = (selected ? onSelect : onDeselect) as
      ((value: unknown, option: OptionType) => void) | undefined;
    callback?.(selectValueEvent(value, data, fields, Boolean(labelInValue)), copySelectData(data) as OptionType);
  }

  function submitTag(text: string) {
    if (!tagMode || resolvedDisabled) return;
    const next = text.trim();
    if (!next) return;
    const data = optionData(next);
    if (!countReached && !Reflect.get(data ?? {}, 'disabled')) {
      if (!selectedKeys.has(next)) changeMultiple([...selectedValues, next], 'raw');
      notifySelect(next, data, true);
    }
    internalSearch = '';
  }

  function choose(option: Row | undefined) {
    if (resolvedDisabled || option && (option.group || option.value === undefined
      || isSelectOptionDisabled(option.data.disabled, selectedKeys.has(option.value), countReached))) {
      return;
    }

    const chosenValue = option?.value;
    const data = chosenValue === undefined ? undefined : optionData(chosenValue);

    if (multiple) {
      const next = new Set(selectedValues);
      const clearQuery = tagMode && !option && Boolean(search);
      const onClearSearch = clearQuery ? searchCallback : undefined;
      const removing = chosenValue !== undefined && next.has(chosenValue);

      if (chosenValue !== undefined) {
        if (removing)
          next.delete(chosenValue);
        else next.add(chosenValue);
      } else {
        if (!next.size && !clearQuery) return;
        onClear?.();
        next.clear();
      }

      if (option || selectedValues.length) changeMultiple([...next]);
      if (chosenValue !== undefined) notifySelect(chosenValue, data, !removing);
      if (!option || autoClearSearch) internalSearch = '';
      onClearSearch?.('');
      control?.focus();
      return;
    }

    const changed = chosenValue !== selectedRaw;
    const callback = onChange as
      ((value: unknown, option: OptionType | undefined) => void) | undefined;
    const rawOption = chosenValue === undefined ? undefined : copySelectData(data) as OptionType;
    if (!option && selected) onClear?.();
    useDefault = false;
    const labeled = convertSelectValues(chosenValue === undefined ? [] : [chosenValue], dataMaps, fields, optionLabelProp);
    const output = selectValueOutput(labeled, false, Boolean(labelInValue));
    const keepSupplied = !changed && keepSelectSuppliedValue(value, providedValue, chosenValue);
    if (!keepSupplied) {
      rememberLabels(labeled);
      value = output as typeof value;
    }
    (onValueChange as ((value: unknown) => void) | undefined)?.(keepSupplied ? value : output);
    if (changed) callback?.(output, rawOption);
    if (chosenValue !== undefined) notifySelect(chosenValue, data, true);
    setOpen(false);
    control?.focus();
  }

  function remove(item: RawValue, focus = true) {
    if (resolvedDisabled || selectionOptions.get(item)?.disabled) return;

    const next = new Set(selectedValues);
    const data = optionData(item);

    if (next.delete(item)) {
      changeMultiple([...next], 'display');
      notifySelect(item, data, false);
    }
    if (focus) control?.focus();
  }

  function handleCustomTagMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setOpen(!expanded);
  }

  function connectTagElement(node: HTMLElement, value: RawValue) {
    tagElements.set(value, node);
    return () => {
      if (tagElements.get(value) === node) tagElements.delete(value);
    };
  }

  function handleReset(event: Event) {
    const input = control;

    if (!multiple || !input || event.target !== input.form) return;

    queueMicrotask(() => {
      if (event.defaultPrevented || !input.isConnected || input !== control || !multiple) return;

      useDefault = false;
      value = (Array.isArray(initialDefault) ? [...initialDefault] : []) as typeof value;
      internalLabels = undefined;
      uncontrolledLabels = undefined;
      internalSearch = '';
      internalOpen = false;
      open = false;
      composing = false;
      pastedText = undefined;
    });
  }

  function handleKeydown(
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement; }
  ) {
    onkeydown?.(event);

    if (event.defaultPrevented || resolvedDisabled || event.isComposing || composing) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!expanded) {
        openList(event.key === 'ArrowUp' ? 'last' : 'first');
      } else {
        activate(enabledIndex(activeIndex, event.key === 'ArrowUp' ? 'previous' : 'next'), true);
      }
    } else if ((event.key === 'Home' || event.key === 'End') && expanded) {
      event.preventDefault();
      activate(enabledIndex(-1, event.key === 'Home'
        ? 'first'
        : 'last'), true);
    } else if (event.key === 'Enter' || (event.key === ' ' && !canSearch)) {
      event.preventDefault();

      if (!expanded) {
        openList();
        if (tagMode && event.key === 'Enter' && activeIndex >= 0) choose(filtered[activeIndex]);
      } else if (activeIndex >= 0) {
        choose(filtered[activeIndex]);
      }
    } else if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (multiple
      && event.key === 'Backspace'
      && !search
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey) {
      event.preventDefault();

      const last = [...tags].reverse().find((tag) => !tag.disabled);

      if (last)
        remove(last.value);
    } else if (!multiple
      && allowClear
      && !canSearch
      && (event.key === 'Backspace'
        || event.key === 'Delete')) {
      event.preventDefault();
      choose(undefined);
    } else if (!canSearch
      && event.key.length === 1
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey) {
      typeahead = (event.timeStamp - lastTyped > 700 ? '' : typeahead) + event.key;
      lastTyped = event.timeStamp;
      const matches = flattenSelectData<RawValue, OptionType>(options, fields)
        .filter(row => !row.group && !row.data.disabled
          && matchesSelectDataLabel(typeahead, row.data, fields));

      const opening = !expanded;
      openList();
      const match = matches[0];
      const index = match ? filtered.findIndex(option => option.value === match.value) : -1;
      if (opening) keepOpeningKeyboardActivation(index);
      activate(index, true);
    }
  }

  function handleBeforeInput(
    event: InputEvent & { currentTarget: EventTarget & HTMLInputElement; }
  ) {
    onbeforeinput?.(event);

    if (multiple && !canSearch)
      event.preventDefault();
  }

  function restoreControlledSearch(input: HTMLInputElement) {
    if (controlledSearch === undefined) return;

    void tick().then(() => {
      if (input === control && input.isConnected && (multiple || expanded) && canSearch)
        input.value = search;
    });
  }

  function updateSearch(next: string, input: HTMLInputElement, compositionEnd = false) {
    if (countReached) {
      input.value = search;
      restoreControlledSearch(input);
      return;
    }

    if (multiple && tokenSeparators !== undefined && !composing) {
      const cap = maxCount !== undefined && !Number.isNaN(maxCount)
        ? maxCount - selectedValues.length : undefined;
      const words = splitSelectTokens(next, tokenSeparators, cap);
      if (words !== null) {
        const previousSearch = search;
        const onSearch = searchCallback;
        const nextValues = new Set(selectedValues);
        for (const option of resolveSelectTokenOptions(dataMaps, words, tagMode, fields))
          nextValues.add(option.value);
        const rawOptions = new Map([...nextValues].map(value => [value, optionData(value)]));
        if (nextValues.size !== selectedValues.length) changeMultiple([...nextValues], 'raw');
        for (const value of nextValues) notifySelect(value, rawOptions.get(value), true);
        internalSearch = '';
        activeIndex = -1;
        setOpen(false);
        if (previousSearch !== '') onSearch?.('');
        input.value = controlledSearch ?? '';
        restoreControlledSearch(input);
        return;
      }
    }
    if (compositionEnd && next === search) return;

    internalSearch = next;
    searchCallback?.(next);
    restoreControlledSearch(input);
    setOpen(true);
  }

  function handleInput(event: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
    const input = event.currentTarget;
    if (multiple && (!canSearch || resolvedDisabled)) {
      input.value = search;
      pastedText = undefined;
      return;
    }

    let next = input.value;
    if (pastedText && /[\r\n]/.test(pastedText)) {
      const normalized = pastedText.replace(/[\r\n]+$/, '')
        .replace(/\r\n/g, ' ').replace(/[\r\n]/g, ' ');
      next = next.replace(normalized, pastedText);
    }
    pastedText = undefined;
    updateSearch(next, input);
  }

  function handlePaste(event: ClipboardEvent & { currentTarget: EventTarget & HTMLInputElement; }) {
    onpaste?.call(event.currentTarget, event);
    const tokenWithEnter = typeof tokenSeparators === 'function'
      || tokenSeparators?.some(token => token === '\n' || token === '\r\n');
    pastedText = !event.defaultPrevented && multiple && tokenWithEnter
      ? event.clipboardData?.getData('text') : undefined;
  }

  function handleCompositionStart(
    event: CompositionEvent & { currentTarget: EventTarget & HTMLInputElement; }
  ) {
    oncompositionstart?.call(event.currentTarget, event);
    composing = true;
  }

  function handleCompositionEnd(
    event: CompositionEvent & { currentTarget: EventTarget & HTMLInputElement; }
  ) {
    composing = false;
    oncompositionend?.call(event.currentTarget, event);
    if (!event.defaultPrevented && multiple && tokenSeparators !== undefined
      && canSearch && !resolvedDisabled) {
      updateSearch(event.currentTarget.value, event.currentTarget, true);
    }
  }

  function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement; }) {
    onclick?.(event);

    if (!event.defaultPrevented) {
      if (expanded && !canSearch) {
        setOpen(false);
      } else {
        openList();
      }
    }
  }

  function handleBlur(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement; }) {
    focused = false;
    composing = false;
    pastedText = undefined;
    const next = event.relatedTarget;

    if (!(next instanceof Node && list?.contains(next))) {
      if (tagMode) submitTag(search);
      else if (multiple) internalSearch = '';
      setOpen(false);
    }
    field?.onBlur();
    onblur?.(event);
  }

  function handleListFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;

    if (next instanceof Node && (container.contains(next) || list?.contains(next))) return;

    focused = false;
    if (tagMode) submitTag(search);
    else if (multiple) internalSearch = '';
    setOpen(false);
  }

  function handleFocus(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement; }) {
    focused = true;
    // Прямой Svelte handler получает native input в this; обёртка сохраняет receiver.
    onfocus?.call(event.currentTarget, event);
  }

  function handlePointerDown(
    event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement; }
  ) {
    const target = event.target;
    if (renderTag && target instanceof Element && target.closest('[data-select-custom-tag]')) return;

    if (multiple
      && target instanceof Element
      && !target.closest('button, input')
      && !resolvedDisabled) {
      event.preventDefault();
      control?.focus();
      openList();
    } else if (target === event.currentTarget && !resolvedDisabled) {
      event.preventDefault();
      control?.focus();
      control?.click();
    }
  }
</script>

<style>
  .container { position: relative; min-width: 0; width: 100%; }
  .container[data-ant-select-value-layer] { display: inline-flex; }
  [data-ant-select-control] { display: flex; align-items: center; min-width: 0; width: 100%; }
  [data-ant-select-control]:focus-within { outline: 2px solid var(--ant-color-primary); outline-offset: 2px; }
  [data-ant-select-control][data-ant-select-source-theme] { align-items: flex-start; }
  [data-ant-select-control][data-ant-select-source-theme]:focus-within { outline: 0; outline-offset: 0; }
  [data-ant-select-control][data-ant-select-single] [data-ant-select-input], [data-ant-select-control][data-ant-select-multiple] [data-ant-select-input] {
    position: relative;
    inset: auto;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    line-height: inherit;
    cursor: inherit;
  }
  [data-ant-select-input]::placeholder { color: var(--ant-color-text-placeholder); }
  [data-ant-select-content]:has(> [data-ant-select-placeholder]) [data-ant-select-input]::placeholder { color: transparent; }
  [data-ant-select-placeholder] { position: absolute; inset-inline-start: 0; }
  [data-ant-select-control][data-ant-select-single] [data-ant-select-content][data-select-value-layer] [data-ant-select-input] { position: absolute; inset: 0; }
  [data-ant-select-content][data-select-value-layer]:not([data-select-value-search]) [data-ant-select-input] { -webkit-text-fill-color: transparent; }
  [data-ant-select-content][data-select-value-search] [data-ant-select-input] { color: var(--ant-native-select-color, var(--ant-color-text)); -webkit-text-fill-color: var(--ant-native-select-color, var(--ant-color-text)); }
  [data-ant-select-content][data-select-value-layer] { display: block; }
  [data-ant-select-content][data-select-value-layer][data-select-value-has-content]::before { display: none; }
  [data-ant-select-content][data-select-value-search] > [data-ant-select-value] { opacity: 0; }
  .intrinsic-width { width: auto; }
  .intrinsic-width [data-ant-select-content] { position: relative; }
  .intrinsic-width [data-ant-select-control][data-ant-select-single] [data-ant-select-input] { position: absolute; inset: 0; }
  .intrinsic-label { visibility: hidden; white-space: pre; }
  .suffix { display: flex; flex: none; color: var(--ant-color-text-quaternary); pointer-events: none; }
  .clear { display: flex; padding: 0; margin-inline-end: 4px; border: 0; background: none; color: var(--ant-color-text-tertiary); cursor: pointer; }
  .clear:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: 2px; }
  .popup[data-ant-select-dropdown] { top: calc(100% + 4px); inset-inline: 0; max-height: none; overflow: visible; }
  /* Исходный virtual-list размещает options в flex column без сжатия строк. */
  .popup[data-ant-select-source-popup] { display: flex; flex-direction: column; }
  .popup[data-ant-select-dropdown][popover] { position: fixed; inset: auto; margin: 0; border: 0; }
  .popup[data-ant-select-dropdown][hidden] { display: none; }
  [data-ant-select-source-popup] > [data-ant-select-item] { flex: none; }
  [data-ant-select-source-theme] .clear { display: inline-block; margin-inline-end: 0; color: var(--ant-color-text-quaternary); }
  [data-ant-select-source-theme] .clear:hover { color: var(--ant-color-icon); }
  [data-ant-select-source-theme] .clear:focus-visible { opacity: 1; }
  [data-ant-select-source-theme]:has(.clear):hover .suffix, [data-ant-select-source-theme]:has(.clear:focus-visible) .suffix { opacity: 0; }
  [data-ant-select-item] { width: 100%; border: 0; background: none; font-family: inherit; text-align: start; }
  [data-ant-select-control][data-ant-select-multiple] { height: auto; min-height: var(--ant-native-select-height); }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-content] { gap: 0; }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-input] { flex: 1 1 60px; width: 60px; min-width: 40px; max-width: 100%; }
  [data-ant-select-control][data-ant-select-source-theme][data-ant-select-multiple] [data-ant-select-input] { flex: none; width: 4px; min-width: 4px; }
  [data-ant-select-control][data-ant-select-responsive-tags] [data-ant-select-input] { flex: none; width: 4px; min-width: 4px; }
  .measure-tag { position: absolute; inset-block-start: 0; inset-inline-start: 0; visibility: hidden; pointer-events: none; }
  .custom-tag { display: inline-flex; flex: none; min-width: 0; max-width: 100%; }
  [data-ant-select-control][data-ant-select-source-theme][data-ant-select-multiple] [data-ant-select-input] { line-height: calc(var(--ant-select-internal_fixed_item_margin) * 2 + var(--ant-native-select-multi-item-height)); }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-selection-item] { flex: none; box-sizing: border-box; max-width: calc(100% - var(--ant-select-internal_fixed_item_margin) * 2); min-width: 0; }
  [data-ant-select-control][data-ant-select-source-theme][data-ant-select-multiple] [data-ant-select-selection-item] { max-width: calc(100% - 4px - var(--ant-select-internal_fixed_item_margin) * 2); }
  [data-ant-select-selection-item-remove] { flex: none; padding: 0; border: 0; background: transparent; }
  [data-ant-select-selection-item-remove]:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: 1px; }
  [data-ant-select-selection-item-disabled] { color: var(--ant-select-multiple-item-color-disabled); }
  [data-ant-select-source-theme] [data-ant-select-selection-item-disabled] { color: inherit; }
  .container[data-ant-select-compact-item] > [data-ant-select-control] { border-radius: inherit; }
  @media (hover: none) {
    [data-ant-select-source-theme]:has(.clear) .suffix { opacity: 0; }
  }
</style>

<svelte:document onreset={handleReset} />

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`select-prefix:${prefix}:${rootPrefix}`} />{/if}<div data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
  data-ant-select-value-layer={selectedLayer || undefined}
  data-ant-select-compact-item={Boolean(compact) || undefined} class={[
    'container ant-select-css-var',
    intrinsicWidth && 'intrinsic-width',
    componentTheme.className,
    compactItemClasses,
    compact && resolvedSize === 'large' && `${prefix}-lg`,
    compact && resolvedSize === 'small' && `${prefix}-sm`,
    compact && expanded && `${prefix}-focused`,
    compact && resolvedDisabled && `${prefix}-disabled`,
    className
  ]} bind:this={container} style={[componentTheme.style, style].filter(Boolean).join(';') || undefined}>
  <div
    bind:this={reference}
    data-ant-select-control data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
    data-ant-select-source-theme={Boolean(componentTheme.className) || undefined}
    data-ant-select-single={!multiple || undefined} data-ant-select-multiple={multiple || undefined}
    data-ant-select-responsive-tags={responsiveTags || undefined}
    style:--ant-native-select-height={`var(--${privateNamespace}-select-height)`}
    style:--ant-native-select-multi-item-height={`var(--${privateNamespace}-select-multi-item-height)`}
    style:--ant-native-select-color={`var(--${privateNamespace}-select-color)`}
    role="presentation"
    onpointerdown={handlePointerDown}
    class={[
        `${prefix} ant-select-css-var`,
        `${prefix}-${appearance}`,
        `${prefix}-show-arrow`,
        feedback.hasFeedback && `${prefix}-has-feedback`,
        feedback.isFormItemInput && `${prefix}-in-form-item`,
        componentTheme.className && `${prefix}-source-theme`,
        componentTheme.className && canSearch && `${prefix}-show-search`,
        componentTheme.className && allowClear && `${prefix}-allow-clear`,
        componentTheme.className && config.direction === 'rtl' && `${prefix}-rtl`,
        loading && `${prefix}-loading`,
        multiple ? `${prefix}-multiple` : `${prefix}-single`,
        responsiveTags && `${prefix}-responsive-tags`,
        expanded && `${prefix}-open`,
        (expanded || componentTheme.className && focused) && `${prefix}-focused`,
        resolvedDisabled && `${prefix}-disabled`,
        resolvedSize === 'large' && `${prefix}-lg`,
        resolvedSize === 'small' && `${prefix}-sm`,
        resolvedStatus && `${prefix}-status-${resolvedStatus}`
      ]}
    style={componentTheme.style}
  >
    <div data-ant-select-content
      data-select-value-layer={selectedLayer || undefined}
      data-select-value-has-content={selectedHasValue || undefined}
      data-select-value-search={selectedLayer && expanded && canSearch && Boolean(search) || undefined}
      class={[`${prefix}-content`, selectedLayer && selectedHasValue && `${prefix}-content-has-value`,
        selectedLayer && hasSelectedStyle && `${prefix}-content-has-option-style`,
        selectedLayer && expanded && canSearch && Boolean(search) && `${prefix}-content-has-search-value`]}
      title={hasSelectedStyle ? undefined : selectedTitle}
      bind:this={contentElement}>{#if intrinsicWidth && !selectedLayer}<span class="intrinsic-label" aria-hidden="true">{#if selected}<RenderContent value={selected.label as RenderEmptyContent} />{:else}{placeholder ?? ''}{/if}</span>{/if}{#if !selected && !selectedValues.length && !search && placeholder}<div data-ant-select-placeholder class={`${prefix}-placeholder`} aria-hidden="true">{placeholder}</div>{/if}{#if selectedLayer && selected}
        <div data-ant-select-value class={[hasSelectedStyle && `${prefix}-content-value`, selectedClass]}
          style={serializeInlineStyleLayers([
            hasSelectedStyle && expanded && canSearch && search ? 'visibility:hidden' : undefined,
            serializeSelectDataStyle(selectedStyle)
          ])} title={hasSelectedStyle ? selectedTitle : undefined}>
          <RenderContent value={selected.label as RenderEmptyContent} />
        </div>{/if}{#if multiple}
        {#each renderedTags as tag, index (tag.value)}
          {@const hidden = responsiveTags && !visibleTagKeys.has(tag.value)}
          {#snippet tagLabel()}<RenderContent value={getSelectTagText(tag.label, maxTagTextLength) as RenderEmptyContent} />{/snippet}
          <span data-ant-select-selection-item={!renderTag || undefined}
            data-ant-select-selection-item-disabled={!renderTag && (resolvedDisabled || tag.disabled) || undefined}
            class={[
              renderTag ? 'custom-tag' : `${prefix}-selection-item`,
              hidden && 'measure-tag',
              !renderTag && (resolvedDisabled || tag.disabled) && `${prefix}-selection-item-disabled`
            ]} title={renderTag ? undefined : selectValueTitle(tag)} data-select-tag={responsiveTags || undefined}
            data-select-custom-tag={renderTag ? '' : undefined}
            role="presentation" onmousedown={renderTag ? handleCustomTagMouseDown : undefined}
            aria-hidden={hidden || undefined} inert={hidden}
            {@attach node => connectTagElement(node, tag.value)}>
            {#if renderTag}
              {@render renderTag({
                label: tagLabel, value: tag.value, index, disabled: tag.disabled,
                closable: !resolvedDisabled && !tag.disabled, isMaxTag: false,
                onClose: event => {
                  event?.stopPropagation();
                  remove(tag.value, false);
                }
              })}
            {:else}
              <span class={`${prefix}-selection-item-content`}>{@render tagLabel()}</span>{#if !resolvedDisabled && !tag.disabled}<button type="button" data-ant-select-selection-item-remove class={`${prefix}-selection-item-remove`} aria-label={`${config.locale.removeText
                ?? ruRU.removeText} ${selectValueText(tag.label) || tag.value}`} onpointerdown={(event) => event.preventDefault()} onclick={() => remove(tag.value)}><Icon name="close" /></button>{/if}
            {/if}
          </span>{/each}{#if tagOverflow.omitted.length || responsiveTags && tags.length}
          {#snippet restLabel()}
            {#if typeof tagPlaceholder === 'function'}{@render tagPlaceholder(tagOverflow.omitted)}
            {:else if tagPlaceholder == null}+ {tagOverflow.omitted.length} ...
            {:else if typeof tagPlaceholder !== 'boolean'}{tagPlaceholder}{/if}
          {/snippet}
          <span data-ant-select-selection-item={!renderTag || undefined}
            class={[`${prefix}-selection-overflow-item-rest`,
              renderTag ? 'custom-tag' : `${prefix}-selection-item`,
              !tagOverflow.omitted.length && 'measure-tag']}
            title={renderTag ? undefined : tagPlaceholderTitle}
            data-select-rest={responsiveTags || undefined}
            data-select-custom-tag={renderTag ? '' : undefined}
            role="presentation" onmousedown={renderTag ? handleCustomTagMouseDown : undefined}
            aria-hidden={!tagOverflow.omitted.length || undefined} inert={!tagOverflow.omitted.length}>
            {#if renderTag}{@render renderTag({
              label: restLabel, isMaxTag: true, disabled: false, closable: false
            })}{:else}<span class={`${prefix}-selection-item-content`}>{@render restLabel()}</span>{/if}
          </span>{/if}{/if}<input
        {...nativeAttributes}
        bind:this={control}
        id={controlId}
        data-ant-select-input class={`${prefix}-input`}
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-busy={loading || undefined}
        aria-controls={expanded ? `${controlId}_list` : undefined}
        aria-activedescendant={expanded && activeIndex >= 0
            ? `${controlId}_list_${activeIndex}`
            : undefined}
        aria-autocomplete={canSearch ? 'list' : 'none'}
        aria-invalid={field?.invalid || resolvedStatus === 'error'
            || attributes['aria-invalid']
            || undefined}
        aria-required={attributes.required || field?.required || undefined}
        aria-describedby={[attributes['aria-describedby'], field?.describedBy].filter(
            Boolean
          ).join(
            ' '
          )
            || undefined}
        autocomplete="off"
        readonly={isReadOnly}
        inputmode={attributes.inputmode
            ?? (multiple && !canSearch
              ? 'none'
              : undefined)}
        required={multiple || selectedRaw !== undefined && selectedLabelScope && selectedText === ''
          ? false : attributes.required}
        disabled={resolvedDisabled}
        value={multiple
            ? search
            : expanded && canSearch ? search : selectedText}
        placeholder={multiple
            ? selectedValues.length ? undefined : placeholder
            : selectedLayer && selected ? undefined : expanded && canSearch ? selectedText || placeholder : placeholder}
        onkeydown={handleKeydown}
        onbeforeinput={handleBeforeInput}
        oninput={handleInput}
        onpaste={handlePaste}
        oncompositionstart={handleCompositionStart}
        oncompositionend={handleCompositionEnd}
        onclick={handleClick}
        onblur={handleBlur}
        onfocus={handleFocus}
      />
    </div>
    {#if allowClear && (multiple ? selectedValues.length || tagMode && search : selected) && !resolvedDisabled}
      <button type="button" class={['clear', componentTheme.className && `${prefix}-clear`]} aria-label={config.locale.clearText} onpointerdown={(event) => event.preventDefault()} onclick={() => choose(undefined)}><Icon name="close" /></button>
    {/if}
    <span class={['suffix', componentTheme.className && `${prefix}-suffix`]}><Icon name={loading ? 'loading' : 'down'} />{#if feedback.hasFeedback && feedback.icon}<FormFeedbackIcon descriptor={feedback.icon} />{/if}</span>
  </div>
  {#if name ?? field?.name}
    {#if multiple}
      {#each selectedValues as item (item)}<input type="hidden" name={name ?? field?.name} value={item} disabled={resolvedDisabled} form={attributes.form} />{/each}
    {:else}
      <input type="hidden" name={name ?? field?.name} value={selectedRaw ?? ''} disabled={resolvedDisabled} form={attributes.form} />
    {/if}
  {/if}
  {#if expanded}
    {@const initialPopupStyle = untrack(() => popupStyle.initialStyle())}
    <div
      bind:this={list}
      data-ant-select-dropdown data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
      data-ant-select-source-popup={Boolean(componentTheme.className) && filtered.length > 0 || undefined}
      popover="manual"
      hidden={!shown}
      dir={config.direction}
      class={[`popup ${prefix}-dropdown`, componentTheme.className && 'ant-select-css-var',
        componentTheme.className && filtered.length > 0 && `${prefix}-source-popup`,
        componentTheme.className && config.direction === 'rtl' && `${prefix}-dropdown-rtl`,
        popupPlacement && `${prefix}-dropdown-placement-${popupPlacement}`,
        componentTheme.className]} style={initialPopupStyle}
      {@attach popupStyle.attach}
      {@attach node => connectComponentTheme(node, componentTheme.style)}
      {@attach portal}
      aria-busy={loading || undefined}
      onfocusout={handleListFocusOut}
      aria-label={attributes['aria-label']
          ?? placeholder
          ?? config.locale.searchText}
    >
      {#snippet optionRow(option: Row, info: SelectOptionListRenderInfo)}
        {@const index = info.index}
        {@const data = option.data}
        {@const rowDisabled = info.attributes['aria-disabled'] === true}
        {@const rowSelected = option.value !== undefined
          && (multiple ? selectedKeys.has(option.value) : option.value === selectedRaw)}
        {@const content = selectDataContent(option)}
        {@const presentation = selectDataAttributes(option, fields)}
        {#if option.group}
          <div data-ant-select-item-group class={[`${prefix}-item ${prefix}-item-group`,
            typeof data.className === 'string' && data.className]}
            title={nativeTitle(selectDataTitle(option))} {@attach info.attach}>
            {#if typeof content !== 'boolean'}{content ?? ''}{/if}
          </div>
        {:else}
        <button
          {...presentation.physical}
          type="button"
          data-ant-select-item
          tabindex={(presentation.physical.tabindex ?? -1) as number}
          disabled={rowDisabled}
          {...info.virtual ? {
            'aria-selected': undefined,
            'aria-disabled': info.attributes['aria-disabled']
          } : info.attributes}
          {@attach info.attach}
          class={[
              `${prefix}-item ${prefix}-item-option`,
              typeof data.className === 'string' && data.className,
              typeof data.class === 'string' && data.class,
              option.groupOption && `${prefix}-item-option-grouped`,
              rowSelected && `${prefix}-item-option-selected`,
              index === activeIndex && !rowDisabled && `${prefix}-item-option-active`,
              rowDisabled && `${prefix}-item-option-disabled`
            ]}
          title={nativeTitle(selectDataTitle(option))}
          style={serializeSelectDataStyle(data.style)}
          onpointerdown={event => {
              const handler = presentation.physical.onpointerdown;
              if (typeof handler === 'function') handler(event);
              if (typeof presentation.physical.onmousedown !== 'function') event.preventDefault();
            }}
          onmousedown={event => {
              const handler = presentation.physical.onmousedown;
              if (typeof handler === 'function') handler(event);
              event.preventDefault();
            }}
          onmousemove={() => {
              if (!rowDisabled && index !== activeIndex) activate(index);
            }}
          onpointermove={event => {
              const handler = presentation.physical.onpointermove;
              if (typeof handler === 'function') handler(event);
              if (!rowDisabled && index !== activeIndex) activate(index);
            }}
          onclick={() => choose(option)}
        >
          <span class={`${prefix}-item-option-content`}>{#if renderOption}{@render renderOption(getRenderOption(option), { index })}{:else}<RenderContent value={content as RenderEmptyContent} />{/if}</span>{#if rowSelected}<span class={`${prefix}-item-option-state`}><Icon name="check" /></span>{/if}
        </button>
        {/if}
      {/snippet}
      {#if optionList.items.length}
        <SelectOptionList model={optionList} renderItem={optionRow}
          id={`${controlId}_list`}
          prefixCls={prefix} direction={config.direction} {showScrollBar} {activeIndex}
          ariaLabel={listLabel} {multiple} busy={loading}
          onScroll={onPopupScroll} />
      {:else}
        <div class={`${prefix}-item-empty`} id={`${controlId}_list`} role="listbox"
          aria-label={listLabel} aria-multiselectable={multiple || undefined} aria-busy={loading || undefined}>{#snippet nativeEmpty()}{loading
              ? (config.locale.spin ?? ruRU.spin!).loadingText
              : config.locale.emptyText}{/snippet}<RenderEmpty componentName="Select"
              local={notFoundContent} fallback={nativeEmpty} /></div>
      {/if}
    </div>
  {/if}
</div>
