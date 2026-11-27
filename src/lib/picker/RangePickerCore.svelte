<script lang="ts" generics="DateType extends object">
  // Coordinates both editors, the draft range, and the calendar panels. Committing a range is
  // separate from navigation.
  import { onMount, tick, untrack } from 'svelte';
  import type { PickerDateOperations } from './picker-date-operations.engine';
  import type { RangePickerMode, RangePickerProps, RangePickerValue } from './range-picker.types';
  import type { DatePickerCalendarMode, DatePickerMode, DatePickerTimeConfig } from './date-picker.types';
  import {
    createRangeInteraction,
    type RangeInteractionSource,
    type RangeInteractionSubmit
  } from './range-picker-interaction.engine';
  import { createRangePickerEngine, rangePair, rangeFlags, rangeFrom } from './range-picker.engine';
  import { createDatePickerEngine, pickerFormats, nextPickerPanelMode } from './date-picker.engine';
  import { normalizePickerFieldFormat } from './picker-mask.engine';
  import { createPickerMaskInput, type PickerMaskSharedKey } from './picker-mask-input.model.svelte.js';
  import {
    createPickerEditor, isPickerInput, isPickerInputEvent,
    pickerEditorMaskEvents, type PickerEditorEvent
  } from './picker-editor.model.svelte.js';
  import type { DatePickerEditorAttributes, DatePickerPanelContext } from './picker-components.types';
  import { createPickerPanelEngine, pickerPanelClock, pickerPanelSlot } from './picker-panel.engine';
  import { datePickerEnUS } from './date-picker.locale';
  import { useConfig } from '../config-provider/config-context';
  import { getPickerPrefixCss } from './picker-prefix.engine';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { useVariant } from '../config-provider/variant.svelte';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useZIndex } from '../popup/z-index-context.svelte';
  import { connectComponentTheme } from '../theme/theme-component.dom';
  import { createOverlayStyle } from '../popup/overlay-style.model.svelte';
  import { useForm, useFormField } from '../form/form-context';
  import { useFormItemStatusContext } from '../form/form-item-status';
  import { useFormFeedback } from '../form/form-feedback-context';
  import FormFeedbackIcon from '../form/FormFeedbackIcon.svelte';
  import { useCompact } from '../space/space-compact-context';
  import { compactClasses } from '../space/space-compact.engine';
  import { getPopupActiveElement } from '../popup/popup.dom';
  import {
    createPickerPopup, focusPickerPanel, keepPickerEditorFocus,
    preservePickerPanelFocus, retainPickerReplacementFocus
  } from './picker-popup.model.svelte.js';
  import { connectPickerPopup } from './picker-popup.dom';
  import NoCompactStyle from '../space/NoCompactStyle.svelte';
  import PickerConfirmButton from './PickerConfirmButton.svelte';
  import PickerEditor from './PickerEditor.svelte';
  import PickerPanelReplacement from './PickerPanelReplacement.svelte';
  import DatePickerCalendar from './DatePickerCalendar.svelte';
  import DatePickerTimePanel from './DatePickerTimePanel.svelte';
  import Icon from '../icon/Icon.svelte';
  import PickerCalendarIcon from './PickerCalendarIcon.svelte';
  import PickerRangeSeparator from './PickerRangeSeparator.svelte';
  import PickerClockIcon from './PickerClockIcon.svelte';
  import PickerTimePanel from './PickerTimePanel.svelte';
  import {
    createTimePickerEngine, datePickerClock, timePickerFormats, timePickerLang
  } from './time-picker.engine';
  import {
    createTimeRangePickerEngine, timeRangeClock, type TimeRangeInputParser
  } from './time-range-picker.engine';
  import { timeRangeSemantic } from './time-range-picker-semantic.engine';
  import { datePickerSemantic } from './date-picker-semantic.engine';
  import type { TimeRangePickerRuntimeProps } from './time-range-picker.types';
  import { connectTimeRangePopup } from './time-range-picker-popup.dom';
  let {
    dateOperations,
    parseTimeInput,
    time,
    dateProps,
    rootTimeProps,
    clockFormat,
    value,
    defaultValue,
    disabled,
    allowEmpty = false,
    order = true,
    id,
    name,
    placeholder,
    showTime: providedShowTime = false,
    picker = 'date',
    mode: providedMode,
    showWeek,
    format,
    disabledDate,
    disabledTime,
    minDate,
    maxDate,
    defaultPickerValue,
    pickerValue,
    open,
    defaultOpen = false,
    needConfirm,
    showNow,
    allowClear,
    inputReadOnly,
    preserveInvalidOnBlur = false,
    onChange,
    onCalendarChange,
    onOk,
    onClear,
    onPickerValueChange,
    onOpenChange,
    onPanelChange,
    onfocus,
    onblur,
    onkeydown,
    renderExtraFooter,
    cellRender,
    components,
    prevIcon,
    nextIcon,
    superPrevIcon,
    superNextIcon,
    panelRender,
    separator,
    presets,
    previewValue = 'hover',
    placement,
    popupAlign,
    builtinPlacements,
    size,
    status,
    prefix: prefixContent,
    suffixIcon,
    variant,
    locale,
    class: className = '',
    rootClassName = '',
    prefixCls,
    classNames,
    styles,
    getPopupContainer,
    style,
    nativeElement = $bindable(),
    startInput = $bindable(),
    endInput = $bindable(),
    ...attributes
  }: RangePickerProps<DateType> & {
    dateOperations: PickerDateOperations<DateType>;
    parseTimeInput?: TimeRangeInputParser<DateType>;
    time?: TimeRangePickerRuntimeProps<DateType>;
    dateProps?: RangePickerProps<DateType>;
    rootTimeProps?: TimeRangePickerRuntimeProps<DateType>;
    clockFormat?: string;
  } = $props();
  const dates = untrack(() => dateOperations);
  const { generateConfig: adapter, fields } = dates;
  const dateEngine = createDatePickerEngine(dates);
  const {
    pickerCalendarValue, pickerDateWithCalendar, samePickerPanelValue, offsetPickerPanel,
    samePickerPanel, formatPicker, parsePicker,
    pickerDateDisabled, pickerTimeDisabled, validPickerTime
  } = dateEngine;
  const { sameRange, orderedRange, validRange } = createRangePickerEngine(dates, dateEngine);
  const { pickerPanelHoverRange, pickerPanelOutsideBounds, samePickerPanelPeriod } =
    createPickerPanelEngine(dates, dateEngine);
  const timeEngine = createTimePickerEngine(dates, dateEngine);
  const { timePickerSameValue, timePickerDateDisabled } = timeEngine;
  const { parseAdapterTimeRangeInput, sameTimeRange, timeRangeInvalid, validTimeRange } =
    createTimeRangePickerEngine(dates, dateEngine, timeEngine);

  const config = useConfig();
  let prefix = $derived(config.getPrefixCls('picker', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getPickerPrefixCss(prefix, rootPrefix));
  const variantContext = useVariant('rangePicker', () => ({
    variant
  }));
  const componentTheme = useComponentTheme('DatePicker');
  const layer = useZIndex('popup');
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
  const initial = untrack(() => rangePair(defaultValue));
  let internalValue = $state.raw<RangePickerValue<DateType>>(initial);
  let committed = $derived(value === undefined ? internalValue : rangePair(value));
  let semanticDisabled = $derived(
    disabled ?? field?.disabled ?? form?.disabled ?? config.componentDisabled
  );
  let blocked = $derived(rangeFlags(semanticDisabled));
  let empty = $derived(rangeFlags(allowEmpty));
  let showTime = $derived(time || picker === 'date' ? providedShowTime : false);
  let confirm = $derived(needConfirm ?? Boolean(showTime));
  let internalOpen = $state(untrack(() => defaultOpen));
  let visible = $derived((open ?? internalOpen) && !blocked.every(Boolean));
  let lang = $derived(
    { ...datePickerEnUS.lang, ...config.locale.datePicker?.lang, ...locale?.lang }
  );
  let clockSettings = $derived.by(() => {
    const config = typeof showTime === 'object' ? showTime : {};
    const { defaultOpenValue, disabledTime, ...options } = config;
    return { options, templates: defaultOpenValue };
  });
  let formats = $derived(time ? timePickerFormats(time, lang)
    : pickerFormats({ format, picker, showTime: showTime && clockSettings.options }, lang));
  let maskFormat = $derived(normalizePickerFieldFormat<DateType>(time ? time.format : format, '').mask);
  let readOnly = $derived(
    time && typeof formats[0] === 'function'
      || (inputReadOnly ?? (attributes.readonly
        || formats.every(item => typeof item === 'function')))
  );
  let calendar = $state.raw<RangePickerValue<DateType>>(
    untrack(() => value === undefined ? [...initial] : rangePair(value))
  );
  let submit = $state.raw<RangePickerValue<DateType>>(untrack(() => [...calendar]));
  let texts = $state<[string, string]>(untrack(() => dateTexts(calendar)));
  let rawInvalid = $state<[boolean, boolean]>([false, false]);
  let quarterInputValues = $state.raw<[DateType | null | undefined, DateType | null | undefined]>([undefined, undefined]);
  let revision = $state(0);
  const interaction = createRangeInteraction<DateType>({
    fieldCount: () => blocked.filter(item => !item).length,
    needConfirm: () => confirm,
    allowEmpty: () => empty,
    getCalendarValue: () => calendar,
    triggerCalendarChange: (index, next) => {
      const copy: RangePickerValue<DateType> = [...calendar];
      copy[index] = next;
      changeCalendar(copy);
    },
    flushSubmit: submitField,
    resetValue: index => {
      resetQuarterInput(index);
      if (index === undefined) {
        changeCalendar(committed);
        submit = [...committed];
      }
      else {
        const copy: RangePickerValue<DateType> = [...calendar];
        copy[index] = committed[index];
        changeCalendar(copy);
        const next: RangePickerValue<DateType> = [...submit];
        next[index] = committed[index];
        submit = next;
      }
    }
  });
  let active = $derived.by(() => {
    void revision;
    return interaction.activeIndex;
  });
  let clock = $derived.by((): DatePickerTimeConfig<DateType> => {
    if (time) {
      const options = clockFormat === undefined ? time : { ...time, format: clockFormat };
      return timeRangeClock(options, lang, active);
    }

    const { options, templates } = clockSettings;
    return datePickerClock({
      format,
      showTime: { ...options, defaultOpenValue: templates?.[active] }
    }, lang);
  });
  let timeFormat = $derived(
    clock.format ?? (typeof formats[0] === 'string' ? formats[0] : 'HH:mm:ss')
  );
  let panelLocale = $derived(timePickerLang(typeof showTime === 'object' ? showTime : {}, lang));
  let secondPanelLocale = $derived({ ...panelLocale });
  let cellRange = $derived<'start' | 'end'>(active === 1 ? 'end' : 'start');
  let focused = $state(false);
  let shown = $state(false);
  let rootElement = $state<HTMLDivElement>();
  let nativeStart = $state<HTMLInputElement>();
  let nativeEnd = $state<HTMLInputElement>();
  const customInputs = [0, 1].map(index => createPickerEditor(
    node => maskInputs[index].attach(node, true)
  ));
  let startElement = $derived(components?.input ? customInputs[0].element : nativeStart);
  let endElement = $derived(components?.input ? customInputs[1].element : nativeEnd);
  let popup = $state<HTMLDivElement>();
  let timeWrapper = $state<HTMLDivElement>();
  let timeContainer = $state<HTMLDivElement>();
  let timePosition = $state({ arrow: 0, offset: 0 });
  let now = $state.raw(untrack(() => adapter.getNow()));
  let panels = $state.raw<[DateType, DateType]>(untrack(() => {
    const base = initialPanel(0);
    return [base, initialPanel(1)];
  }));
  let view = $derived(panelValues()[active]);
  let datePanelValue = $derived(pickerCalendarValue(view, clock.defaultOpenValue));
  let terminalMode = $derived(time ? 'time' as const : picker);
  let localMode = $state<DatePickerMode>(untrack(() => terminalMode));
  let authoredModes = $state.raw<RangePickerMode>();
  let mode = $derived(providedMode?.[active] ?? authoredModes?.[active] ?? localMode);
  let replacementMode = $derived(pickerPanelSlot(mode, Boolean(showTime)));
  let panelReplacement = $derived(components?.[replacementMode]);
  let navigationIcons = $derived({ prevIcon, nextIcon, superPrevIcon, superNextIcon });
  let dateModes = $derived<RangePickerMode>([localMode, localMode]);
  let periodModes = $state.raw<RangePickerMode>(untrack(() => [picker, picker]));
  let multiplePanels = $derived(!showTime && mode === picker);
  const panelFocus = preservePickerPanelFocus(() => ({
    popup, mode, date: dates.formatKey(view, 'YYYY-MM-DD', lang.locale), controlled: providedMode !== undefined,
    editor: active === 1 ? endElement : startElement
  }));
  retainPickerReplacementFocus(() => ({
    popup, panel: panelReplacement, count: multiplePanels ? 2 : 1, prefix
  }));
  let periodPlaceholder = $derived(picker === 'week' ? lang.rangeWeekPlaceholder
    : picker === 'quarter' ? lang.rangeQuarterPlaceholder
    : picker === 'month' ? lang.rangeMonthPlaceholder
    : picker === 'year' ? lang.rangeYearPlaceholder : lang.rangePlaceholder);
  let showCurrent = $derived(Boolean(showNow && (mode === 'date' || time && mode === 'time')));
  let hover = $state.raw<DateType | null>(null);
  let presetHover = $state.raw<RangePickerValue<DateType> | null>(null);
  let displayRange = $derived.by((): RangePickerValue<DateType> => {
    const pair: RangePickerValue<DateType> = presetHover && previewValue ? [...presetHover] : [...calendar];
    if (hover && previewValue)
      pair[active] = hover;
    return pair[0] && pair[1] && dates.isAfter(pair[0], pair[1]) ? [pair[1], pair[0]] : pair;
  });
  let periodWeakHover = $derived(picker !== 'date' && !!hover
    && !calendar[active ^ 1] && !dates.sameValue(calendar[active], committed[active]));
  let calendarRange = $derived(picker === 'date' ? displayRange : periodWeakHover ? undefined
    : [displayRange[0] ?? displayRange[1], displayRange[1] ?? displayRange[0]] as RangePickerValue<DateType>);
  let displayedTexts = $derived.by(() => {
    const pair = presetHover && previewValue ? dateTexts(presetHover) : [...texts];
    if (hover && previewValue)
      pair[active] = formatPicker(hover, lang.locale, formats);
    return pair;
  });
  const maskInputs = [0, 1].map(index => createPickerMaskInput(() => ({
    text: displayedTexts[index], mask: maskFormat, active: active === index,
    helped: !!previewValue && !!(presetHover || hover && active === index),
    readOnly, preserveInvalidOnBlur,
    validateText: next => !!parseFieldInput(next, calendar[index]),
    acceptInput: next => inputChange(index, next, true),
    onHelp: () => requestOpen(true)
  })));
  const maskEvents = maskInputs.map(mask => pickerEditorMaskEvents(mask, () => attributes));
  $effect(() => { for (const input of maskInputs) input.sync(); });
  let bar = $state({ left: 0, width: 0 });
  let actualPlacement = $derived(
    placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft')
  );
  let alignedPlacement = $state<string>();
  let popupPlacement = $derived(shown ? alignedPlacement
    : `bottom${actualPlacement.endsWith('Right') ? 'Right' : 'Left'}`);
  let resolvedSize = $derived(size ?? compact?.size ?? config.componentSize);
  let resolvedStatus = $derived((time ? time.status : status)
    ?? ('status' in itemStatus ? itemStatus.status : field?.status));
  let resolvedVariant = $derived(variantContext.variant);
  let resolvedSeparator = $derived(separator ?? config.rangePicker?.separator);
  let dateSemantic = $derived.by(() => {
    const settings = config.datePicker;
    const providerStyle = config.rangePicker?.style;
    if (!dateProps || !(settings?.classNames || settings?.styles
      || classNames || styles || providerStyle)) {
      return undefined;
    }

    // Semantic slots receive the original props without changing core callback calls.
    const props = { ...dateProps, size: resolvedSize, disabled: semanticDisabled, status, variant };
    return datePickerSemantic(props, settings, classNames, styles, providerStyle);
  });
  let semantic = $derived(time
    ? timeRangeSemantic(rootTimeProps ?? time, config.timePicker, config.rangePicker, {
      size: resolvedSize,
      disabled: semanticDisabled
    })
    : dateSemantic);
  let timeLocale = $derived(time ? timePickerLang(time, lang) : undefined);
  let timePlaceholder = $derived.by(() => {
    if (!time) {
      return undefined;
    }
    if (time.placeholder !== undefined) {
      return Array.isArray(time.placeholder)
        ? time.placeholder : [time.placeholder, time.placeholder];
    }
    return locale?.timePickerLocale?.rangePlaceholder
      ?? config.locale.datePicker?.timePickerLocale?.rangePlaceholder
      ?? datePickerEnUS.timePickerLocale.rangePlaceholder;
  });
  let localClearConfig = $derived(time ? time.allowClear : allowClear);
  let providerClearConfig = $derived(time ? config.timePicker?.allowClear : config.datePicker?.allowClear);
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
    ? time.suffixIcon === undefined ? config.timePicker?.suffixIcon : time.suffixIcon
    : suffixIcon !== undefined ? suffixIcon : config.datePicker?.suffixIcon);
  let timeInputSize = $derived.by(() => {
    if (!time) {
      return undefined;
    }
    const first = formats[0];
    return Math.max(8, typeof first === 'function' ? first(now).length : first.length) + 2;
  });
  let previousVisible = untrack(() => visible);
  let previousCommitted = untrack(() => committed);
  let previousDateValue = untrack(() => value);
  let previousValue = untrack(() => value);
  let dateStartText = $derived(time ? undefined
    : formatPicker(committed[0], lang.locale, formats));
  let dateEndText = $derived(time ? undefined
    : formatPicker(committed[1], lang.locale, formats));
  let previousDateStartText = untrack(() => dateStartText);
  let previousDateEndText = untrack(() => dateEndText);
  let timeStartText = $derived(time ? formatPicker(calendar[0], lang.locale, formats) : undefined);
  let timeEndText = $derived(time ? formatPicker(calendar[1], lang.locale, formats) : undefined);
  let timePanelWasOpen = false;
  let previousTimeActive = -1;
  let previousDatePanel = untrack(() => ({
    opened: false, index: active, calendar: calendar[active], focused
  }));
  let previousPeriodMode = untrack(() => ({
    open: false, active, picker: terminalMode, controlled: false
  }));
  let dateFocusIndex: number | null = null;
  $effect.pre(() => {
    const current = {
      open: visible, active, picker: terminalMode, controlled: providedMode !== undefined
    };
    if (previousPeriodMode.controlled && !current.controlled) {
      localMode = terminalMode;
      authoredModes = undefined;
      periodModes = [picker, picker];
    }
    else if (current.open && (current.picker !== previousPeriodMode.picker
      || (time || authoredModes || picker !== 'date') && (!previousPeriodMode.open
        || current.active !== previousPeriodMode.active))) {
      untrack(() => setMode(terminalMode, current.active));
    }
    // A picker change made while closed takes effect when opened. Ordinary reopening in date mode keeps the existing behavior.
    previousPeriodMode = {
      ...current, picker: current.open ? terminalMode : previousPeriodMode.picker
    };
  });
  const popupThemeStyle = $derived([
    componentTheme.style,
    layer.style,
    semantic?.styles.popup.root
  ].filter(Boolean).join(';') || undefined);
  const datePopupStyle = untrack(() =>
    time ? undefined : createOverlayStyle(() => [popupThemeStyle]));

  // Authored declarations follow the positioning declarations and update on the same panel.
  function attachPopupStyle(node: HTMLElement) {
    return datePopupStyle
      ? datePopupStyle.attach(node) : connectComponentTheme(node, popupThemeStyle, ['z-index']);
  }

  const container = createPickerPopup(() => ({
    open: visible,
    reference: rootElement,
    getPopupContainer: getPopupContainer || config.getPopupContainer,
    themeStyle: popupThemeStyle
  }));
  $effect(() => {
    nativeElement = rootElement;
    return () => { nativeElement = undefined; };
  });
  $effect(() => {
    startInput = isPickerInput(startElement) ? startElement : undefined;
    return () => { startInput = undefined; };
  });
  $effect(() => {
    endInput = isPickerInput(endElement) ? endElement : undefined;
    return () => { endInput = undefined; };
  });
  $effect(() => {
    if (time && value !== previousValue) internalValue = rangePair(value);
    previousValue = value;
  });
  $effect(() => {
    const start = dateStartText;
    const end = dateEndText;
    // A prefix or theme change retains both draft endpoints when the value and display are unchanged.
    const modelChanged = !time && value !== undefined
      ? value !== previousDateValue : committed !== previousCommitted;
    if (!modelChanged
      && (time || start === previousDateStartText && end === previousDateEndText)) {
      return;
    }

    if (!time && !modelChanged) {
      texts = dateTexts(calendar);
      previousDateStartText = start;
      previousDateEndText = end;
      return;
    }

    calendar = [...committed];
    submit = [...committed];
    texts = time ? dateTexts(committed) : [start ?? '', end ?? ''];
    resetQuarterInput();
    previousCommitted = committed;
    previousDateValue = value;
    previousDateStartText = start;
    previousDateEndText = end;
  });
  $effect(() => {
    if (timeStartText !== undefined) {
      const text = timeStartText;
      untrack(() => { texts = [text, texts[1]]; });
    }
  });
  $effect(() => {
    if (timeEndText !== undefined) {
      const text = timeEndText;
      untrack(() => { texts = [texts[0], text]; });
    }
  });
  $effect(() => {
    const next = visible;
    if (previousVisible && !next) {
      untrack(() => send(interaction.currentIndex ?? active, 'popupClose'));
      if (!time && !preserveInvalidOnBlur)
        texts = dateTexts(calendar);
    }
    previousVisible = next;
  });
  $effect(() => {
    if (!time) {
      return;
    }
    const opened = visible;
    const index = active;
    void calendar[index];
    if (opened) {
      untrack(() => syncTimePanel(index,
        !timePanelWasOpen || previousTimeActive !== index));
    }
    timePanelWasOpen = opened;
    previousTimeActive = index;
  });
  $effect(() => {
    if (time) {
      return;
    }
    const opened = visible;
    const index = active;
    const current = calendar[index];
    const preserve = focused;
    const previous = previousDatePanel;
    const priorFocusIndex = dateFocusIndex;
    previousDatePanel = { opened, index, calendar: current, focused: preserve };
    dateFocusIndex = opened && preserve ? index : null;
    if (!opened) {
      return;
    }
    const opening = !previous.opened;
    const switched = previous.index !== index;
    untrack(() => {
      const defaults = Array.isArray(defaultPickerValue)
        ? defaultPickerValue : [defaultPickerValue, defaultPickerValue];
      if (defaults[index]) {
        if (opening || switched) syncPanel(index, 'reset', false);
      }
      else if (opening || switched || current !== previous.calendar
        || preserve !== previous.focused) {
        syncPanel(index, 'reset', preserve && priorFocusIndex !== null
          && priorFocusIndex !== index);
      }
    });
  });
  $effect(() => {
    void revision;
    const index = interaction.currentIndex;
    const view = rootElement?.ownerDocument.defaultView;
    if (!time || index === null || !interaction.forceFocus || !view) {
      return;
    }

    // React useFocusLock forces the focus transition after native focus from an outside click.
    const frame = view.requestAnimationFrame(() => {
      if (interaction.currentIndex !== index || !interaction.forceFocus) {
        return;
      }
      requestOpen(true);
      inputs()[index]?.focus();
    });
    return () => view.cancelAnimationFrame(frame);
  });
  $effect(() => {
    if (blocked.every(Boolean)) {
      internalOpen = false;
      if (time) {
        return;
      }
      interaction.reset();
      revision = untrack(() => revision + 1);
      calendar = [...committed];
      texts = dateTexts(committed);
    }
  });
  $effect(() => {
    if (visible && blocked[active])
      untrack(() => send(blocked.findIndex(item => !item), 'field-switch'));
  });
  $effect(() => {
    const surface = popup;
    const anchor = rootElement;
    if (!visible || !surface || !anchor) {
      return;
    }
    return untrack(() => connectPickerPopup(surface, anchor, () => ({
      placement: actualPlacement, popupAlign, builtinPlacements
    }), {
      applyPosition: datePopupStyle
        ? position => untrack(() => datePopupStyle.position(position)) : undefined,
      preserveFocus: event => keepPickerEditorFocus(event, surface,
        !time && Boolean(cellRender || panelRender || renderExtraFooter)),
      onPlacement: next => {
        alignedPlacement = next;
      },
      onVisibilityChange: next => {
        shown = next;
      },
      onDismiss: reason => {
        if (reason === 'escape') {
          send(active, 'esc');
          inputs()[active]?.focus();
        }
        requestOpen(false);
      }
    }));
  });
  $effect(() => {
    if (!time || !visible || !rootElement || !timeWrapper || !timeContainer) {
      return;
    }
    return connectTimeRangePopup(rootElement, timeWrapper, timeContainer,
      () => inputs()[active], () => config.direction === 'rtl', (arrow, offset) => {
        timePosition = { arrow, offset };
      });
  });
  $effect(() => {
    const root = rootElement;
    const input = inputs()[active];
    if (!root || !input) {
      return;
    }
    function measure() {
      const rect = input!.getBoundingClientRect();
      const parent = root!.getBoundingClientRect();
      bar = { left: rect.left - parent.left, width: rect.width };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(input);
    measure();
    return () => observer.disconnect();
  });
  function inputs() {
    return [startElement, endElement];
  }
  function dateTexts(pair: RangePickerValue<DateType>): [string, string] {
    return [
      formatPicker(pair[0], lang.locale, formats),
      formatPicker(pair[1], lang.locale, formats)
    ];
  }
  function initialPanel(index: number): DateType {
    const defaults = Array.isArray(defaultPickerValue)
      ? defaultPickerValue
      : [defaultPickerValue, defaultPickerValue];
    return defaults[index]
      ?? (value === undefined
        ? initial
        : value)?.[index]
      ?? (!time ? (value === undefined
        ? initial
        : value)?.[index ^ 1] : undefined)
      ?? (time ? dates.startOf(adapter.getNow(), 'day') : adapter.getNow());
  }
  function panelValues(): [DateType, DateType] {
    return pickerValue
      ? Array.isArray(pickerValue) ? pickerValue : [pickerValue, pickerValue]
      : panels;
  }
  function from() {
    return rangeFrom(calendar, interaction.triggeredFields, active);
  }
  function timeRestriction(date: DateType) {
    if (time) {
      return time.disabledTime?.(date, active === 1 ? 'end' : 'start', {
        from: from()
      }) ?? {};
    }
    return disabledTime?.(date, active === 1 ? 'end' : 'start', { from: from() }) ?? {};
  }

  // The locked endpoint still allows dates within its calendar period.
  function crossesLockedBoundary(date: DateType, index: number, type: DatePickerCalendarMode) {
    const oppositeIndex = index ^ 1;
    const other = calendar[oppositeIndex];
    const samePeriod = other && samePickerPanelPeriod(
      other, date, type, type === 'week' ? lang.locale : undefined
    );
    if (!blocked[oppositeIndex] || !other || samePeriod) {
      return false;
    }

    return index === 1 ? dates.isAfter(other, date) : dates.isAfter(date, other);
  }

  function invalid(
    date: DateType,
    index: number,
    reference?: DateType,
    type: DatePickerCalendarMode = picker,
    typeOnlyInfo = false
  ) {
    if (time) {
      return timeRangeInvalid(date, time, clock, index,
        reference === undefined ? undefined : { from: reference });
    }
    if (crossesLockedBoundary(date, index, type)) {
      return true;
    }

    const omitReference = typeOnlyInfo
      || (reference === undefined && (type === 'quarter' || type === 'week'));
    if (pickerDateDisabled(
      date,
      {
        minDate,
        maxDate,
        disabledDate: next => Boolean(disabledDate?.(
          next, omitReference ? { type } : { type, from: reference }
        ))
      },
      type,
      lang.locale
    )) {
      return true;
    }
    return pickerTimeDisabled(
      date,
      {
        showTime: Boolean(showTime),
        disabledTime: next => disabledTime?.(
          next,
          index === 1 ? 'end' : 'start',
          { from: reference }
        )
          ?? {}
      }
    );
  }

  function panelDisabled(date: DateType, info: { type: DatePickerCalendarMode; }) {
    if (crossesLockedBoundary(date, active, info.type)) {
      return true;
    }

    return Boolean(disabledDate?.(date, { ...info, from: from() }));
  }

  function changeCalendar(next: RangePickerValue<DateType>) {
    const sameDate = time ? timePickerSameValue : dates.sameValue;
    const changed = time ? !sameTimeRange(calendar, next) : !sameRange(calendar, next);
    const part = sameDate(calendar[0], next[0]) ? 'end' : 'start';
    if (changed) {
      const nextTexts: [string, string] = [...texts];
      for (const index of [0, 1]) {
        if (!sameDate(calendar[index], next[index]))
          nextTexts[index] = formatPicker(next[index], lang.locale, formats);
      }
      calendar = [...next];
      texts = nextTexts;
    }
    if (changed)
      onCalendarChange?.([...next], dateTexts(next), { range: part });
  }
  /** Emits the range once every available field has been confirmed. */
  function submitField(
    index: number, all: boolean, accepted?: RangePickerValue<DateType>, opened?: boolean
  ) {
    const copy: RangePickerValue<DateType> = [...submit];
    copy[index] = calendar[index];
    submit = copy;
    if (all) {
      commit(copy, accepted);
      requestOpen(false, opened);
    }
  }
  function commit(next: RangePickerValue<DateType> | null, accepted?: RangePickerValue<DateType>) {
    const pair: RangePickerValue<DateType> = next === null
      ? [blocked[0] ? submit[0] : null, blocked[1] ? submit[1] : null]
      : orderedRange(next, order, blocked);
    changeCalendar(pair);
    const passed = next === null || (time
      ? validTimeRange(pair, empty, order, blocked,
        (date, index, info) => timeRangeInvalid(date, time, clock, index, info))
      : validRange(pair, empty, order, blocked,
        (date, index, reference) => invalid(date, index, reference, picker,
          picker === 'date' && index === 0), picker, lang.locale));
    if (passed) {
      resetQuarterInput();
      const previous = accepted ?? committed;
      const changed = time ? !sameTimeRange(pair, previous) : !sameRange(pair, previous);
      if (time || value === undefined)
        internalValue = [...pair];
      if (changed) {
        onChange?.(
          next === null && pair.every(item => !item) ? null : [...pair],
          pair.every(item => !item) ? null : dateTexts(pair)
        );
      }
    }
    return passed;
  }
  function requestOpen(next: boolean, opened?: boolean) {
    if (next && blocked.every(Boolean) || next === (opened ?? visible)) {
      return;
    }
    if (next) {
      now = adapter.getNow();
    }
    else {
      hover = null;
      presetHover = null;
    }
    if (open === undefined)
      internalOpen = next;
    onOpenChange?.(next);
  }
  function syncPanel(index: number, source: 'reset' | 'panel', preserve: boolean, target?: DateType) {
    if (time) {
      if (target) setTimePanel(index, target, source);
      return;
    }
    const defaults = Array.isArray(defaultPickerValue)
      ? defaultPickerValue
      : [defaultPickerValue, defaultPickerValue];
    const defaultPanel = defaults[index];
    if (providedMode && !target && defaultPanel) {
      setDatePanel(index, defaultPanel, source);
      return;
    }
    const selectedPanel = target ?? defaultPanel;
    if (picker !== 'date' && selectedPanel) {
      setDatePanel(index, selectedPanel, source);
      return;
    }
    let next = selectedPanel
      ?? (preserve
        ? panelValues()[index ^ 1]
        : calendar[index] ?? calendar[index ^ 1] ?? now);
    if (picker !== 'date' && multiplePanels && index === 1 && !preserve
      && calendar[0] && calendar[1]) {
      next = samePickerPanel(calendar[0], calendar[1], picker)
        || samePickerPanel(offsetPickerPanel(calendar[0], picker, 1), calendar[1], picker)
        ? calendar[0] : offsetPickerPanel(calendar[1], picker, -1);
    }
    if (picker === 'date' && (providedMode ? multiplePanels : !showTime)
      && index === 1
      && !preserve
      && calendar[0]
      && calendar[1]
      && !dates.samePeriod(calendar[1],
        calendar[0],
        'month'
      )
      && !dates.samePeriod(calendar[1],
        fields.addMonth(calendar[0], 1),
        'month'
      )) {
      next = fields.addMonth(calendar[1], -1);
    }
    if (minDate && dates.isBefore(next, minDate))
      next = minDate;
    const dual = picker === 'date' && !providedMode ? !showTime : multiplePanels;
    if (maxDate && dates.isAfter(dual ? offsetPickerPanel(next, picker, 1) : next, maxDate))
      next = dual ? offsetPickerPanel(maxDate, picker, -1) : maxDate;
    setDatePanel(index, next, source);
  }
  function panelModes(): RangePickerMode {
    if (providedMode) {
      return [...providedMode];
    }
    if (authoredModes) {
      return authoredModes;
    }
    return time ? ['time', 'time'] : picker === 'date' ? dateModes : periodModes;
  }
  function setMode(next: DatePickerMode, index = active, viewDate?: DateType) {
    if (providedMode) {
      if (viewDate) publishPanelChange(index, next, viewDate);
      return;
    }
    localMode = next;
    if (authoredModes) {
      if (authoredModes[index] !== next) {
        const modes: RangePickerMode = [...authoredModes];
        modes[index] = next;
        authoredModes = modes;
      }
    }
    else if (!time && picker !== 'date' && periodModes[index] !== next) {
      const modes: RangePickerMode = [...periodModes];
      modes[index] = next;
      periodModes = modes;
    }
    if (viewDate) {
      const values: RangePickerValue<DateType> = [...calendar];
      values[index] = viewDate;
      onPanelChange?.(values, panelModes());
    }
  }
  function publishPanelChange(index: number, next: DatePickerMode, date?: DateType) {
    const modes: RangePickerMode = [...panelModes()];
    modes[index] = next;
    const values: RangePickerValue<DateType> = [...calendar];
    if (date) {
      values[index] = date;
    }
    (time?.onPanelChange ?? onPanelChange)?.(values, modes);
  }
  function navigatePanel(date: DateType, offset = 0) {
    if (authoredModes || time) {
      navigateReplacement(date, offset);
      return;
    }
    const next = offset ? offsetPickerPanel(date, picker, -offset) : date;
    if (providedMode) {
      setDatePanel(active, next, 'panel');
      publishPanelChange(active, mode, date);
      return;
    }
    syncPanel(active, 'panel', false, next);
  }
  function changePanelMode(next: DatePickerCalendarMode, date?: DateType, offset = 0) {
    if (authoredModes || time) {
      changeReplacementMode(next, date, offset);
      return;
    }
    if (providedMode) {
      const headerDate = mode === 'date' || mode === 'week' ? date : undefined;
      if (headerDate) {
        const first = offset ? offsetPickerPanel(headerDate, picker, -offset) : headerDate;
        setDatePanel(active, first, 'panel');
      }
      publishPanelChange(active, next, date);
    }
    else if (picker !== 'date') {
      setMode(next, active, date);
    }
    else {
      if (offset) syncPanel(active, 'panel', false, fields.addMonth(view, 1));
      localMode = next;
      onPanelChange?.([...calendar], [next, next]);
    }
  }
  function setDatePanel(
    index: number,
    next: DateType,
    source: 'reset' | 'panel',
    event?: { previous: [DateType, DateType]; modes: RangePickerMode }
  ) {
    const previous = event?.previous ?? panelValues();
    const pair: [DateType, DateType] = [...previous];
    pair[index] = next;
    if (!pickerValue) panels = pair;
    if (pair.some((date, part) =>
      !samePickerPanelValue(previous[part], date, Boolean(showTime), picker, lang.locale))) {
      onPickerValueChange?.(pair, {
        source, range: index === 1 ? 'end' : 'start', mode: event?.modes ?? panelModes()
      });
    }
  }
  function send(
    index: number,
    source: RangeInteractionSource,
    next?: DateType | null,
    flush?: RangeInteractionSubmit
  ) {
    const previous = interaction.activeIndex;
    interaction.trigger(index, source, next, flush);
    revision++;
    if (interaction.activeIndex !== previous) {
      hover = null;
      setMode(terminalMode, interaction.activeIndex);
      if (time) syncPanel(interaction.activeIndex, 'reset', true);
    }
    const target = interaction.currentIndex;
    if (!time && target !== null && interaction.forceFocus) {
      requestOpen(true);
      void tick().then(() => {
        if (rootElement?.isConnected && interaction.currentIndex === target
          && visible && inputs()[target]?.isConnected) {
          inputs()[target]?.focus();
        }
      });
    }
  }
  function focusField(index: number, suppressOpen = false) {
    focused = true;
    send(index, 'field-switch');
    if (!time && !suppressOpen) requestOpen(true);
    const accepted = interaction.currentIndex;
    if (accepted !== null && accepted !== index) {
      void tick().then(() => {
        if (rootElement?.isConnected && visible
          && inputs()[index]?.ownerDocument.activeElement === inputs()[index]) {
          inputs()[accepted]?.focus();
        }
      });
    }
  }
  function blurInput(
    index: number,
    event: PickerEditorEvent<FocusEvent>
  ) {
    if (!preserveInvalidOnBlur && (time ? rawInvalid[index] : inputInvalid(index))) {
      const copy: [string, string] = [...texts];
      copy[index] = formatPicker(calendar[index], lang.locale, formats);
      texts = copy;
      if (time) {
        const errors: [boolean, boolean] = [...rawInvalid];
        errors[index] = false;
        rawInvalid = errors;
      }
    }
    if (time) {
      (time.onblur ?? time.onBlur)?.(event, { range: index === 1 ? 'end' : 'start' });
    }
    else if (isPickerInputEvent(event)) {
      onblur?.(event);
    }
    blurWithin(event);
  }
  function blurWithin(event: FocusEvent) {
    if (event.relatedTarget instanceof Node
      && (rootElement?.contains(event.relatedTarget)
        || popup?.contains(
          event.relatedTarget
        ))) {
      return;
    }
    queueMicrotask(() => {
      // Blur on field removal can finish after the derived refs have been disposed.
      const root = rootElement;
      if (!root?.isConnected) {
        return;
      }
      const editor = startElement;
      if (!editor?.isConnected) {
        return;
      }
      const current = popup ? getPopupActiveElement(popup) : editor.ownerDocument.activeElement;
      if (panelFocus.moving && (!current || current === editor.ownerDocument.body)
        || current && (root.contains(current) || popup?.contains(current))) {
        return;
      }
      focused = false;
      field?.onBlur();
      requestOpen(false);
    });
  }
  function selectIntermediateDate(
    date: DateType,
    index: number,
    event: { previous: [DateType, DateType]; modes: RangePickerMode }
  ) {
    const nextMode = nextPickerPanelMode(picker, event.modes[index]);
    send(index, 'panel-intermediate', date);
    setDatePanel(index, date, 'panel', event);
    if (nextMode) {
      // The second PickerPanel setter uses the same mode and pickerValue snapshot.
      setDatePanel(index, date, 'panel', event);
      setMode(nextMode, index, date);
    }
  }
  function selectDate(date: DateType, panelOffset = 0) {
    if (time || authoredModes && mode !== picker) {
      selectReplacement(date, panelOffset);
      return;
    }
    resetQuarterInput(active);
    const event = { previous: panelValues(), modes: panelModes() };
    if (mode !== picker && (picker !== 'date' || providedMode !== undefined)) {
      selectIntermediateDate(date, active, event);
      return;
    }
    if (picker === 'date' && mode !== 'date') {
      syncPanel(active, 'panel', false, date);
      localMode = mode === 'decade' ? 'year' : mode === 'year' ? 'month' : 'date';
      onPanelChange?.([...calendar], [localMode, localMode]);
      return;
    }
    const base = calendar[active] ?? datePanelValue;
    const next = showTime
      ? validPickerTime(
        pickerDateWithCalendar(base, date),
        clock,
        timeRestriction
      )
      : date;
    const index = active;
    send(index, showTime ? 'panel-intermediate' : 'panel-final', next);
    const offset = panelOffset && (providedMode || picker === 'quarter' || picker === 'week');
    const panelDate = offset ? offsetPickerPanel(next, picker, -panelOffset) : next;
    setDatePanel(index, panelDate, 'panel', picker !== 'date' || providedMode ? event : undefined);
  }
  function handleDateHover(date: DateType | null) {
    if (date && showTime) {
      const base = calendar[active] ?? datePanelValue;
      date = pickerDateWithCalendar(base, date);
    }
    hover = date;
  }
  function selectTime(date: DateType) {
    if (time && mode !== terminalMode) {
      selectReplacement(date, 0);
      return;
    }
    const next = time ? date : validPickerTime(date, clock, timeRestriction);
    const index = active;
    if (!time && mode === 'time') {
      selectIntermediateDate(next, index, { previous: panelValues(), modes: panelModes() });
      return;
    }
    send(index, 'panel-intermediate', next);
    if (time) {
      setTimePanel(active, date, 'panel');
    }
    else {
      setDatePanel(index, next, 'panel');
    }
  }

  /** The second panel passes its own date while the owner holds the shared view date. */
  function replacementValue(offset: number) {
    const date = time ? view : datePanelValue;
    return offset ? offsetPickerPanel(date, picker, offset) : date;
  }

  /** The original endpoint snapshot is needed even if the selection immediately moves focus. */
  function panelSnapshot() {
    return { index: active, previous: panelValues(), modes: panelModes() };
  }

  function setReplacementValue(
    date: DateType,
    offset: number,
    event: ReturnType<typeof panelSnapshot>
  ) {
    const first = offset ? offsetPickerPanel(date, picker, -offset) : date;
    if (time) {
      setTimePanel(event.index, first, 'panel', event);
    }
    else {
      setDatePanel(event.index, first, 'panel', event);
    }
  }

  function navigateReplacement(date: DateType, offset: number) {
    const event = panelSnapshot();
    setReplacementValue(date, offset, event);
    publishPanelChange(event.index, event.modes[event.index], date);
  }

  function changeReplacementMode(next: DatePickerMode, date: DateType | undefined, offset: number) {
    const event = panelSnapshot();
    const shown = date ?? replacementValue(offset);
    if (date) {
      setReplacementValue(date, offset, event);
    }
    publishReplacementMode(next, shown, event.index);
  }

  function publishReplacementMode(next: DatePickerMode, date: DateType, index: number) {
    if (!providedMode) {
      const modes: RangePickerMode = [...panelModes()];
      modes[index] = next;
      authoredModes = modes;
    }
    publishPanelChange(index, next, date);
  }

  function selectReplacement(date: DateType, offset: number) {
    const event = panelSnapshot();
    const currentMode = event.modes[event.index];
    const nextMode = nextPickerPanelMode(terminalMode, currentMode);
    const source = !showTime && currentMode === terminalMode ? 'panel-final' : 'panel-intermediate';
    resetQuarterInput(event.index);
    send(event.index, source, date);
    setReplacementValue(date, offset, event);
    if (nextMode) {
      setReplacementValue(date, offset, event);
      publishReplacementMode(nextMode, date, event.index);
    }
  }

  function replacementDisabled(date: DateType, { type }: { type: DatePickerMode; }) {
    const other = calendar[active ^ 1];
    if (blocked[active ^ 1] && other
      && (active === 1 ? dates.isAfter(other, date) : dates.isAfter(date, other))
      && !samePickerPanelPeriod(other, date, type, lang.locale)) {
      return true;
    }
    const fromDate = from();
    const localDisabled = time
      ? time.disabledDate?.(date, { type: 'time', from: fromDate })
      : disabledDate?.(date, { type: type === 'time' ? 'date' : type, from: fromDate });
    return Boolean(localDisabled) || pickerPanelOutsideBounds(date, { minDate, maxDate },
      type, lang.locale);
  }

  function replacementHover() {
    const pair: RangePickerValue<DateType> = presetHover && previewValue ? [...presetHover] : [...calendar];
    if (hover && previewValue === 'hover') {
      const weak = !calendar[active ^ 1]
        && !dates.sameValue(calendar[active], committed[active]);
      if (weak && !presetHover) {
        return { hoverValue: [hover], hoverRangeValue: null };
      }
      pair[active] = hover;
    }
    return { hoverValue: null, hoverRangeValue: pickerPanelHoverRange(...pair) };
  }

  function replacementContext(offset: number): Omit<DatePickerPanelContext<DateType>, 'cellRender'> {
    const selected = calendar[active] ?? (time ? clock.defaultOpenValue : undefined);
    return {
      mode: replacementMode,
      range: cellRange,
      prefixCls: prefix,
      locale: timeLocale ?? (offset ? secondPanelLocale : panelLocale),
      generateConfig: adapter,
      pickerValue: replacementValue(offset),
      value: selected,
      values: selected ? [selected] : [],
      ...replacementHover(),
      showTime: showTime ? pickerPanelClock(clock, {
        defaultOpenValue: time ? time.defaultOpenValue : clockSettings.templates,
        disabledTime: (time ? time.disabledTime : disabledTime) ? timeRestriction : undefined,
        changeOnScroll: clock.changeOnScroll, showNow: clock.showNow
      }) : null,
      showWeek,
      minDate,
      maxDate,
      ...navigationIcons,
      disabledDate: replacementDisabled,
      onPickerValueChange: date => navigateReplacement(date, offset),
      onModeChange: (next, date) => changeReplacementMode(next, date, offset),
      onSelect: date => selectReplacement(date, offset),
      onHover: date => {
        if (previewValue === 'hover') {
          hover = date;
          presetHover = null;
        }
      }
    };
  }
  // Typing, masking, and confirmation use the date of the same edited endpoint.
  function parseFieldInput(text: string, boundary: DateType | null): DateType | null {
    if (time) {
      const parse = parseTimeInput ?? parseAdapterTimeRangeInput;
      return parse(text, lang.locale, formats, boundary);
    }

    return parsePicker(text, lang.locale, formats);
  }

  function inputChange(index: number, text: string, masked = false) {
    focusField(index, masked);
    if (time && !masked && text && text !== formatPicker(calendar[index], lang.locale, formats))
      requestOpen(true);
    const copy: [string, string] = [...texts];
    copy[index] = text;
    texts = copy;

    const current = calendar[index];
    const parsed = text ? parseFieldInput(text, current) : null;
    const next = !time && picker === 'date' && parsed && current
      && timePickerSameValue(parsed, current) ? current : parsed;
    if (!time && (picker === 'date' || picker === 'quarter' || picker === 'week')) {
      const values: typeof quarterInputValues = [...quarterInputValues];
      values[index] = next;
      quarterInputValues = values;
    }
    if (time) {
      const errors: [boolean, boolean] = [...rawInvalid];
      errors[index] = !!text && !next;
      rawInvalid = errors;
      send(index, 'input', next ?? undefined);
      return;
    }
    const reference = picker === 'date' || picker === 'quarter' || picker === 'week'
      ? undefined : from();
    if (!text || next && !invalid(next, index, reference, picker, picker === 'date')) {
      send(index, 'input', next);
      if (next && picker === 'date') {
        const defaultPanel = Array.isArray(defaultPickerValue)
          ? defaultPickerValue[index] : defaultPickerValue;
        if (!defaultPanel) syncPanel(index, 'reset', false, next);
      }
    }
    else {
      send(index, 'input');
    }
  }
  function resetQuarterInput(index?: number) {
    if (time || picker !== 'date' && picker !== 'quarter' && picker !== 'week') {
      return;
    }
    if (index === undefined) {
      quarterInputValues = [undefined, undefined];
    }
    else {
      const values: typeof quarterInputValues = [...quarterInputValues];
      values[index] = undefined;
      quarterInputValues = values;
    }
  }
  function inputInvalid(index: number) {
    if (time) {
      return rawInvalid[index] || !!calendar[index]
        && timeRangeInvalid(calendar[index]!, time, clock, index);
    }
    if (picker === 'date' || picker === 'quarter' || picker === 'week') {
      const typed = quarterInputValues[index];
      const candidate = typed === undefined ? calendar[index] : typed;
      return !readOnly && !!texts[index]
        && (!candidate || invalid(candidate, index, undefined, picker, true));
    }
    return !readOnly
      && Boolean(
        texts[index]
        && (!parsePicker(texts[index], lang.locale, formats)
          || invalid(
            parsePicker(texts[index], lang.locale, formats)!,
            index,
            from()
          ))
      );
  }
  function editorInput(index: number, event: PickerEditorEvent<Event>) {
    if (!maskInputs[index].nativeInput(event)) {
      inputChange(index, event.currentTarget.value);
    }
  }
  function editorClick(index: number) {
    if (!time) {
      focusField(index);
      requestOpen(true);
    }
  }
  function editorFocus(index: number, event: PickerEditorEvent<FocusEvent>) {
    maskInputs[index].focus();
    focusField(index, true);
    if (time) {
      (time.onfocus ?? time.onFocus)?.(event, { range: index === 0 ? 'start' : 'end' });
    }
    else if (isPickerInputEvent(event)) {
      onfocus?.(event);
    }
  }
  function editorBlur(index: number, event: PickerEditorEvent<FocusEvent>) {
    maskInputs[index].blur();
    blurInput(index, event);
  }

  /** Keeps a separate mask, accessibility state, and active-endpoint indicator. */
  function editorAttributes(index: 0 | 1): DatePickerEditorAttributes {
    const nativeAttributes: object = attributes;
    const describedBy = [attributes['aria-describedby'], field?.describedBy].filter(Boolean);
    const range = index === 0 ? 'start' : 'end';
    const fieldId = index === 0
      ? typeof id === 'string' ? id : id?.start ?? field?.id
      : typeof id === 'object' ? id.end : undefined;
    return {
      ...nativeAttributes,
      id: fieldId,
      name: name ?? field?.name,
      placeholder: time ? timePlaceholder?.[index]
        : placeholder?.[index] ?? periodPlaceholder[index],
      type: 'text',
      role: 'combobox',
      'aria-haspopup': 'dialog',
      'aria-expanded': visible && active === index,
      'aria-controls': `ant-range-picker-${generatedId}`,
      'aria-invalid': inputInvalid(index) || field?.invalid || resolvedStatus === 'error'
        || attributes['aria-invalid'] || undefined,
      'aria-describedby': describedBy.join(' ') || undefined,
      required: attributes.required ?? field?.required,
      disabled: blocked[index],
      readonly: readOnly,
      autocomplete: 'off',
      value: maskInputs[index].value,
      defaultValue: maskInputs[index].value,
      class: semantic?.classes.input,
      style: semantic?.styles.input,
      size: timeInputSize,
      'data-range': time || components?.input ? range : undefined,
      ...maskEvents[index],
      oninput: event => editorInput(index, event),
      onclick: () => editorClick(index),
      onfocus: event => editorFocus(index, event),
      onblur: event => editorBlur(index, event),
      onkeydown: event => keyboard(event, index)
    };
  }
  function keyboard(
    event: PickerEditorEvent<KeyboardEvent>,
    index: number
  ) {
    const shared = (_event: KeyboardEvent, maskKey?: PickerMaskSharedKey) => {
      if (time) {
        if (event.key === 'Tab') {
          send(active, 'keyboard-submit-weak');
        }
        else if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          send(active, 'esc');
          requestOpen(false);
        }
        if (isPickerInputEvent(event)) {
          (time.onkeydown ?? time.onKeyDown)?.(event);
        }
        else {
          time.onKeyDown?.(event);
        }
      }
      else if (isPickerInputEvent(event)) {
        onkeydown?.(event);
      }
      if (event.defaultPrevented || event.isComposing || blocked[index]) {
        return false;
      }
      void keyboardAction(event, index, maskKey);
      return true;
    };
    if (!maskInputs[index].keydown(event, shared)) shared(event);
  }
  async function keyboardAction(
    event: PickerEditorEvent<KeyboardEvent>,
    index: number,
    maskKey?: PickerMaskSharedKey
  ) {
    if (time) {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (maskKey ? maskKey.enterValid : parseFieldInput(texts[index], calendar[index])) {
          send(index, 'keyboard-submit');
        }
      }
      else if (event.key === 'ArrowDown' && !maskKey) {
        event.preventDefault();
        requestOpen(true);
        await tick();
        if (panelReplacement || mode !== 'time') {
          focusPickerPanel(popup, mode, dates.formatKey(replacementValue(0), 'YYYY-MM-DD', lang.locale));
          return;
        }
        (popup?.querySelector<HTMLButtonElement>(
          '[data-picker-time-cell-selected] button:not(:disabled)'
        ) ?? popup?.querySelector<HTMLButtonElement>(
          'button[data-picker-time-control]:not(:disabled)'
        ))?.focus();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      send(index, 'esc');
      requestOpen(false);
    }
    else if (event.key === 'Enter') {
      event.preventDefault();
      if (!visible) {
        focusField(index);
        requestOpen(true);
      }
      else if ((!maskKey || maskKey.enterValid) && !inputInvalid(index))
        send(index, 'keyboard-submit');
    }
    else if (event.key === 'Tab') {
      if (!inputInvalid(index))
        send(index, 'keyboard-submit-weak');
    }
    else if (event.key === 'ArrowDown' && (picker === 'date' || providedMode !== undefined)
      && !maskKey) {
      event.preventDefault();
      requestOpen(true);
      await tick();
      focusPickerPanel(popup, mode, dates.formatKey(view, 'YYYY-MM-DD', lang.locale));
    }
  }
  function clear(event?: MouseEvent) {
    if (time) event?.stopPropagation();
    interaction.reset();
    revision++;
    commit(null);
    if (!time) onClear?.();
    requestOpen(false);
    if (time) onClear?.();
  }
  function presetValue(next: RangePickerValue<DateType>) {
    resetQuarterInput();
    interaction.reset();
    revision++;
    if (commit(next))
      requestOpen(false);
  }
  function setTimePanel(
    index: number,
    next: DateType,
    source: 'reset' | 'panel',
    event?: { previous: [DateType, DateType]; modes: RangePickerMode; }
  ) {
    const pair = event?.previous ?? panelValues();
    const changed = !dates.sameTime(pair[index], next);
    const copy: [DateType, DateType] = [...pair];
    copy[index] = next;
    if (!pickerValue) panels = copy;
    if (changed) {
      time?.onPickerValueChange?.(copy, {
        range: index === 1 ? 'end' : 'start', source, mode: event?.modes ?? panelModes()
      });
    }
  }
  function syncTimePanel(index: number, resetDefault: boolean) {
    const defaults = Array.isArray(defaultPickerValue)
      ? defaultPickerValue : [defaultPickerValue, defaultPickerValue];
    let next: DateType | null | undefined;
    if (defaults[index]) {
      if (!resetDefault) {
        return;
      }
      next = defaults[index];
    }
    else if (focused && timePanelWasOpen && previousTimeActive !== index) {
      next = panelValues()[index ^ 1];
    }
    else {
      next = calendar[index] || calendar[index ^ 1];
    }
    if (!next) {
      return;
    }
    if (!defaults[index]) {
      if (minDate && dates.isBefore(next, minDate)) next = minDate;
      if (maxDate && dates.isAfter(next, maxDate)) next = maxDate;
    }
    setTimePanel(index, next, 'reset');
  }
  /** OK reports the draft range before switching fields or committing the value. */
  function confirmField() {
    const index = active;
    // The onOk handler can change value or open in the same operation.
    const accepted = onOk && committed;
    const opened = visible;
    if (time && !calendar[index] && clock.defaultOpenValue) {
      send(index, 'panel-intermediate', clock.defaultOpenValue);
    }
    onOk?.([...calendar]);
    send(index, 'confirm', undefined, (field, all) => submitField(field, all, accepted, opened));
  }
  /** OK needs the active field's date. Range submission accounts for allowEmpty. */
  function canConfirmDate() {
    const selected = calendar[active];
    if (!selected) {
      return false;
    }

    const reference = picker === 'quarter' || picker === 'week' ? undefined : from();
    return !invalid(selected, active, reference);
  }
  function timeNowDisabled(date: DateType) {
    if (!time) {
      return false;
    }
    const other = calendar[active ^ 1];
    return !!(blocked[active ^ 1] && other && !dates.sameTime(other, date)
      && (active === 1 ? dates.isAfter(other, date) : dates.isAfter(date, other)))
      || timePickerDateDisabled(date, {
        minDate, maxDate,
        disabledDate: next => !!time.disabledDate?.(next, { type: 'time', from: from() })
      });
  }
  function handleTimeRootClick(event: MouseEvent & { currentTarget: HTMLDivElement; }) {
    if (!time || blocked.every(Boolean)) {
      return;
    }
    if (!rootElement?.contains(event.currentTarget.ownerDocument.activeElement))
      inputs()[blocked.findIndex(value => !value)]?.focus();
    requestOpen(true);
    (time.onclick ?? time.onClick)?.(event);
  }
  function handleTimePanelFocus(event: FocusEvent) {
    if (!time) {
      return;
    }
    focused = true;
    requestOpen(true);
    (time.onfocus ?? time.onFocus)?.(event, { range: active === 1 ? 'end' : 'start' });
  }
  function handleTimePanelBlur(event: FocusEvent & { currentTarget: HTMLDivElement; }) {
    if (!time) {
      return;
    }
    if (event.target instanceof Element && event.target.hasAttribute('disabled')) {
      event.currentTarget.focus({ preventScroll: true });
    }
    else {
      blurWithin(event);
    }
    (time.onblur ?? time.onBlur)?.(event, { range: active === 1 ? 'end' : 'start' });
  }
  function handleTimeHover(next: DateType | null) {
    if (previewValue !== 'hover') {
      return;
    }
    hover = next;
    if (!next) {
      const copy: [string, string] = [...texts];
      copy[active] = formatPicker(calendar[active], lang.locale, formats);
      texts = copy;
    }
  }
  export function focus(
    options?: FocusOptions & { index?: 0 | 1; cursor?: 'start' | 'end' | 'all'; }
  ) {
    const input = inputs()[options?.index ?? blocked.findIndex(item => !item)];
    input?.focus(options);
    if (options?.cursor) {
      input?.setSelectionRange(
        options.cursor === 'end' ? input.value.length : 0,
        options.cursor === 'start' ? 0 : input.value.length
      );
    }
  }
  export function blur() {
    inputs().forEach(input => input?.blur());
  }
  onMount(() => {
    if (attributes.autofocus)
      focus();
  });
