<script lang="ts" generics="ValueType extends TreeSelectValue = TreeSelectValue, Data extends object = TreeSelectNode, RootElement extends HTMLElement = HTMLDivElement, EditorElement extends TreeSelectEditorElement = HTMLInputElement">
  import { flushSync, onMount, tick, untrack } from 'svelte';
  import type {
    TreeSelectProps,
    TreeSelectSearchConfig,
    TreeSelectValue,
    TreeSelectRawValue,
    TreeSelectLabeledValue,
    TreeSelectLabel,
    TreeSelectSemanticInfo,
    TreeSelectNode,
    TreeSelectNodeIcon,
    TreeSelectRef
  } from './tree-select.types';
  import type { TreeDataNode, TreeEventNode, TreeKey, TreeScrollConfig } from './tree.types';
  import {
    treeSelectIndex,
    treeSelectLabeled,
    treeSelectChecks,
    treeSelectStrategy,
    treeSelectLabels,
    filterTreeSelect,
    toggleTreeSelect
  } from './tree-select.engine';
  import { expandTreeParents, treeCheckDisabled } from './tree.engine';
  import { treeSelectChildren, treeSelectData, treeSelectNodeValue } from './tree-select-data.engine';
  import { treeSelectLimit } from './tree-select-limit.engine';
  import { treeSelectPastedSearch, treeSelectTokenSearch } from './tree-select-token.engine';
  import type { TreeSelectEditorElement, TreeSelectRootContext, TreeSelectInputContext,
    TreeSelectRootRegistration, TreeSelectInputRegistration } from './tree-select-components.types';
  import { mergeTreeSelectComponentAttributes, treeSelectNativeKeyCancelled } from './tree-select-components.engine';
  import { createTreeSelectLabelCache } from './tree-select-labels';
  import TreeSelectLabelBinding from './TreeSelectLabelBinding.svelte';
  import TreeSelectPopupContent from './TreeSelectPopupContent.svelte';
  import TreeSelectComponentScope from './TreeSelectComponentScope.svelte';
  import { treeSelectTagText, treeSelectTagOverflow } from './tree-select-tags.engine';
  import { treeSelectSemantics } from './tree-select-semantic.engine';
  import { connectSelectTagOverflow, measureSelectInput } from './select-tag-overflow.dom';
  import { connectTreeSelectComponentOverflow } from './tree-select-component-overflow.dom';
  import { createTreeSelectComponentAnchor } from './tree-select-component-anchor.dom';
  import { createTreeSelectAlign, type TreeSelectAlignSnapshot } from './tree-select-align.dom';
  import { treeSelectBuiltinPlacements } from './tree-select-align.engine';
  import { treeSelectMotionName } from './tree-select-motion.engine';
  import { treeSelectMotionCss } from './tree-select-motion-css.engine';
  import {
    createTreeSelectPopupMotion, type TreeSelectPopupMotionState
  } from './tree-select-motion.dom';
  import {
    getPopupPlacement, type PopupFlipCache, type PopupSourceAlign
  } from './popup-position.engine';
  import type { TreeSelectComponentOverflowLayout } from './tree-select-component-overflow.engine';
  import { useConfig } from './config-context';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getSelectPrefixCss } from './select-prefix.engine';
  import { getTreeSelectPrefixCss } from './tree-select-prefix.engine';
  import { useVariant } from './variant.svelte';
  import RenderContent from './RenderContent.svelte';
  import RenderEmpty from './RenderEmpty.svelte';
  import { useForm, useFormField } from './form-context';
  import { useFormItemStatusContext } from './form-item-status';
  import { useFormFeedback } from './form-feedback-context';
  import FormFeedbackIcon from './FormFeedbackIcon.svelte';
  import { useCompact } from './space-compact-context';
  import { compactClasses } from './space-compact.engine';
  import { connectPopup, getPopupActiveElement } from './popup.dom';
  import { createPopupContainer } from './popup-container.model.svelte.js';
  import { createOverlayStyle } from './overlay-style.model.svelte';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { useComponentTheme } from './theme-component.svelte';
  import { useToken } from './theme-context.svelte';
  import Tree from './Tree.svelte';
  import TreeTitle from './TreeTitle.svelte';
  import Icon from './Icon.svelte';
  import NoCompactStyle from './NoCompactStyle.svelte';
  let {
    nativeElement = $bindable(),
    inputElement = $bindable(),
    _nodes,
    ...componentProps
  }: TreeSelectProps<ValueType, Data, RootElement, EditorElement> & { _nodes?: readonly Data[]; } = $props();
  let {
    prefixCls,
    direction: _direction,
    children: _children,
    components,
    treeData = [],
    fieldNames,
    treeDataSimpleMode,
    value,
    defaultValue,
    multiple = false,
    treeCheckable = false,
    treeCheckStrictly = false,
    labelInValue = false,
    maxCount,
    maxTagTextLength,
    maxTagCount,
    maxTagPlaceholder,
    tagRender,
    choiceTransitionName: _choiceTransitionName,
    showCheckedStrategy,
    onChange,
    onSelect,
    onDeselect,
    showSearch,
    tokenSeparators,
    treeNodeLabelProp,
    open,
    defaultOpen = false,
    onOpenChange,
    onPopupVisibleChange: _onPopupVisibleChange,
    showAction,
    autoFocus,
    tabIndex,
    maxLength: _maxLength,
    onInputKeyDown,
    onKeyDown,
    onKeyUp,
    onFocus,
    onBlur,
    onMouseDown,
    onMouseEnter,
    onMouseLeave,
    onClick,
    prefix: leading,
    suffix,
    suffixIcon,
    allowClear = false,
    onClear,
    removeIcon,
    popupRender,
    notFoundContent,
    loading,
    treeExpandedKeys,
    treeDefaultExpandedKeys = [],
    treeDefaultExpandAll = false,
    treeExpandAction = false,
    onTreeExpand,
    treeLoadedKeys,
    onTreeLoad,
    loadData,
    treeLine = false,
    treeIcon = false,
    switcherIcon,
    treeTitleRender,
    listHeight = 256,
    listItemHeight,
    listItemScrollOffset,
    showScrollBar: _showScrollBar,
    virtual,
    popupMatchSelectWidth,
    popupStyle: _popupStyle,
    animation,
    transitionName,
    placement,
    popupAlign,
    builtinPlacements,
    onPopupScroll,
    getPopupContainer,
    classNames,
    styles,
    rootClassName = '',
    size,
    status,
    variant,
    disabled,
    id,
    name,
    placeholder,
    class: className = '',
    style,
    onkeydown,
    onfocus,
    onblur,
    ...attributes
  }: TreeSelectProps<
    ValueType, Data, RootElement, EditorElement
  > = $derived(componentProps);
  const config = useConfig();
  const tokens = useToken();
  let prefix = $derived(config.getPrefixCls('select', prefixCls));
  let treePrefix = $derived(config.getPrefixCls('tree-select', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let privateNamespace = $derived(rootPrefix.replaceAll('.', ''));
  let selectPrefixCss = $derived(getSelectPrefixCss(prefix, rootPrefix));
  let treePrefixCss = $derived(getTreeSelectPrefixCss(treePrefix, rootPrefix));
  let popupMotionName = $derived(treeSelectMotionName(animation, transitionName, prefix, rootPrefix));
  let popupMotionCss = $derived(treeSelectMotionCss(prefix, rootPrefix));
  const variantContext = useVariant('treeSelect', () => ({ variant }));
  let appearance = $derived(variantContext.variant);
  const form = useForm();
  const controlRef = {
    get nativeElement() {
      return nativeElement;
    },
    focus, blur, scrollTo
  };
  const field = useFormField(() => controlRef);
  const itemStatus = useFormItemStatusContext();
  const feedback = useFormFeedback();
  const compact = useCompact();
  const selectTheme = useComponentTheme('Select');
  const treeSelectTheme = useComponentTheme('TreeSelect');
  const componentStyle = $derived(
    [selectTheme.style, treeSelectTheme.style].filter(Boolean).join(';') || undefined
  );
  const generated = $props.id();
  let internalValue = $state.raw<TreeSelectValue>(untrack(() => defaultValue));
  let actualValue = $derived(value === undefined ? internalValue : value);
  let items = $derived(treeSelectLabeled(actualValue));
  let data = $derived(componentProps.treeData == null && _nodes
    ? _nodes : treeSelectData(treeData, treeDataSimpleMode));
  let index = $derived(treeSelectIndex(data, fieldNames));
  let checkable = $derived(treeCheckable || treeCheckStrictly);
  let isMultiple = $derived(checkable || multiple);
  let labeled = $derived(treeCheckStrictly || labelInValue);
  let conduction = $derived(treeCheckable && !treeCheckStrictly);
  let strategy = $derived(!treeCheckable ? 'SHOW_ALL' : showCheckedStrategy ?? 'SHOW_CHILD');
  let checks = $derived(treeSelectChecks(items, conduction, index));
  let display = $derived(
    treeSelectLabels(
      treeSelectStrategy(checks.checked, strategy, index).map(
        raw => ({
          value: raw,
          label: labelInValue ? items.find(item => item.value === raw)?.label : undefined
        })
      ),
      index,
      treeNodeLabelProp,
      items
    ).map(
      item => ({ ...item, label: item.label ?? item.value })
    )
  );
  let searchConfig = $derived<TreeSelectSearchConfig<Data>>(
    { ...(typeof showSearch === 'object' ? showSearch : {}) }
  );
  let limit = $derived(treeSelectLimit(
    { maxCount, multiple, treeCheckable, treeCheckStrictly, showCheckedStrategy },
    index, checks.checked, display.length
  ));
  let responsiveCount = $state(Number.POSITIVE_INFINITY);
  let componentOverflow = $state.raw<TreeSelectComponentOverflowLayout>();
  let tagsReady = $state(false);
  onMount(() => { tagsReady = true; });
  let responsiveTags = $derived(isMultiple && maxTagCount === 'responsive');
  let componentResponsive = $derived(Boolean(responsiveTags && components?.input && !components.root));
  let tagOverflow = $derived(componentResponsive && componentOverflow
    ? { visible: display.slice(0, componentOverflow.visibleCount), omitted: display.slice(componentOverflow.omittedStart) }
    : treeSelectTagOverflow(display,
      responsiveTags ? responsiveCount : typeof maxTagCount === 'number' ? maxTagCount : undefined));
  const labelCache = createTreeSelectLabelCache<Data>();
  // Summary связывает labels в текущем render, до вызова consumer snippet.
  let omittedTags = $derived(treeTitleRender && typeof maxTagPlaceholder === 'function'
    ? labelCache.forSummary(treeTitleRender, tagOverflow.omitted, index.values)
    : { records: tagOverflow.omitted, pending: [] });
  let renderedTags = $derived(responsiveTags
    ? componentResponsive && componentOverflow ? display.slice(0, componentOverflow.renderCount) : display
    : tagOverflow.visible);
  let visibleTagKeys = $derived(new Set(tagOverflow.visible.map(item => item.value)));
  // Ant wrapper передаёт tagRender по multiple/treeCheckable, независимо от strict-only rc mode.
  let renderTag = $derived(multiple || treeCheckable ? tagRender : undefined);
  let placeholderTitle = $derived(maxTagPlaceholder == null ? `+ ${tagOverflow.omitted.length} ...`
    : typeof maxTagPlaceholder === 'string' || typeof maxTagPlaceholder === 'number'
      ? String(maxTagPlaceholder) : undefined);
  let tagContent = $state<HTMLDivElement>();
  const tagElements = new Map<TreeSelectRawValue, HTMLElement>();
  let pendingClose: MessageChannel | undefined;
  let selectorMouseDown: MessageChannel | undefined;
  let internalSearch = $state('');
  let composing = false;
  let pastedText: string | undefined;
  let search = $derived(searchConfig.searchValue ?? internalSearch);
  // Suffix получает исходный showSearch, включая undefined.
  let suffixSearch = $derived(typeof showSearch === 'object' ? true : showSearch);
  let canSearch = $derived(suffixSearch ?? isMultiple);
  let autoClear = $derived(searchConfig.autoClearSearchValue ?? true);
  let filtered = $derived(filterTreeSelect(data, search, searchConfig, fieldNames));
  let filteredIndex = $derived(treeSelectIndex(filtered, fieldNames, {
    icon: panelNodeIcon,
    switcherIcon: panelNodeSwitcher
  }));
  let blocked = $derived(
    disabled ?? field?.disabled ?? form?.disabled ?? config.componentDisabled
  );
  let semanticSize = $derived(size ?? compact?.size ?? config.explicitComponentSize);
  let resolvedSize = $derived(semanticSize ?? config.componentSize);
  let resolvedStatus = $derived(status ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let context = $derived(config.treeSelect);
  let semanticInfo = $derived<TreeSelectSemanticInfo<ValueType, Data, RootElement, EditorElement>>({ props: {
    ...componentProps, classNames, styles, size: semanticSize, status: resolvedStatus,
    disabled: blocked, variant: appearance
  } });
  let semantics = $derived(treeSelectSemantics(context, semanticInfo));
  let classes = $derived(semantics.classes);
  let css = $derived(semantics.styles);
  let resolvedSwitcher = $derived(switcherIcon ?? context?.switcherIcon);
  let switcher = $derived(typeof resolvedSwitcher === 'function' ? resolvedSwitcher
    : resolvedSwitcher === undefined ? undefined : panelSwitcher);
  let leafIcon = $derived(typeof treeLine === 'object' ? treeLine?.showLeafIcon : undefined);
  let showLine = $derived(treeLine && typeof treeLine === 'object'
    ? { showLeafIcon: typeof leafIcon === 'boolean' || typeof leafIcon === 'function'
      ? leafIcon : leafIcon ? panelLeafIcon : false }
    : Boolean(treeLine));
  let canClear = $derived(Boolean(allowClear && !blocked && (display.length || search)));
  let clearConfig = $derived(typeof allowClear === 'object' ? allowClear : undefined);
  let showArrow = $derived(suffix != null || suffixIcon !== null || feedback.hasFeedback);
  let defaultSuffix = $derived(suffix == null && suffixIcon === undefined);
  let customPopup = $derived(Boolean(popupRender));
  let placeholderText = $derived(typeof placeholder === 'string' || typeof placeholder === 'number'
    ? String(placeholder) : undefined);
  let controlId = $derived(id ?? field?.id ?? `ant-tree-select-${generated}`);
  let internalOpen = $state(untrack(() => defaultOpen));
  let rawOpen = $derived(Boolean(open ?? internalOpen));
  let visible = $derived(rawOpen && !blocked);
  let inputValue = $derived(
    isMultiple || visible && canSearch ? search
      : treeTitleRender || Array.isArray(display[0]?.label) ? '' : text(display[0]?.label)
  );
  let mounted = $state(untrack(() => defaultOpen || open === true));
  let shown = $state(false);
  let focused = $state(false);
  let editorFocused = $state(false);
  const cancelledKeys = new WeakSet<Event>();
  const openingKeys = new WeakSet<Event>();
  const forwardedKeys = new WeakSet<Event>();
  let enterLocked = false;
  let defaultRoot = $state<HTMLDivElement>();
  let defaultEditor = $state<HTMLInputElement>();
  let customRoot = $state.raw<{ registration: TreeSelectRootRegistration<RootElement>; }>();
  let customInput = $state.raw<{ registration: TreeSelectInputRegistration<EditorElement>; }>();
  let componentInputWidth = $state<number>();
  let componentInputSuffix = $state<HTMLSpanElement>();
  let rootSlot = $derived(components?.root);
  let inputSlot = $derived(!rootSlot && components?.input);
  let renderRoot = $derived(typeof rootSlot === 'function' ? rootSlot : rootSlot?.render);
  let renderInput = $derived(typeof inputSlot === 'function' ? inputSlot : inputSlot && inputSlot.render);
  let root = $derived(rootSlot ? customRoot && rootNode(customRoot.registration) : defaultRoot);
  let editor = $derived(rootSlot ? undefined : inputSlot
    ? customInput && inputNode(customInput.registration) : defaultEditor);
  let editorContainer = $derived(inputSlot && customInput && 'inputElement' in customInput.registration
    ? customInput.registration.nativeElement ?? editor : editor);
  let rootContext = $derived.by(componentRootContext);
  let inputContext = $derived.by(componentInputContext);
  let componentInputValue = $derived(canSearch && !(isMultiple && !rawOpen && autoClear) ? search : '');
  let placeholderQuery = $derived(componentResponsive ? componentInputValue : inputValue);
  let hiddenRest = $derived(!tagOverflow.omitted.length || responsiveTags && !tagsReady
    || componentResponsive && !componentOverflow?.restReady);
  let popup = $state<HTMLDivElement>();
  let popupMotionState = $state.raw<TreeSelectPopupMotionState>({
    revision: 0, running: false, present: false, renderReady: true
  });
  let popupPresent = $derived(visible || popupMotionState.present);
  let popupMotion: ReturnType<typeof createTreeSelectPopupMotion> | undefined;
  let popupAlignment: ReturnType<typeof createTreeSelectAlign> | undefined;
  let popupAlignmentSnapshot: TreeSelectAlignSnapshot | undefined;
  let sourceMotionUsed = $state(untrack(() => Boolean(popupMotionName) && tokens.token.motion));
  let sourceAlignmentUsed = $state(untrack(() => popupAlign !== undefined || builtinPlacements !== undefined));
  let cachedPopupAlignment = $state.raw<PopupSourceAlign>();
  let legacyPopupClass = $state<string>();
  let popupFlipCache: PopupFlipCache | undefined;
  const sourcePlacements = treeSelectBuiltinPlacements();
  let alignedPopupClass = $derived(sourceAlignmentUsed || sourceMotionUsed
    ? cachedPopupAlignment && getPopupPlacement(builtinPlacements || sourcePlacements, cachedPopupAlignment)
    : legacyPopupClass);
  $effect(() => {
    if (popupAlign !== undefined || builtinPlacements !== undefined) sourceAlignmentUsed = true;
    if (popupMotionName && tokens.token.motion) sourceMotionUsed = true;
  });
  $effect(() => {
    if (sourceAlignmentUsed && popup && !semantics.popupHasMaxWidth)
      popup.style.removeProperty('max-width');
  });
  let menuElement = $state<HTMLDivElement>();
  let popupMouseDownTimer: ReturnType<typeof setTimeout> | undefined;
  const anchorWidthVariable = '--ant-tree-select-anchor-width';
  let matchedWidth = $derived(popupMatchSelectWidth ?? config.popupMatchSelectWidth ?? true);
  let itemHeight = $derived(listItemHeight ?? tokens.token.controlHeightSM + tokens.token.paddingXXS);
  let panelVirtual = $derived(matchedWidth !== false && (virtual ?? config.virtual ?? true));
  let popupLayers = $derived([
    componentStyle,
    `${matchedWidth === true ? 'width' : 'min-width'}:var(${anchorWidthVariable})`,
    !visible ? 'pointer-events:none' : undefined,
    popupMotionState.style,
    semantics.popupRootStyle,
    typeof matchedWidth === 'number' ? `width:${matchedWidth}px` : undefined
  ]);
  const popupStyle = createOverlayStyle(() => popupLayers);
  const portal = createPopupContainer(() => ({
    open: visible,
    reference: root,
    getPopupContainer: getPopupContainer || config.getPopupContainer,
    themeStyle: serializeInlineStyleLayers(popupLayers),
    preserveVariables: [anchorWidthVariable]
  }));
  let tree = $state<TreeSelectRef>();
  let treeElement = $state<HTMLDivElement>();
  let active = $state<TreeKey | null>(null);
  let activeDescendant = $state<string>();
  let expanded = $state.raw<TreeKey[]>(
    untrack(
      () => treeDefaultExpandAll
        ? index.ordered.filter(entry => entry.children.length).map(entry => entry.key)
        : expandTreeParents(treeDefaultExpandedKeys, index)
    )
  );
  let searchExpanded = $state.raw<TreeKey[]>([]);
  let expandedByUser = false;
  let loaded = $state.raw<TreeKey[]>([]);
  let panelExpanded = $derived(treeExpandedKeys ?? (search ? searchExpanded : expanded));
  let initialized = untrack(() => defaultOpen || open === true);
  function initializePanel() {
    if (!initialized) {
      expanded = treeDefaultExpandAll
        ? index.ordered.filter(entry => entry.children.length).map(entry => entry.key)
        : expandTreeParents(treeDefaultExpandedKeys, index);
      initialized = true;
    }
  }
  let previousSearch = '';
  let panelOpened = false;
  let panelSearch = '';
  let previousProps = untrack(() => ({ value, open, search: searchConfig.searchValue }));
  let handledSearchOpen: boolean | undefined;
  $effect(() => () => {
    cancelClose();
    selectorMouseDown?.port1.close();
    selectorMouseDown?.port2.close();
    selectorMouseDown = undefined;
    clearTimeout(popupMouseDownTimer);
  });
  $effect.pre(() => {
    const visible = new Set(tagOverflow.visible.map(item => item.value));
    const input = editor;
    const active = input?.ownerDocument.activeElement;
    if (!input || !active || ![...tagElements].some(([value, node]) =>
      !visible.has(value) && node.contains(active))) return;
    void tick().then(() => {
      if (!input.isConnected || active.isConnected && !active.closest('[inert]')) return;
      const doc = input.ownerDocument;
      if (!doc.activeElement || doc.activeElement === active || doc.activeElement === doc.body
        || doc.activeElement === doc.documentElement) input.focus();
    });
  });
  $effect(() => {
    if (!editor || !responsiveTags || inputSlot) return;
    void search;
    const input = editor;
    const previous = input.style.width;
    input.style.width = `${measureSelectInput(input)}px`;
    return () => { input.style.width = previous; };
  });
  $effect(() => {
    const input = editor;
    void componentInputValue;
    if (!inputSlot || !isMultiple || !input) {
      componentInputWidth = undefined;
      return;
    }
    componentInputWidth = measureSelectInput(input);
  });
  $effect(() => {
    if (!componentResponsive) componentOverflow = undefined;
  });
  $effect(() => {
    if (!componentResponsive || !tagContent || !componentInputSuffix) return;
    const host = tagContent, suffix = componentInputSuffix;
    const overflow = untrack(() => connectTreeSelectComponentOverflow(host, suffix, () => display.length,
      layout => { componentOverflow = layout; }));
    // Static renderers могут не изменить DOM при росте выбранного списка.
    $effect(() => { void display.length; overflow.schedule(); });
    return overflow.destroy;
  });
  $effect(() => {
    if (!tagContent || !responsiveTags || componentResponsive) return;
    void display;
    void maxTagTextLength;
    void maxTagPlaceholder;
    void renderTag;
    void search;
    const host = tagContent;
    const suffix = inputSlot ? componentInputSuffix : ':scope > input';
    let disposed = false;
    let disconnect: (() => void) | undefined;
    void tick().then(() => {
      if (!disposed) disconnect = connectSelectTagOverflow(host,
        count => { responsiveCount = count; }, {
          tag: ':scope > [data-tree-choice-tag]', rest: ':scope > [data-tree-choice-rest]',
          input: suffix
        });
    });
    return () => {
      disposed = true;
      disconnect?.();
    };
  });
  // Внутренние DOM-ссылки сохраняются при обновлении spread props без bind:ref.
  $effect(() => {
    nativeElement = root;
    return () => { nativeElement = undefined; };
  });
  $effect(() => {
    inputElement = editor;
    return () => { inputElement = undefined; };
  });
  $effect(() => {
    const next = { value, open, search: searchConfig.searchValue };
    if (next.value !== previousProps.value)
      internalValue = next.value;
    if (next.open !== previousProps.open) {
      cancelClose();
      internalOpen = Boolean(next.open);
    }
    if (next.search !== previousProps.search)
      internalSearch = next.search ?? '';
    previousProps = next;
  });
  $effect(() => {
    if (blocked)
      internalOpen = false;
  });
  $effect(() => {
    const isOpen = rawOpen;
    if (handledSearchOpen === isOpen) return;
    const resetSearch = handledSearchOpen === undefined || !isOpen;
    handledSearchOpen = isOpen;
    // Source монтируется с закрытым ssrSafeOpen даже при initial open=true.
    if (resetSearch) untrack(() => {
      if (!isMultiple) searchInput('', false, false);
      // Synchronous owner update уже обработан mount cleanup в React batch.
      handledSearchOpen = rawOpen;
    });
  });
  $effect(() => {
    const nextSearch = search;
    if (nextSearch !== previousSearch && nextSearch)
      searchExpanded = filteredIndex.ordered.filter(entry => entry.node.children !== undefined).map(
        entry => entry.key
      );
    if (visible) {
      mounted = true;
      untrack(initializePanel);
    }
    previousSearch = nextSearch;
  });
  $effect(() => {
    if (!visible) {
      panelOpened = false;
      return;
    }
    const panel = tree;
    const query = search;
    if (!shown || panelOpened && panelSearch === query) return;
    const opening = !panelOpened;
    panelOpened = true;
    panelSearch = query;
    untrack(() => {
      const selected = isMultiple ? undefined : checks.checked[0];
      const next = selected !== undefined && !query ? selected : firstNode(filtered);
      // Tree учитывает offset при смене activeKey. При повторном открытии тот же key
      // прокручивается с обычным выравниванием выбранного узла.
      if (opening && next === active && selected !== undefined) panel?.scrollTo({ key: selected });
      active = next;
    });
  });
  $effect(() => {
    const panel = treeElement?.querySelector('[role="tree"]');
    if (!visible || !panel) {
      activeDescendant = undefined;
      return;
    }
    const update = () => {
      activeDescendant = panel.getAttribute('aria-activedescendant') ?? undefined;
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(panel, { attributes: true, attributeFilter: ['aria-activedescendant'] });
    return () => observer.disconnect();
  });
  $effect(() => {
    if (!visible) {
      popupFlipCache = undefined;
      popupAlignment?.resetFlips();
      if (popupAlignmentSnapshot?.alignment) popupAlignmentSnapshot.alignment.flips = {};
    }
  });
  $effect(() => {
    if (!popupPresent) return;
    if (!popup || !root) return;
    const anchor = root;
    const surface = popup;
    const sourceMode = () => untrack(() => sourceAlignmentUsed || sourceMotionUsed);
    const requestedPlacement = () => untrack(() =>
      placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'));
    // Track the Source cache from open, including before alignment props are first added live.
    // Native keeps its existing default presentation until the inherited alignment API is used.
    const source = untrack(() => createTreeSelectAlign(
      anchor,
      surface,
      () => untrack(() => ({
        placement: placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft'),
        popupAlign,
        builtinPlacements,
        style: serializeInlineStyleLayers(popupLayers),
        open: visible,
        inMotion: popupMotionState.running,
        renderReady: popupMotionState.renderReady,
        constrainX: !sourceAlignmentUsed,
        motion: popupMotionState,
        onMotionTransitionEnd: event => popupMotion?.complete(event.revision),
        container: getPopupContainer || config.getPopupContainer
          ? surface.parentNode as HTMLElement | ShadowRoot : surface.ownerDocument.body
      })),
      popupFlipCache,
      popupAlignmentSnapshot
    ));
    popupAlignment = source;
    let sourceAnchor: ReturnType<typeof createTreeSelectComponentAnchor> | undefined;
    let sourceAnchorRight: boolean | undefined;
    const disconnect = connectPopup(popup, root, {
      get placement() { return requestedPlacement().startsWith('top') ? 'top' : 'bottom'; },
      gap: 4,
      getPosition: (rect, bounds, viewport) => {
        const value = source.position(rect, bounds, viewport);
        return sourceMode() ? value : undefined;
      },
      getAnchorRect: rect => {
        if (sourceMode() || !untrack(() => componentResponsive)) return rect;
        const right = requestedPlacement().endsWith('Right');
        if (!sourceAnchor || sourceAnchorRight !== right) {
          sourceAnchor?.destroy();
          sourceAnchor = createTreeSelectComponentAnchor(anchor, surface, right);
          sourceAnchorRight = right;
        }
        return sourceAnchor.read(rect);
      },
      get align() { return requestedPlacement().endsWith('Right') ? 'right' : 'left'; },
      autoAdjustOverflow: true,
      get maxWidth() { return untrack(() => sourceAlignmentUsed || semantics.popupHasMaxWidth ? false : '100vw'); },
      getAnchorWidth: () => sourceMode() ? source.width : anchor.getBoundingClientRect().width,
      get constrainWidth() { return untrack(() => sourceAlignmentUsed ? false : undefined); },
      get allowOffscreenAnchor() { return untrack(() => sourceAlignmentUsed); },
      get interactive() { return untrack(() => visible); },
      anchorWidthVariable,
      preserveFocus: customPopup ? false : preserveEditorFocus,
      applyPosition: value => untrack(() => {
        if (sourceMode()) source.commitFrame(() => popupStyle.position(value, source.style));
        else popupStyle.position(value);
      }),
      onAlign: value => {
        if (sourceMode()) cachedPopupAlignment = value.sourceAlign;
      },
      onPlacement: value => {
        if (!sourceMode()) legacyPopupClass = `${value.startsWith('top') ? 'top' : 'bottom'}${requestedPlacement().endsWith('Right') ? 'Right' : 'Left'}`;
      },
      onVisibilityChange: next => {
        shown = next;
      },
      onDismiss: reason => {
        if (reason === 'escape')
          editor?.focus();
        scheduleClose();
      }
    });
    source.connect(disconnect.forceAlign);
    return () => {
      // Source resets flip history only when closed, including across live root replacement.
      popupFlipCache = source.flips;
      popupAlignmentSnapshot = source.snapshot();
      if (popupAlignment === source) popupAlignment = undefined;
      const nextRoot = customRoot ? rootNode(customRoot.registration) : defaultRoot;
      // A same-popup retarget must keep its native CSS animation and public WAAPI clock alive.
      disconnect(Boolean(nextRoot !== anchor && (!nextRoot || nextRoot.isConnected)
        && popup === surface && popupMotionState.present));
      source.destroy();
      sourceAnchor?.destroy();
    };
  });
  function attachPopupMotion(node: HTMLElement) {
    const current = createTreeSelectPopupMotion(node, {
      publish(state, commit) {
        popupMotionState = state;
        if (commit) flushSync();
        // Phase classes can change the CSS plane inside this RAF; numeric alignment stays paused.
        queueMicrotask(() => popupAlignment?.refreshFrame());
      },
      async prepare() {
        await tick();
        popupAlignment?.forceAlign();
        await Promise.resolve();
      },
      visibleChanged(next) {
        if (next) popupAlignment?.forceAlign();
      }
    });
    popupMotion = current;
    $effect(() => {
      const next = visible;
      const name = popupMotionName;
      const enabled = tokens.token.motion;
      untrack(() => current.sync(next, name, enabled));
    });
    return () => {
      current.destroy();
      if (popupMotion === current) popupMotion = undefined;
    };
  }
  $effect(() => {
    const state = popupMotionState;
    if (sourceAlignmentUsed || visible || shown || !state.running) return;
    const motion = popupMotion;
    let active = true;
    // Native hides offscreen triggers. Their cancelled CSS effects cannot finish a closed panel.
    queueMicrotask(() => {
      if (active) motion?.complete(state.revision);
    });
    return () => { active = false; };
  });
  $effect(() => {
    if (!editor) return;
    const input = editor;
    input.setCustomValidity(
      (attributes.required ?? field?.required) && !display.length
        ? config.locale.selectRequiredText ?? 'Please select a value.'
        : ''
    );
    return () => input.setCustomValidity('');
  });
  function firstNode(nodes: typeof treeData): TreeKey | null {
    for (const node of nodes) {
      if (Reflect.get(node, 'disabled') || Reflect.get(node, 'selectable') === false)
        continue;
      if (!search
        || String(Reflect.get(node, searchConfig.treeNodeFilterProp ?? 'value')).toLowerCase().includes(
          search.toLowerCase()
        )) return treeSelectNodeValue(node, index.fields);
      const child = firstNode(treeSelectChildren(node, index.fields));
      if (child !== null) return child;
    }
    return null;
  }
  function text(label: TreeSelectLabel | undefined): string {
    return Array.isArray(label) ? label.map(text).join('')
      : typeof label === 'function' || typeof label === 'boolean' || label == null ? '' : String(label);
  }
  function renderedLabel(node: Data, fallback: TreeSelectLabel): TreeSelectLabel {
    return treeTitleRender ? labelCache.forChange(treeTitleRender, node, fallback) : fallback;
  }
  function tagText(item: TreeSelectLabeledValue): string {
    return text(labelCache.original(item.label) ?? item.value);
  }
  function rootNode(ref: TreeSelectRootRegistration<RootElement>) {
    return 'nativeElement' in ref ? ref.nativeElement : ref;
  }
  function inputNode(ref: TreeSelectInputRegistration<EditorElement>) {
    return 'inputElement' in ref ? ref.inputElement : ref;
  }
  function registerRoot(registration: TreeSelectRootRegistration<RootElement>) {
    const current = { registration };
    customRoot = current;
    return () => { if (customRoot === current) customRoot = undefined; };
  }
  function registerInput(registration: TreeSelectInputRegistration<EditorElement>) {
    const current = { registration };
    customInput = current;
    return () => { if (customInput === current) customInput = undefined; };
  }
  function rootFocus(event: FocusEvent & { currentTarget: EventTarget & (RootElement | HTMLDivElement); }) {
    if (event.target instanceof Node && popup?.contains(event.target)) return;
    focused = true;
    if (!blocked) {
      if (showAction?.includes('focus')) requestOpen(true);
      onFocus?.(event);
    }
  }
  function rootBlur(event: FocusEvent & { currentTarget: EventTarget & (RootElement | HTMLDivElement); }) {
    if (event.target instanceof Node && popup?.contains(event.target)) return;
    if (rootSlot || inputSlot || event.relatedTarget instanceof Node && popup?.contains(event.relatedTarget)) focused = false;
    if ((rootSlot || inputSlot) && isMultiple && search) {
      internalSearch = '';
      searchConfig.onSearch?.('');
    }
    if (!blocked) onBlur?.(event);
    blurWithin(event);
  }
  function customRootClick(event: MouseEvent & { currentTarget: EventTarget & RootElement; }) {
    if (visible) scheduleClose();
    else requestOpen(true, true);
    onClick?.(event);
  }
  function customRootKeyboard(event: KeyboardEvent & { currentTarget: EventTarget & RootElement; }) {
    const wasOpen = visible;
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.key === 'Enter' || !suffixSearch) event.preventDefault();
      if (!wasOpen) requestOpen(true, true);
      else handleKeyboard(event, true);
    } else if (event.key === 'Backspace' && isMultiple && !search) {
      const last = [...display].reverse().find(item => !item.disabled);
      if (last) choose(last.value, 'selection', false);
    } else if (wasOpen) handleKeyboard(event, true);
    onKeyDown?.(event);
  }
  function componentRootContext(): TreeSelectRootContext<RootElement> {
    // Ant wrapper вычисляет semantic callbacks и при полной замене selector.
    void semantics;
    const own = typeof rootSlot === 'object' ? rootSlot.props : undefined;
    const attrs = Object.assign({}, own);
    const generated = {
      ...attributes,
      ...([attributes['aria-describedby'], field?.describedBy].some(Boolean) ? {
        'aria-describedby': [attributes['aria-describedby'], field?.describedBy].filter(Boolean).join(' ')
      } : {}),
      ...(field?.required ? { 'aria-required': attributes['aria-required'] ?? true } : {}),
      ...(field?.invalid ? { 'aria-invalid': true } : {}),
      ...(Object.hasOwn(componentProps, 'name') ? { name } : {}),
      onclick: customRootClick,
      onfocusin: rootFocus,
      onfocusout: rootBlur,
      onkeydown: customRootKeyboard,
      onkeyup: (event: KeyboardEvent & { currentTarget: EventTarget & RootElement; }) => {
        if (event.key === 'Enter') enterLocked = false;
        onKeyUp?.(event);
      },
      ...(Object.hasOwn(componentProps, 'onMouseEnter') ? { onmouseenter: onMouseEnter } : {}),
      ...(Object.hasOwn(componentProps, 'onMouseLeave') ? { onmouseleave: onMouseLeave } : {})
    };
    return { attributes: mergeTreeSelectComponentAttributes(attrs, generated,
      own, 'root'), register: registerRoot };
  }
  function editorInput(event: Event & { currentTarget: EventTarget & (EditorElement | HTMLInputElement); }) {
    const next = treeSelectPastedSearch(event.currentTarget.value, pastedText, tokenSeparators);
    pastedText = undefined;
    searchInput(next);
  }
  function editorFocus(event: FocusEvent & { currentTarget: EventTarget & (EditorElement | HTMLInputElement); }) {
    focused = true;
    editorFocused = true;
    onfocus?.(event);
  }
  function editorBlur(event: FocusEvent & { currentTarget: EventTarget & (EditorElement | HTMLInputElement); }) {
    editorFocused = false;
    enterLocked = false;
    onblur?.(event);
  }
  function componentInputContext(): TreeSelectInputContext<EditorElement> {
    const attrs: TreeSelectInputContext<EditorElement>['attributes'] = {};
    const generated = {
      ...attributes, id: controlId,
      class: [`${prefix}-input`, classes.input].filter(Boolean).join(' '),
      style: serializeInlineStyleLayers([css.input, componentInputWidth === undefined ? undefined : `--select-input-width:${componentInputWidth}`]),
      type: 'text', role: 'combobox', tabindex: attributes.tabindex ?? tabIndex,
      autofocus: attributes.autofocus ?? autoFocus, autocomplete: attributes.autocomplete || 'new-password',
      disabled: blocked, readonly: !canSearch, value: componentInputValue,
      'aria-haspopup': 'tree', 'aria-controls': !popupRender || menuElement ? `${controlId}-list` : undefined,
      'aria-expanded': visible, 'aria-autocomplete': canSearch ? 'list' : 'none',
      'aria-activedescendant': visible && shown && treeElement ? activeDescendant : undefined,
      'aria-invalid': field?.invalid || resolvedStatus === 'error' || attributes['aria-invalid'] || undefined,
      'aria-describedby': [attributes['aria-describedby'], field?.describedBy].filter(Boolean).join(' ') || undefined,
      'aria-required': attributes.required ?? field?.required ?? attributes['aria-required'], 'aria-busy': loading || undefined,
      oninput: editorInput, onkeydown: inputKeyboard, onfocus: editorFocus, onblur: editorBlur,
      onpaste: (event: ClipboardEvent & { currentTarget: EventTarget & (EditorElement | HTMLInputElement); }) => {
        pastedText = event.clipboardData?.getData('text');
        attributes.onpaste?.(event);
      },
      oncompositionstart: (event: CompositionEvent & { currentTarget: EventTarget & (EditorElement | HTMLInputElement); }) => {
        composing = true;
        attributes.oncompositionstart?.(event);
      },
      oncompositionend: (event: CompositionEvent & { currentTarget: EventTarget & (EditorElement | HTMLInputElement); }) => {
        composing = false;
        searchInput(event.currentTarget.value, false);
        attributes.oncompositionend?.(event);
      }
    };
    const own = typeof inputSlot === 'object' ? inputSlot.props : undefined;
    if (typeof inputSlot === 'object') Object.assign(generated, { placeholder: placeholderText });
    return { attributes: mergeTreeSelectComponentAttributes(attrs, generated, own, 'input'), register: registerInput };
  }
  function requestOpen(next: boolean, allowBlocked = false) {
    cancelClose();
    if (next && blocked && !allowBlocked || next === visible) return;
    if (next && !blocked) {
      initializePanel();
      mounted = true;
    }
    internalOpen = next;
    onOpenChange?.(next);
  }
  function searchInput(next: string, isComposing = composing, fromTyping = true) {
    const input = editor;
    const decision = treeSelectTokenSearch(next, {
      previousSearch: search, separators: tokenSeparators, composing: isComposing, fromTyping
    });
    internalSearch = decision.search;
    if (decision.open === false) scheduleClose();
    if (decision.notifySearch) searchConfig.onSearch?.(decision.search);
    if (decision.open === true) requestOpen(true, Boolean(inputSlot));

    if (fromTyping && (decision.split || inputSlot || searchConfig.searchValue !== undefined) && input) {
      void tick().then(() => {
        if (!input.isConnected || input !== editor) return;
        if (inputSlot) {
          const value = inputContext.attributes.value;
          if (value != null) input.value = String(value);
        } else input.value = inputValue;
      });
    }
  }
  function publish(
    raw: TreeSelectRawValue[],
    triggerValue?: TreeSelectRawValue
  ) {
    const formatted = treeSelectStrategy(raw, strategy, index);
    if (limit.changeMaxCount && formatted.length > limit.changeMaxCount) return;
    const before = items;
    const nextItems = treeSelectLabels(
      raw.map(value => ({ value })),
      index,
      treeNodeLabelProp,
      before,
      renderedLabel
    );
    internalValue = nextItems;
    if (autoClear)
      internalSearch = '';
    if (!onChange) return;
    const values = conduction ? formatted : raw;
    const returnItems = treeSelectLabels(
      [
        ...values.map(value => ({ value })),
        ...treeCheckStrictly
          ? before.filter(item => item.halfChecked && !values.includes(item.value))
          : []
      ],
      index,
      treeNodeLabelProp,
      before,
      renderedLabel
    );
    const returnValue = labeled ? returnItems : returnItems.map(item => item.value);
    onChange(
      (isMultiple ? returnValue : returnValue[0]) as ValueType,
      labeled ? null : returnItems.map(item => item.label!),
      { triggerValue }
    );
  }
  function choose(
    raw: TreeSelectRawValue,
    source: 'option' | 'selection' = 'option',
    focusInput = true,
    deferClose = false
  ) {
    const node = index.values.get(raw);
    if (blocked
      || source === 'option'
      && (!node
        || Reflect.get(node, 'disabled')
        || limit.disabled.has(raw)
        || checkable
        && treeCheckDisabled(
          index.entities.get(String(raw))!.node
        ))) return;
    const selected = source === 'selection' ? false : !isMultiple || !checks.checked.includes(raw);
    const next = isMultiple
      ? toggleTreeSelect(raw, selected, items, checks, conduction, index)
      : [raw];
    publish(next, raw);
    if (selected)
      onSelect?.(raw, node
        ? { ...node }
        : undefined); else onDeselect?.(
          raw,
          node ? { ...node } : undefined
        );
    if (!isMultiple) {
      if (deferClose) scheduleClose();
      else requestOpen(false);
    }
    if (focusInput) editor?.focus();
  }
  function customTagMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (visible) scheduleClose();
    else requestOpen(true);
  }
  function clearMouseDown(event: MouseEvent) {
    event.preventDefault();
    if (!isMultiple && visible) scheduleClose();
  }
  function pointerOpen(event: PointerEvent | MouseEvent) {
    if (renderTag && event.target instanceof Element
      && event.target.closest('[data-tree-choice-custom-tag]')) return;
    if (blocked || !(event.target instanceof Node)) return;
    if (popup?.contains(event.target)) {
      requestOpen(true);
      return;
    }
    if (event.target instanceof Element
      && event.target.closest('[data-ant-tree-choice-selection-item-remove], [data-ant-tree-choice-clear]')) return;
    const wasOpen = visible;
    const onInput = Boolean(editorContainer && (event.target === editorContainer || editorContainer.contains(event.target)));
    if (editorContainer && !onInput) event.preventDefault();
    const preserveOpen = wasOpen && (!isMultiple && canSearch || isMultiple && onInput);
    focus();
    if (preserveOpen) cancelClose();
    else {
      if (wasOpen) scheduleClose();
      // Source batches focus-open and pointer-open as separate requests.
      else if (visible) onOpenChange?.(true);
      else requestOpen(true);
    }
  }
  function scheduleClose() {
    cancelClose();
    // rc-select useOpen задерживает false через MessageChannel до click/close callbacks.
    const channel = new MessageChannel();
    pendingClose = channel;
    channel.port1.onmessage = () => {
      if (pendingClose !== channel) return;
      requestOpen(false);
    };
    channel.port2.postMessage(null);
  }
  function cancelClose() {
    pendingClose?.port1.close();
    pendingClose?.port2.close();
    pendingClose = undefined;
  }
  function markSelectorMouseDown() {
    selectorMouseDown?.port1.close();
    selectorMouseDown?.port2.close();
    const channel = new MessageChannel();
    selectorMouseDown = channel;
    channel.port1.onmessage = () => {
      if (selectorMouseDown === channel) selectorMouseDown = undefined;
      channel.port1.close();
      channel.port2.close();
    };
    channel.port2.postMessage(null);
  }
  function connectTagElement(node: HTMLElement, value: TreeSelectRawValue) {
    tagElements.set(value, node);
    return () => { if (tagElements.get(value) === node) tagElements.delete(value); };
  }
  function clear() {
    if (blocked) return;
    const hadSearch = Boolean(search);
    onClear?.();
    editor?.focus();
    publish([]);
    if (hadSearch) {
      internalSearch = '';
      searchConfig.onSearch?.('');
    }
  }
  function panelSelect(node: TreeEventNode) {
    choose(node.key as TreeSelectRawValue);
  }
  function expandPanel(keys: TreeKey[]) {
    expandedByUser = true;
    expanded = keys;
    searchExpanded = keys;
    onTreeExpand?.(keys);
  }
  function panelNode(node: TreeEventNode): TreeEventNode<Data> {
    const { key, expanded, selected, checked, halfChecked, loaded, loading, pos, active,
      dragOver, dragOverGapTop, dragOverGapBottom } = node;
    return {
      ...(filteredIndex.values.get(key as TreeSelectRawValue) ?? index.values.get(key as TreeSelectRawValue)),
      key, expanded, selected, checked, halfChecked, loaded, loading, pos, active,
      dragOver, dragOverGapTop, dragOverGapBottom
    } as TreeEventNode<Data>;
  }
  function loadPanel(node: TreeEventNode) {
    return loadData?.(panelNode(node)) ?? Promise.resolve();
  }
  function preserveEditorFocus(event: PointerEvent) {
    // Source OptionList отменяет mousedown только в Tree, не на padding popup.
    if (componentResponsive && event.target instanceof Node
      && !(treeElement ?? menuElement)?.contains(event.target)) return false;
    // Полоса прокрутки сама удерживает фокус при обработке mousedown.
    return !(event.target instanceof Element && event.target.closest('.ant-tree-list-scrollbar'));
  }
  function popupMouseDown() {
    clearTimeout(popupMouseDownTimer);
    popupMouseDownTimer = setTimeout(() => { popupMouseDownTimer = undefined; }, 0);
  }
  function blurWithin(event: FocusEvent) {
    const element = root;
    if (!element) return;
    if (event.relatedTarget instanceof Node
      && (element.contains(event.relatedTarget)
        || popup?.contains(
          event.relatedTarget
        ))) return;
    const mouseDownInPopup = popupMouseDownTimer !== undefined || selectorMouseDown !== undefined;
    queueMicrotask(() => {
      if (!element.isConnected || root !== element) return;
      const target = getPopupActiveElement(element);
      const popupTarget = popup && getPopupActiveElement(popup);
      if (target && element.contains(target)
        || popupTarget && popup?.contains(popupTarget)) return;
      focused = false;
      field?.onBlur();
      if (mouseDownInPopup) return;
      requestOpen(false);
      if (autoClear && isMultiple && !rootSlot && !inputSlot)
        internalSearch = '';
    });
  }
  function inputKeyboard(event: KeyboardEvent & { currentTarget: EventTarget & (EditorElement | HTMLInputElement); }) {
    const nativeCancelled = inputSlot ? treeSelectNativeKeyCancelled(event, onkeydown)
      : (onkeydown?.(event), event.defaultPrevented);
    const cancelled = nativeCancelled
      || event.isComposing || blocked && !inputSlot;
    if (cancelled) cancelledKeys.add(event);
    if (!visible) openingKeys.add(event);
    const directTextarea = Boolean(inputSlot && customInput
      && !('inputElement' in customInput.registration) && editor instanceof HTMLTextAreaElement);
    if (!cancelled && !directTextarea && visible && (event.key === 'ArrowDown' || event.key === 'ArrowUp'))
      event.preventDefault();
    onInputKeyDown?.(event);
    if (directTextarea && !visible && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      cancelledKeys.add(event);
      return;
    }
    if (cancelled || event.ctrlKey || event.altKey || event.metaKey) return;
    // rc-select открывает поле разрешённой клавишей ещё до root handler.
    if (event.key && !/^F(?:[1-9]|1[0-2])$/.test(event.key)
      && event.code !== 'Semicolon' && event.code !== 'Equal'
      && !['Escape', 'Shift', 'Backspace', 'Tab', 'Meta', 'OS', 'Alt', 'Control', 'CapsLock',
        'ContextMenu', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key))
      requestOpen(true, Boolean(inputSlot));
  }
  function keyboard(event: KeyboardEvent & { currentTarget: EventTarget & (RootElement | HTMLDivElement); }) {
    if (forwardedKeys.has(event)) return;
    if (event.target === editor && !cancelledKeys.has(event) && !event.isComposing && (!blocked || inputSlot)) {
      if (inputSlot && openingKeys.has(event) && visible && (event.key === 'Enter' || event.key === ' ')) onOpenChange?.(true);
      handleKeyboard(event, visible && !openingKeys.has(event));
    }
    onKeyDown?.(event);
  }
  function handleKeyboard(event: KeyboardEvent, wasOpen: boolean) {
    if (event.key === 'Escape') {
      if (wasOpen) {
        event.preventDefault();
        event.stopPropagation();
        scheduleClose();
      }
      return;
    }
    if (event.key === 'Tab') {
      requestOpen(false);
      return;
    }
    if (event.key === 'Backspace' && isMultiple && !search) {
      const last = [...display].reverse().find(item => !item.disabled);
      if (last) {
        event.preventDefault();
        choose(last.value, 'selection');
      }
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!wasOpen) {
        requestOpen(true, Boolean(inputSlot));
        return;
      }
      if (enterLocked) return;
      enterLocked = true;
      const node = treeElement?.isConnected && active !== null && index.values.get(active as TreeSelectRawValue);
      if (node && Reflect.get(node, 'selectable') !== false)
        choose(active as TreeSelectRawValue, 'option', true, true);
      return;
    }
    if (event.key === ' ') {
      if (!canSearch) event.preventDefault();
      requestOpen(true);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      if (!wasOpen) {
        if (!inputSlot) requestOpen(true);
        return;
      }
      event.preventDefault();
      const forwarded = new KeyboardEvent('keydown', {
        key: event.key, bubbles: true, cancelable: true, composed: true
      });
      forwardedKeys.add(forwarded);
      treeElement?.querySelector('[role="tree"]')?.dispatchEvent(forwarded);
    }
  }
  export function focus(options?: FocusOptions) {
    const ref = rootSlot ? customRoot?.registration : inputSlot ? customInput?.registration : undefined;
    if (ref && 'nativeElement' in ref && ref.focus) ref.focus(options);
    else if (ref && 'inputElement' in ref && ref.focus) ref.focus(options);
    else (rootSlot ? root : editor)?.focus(options);
  }
  export function blur() {
    const ref = rootSlot ? customRoot?.registration : inputSlot ? customInput?.registration : undefined;
    if (ref && 'nativeElement' in ref && ref.blur) ref.blur();
    else if (ref && 'inputElement' in ref && ref.blur) ref.blur();
    else (rootSlot ? root : editor)?.blur();
  }
  export function scrollTo(settings?: TreeScrollConfig | null) {
    if (!tree) return;
    if (settings && typeof settings === 'object' && 'key' in settings && settings.autoExpand
      && treeExpandedKeys === undefined && componentProps.treeDefaultExpandedKeys === undefined
      && !expandedByUser && !search && !expanded.includes(settings.key)) {
      expanded = [...expanded, settings.key];
    }
    if (visible && shown && listHeight) tree.scrollTo(settings);
  }
</script>
<style>
  [data-ant-tree-choice-control] { display:flex;align-items:center;width:100%;position:relative; }
  [data-ant-tree-choice-content] { min-width:0;position:relative; }
  [data-ant-tree-choice-control]:focus-within { outline:2px solid var(--ant-color-primary);outline-offset:2px; }
  [data-ant-tree-choice-control][data-ant-tree-choice-source-theme] { align-items:flex-start; }
  [data-ant-tree-choice-control][data-ant-tree-choice-source-theme]:focus-within { outline:0;outline-offset:0; }
  [data-ant-tree-choice-control] [data-ant-tree-choice-input] { position:relative;inset:auto;width:100%;min-width:0;padding:0;border:0;outline:0;background:transparent;color:inherit;font:inherit;line-height:inherit;cursor:inherit; }
  [data-ant-tree-choice-input]::placeholder { color:transparent; }
  .placeholder { position:absolute;inset-inline-start:0;max-width:100%;pointer-events:none; }
  [data-ant-tree-choice-multiple] { height:auto;min-height:var(--ant-native-tree-choice-height); }
  [data-ant-tree-choice-component-responsive] { display:inline-flex;min-height:0; }
  [data-ant-tree-choice-component-responsive] [data-ant-tree-choice-input-suffix] { display:block;line-height:1;max-width:calc(100% - 4px); }
  [data-ant-tree-choice-component-responsive] .measure-tag { height:0;overflow-y:hidden;opacity:0;visibility:visible;inset-block-start:auto;inset-inline-start:auto; }
  [data-ant-tree-choice-component-responsive] [data-ant-tree-choice-selection-item] { max-width:none; }
  [data-ant-tree-choice-component-responsive] .custom-tag { display:inline;max-width:none; }
  [data-ant-tree-choice-multiple] [data-ant-tree-choice-content] { gap:0; }
  [data-ant-tree-choice-multiple] [data-ant-tree-choice-input] { flex:1 1 60px;width:60px;min-width:40px;max-width:100%; }
  [data-ant-tree-choice-source-theme][data-ant-tree-choice-multiple] [data-ant-tree-choice-input] { line-height:calc(var(--ant-select-internal_fixed_item_margin) * 2 + var(--ant-native-tree-choice-multi-item-height)); }
  [data-ant-tree-choice-multiple] [data-ant-tree-choice-selection-item] { flex:none;box-sizing:border-box;max-width:100%;min-width:0; }
  [data-ant-tree-choice-source-theme][data-ant-tree-choice-multiple] [data-ant-tree-choice-selection-item] { max-width:calc(100% - var(--ant-select-internal_fixed_item_margin) * 2); }
  [data-ant-tree-choice-selection-item-remove],.clear { padding:0;border:0;background:transparent;cursor:pointer;flex:none; }
  .clear { margin-inline-end:4px;color:var(--ant-color-text-tertiary);display:flex; }
  .suffix { display:flex;flex:none;color:var(--ant-color-text-quaternary); }
  .default-suffix { pointer-events:none; }
  [data-ant-tree-choice-control]:not([data-ant-tree-choice-source-theme]) > .suffix { order:1; }
  [data-ant-tree-choice-source-theme] .clear { display:inline-block;margin-inline-end:0;color:var(--ant-color-text-quaternary); }
  [data-ant-tree-choice-source-theme] .clear:hover { color:var(--ant-color-icon); }
  .clear:focus-visible { opacity:1; }
  [data-ant-tree-choice-source-theme]:has(.clear):hover .suffix,[data-ant-tree-choice-source-theme]:has(.clear:focus-visible) .suffix { opacity:0; }
  .single-snippet { position:absolute;pointer-events:none;inset-inline-start:0; }
  .measure-tag { position:absolute;inset-block-start:0;inset-inline-start:0;visibility:hidden;pointer-events:none; }
  .custom-tag { display:inline-flex;flex:none;min-width:0;max-width:100%; }
  [data-ant-tree-choice-input-suffix] { display:inline-flex;flex:none;min-width:0;max-width:100%; }
  [data-ant-tree-choice-responsive] [data-ant-tree-choice-input] { flex:0 0 auto;min-width:4px; }
  .popup { position:fixed;margin:0;border:0;overflow:visible; }
  [data-ant-tree-choice-selection-item-disabled] { color:var(--ant-select-multiple-item-color-disabled); }
  [data-ant-tree-choice-source-theme] [data-ant-tree-choice-selection-item-disabled] { color:inherit; }
  [data-ant-tree-choice-selection-item-remove]:focus-visible,.clear:focus-visible { outline:2px solid var(--ant-color-primary); }
  @media (hover:none) {
    [data-ant-tree-choice-source-theme]:has(.clear) .suffix { opacity:0; }
  }
</style>
{#snippet labelNode(item:TreeSelectLabeledValue, tag = false)}{#if treeTitleRender && index.values.has(item.value)}{@render treeTitleRender(index.values.get(item.value)!)}{:else}<TreeTitle value={tag ? treeSelectTagText(item.label ?? item.value, maxTagTextLength) : item.label ?? item.value} node={index.values.get(item.value) ?? {}} />{/if}{/snippet}
{#snippet panelTitle(node:TreeDataNode)}
  {@const original = filteredIndex.values.get(node.key as TreeSelectRawValue)}
  {#if treeTitleRender && original}{@render treeTitleRender(original)}{/if}
{/snippet}
{#snippet panelSwitcher(node: TreeEventNode)}
  <TreeTitle value={resolvedSwitcher} {node} />
{/snippet}
{#snippet panelNodeIcon(node: TreeEventNode)}
  {@const original = panelNode(node)}
  <TreeTitle value={Reflect.get(original, 'icon') as TreeSelectNodeIcon<Data>} node={original} />
{/snippet}
{#snippet panelNodeSwitcher(node: TreeEventNode)}
  {@const original = { ...panelNode(node), isLeaf: node.isLeaf }}
  <TreeTitle value={Reflect.get(original, 'switcherIcon') as TreeSelectNodeIcon<Data>} node={original} />
{/snippet}
{#snippet panelLeafIcon(node: TreeEventNode)}
  <TreeTitle value={leafIcon} {node} />
{/snippet}
{#snippet controlPlaceholder()}
  <div class={['placeholder', `${prefix}-placeholder`, classes.placeholder]}
    style={serializeInlineStyleLayers([placeholderQuery ? 'visibility:hidden' : undefined, css.placeholder])}
    aria-hidden={placeholderText !== undefined || undefined}><RenderContent value={placeholder} /></div>
{/snippet}
{#if selectPrefixCss}<ThemeScopeStyle css={selectPrefixCss} scope={`tree-select-control-prefix:${prefix}:${rootPrefix}`} />{/if}{#if treePrefixCss}<ThemeScopeStyle css={treePrefixCss} scope={`tree-select-prefix:${treePrefix}:${rootPrefix}`} />{/if}
{#if popupMotionCss}<ThemeScopeStyle css={popupMotionCss} scope={`tree-select-popup-motion:${prefix}:${rootPrefix}`} />{/if}
{#if renderRoot}
  {#if name ?? field?.name}{#each display as item(item.value)}<input type="hidden" name={name ?? field?.name} value={String(item.value)} disabled={blocked} />{/each}{/if}
  <TreeSelectComponentScope>{@render renderRoot(rootContext)}</TreeSelectComponentScope>
{:else}
<div data-ant-tree-choice-control data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
  data-ant-tree-select-prefix={treePrefix} data-ant-tree-select-root-prefix={rootPrefix}
  data-ant-tree-choice-source-theme={Boolean(selectTheme.className) || undefined}
  data-ant-tree-choice-multiple={isMultiple || undefined}
  data-ant-tree-choice-responsive={responsiveTags || undefined}
  data-ant-tree-choice-component-responsive={componentResponsive || undefined}
  style:--ant-native-tree-choice-height={`var(--${privateNamespace}-select-height)`}
  style:--ant-native-tree-choice-multi-item-height={`var(--${privateNamespace}-select-multi-item-height)`}
  bind:this={defaultRoot} role="presentation" onmousedown={event => {
    pointerOpen(event);
    onMouseDown?.(event);
    if (inputSlot) markSelectorMouseDown();
  }} onmouseenter={onMouseEnter} onmouseleave={onMouseLeave} onclick={event => {
    if (!(event.target instanceof Node && popup?.contains(event.target))) onClick?.(event);
  }}
  onkeydown={keyboard} onkeyup={event => {
    if (event.key === 'Enter') enterLocked = false;
    onKeyUp?.(event);
  }} onfocusin={rootFocus} onfocusout={rootBlur} dir={config.direction}
  style={serializeInlineStyleLayers([componentStyle, css.root, style ?? undefined])} class={[
      `${prefix} ant-select-css-var ant-tree-select-css-var`,
      selectTheme.className,
      selectTheme.className && `${prefix}-source-theme`,
      selectTheme.className && canSearch && `${prefix}-show-search`,
      showArrow && `${prefix}-show-arrow`,
      canClear && `${prefix}-allow-clear`,
      loading && `${prefix}-loading`,
      `${prefix}-${appearance}`,
      isMultiple ? `${prefix}-multiple` : `${prefix}-single`,
      visible && `${prefix}-open`,
      focused && `${prefix}-focused`,
      blocked && `${prefix}-disabled`,
      resolvedSize === 'small' && `${prefix}-sm`,
      resolvedSize === 'large' && `${prefix}-lg`,
      resolvedStatus && `${prefix}-status-${resolvedStatus}`,
      feedback.hasFeedback && `${prefix}-has-feedback`,
      feedback.isFormItemInput && `${prefix}-in-form-item`,
      config.direction === 'rtl' && `${prefix}-rtl`,
      compactClasses(prefix, config.direction, compact),
      className,
      rootClassName,
      classes.root
    ]}>
  {#if name??field?.name}{#each display as item(item.value)}<input type="hidden" name={name ?? field?.name} value={String(item.value)} disabled={blocked} />{/each}{/if}
  {#if leading}<div class={[`${prefix}-prefix`, classes.prefix]} style={css.prefix}><RenderContent value={leading} /></div>{/if}
  <div data-ant-tree-choice-content class={[`${prefix}-content`, inputSlot && !isMultiple && display[0]?.label != null && String(display[0].label).trim() && `${prefix}-content-has-value`, inputSlot && !isMultiple && canSearch && search && `${prefix}-content-has-search-value`, classes.content]} style={css.content} bind:this={tagContent}>
    {#if !display.length && (!isMultiple || !placeholderQuery)}
      {#if componentResponsive}<div data-tree-choice-overflow-prefix style:order={-1}
        class={[`${prefix}-content-item`, `${prefix}-content-item-prefix`]}>{@render controlPlaceholder()}</div>
      {:else}{@render controlPlaceholder()}{/if}
    {/if}
    {#if isMultiple}{#each renderedTags as item, index(item.value)}
      {@const hidden = responsiveTags && (!tagsReady || !visibleTagKeys.has(item.value))}
      {#snippet tagLabel()}{@render labelNode(item, true)}{/snippet}
      {#snippet choiceItem()}
      <span data-ant-tree-choice-selection-item={!renderTag || undefined}
        data-ant-tree-choice-selection-item-disabled={!renderTag && (blocked || item.disabled) || undefined}
        data-tree-choice-tag={!componentResponsive && responsiveTags || undefined}
        data-tree-choice-custom-tag={renderTag ? '' : undefined}
        class={[renderTag ? 'custom-tag' : `${prefix}-selection-item`, !componentResponsive && hidden && 'measure-tag',
          !renderTag && (blocked || item.disabled) && `${prefix}-selection-item-disabled`, !renderTag && classes.item]}
        style={renderTag ? undefined : css.item}
        title={renderTag ? undefined : tagText(item)} role="presentation"
        onmousedown={renderTag ? customTagMouseDown : undefined}
        aria-hidden={!componentResponsive && hidden || undefined} inert={!componentResponsive && hidden}
        {@attach node => connectTagElement(node, item.value)}>
        {#if renderTag}{@render renderTag({
          label: tagLabel, value: item.value, index, disabled: item.disabled,
          closable: !blocked && !item.disabled, isMaxTag: false,
          onClose: event => {
            event?.stopPropagation();
            choose(item.value, 'selection', false);
          }
        })}{:else}
          <span class={[`${prefix}-selection-item-content`, classes.itemContent]} style={css.itemContent}>{@render tagLabel()}</span>{#if !blocked && !item.disabled}
            <button type="button" data-ant-tree-choice-selection-item-remove
              class={[`${prefix}-selection-item-remove`, classes.itemRemove]} style={css.itemRemove}
              aria-label={`${config.locale.removeText ?? 'Remove'} ${tagText(item)}`}
              onpointerdown={event => event.preventDefault()} onclick={() => choose(item.value, 'selection')}>
              {#if removeIcon === undefined}<Icon name="close" />{:else}<RenderContent value={removeIcon ?? '×'} />{/if}
            </button>{/if}
        {/if}
      </span>
      {/snippet}
      {#if componentResponsive}<div data-tree-choice-tag class={[`${prefix}-content-item`, hidden && 'measure-tag']}
        style:order={index} aria-hidden={hidden || undefined} inert={hidden}>{@render choiceItem()}</div>
      {:else}{@render choiceItem()}{/if}
    {/each}
    {#if tagOverflow.omitted.length || responsiveTags && display.length}
      {#snippet restLabel()}
        {#if typeof maxTagPlaceholder === 'function'}{#each omittedTags.pending as binding (binding)}
          <TreeSelectLabelBinding {...binding} />{/each}{@render maxTagPlaceholder(omittedTags.records)}
        {:else if maxTagPlaceholder == null}+ {tagOverflow.omitted.length} ...
        {:else}<TreeTitle value={maxTagPlaceholder} node={{}} />{/if}
      {/snippet}
      {#snippet restItem()}
      <span data-ant-tree-choice-selection-item={!renderTag || undefined}
        data-tree-choice-rest={!componentResponsive && responsiveTags || undefined}
        data-tree-choice-custom-tag={renderTag ? '' : undefined}
        class={[`${prefix}-selection-overflow-item-rest`,
          renderTag ? 'custom-tag' : `${prefix}-selection-item`, !renderTag && classes.item,
          !componentResponsive && hiddenRest && 'measure-tag']}
        style={renderTag ? undefined : css.item}
        title={renderTag ? undefined : placeholderTitle} role="presentation"
        onmousedown={renderTag ? customTagMouseDown : undefined}
        aria-hidden={!componentResponsive && hiddenRest || undefined}
        inert={!componentResponsive && hiddenRest}>
        {#if renderTag}{@render renderTag({
          label: restLabel, isMaxTag: true, disabled: false, closable: false
        })}{:else}<span class={[`${prefix}-selection-item-content`, classes.itemContent]} style={css.itemContent}>{@render restLabel()}</span>{/if}
      </span>
      {/snippet}
      {#if componentResponsive}<div data-tree-choice-rest
        class={[`${prefix}-content-item`, `${prefix}-content-item-rest`, hiddenRest && 'measure-tag']}
        style:order={hiddenRest ? Number.MAX_SAFE_INTEGER : (componentOverflow?.omittedStart ?? 1) - 1}
        aria-hidden={hiddenRest || undefined} inert={hiddenRest}>{@render restItem()}</div>
      {:else}{@render restItem()}{/if}
    {/if}
    {:else if renderInput && display[0]}<span style:visibility={canSearch && search ? 'hidden' : undefined}>{@render labelNode(display[0])}</span>
    {:else if (!visible || !canSearch) && (treeTitleRender || typeof display[0]?.label==='function' || Array.isArray(display[0]?.label)) && display[0]}<span class="single-snippet">{@render labelNode(display[0])}</span>{/if}
    {#if renderInput}{#if isMultiple}<span data-ant-tree-choice-input-suffix
      class={componentResponsive ? `${prefix}-content-item ${prefix}-content-item-suffix` : undefined}
      style:order={componentResponsive ? (componentOverflow?.omittedStart ?? 1) - 1 : undefined}
      bind:this={componentInputSuffix}><TreeSelectComponentScope>{@render renderInput(inputContext)}</TreeSelectComponentScope></span>
    {:else}<TreeSelectComponentScope>{@render renderInput(inputContext)}</TreeSelectComponentScope>{/if}{:else}
    <input {...attributes} bind:this={defaultEditor} id={controlId} data-ant-tree-choice-input class={[`${prefix}-input`, classes.input]} style={css.input} type="text" role="combobox" tabindex={attributes.tabindex ?? tabIndex}
      {...(attributes.autofocus !== undefined || autoFocus !== undefined
        ? { autofocus: attributes.autofocus ?? autoFocus } : {})}
      aria-haspopup="tree" aria-controls={!popupRender || menuElement ? `${controlId}-list` : undefined} aria-expanded={visible} aria-autocomplete={canSearch ? 'list' : 'none'} aria-activedescendant={visible && shown && treeElement ? activeDescendant : undefined} aria-invalid={field?.invalid || resolvedStatus === 'error'
        || attributes['aria-invalid']
        || undefined} aria-describedby={[attributes['aria-describedby'], field?.describedBy].filter(
            Boolean
          )
            .join(
              ' '
            )
            || undefined} aria-required={attributes.required ?? field?.required} aria-busy={loading || undefined} autocomplete="off" disabled={blocked} readonly={!canSearch} placeholder={display.length ? '' : placeholderText} value={inputValue} oninput={event => {
            const next = treeSelectPastedSearch(event.currentTarget.value, pastedText, tokenSeparators);
            pastedText = undefined;
            searchInput(next);
          }} onpaste={event => {
            pastedText = event.clipboardData?.getData('text');
            attributes.onpaste?.(event);
          }} oncompositionstart={event => {
            composing = true;
            attributes.oncompositionstart?.(event);
          }} oncompositionend={event => {
            composing = false;
            searchInput(event.currentTarget.value, false);
            attributes.oncompositionend?.(event);
          }} onkeydown={inputKeyboard} onfocus={event => {
            focused = true;
            editorFocused = true;
            onfocus?.(event);
          }} onblur={event => {
          editorFocused = false;
          enterLocked = false;
          onblur?.(event);
        }} />
    {/if}
  </div>
  {#if suffix != null ? suffix : showArrow}
    <div class={['suffix', defaultSuffix && 'default-suffix', (selectTheme.className || !defaultSuffix) && `${prefix}-suffix`,
        loading && `${prefix}-suffix-loading`, classes.suffix]} style={css.suffix} aria-hidden={defaultSuffix && !feedback.hasFeedback || undefined}>
      {#if typeof suffix === 'function'}{@render suffix({ searchValue: search, open: visible,
          focused: editorFocused, showSearch: suffixSearch, loading })}
      {:else if suffix != null}<RenderContent value={suffix} />
      {:else if defaultSuffix}<Icon name={loading ? 'loading' : visible && suffixSearch ? 'search' : 'down'} />
      {:else}<RenderContent value={suffixIcon} />{/if}{#if suffix == null && feedback.hasFeedback}<FormFeedbackIcon descriptor={feedback.icon} />{/if}
    </div>
  {/if}
  {#if canClear}
    <button type="button" data-ant-tree-choice-clear class={['clear', (selectTheme.className || clearConfig) && `${prefix}-clear`, classes.clear]}
      style={css.clear}
      aria-label={clearConfig?.label ?? config.locale.clearText}
      onkeydown={event => {
        if (event.key === 'Enter' || event.key === ' ') event.stopPropagation();
      }}
      onmousedown={clearMouseDown} onclick={clear}>
      {#if allowClear === true}<Icon name="close-circle-filled" />
      {:else}<RenderContent value={clearConfig?.clearIcon || '×'} />{/if}
    </button>
  {/if}
</div>
{/if}
<NoCompactStyle>{#if mounted}
{@const initialPopupStyle = untrack(() => serializeInlineStyleLayers(popupLayers))}
<div data-ant-select-prefix={prefix} data-ant-select-root-prefix={rootPrefix}
  data-ant-tree-select-motion
  data-ant-tree-select-prefix={treePrefix} data-ant-tree-select-root-prefix={rootPrefix}
  bind:this={popup} role="presentation" popover="manual" hidden={!popupPresent || !shown} dir={config.direction} class={[
    `popup ${prefix}-dropdown ant-select-css-var ${treePrefix}-dropdown ant-tree-select-css-var`,
    selectTheme.className,
    selectTheme.className && 'ant-tree-select-source-popup',
    config.direction === 'rtl' && `${treePrefix}-dropdown-rtl`,
    alignedPopupClass && `${prefix}-dropdown-placement-${alignedPopupClass}`,
    popupMotionState.className,
    !visible && !popupMotionState.present && `${prefix}-dropdown-hidden`,
    rootClassName, classes.root, classes.popup.root
  ]} style={initialPopupStyle}
  {@attach popupStyle.attach}
  {@attach attachPopupMotion}
  {@attach portal}
  onfocusout={blurWithin} onmousedown={customPopup ? popupMouseDown : undefined}>
  {#snippet menu()}
  <div class="popup-body" role="presentation" bind:this={menuElement}
    onpointerdown={customPopup ? event => {
      if (preserveEditorFocus(event)) event.preventDefault();
    } : undefined}>
    {#if filtered.length}<Tree prefixCls="ant-tree" motion={false} _themeStyle={componentStyle} _componentConfig={false} _nodeDisabled={node => limit.disabled.has(node.key as TreeSelectRawValue)} _clearActiveOnMouseMove bind:this={tree} bind:nativeElement={treeElement} treeData={filteredIndex.data} id={`${controlId}-list`} class={treeSelectTheme.className && 'ant-tree-select-source-tree'}
      height={listHeight} {itemHeight} itemScrollOffset={listItemScrollOffset} virtual={panelVirtual} onScroll={onPopupScroll}
      classNames={{ item: classes.popup.item, itemTitle: classes.popup.itemTitle, itemSwitcher: classes.popup.itemSwitcher }}
      styles={{ item: css.popup.item, itemTitle: css.popup.itemTitle, itemSwitcher: css.popup.itemSwitcher }}
      aria-label={attributes['aria-label'] ?? placeholderText ?? config.locale.searchText} focusable={false} multiple={isMultiple} checkable={checkable} checkStrictly checkedKeys={{ checked: checks.checked, halfChecked: checks.halfChecked }} selectedKeys={checkable ? [] : checks.checked} expandedKeys={panelExpanded} expandAction={treeExpandAction} activeKey={active} onActiveChange={key => {
        active = key;
      }} onSelect={(_keys, info) => panelSelect(info.node)} onCheck={(_keys, info) => panelSelect(info.node)} onExpand={expandPanel} loadedKeys={treeLoadedKeys ?? loaded} onLoad={(keys) => {
          onTreeLoad?.(keys);
          if (treeLoadedKeys === undefined)
            loaded = keys;
        }} loadData={visible && !search && loadData ? loadPanel : undefined} {showLine} showIcon={Boolean(treeIcon)} switcherIcon={switcher} titleRender={treeTitleRender ? panelTitle : undefined} filterTreeNode={node => Boolean(
          search
          && String(
            index.values.has(node.key as TreeSelectRawValue)
              ? Reflect.get(index.values.get(node.key as TreeSelectRawValue)!, searchConfig.treeNodeFilterProp ?? 'value')
              : undefined
          ).toLowerCase().includes(
            search.toLowerCase()
          )
        )} />
    {:else}<div id={`${controlId}-list`} role="listbox" class={`${prefix}-empty`}>
      {#snippet nativeEmpty()}{config.locale.emptyText}{/snippet}
      <RenderEmpty componentName="TreeSelect" local={notFoundContent} fallback={nativeEmpty} />
    </div>{/if}
  </div>
  {/snippet}
  {#if popupRender}<TreeSelectPopupContent {popupRender} {menu} />{:else}{@render menu()}{/if}
</div>{/if}</NoCompactStyle>
