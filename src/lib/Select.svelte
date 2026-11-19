<script lang="ts" generics="Value extends string | number = string, Mode extends 'multiple' | 'tags' | undefined = undefined, OptionType extends object = SelectOption<Mode extends 'tags' ? Value | string : Value>, LabelInValue extends boolean = false, RootElement extends HTMLElement = HTMLDivElement, EditorElement extends HTMLElement = HTMLInputElement">
  import { onMount, onDestroy, tick, untrack, type Snippet } from 'svelte';
  import { useConfig } from './config-context';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getSelectPrefixCss } from './select-prefix.engine';
  import { useVariant } from './variant.svelte';
  import RenderEmpty from './RenderEmpty.svelte';
  import RenderContent from './RenderContent.svelte';
  import SelectPopupContent from './SelectPopupContent.svelte';
  import { hasSelectControlSemantics, hasSelectDisplayContent, mergeSelectSemanticMaps, mergeSelectStyle, resolveSelectSemanticValue, serializeSelectStyle } from './select-semantic.engine';
  import { createSelectStyle, selectStyle, selectStyleAttributes } from './select-style.model.svelte';
  import { resolveSelectStyleFrame } from './select-style.engine';
  import { createSelectComponentInputStyle, type SelectComponentInputLifetime } from './select-component-input-style.dom';
  import { useComponentTheme } from './theme-component.svelte';
  import { useToken } from './theme-context.svelte';
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
  import { ruRU, type SelectOption, type RenderEmptyContent } from './types';
  import type {
    SelectProps,
    SelectScrollConfig,
    SelectFlattenOption,
    SelectSearchConfig,
    SelectTagPlaceholder,
    SelectTagInfo,
    SelectLabelRenderInfo,
    SelectSemanticInfo,
    SelectConfigSemanticInfo,
    SelectStyle
  } from './select.types';
  import { getSelectTagText } from './select-tag-text.engine';
  import { getSelectTagOptions } from './select-tags.engine';
  import { getSelectTagOverflow } from './select-tag-overflow.engine';
  import { connectSelectTagOverflow, measureSelectInput, measureSelectSourceInput } from './select-tag-overflow.dom';
  import { connectTreeSelectComponentOverflow } from './tree-select-component-overflow.dom';
  import type { TreeSelectComponentOverflowLayout } from './tree-select-component-overflow.engine';
  import { resolveSelectTokenOptions, splitSelectTokens } from './select-token.engine';
  import SelectComponent from './SelectComponent.svelte';
  import { clearSelectComponentHydration, selectComponentHydrationAttributes, takeSelectComponentHydration } from './select-components-hydration.dom';
  import type { SelectRootRegistration, SelectInputRegistration } from './select-components.types';
  import { mergeSelectComponentAttributes, focusSelectComponent, blurSelectComponent, selectComponentNativeElement, selectComponentInputElement } from './select-components.engine';
  import { treeSelectNativeKeyCancelled } from './tree-select-components.engine';
  import SelectIcon from './SelectIcon.svelte';
  import { resolveSelectSuffix, resolveSelectMenuIcon, resolveSelectRemoveIcon, resolveSelectClear } from './select-icons.engine';
  import { selectIconAttribute } from './select-icon-attribute.engine';

  type RawValue = Value | string;
  type Row = SelectDataRow<RawValue, OptionType>;

  let {
    open = $bindable<boolean | undefined>(),
    open: providedOpen,
    value = $bindable<SelectProps<Value, Mode, OptionType, LabelInValue, RootElement, EditorElement>['value']>(),
    value: providedValue,
    nativeElement = $bindable(),
    inputElement = $bindable(),
    ...componentProps
  }: SelectProps<Value, Mode, OptionType, LabelInValue, RootElement, EditorElement> = $props();
  let {
    _autoWidth = false,
    prefixCls,
    components,
    prefix: leading,
    suffix,
    suffixIcon,
    loadingIcon,
    menuItemSelectedIcon,
    removeIcon,
    rootClassName,
    classNames,
    styles,
    popupRender,
    options = [],
    fieldNames,
    optionLabelProp,
    labelInValue,
    labelRender,
    optionRender,
    mode,
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
    size,
    variant,
    showSearch,
    loading,
    notFoundContent,
    onPopupScroll,
    getPopupContainer,
    allowClear,
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
    onInputKeyDown, onKeyDown, onKeyUp, onFocus, onBlur, onClick, onMouseDown,
    onmousedown,
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
    ...attributes
  } = $derived(componentProps);

  const config = useConfig();
  const tokens = useToken();
  let { virtual, title: rootTitle, ...nativeAttributes } = $derived(attributes);
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
      return rootSlot ? reference : container;
    },
    focus,
    blur
  };
  const field = useFormField(() => controlRef);
  const itemStatus = useFormItemStatusContext();
  const feedback = useFormFeedback();
  let appearance = $derived(variantContext.variant);
  let mergedShowSearch = $derived(showSearch ?? config.select?.showSearch);
  let mergedAllowClear = $derived(allowClear ?? config.select?.allowClear ?? false);
  let semanticSize = $derived(size ?? compact?.size ?? config.explicitComponentSize);
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
  let committedOpenChange = untrack(() => onOpenChange);
  let committedBlur = untrack(() => onblur);
  let committedPublicBlur = untrack(() => onBlur);
  $effect(() => {
    committedOpenChange = onOpenChange;
    committedBlur = onblur;
    committedPublicBlur = onBlur;
  });
  let internalSearch = $state('');
  let searchConfig = $derived<SelectSearchConfig<RawValue, OptionType>>(
    { ...(typeof mergedShowSearch === 'object' ? mergedShowSearch : {}) }
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
    selectValueDrafts(
      value !== undefined ? value : initialDefault,
      mode === 'multiple' || mode === 'tags'
    )
  )));
  let activeIndex = $state(-1);
  let componentAccessibilityIndex = $state(0);
  let container = $state<HTMLDivElement>();
  let defaultReference = $state<HTMLDivElement>();
  let defaultControl = $state<HTMLInputElement>();
  let customRoot = $state.raw<{ registration: SelectRootRegistration<RootElement> }>();
  let customInput = $state.raw<{ registration: SelectInputRegistration<EditorElement> }>();
  let rootSlot = $derived(components?.root);
  let inputSlot = $derived(!rootSlot && components?.input);
  let reference = $derived(rootSlot ? selectComponentNativeElement(customRoot?.registration) : defaultReference);
  let control = $derived((rootSlot ? selectComponentInputElement(customRoot?.registration)
    : inputSlot ? selectComponentInputElement(customInput?.registration) : defaultControl) as HTMLInputElement | undefined);
  let rootContext = $derived(rootSlot ? componentRootContext() : undefined);
  let inputContext = $derived(inputSlot ? componentInputContext() : undefined);
  const componentInputStyle = createSelectComponentInputStyle();
  let componentInputWidth = $state<number>();
  let componentInputValue = $derived.by(() => !canSearch
    || multiple && !(hydrated && isOpen) && autoClearSearch && !tagMode ? '' : search);
  function componentInputLifetime(): SelectComponentInputLifetime {
    return rootSlot ? undefined : multiple ? 'multiple' : 'single';
  }
  let committedInputAttributes: Record<string, unknown> = {};
  $effect(() => {
    const context = inputContext;
    committedInputAttributes = context?.attributes as Record<string, unknown> ?? {};
    const input = control;
    const value = committedInputAttributes.value;
    if (inputSlot && input && value != null) {
      const text = String(value);
      if (input.value !== text) input.value = text;
      // React DOM mirrors controlled value to defaultValue before layout measurement.
      // A focused number input retains its existing default until blur.
      if ((input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement
        && (committedInputAttributes.type !== 'number' || input.ownerDocument.activeElement !== input))
        && (input.defaultValue !== text || input instanceof HTMLInputElement && !input.hasAttribute('value'))) {
        input.defaultValue = text;
      }
    }
    // This effect already runs after attrs/value forwarding for ordinary snippets.
    // Read raw object styles as well as the serialized public context: width 20
    // -> '20px' must apply even when attrs.style itself has not changed.
    componentInputWidth = componentInputStyle.commit(inputSlot ? input : undefined,
      componentInputStyleFrame(), { lifetime: componentInputLifetime(), syncWidth: multiple,
        value: componentInputValue });
  });
  let list = $state<HTMLDivElement>();
  let menuElement = $state<HTMLDivElement>();
  let contentElement = $state<HTMLDivElement>();
  let responsiveCount = $state(Number.POSITIVE_INFINITY);
  let componentOverflow = $state.raw<TreeSelectComponentOverflowLayout>();
  let componentInputSuffix = $state<HTMLDivElement>();
  const tagElements = new Map<RawValue, HTMLElement>();
  let shown = $state(false);
  let popupPlacement = $state<string>();
  let typeahead = '';
  let lastTyped = 0;
  let composing = false;
  let mouseActivated = false;
  let pastedText: string | undefined;
  let controlId = $derived(id ?? field?.id ?? `ant-select-${generatedId}`);
  let tagMode = $derived(mode === 'tags');
  let multiple = $derived(mode === 'multiple' || tagMode);
  // Повторный parent spread может сбросить локальный bindable shadow без нового
  // owner value. Сохраняем лишь выбранные raw keys; обычные labels остаются live.
  let selectedValue = $derived(value !== undefined ? value : useDefault ? initialDefault
    : providedValue === undefined && uncontrolledLabels
      ? multiple ? uncontrolledLabels.map(item => item.value) : uncontrolledLabels[0]?.value
      : undefined);
  let canSearch = $derived(tagMode || (typeof mergedShowSearch === 'object' ? true : mergedShowSearch ?? multiple));
  // Readonly исключает input из нативной проверки; required multiple блокирует ввод через beforeinput.
  let isReadOnly = $derived(!canSearch && (!multiple || !attributes.required));
  let intrinsicWidth = $derived(_autoWidth && !multiple && isReadOnly);
  let localDrafts = $derived(selectValueDrafts(selectedValue, multiple));
  let labelFeatures = $derived(hasSelectLabelFeatures(
    labelInValue,
    optionLabelProp,
    labelRender,
    localDrafts,
    internalLabels
  ));
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
  let componentResponsive = $derived(Boolean(inputSlot) && multiple && responsiveTags);
  let tagOverflow = $derived(componentResponsive
    ? { visible: tags.slice(0, componentOverflow?.visibleCount ?? 0),
        omitted: tags.slice(componentOverflow?.omittedStart ?? 1) }
    : getSelectTagOverflow(tags,
      responsiveTags ? responsiveCount : typeof maxTagCount === 'number' ? maxTagCount : undefined));
  let renderedTags = $derived(componentResponsive
    ? tags.slice(0, componentOverflow?.renderCount ?? 0) : responsiveTags ? tags : tagOverflow.visible);
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
    : filterSelectData(
      options,
      search,
      fields,
      { ...filterConfig, defaultMatch: matchesSelectDataLabel }
    ));
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
  let selectedHasValue = $derived(hasSelectDisplayContent(selected?.label));
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
      !visible.has(value) && node.contains(active))) {
      return;
    }

    // Скрытый native remove button передаёт фокус input, не отменяя новый выбор владельца.
    void tick().then(() => {
      if (!input.isConnected || active.isConnected && !active.closest('[inert]')) {
        return;
      }
      const doc = input.ownerDocument;
      if (!doc.activeElement || doc.activeElement === active || doc.activeElement === doc.body
        || doc.activeElement === doc.documentElement) {
        input.focus();
      }
    });
  });
  let measuredInputWidth = $state<number>();
  $effect(() => {
    if (!componentResponsive) componentOverflow = undefined;
  });
  $effect(() => {
    if (!componentResponsive || !contentElement || !componentInputSuffix) {
      return;
    }
    const host = contentElement, suffix = componentInputSuffix;
    const overflow = untrack(() => connectTreeSelectComponentOverflow(host, suffix, () => tags.length,
      layout => { componentOverflow = layout; }, {
        tag: ':scope > [data-select-tag]', rest: ':scope > [data-select-rest]',
        prefix: ':scope > [class*="-content-item-prefix"]'
      }));
    // Query/style/width не сбрасывают историю размеров rest и suffix.
    $effect(() => {
      void tags.length;
      overflow.schedule();
    });
    return overflow.destroy;
  });
  $effect(() => {
    if (!contentElement || !responsiveTags || componentResponsive) {
      return;
    }
    const sourceWidth = sourceInputWidth;
    const input = sourceWidth ? control : undefined;
    void tags;
    void maxTagTextLength;
    void tagPlaceholder;
    void renderTag;
    void search;
    const host = contentElement;
    let disposed = false;
    let disconnect: (() => void) | undefined;
    void tick().then(() => {
      if (!disposed) {
        const update = (count: number) => { responsiveCount = count; };
        if (sourceWidth) {
          // rc-overflow1.0.1 Item64–68/Overflow137–147 учитывает offsetWidth
          // suffix, а не новый scrollWidth после сохранённой Source width history.
          disconnect = connectSelectTagOverflow(host, update, {
            tag: ':scope > [data-select-tag]', rest: ':scope > [data-select-rest]', input
          });
        }
        else disconnect = connectSelectTagOverflow(host, update);
      }
    });
    return () => {
      disposed = true;
      disconnect?.();
    };
  });
  let resolvedDisabled = $derived(disabled ?? field?.disabled ?? config.componentDisabled);
  let resolvedStatus = $derived(status ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let resolvedSize = $derived(size ?? compact?.size ?? config.componentSize);
  let semanticInfo = $derived<SelectSemanticInfo<Value, Mode, OptionType, LabelInValue, RootElement, EditorElement>>({ props: {
    ...componentProps,
    ...(providedValue !== undefined ? { value: providedValue } : {}),
    ...(providedOpen !== undefined ? { open: providedOpen } : {}),
    variant: appearance, status: resolvedStatus, disabled: resolvedDisabled, size: semanticSize
  } });
  let semantics = $derived.by(() => {
    const contextInfo: SelectConfigSemanticInfo = semanticInfo;
    const contextClasses = resolveSelectSemanticValue(config.select?.classNames, contextInfo);
    const localClasses = resolveSelectSemanticValue(classNames, semanticInfo);
    const contextStyles = resolveSelectSemanticValue(config.select?.styles, contextInfo);
    const localStyles = resolveSelectSemanticValue(styles, semanticInfo);
    const merged = mergeSelectSemanticMaps({ classes: contextClasses, styles: contextStyles },
      { classes: localClasses, styles: localStyles }, config.select?.style,
      typeof style === 'object' ? style : undefined);
    const sourceControlColors = style != null && typeof style === 'object'
      || config.select?.style != null && typeof config.select.style === 'object'
      || Boolean(config.select?.class)
      || hasSelectControlSemantics({ classes: contextClasses, styles: contextStyles },
        { classes: localClasses, styles: localStyles });
    return { ...merged, sourceControlColors };
  });
  let sourceInputWidth = $derived(semantics.sourceControlColors);
  const rootStyle = createSelectStyle(() => semantics.styles.root, () => [componentTheme.style, [
    ['--ant-native-select-height', `var(--${privateNamespace}-select-height)`],
    ['--ant-native-select-multi-item-height', `var(--${privateNamespace}-select-multi-item-height)`],
    ['--ant-native-select-color', `var(--${privateNamespace}-select-color)`],
    ...(semantics.sourceControlColors || inputSlot && multiple ? [['--ant-native-select-empty-input-gap',
      `var(--${privateNamespace}-select-multi-item-padding-horizontal)`]] as const : [])
  ]]);
  const inputStyle = createSelectStyle(() => semantics.styles.input, () =>
    sourceInputWidth || measuredInputWidth === undefined ? [] : [[['width', `${measuredInputWidth}px`]]], () =>
    sourceInputWidth ? [[['--select-input-width', measuredInputWidth === undefined ? '' : String(measuredInputWidth)]]] : []);
  function attachInputStyle(input: HTMLInputElement) {
    // При одном font/query update сначала применяем owner style, затем измеряем value.
    inputStyle.attach(input);
    $effect(() => {
      if (!multiple) {
        measuredInputWidth = undefined;
        return;
      }
      const sourceWidth = sourceInputWidth;
      // Legacy сохраняет прежний hash dependency и responsive short-circuit.
      if (!sourceWidth && !responsiveTags && !componentTheme.className) {
        measuredInputWidth = undefined;
        return;
      }
      void search;
      measuredInputWidth = sourceWidth ? measureSelectSourceInput(input) : measureSelectInput(input);
    });
  }
  const initialRootStyle = untrack(rootStyle.initialStyle);
  const initialInputStyle = untrack(inputStyle.initialStyle);
  const initialContentStyle = untrack(() => serializeSelectStyle(semantics.styles.content));
  const initialSuffixStyle = untrack(() => serializeSelectStyle(semantics.styles.suffix));
  let compactItemClasses = $derived(compactClasses(prefix, config.direction, compact));
  // Число 0 остаётся содержимым; null/empty string скрывают пустой список.
  let hiddenEmpty = $derived(filtered.length === 0
    && (notFoundContent === null || notFoundContent === false || notFoundContent === ''));
  let expanded = $derived(hydrated && isOpen && !resolvedDisabled && !hiddenEmpty);
  let resolvedSuffix = $derived(resolveSelectSuffix({
    suffix, suffixIcon, loadingIcon, showSearch, context: config.select,
    info: { searchValue: search, open: expanded, focused, showSearch: Boolean(canSearch), loading },
    hasFeedback: feedback.hasFeedback
  }, { down: downIcon, search: searchIcon, loading: spinnerIcon }));
  let clearIcon = $derived(resolveSelectClear({ allowClear, contextAllowClear: config.select?.allowClear,
    disabled: resolvedDisabled, displayCount: displayValues.length, searchValue: search }, clearGlyph,
    typeof mergedAllowClear === 'object' ? 'Clear' : config.locale.clearText));
  // A closed Native single editor hides its retained controlled query.
  let showClear = $derived(clearIcon.visible
    && (multiple || controlledSearch === undefined || expanded || Boolean(selected)));
  function readBlurState() {
    return {
      tagMode, multiple, search, expanded, disabled: resolvedDisabled, componentInput: Boolean(inputSlot),
      clearInternalSearch: !tagMode && (!multiple || autoClearSearch),
      clearSearch: !multiple && Boolean(search)
        && (controlledSearch === undefined || showSearch == null && typeof config.select?.showSearch === 'object')
        ? searchCallback : undefined
    };
  }
  // Removing a focused branch fires connected blur after Svelte pauses its
  // deriveds. Use the state belonging to that committed DOM, as for callbacks.
  let committedBlurState = untrack(readBlurState);
  $effect(() => { committedBlurState = readBlurState(); });
  // Setting disabled can synchronously blur before post-commit snapshots update.
  // Keep this new-input phase current before DOM writes, without reading paused deriveds.
  let componentInputBlurDisabled = untrack(() => resolvedDisabled);
  $effect.pre(() => {
    if (inputSlot) componentInputBlurDisabled = resolvedDisabled;
  });
  let popupVisited = $state(false);
  $effect(() => { if (expanded && popupRender && list) popupVisited = true; });
  let componentPopupVisited = $state(false);
  $effect(() => { if (expanded && (rootSlot || inputSlot)) componentPopupVisited = true; });
  let customPopup = $derived(Boolean(popupRender) || popupVisited);
  let popupPresent = $derived(expanded || popupVisited || Boolean(rootSlot || inputSlot) && componentPopupVisited);
  // Чтение present вычисляет весь объект: producer работает и для закрытого
  // control/SSR; только DOM ниже остаётся условным.
  let popupView = $derived.by(() => {
    void semantics;
    return { present: popupPresent, content: popupRender ? popupRender(originMenu) : originMenu };
  });

  onMount(() => {
    clearSelectComponentHydration(defaultReference);
    // Source сначала публикует измеренный закрытый Input, затем открывает список.
    if (componentResponsive) void tick().then(() => { if (!componentDestroyed) hydrated = true; });
    else hydrated = true;
    if (providedOpen === undefined) open = internalOpen;
  });

  $effect.pre(() => {
    const next = providedOpen;
    if (!Object.is(next, previousOwnerOpen)) {
      previousOwnerOpen = next;
      internalOpen = next ?? false;
      if (!next && !multiple) {
        if (inputSlot) clearComponentSearchAfterClose(); else internalSearch = '';
      }
    }
    if (resolvedDisabled) {
      internalOpen = false;
      // Source renders the disabled, still-focused suffix before clearing focus.
      untrack(() => resolvedSuffix);
      focused = false;
    }
  });
  let popupContainerGetter = $derived(getPopupContainer || config.getPopupContainer);
  const anchorWidthVariable = '--ant-native-select-anchor-width';
  let matchedWidth = $derived(popupMatchSelectWidth ?? config.popupMatchSelectWidth ?? true);
  let realVirtual = $derived(effectiveVirtual !== false && matchedWidth !== false);
  let itemHeight = $derived(listItemHeight ?? tokens.token.controlHeight);
  let listLabel = $derived(attributes['aria-label'] ?? placeholder ?? config.locale.searchText);
  let popupBaseLayers = $derived([
    componentTheme.style,
    `${matchedWidth === true ? 'width' : 'min-width'}:var(${anchorWidthVariable})`
  ]);
  let popupAfterLayers = $derived([
    typeof matchedWidth === 'number' ? [['width', `${matchedWidth}px`]] as const : undefined
  ]);
  let popupLayers = $derived([...popupBaseLayers, serializeSelectStyle(semantics.styles.popup.root), ...popupAfterLayers]);
  const popupStyle = createOverlayStyle(() => popupBaseLayers, anchorWidthVariable, () => expanded, {
    style: () => semantics.styles.popup.root, after: () => popupAfterLayers
  });
  const portal = createPopupContainer(() => ({
    open: expanded,
    rendered: popupPresent,
    reference,
    getPopupContainer: popupContainerGetter,
    themeStyle: serializeInlineStyleLayers(popupLayers),
    preserveVariables: [anchorWidthVariable]
  }));

  $effect(() => {
    if (!expanded || !list || !reference) {
      return;
    }

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
      get dismissOnEscape() { return untrack(() => !customPopup || Boolean(menuElement)); },
      autoAdjustOverflow: true,
      maxWidth: false,
      constrainWidth: false,
      allowOffscreenAnchor: true,
      preserveFocus: event => !isMenuIconEvent(event) && (!customPopup || event.composedPath().some(node =>
        node instanceof Element && (node.classList.contains(`${prefix}-dropdown-list`)
          || node.classList.contains(`${prefix}-item-empty`)))) && !event.composedPath().some(node =>
        node instanceof Element && node.classList.contains(`${prefix}-dropdown-list-scrollbar`)),
      anchorWidthVariable,
      getAnchorWidth: () => source.width,
      getPosition: (anchorRect, popupRect, viewport) => {
        optionList.prepare();
        return source.position(anchorRect, popupRect, viewport);
      },
      applyPosition: position => source.commitFrame(() => popupStyle.position(
        position,
        source.style
      )),
      onAlign: position => { popupPlacement = position.alignedPlacement; },
      onPlacement: () => {},
      onVisibilityChange: next => { shown = next; },
      onDismiss: () => rootSlot || inputSlot ? scheduleComponentClose() : setOpen(false)
    }));
    source.connect(disconnect.forceAlign);
    source.forceAlign();

    return () => {
      disconnect();
      source.destroy();
    };
  });

  $effect(() => {
    if (!control || !multiple) {
      return;
    }

    const input = control;
    input.setCustomValidity(
      attributes.required && !selectedValues.length
        ? config.locale.selectRequiredText ?? ruRU.selectRequiredText
        : ''
    );

    return () => input.setCustomValidity('');
  });

  $effect(() => {
    nativeElement = reference as typeof nativeElement;
    return () => { nativeElement = undefined; };
  });
  $effect(() => {
    inputElement = control as typeof inputElement;
    return () => { inputElement = undefined; };
  });

  let listItems = $derived<SelectOptionListItem<Row>[]>(filtered.map((option, index) => {
    const data = option.data;
    const selected = () => !option.group && option.value !== undefined
      && (multiple ? selectedKeys.has(option.value) : option.value === selectedRaw);
    return {
      key: option.key,
      originalIndex: index,
      item: option,
      group: option.group,
      ariaLabel: !option.group && typeof option.label === 'string' ? option.label : undefined,
      ariaValue: typeof data.value === 'string' || typeof data.value === 'number' ? data.value : undefined,
      ariaAttributes: selectDataAttributes(option, fields).aria as SelectOptionListItem<Row>['ariaAttributes'],
      // Коллекция Source кешируется закрытой; rawValues продолжает менять ARIA.
      get ariaSelected() { return selected(); },
      ariaDisabled: data.disabled as boolean | undefined,
      get disabled() { return isSelectOptionDisabled(data.disabled, selected(), countReached); }
    };
  }));
  const notifyActive = createSelectActive<RawValue>(
    () => {
      const callback = onActive as ((value: RawValue | null) => void) | undefined;
      return callback ? value => {
        if (!customPopup || menuElement?.isConnected) callback(value);
      } : undefined;
    }
  );
  let listVisited = false;
  let lastListLength = -1;
  let lastListSearch: string | undefined;
  let openingKeyboardActivation: { index: number } | undefined;

  // Source сохраняет OptionList после первого открытия; условный Native DOM не сбрасывает activation.
  $effect(() => {
    const visible = expanded;
    if (customPopup && !menuElement) {
      listVisited = false;
      return;
    }
    const rows = optionList.items;
    const query = search;
    if (!listVisited && !visible) {
      return;
    }
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
    open: () => expanded && (!customPopup || Boolean(menuElement)),
    searchValue: () => search,
    selectedIndex: (): number => openingKeyboardActivation?.index ?? (multiple || selectedRaw === undefined
      ? -1 : optionList.items.findIndex(row =>
        search ? String(row.item.data.value).startsWith(search)
          : row.item.data.value === selectedRaw)),
    onSelectedActive: index => activate(index)
  });

  function activate(index: number, keyboard = false) {
    if (customPopup && !menuElement) {
      return;
    }
    activeIndex = index;
    componentAccessibilityIndex = index;
    notifyActive(optionList.items[index]?.item.value ?? null);
    if (keyboard) optionList.scrollActive(index);
  }

  function enabledIndex(current: number, direction: 'next' | 'previous' | 'first' | 'last') {
    return getEnabledIndex(listItems, current, direction);
  }

  function registerRoot(registration: SelectRootRegistration<RootElement>) {
    const current = { registration };
    customRoot = current;
    return () => { if (customRoot === current) customRoot = undefined; };
  }
  const initializedComponentEditors = new WeakSet<HTMLElement>();
  function registerInput(registration: SelectInputRegistration<EditorElement>) {
    const editor = selectComponentInputElement(registration);
    const hydrating = editor && takeSelectComponentHydration(editor);
    if (editor && !initializedComponentEditors.has(editor)) {
      initializedComponentEditors.add(editor);
      if (!hydrating && editor instanceof HTMLTextAreaElement) {
        const initialValue = untrack(() => {
          const attrs = inputContext?.attributes;
          return attrs?.value ?? attrs?.defaultValue ?? attrs?.defaultvalue;
        });
        if (initialValue != null && editor.defaultValue !== String(initialValue))
          editor.defaultValue = String(initialValue);
        editor.setSelectionRange(0, 0);
      }
    }
    untrack(() => componentInputStyle.prepare(editor, componentInputStyleFrame(), hydrating));
    const current = { registration };
    customInput = current;
    return () => { if (customInput === current) customInput = undefined; };
  }
  function componentDOMAttributes(aria = true) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(nativeAttributes)) {
      if (['tabindex', 'maxlength', 'autofocus'].includes(key) || !aria && key.startsWith('aria-')) continue;
      result[key] = value;
    }
    if (Object.hasOwn(componentProps, 'name')) result.name = name;
    return result;
  }
  function componentFocus(event: FocusEvent) {
    focused = true;
    if (!resolvedDisabled) onFocus?.(event);
  }
  function componentBlur(event: FocusEvent) {
    if (componentDestroyed) {
      return;
    }
    focused = false;
    composing = false;
    pastedText = undefined;
    const state = committedBlurState;
    const disabled = state.componentInput ? componentInputBlurDisabled : state.disabled;
    if (state.tagMode) submitTag(state.search);
    else if (state.multiple) internalSearch = '';
    if (state.expanded && !disabled && !(event.relatedTarget instanceof Node && list?.contains(event.relatedTarget)))
      scheduleComponentClose(true);
    if (!state.componentInput || !disabled) field?.onBlur();
    if (!disabled) committedPublicBlur?.(event);
  }
  function componentPublicBlur(event: FocusEvent) {
    if (!componentDestroyed && !committedBlurState.disabled) committedPublicBlur?.(event);
  }
  let componentCloseTimer: ReturnType<typeof setTimeout> | undefined;
  let componentCloseChannel: MessageChannel | undefined;
  let componentDestroyed = false;
  let componentSearchTask = 0;
  function clearComponentSearchAfterClose() {
    const task = ++componentSearchTask;
    const registration = customInput;
    void tick().then(() => {
      if (componentDestroyed || task !== componentSearchTask || isOpen || customInput !== registration) {
        return;
      }
      internalSearch = '';
    });
  }
  function cancelComponentClose() {
    if (componentCloseTimer !== undefined) clearTimeout(componentCloseTimer);
    componentCloseTimer = undefined;
    componentCloseChannel?.port1.close();
    componentCloseChannel?.port2.close();
    componentCloseChannel = undefined;
  }
  onDestroy(() => {
    componentDestroyed = true;
    cancelComponentClose();
  });
  function scheduleComponentClose(fromBlur = false, useMessageChannel = false) {
    if (componentDestroyed) {
      return;
    }
    cancelComponentClose();
    const close = () => {
      if (!reference?.isConnected) {
        return;
      }
      const active = reference.ownerDocument.activeElement;
      if (fromBlur && active && (reference.contains(active) || list?.contains(active))) {
        return;
      }
      setOpen(false, fromBlur);
    };
    if (useMessageChannel) {
      const channel = new MessageChannel();
      componentCloseChannel = channel;
      channel.port1.onmessage = () => {
        // Даже устаревшая задача освобождает собственные порты.
        channel.port1.close();
        channel.port2.close();
        if (componentDestroyed || componentCloseChannel !== channel) {
          return;
        }
        componentCloseChannel = undefined;
        close();
      };
      channel.port2.postMessage(null);
    }
    else {
      componentCloseTimer = setTimeout(() => {
        componentCloseTimer = undefined;
        close();
      }, 0);
    }
  }
  const componentSpaceOpening = new WeakMap<KeyboardEvent, boolean>();
  function componentInputRootKeyboard(event: KeyboardEvent) {
    if (componentSpaceOpening.has(event)) {
      setOpen(true, false, componentSpaceOpening.get(event));
      componentSpaceOpening.delete(event);
    }
    onKeyDown?.(event);
  }
  function componentRootKeyboard(event: KeyboardEvent) {
    const wasOpen = expanded;
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === 'Enter' || !canSearch) event.preventDefault();
      if (!wasOpen) setOpen(true);
    }
    if (wasOpen && event.key !== ' ') handleKeyboardNavigation(event);
    else if (event.key === 'Backspace' && multiple && !search) {
      const last = [...tags].reverse().find(tag => !tag.disabled);
      if (last) remove(last.value, false);
    }
    onKeyDown?.(event);
  }
  function componentSelectorMouseDown(event: MouseEvent) {
    if (resolvedDisabled) {
      onMouseDown?.(event);
      return;
    }
    if (componentClearMouseDown.has(event)) {
      if (expanded && !multiple) scheduleComponentClose();
      onMouseDown?.(event);
      return;
    }
    const target = event.target;
    const onEditor = target === control || target instanceof Node && control?.contains(target);
    if (!onEditor) event.preventDefault();
    focusSelectComponent(customInput?.registration);
    if (!(expanded && (!multiple && canSearch || multiple && onEditor))) setOpen(!expanded);
    onMouseDown?.(event);
  }
  function ownComponentProps(slot: unknown): object | undefined {
    return slot && typeof slot === 'object' && 'props' in slot ? slot.props as object | undefined : undefined;
  }
  function componentRootContext() {
    void value;
    void providedOpen;
    void internalSearch;
    void focused;
    void expanded;
    void resolvedDisabled;
    void semantics;
    void resolvedSuffix;
    const own = ownComponentProps(rootSlot);
    const attrs: Record<string, unknown> = {};
    const generated = { ...componentDOMAttributes(),
      ...(rootTitle !== undefined ? { title: rootTitle } : {}),
      onfocusin: componentFocus, onfocusout: componentBlur, onkeydown: componentRootKeyboard,
      onkeyup: (event: KeyboardEvent) => onKeyUp?.(event),
      onclick: (event: MouseEvent) => {
        setOpen(!expanded);
        onClick?.(event);
      }
    };
    return {
      attributes: mergeSelectComponentAttributes(attrs, generated, own, 'root'),
      register: registerRoot
    };
  }
  function restoreComponentInput(input: HTMLInputElement) {
    const registration = customInput;
    void tick().then(() => {
      if (!input.isConnected || customInput !== registration) {
        return;
      }
      const value = committedInputAttributes.value;
      if (value != null && input.value !== String(value)) input.value = String(value);
    });
  }
  function componentInputRawStyle() {
    void componentInputWidth;
    const own = ownComponentProps(inputSlot);
    const rawStyle = own && Object.hasOwn(own, 'style')
      ? Reflect.get(own, 'style') as SelectStyle | undefined
      : mergeSelectStyle(semantics.styles.input,
        { '--select-input-width': componentInputStyle.width(componentInputLifetime()) });
    return rawStyle;
  }
  function componentInputStyleFrame() {
    return resolveSelectStyleFrame(componentInputRawStyle());
  }
  function componentInputStyleText() {
    const raw = componentInputRawStyle();
    return raw === null || typeof raw === 'string' ? raw : resolveSelectStyleFrame(raw).text;
  }
  function componentInputContext() {
    void internalSearch;
    void focused;
    void expanded;
    void semantics;
    void resolvedSuffix;
    const aria = Object.fromEntries(Object.entries(attributes).filter(([key]) => key.startsWith('aria-')));
    const styleText = componentInputStyleText();
    const generated = { id: controlId, type: 'text',
      ...(multiple ? { disabled: resolvedDisabled, readonly: !canSearch } : {}),
      ...aria, ...(!multiple ? { readonly: !canSearch } : {}),
      tabindex: attributes.tabindex, ...(!multiple ? { maxlength: undefined } : {}),
      style: styleText, autofocus: attributes.autofocus,
      autocomplete: attributes.autocomplete || 'new-password',
      class: [`${prefix}-input`, semantics.classes.input].filter(Boolean).join(' '), disabled: resolvedDisabled,
      value: componentInputValue,
      oninput: (event: Event) => {
        handleInput(event as Event & { currentTarget: HTMLInputElement });
        restoreComponentInput(event.currentTarget as HTMLInputElement);
      },
      onkeydown: (event: KeyboardEvent) => handleKeydown(event as KeyboardEvent & { currentTarget: HTMLInputElement }),
      onblur: () => {
        composing = false;
        pastedText = undefined;
      },
      onpaste: (event: ClipboardEvent) => handlePaste(event as ClipboardEvent & { currentTarget: HTMLInputElement }),
      oncompositionstart: (event: CompositionEvent) => handleCompositionStart(event as CompositionEvent & { currentTarget: HTMLInputElement }),
      oncompositionend: (event: CompositionEvent) => handleCompositionEnd(event as CompositionEvent & { currentTarget: HTMLInputElement }),
      role: 'combobox', 'aria-expanded': expanded, 'aria-haspopup': 'listbox',
      'aria-owns': expanded ? `${controlId}_list` : undefined, 'aria-autocomplete': 'list',
      'aria-controls': expanded ? `${controlId}_list` : undefined,
      'aria-activedescendant': expanded ? `${controlId}_list_${componentAccessibilityIndex}` : undefined
    };
    const own = ownComponentProps(inputSlot);
    const merged = mergeSelectComponentAttributes<Record<string, unknown>>({},
      typeof inputSlot === 'object' ? { placeholder, ...generated } : generated, own, 'input');
    // Keep merge/cloneElement key positions, but never pass a CSS object to a DOM spread.
    merged.style = styleText;
    return { attributes: merged, register: registerInput };
  }

  function setOpen(next: boolean, fromBlur = false, previousOpen?: boolean) {
    cancelComponentClose();
    if (next) componentSearchTask++;
    if (fromBlur) {
      const state = committedBlurState;
      if (next && state.disabled) {
        return;
      }
      internalOpen = next;
      open = next;
      if (state.expanded !== next) committedOpenChange?.(next);
      if (!next && state.clearInternalSearch) {
        if (state.componentInput) clearComponentSearchAfterClose(); else internalSearch = '';
      }
      if (!next && state.expanded !== next) state.clearSearch?.('');
      return;
    }
    if (next && resolvedDisabled) {
      return;
    }

    const notify = (previousOpen ?? expanded) !== next;
    const clearContextSearch = notify && !next && !multiple && Boolean(search)
      && (controlledSearch === undefined || showSearch == null && typeof config.select?.showSearch === 'object')
      ? searchCallback : undefined;
    const clearInternalSearch = !next && !tagMode && (!multiple || autoClearSearch);
    internalOpen = next;
    open = next;
    // DOM blur при удалении приходит до cleanup, когда owner props уже уничтожены.
    if (notify) (fromBlur ? committedOpenChange : onOpenChange)?.(next);
    // Принятый bind/callback сохраняет active, выбранный текущим keyboard event.
    if (!fromBlur && providedOpen === next) previousOwnerOpen = next;

    if (clearInternalSearch) {
      if (inputSlot) clearComponentSearchAfterClose(); else internalSearch = '';
    }
    clearContextSearch?.('');
  }

  export function focus(options?: FocusOptions) {
    if (customRoot) {
      if (arguments.length) focusSelectComponent(customRoot.registration, options);
      else focusSelectComponent(customRoot.registration);
    }
    else if (customInput) focusSelectComponent(customInput.registration, options);
    else defaultControl?.focus(options);
  }
  export function blur() {
    if (customRoot) blurSelectComponent(customRoot.registration);
    else if (customInput) blurSelectComponent(customInput.registration);
    else defaultControl?.blur();
  }
  export function scrollTo(config?: SelectScrollConfig | null) {
    if (customPopup && !menuElement) {
      return;
    }
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
    if (!multiple) {
      return;
    }
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
    callback?.(
      selectValueEvent(value, data, fields, Boolean(labelInValue)),
      copySelectData(data) as OptionType
    );
  }

  function submitTag(text: string) {
    const next = text.trim();
    if (!next || !tagMode || resolvedDisabled) {
      return;
    }
    const data = optionData(next);
    if (!countReached && !Reflect.get(data ?? {}, 'disabled')) {
      if (!selectedKeys.has(next)) changeMultiple([...selectedValues, next], 'raw');
      notifySelect(next, data, true);
    }
    internalSearch = '';
  }

  function clearSelection() {
    if (resolvedDisabled) {
      return;
    }
    const previousSearch = search;
    const blockedSearch = countReached;
    const preserveSearch = !multiple && controlledSearch !== undefined && Boolean(selected);
    onClear?.();
    if (rootSlot || inputSlot) focus(); else control?.focus({ preventScroll: true });
    if (multiple) {
      if (selectedValues.length) changeMultiple([], 'display');
    }
    else {
      const changed = selectedRaw !== undefined;
      useDefault = false;
      rememberLabels([]);
      value = undefined;
      if (changed) {
        (onValueChange as ((value: undefined) => void) | undefined)?.(undefined);
        (onChange as ((value: undefined, option: undefined) => void) | undefined)?.(
          undefined,
          undefined
        );
      }
    }
    if (!blockedSearch && !preserveSearch) {
      internalSearch = '';
      if (previousSearch) searchCallback?.('');
    }
    if (!multiple) setOpen(false);
  }

  const componentClearMouseDown = new WeakSet<MouseEvent>();
  function clearMouseDown(event: MouseEvent) {
    event.preventDefault();
    if (inputSlot) componentClearMouseDown.add(event);
  }

  function clearKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
  }

  function suffixMouseDown(event: MouseEvent) {
    if (resolvedDisabled) {
      return;
    }
    event.preventDefault();
    if (inputSlot) {
      return;
    }
    control?.focus({ preventScroll: true });
    if (!(expanded && !multiple && canSearch)) setOpen(!expanded);
  }

  function isMenuIconEvent(event: Event) {
    return event.composedPath().some(node => node instanceof Element
      && node.classList.contains(`${prefix}-item-option-state`));
  }
  function menuMouseDown(event: MouseEvent) {
    event.preventDefault();
  }


  function choose(option: Row | undefined) {
    if (resolvedDisabled || option && (option.group || option.value === undefined
      || isSelectOptionDisabled(option.data.disabled, selectedKeys.has(option.value), countReached))) {
      return;
    }
    const componentPath = Boolean(rootSlot || inputSlot);

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
      }
      else {
        if (!next.size && !clearQuery) {
          return;
        }
        onClear?.();
        next.clear();
      }

      if (option || selectedValues.length) changeMultiple([...next]);
      if (chosenValue !== undefined) notifySelect(chosenValue, data, !removing);
      if (!option || autoClearSearch) internalSearch = '';
      onClearSearch?.('');
      if (!componentPath) control?.focus();
      return;
    }

    const changed = chosenValue !== selectedRaw;
    const callback = onChange as
      ((value: unknown, option: OptionType | undefined) => void) | undefined;
    const rawOption = chosenValue === undefined ? undefined : copySelectData(data) as OptionType;
    if (!option && selected) onClear?.();
    useDefault = false;
    const labeled = convertSelectValues(
      chosenValue === undefined ? [] : [chosenValue],
      dataMaps,
      fields,
      optionLabelProp
    );
    const output = selectValueOutput(labeled, false, Boolean(labelInValue));
    const keepSupplied = !changed && keepSelectSuppliedValue(value, providedValue, chosenValue);
    if (!keepSupplied) {
      rememberLabels(labeled);
      value = output as typeof value;
    }
    (onValueChange as ((value: unknown) => void) | undefined)?.(keepSupplied ? value : output);
    if (changed) callback?.(output, rawOption);
    if (chosenValue !== undefined) notifySelect(chosenValue, data, true);
    internalSearch = '';
    // Keep the public producer's search-clear pass before the popup closes.
    if (componentPath) void semantics;
    void resolvedSuffix;
    if (componentPath) scheduleComponentClose(); else setOpen(false);
    if (!componentPath) control?.focus();
  }

  function remove(item: RawValue, focusEditor = true) {
    if (resolvedDisabled || selectionOptions.get(item)?.disabled) {
      return;
    }

    const next = new Set(selectedValues);
    const data = optionData(item);

    if (next.delete(item)) {
      changeMultiple([...next], 'display');
      notifySelect(item, data, false);
    }
    if (focusEditor) { if (rootSlot || inputSlot) focus(); else control?.focus(); }
  }

  function componentTagClose(item: { value: RawValue }) {
    const onClose = (event?: Event) => {
      if (event) event.stopPropagation();
      const data = optionData(item.value);
      // Source захватывает display-record, но при вызове читает текущие records.
      const remaining = displayValues.filter(current => current !== item);
      if (remaining.length !== displayValues.length) {
        changeMultiple(remaining.map(current => current.value), 'display');
      }
      // Даже stale/non-closable callback отправляет deselect с актуальной option.
      notifySelect(item.value, data, false);
    };
    return onClose;
  }

  function handleCustomTagMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Source useOpen откладывает false; legacy default tag path сохраняется.
    if (inputSlot && expanded) scheduleComponentClose(false, true);
    else setOpen(!expanded);
  }

  function connectTagElement(node: HTMLElement, value: RawValue) {
    tagElements.set(value, node);
    return () => {
      if (tagElements.get(value) === node) tagElements.delete(value);
    };
  }

  function handleReset(event: Event) {
    const input = control;

    if (!multiple || !input || event.target !== input.form) {
      return;
    }

    queueMicrotask(() => {
      if (event.defaultPrevented || !input.isConnected || input !== control || !multiple) {
        return;
      }

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
    const alreadyPrevented = inputSlot ? treeSelectNativeKeyCancelled(event, onkeydown)
      : (onkeydown?.(event), event.defaultPrevented);
    const closedTagSubmit = !alreadyPrevented && !event.isComposing && !composing
      && !resolvedDisabled && tagMode && providedOpen !== undefined && !expanded
      && event.key === 'Enter' && search !== '';
    // Preserve Native uncontrolled closed-Enter selection; controlled open uses
    // Original's input submit before the public key hook.
    if (closedTagSubmit) submitTag(search);
    const rawTextarea = inputSlot && customInput?.registration instanceof HTMLTextAreaElement;
    const preventArrow = !rawTextarea && expanded && (event.key === 'ArrowDown' || event.key === 'ArrowUp');
    if (preventArrow) event.preventDefault();
    onInputKeyDown?.(event);

    if (alreadyPrevented || resolvedDisabled || event.isComposing || composing) {
      return;
    }
    if (closedTagSubmit) {
      event.preventDefault();
      // Original submits at the input before its public hook; both input and
      // root then request opening when the controlled owner keeps it closed.
      openList();
      if (!event.cancelBubble) openList();
      return;
    }

    if (inputSlot && !expanded && canSearch && event.key === ' '
      && !event.ctrlKey && !event.altKey && !event.metaKey) {
      // Input and bubbling BaseSelect independently request opening from the
      // same closed event snapshot, before the browser inserts the space.
      componentSpaceOpening.set(event, false);
      setOpen(true, false, false);
      return;
    }

    if (inputSlot && rawTextarea && !expanded && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }
    // Source valid-open keys invalidate a weak close even when already open.
    // Preserve its legacy which filter and modifier exclusions.
    const keyCode = event.which;
    if (inputSlot && componentCloseChannel && expanded && keyCode
      && !event.ctrlKey && !event.altKey && !event.metaKey
      && ![27, 16, 8, 9, 224, 18, 91, 92, 17, 186, 187, 20, 93, 38, 37, 39].includes(keyCode)
      && !(keyCode >= 112 && keyCode <= 123)) {
      cancelComponentClose();
    }
    if (expanded && event.cancelBubble) {
      return;
    }
    handleKeyboardNavigation(event);
  }

  function handleKeyboardNavigation(event: KeyboardEvent) {
    if (expanded && customPopup && !menuElement && (['ArrowDown', 'ArrowUp', 'Home', 'End',
      'Enter', 'Escape', 'Tab'].includes(event.key) || event.key === ' ' && !canSearch)) {
      // BaseSelect сохраняет input-level prevention; отсутствующий OptionList
      // не выбирает value и не закрывает Escape. Tab завершает обычный blur.
      if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) || event.key === ' ' && !canSearch) {
        event.preventDefault();
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!(event.target instanceof HTMLTextAreaElement)) event.preventDefault();

      if (!expanded) {
        openList(event.key === 'ArrowUp' ? 'last' : 'first');
      }
      else {
        activate(enabledIndex(activeIndex, event.key === 'ArrowUp' ? 'previous' : 'next'), true);
      }
    }
    else if ((event.key === 'Home' || event.key === 'End') && expanded) {
      event.preventDefault();
      activate(enabledIndex(-1, event.key === 'Home'
        ? 'first'
        : 'last'), true);
    }
    else if (event.key === 'Enter' || (event.key === ' ' && !canSearch)) {
      event.preventDefault();

      if (!expanded) {
        openList();
        if (tagMode && event.key === 'Enter' && activeIndex >= 0) choose(filtered[activeIndex]);
      }
      else if (activeIndex >= 0) {
        choose(filtered[activeIndex]);
      }
    }
    else if (event.key === 'Escape' && expanded) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
    else if (event.key === 'Tab') {
      setOpen(false);
    }
    else if (multiple
      && event.key === 'Backspace'
      && !search
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey) {
      const last = [...tags].reverse().find((tag) => !tag.disabled);

      if (!rootSlot && !inputSlot) event.preventDefault();
      if (last) remove(last.value, !rootSlot && !inputSlot);
    }
    else if (!multiple
      && mergedAllowClear
      && !canSearch
      && (event.key === 'Backspace'
        || event.key === 'Delete')) {
      event.preventDefault();
      choose(undefined);
    }
    else if (!canSearch
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
    if (inputSlot) {
      restoreComponentInput(input);
      return;
    }
    if (controlledSearch === undefined) {
      return;
    }

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
    if (compositionEnd && next === search) {
      return;
    }

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
    const activated = mouseActivated && event.detail !== 0;
    mouseActivated = false;
    onclick?.(event);

    if (!event.defaultPrevented && !activated) {
      if (expanded && !canSearch) {
        setOpen(false);
      }
      else {
        openList();
      }
    }
  }

  function handleMouseDown(event: MouseEvent & { currentTarget: EventTarget & HTMLInputElement; }) {
    mouseActivated = false;
    onmousedown?.call(event.currentTarget, event);
    if (event.defaultPrevented || resolvedDisabled) {
      return;
    }
    mouseActivated = true;
    if (rootSlot || inputSlot) focus(); else control?.focus();
    if (!expanded) openList();
    else if (!multiple && !canSearch) setOpen(false);
  }

  function handleBlur(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement; }) {
    focused = false;
    composing = false;
    pastedText = undefined;
    const next = event.relatedTarget;
    const state = committedBlurState;

    if (!(next instanceof Node && list?.contains(next))) {
      if (state.tagMode) submitTag(state.search);
      else if (state.multiple) internalSearch = '';
      setOpen(false, true);
    }
    field?.onBlur();
    committedBlur?.(event);
  }

  function handleListFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;

    if (next instanceof Node && ((rootSlot ? reference : container)?.contains(next) || list?.contains(next))) {
      return;
    }

    focused = false;
    const state = committedBlurState;
    if (state.tagMode) submitTag(state.search);
    else if (state.multiple) internalSearch = '';
    setOpen(false, true);
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
    if (renderTag && target instanceof Element && target.closest('[data-select-custom-tag]')) {
      return;
    }
    if (event.composedPath().some(node => node instanceof Element
      && node.classList.contains(`${prefix}-suffix`) && node.parentElement === event.currentTarget)) {
      return;
    }

    if (multiple
      && target instanceof Element
      && !target.closest('button, input')
      && !resolvedDisabled) {
      event.preventDefault();
      if (rootSlot || inputSlot) focus(); else control?.focus();
      openList();
    }
    else if ((target === event.currentTarget || leading && event.composedPath().some(node =>
      node instanceof Element && node.classList.contains(`${prefix}-prefix`)
        && node.parentElement === event.currentTarget)) && !resolvedDisabled) {
      event.preventDefault();
      if (rootSlot || inputSlot) focus(); else control?.focus();
      control?.click();
    }
  }
