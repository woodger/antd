<script lang="ts" generics="DateType extends object">
  // Согласует текст редактора, выбранную дату и текущую панель. Навигация, предварительный ввод и
  // commit выполняются раздельно.
  import { tick, untrack } from 'svelte';
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import type {
    DatePickerCalendarMode, DatePickerProps, DatePickerMode, DatePickerMultipleProps,
    DatePickerPicker, DatePickerPreset
  } from './date-picker.types';
  import { createMultiplePicker, emptyPickerDates } from './date-picker-multiple.model.svelte';
  import { normalizePickerFieldFormat } from './picker-mask.engine';
  import { createPickerMaskInput, type PickerMaskSharedKey } from './picker-mask-input.model.svelte.js';
  import {
    createPickerEditor, isPickerInputEvent, pickerEditorMaskEvents, type PickerEditorEvent
  } from './picker-editor.model.svelte.js';
  import type { DatePickerEditorAttributes, DatePickerPanelContext } from './picker-components.types';
  import { createPickerPanelEngine, pickerPanelClock, pickerPanelSlot } from './picker-panel.engine';
  import { createDatePickerEngine, pickerFormats, nextPickerPanelMode } from './date-picker.engine';
  import { datePickerEnUS } from './date-picker.locale';
  import { useConfig } from './config-context';
  import { getPickerPrefixCss } from './picker-prefix.engine';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { useVariant } from './variant.svelte';
  import { useComponentTheme } from './theme-component.svelte';
  import { connectComponentTheme } from './theme-component.dom';
  import { createOverlayStyle } from './overlay-style.model.svelte';
  import { useForm, useFormField } from './form-context';
  import { useFormItemStatusContext } from './form-item-status';
  import { useFormFeedback } from './form-feedback-context';
  import FormFeedbackIcon from './FormFeedbackIcon.svelte';
  import { useCompact } from './space-compact-context';
  import { compactClasses } from './space-compact.engine';
  import { connectPopup, getPopupActiveElement } from './popup.dom';
  import {
    createPickerPopup, focusPickerPanel, getPickerPopupPosition, keepPickerEditorFocus,
    preservePickerPanelFocus, retainPickerReplacementFocus
  } from './picker-popup.model.svelte.js';
  import NoCompactStyle from './NoCompactStyle.svelte';
  import PickerConfirmButton from './PickerConfirmButton.svelte';
  import PickerEditor from './PickerEditor.svelte';
  import PickerPanelReplacement from './PickerPanelReplacement.svelte';
  import DatePickerCalendar from './DatePickerCalendar.svelte';
  import DatePickerSelectionTags from './DatePickerSelectionTags.svelte';
  import DatePickerTimePanel, { type DatePickerTimeScrollMemory }
    from './DatePickerTimePanel.svelte';
  import Icon from './Icon.svelte';
  import PickerCalendarIcon from './PickerCalendarIcon.svelte';
  import PickerClockIcon from './PickerClockIcon.svelte';
  import PickerTimePanel from './PickerTimePanel.svelte';
  import { createRangeInteraction } from './range-picker-interaction.engine';
  import {
    createTimePickerEngine, datePickerClock, timePickerClock, timePickerFormats, timePickerLang
  } from './time-picker.engine';
  import { timePickerSemantic } from './time-picker-semantic.engine';
  import { datePickerSemantic } from './date-picker-semantic.engine';
  import type { TimePickerRuntimeProps, TimePickerPreset } from './time-picker.types';
  let {
    dateOperations,
    time,
    rootTimeProps,
    standaloneTime = false,
    dateProps,
    multipleOptions,
    value,
    defaultValue,
    showTime: providedShowTime = false,
    picker = 'date',
    mode: providedMode,
    showWeek,
    format,
    pickerValue,
    defaultPickerValue,
    open,
    defaultOpen = false,
    disabledDate,
    disabledTime,
    minDate,
    maxDate,
    needConfirm,
    allowClear,
    inputReadOnly,
    preserveInvalidOnBlur = false,
    showNow: providedShowNow,
    presets,
    previewValue = 'hover',
    size,
    status,
    prefix: prefixContent,
    suffixIcon,
    variant,
    locale,
    onChange,
    onCalendarChange,
    onOk,
    onClear,
    onPickerValueChange,
    onOpenChange,
    onPanelChange,
    renderExtraFooter,
    cellRender,
    components,
    prevIcon,
    nextIcon,
    superPrevIcon,
    superNextIcon,
    panelRender,
    placement,
    disabled,
    id,
    name,
    onkeydown,
    onblur,
    onfocus,
    class: className = '',
    rootClassName = '',
    prefixCls,
    classNames,
    styles,
    getPopupContainer,
    style,
    nativeElement = $bindable(),
    ...attributes
  }: Omit<DatePickerProps<DateType>, 'picker'> & {
    dateOperations: PickerDateOperations<DateType>;
    picker?: DatePickerPicker;
    time?: TimePickerRuntimeProps<DateType>;
    rootTimeProps?: DatePickerProps<DateType>;
    standaloneTime?: boolean;
    dateProps?: DatePickerProps<DateType>;
    multipleOptions?: DatePickerMultipleProps<DateType>;
  } = $props();
  const dates = untrack(() => dateOperations);
  const { generateConfig: adapter, fields } = dates;
  const calendar = createDatePickerEngine(dates);
  const {
    pickerCalendarValue, pickerDateWithCalendar, samePickerPanelValue, formatPicker, parsePicker,
    pickerDateDisabled, pickerTimeDisabled, validPickerTime
  } = calendar;
  const { pickerPanelOutsideBounds } = createPickerPanelEngine(dates, calendar);
  const { timePickerSameValue, timePickerDateDisabled, timePickerValidTime } =
    createTimePickerEngine(dates, calendar);

  const config = useConfig();
  let prefix = $derived(config.getPrefixCls('picker', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getPickerPrefixCss(prefix, rootPrefix));
  const dateVariant = useVariant('datePicker', () => ({ variant }));
  const timeVariant = useVariant('timePicker', () => time ?? {});
  const componentTheme = useComponentTheme('DatePicker');
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
  const generatedId = $props.id();
  const initialValue = untrack(() => defaultValue ?? null);
  const initialDates = untrack(() => multipleOptions
    ? multipleOptions.defaultValue ?? emptyPickerDates
    : defaultValue ? [defaultValue] : emptyPickerDates);
  const initialSelection = untrack(() => {
    if (!multipleOptions) return undefined;

    return multipleOptions.value === undefined ? initialDates : multipleOptions.value ?? emptyPickerDates;
  });
  let internalValue = $state.raw<DateType | null>(initialValue);
  // Переключение multiple меняет представление общего списка, сохраняя принятые даты.
  let dateValues = $state.raw<readonly DateType[]>(initialDates);
  let mergedValue = $derived.by(() => {
    if (multipleOptions) return null;
    if (time && !rootTimeProps) return value === undefined ? internalValue : value;

    return value === undefined ? dateValues[0] ?? null : value;
  });
  let internalOpen = $state(untrack(() => defaultOpen));
  let blocked = $derived(
    disabled ?? field?.disabled ?? form?.disabled ?? config.componentDisabled
  );
  let visible = $derived((open ?? internalOpen) && !blocked);
  let actualLocale = $derived(
    { ...datePickerEnUS.lang, ...config.locale.datePicker?.lang, ...locale?.lang }
  );
  let showTime = $derived(!multipleOptions && (time || picker === 'date') ? providedShowTime : false);
  let formats = $derived(time ? timePickerFormats(time, actualLocale)
    : pickerFormats({ format, showTime, picker }, actualLocale));
  let maskFormat = $derived(normalizePickerFieldFormat<DateType>(time ? time.format : format, '').mask);
  let readOnly = $derived(
    time && typeof formats[0] === 'function'
      || (inputReadOnly ?? (attributes.readonly || formats.every(item => typeof item === 'function')))
  );
  let confirm = $derived(needConfirm ?? Boolean(showTime));
  let showNow = $derived(providedShowNow === undefined ? true : providedShowNow);
  let resolvedSize = $derived(size ?? compact?.size ?? config.componentSize);
  let resolvedStatus = $derived((time ? time.status : status)
    ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let now = $state.raw(untrack(() => adapter.getNow()));
  let draft = $state.raw<DateType | null>(untrack(() => mergedValue));
  let internalPanel = $state.raw(
    untrack(
      () => pickerValue ?? defaultPickerValue ?? mergedValue
        ?? initialSelection?.[0]
        ?? (time ? dates.startOf(now, 'day') : now)
    )
  );
  let panel = $derived(pickerValue ?? internalPanel);
  let terminalMode = $derived(time ? 'time' as const : picker);
  let localMode = $state<DatePickerMode>(untrack(() => terminalMode));
  let mode = $derived(providedMode ?? localMode);
  let authoredMode = $state(false);
  let replacementMode = $derived(pickerPanelSlot(mode, Boolean(showTime)));
  let panelReplacement = $derived(components?.[replacementMode]);
  let navigationIcons = $derived({ prevIcon, nextIcon, superPrevIcon, superNextIcon });
  let previousPickerMode = untrack(() => ({ picker: terminalMode, open: visible, controlled: false }));
  $effect.pre(() => {
    const current = { picker: terminalMode, open: visible, controlled: providedMode !== undefined };
    const switchedPicker = current.picker !== previousPickerMode.picker;
    const switchedTime = switchedPicker
      && (current.picker === 'time' || previousPickerMode.picker === 'time');
    if (switchedTime || (!time || rootTimeProps) && (current.controlled
      || previousPickerMode.controlled || current.open && (switchedPicker
        || current.picker !== 'date' && !previousPickerMode.open))) {
      localMode = current.picker;
      authoredMode = false;
    }
    previousPickerMode = current;
  });
  let text = $state(
    untrack(
      () => formatPicker(
        value === undefined ? initialValue : value,
        actualLocale.locale,
        formats
      )
    )
  );
  let dirty = $state(false);
  let invalidTimeInput = $state(false);
  let quarterInputValue = $state.raw<DateType | null>(null);
  let draftSource = $state<'input' | 'panel'>('input');
  let focused = $state(false);
  let nativeInput = $state<HTMLInputElement>();
  const customInput = createPickerEditor(node => maskInput.attach(node, true));
  let input = $derived(!multipleOptions && components?.input ? customInput.element : nativeInput);
  let rootElement = $state<HTMLDivElement>();
  let popup = $state<HTMLDivElement>();
  const panelFocus = preservePickerPanelFocus(() => ({
    popup, mode, date: dates.formatKey(panel, 'YYYY-MM-DD', actualLocale.locale), controlled: providedMode !== undefined,
    editor: input
  }));
  retainPickerReplacementFocus(() => ({ popup, panel: panelReplacement, count: 1, prefix }));
  let datePanelContainer = $state<HTMLDivElement>();
  let retainedDateSelection = $state<'preset' | 'panel'>();
  let shown = $state(false);
  let actualPlacement = $derived(
    placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft')
  );
  let popupPlacement = $state<'top' | 'bottom'>('bottom');
  let invalid = $derived(
    time
      ? !!draft && !valid(draft) || invalidTimeInput
      : text !== '' && !valid(picker === 'date' || picker === 'quarter' || picker === 'week'
        ? dirty && draftSource === 'input' ? quarterInputValue : draft
        : parsePicker(text, actualLocale.locale, formats)) && !readOnly
  );
  let clockFormat = $derived(typeof rootTimeProps?.showTime === 'object'
    ? rootTimeProps.showTime?.format : undefined);
  let clock = $derived(time ? timePickerClock(
    clockFormat === undefined ? time : { ...time, format: clockFormat }, actualLocale)
    : datePickerClock({ format, showTime }, actualLocale));
  let timeFormat = $derived(
    clock.format ?? (typeof formats[0] === 'string' ? formats[0] : 'HH:mm:ss')
  );
  let panelLocale = $derived(timePickerLang(
    typeof showTime === 'object' ? showTime : {},
    actualLocale
  ));
  let datePanelValue = $derived(pickerCalendarValue(panel, clock.defaultOpenValue));
  let restrictions = $derived({ minDate, maxDate, disabledDate });
  let hoverValue = $state.raw<DateType | null>(null);
  let timeLocale = $derived(time ? timePickerLang(time, actualLocale) : undefined);
  let replacementValue = $derived(time ? panel : datePanelValue);
  let previousValue = untrack(() => value);
  let previousMergedValue = untrack(() => mergedValue);
  let formattedDateValue = $derived(time ? undefined
    : formatPicker(mergedValue, actualLocale.locale, formats));
  let previousDateText = untrack(() => formattedDateValue);
  let previousTimeMode = untrack(() => Boolean(time));
  let wasVisible = untrack(() => visible);
  let datePanelWasOpen = false;
  let previousDateCalendar = untrack(() => draft);
  let panelWasOpen = false;
  const dateTimeScroll: DatePickerTimeScrollMemory = new Map();
  let dateTimePanel = $state<{ captureScroll: () => void }>();
  let actualVariant = $derived(time && standaloneTime ? timeVariant.variant : dateVariant.variant);
  let pickerConfig = $derived(time && !rootTimeProps ? config.timePicker : config.datePicker);
  let dateSemantic = $derived.by(() => {
    const settings = config.datePicker;
    const providerStyle = settings?.style;
    if (rootTimeProps) {
      const { classNames, styles } = rootTimeProps;
      const props = { ...rootTimeProps, size: resolvedSize, disabled: blocked, status, variant };
      return datePickerSemantic(props, settings, classNames, styles, providerStyle);
    }
    if (multipleOptions) {
      if (!(settings?.classNames || settings?.styles
        || multipleOptions.classNames || multipleOptions.styles || providerStyle)) {
        return undefined;
      }
      const props = { ...multipleOptions, size: resolvedSize, disabled: blocked, status, variant };

      return datePickerSemantic(
        props, settings, multipleOptions.classNames, multipleOptions.styles, providerStyle
      );
    }
    if (!dateProps || !(settings?.classNames || settings?.styles
      || classNames || styles || providerStyle)) {
      return undefined;
    }

    // Исходные props приходят из публичной обёртки. Core сохраняет receiver своих callbacks.
    const props = { ...dateProps, size: resolvedSize, disabled: blocked, status, variant };
    return datePickerSemantic(props, settings, classNames, styles, providerStyle);
  });
  let timeSemantic = $derived(time && !rootTimeProps ? timePickerSemantic(time, config.timePicker, {
    variant: actualVariant,
    size: resolvedSize,
    disabled: blocked
  }, standaloneTime) : undefined);
  let semantic = $derived(timeSemantic ?? dateSemantic);
  let timeCellRender = $derived(rootTimeProps?.cellRender ?? time?.cellRender);
  let localClearConfig = $derived(time ? time.allowClear : allowClear);
  let providerClearConfig = $derived(pickerConfig?.allowClear);
  let clearEnabled = $derived(localClearConfig ?? providerClearConfig ?? true);
  let clearContent = $derived.by(() => {
    const local = typeof localClearConfig === 'object' ? localClearConfig?.clearIcon : undefined;
    const context = typeof providerClearConfig === 'object'
      ? providerClearConfig?.clearIcon : undefined;
    return local !== undefined ? local : context;
  });
  let leadingContent = $derived(time ? time.prefix : prefixContent);
  let showLeadingContent = $derived(leadingContent != null && leadingContent !== ''
    && leadingContent !== false && (!time || leadingContent !== true));
  let suffixContent = $derived(time
    ? time.suffixIcon === undefined ? pickerConfig?.suffixIcon : time.suffixIcon
    : suffixIcon !== undefined ? suffixIcon : pickerConfig?.suffixIcon);
  let placeholderText = $derived(time
    ? attributes.placeholder ?? locale?.timePickerLocale?.placeholder
      ?? config.locale.datePicker?.timePickerLocale?.placeholder
      ?? datePickerEnUS.timePickerLocale.placeholder
    : attributes.placeholder ?? (picker === 'week' ? actualLocale.weekPlaceholder
      : picker === 'quarter' ? actualLocale.quarterPlaceholder
      : picker === 'month' ? actualLocale.monthPlaceholder
      : picker === 'year' ? actualLocale.yearPlaceholder : actualLocale.placeholder));
  let displayText = $derived(hoverValue
    ? formatPicker(hoverValue, actualLocale.locale, formats) : text);
  let formattedTimeDraft = $derived(time
    ? formatPicker(draft, actualLocale.locale, formats) : undefined);
  let timeInputSize = $derived.by(() => {
    if (!time) {
      return undefined;
    }
    const first = formats[0];
    const length = typeof first === 'function' ? first(now).length : first.length;
    return Math.max(8, length) + 2;
  });
  const maskInput = createPickerMaskInput(() => ({
    text: displayText, mask: maskFormat, active: focused, helped: !!hoverValue,
    readOnly, preserveInvalidOnBlur,
    validateText: next => !!parsePicker(next, actualLocale.locale, formats),
    acceptInput: next => inputChange(next, true),
    onHelp: () => requestOpen(true, true)
  }));
  const maskEvents = pickerEditorMaskEvents(maskInput, () => attributes);
  const multiplePicker = createMultiplePicker({
    get props() { return multipleOptions; },
    get local() { return dateValues; },
    set local(next) { dateValues = next; },
    get picker() { return picker; },
    get locale() { return actualLocale.locale; },
    get formats() { return formats; },
    get disabled() { return blocked; },
    valid
  }, dates, calendar);
  let multipleText = $derived(multipleOptions ? multiplePicker.values.map(multiplePicker.format).join(',') : '');
  let replacementSelection = $derived(multipleOptions ? multiplePicker.values : draft ? [draft] : []);
  let showDateNow = $derived(!multipleOptions && mode === 'date' && showNow);
  let showTimeCurrent = $derived(showNow && (mode === 'time' || mode === 'date'));
  $effect(() => maskInput.sync());
  const timeInteraction = createRangeInteraction<DateType[]>({
    fieldCount: () => 1,
    needConfirm: () => confirm,
    allowEmpty: () => [false],
    getCalendarValue: () => [draft ? [draft] : null],
    triggerCalendarChange: (_index, next) => {
      setDraft(next?.[0] ?? null, 'time');
      text = formatPicker(draft, actualLocale.locale, formats);
    },
    flushSubmit: (_index, all) => {
      if (all) {
        commit(draft);
        requestOpen(false);
      }
    },
    resetValue: resetTimeValue
  });

  const dateSelectionInteraction = createRangeInteraction<DateType[]>({
    fieldCount: () => 1,
    needConfirm: () => confirm,
    allowEmpty: () => [false],
    getCalendarValue: () => [draft ? [draft] : null],
    triggerCalendarChange: (_index, next) => {
      const candidate = next?.[0] ?? null;
      if (!timePickerSameValue(candidate, draft)) {
        setDraft(candidate, 'date');
        text = formatPicker(draft, actualLocale.locale, formats);
      }
    },
    flushSubmit: (_index, all) => {
      if (all) {
        if (draft) submitDateSelection(draft);
        requestOpen(false);
      }
    },
    resetValue: () => {
      if (!timePickerSameValue(mergedValue, draft)) {
        setDraft(mergedValue, 'date');
        if (visible) syncDatePanel(false);
      }
      resetText();
    }
  });

  const popupThemeStyle = $derived(
    [componentTheme.style, semantic?.styles.popup.root].filter(Boolean).join(';') || undefined
  );
  const datePopupStyle = untrack(() =>
    time && !rootTimeProps ? undefined : createOverlayStyle(() => [popupThemeStyle]));

  // Авторские декларации следуют после координат и обновляются на той же панели.
  function attachPopupStyle(node: HTMLElement) {
    return datePopupStyle
      ? datePopupStyle.attach(node) : connectComponentTheme(node, popupThemeStyle);
  }

  const container = createPickerPopup(() => ({
    open: visible,
    reference: rootElement,
    getPopupContainer: getPopupContainer || config.getPopupContainer,
    themeStyle: popupThemeStyle
  }));
  let dateTimeTarget = untrack(() => container.target);
  $effect.pre(() => {
    const target = container.target;
    if (target !== dateTimeTarget) {
      dateTimeTarget = target;
      dateTimeScroll.clear();
    }
    else if (visible && mode !== 'time' && (!showTime || mode !== 'date')) {
      dateTimeScroll.clear();
    }
    else if (!visible) untrack(() => dateTimePanel?.captureScroll());
  });
  $effect(() => {
    nativeElement = rootElement;
    return () => { nativeElement = undefined; };
  });
  $effect(() => {
    if (time && !rootTimeProps && value !== previousValue) internalValue = value ?? null;
    previousValue = value;
  });
  $effect(() => {
    const formatted = formattedDateValue;
    const timeMode = Boolean(time);
    const switchedEditorMode = timeMode !== previousTimeMode;
    previousTimeMode = timeMode;
    // Context repaint не сбрасывает draft, пока value и его отображение прежние.
    if (!switchedEditorMode && mergedValue === previousMergedValue
      && (time || formatted === previousDateText)) {
      return;
    }

    if (!switchedEditorMode && !time && mergedValue === previousMergedValue) {
      text = formatPicker(draft, actualLocale.locale, formats);
      previousDateText = formatted;
      return;
    }

    text = formatted ?? formatPicker(mergedValue, actualLocale.locale, formats);
    draft = mergedValue;
    dirty = false;
    retainedDateSelection = undefined;
    previousMergedValue = mergedValue;
    previousDateText = formatted;
  });
  $effect(() => {
    if (formattedTimeDraft !== undefined) {
      text = formattedTimeDraft;
      invalidTimeInput = false;
    }
  });
  $effect(() => {
    if (time) {
      return;
    }
    const opened = visible;
    const calendar = multipleOptions ? multiplePicker.values[0] ?? null : draft;
    const opening = opened && !datePanelWasOpen;
    const changed = calendar !== previousDateCalendar;
    datePanelWasOpen = opened;
    previousDateCalendar = calendar;
    if (!opened || !opening && !changed) {
      return;
    }
    untrack(() => {
      if (opening && multipleOptions) multiplePicker.open();
      syncDatePanel(opening);
    });
  });
  $effect.pre(() => {
    if (!time && !visible && datePanelContainer
      && getPopupActiveElement(datePanelContainer) === datePanelContainer) {
      datePanelContainer.blur();
      focused = false;
    }
  });
  $effect(() => {
    const next = visible;
    if (wasVisible && !next) {
      hoverValue = null;
      if (time) {
        untrack(() => timeInteraction.trigger(0, 'popupClose'));
      }
      else if (multipleOptions) {
        untrack(() => multiplePicker.close(confirm));
      }
      else {
        untrack(() => {
          if (retainedDateSelection) {
            dateSelectionInteraction.trigger(0, 'popupClose');
          }
          else {
            dateSelectionInteraction.reset();
          }
        });
      }
    }
    wasVisible = next;
  });
  $effect(() => {
    const opened = visible;
    if (time && opened) {
      const next = !panelWasOpen && defaultPickerValue ? defaultPickerValue
        : !defaultPickerValue ? draft : null;
      if (next) untrack(() => syncTimePickerValue(next, 'reset'));
    }
    panelWasOpen = opened;
  });
  $effect(() => {
    if (!visible || !popup || !rootElement) {
      return;
    }
    return connectPopup(popup, rootElement, {
      placement: actualPlacement.startsWith('top') ? 'top' : 'bottom',
      align: actualPlacement.endsWith('Right') ? 'right' : 'left',
      autoAdjustOverflow: true,
      maxWidth: '100vw',
      gap: 4,
      applyPosition: datePopupStyle
        ? position => untrack(() => datePopupStyle.position(position)) : undefined,
      getPosition: (reference, bounds, viewport) => getPickerPopupPosition(
        reference,
        bounds,
        viewport,
        actualPlacement
      ),
      matchAnchorWidth: true,
      preserveFocus: event => keepPickerEditorFocus(event, popup,
        !time && Boolean(cellRender || panelRender || renderExtraFooter)),
      onVisibilityChange: next => {
        shown = next;
      },
      onPlacement: next => {
        popupPlacement = next === 'top' ? 'top' : 'bottom';
      },
      onDismiss: reason => {
        const keepSelection = !time && retainedDateSelection;
        const cancelPanel = reason === 'escape' && retainedDateSelection === 'panel';
        if (time) {
          if (reason === 'escape') timeInteraction.trigger(0, 'esc');
          requestOpen(false);
        }
        else if (cancelPanel) {
          dateSelectionInteraction.trigger(0, 'esc');
          requestOpen(false);
        }
        else if (keepSelection) {
          closeDateSelection();
        }
        else {
          finish(false);
        }
        if (reason === 'escape' && (!keepSelection || cancelPanel))
          input?.focus();
      }
    });
  });
  $effect(() => {
    if (blocked) {
      internalOpen = false;
      if (!time) resetText();
    }
  });
  function valid(next: DateType | null) {
    if (time) {
      return Boolean(next && fields.isValidate(next)
        && !timePickerDateDisabled(next, time)
        && !pickerTimeDisabled(next, { showTime: clock, disabledTime }));
    }
    return Boolean(
      next && fields.isValidate(next)
      && !pickerDateDisabled(next, { minDate, maxDate, disabledDate }, picker, actualLocale.locale)
      && !pickerTimeDisabled(
        next,
        { showTime, disabledTime }
      )
    );
  }
  function requestOpen(next: boolean, preserveDraft = false) {
    if (blocked || visible === next) {
      return;
    }
    if (next) {
      now = adapter.getNow();
      if (!time && !retainedDateSelection && !preserveDraft) draft = mergedValue;
      localMode = terminalMode;
      authoredMode = false;
      if (time) timeInteraction.trigger(0, 'field-switch');
    }
    if (open === undefined)
      internalOpen = next;
    onOpenChange?.(next);
  }
  function resetText() {
    retainedDateSelection = undefined;
    text = formatPicker(mergedValue, actualLocale.locale, formats);
    dirty = false;
    draft = mergedValue;
  }
  function setDraft(next: DateType | null, source: 'date' | 'time') {
    const changed = time ? !timePickerSameValue(next, draft)
      : !dates.sameValue(next, draft);
    draft = next;
    if (changed)
      onCalendarChange?.(next, formatPicker(next, actualLocale.locale, formats), { source });
  }
  function commit(next: DateType | null) {
    if (!time) dateSelectionInteraction.reset();
    if (!time && blocked || next && !valid(next)) {
      return false;
    }
    const changed = time ? !timePickerSameValue(next, mergedValue)
      : !dates.sameValue(next, mergedValue);
    setDraft(next, time ? 'time' : 'date');
    if (time && !rootTimeProps) {
      internalValue = next;
    }
    else if (value === undefined) {
      storeDate(next);
    }
    dirty = false;
    if (changed)
      onChange?.(next, formatPicker(next, actualLocale.locale, formats));
    if (!time) void tick().then(resetText);
    return true;
  }
  /** Одиночное подтверждение заменяет принятый список одной датой. */
  function storeDate(next: DateType | null) {
    dateValues = next ? [next] : [];
  }
  function finish(confirmed: boolean) {
    if (multipleOptions) {
      if (!confirmed || multiplePicker.confirm()) {
        requestOpen(false);
      }
      return;
    }
    if (time) {
      if (confirmed) {
        if (!draft && clock.defaultOpenValue)
          timeInteraction.trigger(0, 'panel-intermediate', [clock.defaultOpenValue]);
        if (draft) onOk?.(draft);
        timeInteraction.trigger(0, 'confirm');
      }
      else {
        requestOpen(false);
      }
      return;
    }
    if (confirmed && retainedDateSelection) {
      if (!valid(draft)) {
        return;
      }
      if (draft) onOk?.(draft);
      dateSelectionInteraction.trigger(0, 'confirm');
      return;
    }
    if (confirmed && picker !== 'date') {
      if (!valid(draft)) {
        return;
      }
      if (draft) onOk?.(draft);
      if (!commit(draft)) {
        return;
      }
      requestOpen(false);
      return;
    }
    if (confirmed) {
      if (!valid(draft) || !commit(draft)) {
        return;
      }
      if (draft)
        onOk?.(draft);
    }
    else if (!confirm && dirty) {
      if (!text) {
        commit(null);
      }
      else {
        const parsed = draftSource === 'panel'
          ? draft
          : parsePicker(text, actualLocale.locale, formats);
        if (valid(parsed))
          commit(parsed);
      }
    }
    if (!preserveInvalidOnBlur || !invalid)
      resetText();
    requestOpen(false);
  }
  function syncDatePanel(opening: boolean) {
    if (defaultPickerValue && !opening) {
      return;
    }
    const selectedDate = multipleOptions ? multiplePicker.values[0] : draft;
    let next = defaultPickerValue ?? selectedDate ?? now;
    if (!defaultPickerValue) {
      if (minDate && dates.isAfter(minDate, next)) next = minDate;
      if (maxDate && dates.isAfter(next, maxDate)) next = maxDate;
    }
    setDatePanel(next, 'reset');
  }
  function setDatePanel(
    next: DateType,
    source: 'reset' | 'panel',
    event?: { previous: DateType; mode: DatePickerMode }
  ) {
    const previous = event?.previous ?? panel;
    if (pickerValue === undefined) internalPanel = next;
    if (!samePickerPanelValue(previous, next, Boolean(showTime), picker, actualLocale.locale))
      onPickerValueChange?.(next, { source, mode: event?.mode ?? mode });
  }
  function navigate(next: DateType) {
    if (authoredMode || time) {
      navigateReplacement(next);
      return;
    }
    if (providedMode !== undefined) {
      setDatePanel(next, 'panel');
      onPanelChange?.(next, mode);
      return;
    }
    if (picker !== 'date') {
      setDatePanel(next, 'panel');
      onPanelChange?.(next, mode);
      return;
    }
    const target = minDate && dates.isBefore(dates.endOf(next, 'month'), minDate)
      ? minDate
      : maxDate && dates.isAfter(dates.startOf(next, 'month'), maxDate) ? maxDate : next;
    if (pickerValue === undefined)
      internalPanel = target;
    onPickerValueChange?.(target, { source: 'panel', mode });
    onPanelChange?.(target, mode);
  }
  function publishMode(next: DatePickerMode, date: DateType) {
    if (providedMode === undefined) {
      localMode = next;
    }
    onPanelChange?.(date, next);
  }
  function changeMode(next: DatePickerCalendarMode, viewDate?: DateType) {
    if (authoredMode || time) {
      changeReplacementMode(next, viewDate);
      return;
    }
    if (providedMode !== undefined) {
      const headerDate = mode === 'date' || mode === 'week' ? viewDate : undefined;
      if (headerDate) {
        setDatePanel(headerDate, 'panel');
      }
      publishMode(next, viewDate ?? datePanelValue);
      return;
    }
    publishMode(next, picker === 'date' ? panel : viewDate ?? datePanelValue);
  }
  function selectPanelMode(
    next: DatePickerMode,
    date: DateType,
    event: { previous: DateType; mode: DatePickerMode }
  ) {
    // PickerPanel.triggerModeChange(viewDate) повторно задаёт view до события mode.
    setDatePanel(date, 'panel', event);
    publishMode(next, picker === 'date' && providedMode === undefined ? panel : date);
  }
  function selectIntermediateDate(
    date: DateType,
    event: { previous: DateType; mode: DatePickerMode },
    source: 'date' | 'time' = 'date'
  ) {
    const nextMode = nextPickerPanelMode(picker, event.mode);
    retainedDateSelection = providedMode !== undefined ? 'panel' : undefined;
    draftSource = 'panel';
    setDraft(date, source);
    text = formatPicker(date, actualLocale.locale, formats);
    dirty = true;

    // Два setter'а React используют один снимок предыдущей панели.
    setDatePanel(date, 'panel', event);
    if (nextMode) {
      selectPanelMode(nextMode, date, event);
    }
  }
  function selectDate(next: DateType) {
    if (time || authoredMode && mode !== picker) {
      selectReplacement(next);
      return;
    }
    if (multipleOptions) {
      selectMultipleDate(next);
      return;
    }
    const event = { previous: panel, mode };
    retainedDateSelection = undefined;
    dateSelectionInteraction.trigger(0, 'panel-intermediate');
    if (mode !== picker && (picker !== 'date' || providedMode !== undefined)) {
      selectIntermediateDate(next, event);
      return;
    }
    if (picker === 'date' && mode !== 'date') {
      internalPanel = next;
      onPickerValueChange?.(next, { source: 'panel', mode });
      changeMode(mode === 'decade' ? 'year' : mode === 'year' ? 'month' : 'date');
      return;
    }
    const base = draft ?? datePanelValue;
    const candidate = showTime
      ? validPickerTime(
        pickerDateWithCalendar(base, next),
        clock,
        disabledTime
      )
      : next;
    if (pickerDateDisabled(candidate, restrictions, picker, actualLocale.locale)) {
      return;
    }
    draftSource = 'panel';
    setDraft(candidate, 'date');
    text = formatPicker(candidate, actualLocale.locale, formats);
    dirty = true;
    if (!confirm && !showTime && commit(candidate)) {
      requestOpen(false);
      if (picker === 'date') input?.focus();
    }
    setDatePanel(candidate, 'panel', picker !== 'date' || providedMode !== undefined
      ? event : undefined);
  }
  /** Переход между уровнями панели сохраняет текущий набор выбранных периодов. */
  function selectMultipleDate(value: DateType) {
    const event = { previous: panel, mode };
    if (mode !== picker) {
      const nextMode = nextPickerPanelMode(picker, mode);
      setDatePanel(value, 'panel', event);
      if (nextMode) {
        selectPanelMode(nextMode, value, event);
      }
      return;
    }
    if (valid(value)) {
      multiplePicker.select(value);
      setDatePanel(value, 'panel', event);
    }
  }
  function selectTime(value: DateType) {
    if (time && mode !== terminalMode) {
      selectReplacement(value);
      return;
    }
    if (time) {
      dirty = true;
      draftSource = 'panel';
      timeInteraction.trigger(0, 'panel-intermediate', [value]);
      syncTimePickerValue(value, 'panel');
      return;
    }
    retainedDateSelection = undefined;
    dateSelectionInteraction.trigger(0, 'panel-intermediate');
    const next = validPickerTime(value, clock, disabledTime);
    if (mode === 'time') {
      const event = { previous: panel, mode };
      if (multipleOptions) {
        selectMultipleDate(next);
      }
      else {
        selectIntermediateDate(next, event, 'time');
      }
      return;
    }
    draftSource = 'panel';
    setDraft(next, 'time');
    setDatePanel(next, 'panel');
    text = formatPicker(next, actualLocale.locale, formats);
    dirty = true;
  }

  /** Сохраняет снимок даты просмотра для повторного setter при переходе режима. */
  function setReplacementValue(next: DateType, event = { previous: panel, mode }) {
    if (time) {
      syncTimePickerValue(next, 'panel', event);
    }
    else {
      setDatePanel(next, 'panel', event);
    }
  }

  function navigateReplacement(next: DateType) {
    const event = { previous: panel, mode };
    setReplacementValue(next, event);
    (time?.onPanelChange ?? onPanelChange)?.(next, event.mode);
  }

  function changeReplacementMode(next: DatePickerMode, date?: DateType) {
    const shown = date ?? replacementValue;
    if (date) {
      setReplacementValue(date);
    }
    publishReplacementMode(next, shown);
  }

  function publishReplacementMode(next: DatePickerMode, date: DateType) {
    if (providedMode === undefined) {
      localMode = next;
      authoredMode = true;
    }
    (time?.onPanelChange ?? onPanelChange)?.(date, next);
  }

  /** Панель уже построила целое значение, включая точное время и календарный день. */
  function selectReplacement(date: DateType) {
    const event = { previous: panel, mode };
    const terminal = event.mode === terminalMode;
    const nextMode = nextPickerPanelMode(terminalMode, event.mode);
    const source = terminal && !showTime ? 'panel-final' : 'panel-intermediate';

    draftSource = 'panel';
    if (time) {
      dirty = true;
      timeInteraction.trigger(0, source, [date]);
    }
    else if (multipleOptions) {
      if (terminal) multiplePicker.select(date);
    }
    else {
      retainedDateSelection = 'panel';
      dirty = true;
      if (event.mode === 'time') setDraft(date, 'time');
      dateSelectionInteraction.trigger(0, source, [date]);
      text = formatPicker(draft, actualLocale.locale, formats);
    }
    setReplacementValue(date, event);
    if (nextMode) {
      setReplacementValue(date, event);
      publishReplacementMode(nextMode, date);
    }
  }

  function replacementDisabled(date: DateType, { type }: { type: DatePickerMode; }) {
    const localDisabled = rootTimeProps
      ? rootTimeProps.disabledDate?.(date, { type })
      : time
      ? time.disabledDate?.(date, { type: 'time' })
      : disabledDate?.(date, { type: type === 'time' ? 'date' : type });
    return Boolean(localDisabled) || pickerPanelOutsideBounds(date, { minDate, maxDate },
      type, actualLocale.locale);
  }

  function replacementContext(): Omit<DatePickerPanelContext<DateType>, 'cellRender'> {
    const values = replacementSelection.length || !time || !clock.defaultOpenValue
      ? replacementSelection : [clock.defaultOpenValue];
    const hover = hoverValue ? [hoverValue, ...replacementSelection] : replacementSelection;
    return {
      mode: replacementMode,
      prefixCls: prefix,
      locale: timeLocale ?? panelLocale,
      generateConfig: adapter,
      pickerValue: replacementValue,
      value: values[0],
      values: [...values],
      hoverValue: multipleOptions ? [...hover] : hover.slice(0, 1),
      hoverRangeValue: null,
      showTime: showTime ? pickerPanelClock(clock, {
        defaultOpenValue: clock.defaultOpenValue,
        disabledTime, changeOnScroll: time?.changeOnScroll, showNow: providedShowNow
      }) : null,
      showWeek,
      minDate,
      maxDate,
      ...navigationIcons,
      disabledDate: replacementDisabled,
      onPickerValueChange: navigateReplacement,
      onModeChange: changeReplacementMode,
      onSelect: selectReplacement,
      onHover: time ? handleTimeHover : handleDateHover
    };
  }

  function inputChange(next: string, masked = false) {
    if (!time && !masked) requestOpen(true);
    if (!time) {
      retainedDateSelection = undefined;
      dateSelectionInteraction.trigger(0, 'input');
    }
    text = next;
    dirty = true;
    draftSource = 'input';
    const parsed = parsePicker(text, actualLocale.locale, formats);
    if (!time && (picker === 'date' || picker === 'quarter' || picker === 'week')) quarterInputValue = parsed;
    if (time) {
      invalidTimeInput = text !== '' && !(parsed && fields.isValidate(parsed));
      timeInteraction.trigger(0, 'input', parsed && fields.isValidate(parsed) ? [parsed] : undefined);
    }
    else if (parsed && valid(parsed)) {
      setDraft(parsed, 'date');
      if (picker === 'date' && !defaultPickerValue) internalPanel = parsed;
    }
  }
  function keyboard(event: PickerEditorEvent<KeyboardEvent>) {
    const shared = (_event: KeyboardEvent, maskKey?: PickerMaskSharedKey) => {
      if (isPickerInputEvent(event)) {
        onkeydown?.(event);
      }
      if (event.defaultPrevented || event.isComposing || blocked) {
        return false;
      }
      void keyboardAction(event, maskKey);
      return true;
    };
    if (!maskInput.keydown(event, shared)) shared(event);
  }
  async function keyboardAction(
    event: PickerEditorEvent<KeyboardEvent>,
    maskKey?: PickerMaskSharedKey
  ) {
    if (time) {
      if (event.key === 'Tab') {
        timeInteraction.trigger(0, 'keyboard-submit-weak');
      }
      else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        timeInteraction.trigger(0, 'esc');
        requestOpen(false);
      }
      else if (event.key === 'Enter') {
        event.preventDefault();
        const closed = !visible;
        if (maskKey ? maskKey.enterValid : parsePicker(text, actualLocale.locale, formats))
          timeInteraction.trigger(0, 'keyboard-submit');
        if (closed) requestOpen(true);
      }
      else if (event.key === 'ArrowDown' && !maskKey) {
        event.preventDefault();
        requestOpen(true);
        await tick();
        if (panelReplacement || mode !== 'time') {
          focusPickerPanel(popup, mode, dates.formatKey(replacementValue, 'YYYY-MM-DD', actualLocale.locale));
          return;
        }
        (popup?.querySelector<HTMLButtonElement>(
          '[data-picker-time-cell-selected] button:not(:disabled)'
        ) ?? popup?.querySelector<HTMLButtonElement>(
          'button[data-picker-time-control]:not(:disabled)'
        ))
          ?.focus();
      }
      return;
    }
    if (event.key === 'Escape') {
      if (visible || retainedDateSelection) {
        event.preventDefault();
        event.stopPropagation();
        dateSelectionInteraction.trigger(0, 'esc');
        requestOpen(false);
      }
      else {
        dateSelectionInteraction.reset();
      }
    }
    else if (event.key === 'Tab') {
      if (retainedDateSelection) {
        dateSelectionInteraction.trigger(0, 'keyboard-submit-weak');
      }
      else if (draft) dateSelectionInteraction.reset();
    }
    else if (event.key === 'Enter' && retainedDateSelection) {
      event.preventDefault();
      const closed = !visible;
      const parsed = parsePicker(event.currentTarget.value, actualLocale.locale, formats);
      if (maskKey ? maskKey.enterValid : parsed) dateSelectionInteraction.trigger(0, 'keyboard-submit');
      if (closed) requestOpen(true);
    }
    else if (event.key === 'Enter') {
      event.preventDefault();
      if (!visible) {
        if (parsePicker(text, actualLocale.locale, formats)) dateSelectionInteraction.reset();
        requestOpen(true);
      }
      else {
        if (maskKey && !maskKey.enterValid) {
          return;
        }
        if ((picker === 'date' || picker === 'quarter' || picker === 'week') && dirty
          && draftSource === 'input' && text !== '' && !quarterInputValue) {
          return;
        }
        if (picker === 'date' && dirty && draftSource === 'input' && text !== '' && invalid) {
          return;
        }
        const next = text ? draft : null;
        if (!text || valid(next)) {
          commit(next);
          requestOpen(false);
        }
      }
    }
    else if (event.key === 'ArrowDown' && (picker === 'date' || providedMode !== undefined)
      && !maskKey) {
      event.preventDefault();
      if (!visible)
        requestOpen(true);
      await tick();
      focusPickerPanel(popup, mode, dates.formatKey(panel, 'YYYY-MM-DD', actualLocale.locale));
    }
  }
  function editorInput(event: PickerEditorEvent<Event>) {
    if (!maskInput.nativeInput(event)) {
      inputChange(event.currentTarget.value);
    }
  }
  function editorClick() {
    if (!time) {
      requestOpen(true);
    }
  }
  function editorFocus(event: PickerEditorEvent<FocusEvent>) {
    maskInput.focus();
    focused = true;
    if (time) {
      timeInteraction.trigger(0, 'field-switch');
    }
    else {
      dateSelectionInteraction.trigger(0, 'field-switch');
    }
    if (isPickerInputEvent(event)) {
      onfocus?.(event);
    }
  }
  function editorBlur(event: PickerEditorEvent<FocusEvent>) {
    maskInput.blur();
    if (isPickerInputEvent(event)) {
      onblur?.(event);
    }
    blurWithin(event);
  }

  /** Стандартный и пользовательский редакторы используют один набор событий. */
  function editorAttributes(): DatePickerEditorAttributes {
    const nativeAttributes: object = attributes;
    const describedBy = [attributes['aria-describedby'], field?.describedBy].filter(Boolean);
    return {
      ...nativeAttributes,
      id: id ?? field?.id,
      name: name ?? field?.name,
      placeholder: placeholderText,
      type: 'text',
      role: 'combobox',
      'aria-haspopup': 'dialog',
      'aria-expanded': visible,
      'aria-controls': `ant-picker-${generatedId}`,
      'aria-invalid': invalid || field?.invalid || resolvedStatus === 'error'
        || attributes['aria-invalid'] || undefined,
      'aria-describedby': describedBy.join(' ') || undefined,
      class: semantic?.classes.input,
      style: semantic?.styles.input,
      size: timeInputSize,
      disabled: blocked,
      readonly: readOnly,
      required: attributes.required ?? field?.required,
      autocomplete: 'off',
      value: maskInput.value,
      defaultValue: maskInput.value,
      oninput: editorInput,
      ...maskEvents,
      onclick: editorClick,
      onkeydown: keyboard,
      onfocus: editorFocus,
      onblur: editorBlur
    };
  }
  function blurWithin(event?: FocusEvent) {
    if (event?.relatedTarget instanceof Node
      && (rootElement?.contains(event.relatedTarget)
        || popup?.contains(
          event.relatedTarget
        ))) {
      return;
    }
    queueMicrotask(() => {
      // Удалённый компонент уже не владеет фокусом и derived ref редактора.
      const root = rootElement;
      if (!root?.isConnected) {
        return;
      }
      const editor = input;
      if (!editor?.isConnected) {
        return;
      }
      const active = popup ? getPopupActiveElement(popup) : editor.ownerDocument.activeElement;
      if (panelFocus.moving && (!active || active === editor.ownerDocument.body)
        || active && (root.contains(active) || popup?.contains(active))) {
        return;
      }
      focused = false;
      field?.onBlur();
      if (visible || dirty) {
        if (!time && retainedDateSelection) {
          closeDateSelection();
        }
        else {
          finish(false);
        }
      }
      if (time && !preserveInvalidOnBlur) {
        text = formatPicker(draft, actualLocale.locale, formats);
        invalidTimeInput = false;
      }
    });
  }
  function resetTimeValue() {
    const changed = !timePickerSameValue(draft, mergedValue);
    setDraft(mergedValue, 'time');
    if (changed) text = formatPicker(draft, actualLocale.locale, formats);
    dirty = false;
  }
  function syncTimePickerValue(
    next: DateType,
    source: 'reset' | 'panel',
    event = { previous: panel, mode }
  ) {
    const { previous } = event;
    if (pickerValue === undefined) internalPanel = next;
    if (!dates.sameTime(previous, next)) {
      time?.onPickerValueChange?.(next, { source, mode: event.mode });
    }
  }
  function handleTimeHover(next: DateType | null) {
    if (!time || time.previewValue === false) {
      return;
    }
    hoverValue = next;
    if (!next) text = formatPicker(draft, actualLocale.locale, formats);
  }
  function datePresetValue(preset: DatePickerPreset<DateType>) {
    const candidate = preset.value;
    return typeof candidate === 'function' ? candidate() : candidate;
  }
  function handleDateHover(next: DateType | null) {
    if (previewValue !== 'hover') {
      return;
    }
    hoverValue = next;
  }
  function handleDateCellHover(next: DateType | null) {
    if (next && showTime) {
      const base = draft ?? datePanelValue;
      next = pickerDateWithCalendar(base, next);
    }
    else if (next) {
      next = pickerCalendarValue(next);
    }
    if (time) {
      handleTimeHover(next);
    }
    else {
      handleDateHover(next);
    }
  }
  function closeDateSelection() {
    requestOpen(false);
    if (!visible && datePanelContainer
      && getPopupActiveElement(datePanelContainer) === datePanelContainer) {
      datePanelContainer.blur();
      focused = false;
    }
  }
  function selectDatePreset(preset: DatePickerPreset<DateType>) {
    if (blocked) {
      return;
    }
    datePanelContainer?.focus();
    focused = true;
    const next = datePresetValue(preset);
    if (multipleOptions) {
      multiplePicker.preset(next);
      return;
    }
    retainedDateSelection = 'preset';
    dirty = false;
    draftSource = 'panel';
    text = formatPicker(next, actualLocale.locale, formats);
    if (submitDateSelection(next)) closeDateSelection();
  }
  function submitDateSelection(next: DateType) {
    // Выбор меняет calendar до validation; popupClose управляет сессией отдельно.
    if (!timePickerSameValue(next, draft)) setDraft(next, 'date');
    if (!fields.isValidate(next) || disabledDate?.(next, { type: picker })
      || pickerDateDisabled(next, { minDate, maxDate }, picker, actualLocale.locale)
      || pickerTimeDisabled(next, { showTime, disabledTime })) {
      return false;
    }
    const changed = !timePickerSameValue(next, mergedValue);
    if (value === undefined) storeDate(next);
    if (changed) onChange?.(next, formatPicker(next, actualLocale.locale, formats));
    return true;
  }
  function handleRootClick(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement; }) {
    if ((!time && !multipleOptions) || blocked) {
      return;
    }
    if (!rootElement?.contains(event.currentTarget.ownerDocument.activeElement)) input?.focus();
    requestOpen(true);
    if (time) (time.onclick ?? time.onClick)?.(event);
  }
  /** Передаёт фокус в календарь, когда пользователь работает с тегами клавиатурой. */
  async function multipleKeyboard(
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement; }
  ) {
    onkeydown?.(event);
    if (event.defaultPrevented || event.isComposing || blocked) {
      return;
    }
    if (event.key === 'Enter' && (!visible || confirm)) {
      event.preventDefault();
      if (visible) finish(true);
      else requestOpen(true);
    }
    else if (event.key === 'ArrowDown') {
      event.preventDefault();
      requestOpen(true);
      await tick();

      const firstCell = popup?.querySelector<HTMLButtonElement>('button[data-picker-date]:not(:disabled)');
      const focusedCell = popup?.querySelector<HTMLButtonElement>(
        'button[data-picker-date][tabindex="0"]:not(:disabled)'
      );
      (focusedCell ?? firstCell)?.focus();
    }
  }
  /** Удаление по клавиатуре возвращает фокус полю, если кнопка исчезает. */
  function removeMultipleDate(date: DateType, event?: MouseEvent) {
    if (blocked) {
      return;
    }
    event?.stopPropagation();
    const active = rootElement ? getPopupActiveElement(rootElement) : null;
    const refocus = active !== input && rootElement?.contains(active);
    multiplePicker.remove(date, visible);
    if (refocus) input?.focus();
  }
  function selectPreset(preset: TimePickerPreset<DateType>) {
    const next = typeof preset.value === 'function' ? preset.value() : preset.value;
    timeInteraction.reset();
    setDraft(next, 'time');
    if (commit(next)) requestOpen(false);
  }
  export function focus(options?: FocusOptions & { cursor?: 'start' | 'end' | 'all'; }) {
    input?.focus(options);
    if (options?.cursor) {
      const end = input?.value.length ?? 0;
      input?.setSelectionRange(
        options.cursor === 'end' ? end : 0,
        options.cursor === 'start' ? 0 : end
      );
    }
  }
  export function blur() {
    input?.blur();
  }