</script>

<style>
  [data-picker-popup] {
    position:fixed;
    margin:0;
    padding:0;
    border:0;
    background:transparent;
    overflow:visible;
  }
  [data-picker-clear] {
    padding:0;
    border:0;
    background:transparent;
    cursor:pointer;
  }
  [data-picker-clear]:focus-visible {
    opacity:1;
    outline:2px solid var(--ant-color-primary);
  }
  [data-picker-current] {
    padding:0;
    border:0;
    background:transparent;
    color:var(--ant-color-link);
    font:inherit;
    cursor:pointer;
  }
  [data-picker-current]:disabled {
    color:var(--ant-color-text-disabled);
    cursor:not-allowed;
  }
  [data-picker-presets] button {
    border:0;
    padding:0;
    background:transparent;
    color:inherit;
    font:inherit;
    cursor:pointer;
  }
</style>

{#snippet dateCalendar(calendarMode: DatePickerCalendarMode, offset: number)}
  <DatePickerCalendar
    dateOperations={dates}
    classNames={dateSemantic?.classes.popup}
    styles={dateSemantic?.styles.popup}
    {picker}
    {showWeek}
    {...navigationIcons}
    prefixCls={prefix}
    panel={offset ? offsetPickerPanel(view, picker, offset) : view}
    timeTemplate={time ? view : offset ? undefined : clock.defaultOpenValue}
    selected={calendar[active]}
    range={calendarRange}
    hovered={periodWeakHover ? hover : undefined}
    onHover={time && calendarMode !== 'date' ? handleTimeHover : handleDateHover}
    mode={calendarMode}
    controlledMode={providedMode !== undefined}
    locale={timeLocale ?? (offset ? secondPanelLocale : panelLocale)}
    {cellRender}
    {cellRange}
    restrictions={{ minDate, maxDate, disabledDate: time ? replacementDisabled : panelDisabled }}
    {now}
    direction={config.direction}
    showPrevious={!offset}
    showNext={Boolean(offset) || !multiplePanels}
    onSelect={date => selectDate(date, offset)}
    onNavigate={date => navigatePanel(date, offset)}
    onModeChange={(next, date) => changePanelMode(next, date, offset)}
  />
{/snippet}

{#snippet replacementPanelBody(offset: number)}
  {#if panelReplacement}
    <PickerPanelReplacement panel={panelReplacement} context={replacementContext(offset)}
      dateCell={cellRender} timeCell={time?.cellRender} />
  {/if}
{/snippet}

{#snippet datePanelLayout()}
  <div class={`${prefix}-panel-layout`}>
        {#if presets?.length}<div data-picker-presets class={`${prefix}-presets`}><ul>{#each presets as preset, index (index)}<li><button type="button" onpointerenter={() => {
            if (previewValue)
              presetHover = rangePair(
                typeof preset.value === 'function' ? preset.value() : preset.value
              );
          }} onpointerleave={() => {
              presetHover = null;
            }} onclick={() => presetValue(
              rangePair(typeof preset.value === 'function' ? preset.value() : preset.value)
            )}>{#if typeof preset.label === 'function'}{@render preset.label()}{:else}{preset.label}{/if}</button></li>{/each}</ul></div>{/if}
        <div><div class={multiplePanels ? `${prefix}-panels` : undefined}>
          <div class={[`${prefix}-panel`,
            panelReplacement && config.direction === 'rtl' && `${prefix}-panel-rtl`]}
            data-picker-authored-panel={panelReplacement ? true : undefined} tabindex="-1">
            {#if panelReplacement}
              {@render replacementPanelBody(0)}
            {:else}<div class={showTime && mode === 'date'
              ? `${prefix}-datetime-panel`
              : undefined}>
            {#if mode !== 'time'}{@render dateCalendar(mode, 0)}{/if}
            {#if mode === 'time' || showTime && mode === 'date'}
              <DatePickerTimePanel
                dateOperations={dates}
                classNames={dateSemantic?.classes.popup}
                styles={dateSemantic?.styles.popup}
                prefixCls={prefix}
                value={calendar[active] ?? datePanelValue}
                selectedValue={calendar[active]}
                config={clock}
                showColumns={Boolean(showTime)}
                format={timeFormat}
                locale={panelLocale}
                {now}
                {cellRender}
                {cellRange}
                disabledTime={showTime ? timeRestriction : undefined}
                onSelect={selectTime}
                onHover={handleTimeHover}
              />
            {/if}
          </div>{/if}</div>
          {#if multiplePanels && mode !== 'time'}
            <div class={[`${prefix}-panel`,
              panelReplacement && config.direction === 'rtl' && `${prefix}-panel-rtl`]}
              data-picker-authored-panel={panelReplacement ? true : undefined} tabindex="-1">
              {#if panelReplacement}
                {@render replacementPanelBody(1)}
              {:else}
                {@render dateCalendar(mode, 1)}
              {/if}
            </div>
          {/if}
        </div>
        {#if renderExtraFooter || confirm || mode === 'date' && showCurrent}
        <div class={[`${prefix}-footer`, dateSemantic?.classes.popup.footer]}
          style={dateSemantic?.styles.popup.footer}>
          {#if renderExtraFooter}<div class={`${prefix}-footer-extra`}>{@render renderExtraFooter(mode)}</div>{/if}
          {#if confirm || mode === 'date' && showCurrent}<ul class={`${prefix}-ranges`}>{#if mode === 'date' && showCurrent}<li class={`${prefix}-now`}><button type="button" data-picker-current class={`${prefix}-now-btn`} disabled={pickerDateDisabled(
            now,
            { minDate, maxDate, disabledDate: panelDisabled }
          )} onclick={() => send(
              active,
              'confirm',
              validPickerTime(adapter.getNow(), clock)
            )}>{showTime ? lang.now : lang.today}</button></li>{/if}
            {#if confirm}<li class={`${prefix}-ok`}>
              <PickerConfirmButton component={components?.button}
                disabled={!canConfirmDate()} onclick={confirmField} children={lang.ok} />
            </li>{/if}</ul>{/if}</div>{/if}
        </div>
      </div>
{/snippet}

{#snippet timePanelLayout()}
  <div class={`${prefix}-panel-layout`}>
    {#if presets?.length}<div data-picker-presets class={`${prefix}-presets`}><ul>
      {#each presets as preset, index (index)}<li><button
        type="button"
        onmouseenter={() => {
          if (previewValue) presetHover = rangePair(
            typeof preset.value === 'function' ? preset.value() : preset.value
          );
        }}
        onmouseleave={() => { presetHover = null; }}
        onclick={() => presetValue(rangePair(
          typeof preset.value === 'function' ? preset.value() : preset.value
        ))}
      >{#if typeof preset.label === 'function'}{@render preset.label()}
      {:else}{preset.label}{/if}</button></li>{/each}
    </ul></div>{/if}
    <div>
      <div
        class={[`${prefix}-panel`, config.direction === 'rtl' && `${prefix}-panel-rtl`]}
        data-picker-authored-panel={panelReplacement ? true : undefined}
        tabindex="-1"
      >
        {#if panelReplacement}
          {@render replacementPanelBody(0)}
        {:else if mode === 'date'}
          <div class={`${prefix}-datetime-panel`}>
            {@render dateCalendar(mode, 0)}
            {@render timePanelBody()}
          </div>
        {:else if mode !== 'time'}
          {@render dateCalendar(mode, 0)}
        {:else}
          {@render timePanelBody()}
        {/if}
      </div>
      {#if confirm || showCurrent || time?.renderExtraFooter}
        <div
          class={[`${prefix}-footer`, semantic?.classes.popup.footer]}
          style={semantic?.styles.popup.footer}
        >
          {#if time?.renderExtraFooter}<div class={`${prefix}-footer-extra`}>
            {@render time.renderExtraFooter(mode)}
          </div>{/if}
          {#if confirm || showCurrent}<ul class={`${prefix}-ranges`}>
            {#if showCurrent}<li class={`${prefix}-now`}><button
              type="button"
              data-picker-current class={`${prefix}-now-btn`}
              disabled={timeNowDisabled(now)}
              onclick={() => send(active, 'confirm', validPickerTime(
                adapter.getNow(), clock, timeRestriction
              ))}
            >{lang.now}</button></li>{/if}
            {#if confirm}<li class={`${prefix}-ok`}><PickerConfirmButton component={components?.button}
              disabled={!calendar[active] && !clock.defaultOpenValue
                || !!(calendar[active] || clock.defaultOpenValue)
                  && invalid((calendar[active] || clock.defaultOpenValue)!, active)}
              onclick={confirmField}
              children={lang.ok}
            /></li>{/if}
          </ul>{/if}
        </div>
      {/if}
    </div>
  </div>
{/snippet}
{#snippet timePanelBody()}
  {#if timeLocale}<PickerTimePanel dateOperations={dates} prefixCls={prefix}
    value={calendar[active] || clock.defaultOpenValue || null}
    pickerValue={view}
    config={clock}
    locale={timeLocale}
    {now}
    disabledTime={timeRestriction}
    onSelect={selectTime}
    onHover={handleTimeHover}
    onConfirm={confirm ? () => send(active, 'confirm') : undefined}
    cellRender={time?.cellRender}
    range={cellRange}
    class={semantic?.classes.popup.content}
    style={semantic?.styles.popup.content}
    itemClass={semantic?.classes.popup.item}
    itemStyle={semantic?.styles.popup.item}
  />{/if}
{/snippet}{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`picker-prefix:${prefix}:${rootPrefix}`} />{/if}<div
  bind:this={rootElement} data-ant-picker-prefix={prefix} data-ant-picker-root-prefix={rootPrefix}
  role={time ? 'presentation' : 'group'}
  style={componentTheme.style || time || semantic?.styles.root
    ? [componentTheme.style, semantic?.styles.root,
      style].filter(Boolean).join(';') : style}
  dir={config.direction}
  onfocusout={blurWithin}
  onclick={time ? handleTimeRootClick : undefined}
  class={[
      `${prefix} ${prefix}-range ant-picker-css-var`,
      componentTheme.className,
      `${prefix}-${resolvedVariant}`,
      blocked.every(Boolean) && `${prefix}-disabled`,
      visible && `${prefix}-open`,
      focused && `${prefix}-focused`,
      texts.some((_, index) => inputInvalid(index)) && `${prefix}-invalid`,
      resolvedSize === 'large' && `${prefix}-large`,
      resolvedSize === 'small' && `${prefix}-small`,
      resolvedStatus && `${prefix}-status-${resolvedStatus}`,
      feedback.hasFeedback && `${prefix}-has-feedback`,
      config.direction === 'rtl' && `${prefix}-rtl`,
      compactClasses(prefix, config.direction, compact),
      time && semantic?.classes.root,
      className,
      config.rangePicker?.class,
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
  <div class={[
      `${prefix}-input ${prefix}-input-start`,
      focused && active === 0 && `${prefix}-input-active`,
      time && previewValue && (presetHover || hover && active === 0)
        && `${prefix}-input-placeholder`
    ]}>
    {#if components?.input}
      <PickerEditor editor={components.input} attributes={editorAttributes(0)}
        register={customInputs[0].register} range="start" size={resolvedSize} />
    {:else}
      <input {...editorAttributes(0)} bind:this={nativeStart} {@attach maskInputs[0].attach} />
    {/if}
  </div>
  <div class={`${prefix}-range-separator`}>{#if !time && typeof resolvedSeparator === 'function'}{@render resolvedSeparator()}{:else}<span class={`${prefix}-separator`} aria-hidden={time && resolvedSeparator !== undefined ? undefined : 'true'}>{#if typeof resolvedSeparator === 'function'}{@render resolvedSeparator()}{:else if resolvedSeparator !== undefined}{resolvedSeparator}{:else}<PickerRangeSeparator />{/if}</span>{/if}</div>
  <div class={[
      `${prefix}-input ${prefix}-input-end`,
      focused && active === 1 && `${prefix}-input-active`,
      time && previewValue && (presetHover || hover && active === 1)
        && `${prefix}-input-placeholder`
    ]}>
    {#if components?.input}
      <PickerEditor editor={components.input} attributes={editorAttributes(1)}
        register={customInputs[1].register} range="end" size={resolvedSize} />
    {:else}
      <input {...editorAttributes(1)} bind:this={nativeEnd} {@attach maskInputs[1].attach} />
    {/if}
  </div>
  <div class={`${prefix}-active-bar`} style={`position:absolute;`
    + `left:${bar.left}px;`
    + `width:${bar.width}px`}></div>
  {#if suffixContent !== false && suffixContent !== null && suffixContent !== ''}
    <span
      class={[`${prefix}-suffix`, semantic?.classes.suffix]}
      style={semantic?.styles.suffix}
      aria-hidden="true"
    >{#if typeof suffixContent === 'function'}{@render suffixContent()}{:else if suffixContent === undefined || suffixContent === true}{#if time}<PickerClockIcon />{:else}<PickerCalendarIcon />{/if}{#if feedback.hasFeedback && feedback.icon}<FormFeedbackIcon descriptor={feedback.icon} />{/if}{:else}{suffixContent}{/if}</span>
  {/if}
  {#if clearEnabled && (time ? calendar : committed)
      .some((date, index) => (date || time && previewValue
        && (presetHover?.[index] || index === active && hover)) && !blocked[index])}
    <button
      type="button"
      data-picker-clear class={`${prefix}-clear`}
      aria-label={lang.clear}
      onpointerdown={event => event.preventDefault()}
      onclick={clear}
    >{#if typeof clearContent === 'function'}{@render clearContent()}
    {:else if clearContent === null
        || typeof clearContent === 'boolean' || clearContent === ''}<span class={`${prefix}-clear-btn`}></span>
    {:else if clearContent !== undefined}{clearContent}
    {:else}<Icon name="close-circle-filled" />{/if}</button>
  {/if}
</div><NoCompactStyle>{#key container.target}{#if visible}
    {@const initialPopupStyle = untrack(() => popupThemeStyle)}
    <div bind:this={popup} data-picker-popup data-ant-picker-prefix={prefix} data-ant-picker-root-prefix={rootPrefix} id={`ant-range-picker-${generatedId}`} popover="manual" role="dialog" tabindex="-1" aria-label={attributes['aria-label'] ?? (time ? lang.timeSelect : lang.placeholder)} hidden={!shown} onfocusout={blurWithin}
      class={[
          `${prefix}-dropdown ant-picker-css-var`,
          componentTheme.className,
          time && `${prefix}-dropdown-range`,
          config.direction === 'rtl' && `${prefix}-dropdown-rtl`,
          popupPlacement && `${prefix}-dropdown-placement-${popupPlacement}`,
          semantic?.classes.popup.root,
          time && rootClassName
        ]}
      style={initialPopupStyle}
      {@attach attachPopupStyle}
      {@attach container.portal}
      onkeydown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            send(active, 'esc');
            requestOpen(false);
            inputs()[active]?.focus();
          }
        }}>
      {#if time}
        <div
          bind:this={timeWrapper}
          class={`${prefix}-range-wrapper ${prefix}-time-range-wrapper`}
        >
          <div data-picker-range-arrow class={`${prefix}-range-arrow`} style={`left:${timePosition.arrow}px`}></div>
          <div
            bind:this={timeContainer}
            class={[
              `${prefix}-panel-container ${prefix}-${replacementMode}-panel-container`,
              semantic?.classes.popup.container
            ]}
            style={[
              config.direction === 'rtl'
                ? `margin-right:${timePosition.offset}px;`
                  + `margin-left:auto`
                : `margin-left:${timePosition.offset}px;`
                  + `margin-right:auto`,
              semantic?.styles.popup.container
            ].filter(Boolean).join(';')}
            tabindex="-1"
            onfocusin={handleTimePanelFocus}
            onfocusout={handleTimePanelBlur}
          >
            {#if time.panelRender}{@render time.panelRender(timePanelLayout)}
            {:else}{@render timePanelLayout()}{/if}
          </div>
        </div>
      {:else}
      <div data-picker-range-arrow class={`${prefix}-range-arrow`} style={`left:${bar.left + bar.width / 2}px`}></div>
      <div class={[`${prefix}-panel-container`,
          panelReplacement && `${prefix}-${replacementMode}-panel-container`,
          dateSemantic?.classes.popup.container]}
        style={dateSemantic?.styles.popup.container}>
        {#if panelRender}{@render panelRender(datePanelLayout)}
        {:else}{@render datePanelLayout()}{/if}
      </div>
      {/if}
    </div>
{/if}{/key}</NoCompactStyle>