</script>

<style>
  .container { position: relative; min-width: 0; width: 100%; }
  /* Inline-flex Source root использует text strut родителя, а не token font wrapper. */
  .container:has(> [data-ant-select-multiple] > [data-ant-select-content] > div[class*="-content-item-suffix"]) {
    font-family: inherit; font-size: inherit;
  }
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
  [data-ant-select-control] [data-ant-select-input][data-ant-select-semantic-color] { color: var(--ant-native-select-color, var(--ant-color-text)); }
  [data-ant-select-content]:has(> [data-ant-select-placeholder]) [data-ant-select-input]::placeholder { color: transparent; }
  [data-ant-select-placeholder] { position: absolute; inset-inline-start: 0; }
  [data-ant-select-control][data-ant-select-single] [data-ant-select-content][data-select-value-layer] [data-ant-select-input] { position: absolute; inset: 0; }
  [data-ant-select-content][data-select-value-layer]:not([data-select-value-search]) [data-ant-select-input] { -webkit-text-fill-color: transparent; }
  [data-ant-select-content][data-select-value-search] [data-ant-select-input] { color: var(--ant-native-select-color, var(--ant-color-text)); -webkit-text-fill-color: currentColor; }
  [data-ant-select-content][data-select-value-layer] { display: block; }
  [data-ant-select-content][data-select-value-layer][data-select-value-has-content]::before { display: none; }
  [data-ant-select-content][data-select-value-search] > [data-ant-select-value] { opacity: 0; }
  .intrinsic-width { width: auto; }
  .intrinsic-width [data-ant-select-content] { position: relative; }
  .intrinsic-width [data-ant-select-control][data-ant-select-single] [data-ant-select-input] { position: absolute; inset: 0; }
  .intrinsic-label { visibility: hidden; white-space: pre; }
  .suffix { display: block; flex: none; color: var(--ant-color-text-quaternary); }
  .clear { display: flex; padding: 0; margin-inline-end: 4px; border: 0; background: none; color: var(--ant-color-text-tertiary); cursor: pointer; }
  .clear:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: 2px; }
  .popup[data-ant-select-dropdown] { top: calc(100% + 4px); inset-inline: 0; max-height: none; overflow: visible; }
  /* Исходный virtual-list размещает options в flex column без сжатия строк. */
  .popup[data-ant-select-source-popup] { display: flex; flex-direction: column; }
  .popup[data-ant-select-custom-popup]:not([hidden]) { display: block; }
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
  /* Source suffix wrapper имеет собственный отступ до пустого input. */
  [data-ant-select-content][data-select-source-empty-input]::before { flex: none; width: var(--ant-native-select-empty-input-gap); }
  [data-ant-select-content][data-select-source-empty-input] > [data-ant-select-placeholder] { inset-inline-start: var(--ant-native-select-empty-input-gap); }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-input] { flex: 1 1 60px; width: 60px; min-width: 40px; max-width: 100%; }
  [data-ant-select-control][data-ant-select-source-theme][data-ant-select-multiple] [data-ant-select-input] { flex: none; width: 4px; min-width: 4px; }
  [data-ant-select-control][data-ant-select-responsive-tags] [data-ant-select-input] { flex: none; width: 4px; min-width: 4px; }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-input][data-ant-select-semantic-color] { flex: none; width: calc(var(--select-input-width, 0) * 1px); min-width: 4px; }
  .measure-tag { position: absolute; inset-block-start: 0; inset-inline-start: 0; visibility: hidden; pointer-events: none; }
  .custom-tag { display: inline-flex; flex: none; min-width: 0; max-width: 100%; }
  [data-ant-select-control][data-ant-select-source-theme][data-ant-select-multiple] [data-ant-select-input] { line-height: calc(var(--ant-select-internal_fixed_item_margin) * 2 + var(--ant-native-select-multi-item-height)); }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-selection-item] { flex: none; box-sizing: border-box; max-width: calc(100% - var(--ant-select-internal_fixed_item_margin) * 2); min-width: 0; }
  [data-ant-select-control][data-ant-select-source-theme][data-ant-select-multiple] [data-ant-select-selection-item] { max-width: calc(100% - 4px - var(--ant-select-internal_fixed_item_margin) * 2); }
  [data-ant-select-selection-item-remove] { padding: 0; border: 0; background: transparent; font-family: inherit; }
  [data-ant-select-selection-item-remove]:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: 1px; }
  [data-ant-select-selection-item-disabled] { color: var(--ant-select-multiple-item-color-disabled); }
  [data-ant-select-source-theme] [data-ant-select-selection-item-disabled] { color: inherit; }
  [data-ant-select-component-popup][hidden] { pointer-events: none; }
  [data-ant-select-component-popup][hidden] [data-ant-select-item] { width: auto; }

  [data-ant-select-control][data-ant-select-multiple]:has(> [data-ant-select-content] > div[class*="-content-item-suffix"]) { display: inline-flex; min-height: initial; }
  /* Only the new Overflow wrapper structure opts out of legacy flat tag CSS.
     Source: select/style/index.ts and select-input-multiple.ts:53-90. */
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-content]:has(> div[class*="-content-item-suffix"]) { gap: normal; }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-content] > div[class*="-content-item"] > [data-ant-select-selection-item] { flex: 1; max-width: none; }
  [data-ant-select-control][data-ant-select-multiple] [data-ant-select-content] > div[class*="-content-item-prefix"] > [data-ant-select-placeholder] { inset-inline-start: var(--ant-native-select-empty-input-gap); }
  [data-ant-select-control][data-ant-select-multiple] [class*="-prefix"] + [data-ant-select-content] > div[class*="-content-item-prefix"] > [data-ant-select-placeholder] { inset-inline-start: 0; }
  .container[data-ant-select-compact-item] > [data-ant-select-control] { border-radius: inherit; }
  @media (hover: none) {
    [data-ant-select-source-theme]:has(.clear) .suffix { opacity: 0; }
  }