</script>
<style>
  [data-picker-popup] { position:fixed;margin:0;padding:0;border:0;background:transparent;overflow:visible; }
  [data-picker-clear] { padding:0;border:0;background:transparent;cursor:pointer; }
  [data-picker-clear]:focus-visible { opacity:1;outline:2px solid var(--ant-color-primary); }
  [data-picker-current] { padding:0;border:0;background:transparent;color:var(--ant-color-link);font:inherit;cursor:pointer; }
  [data-picker-current]:disabled { color:var(--ant-color-text-disabled);cursor:not-allowed; }
  [data-picker-presets] button { width:100%;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:inherit;cursor:pointer; }
</style>{#snippet dateCalendar(calendarMode: DatePickerCalendarMode)}
  <DatePickerCalendar
    dateOperations={dates}
    classNames={dateSemantic?.classes.popup}
    styles={dateSemantic?.styles.popup}
    {picker}
    {showWeek}
    {...navigationIcons}
    prefixCls={prefix}
    {panel}
    timeTemplate={time ? panel : clock.defaultOpenValue}
    selected={multipleOptions ? null : draft}
    multipleValues={multipleOptions ? multiplePicker.values : undefined}
    hovered={hoverValue ?? (multipleOptions ? null : draft)}
    onHover={time && calendarMode !== 'date' ? handleTimeHover : handleDateCellHover}
    preserveDisabledHover
    direction={config.direction}
    mode={calendarMode}
    controlledMode={providedMode !== undefined}
    locale={timeLocale ?? panelLocale}
    {cellRender}
    restrictions={time ? { minDate, maxDate, disabledDate: replacementDisabled } : restrictions}
    {now}
    onSelect={selectDate}
    onNavigate={navigate}
    onModeChange={changeMode}
  />
{/snippet}
{#snippet datePanelLayout()}
  <div class={`${prefix}-panel-layout`}>
        {#if presets?.length}<div data-picker-presets class={`${prefix}-presets`}><ul>
          {#each presets as preset, index (index)}<li onmouseenter={() => handleDateHover(datePresetValue(preset))} onmouseleave={() => handleDateHover(null)}>
            <button type="button" onclick={() => selectDatePreset(preset)}>{#if typeof preset.label === 'function'}{@render preset.label()}{:else}{preset.label}{/if}</button>
          </li>{/each}
        </ul></div>{/if}
        <div><div class={[`${prefix}-panel`,
          panelReplacement && config.direction === 'rtl' && `${prefix}-panel-rtl`]}
          data-picker-authored-panel={panelReplacement ? true : undefined} tabindex="-1">
        {#if panelReplacement}
          <PickerPanelReplacement panel={panelReplacement} context={replacementContext()}
            dateCell={cellRender} />
        {:else}<div class={showTime && mode === 'date'
            ? `${prefix}-datetime-panel`
            : undefined}>
          {#if mode !== 'time'}{@render dateCalendar(mode)}{/if}
          {#if mode === 'time' || showTime && mode === 'date'}
            <DatePickerTimePanel
              dateOperations={dates}
              classNames={dateSemantic?.classes.popup}
              styles={dateSemantic?.styles.popup}
              bind:this={dateTimePanel}
              scrollMemory={dateTimeScroll}
              prefixCls={prefix}
              value={draft ?? datePanelValue}
              selectedValue={draft}
              config={clock}
              showColumns={Boolean(showTime)}
              format={timeFormat}
              locale={panelLocale}
              {now}
              {cellRender}
              disabledTime={showTime ? disabledTime : undefined}
              onSelect={selectTime}
              onHover={handleDateHover}
            />
          {/if}
        </div>{/if}</div>
        {#if renderExtraFooter || confirm || showDateNow}
        <div class={[`${prefix}-footer`, dateSemantic?.classes.popup.footer]}
          style={dateSemantic?.styles.popup.footer}>
          {#if renderExtraFooter}<div class={`${prefix}-footer-extra`}>{@render renderExtraFooter(mode)}</div>{/if}
          {#if (confirm || showTime) && (confirm || showDateNow)}<ul class={`${prefix}-ranges`}>
            {#if showDateNow}<li class={`${prefix}-now`}><button type="button" data-picker-current class={`${prefix}-now-btn`} disabled={pickerDateDisabled(now, restrictions)} onclick={() => {
                const next = validPickerTime(adapter.getNow(), clock, disabledTime);
                if (commit(next)) {
                  requestOpen(false);
                  input?.focus();
                }
              }}>{showTime ? actualLocale.now : actualLocale.today}</button></li>{/if}
            {#if confirm}<li class={`${prefix}-ok`}><PickerConfirmButton component={components?.button}
              disabled={multipleOptions ? !multiplePicker.canConfirm : !valid(draft)} onclick={() => {
                finish(true);
                input?.focus();
              }} children={actualLocale.ok} /></li>{/if}
          </ul>{:else if showDateNow}<button type="button" data-picker-current class={`${prefix}-today-btn`} disabled={pickerDateDisabled(now, restrictions)} onclick={() => {
              const next = validPickerTime(adapter.getNow());
              if (commit(next))
                requestOpen(false);
            }}>{actualLocale.today}</button>{/if}
        </div>{/if}
      </div></div>
{/snippet}

{#snippet timePanelLayout()}
  <div class={`${prefix}-panel-layout`}>
    {#if time?.presets?.length}
      <div data-picker-presets class={`${prefix}-presets`}><ul>
        {#each time.presets as preset, index (index)}
          <li>
            <button
              type="button"
              onmouseenter={() => handleTimeHover(typeof preset.value === 'function'
                ? preset.value() : preset.value)}
              onmouseleave={() => handleTimeHover(null)}
              onclick={() => selectPreset(preset)}
            >{#if typeof preset.label === 'function'}{@render preset.label()}
            {:else}{preset.label}{/if}</button>
          </li>
        {/each}
      </ul></div>
    {/if}
    <div>
      <div
        class={[`${prefix}-panel`, config.direction === 'rtl' && `${prefix}-panel-rtl`]}
        data-picker-authored-panel={panelReplacement ? true : undefined}
        tabindex="-1"
      >
        {#if panelReplacement}
          <PickerPanelReplacement panel={panelReplacement} context={replacementContext()}
            dateCell={cellRender} timeCell={timeCellRender} />
        {:else if mode === 'date'}
          <div class={`${prefix}-datetime-panel`}>
            {@render dateCalendar(mode)}
            {@render timePanelBody()}
          </div>
        {:else if mode !== 'time'}
          {@render dateCalendar(mode)}
        {:else}
          {@render timePanelBody()}
        {/if}
      </div>
      {#if confirm || showTimeCurrent || time?.renderExtraFooter}
        <div
          class={[`${prefix}-footer`, semantic?.classes.popup.footer]}
          style={semantic?.styles.popup.footer}
        >
          {#if time?.renderExtraFooter}
            <div class={`${prefix}-footer-extra`}>
              {#if rootTimeProps || panelReplacement || authoredMode}{@render time.renderExtraFooter(mode)}
              {:else}{@render time.renderExtraFooter()}{/if}
            </div>
          {/if}
          {#if confirm || showTimeCurrent}<ul class={`${prefix}-ranges`}>
            {#if showTimeCurrent}<li class={`${prefix}-now`}><button
              type="button"
              data-picker-current class={`${prefix}-now-btn`}
              disabled={time && timePickerDateDisabled(now, time)}
              onclick={() => {
                if (!time) return;
                const next = timePickerValidTime(adapter.getNow(), time);
                timeInteraction.reset();
                setDraft(next, 'time');
                if (commit(next)) requestOpen(false);
              }}
            >{actualLocale.now}</button></li>{/if}
            {#if confirm}<li class={`${prefix}-ok`}><PickerConfirmButton component={components?.button}
              disabled={!valid(draft || clock.defaultOpenValue || null)}
              onclick={() => finish(true)}
              children={actualLocale.ok}
            /></li>{/if}
          </ul>{/if}
        </div>
      {/if}
    </div>
  </div>
{/snippet}

{#snippet timePanelBody()}
  {#if timeLocale}<PickerTimePanel dateOperations={dates} prefixCls={prefix}
    value={draft || clock.defaultOpenValue || null}
    pickerValue={panel}
    config={clock}
    locale={timeLocale}
    {now}
    {disabledTime}
    onSelect={selectTime}
    onHover={handleTimeHover}
    onConfirm={confirm ? () => timeInteraction.trigger(0, 'confirm') : undefined}
    cellRender={timeCellRender}
    class={semantic?.classes.popup.content}
    style={semantic?.styles.popup.content}
    itemClass={semantic?.classes.popup.item}
    itemStyle={semantic?.styles.popup.item}
  />{/if}
{/snippet}{#snippet clearButton()}
  {#if clearEnabled
      && (multipleOptions ? multiplePicker.values.length
        : time ? hoverValue || draft : hoverValue || (retainedDateSelection ? draft : mergedValue))
      && !blocked}
    <button
      type="button"
      data-picker-clear class={`${prefix}-clear`}
      aria-label={actualLocale.clear}
      onpointerdown={event => event.preventDefault()}
      onclick={event => {
        if (multipleOptions) {
          event.stopPropagation();
          multiplePicker.clear();
          requestOpen(false);
          input?.focus();
          onClear?.();
          return;
        }
        if (!time && hoverValue) {
          hoverValue = null;
          retainedDateSelection = undefined;
          commit(null);
          requestOpen(false);
          input?.focus();
          onClear?.();
          return;
        }
        if (time) {
          event.stopPropagation();
          timeInteraction.reset();
        }
        commit(null);
        if (!time) onClear?.();
        requestOpen(false);
        input?.focus();
        if (time) onClear?.();
      }}
    >{#if typeof clearContent === 'function'}{@render clearContent()}
    {:else if clearContent === null
        || typeof clearContent === 'boolean' || clearContent === ''}<span class={`${prefix}-clear-btn`}></span>
    {:else if clearContent !== undefined}{clearContent}
    {:else}<Icon name="close-circle-filled" />{/if}</button>
  {/if}
{/snippet}{#snippet pickerSuffix()}
  {#if suffixContent !== false && suffixContent !== null && suffixContent !== ''}
    <span
      class={[`${prefix}-suffix`, semantic?.classes.suffix]}
      style={semantic?.styles.suffix}
      aria-hidden="true"
    >
      {#if typeof suffixContent === 'function'}{@render suffixContent()}{:else if suffixContent === undefined || suffixContent === true}{#if time}<PickerClockIcon />{:else}<PickerCalendarIcon />{/if}{#if feedback.hasFeedback && feedback.icon}<FormFeedbackIcon descriptor={feedback.icon} />{/if}{:else}{suffixContent}{/if}
    </span>
  {/if}
{/snippet}{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`picker-prefix:${prefix}:${rootPrefix}`} />{/if}<div bind:this={rootElement} data-ant-picker-prefix={prefix} data-ant-picker-root-prefix={rootPrefix} role={time ? 'presentation' : 'group'} style={
    componentTheme.style || time || semantic?.styles.root
      ? [componentTheme.style, semantic?.styles.root, style].filter(Boolean).join(';')
      : style}
  dir={config.direction} onfocusout={blurWithin}
  onclick={time || multipleOptions ? handleRootClick : undefined}
  class={[
      `${prefix} ant-picker-css-var`,
      componentTheme.className,
      `${prefix}-${actualVariant}`,
      multipleOptions && `${prefix}-multiple`,
      blocked && `${prefix}-disabled`,
      visible && `${prefix}-open`,
      focused && `${prefix}-focused`,
      resolvedSize === 'large' && `${prefix}-large`,
      resolvedSize === 'small' && `${prefix}-small`,
      resolvedStatus && `${prefix}-status-${resolvedStatus}`,
      feedback.hasFeedback && `${prefix}-has-feedback`,
      config.direction === 'rtl' && `${prefix}-rtl`,
      compactClasses(prefix, config.direction, compact),
      pickerConfig?.class,
      timeSemantic?.classes.root,
      className,
      dateSemantic?.classes.root,
      rootClassName
    ]}>
  {#if showLeadingContent}
    <div
      class={[`${prefix}-prefix`, semantic?.classes.prefix]}
      style={semantic?.styles.prefix}
    >{#if typeof leadingContent === 'function'}{@render leadingContent()}
      {:else if leadingContent !== true}{leadingContent}{/if}</div>
  {/if}
  {#if multipleOptions}
    <DatePickerSelectionTags
      dateKey={dates.key}
      {prefix}
      input={nativeInput}
      values={multiplePicker.values}
      format={multiplePicker.format}
      disabled={blocked}
      placeholder={placeholderText}
      clearLabel={actualLocale.clear}
      maxTagCount={multipleOptions.maxTagCount}
      tagRender={multipleOptions.tagRender}
      removeIcon={multipleOptions.removeIcon}
      onRemove={removeMultipleDate}
    />
    <input
      {...attributes}
      bind:this={nativeInput}
      id={id ?? field?.id}
      name={name ?? field?.name}
      type="text"
      class={[`${prefix}-multiple-input`, semantic?.classes.input]}
      style={semantic?.styles.input}
      data-picker-multiple-input
      role="combobox"
      aria-haspopup="dialog"
      aria-expanded={visible}
      aria-controls={`ant-picker-${generatedId}`}
      aria-invalid={field?.invalid || resolvedStatus === 'error' || attributes['aria-invalid'] || undefined}
      aria-describedby={[attributes['aria-describedby'], field?.describedBy].filter(Boolean).join(' ') || undefined}
      aria-required={attributes.required ?? field?.required ?? attributes['aria-required']}
      aria-readonly="true"
      value={multipleText}
      defaultValue={multipleText}
      autocomplete="off"
      disabled={blocked}
      readonly
      onkeydown={multipleKeyboard}
      onfocus={event => {
        focused = true;
        onfocus?.(event);
      }}
      onblur={event => {
        onblur?.(event);
        blurWithin(event);
      }}
    />
    {@render pickerSuffix()}
  {:else}
  <div class={[`${prefix}-input`, hoverValue && `${prefix}-input-placeholder`]}>
    {#if components?.input}
      <PickerEditor editor={components.input} attributes={editorAttributes()}
        register={customInput.register} size={resolvedSize} />
    {:else}
      <input {...editorAttributes()} bind:this={nativeInput} {@attach maskInput.attach} />
    {/if}
    {@render pickerSuffix()}
    {#if time}{@render clearButton()}{/if}
  </div>
  {/if}
  {#if !time}{@render clearButton()}{/if}
</div><NoCompactStyle>{#key container.target}{#if visible}
    {@const initialPopupStyle = untrack(() => popupThemeStyle)}
    <div bind:this={popup} data-picker-popup data-ant-picker-prefix={prefix} data-ant-picker-root-prefix={rootPrefix} id={`ant-picker-${generatedId}`} popover="manual" role="dialog" aria-label={attributes['aria-label'] ?? (time ? placeholderText || actualLocale.timeSelect : actualLocale.placeholder)} hidden={!shown} onfocusout={blurWithin} class={[
        `${prefix}-dropdown ant-picker-css-var`,
        componentTheme.className,
        config.direction === 'rtl' && `${prefix}-dropdown-rtl`,
        `${prefix}-dropdown-placement-${popupPlacement === 'top' ? 'top' : 'bottom'}${actualPlacement.endsWith('Right') ? 'Right' : 'Left'}`,
        semantic?.classes.popup.root,
        time && rootClassName
      ]} style={initialPopupStyle}
      {@attach attachPopupStyle} {@attach container.portal}>
      {#if time}
        <div
          class={[`${prefix}-panel-container`,
            (panelReplacement || mode !== 'time') && `${prefix}-${replacementMode}-panel-container`,
            semantic?.classes.popup.container]}
          style={semantic?.styles.popup.container}
        >
          {#if time.panelRender}{@render time.panelRender(timePanelLayout)}
          {:else}{@render timePanelLayout()}{/if}
        </div>
      {:else}
      <div bind:this={datePanelContainer}
        class={[`${prefix}-panel-container`,
          panelReplacement && `${prefix}-${replacementMode}-panel-container`,
          dateSemantic?.classes.popup.container]}
        style={dateSemantic?.styles.popup.container} tabindex="-1">
        {#if panelRender}{@render panelRender(datePanelLayout)}
        {:else}{@render datePanelLayout()}{/if}
      </div>
      {/if}
    </div>
{/if}{/key}</NoCompactStyle>
