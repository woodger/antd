<script lang="ts">
  // Connects the word at the caret to suggestions and mention insertion. The current editor keeps
  // keyboard control.
  import { onDestroy, tick, untrack } from 'svelte';
  import RenderContent from '../RenderContent.svelte';
  import RenderEmpty from '../empty/RenderEmpty.svelte';
  import type {
    MentionsProps, MentionsOption, MentionsPopupRenderInfo, MentionsSemanticProps
  } from './mentions.types';
  import {
    buildMentionMenuRows,
    getMentionMeasure,
    validateMentionSearch,
    filterMentionOption,
    replaceMention
  } from './mentions.engine';
  import { captureMentionsHydrationSelection, connectMentionsMeasure } from './mentions.dom';
  import { useConfig } from '../config-provider/config-context';
  import { getMentionsPrefixCss } from './mentions-prefix.engine';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { useVariant } from '../config-provider/variant.svelte';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useDesignTokenContext } from '../theme/theme-context.svelte';
  import { getInlineZIndex, useZIndex } from '../popup/z-index-context.svelte';
  import { inputCountInfo, inputExceedValue, resolveInputClear } from '../input/input-count.engine';
  import { mergeComponentSemantics } from '../style/semantic-style.engine';
  import { getInlineStyleDeclarations, serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { createOverlayStyle } from '../popup/overlay-style.model.svelte';
  import { useMenuMotion } from '../menu/menu-motion.svelte';
  import { useForm, useFormField } from '../form/form-context';
  import { useFormItemStatusContext } from '../form/form-item-status';
  import { useFormFeedback } from '../form/form-feedback-context';
  import FormFeedbackIcon from '../form/FormFeedbackIcon.svelte';
  import { useCompact } from '../space/space-compact-context';
  import { connectPopup, getPopupActiveElement, type PopupConnection } from '../popup/popup.dom';
  import { createPopupContainer } from '../popup/popup-container.model.svelte.js';
  import MentionsListbox, {
    type MentionsListboxOwner, type MentionsListboxRef
  } from './MentionsListbox.svelte';
  import MentionsPopupContent from './MentionsPopupContent.svelte';
  import Icon from '../icon/Icon.svelte';

  type EditorEvent<T extends Event = Event> = T & { currentTarget: HTMLTextAreaElement; };

  let {
    prefixCls: customizePrefixCls,
    value,
    defaultValue = '',
    options = [],
    prefix = '@',
    split = ' ',
    filterOption = filterMentionOption,
    validateSearch = validateMentionSearch,
    loading = false,
    notFoundContent,
    placement = 'bottom',
    direction,
    transitionName,
    silent,
    autoFocus,
    count,
    maxLength,
    autoSize = false,
    allowClear,
    size,
    status,
    variant,
    onChange,
    onSearch,
    onSelect,
    onClear,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    onCompositionStart,
    onCompositionEnd,
    onPressEnter,
    onResize,
    onPopupScroll,
    getPopupContainer,
    popupRender,
    classNames,
    styles,
    class: className = '',
    rootClassName = '',
    popupClassName = '',
    style,
    id,
    name,
    disabled,
    readonly,
    nativeElement = $bindable(),
    oninput,
    onkeydown,
    onkeyup,
    oncompositionstart,
    oncompositionend,
    ...attributes
  }: MentionsProps = $props();
  const config = useConfig();
  let componentPrefix = $derived(config.getPrefixCls('mentions', customizePrefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getMentionsPrefixCss(componentPrefix, rootPrefix));
  let prefixAttributes = $derived({
    'data-ant-mentions-prefix': componentPrefix, 'data-ant-mentions-global': rootPrefix
  });
  const variantContext = useVariant('mentions', () => ({ variant }));
  let appearance = $derived(variantContext.variant);
  const componentTheme = useComponentTheme('Mentions');
  const designTheme = useDesignTokenContext();
  const form = useForm();
  const controlRef = {
    get nativeElement() {
      return nativeElement;
    },
    focus, blur
  };
  const field = useFormField(() => controlRef);
  const itemStatus = useFormItemStatusContext();
  const feedback = useFormFeedback();
  const compact = useCompact();
  const generated = $props.id();
  let internalValue = $state(untrack(() => value ?? defaultValue));
  let text = $derived(value ?? internalValue);
  let maximum = $derived(maxLength ?? attributes.maxlength ?? undefined);
  let counterVisible = $derived(Boolean(count?.show));
  let counter = $derived(inputCountInfo(text, count, undefined, maximum));
  let blocked = $derived(
    disabled ?? field?.disabled ?? form?.disabled ?? config.componentDisabled
  );
  let resolvedSize = $derived(size ?? compact?.size ?? config.componentSize);
  let resolvedStatus = $derived(status ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let clearConfig = $derived(resolveInputClear(allowClear, config.mentions?.allowClear));
  let hasAffix = $derived(Boolean(clearConfig || feedback.hasFeedback));
  let semanticProps = $derived<MentionsSemanticProps>({
    ...attributes,
    prefixCls: customizePrefixCls,
    value,
    defaultValue,
    options,
    prefix,
    split,
    filterOption,
    validateSearch,
    loading,
    notFoundContent,
    placement,
    direction,
    transitionName,
    silent,
    autoFocus,
    count,
    maxLength,
    autoSize,
    allowClear,
    size,
    status: resolvedStatus,
    variant,
    onChange,
    onSearch,
    onSelect,
    onClear,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    onCompositionStart,
    onCompositionEnd,
    onPressEnter,
    onResize,
    onPopupScroll,
    getPopupContainer,
    popupRender,
    classNames,
    styles,
    class: className,
    rootClassName,
    popupClassName,
    style,
    id,
    name,
    disabled: blocked,
    readonly,
    nativeElement,
    oninput,
    onkeydown,
    onkeyup,
    oncompositionstart,
    oncompositionend
  });
  let semantics = $derived(mergeComponentSemantics(
    config.mentions, semanticProps, ['root', 'textarea', 'popup', 'suffix']
  ));
  let rootStyle = $derived(serializeInlineStyleLayers([
    componentTheme.style, semantics.styles.root
  ]));
  let textareaStyle = $derived(resolveTextareaStyle(semantics.styles.root, semantics.styles.textarea));
  const layer = useZIndex('popup', () => getInlineZIndex(semantics.styles.popup));
  let controlId = $derived(id ?? field?.id ?? `ant-mentions-${generated}`);
  const restoreHydrationSelection = untrack(() => captureMentionsHydrationSelection(controlId));
  let prefixes = $derived(typeof prefix === 'string' ? [prefix] : prefix);
  let measuring = $state(false);
  let query = $state('');
  let token = $state('');
  let location = $state(0);
  let active = $state(0);
  let filtered = $derived<readonly MentionsOption[]>(
    loading
      ? [{ value: 'ANTD_SEARCHING', disabled: true, label: searching }]
      : filterOption === false ? options : options.filter(option => filterOption(query, option))
  );
  let menuRows = $derived(buildMentionMenuRows(filtered));
  let visible = $derived(measuring && !blocked && !readonly);
  let focused = $state(false);
  let editorFocused = $state(false);
  let composing = false;
  let shown = $state(false);
  let mounted = $state(false);
  let root = $state<HTMLDivElement>();
  let editor = $state<HTMLTextAreaElement>();
  let mirror = $state<HTMLDivElement>();
  let prefixElement = $state<HTMLSpanElement>();
  let anchor = $state<HTMLSpanElement>();
  let popup = $state<HTMLDivElement>();
  let listboxes = $state.raw<readonly MentionsListboxRef[]>([]);
  let baseMenuIdClaimed = false;
  let popupContainer = $state<HTMLElement | ShadowRoot>();
  let popupConnection: PopupConnection | undefined;
  const popupShown = $derived(visible && shown);
  // A new KeywordTrigger is created each time it appears. Current native consumers retain the empty
  // hidden wrapper when motion is off.
  const renderPopup = $derived(mounted && (visible || !transitionName));
  const popupMotion = useMenuMotion(() => root, () => popup, () => ({
    motion: {
      motionName: transitionName,
      onAppearPrepare: transitionName ? alignPopupBeforeAppear : undefined
    },
    present: popupShown,
    visible: popupShown,
    inactive: !popupShown,
    enabled: designTheme.state.token.motion
  }));
  const menuInfo = $derived<MentionsPopupRenderInfo>({
    prefixCls: `${componentPrefix}-dropdown`,
    options: filtered,
    opened: popupShown && !popupMotion.state.phase
  });
  const controlledMenus = $derived(visible && listboxes.length
    ? listboxes.map(menu => menu.id).join(' ') : undefined);
  const activeMenuOptionId = $derived.by(() => {
    if (!visible) return;

    for (const menu of listboxes) {
      const optionId = menu.activeId;
      if (optionId !== undefined) return optionId;
    }
  });
  const menuOwner: MentionsListboxOwner = {
    get id() { return controlId; },
    get active() { return active; },
    claimBaseId: claimBaseMenuId,
    register: registerListbox,
    choose,
    activate(index) { active = index; },
    focus: handleMenuFocus,
    blur: handleBlur
  };
  const popupLayers = $derived([
    componentTheme.style, popupMotion.state.style, semantics.styles.popup, layer.style
  ]);
  const popupStyle = createOverlayStyle(() => popupLayers);
  let containerOpen = false;
  function resolvePopupContainer(trigger?: HTMLElement) {
    const getter: (trigger?: HTMLElement) => HTMLElement | ShadowRoot = getPopupContainer!;
    const target = getter(trigger);
    popupContainer = target;

    return target;
  }
  $effect.pre(() => {
    const open = visible;
    // As in rc-trigger, a getter with a parameter waits for the prefix ref. A zero-arity getter can receive undefined.
    if (!getPopupContainer) {
      popupContainer = undefined;
    }
    else if (open && !containerOpen && !getPopupContainer.length) resolvePopupContainer(undefined);
    containerOpen = open;
  });
  const portal = createPopupContainer(() => ({
    open: visible,
    rendered: renderPopup,
    reference: prefixElement,
    getPopupContainer: visible && getPopupContainer ? resolvePopupContainer : undefined,
    get themeStyle() { return serializeInlineStyleLayers(popupLayers); }
  }));
  let measure: ReturnType<typeof connectMentionsMeasure> | undefined;
  let blurTimer: ReturnType<typeof setTimeout> | undefined;
  let previousValue = untrack(() => value);
  let previousFeedback = untrack(() => Boolean(feedback.hasFeedback));
  let previousAffix = untrack(() => hasAffix);
  let previousCounterVisible = untrack(() => counterVisible);
  let editorGeneration = $state(0);
  let alive = true;
  $effect.pre(() => {
    const current = Boolean(feedback.hasFeedback);
    const affix = hasAffix;
    const showCounter = counterVisible;
    const feedbackReplacesEditor = current !== previousFeedback && affix !== previousAffix;
    const counterReplacesEditor = showCounter !== previousCounterVisible;
    previousFeedback = current;
    previousAffix = affix;
    previousCounterVisible = showCounter;
    if (feedbackReplacesEditor || counterReplacesEditor) {
      // Changing the wrapper invalidates the old caret anchor. The persistent allowClear wrapper
      // retains the textarea when feedback changes.
      untrack(() => {
        if (feedbackReplacesEditor) editorGeneration++;
        focused = false;
        editorFocused = false;
        composing = false;
        measuring = false;
        query = '';
        token = '';
        location = 0;
        active = 0;
        if (blurTimer !== undefined) clearTimeout(blurTimer);
      });
    }
  });
  onDestroy(() => {
    alive = false;
    if (blurTimer !== undefined)
      clearTimeout(blurTimer);
  });

  $effect(() => {
    nativeElement = root;
    return () => { nativeElement = undefined; };
  });

  $effect(() => {
    const next = value;
    if (next !== previousValue)
      internalValue = next ?? '';
    previousValue = next;
  });
  $effect(() => {
    if (blocked || readonly)
      measuring = false;
  });
  $effect(() => {
    if (!editor || !mirror) {
      return;
    }
    const element = editor;
    const target = mirror;
    const resize = onResize;
    const sizing = autoSize;
    const connection = untrack(() => connectMentionsMeasure(
      element, target, sizing, resize, () => textareaStyle
    ));
    measure = connection;
    return () => {
      connection.destroy();
      if (measure === connection)
        measure = undefined;
    };
  });
  $effect(() => {
    void text;
    void location;
    void token;
    void semantics;
    void config.mentions?.class;
    void componentTheme.style;
    void tick().then(() => {
      if (alive)
        measure?.sync();
    });
  });
  $effect(() => {
    if (!visible) {
      return;
    }
    mounted = true;
    if (!filtered[active] || filtered[active].disabled)
      active = enabled(0);
  });
  $effect(() => {
    const surface = popup;
    const source = anchor;
    const owner = root;
    if (!visible || !surface || !source || !owner) {
      return;
    }

    const connection = untrack(() => connectPopup(surface, source, {
      trigger: owner,
      get placement() { return placement; },
      get align() { return (direction ?? config.direction) === 'rtl' ? 'right' : 'left'; },
      gap: 4,
      allowZeroSize: () => untrack(() => designTheme.enabled),
      autoAdjustOverflow: true,
      maxWidth: '100vw',
      get preserveFocus() { return !popupRender; },
      pauseAlignment: () => popupMotion.state.step === 'start' || popupMotion.state.step === 'active',
      getAnchorRect: resolvePopupAnchor,
      applyPosition: popupStyle.position,
      onPlacement: () => { },
      onVisibilityChange: next => {
        shown = next;
      },
      onDismiss: reason => {
        measuring = false;
        if (reason === 'escape' && surface.contains(getPopupActiveElement(surface))) {
          editor?.focus({ preventScroll: true });
        }
      }
    }));
    popupConnection = connection;

    return () => {
      if (popupConnection === connection) popupConnection = undefined;
      connection();
    };
  });

  /** Updates coordinates before applying the custom transform. */
  function alignPopupBeforeAppear() {
    popupConnection?.forceAlign();
  }

  /** Explicit direction chooses the measured prefix edge independently of text direction. */
  function resolvePopupAnchor(rect: DOMRect) {
    if (!direction || !prefixElement) {
      return rect;
    }

    const keyword = prefixElement.getBoundingClientRect();
    const left = direction === 'rtl' ? keyword.left : keyword.right;
    return new DOMRect(left, rect.top, 0, rect.height);
  }

  /** RcMentions passes the wrapper's resize setting to the editor unless the textarea slot overrides it. */
  function resolveTextareaStyle(wrapper: string | undefined, leaf: string | undefined) {
    if (!wrapper) {
      return leaf;
    }
    for (const { property } of getInlineStyleDeclarations([leaf])) {
      if (property === 'resize') return leaf;
    }

    let resize: { value: string; priority: '' | 'important'; } | undefined;
    for (const { property, value, priority } of getInlineStyleDeclarations([wrapper])) {
      if (property === 'resize' && (!resize?.priority || priority)) {
        resize = { value, priority: priority ? 'important' : '' };
      }
    }

    return resize ? serializeInlineStyleLayers([leaf, [['resize', resize.value, resize.priority]]])
      : leaf;
  }

  function enabled(start: number, offset = 1) {
    for (let step = 0; step < filtered.length; step++) {
      const index = ((start + step * offset) % filtered.length + filtered.length) % filtered.length;
      if (!filtered[index].disabled) {
        return index;
      }
    }
    return -1;
  }
  function change(next: string) {
    internalValue = next;
    onChange?.(next);
  }

  function bindEditor(element: HTMLTextAreaElement | null | undefined) {
    if (element) restoreHydrationSelection?.(element);
    editor = element ?? undefined;
  }

  function publishEditorInput(event: EditorEvent) {
    if (blocked || readonly) {
      return;
    }

    const element = event.currentTarget;
    const raw = element.value;
    const isComposing = composing || 'isComposing' in event && event.isComposing === true;
    const next = inputExceedValue(raw, count, isComposing);
    const selection = raw !== next ? { start: element.selectionStart, end: element.selectionEnd }
      : undefined;

    change(next);
    if (event.type === 'input') oninput?.(event);

    void tick().then(() => {
      if (!alive || editor !== element || !element.isConnected) {
        return;
      }
      if ((selection || value !== undefined) && element.value !== text) {
        element.value = text;
      }
      if (selection) {
        element.setSelectionRange(selection.start, selection.end);
      }
    });
  }

  function handleCompositionStart(event: EditorEvent<CompositionEvent>) {
    composing = true;
    onCompositionStart?.(event);
    oncompositionstart?.(event);
  }

  function handleCompositionEnd(event: EditorEvent<CompositionEvent>) {
    composing = false;
    if (count) {
      publishEditorInput(event);
    }
    onCompositionEnd?.(event);
    oncompositionend?.(event);
  }

  async function choose(option: MentionsOption) {
    // Loading replaces the editor's options while leaving selection through the custom menu available.
    if (blocked || readonly || option.disabled || !editor) {
      return;
    }
    const selectedEditor = editor;
    const result = replaceMention(
      text,
      {
        location,
        prefix: token,
        target: option.value ?? '',
        selectionStart: editor.selectionStart,
        split
      }
    );
    const selectedPrefix = token;
    change(result.text);
    measuring = false;
    query = '';
    location = 0;
    onSelect?.({ ...option }, selectedPrefix);
    await tick();
    if (alive && editor === selectedEditor && selectedEditor.isConnected) {
      editor.focus({ preventScroll: true });
      editor.setSelectionRange(result.selection, result.selection);
    }
  }
  function handleKeydown(event: EditorEvent<KeyboardEvent>) {
    const { key, isComposing } = event;
    // RcInput calls onPressEnter before onKeyDown when the list is closed.
    if (key === 'Enter' && !isComposing && !visible && !blocked) {
      onPressEnter?.(event);
    }
    onKeyDown?.(event);
    onkeydown?.(event);

    if (!visible || event.defaultPrevented || isComposing) {
      return;
    }

    if ((key === 'ArrowDown' || key === 'ArrowUp') && filtered.length) {
      const offset = key === 'ArrowDown' ? 1 : -1;
      const next = enabled(active + offset, offset);
      if (next >= 0) active = next;
      event.preventDefault();
    }
    else if (key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      measuring = false;
    }
    else if (key === 'Enter') {
      event.preventDefault();
      if (silent ?? loading) {
        return;
      }
      const index = filtered[active] && !filtered[active].disabled ? active : enabled(0);
      if (index < 0) {
        measuring = false;
      }
      else {
        void choose(filtered[index]);
      }
    }
  }
  function handleKeyup(event: EditorEvent<KeyboardEvent>) {
    const { currentTarget, key } = event;
    // Search uses the caret position at keyup even if the consumer handler moves it.
    const beforeCaret = currentTarget.value.slice(0, currentTarget.selectionStart);
    const found = getMentionMeasure(beforeCaret, prefixes);

    onKeyUp?.(event);
    onkeyup?.(event);

    if (blocked || readonly || ['Escape', 'ArrowUp', 'ArrowDown', 'Enter'].includes(key)) {
      return;
    }
    if (found.location < 0) {
      measuring = false;
      return;
    }

    const next = beforeCaret.slice(found.location + found.prefix.length);
    const valid = validateSearch(next, split);
    const matches = loading
      || options.some(
        option => filterOption === false || filterOption(next, option)
      );
    if (valid) {
      if (key === found.prefix
        || ['Shift', 'Alt', 'AltGraph'].includes(key)
        || measuring
        || next !== query
        && matches) {
        query = next;
        token = found.prefix;
        location = found.location;
        active = 0;
        measuring = true;
      }
      onSearch?.(next, found.prefix);
    }
    else {
      measuring = false;
    }
  }
  function handleFocus(event: FocusEvent) {
    editorFocused = true;
    if (blurTimer !== undefined)
      clearTimeout(blurTimer);
    if (!focused)
      onFocus?.(event);
    focused = true;
  }
  function handleBlur(event: FocusEvent) {
    if (event.target === editor) editorFocused = false;
    if (blurTimer !== undefined)
      clearTimeout(blurTimer);
    blurTimer = setTimeout(() => {
      blurTimer = undefined;
      focused = false;
      measuring = false;
      field?.onBlur();
      onBlur?.(event);
    }, 0);
  }
  function handleMenuFocus() {
    if (blurTimer !== undefined) clearTimeout(blurTimer);
    focused = true;
  }
  /** The first list keeps the previous IDs. Live copies retain their assigned suffixes. */
  function claimBaseMenuId() {
    if (baseMenuIdClaimed) {
      return;
    }

    baseMenuIdClaimed = true;
    return () => {
      baseMenuIdClaimed = false;
    };
  }

  /** ARIA lists are ordered by attachment, including copies rendered later. */
  function registerListbox(menu: MentionsListboxRef) {
    listboxes = [...listboxes, menu];
    return () => {
      listboxes = listboxes.filter(registered => registered !== menu);
    };
  }
  function clear() {
    if (!clearConfig || blocked || readonly || clearConfig.disabled) {
      return;
    }
    change('');
    measuring = false;
    editor?.focus();
    onClear?.();
  }
  export function focus(options?: FocusOptions) {
    editor?.focus(options);
  }
  export function blur() {
    editor?.blur();
  }
</script>

<style>
  [data-ant-mentions-root] { max-width: 100%; }
  :where([data-ant-mentions-root]) > [data-ant-mentions-textarea] {
    display: block;
    width: 100%;
    min-width: 0;
  }
  [data-ant-mentions-measure] {
    position: absolute;
    inset: 0 auto auto 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
    white-space: pre-wrap;
  }
  .caret-anchor {
    display: inline-block;
    width: 1px;
    height: 1em;
    vertical-align: text-bottom;
  }
  .popup {
    position: fixed;
    margin: 0;
    border: 0;
    overflow: auto;
  }
  [data-ant-mentions-clear] {
    position: absolute;
    inset-inline-end: var(--ant-padding-xs);
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    padding: 0;
    border: 0;
    color: var(--ant-color-text-quaternary);
    background: transparent;
    cursor: pointer;
  }
  [data-ant-mentions-clear]:focus-visible { outline: 2px solid var(--ant-color-primary); }
  [data-ant-mentions-feedback-suffix] > [data-ant-mentions-clear] {
    position: static;
    transform: none;
  }
</style>

{#snippet clearControl()}
  {#if clearConfig && text && !blocked && !readonly}<button data-ant-mentions-clear type="button" class={[
    `${componentPrefix}-clear ${componentPrefix}-clear-icon`, feedback.hasFeedback && `${componentPrefix}-clear-icon-has-suffix`
  ]} aria-label={config.locale.clearText}
    disabled={clearConfig.disabled} onpointerdown={event => event.preventDefault()} onclick={clear}>
    {#if clearConfig.clearIcon === undefined}<Icon name="close" />{:else}<RenderContent value={clearConfig.clearIcon} />{/if}
  </button>{/if}
{/snippet}

{#snippet searching()}<Icon name="loading" />{/snippet}

{#snippet menu(overrides: Partial<MentionsPopupRenderInfo> = {})}
  {@const menuPrefix = overrides.prefixCls ?? menuInfo.prefixCls}
  {@const rows = overrides.options === undefined ? menuRows : buildMentionMenuRows(overrides.options)}
  <MentionsListbox
    owner={menuOwner}
    {rows}
    prefix={menuPrefix}
    label={attributes['aria-label'] ?? config.locale.searchText}
    {loading}
    opened={overrides.opened ?? menuInfo.opened}
    onScroll={onPopupScroll}
    loadingIndicator={searching}
  >
    {#snippet empty()}
      {#snippet nativeEmpty()}{config.locale.emptyText}{/snippet}
      <RenderEmpty componentName="Mentions" local={notFoundContent} fallback={nativeEmpty} />
    {/snippet}
  </MentionsListbox>
{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`mentions-prefix:${componentPrefix}:${rootPrefix}`} />{/if}<div {...prefixAttributes} data-ant-mentions-root bind:this={root} style={rootStyle}
  dir={config.direction}
  class={[
      `${componentPrefix} ant-mentions-css-var`,
      componentTheme.className,
      `${componentPrefix}-${appearance}`,
      hasAffix && `${componentPrefix}-has-suffix ${componentPrefix}-affix-wrapper`,
      focused && `${componentPrefix}-focused`,
      blocked && `${componentPrefix}-disabled`,
      config.direction === 'rtl' && `${componentPrefix}-rtl`,
      resolvedSize === 'large' && `${componentPrefix}-lg`,
      resolvedSize === 'small' && `${componentPrefix}-sm`,
      resolvedStatus && `${componentPrefix}-status-${resolvedStatus}`,
      config.mentions?.class,
      className,
      rootClassName,
      semantics.classes.root
    ]}>
  {#snippet editorControl()}
    {@const hasNativeDefault = untrack(() => count !== undefined && typeof document !== 'undefined')}
    <!-- RcInput sets the DOM property defaultValue before value to preserve the initial caret position. -->
    <textarea
      {...(hasNativeDefault ? { defaultValue: text } : {})}
      {...attributes}
      data-ant-mentions-textarea
      bind:this={() => editor, bindEditor}
      id={controlId}
      name={name ?? field?.name}
      rows={attributes.rows ?? 1}
      maxlength={maximum}
      class={[
        `${componentPrefix}-textarea`,
        config.direction === 'rtl' && `${componentPrefix}-textarea-rtl`,
        !counterVisible && counter.exceeded && 'rc-textarea-out-of-range',
        semantics.classes.textarea
      ]}
      style={textareaStyle}
      dir={attributes.dir ?? config.direction}
      value={text}
      {readonly}
      disabled={blocked}
      required={attributes.required ?? field?.required}
      role="combobox"
      aria-expanded={visible}
      {...(attributes.autofocus !== undefined || autoFocus !== undefined
        ? { autofocus: attributes.autofocus ?? autoFocus } : {})}
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-controls={controlledMenus}
      aria-activedescendant={activeMenuOptionId}
      aria-label={attributes['aria-label'] ?? field?.label}
      aria-invalid={field?.invalid || resolvedStatus === 'error'
        || attributes['aria-invalid']
        || undefined}
      aria-describedby={[attributes['aria-describedby'], field?.describedBy].filter(Boolean)
        .join(' ') || undefined}
      oninput={publishEditorInput}
      onkeydown={handleKeydown}
      onkeyup={handleKeyup}
      oncompositionstart={handleCompositionStart}
      oncompositionend={handleCompositionEnd}
      onfocus={handleFocus}
      onblur={handleBlur}
    ></textarea>
  {/snippet}
  {#key editorGeneration}
    {#if counterVisible}
      {@const content = counter.content}
      <span
        class={[
          'rc-textarea-affix-wrapper',
          blocked && 'rc-textarea-disabled rc-textarea-affix-wrapper-disabled',
          editorFocused && !blocked && 'rc-textarea-affix-wrapper-focused',
          readonly && 'rc-textarea-affix-wrapper-readonly',
          counter.exceeded && 'rc-textarea-out-of-range'
        ]}
        data-count={typeof content === 'string' ? content : undefined}
      >{@render editorControl()}<span class="rc-textarea-suffix">
        <span class="rc-textarea-data-count">
          {#if typeof content === 'function'}
            {@render content(counter.info)}
          {:else if typeof content !== 'boolean'}
            {content}
          {/if}
        </span>
      </span></span>
    {:else}
      {@render editorControl()}
    {/if}
    <div data-ant-mentions-measure bind:this={mirror} class={`${componentPrefix}-measure`} aria-hidden="true">{text.slice(0, location)}{#if visible}<span bind:this={prefixElement}>{token}</span>{:else}{token}{/if}<span bind:this={anchor} class="caret-anchor"></span>{text.slice(location + token.length)}</div>
  {/key}
  {#if hasAffix}<span data-ant-mentions-feedback-suffix
    class={[`${componentPrefix}-suffix`, semantics.classes.suffix]}
    style={semantics.styles.suffix}>{@render clearControl()}{#if feedback.hasFeedback && feedback.icon}<FormFeedbackIcon descriptor={feedback.icon} />{/if}</span>{/if}
  {#key popupContainer}
    {#if renderPopup}
      {@const initialPopupStyle = untrack(popupStyle.initialStyle)}
      <div {...prefixAttributes} bind:this={popup} popover="manual" hidden={!popupShown}
        class={['popup', `${componentPrefix}-dropdown ant-mentions-css-var`,
          componentTheme.className, semantics.classes.popup, popupClassName, rootClassName,
          popupMotion.state.className]}
        style={initialPopupStyle} {@attach popupStyle.attach}
        dir={config.direction} {@attach portal}
        onanimationend={popupMotion.end} ontransitionend={popupMotion.end}>
        {#if popupRender}
          {#if visible}<MentionsPopupContent {popupRender} {menu} info={menuInfo} />{/if}
        {:else}{@render menu()}{/if}
      </div>
    {/if}
  {/key}
</div>