</style>

  {#snippet originMenu()}
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
        {@const initialRowStyle = untrack(() => serializeSelectStyle(mergeSelectStyle(semantics.styles.popup.listItem, data.style)))}
        {@const menuIcon = resolveSelectMenuIcon(menuItemSelectedIcon, config.select?.menuItemSelectedIcon,
          multiple ? checkIcon : null,
          { value: option.value as (Mode extends 'tags' ? Value | string : Value) | undefined,
            disabled: rowDisabled, isSelected: rowSelected })}
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
              semantics.classes.popup.listItem,
              option.groupOption && `${prefix}-item-option-grouped`,
              index === activeIndex && !rowDisabled && `${prefix}-item-option-active`,
              rowDisabled && `${prefix}-item-option-disabled`,
              rowSelected && `${prefix}-item-option-selected`
            ]}
          title={nativeTitle(selectDataTitle(option))}
          style={initialRowStyle}
          {...selectStyleAttributes(mergeSelectStyle(semantics.styles.popup.listItem, data.style))} {@attach selectStyle(() => mergeSelectStyle(semantics.styles.popup.listItem, data.style))}
          onpointerdown={event => {
              const handler = presentation.physical.onpointerdown;
              if (typeof handler === 'function') handler(event);
              if (typeof presentation.physical.onmousedown !== 'function' && !isMenuIconEvent(event)) event.preventDefault();
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
          <span class={`${prefix}-item-option-content`}>{#if renderOption}{@render renderOption(getRenderOption(option), { index })}{:else}<RenderContent value={content as RenderEmptyContent} />{/if}</span>{#if menuIcon.visible}<span {...{ class: `${prefix}-item-option-state`, unselectable: 'on', 'aria-hidden': 'true', style: 'user-select: none;', onmousedown: menuMouseDown }}>{#if menuIcon.fallback}<span class={`${prefix}-item-option-state-icon`}><RenderContent value={menuIcon.content} /></span>{:else}<RenderContent value={menuIcon.content} />{/if}</span>{/if}
        </button>
        {/if}
      {/snippet}
      {#if optionList.items.length}
        <SelectOptionList model={optionList} renderItem={optionRow}
          bind:listElement={menuElement}
          class={semantics.classes.popup.list} style={semantics.styles.popup.list}
          id={`${controlId}_list`}
          prefixCls={prefix} direction={config.direction} {showScrollBar} {activeIndex}
          ariaLabel={listLabel} {multiple} busy={loading}
          onScroll={onPopupScroll} />
      {:else}
        <div bind:this={menuElement} class={`${prefix}-item-empty`} id={`${controlId}_list`} role="listbox"
          aria-label={listLabel} aria-multiselectable={multiple || undefined} aria-busy={loading || undefined}>{#snippet nativeEmpty()}{loading
              ? (config.locale.spin ?? ruRU.spin!).loadingText
              : config.locale.emptyText}{/snippet}<RenderEmpty componentName="Select"
              local={notFoundContent} fallback={nativeEmpty} /></div>
      {/if}
  {/snippet}

<svelte:document onreset={handleReset} />

{#snippet downIcon()}<SelectIcon name="down" />{/snippet}
{#snippet searchIcon()}<SelectIcon name="search" />{/snippet}
{#snippet spinnerIcon()}<SelectIcon name="loading" />{/snippet}
{#snippet checkIcon()}<SelectIcon name="check" />{/snippet}
{#snippet removeGlyph()}<SelectIcon name="close" />{/snippet}
{#snippet clearGlyph()}<SelectIcon name="close-circle" />{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`select-prefix:${prefix}:${rootPrefix}`} />{/if}
{#if rootSlot && rootContext}
  <SelectComponent component={rootSlot} context={rootContext} root />
  {@render componentPopup()}
{:else}<div data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
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
  ]} bind:this={container} style={[componentTheme.style, typeof style === 'string' ? style : undefined].filter(Boolean).join(';') || undefined}>
  <div
    {...(inputSlot ? componentDOMAttributes(false) : {})}
    {...selectComponentHydrationAttributes(Boolean(inputSlot))}
    onfocusin={inputSlot || onFocus ? componentFocus : undefined}
    onfocusout={inputSlot ? componentBlur : onBlur ? componentPublicBlur : undefined}
    onkeydown={inputSlot ? componentInputRootKeyboard : onKeyDown ? event => onKeyDown?.(event) : undefined}
    onkeyup={onKeyUp ? event => onKeyUp?.(event) : undefined}
    bind:this={defaultReference}
    data-ant-select-control data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
    data-ant-select-source-theme={Boolean(componentTheme.className) || undefined}
    data-ant-select-single={!multiple || undefined} data-ant-select-multiple={multiple || undefined}
    data-ant-select-responsive-tags={responsiveTags || undefined}
    {...{ loadingIcon: selectIconAttribute(loadingIcon) }}
    title={rootTitle}
    role="presentation"
    onpointerdown={inputSlot ? undefined : handlePointerDown}
    onmousedown={inputSlot ? componentSelectorMouseDown : undefined}
    onclick={onClick ? event => onClick?.(event) : undefined}
    class={[
        `${prefix} ant-select-css-var`,
        `${prefix}-${appearance}`,
        resolvedSuffix.hasSuffix && `${prefix}-show-arrow`,
        feedback.hasFeedback && `${prefix}-has-feedback`,
        feedback.isFormItemInput && `${prefix}-in-form-item`,
        componentTheme.className && `${prefix}-source-theme`,
        componentTheme.className && canSearch && `${prefix}-show-search`,
        componentTheme.className && showClear && `${prefix}-allow-clear`,
        componentTheme.className && config.direction === 'rtl' && `${prefix}-rtl`,
        loading && `${prefix}-loading`,
        multiple ? `${prefix}-multiple` : `${prefix}-single`,
        responsiveTags && `${prefix}-responsive-tags`,
        expanded && `${prefix}-open`,
        (customPopup || semantics.sourceControlColors ? focused : expanded || componentTheme.className && focused) && `${prefix}-focused`,
        resolvedDisabled && `${prefix}-disabled`,
        resolvedSize === 'large' && `${prefix}-lg`,
        resolvedSize === 'small' && `${prefix}-sm`,
        resolvedStatus && `${prefix}-status-${resolvedStatus}`,
        config.select?.class, semantics.classes.root, rootClassName
      ]}
    style={initialRootStyle} {...selectStyleAttributes(semantics.styles.root)} {@attach rootStyle.attach}
  >
    {#if leading}{@const initialPrefixStyle = untrack(() => serializeSelectStyle(semantics.styles.prefix))}<div class={[`${prefix}-prefix`, semantics.classes.prefix]} style={initialPrefixStyle} {...selectStyleAttributes(semantics.styles.prefix)} {@attach selectStyle(() => semantics.styles.prefix)}><RenderContent value={leading} /></div>{/if}{#if inputSlot && inputContext && !multiple}
      <div class={[`${prefix}-content`, selected && selectedHasValue && `${prefix}-content-has-value`, canSearch && search && `${prefix}-content-has-search-value`, hasSelectedStyle && `${prefix}-content-has-option-style`, semantics.classes.content]}
        style={initialContentStyle} {...selectStyleAttributes(semantics.styles.content)} {@attach selectStyle(() => semantics.styles.content)} title={hasSelectedStyle ? undefined : selectedTitle}>
        {#if selected}{#if hasSelectedStyle}<div class={[`${prefix}-content-value`, selectedClass]} style={serializeSelectStyle(mergeSelectStyle(search ? { visibility: 'hidden' } : undefined, selectedStyle))} title={selectedTitle}><RenderContent value={selected.label as RenderEmptyContent} /></div>
          {:else}<RenderContent value={selected.label as RenderEmptyContent} />{/if}
        {:else}<div class={`${prefix}-placeholder`} style={search ? 'visibility:hidden' : undefined}>{placeholder ?? ''}</div>{/if}<SelectComponent component={inputSlot} context={inputContext} />
      </div>
    {:else if inputSlot && inputContext && multiple}{@const multipleInputValue = componentInputValue}<div data-ant-select-content class={[`${prefix}-content`, semantics.classes.content]}
        style={initialContentStyle} {...selectStyleAttributes(semantics.styles.content)}
        {@attach selectStyle(() => semantics.styles.content)} bind:this={contentElement}>{#if !selectedValues.length && !multipleInputValue}{@const initialPlaceholderStyle = untrack(() => serializeSelectStyle(semantics.styles.placeholder))}<div class={[`${prefix}-content-item`, `${prefix}-content-item-prefix`]}
            style:opacity={1} style:order={responsiveTags ? -1 : undefined}><div data-ant-select-placeholder class={[`${prefix}-placeholder`, semantics.classes.placeholder]}
              style={initialPlaceholderStyle} {...selectStyleAttributes(semantics.styles.placeholder)}
              {@attach selectStyle(() => semantics.styles.placeholder)} aria-hidden="true">{placeholder ?? ''}</div></div>{/if}{#each renderedTags as tag, index (tag.value)}{@const hidden = responsiveTags && !visibleTagKeys.has(tag.value)}{@const initialTagStyle = untrack(() => !renderTag ? serializeSelectStyle(semantics.styles.item) : undefined)}<div class={`${prefix}-content-item`}
            style:opacity={hidden ? 0 : 1} style:height={hidden ? 0 : undefined}
            style:overflow-y={hidden ? 'hidden' : undefined} style:order={responsiveTags ? index : undefined}
            style:pointer-events={hidden ? 'none' : undefined} style:position={hidden ? 'absolute' : undefined}
            data-select-tag={responsiveTags || undefined} aria-hidden={hidden || undefined} inert={hidden}>{#snippet componentTagLabel()}<RenderContent value={getSelectTagText(tag.label, maxTagTextLength) as RenderEmptyContent} />{/snippet}<span data-ant-select-selection-item={!renderTag || undefined}
              data-ant-select-selection-item-disabled={!renderTag && (resolvedDisabled || tag.disabled) || undefined}
              class={!renderTag ? [`${prefix}-selection-item`, semantics.classes.item,
                (resolvedDisabled || tag.disabled) && `${prefix}-selection-item-disabled`] : undefined}
              style={initialTagStyle} {...selectStyleAttributes(!renderTag ? semantics.styles.item : undefined)}
              {@attach selectStyle(() => !renderTag ? semantics.styles.item : undefined)}
              title={renderTag ? undefined : selectValueTitle(tag)}
              data-select-custom-tag={renderTag ? '' : undefined}
              role="presentation" onmousedown={renderTag ? handleCustomTagMouseDown : undefined}
              {@attach node => connectTagElement(node, tag.value)}>{#if renderTag}{@render renderTag({
                  label: componentTagLabel, value: tag.value, index, disabled: tag.disabled,
                  closable: !resolvedDisabled && !tag.disabled,
                  onClose: componentTagClose(tag), isMaxTag: false
                })}{:else}{@const initialItemContentStyle = untrack(() => serializeSelectStyle(semantics.styles.itemContent))}<span class={[`${prefix}-selection-item-content`, semantics.classes.itemContent]}
                  style={initialItemContentStyle} {...selectStyleAttributes(semantics.styles.itemContent)}
                  {@attach selectStyle(() => semantics.styles.itemContent)}>{@render componentTagLabel()}</span>{#if !resolvedDisabled && !tag.disabled}{@const initialRemoveStyle = untrack(() => serializeSelectStyle(semantics.styles.itemRemove))}{@const tagIcon = resolveSelectRemoveIcon(removeIcon, config.select?.removeIcon, removeGlyph)}<button type="button" data-ant-select-selection-item-remove
                    class={[`${prefix}-selection-item-remove`, semantics.classes.itemRemove]}
                    style={initialRemoveStyle} {...selectStyleAttributes(semantics.styles.itemRemove)}
                    {@attach selectStyle(() => semantics.styles.itemRemove)}
                    aria-label={`${config.locale.removeText ?? ruRU.removeText} ${selectValueText(tag.label) || tag.value}`}
                    onmousedown={event => { event.preventDefault(); event.stopPropagation(); }}
                    onclick={event => { event.stopPropagation(); remove(tag.value, false); }}>{#if tagIcon.fallback}<span class={[`${prefix}-selection-item-remove`, semantics.classes.itemRemove].filter(Boolean).join(' ').split(/\s+/).map(name => name + '-icon').join(' ')}><RenderContent value={tagIcon.content} /></span>{:else}<RenderContent value={tagIcon.content} />{/if}</button>{/if}{/if}</span></div>{/each}{#if tagOverflow.omitted.length || responsiveTags && tags.length}{@const hidden = componentResponsive
            ? !componentOverflow?.restReady || !tagOverflow.omitted.length : responsiveTags && !tagOverflow.omitted.length}{@const initialRestStyle = untrack(() => !renderTag ? serializeSelectStyle(semantics.styles.item) : undefined)}<div class={[`${prefix}-content-item`, `${prefix}-content-item-rest`]}
            style:opacity={hidden ? 0 : 1} style:height={hidden ? 0 : undefined}
            style:overflow-y={hidden ? 'hidden' : undefined}
            style:order={responsiveTags ? hidden ? Number.MAX_SAFE_INTEGER
              : (componentOverflow?.omittedStart ?? tagOverflow.visible.length) - 1 : undefined}
            style:pointer-events={hidden ? 'none' : undefined} style:position={hidden ? 'absolute' : undefined}
            data-select-rest={responsiveTags || undefined} aria-hidden={hidden || undefined} inert={hidden}>{#snippet componentRestLabel()}{#if typeof tagPlaceholder === 'function'}{@render tagPlaceholder(tagOverflow.omitted)}{:else if tagPlaceholder == null}+ {tagOverflow.omitted.length} ...{:else if typeof tagPlaceholder !== 'boolean'}{tagPlaceholder}{/if}{/snippet}<span data-ant-select-selection-item={!renderTag || undefined}
              title={renderTag ? undefined : tagPlaceholderTitle}
              class={!renderTag ? [`${prefix}-selection-item`, semantics.classes.item] : undefined}
              style={initialRestStyle} {...selectStyleAttributes(!renderTag ? semantics.styles.item : undefined)}
              {@attach selectStyle(() => !renderTag ? semantics.styles.item : undefined)}
              data-select-custom-tag={renderTag ? '' : undefined}
              role="presentation" onmousedown={renderTag ? handleCustomTagMouseDown : undefined}>{#if renderTag}{@render renderTag({ label: componentRestLabel, value: undefined, index: undefined,
                disabled: false, closable: false, onClose: undefined, isMaxTag: true })}{:else}{@const initialRestContentStyle = untrack(() => serializeSelectStyle(semantics.styles.itemContent))}<span class={[`${prefix}-selection-item-content`, semantics.classes.itemContent]}
                  style={initialRestContentStyle} {...selectStyleAttributes(semantics.styles.itemContent)}
                  {@attach selectStyle(() => semantics.styles.itemContent)}>{@render componentRestLabel()}</span>{/if}</span></div>{/if}<div class={[`${prefix}-content-item`, `${prefix}-content-item-suffix`]}
          bind:this={componentInputSuffix} style:opacity={1}
          style:order={responsiveTags ? (componentOverflow?.omittedStart ?? 1) - 1 : undefined}><SelectComponent component={inputSlot} context={inputContext} /></div></div>{:else}<div data-ant-select-content
      data-select-source-empty-input={multiple && !selectedValues.length && !leading && semantics.sourceControlColors || undefined}
      data-select-value-layer={selectedLayer || undefined}
      data-select-value-has-content={selectedHasValue || undefined}
      data-select-value-search={!multiple && expanded && canSearch && Boolean(search) || undefined}
      class={[`${prefix}-content`, selectedLayer && selectedHasValue && `${prefix}-content-has-value`,
        selectedLayer && hasSelectedStyle && `${prefix}-content-has-option-style`,
        !multiple && expanded && canSearch && Boolean(search) && `${prefix}-content-has-search-value`, semantics.classes.content]}
      style={initialContentStyle} {...selectStyleAttributes(semantics.styles.content)} {@attach selectStyle(() => semantics.styles.content)}
      title={hasSelectedStyle ? undefined : selectedTitle}
      bind:this={contentElement}>{#if intrinsicWidth && !selectedLayer}<span class="intrinsic-label" aria-hidden="true">{#if selected}<RenderContent value={selected.label as RenderEmptyContent} />{:else}{placeholder ?? ''}{/if}</span>{/if}{#if !selected && !selectedValues.length && (!multiple || !search)}{@const initialPlaceholderStyle = untrack(() => serializeSelectStyle(mergeSelectStyle(search ? { visibility: 'hidden' } : undefined, semantics.styles.placeholder)))}<div data-ant-select-placeholder class={[`${prefix}-placeholder`, semantics.classes.placeholder]} style={initialPlaceholderStyle} {...selectStyleAttributes(mergeSelectStyle(search ? { visibility: 'hidden' } : undefined, semantics.styles.placeholder))} {@attach selectStyle(() => mergeSelectStyle(search ? { visibility: 'hidden' } : undefined, semantics.styles.placeholder))} aria-hidden="true">{placeholder ?? ''}</div>{/if}{#if selectedLayer && selected}
        {@const initialSelectedStyle = untrack(() => serializeSelectStyle(mergeSelectStyle(
          hasSelectedStyle && expanded && canSearch && search ? { visibility: 'hidden' } : undefined, selectedStyle)))}
        <div data-ant-select-value class={[hasSelectedStyle && `${prefix}-content-value`, selectedClass]}
          style={initialSelectedStyle}
          {...selectStyleAttributes(mergeSelectStyle(
            hasSelectedStyle && expanded && canSearch && search ? { visibility: 'hidden' } : undefined, selectedStyle))} {@attach selectStyle(() => mergeSelectStyle(
            hasSelectedStyle && expanded && canSearch && search ? { visibility: 'hidden' } : undefined, selectedStyle))} title={hasSelectedStyle ? selectedTitle : undefined}>
          <RenderContent value={selected.label as RenderEmptyContent} />
        </div>{/if}{#if multiple}
        {#each renderedTags as tag, index (tag.value)}
          {@const hidden = responsiveTags && !visibleTagKeys.has(tag.value)}
          {@const initialTagStyle = untrack(() => !renderTag ? serializeSelectStyle(semantics.styles.item) : undefined)}
          {#snippet tagLabel()}<RenderContent value={getSelectTagText(tag.label, maxTagTextLength) as RenderEmptyContent} />{/snippet}
          <span data-ant-select-selection-item={!renderTag || undefined}
            data-ant-select-selection-item-disabled={!renderTag && (resolvedDisabled || tag.disabled) || undefined}
            class={[
              renderTag ? 'custom-tag' : `${prefix}-selection-item`,
              hidden && 'measure-tag',
              !renderTag && semantics.classes.item,
              !renderTag && (resolvedDisabled || tag.disabled) && `${prefix}-selection-item-disabled`
            ]} style={initialTagStyle}
            {...selectStyleAttributes(!renderTag ? semantics.styles.item : undefined)} {@attach selectStyle(() => !renderTag ? semantics.styles.item : undefined)}
            title={renderTag ? undefined : selectValueTitle(tag)} data-select-tag={responsiveTags || undefined}
            data-select-custom-tag={renderTag ? '' : undefined}
            role="presentation" onmousedown={renderTag ? handleCustomTagMouseDown : undefined}
            aria-hidden={hidden || undefined} inert={hidden}
            {@attach node => connectTagElement(node, tag.value)}>
            {#if renderTag}
              {@render renderTag({
                label: tagLabel, value: tag.value, index, disabled: tag.disabled,
                closable: !resolvedDisabled && !tag.disabled,
                onClose: event => {
                  event?.stopPropagation();
                  remove(tag.value, false);
                }, isMaxTag: false
              })}
            {:else}
              {@const initialItemContentStyle = untrack(() => serializeSelectStyle(semantics.styles.itemContent))}
              <span class={[`${prefix}-selection-item-content`, semantics.classes.itemContent]} style={initialItemContentStyle} {...selectStyleAttributes(semantics.styles.itemContent)} {@attach selectStyle(() => semantics.styles.itemContent)}>{@render tagLabel()}</span>{#if !resolvedDisabled && !tag.disabled}{@const initialRemoveStyle = untrack(() => serializeSelectStyle(semantics.styles.itemRemove))}{@const tagIcon = resolveSelectRemoveIcon(removeIcon, config.select?.removeIcon, removeGlyph)}<button type="button" data-ant-select-selection-item-remove class={[`${prefix}-selection-item-remove`, semantics.classes.itemRemove]} style={initialRemoveStyle} {...selectStyleAttributes(semantics.styles.itemRemove)} {@attach selectStyle(() => semantics.styles.itemRemove)} aria-label={`${config.locale.removeText
                ?? ruRU.removeText} ${selectValueText(tag.label) || tag.value}`} onmousedown={(event) => event.preventDefault()} onclick={() => remove(tag.value)}>{#if tagIcon.fallback}<span class={[`${prefix}-selection-item-remove`, semantics.classes.itemRemove].filter(Boolean).join(' ').split(/\s+/).map(name => name + '-icon').join(' ')}><RenderContent value={tagIcon.content} /></span>{:else}<RenderContent value={tagIcon.content} />{/if}</button>{/if}
            {/if}
          </span>{/each}{#if tagOverflow.omitted.length || responsiveTags && tags.length}
          {@const initialRestStyle = untrack(() => !renderTag ? serializeSelectStyle(semantics.styles.item) : undefined)}
          {#snippet restLabel()}
            {#if typeof tagPlaceholder === 'function'}{@render tagPlaceholder(tagOverflow.omitted)}
            {:else if tagPlaceholder == null}+ {tagOverflow.omitted.length} ...
            {:else if typeof tagPlaceholder !== 'boolean'}{tagPlaceholder}{/if}
          {/snippet}
          <span data-ant-select-selection-item={!renderTag || undefined}
            class={[`${prefix}-selection-overflow-item-rest`,
              renderTag ? 'custom-tag' : `${prefix}-selection-item`,
              !renderTag && semantics.classes.item,
              !tagOverflow.omitted.length && 'measure-tag']}
            style={initialRestStyle}
            {...selectStyleAttributes(!renderTag ? semantics.styles.item : undefined)} {@attach selectStyle(() => !renderTag ? semantics.styles.item : undefined)}
            title={renderTag ? undefined : tagPlaceholderTitle}
            data-select-rest={responsiveTags || undefined}
            data-select-custom-tag={renderTag ? '' : undefined}
            role="presentation" onmousedown={renderTag ? handleCustomTagMouseDown : undefined}
            aria-hidden={!tagOverflow.omitted.length || undefined} inert={!tagOverflow.omitted.length}>
            {#if renderTag}{@render renderTag({
              label: restLabel, value: undefined, index: undefined,
              disabled: false, closable: false, onClose: undefined, isMaxTag: true
            })}{:else}{@const initialRestContentStyle = untrack(() => serializeSelectStyle(semantics.styles.itemContent))}<span class={[`${prefix}-selection-item-content`, semantics.classes.itemContent]} style={initialRestContentStyle} {...selectStyleAttributes(semantics.styles.itemContent)} {@attach selectStyle(() => semantics.styles.itemContent)}>{@render restLabel()}</span>{/if}
          </span>{/if}{/if}{#if inputSlot && inputContext}<SelectComponent component={inputSlot} context={inputContext} />{:else}<input
        {...nativeAttributes}
        bind:this={defaultControl}
        id={controlId}
        data-ant-select-input class={[`${prefix}-input`, semantics.classes.input]}
        data-ant-select-semantic-color={semantics.sourceControlColors || undefined}
        style={initialInputStyle} {...selectStyleAttributes(semantics.styles.input)} {@attach attachInputStyle}
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-busy={loading || undefined}
        aria-controls={expanded && (!customPopup || menuElement) ? `${controlId}_list` : undefined}
        aria-activedescendant={expanded && (!customPopup || menuElement) && activeIndex >= 0
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
        onmousedown={handleMouseDown}
        onclick={handleClick}
        onblur={handleBlur}
        onfocus={handleFocus}
      />{/if}
    </div>{/if}{#if resolvedSuffix.visible}<span class={['suffix', `${prefix}-suffix`, loading && `${prefix}-suffix-loading`, semantics.classes.suffix]} style={initialSuffixStyle} {...selectStyleAttributes(semantics.styles.suffix)} {@attach selectStyle(() => semantics.styles.suffix)} {...{ onmousedown: suffixMouseDown }}><RenderContent value={resolvedSuffix.content} />{#if resolvedSuffix.appendFeedback && feedback.icon}<FormFeedbackIcon descriptor={feedback.icon} />{/if}</span>{/if}{#if showClear}{@const initialClearStyle = untrack(() => serializeSelectStyle(semantics.styles.clear))}<button type="button" class={['clear', componentTheme.className && `${prefix}-clear`, semantics.classes.clear]} style={initialClearStyle} {...selectStyleAttributes(semantics.styles.clear)} {@attach selectStyle(() => semantics.styles.clear)} aria-label={clearIcon.label} onmousedown={clearMouseDown} onkeydown={clearKeyDown} onclick={clearSelection}><RenderContent value={clearIcon.content} /></button>{/if}
  </div>
  {#if !inputSlot && (name ?? field?.name)}
    {#if multiple}
      {#each selectedValues as item (item)}<input type="hidden" name={name ?? field?.name} value={item} disabled={resolvedDisabled} form={attributes.form} />{/each}
    {:else}
      <input type="hidden" name={name ?? field?.name} value={selectedRaw ?? ''} disabled={resolvedDisabled} form={attributes.form} />
    {/if}
  {/if}
  {@render componentPopup()}
</div>{/if}

{#snippet componentPopup()}
  {#if popupView.present}
    {@const initialPopupStyle = untrack(() => popupStyle.initialStyle())}
    <div
      bind:this={list}
      data-ant-select-dropdown data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
      data-ant-select-component-popup={rootSlot || inputSlot ? '' : undefined}
      data-ant-select-source-popup={Boolean(componentTheme.className) && filtered.length > 0 || undefined}
      data-ant-select-custom-popup={customPopup || undefined}
      popover="manual"
      hidden={!expanded || !shown}
      dir={config.direction}
      class={[`popup ${prefix}-dropdown`, componentTheme.className && 'ant-select-css-var',
        componentTheme.className && filtered.length > 0 && `${prefix}-source-popup`,
        componentTheme.className && config.direction === 'rtl' && `${prefix}-dropdown-rtl`,
        popupPlacement && `${prefix}-dropdown-placement-${popupPlacement}`,
        componentTheme.className, semantics.classes.popup.root, rootClassName]} style={initialPopupStyle}
      {...selectStyleAttributes(semantics.styles.popup.root)} {@attach popupStyle.attach}
      {@attach portal}
      aria-busy={loading || undefined}
      onfocusout={handleListFocusOut}
      aria-label={attributes['aria-label'] ?? placeholder ?? config.locale.searchText}
    >
      <SelectPopupContent value={popupView.content} origin={originMenu} active={expanded} isolate={Boolean(popupRender)} />
    </div>
  {/if}
{/snippet}
