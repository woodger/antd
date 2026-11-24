<script lang="ts">
  // Координирует два редактора, draft диапазона и панели календаря. Подтверждение публикует
  // диапазон отдельно от навигации.
  import { onMount, tick, untrack } from 'svelte';
  import type { Dayjs } from 'dayjs';
  import type { RangePickerMode, RangePickerProps, RangePickerValue } from './range-picker.types';
  import type { DatePickerCalendarMode, DatePickerMode, DatePickerTimeConfig } from './date-picker.types';
  import {
    createRangeInteraction,
    type RangeInteractionSource
  } from './range-picker-interaction.engine';
  import {
    rangePair,
    rangeFlags,
    sameRange,
    rangeFrom,
    orderedRange,
    validRange
  } from './range-picker.engine';
  import {
    pickerFormats,
    pickerCalendarValue,
    samePickerPanelValue,
    nextPickerPanelMode,
    offsetPickerPanel,
    samePickerPanel,
    samePickerQuarter,
    samePickerWeek,
    formatPicker,
    parsePicker,
    pickerDateDisabled,
    pickerTimeDisabled,
    validPickerTime
  } from './date-picker.engine';
  import { dayjsGenerateConfig as adapter } from './date-picker-dayjs.engine';
  import { normalizePickerFieldFormat } from './picker-mask.engine';
  import { createPickerMaskInput, type PickerMaskSharedKey } from './picker-mask-input.model.svelte.js';
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
    createPickerPopup, focusPickerPanel, getPickerPopupPosition, preservePickerPanelFocus
  } from './picker-popup.model.svelte.js';
  import NoCompactStyle from './NoCompactStyle.svelte';
  import Button from './Button.svelte';
  import DatePickerCalendar from './DatePickerCalendar.svelte';
  import DatePickerTimePanel from './DatePickerTimePanel.svelte';
  import Icon from './Icon.svelte';
  import PickerCalendarIcon from './PickerCalendarIcon.svelte';
  import PickerRangeSeparator from './PickerRangeSeparator.svelte';
  import PickerClockIcon from './PickerClockIcon.svelte';
  import PickerTimePanel from './PickerTimePanel.svelte';
  import {
    datePickerClock, timePickerFormats, timePickerLang, timePickerSameValue
  } from './time-picker.engine';
  import {
    parseTimeRangeInput,
    sameTimeRange,
    samePickerTime,
    timeRangeClock,
    timeRangeInvalid,
    validTimeRange
  } from './time-range-picker.engine';
  import { timePickerDateDisabled } from './time-picker.engine';
  import { timeRangeSemantic } from './time-range-picker-semantic.engine';
  import { datePickerSemantic } from './date-picker-semantic.engine';
  import type { TimeRangePickerProps } from './time-range-picker.types';
  import { connectTimeRangePopup } from './time-range-picker-popup.dom';
  let {
    time,
    dateProps,
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
    panelRender,
    separator,
    presets,
    previewValue = 'hover',
    placement,
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
  }: RangePickerProps & { time?: TimeRangePickerProps; dateProps?: RangePickerProps; } = $props();
  const config = useConfig();
  let prefix = $derived(config.getPrefixCls('picker', prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getPickerPrefixCss(prefix, rootPrefix));
  const variantContext = useVariant('rangePicker', () => ({
    variant
  }));
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
  const initial = untrack(() => rangePair(defaultValue));
  let internalValue = $state.raw<RangePickerValue>(initial);
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
  let formatConfig = $derived(
    {
      format,
      picker,
      showTime: typeof showTime === 'object'
        ? { ...showTime, defaultOpenValue: undefined }
        : showTime
    }
  );
  let formats = $derived(time ? timePickerFormats(time, lang) : pickerFormats(formatConfig, lang));
  let maskFormat = $derived(normalizePickerFieldFormat<Dayjs>(time ? time.format : format, '').mask);
  let readOnly = $derived(
    time && typeof formats[0] === 'function'
      || (inputReadOnly ?? (attributes.readonly
        || formats.every(item => typeof item === 'function')))
  );
  let calendar = $state.raw<RangePickerValue>(
    untrack(() => value === undefined ? [...initial] : rangePair(value))
  );
  let submit = $state.raw<RangePickerValue>(untrack(() => [...calendar]));
  let texts = $state<[string, string]>(untrack(() => dateTexts(calendar)));
  let rawInvalid = $state<[boolean, boolean]>([false, false]);
  let quarterInputValues = $state.raw<[Dayjs | null | undefined, Dayjs | null | undefined]>([undefined, undefined]);
  let revision = $state(0);
  const interaction = createRangeInteraction<Dayjs>({
    fieldCount: () => blocked.filter(item => !item).length,
    needConfirm: () => confirm,
    allowEmpty: () => empty,
    getCalendarValue: () => calendar,
    triggerCalendarChange: (index, next) => {
      const copy: RangePickerValue = [...calendar];
      copy[index] = next;
      changeCalendar(copy);
    },
    flushSubmit: (index, all) => {
      const copy: RangePickerValue = [...submit];
      copy[index] = calendar[index];
      submit = copy;
      if (all) {
        commit(copy);
        requestOpen(false);
      }
    },
    resetValue: index => {
      resetQuarterInput(index);
      if (index === undefined) {
        changeCalendar(committed);
        submit = [...committed];
      }
      else {
        const copy: RangePickerValue = [...calendar];
        copy[index] = committed[index];
        changeCalendar(copy);
        const next: RangePickerValue = [...submit];
        next[index] = committed[index];
        submit = next;
      }
    }
  });
  let active = $derived.by(() => {
    void revision;
    return interaction.activeIndex;
  });
  let clock = $derived.by((): DatePickerTimeConfig => {
    if (time) {
      return timeRangeClock(time, lang, active);
    }
    const raw = typeof showTime === 'object' ? showTime : {};
    return datePickerClock({
      format,
      showTime: { ...raw, defaultOpenValue: raw.defaultOpenValue?.[active] }
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
  let startElement = $state<HTMLInputElement>();
  let endElement = $state<HTMLInputElement>();
  let popup = $state<HTMLDivElement>();
  let timeWrapper = $state<HTMLDivElement>();
  let timeContainer = $state<HTMLDivElement>();
  let timePosition = $state({ arrow: 0, offset: 0 });
  let now = $state.raw(untrack(() => adapter.getNow()));
  let panels = $state.raw<[Dayjs, Dayjs]>(untrack(() => {
    const base = initialPanel(0);
    return [base, initialPanel(1)];
  }));
  let view = $derived(panelValues()[active]);
  let datePanelValue = $derived(pickerCalendarValue(view, clock.defaultOpenValue));
  let localMode = $state<DatePickerMode>(untrack(() => picker));
  let mode = $derived(providedMode?.[active] ?? localMode);
  let dateModes = $derived<RangePickerMode>([localMode, localMode]);
  let periodModes = $state.raw<RangePickerMode>(untrack(() => [picker, picker]));
  let multiplePanels = $derived(!showTime && mode === picker);
  const panelFocus = preservePickerPanelFocus(() => ({
    popup, mode, date: view.format('YYYY-MM-DD'), controlled: providedMode !== undefined,
    editor: active === 1 ? endElement : startElement
  }));
  let periodPlaceholder = $derived(picker === 'week' ? lang.rangeWeekPlaceholder
    : picker === 'quarter' ? lang.rangeQuarterPlaceholder
    : picker === 'month' ? lang.rangeMonthPlaceholder
    : picker === 'year' ? lang.rangeYearPlaceholder : lang.rangePlaceholder);
  let showCurrent = $derived((showNow ?? false) && mode === 'date');
  let hover = $state.raw<Dayjs | null>(null);
  let presetHover = $state.raw<RangePickerValue | null>(null);
  let displayRange = $derived.by((): RangePickerValue => {
    const pair: RangePickerValue = presetHover && previewValue ? [...presetHover] : [...calendar];
    if (hover && previewValue)
      pair[active] = hover;
    return pair[0] && pair[1] && pair[0].isAfter(pair[1]) ? [pair[1], pair[0]] : pair;
  });
  let periodWeakHover = $derived(picker !== 'date' && !!hover
    && !calendar[active ^ 1] && calendar[active]?.valueOf() !== committed[active]?.valueOf());
  let calendarRange = $derived(picker === 'date' ? displayRange : periodWeakHover ? undefined
    : [displayRange[0] ?? displayRange[1], displayRange[1] ?? displayRange[0]] as RangePickerValue);
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
  $effect(() => { for (const input of maskInputs) input.sync(); });
  let bar = $state({ left: 0, width: 0 });
  let actualPlacement = $derived(
    placement ?? (config.direction === 'rtl' ? 'bottomRight' : 'bottomLeft')
  );
  let verticalPlacement = $state<'top' | 'bottom'>('bottom');
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

    // Семантика получает исходные props, не меняя вызовы callbacks внутри core.
    const props = { ...dateProps, size: resolvedSize, disabled: semanticDisabled, status, variant };
    return datePickerSemantic(props, settings, classNames, styles, providerStyle);
  });
  let semantic = $derived(time ? timeRangeSemantic(time, config.timePicker, config.rangePicker, {
    size: resolvedSize,
    disabled: semanticDisabled
  }) : dateSemantic);
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
  let previousPeriodMode = untrack(() => ({ open: false, active, picker, controlled: false }));
  let dateFocusIndex: number | null = null;
  $effect.pre(() => {
    if (time) {
      return;
    }
    const current = { open: visible, active, picker, controlled: providedMode !== undefined };
    if (previousPeriodMode.controlled && !current.controlled) {
      localMode = picker;
      periodModes = [picker, picker];
    }
    else if (current.open && (current.picker !== previousPeriodMode.picker
      || picker !== 'date' && (!previousPeriodMode.open
        || current.active !== previousPeriodMode.active))) {
      untrack(() => setMode(picker, current.active));
    }
    // Закрытая смена picker применяется при открытии; обычный date reopen сохраняем.
    previousPeriodMode = {
      ...current, picker: current.open ? picker : previousPeriodMode.picker
    };
  });
  const popupThemeStyle = $derived(
    [componentTheme.style, semantic?.styles.popup.root].filter(Boolean).join(';') || undefined
  );
  const datePopupStyle = untrack(() =>
    time ? undefined : createOverlayStyle(() => [popupThemeStyle]));

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
  $effect(() => {
    nativeElement = rootElement;
    return () => { nativeElement = undefined; };
  });
  $effect(() => {
    startInput = startElement;
    return () => { startInput = undefined; };
  });
  $effect(() => {
    endInput = endElement;
    return () => { endInput = undefined; };
  });
  $effect(() => {
    if (time && value !== previousValue) internalValue = rangePair(value);
    previousValue = value;
  });
  $effect(() => {
    const start = dateStartText;
    const end = dateEndText;
    // Изменение prefix/theme без нового value/отображения сохраняет обе draft-границы.
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

    // React useFocusLock выполняет сильный переход после native focus внешнего клика.
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
      preserveFocus: event => {
        if (time || !(cellRender || panelRender || renderExtraFooter)) {
          return true;
        }
        for (const target of event.composedPath()) {
          if (target === popup) break;
          if (target instanceof HTMLElement
            && (target.matches('input, textarea, select') || target.isContentEditable)) {
            return false;
          }
        }
        return true;
      },
      onPlacement: next => {
        verticalPlacement = next === 'top' ? 'top' : 'bottom';
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
    });
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
  function dateTexts(pair: RangePickerValue): [string, string] {
    return [
      formatPicker(pair[0], lang.locale, formats),
      formatPicker(pair[1], lang.locale, formats)
    ];
  }
  function initialPanel(index: number): Dayjs {
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
      ?? (time ? adapter.getNow().startOf('day') : adapter.getNow());
  }
  function panelValues(): [Dayjs, Dayjs] {
    return pickerValue
      ? Array.isArray(pickerValue) ? pickerValue : [pickerValue, pickerValue]
      : panels;
  }
  function from() {
    return rangeFrom(calendar, interaction.triggeredFields, active);
  }
  function timeRestriction(date: Dayjs) {
    if (time) {
      return time.disabledTime?.(date, active === 1 ? 'end' : 'start', {
        from: from()
      }) ?? {};
    }
    return disabledTime?.(date, active === 1 ? 'end' : 'start', { from: from() }) ?? {};
  }
  function invalid(
    date: Dayjs,
    index: number,
    reference?: Dayjs,
    type: DatePickerCalendarMode = picker,
    typeOnlyInfo = false
  ) {
    if (time) {
      return timeRangeInvalid(date, time, clock, index,
        reference === undefined ? undefined : { from: reference });
    }
    const other = calendar[index ^ 1];
    const same = other
      && (type === 'decade'
        ? Math.floor(other.year() / 10) === Math.floor(date.year() / 10)
        : type === 'week' ? samePickerWeek(other, date, lang.locale)
        : type === 'quarter' ? samePickerQuarter(other, date)
        : other.isSame(date, type === 'date' ? 'day' : type));
    if (blocked[index ^ 1]
      && other
      && !same
      && (index === 1
        ? other.isAfter(date)
        : date.isAfter(other))) {
      return true;
    }
    if (pickerDateDisabled(
      date,
      {
        minDate,
        maxDate,
        disabledDate: next => Boolean(disabledDate?.(next, typeOnlyInfo
          || (type === 'quarter' || type === 'week') && reference === undefined
          ? { type } : { type, from: reference }))
      },
      type,
      lang.locale
    )) {
      return true;
    }
    const config = typeof showTime === 'object'
      ? { ...showTime, defaultOpenValue: undefined }
      : showTime;
    return pickerTimeDisabled(
      date,
      {
        showTime: config,
        disabledTime: next => disabledTime?.(
          next,
          index === 1 ? 'end' : 'start',
          { from: reference }
        )
          ?? {}
      }
    );
  }
  function panelDisabled(date: Dayjs, info: { type: DatePickerCalendarMode; }) {
    const other = calendar[active ^ 1];
    const same = other
      && (info.type === 'decade'
        ? Math.floor(other.year() / 10) === Math.floor(date.year() / 10)
        : info.type === 'week' ? samePickerWeek(other, date, lang.locale)
        : info.type === 'quarter' ? samePickerQuarter(other, date)
        : other.isSame(date, info.type === 'date' ? 'day' : info.type));
    return Boolean(
      blocked[active ^ 1]
      && other
      && !same
      && (active === 1
        ? other.isAfter(date)
        : date.isAfter(other))
      || disabledDate?.(
        date,
        { ...info, from: from() }
      )
    );
  }
  function changeCalendar(next: RangePickerValue) {
    const sameDate = time ? timePickerSameValue : (a: Dayjs | null, b: Dayjs | null) =>
      a?.valueOf() === b?.valueOf();
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
  function commit(next: RangePickerValue | null) {
    const pair: RangePickerValue = next === null
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
      const changed = time ? !sameTimeRange(pair, committed) : !sameRange(pair, committed);
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
  function requestOpen(next: boolean) {
    if (next && blocked.every(Boolean) || next === visible) {
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
  function syncPanel(index: number, source: 'reset' | 'panel', preserve: boolean, target?: Dayjs) {
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
      && !calendar[1].isSame(
        calendar[0],
        'month'
      )
      && !calendar[1].isSame(
        calendar[0].add(1, 'month'),
        'month'
      )) {
      next = calendar[1].add(-1, 'month');
    }
    if (minDate && next.isBefore(minDate))
      next = minDate;
    const dual = picker === 'date' && !providedMode ? !showTime : multiplePanels;
    if (maxDate && (dual ? offsetPickerPanel(next, picker, 1) : next).isAfter(maxDate))
      next = dual ? offsetPickerPanel(maxDate, picker, -1) : maxDate;
    setDatePanel(index, next, source);
  }
  function panelModes(): RangePickerMode {
    if (providedMode) {
      return [...providedMode];
    }
    return picker === 'date' ? dateModes : periodModes;
  }
  function setMode(next: DatePickerMode, index = active, viewDate?: Dayjs) {
    if (providedMode) {
      if (viewDate) publishPanelChange(index, next, viewDate);
      return;
    }
    localMode = next;
    if (picker !== 'date' && periodModes[index] !== next) {
      const modes: RangePickerMode = [...periodModes];
      modes[index] = next;
      periodModes = modes;
    }
    if (viewDate) {
      const values: RangePickerValue = [...calendar];
      values[index] = viewDate;
      onPanelChange?.(values, panelModes());
    }
  }
  function publishPanelChange(index: number, next: DatePickerMode, date?: Dayjs) {
    const modes: RangePickerMode = [...panelModes()];
    modes[index] = next;
    const values: RangePickerValue = [...calendar];
    if (date) {
      values[index] = date;
    }
    onPanelChange?.(values, modes);
  }
  function navigatePanel(date: Dayjs, offset = 0) {
    const next = offset ? offsetPickerPanel(date, picker, -offset) : date;
    if (providedMode) {
      setDatePanel(active, next, 'panel');
      publishPanelChange(active, mode, date);
      return;
    }
    syncPanel(active, 'panel', false, next);
  }
  function changePanelMode(next: DatePickerCalendarMode, date?: Dayjs, offset = 0) {
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
      if (offset) syncPanel(active, 'panel', false, view.add(1, 'month'));
      localMode = next;
      onPanelChange?.([...calendar], [next, next]);
    }
  }
  function setDatePanel(
    index: number,
    next: Dayjs,
    source: 'reset' | 'panel',
    event?: { previous: [Dayjs, Dayjs]; modes: RangePickerMode }
  ) {
    const previous = event?.previous ?? panelValues();
    const pair: [Dayjs, Dayjs] = [...previous];
    pair[index] = next;
    if (!pickerValue) panels = pair;
    if (pair.some((date, part) =>
      !samePickerPanelValue(previous[part], date, Boolean(showTime), picker, lang.locale))) {
      onPickerValueChange?.(pair, {
        source, range: index === 1 ? 'end' : 'start', mode: event?.modes ?? panelModes()
      });
    }
  }
  function send(index: number, source: RangeInteractionSource, next?: Dayjs | null) {
    const previous = interaction.activeIndex;
    interaction.trigger(index, source, next);
    revision++;
    if (interaction.activeIndex !== previous) {
      hover = null;
      setMode(picker, interaction.activeIndex);
      if (time) syncPanel(interaction.activeIndex, 'reset', true);
    }
    const target = interaction.currentIndex;
    if (!time && target !== null && interaction.forceFocus) {
      requestOpen(true);
      void tick().then(() => {
        if (interaction.currentIndex === target && visible && inputs()[target]?.isConnected)
          inputs()[target]?.focus();
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
        if (visible && inputs()[index]?.ownerDocument.activeElement === inputs()[index])
          inputs()[accepted]?.focus();
      });
    }
  }
  function blurInput(
    index: number,
    event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement; }
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
    else {
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
      const current = popup ? getPopupActiveElement(popup)
        : startElement?.ownerDocument.activeElement;
      if (!startElement?.isConnected
        || panelFocus.moving && (!current || current === startElement.ownerDocument.body)
        || current
        && (rootElement?.contains(current)
          || popup?.contains(
            current
          ))) {
        return;
      }
      focused = false;
      field?.onBlur();
      requestOpen(false);
    });
  }
  function selectIntermediateDate(
    date: Dayjs,
    index: number,
    event: { previous: [Dayjs, Dayjs]; modes: RangePickerMode }
  ) {
    const nextMode = nextPickerPanelMode(picker, event.modes[index]);
    send(index, 'panel-intermediate', date);
    setDatePanel(index, date, 'panel', event);
    if (nextMode) {
      // Второй PickerPanel setter использует тот же снимок mode/pickerValue.
      setDatePanel(index, date, 'panel', event);
      setMode(nextMode, index, date);
    }
  }
  function selectDate(date: Dayjs, panelOffset = 0) {
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
        base.year(date.year()).month(date.month()).date(date.date()),
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
  function handleDateHover(date: Dayjs | null) {
    if (date && showTime) {
      const base = calendar[active] ?? datePanelValue;
      date = base.year(date.year()).month(date.month()).date(date.date());
    }
    hover = date;
  }
  function selectTime(date: Dayjs) {
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
  // Ввод, маска и подтверждение используют дату одной и той же редактируемой границы.
  function parseFieldInput(text: string, boundary: Dayjs | null): Dayjs | null {
    return time ? parseTimeRangeInput(text, lang.locale, formats, boundary)
      : parsePicker(text, lang.locale, formats);
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
  function keyboard(
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement; },
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
        (time.onkeydown ?? time.onKeyDown)?.(event);
      }
      else {
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
    event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement; },
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
      focusPickerPanel(popup, mode, view.format('YYYY-MM-DD'));
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
  function presetValue(next: RangePickerValue) {
    resetQuarterInput();
    interaction.reset();
    revision++;
    if (commit(next))
      requestOpen(false);
  }
  function setTimePanel(index: number, next: Dayjs, source: 'reset' | 'panel') {
    const pair = panelValues();
    const changed = !samePickerTime(pair[index], next);
    const copy: [Dayjs, Dayjs] = [...pair];
    copy[index] = next;
    if (!pickerValue) panels = copy;
    if (changed) {
      time?.onPickerValueChange?.(copy, {
        range: index === 1 ? 'end' : 'start', source, mode: ['time', 'time']
      });
    }
  }
  function syncTimePanel(index: number, resetDefault: boolean) {
    const defaults = Array.isArray(defaultPickerValue)
      ? defaultPickerValue : [defaultPickerValue, defaultPickerValue];
    let next: Dayjs | null | undefined;
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
      if (minDate && next.isBefore(minDate)) next = minDate;
      if (maxDate && next.isAfter(maxDate)) next = maxDate;
    }
    setTimePanel(index, next, 'reset');
  }
  function confirmTime() {
    if (!calendar[active] && clock.defaultOpenValue)
      send(active, 'panel-intermediate', clock.defaultOpenValue);
    onOk?.([...calendar]);
    send(active, 'confirm');
  }
  function timeNowDisabled(date: Dayjs) {
    if (!time) {
      return false;
    }
    const other = calendar[active ^ 1];
    return !!(blocked[active ^ 1] && other && !samePickerTime(other, date)
      && (active === 1 ? other.isAfter(date) : date.isAfter(other)))
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
  function handleTimeHover(next: Dayjs | null) {
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
  [data-picker-popup] { position:fixed;margin:0;padding:0;border:0;background:transparent;overflow:visible; }
  [data-picker-clear] { padding:0;border:0;background:transparent;cursor:pointer; }
  [data-picker-clear]:focus-visible { opacity:1;outline:2px solid var(--ant-color-primary); }
  [data-picker-current] { padding:0;border:0;background:transparent;color:var(--ant-color-link);font:inherit;cursor:pointer; }
  [data-picker-current]:disabled { color:var(--ant-color-text-disabled);cursor:not-allowed; }
  [data-picker-presets] button { border:0;padding:0;background:transparent;color:inherit;font:inherit;cursor:pointer; }
</style>

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
          <div class={`${prefix}-panel`} tabindex="-1"><div class={showTime && mode === 'date'
              ? `${prefix}-datetime-panel`
              : undefined}>
            {#if mode !== 'time'}<DatePickerCalendar
              classNames={dateSemantic?.classes.popup}
              styles={dateSemantic?.styles.popup}
              {picker}
              {showWeek}
              prefixCls={prefix}
              panel={view}
              timeTemplate={clock.defaultOpenValue}
              selected={calendar[active]}
              range={calendarRange}
              hovered={periodWeakHover ? hover : undefined}
              onHover={handleDateHover}
              {mode}
              controlledMode={providedMode !== undefined}
              locale={panelLocale}
              {cellRender}
              {cellRange}
              restrictions={{ minDate, maxDate, disabledDate: panelDisabled }}
              {now}
              direction={config.direction}
              showNext={!multiplePanels}
              onSelect={selectDate}
              onNavigate={navigatePanel}
              onModeChange={changePanelMode}
            />{/if}
            {#if mode === 'time' || showTime && mode === 'date'}
              <DatePickerTimePanel
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
          </div></div>
          {#if multiplePanels && mode !== 'time'}<div class={`${prefix}-panel`} tabindex="-1"><DatePickerCalendar
              classNames={dateSemantic?.classes.popup}
              styles={dateSemantic?.styles.popup}
              {picker}
              {showWeek}
              prefixCls={prefix}
              panel={offsetPickerPanel(view, picker, 1)}
              selected={calendar[active]}
              range={calendarRange}
              hovered={periodWeakHover ? hover : undefined}
              onHover={handleDateHover}
              {mode}
              controlledMode={providedMode !== undefined}
              locale={secondPanelLocale}
              {cellRender}
              {cellRange}
              restrictions={{ minDate, maxDate, disabledDate: panelDisabled }}
              {now}
              direction={config.direction}
              showPrevious={false}
              onSelect={date => selectDate(date, 1)}
              onNavigate={next => navigatePanel(next, 1)}
              onModeChange={(next, date) => changePanelMode(next, date, 1)}
            /></div>{/if}
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
            )}>{showTime ? lang.now : lang.today}</button></li>{/if}{#if confirm}<li class={`${prefix}-ok`}><Button
              type="primary" size="small" disabled={!calendar[active]
              && !empty[active]
              || Boolean(
                calendar[active] && invalid(calendar[active]!, active, picker === 'quarter' || picker === 'week' ? undefined : from())
              )} onclick={() => {
                if (picker !== 'date') onOk?.([...calendar]);
                send(active, 'confirm');
                if (picker === 'date') onOk?.([...calendar]);
              }} children={lang.ok} /></li>{/if}</ul>{/if}</div>{/if}
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
        tabindex="-1"
      >
        {#if timeLocale}<PickerTimePanel prefixCls={prefix}
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
          range={active === 1 ? 'end' : 'start'}
          class={semantic?.classes.popup.content}
          style={semantic?.styles.popup.content}
          itemClass={semantic?.classes.popup.item}
          itemStyle={semantic?.styles.popup.item}
        />{/if}
      </div>
      {#if confirm || showCurrent || time?.renderExtraFooter}
        <div
          class={[`${prefix}-footer`, semantic?.classes.popup.footer]}
          style={semantic?.styles.popup.footer}
        >
          {#if time?.renderExtraFooter}<div class={`${prefix}-footer-extra`}>
            {@render time.renderExtraFooter('time')}
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
            {#if confirm}<li class={`${prefix}-ok`}><Button
              type="primary"
              size="small"
              disabled={!calendar[active] && !clock.defaultOpenValue
                || !!(calendar[active] || clock.defaultOpenValue)
                  && invalid((calendar[active] || clock.defaultOpenValue)!, active)}
              onclick={confirmTime}
              children={lang.ok}
            /></li>{/if}
          </ul>{/if}
        </div>
      {/if}
    </div>
  </div>
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
    <input {...attributes} bind:this={startElement} id={typeof id === 'string' ? id : id?.start ?? field?.id} name={name ?? field?.name} placeholder={time ? timePlaceholder?.[0] : placeholder?.[0] ?? periodPlaceholder[0]} type="text" role="combobox" aria-haspopup="dialog" aria-expanded={visible && active === 0} aria-controls={`ant-range-picker-${generatedId}`} aria-invalid={inputInvalid(0)
        || field?.invalid
        || resolvedStatus === 'error'
        || attributes['aria-invalid']
        || undefined} aria-describedby={[attributes['aria-describedby'], field?.describedBy].filter(
            Boolean
          )
            .join(
              ' '
            )
            || undefined} required={attributes.required ?? field?.required} disabled={blocked[0]} readonly={readOnly} autocomplete="off" value={maskInputs[0].value} defaultValue={maskInputs[0].value}
      {@attach maskInputs[0].attach}
      class={semantic?.classes.input} style={semantic?.styles.input} size={timeInputSize}
      data-range={time ? 'start' : undefined}
      oninput={event => {
        if (!maskInputs[0].nativeInput(event)) inputChange(0, event.currentTarget.value);
      }}
      onmousedown={event => {
        maskInputs[0].mousedown();
        attributes.onmousedown?.call(event.currentTarget, event);
      }}
      onmouseup={event => {
        const shared = () => attributes.onmouseup?.call(event.currentTarget, event);
        if (!maskInputs[0].mouseup(event, shared)) shared();
      }}
      onpaste={event => {
        if (!maskInputs[0].paste(event)) attributes.onpaste?.call(event.currentTarget, event);
      }} onclick={() => {
          if (!time) focusField(0);
          if (!time) requestOpen(true);
        }} onfocus={event => {
            maskInputs[0].focus();
            focusField(0, true);
            if (time) (time.onfocus ?? time.onFocus)?.(event, { range: 'start' });
            else onfocus?.(event);
          }} onblur={event => {
            maskInputs[0].blur();
            blurInput(0, event);
          }} onkeydown={event => keyboard(event, 0)} />
  </div>
  <div class={`${prefix}-range-separator`}>{#if !time && typeof resolvedSeparator === 'function'}{@render resolvedSeparator()}{:else}<span class={`${prefix}-separator`} aria-hidden={time && resolvedSeparator !== undefined ? undefined : 'true'}>{#if typeof resolvedSeparator === 'function'}{@render resolvedSeparator()}{:else if resolvedSeparator !== undefined}{resolvedSeparator}{:else}<PickerRangeSeparator />{/if}</span>{/if}</div>
  <div class={[
      `${prefix}-input ${prefix}-input-end`,
      focused && active === 1 && `${prefix}-input-active`,
      time && previewValue && (presetHover || hover && active === 1)
        && `${prefix}-input-placeholder`
    ]}>
    <input {...attributes} bind:this={endElement} id={typeof id === 'object' ? id.end : undefined} name={name ?? field?.name} placeholder={time ? timePlaceholder?.[1] : placeholder?.[1] ?? periodPlaceholder[1]} type="text" role="combobox" aria-haspopup="dialog" aria-expanded={visible && active === 1} aria-controls={`ant-range-picker-${generatedId}`} aria-invalid={inputInvalid(1)
        || field?.invalid
        || resolvedStatus === 'error'
        || attributes['aria-invalid']
        || undefined} aria-describedby={[attributes['aria-describedby'], field?.describedBy].filter(
            Boolean
          )
            .join(
              ' '
            )
            || undefined} required={attributes.required ?? field?.required} disabled={blocked[1]} readonly={readOnly} autocomplete="off" value={maskInputs[1].value} defaultValue={maskInputs[1].value}
      {@attach maskInputs[1].attach}
      class={semantic?.classes.input} style={semantic?.styles.input} size={timeInputSize}
      data-range={time ? 'end' : undefined}
      oninput={event => {
        if (!maskInputs[1].nativeInput(event)) inputChange(1, event.currentTarget.value);
      }}
      onmousedown={event => {
        maskInputs[1].mousedown();
        attributes.onmousedown?.call(event.currentTarget, event);
      }}
      onmouseup={event => {
        const shared = () => attributes.onmouseup?.call(event.currentTarget, event);
        if (!maskInputs[1].mouseup(event, shared)) shared();
      }}
      onpaste={event => {
        if (!maskInputs[1].paste(event)) attributes.onpaste?.call(event.currentTarget, event);
      }} onclick={() => {
          if (!time) focusField(1);
          if (!time) requestOpen(true);
        }} onfocus={event => {
            maskInputs[1].focus();
            focusField(1, true);
            if (time) (time.onfocus ?? time.onFocus)?.(event, { range: 'end' });
            else onfocus?.(event);
          }} onblur={event => {
            maskInputs[1].blur();
            blurInput(1, event);
          }} onkeydown={event => keyboard(event, 1)} />
  </div>
  <div class={`${prefix}-active-bar`} style={`position:absolute;left:${bar.left}px;width:${bar.width}px`}></div>
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
          `${prefix}-dropdown-placement-${verticalPlacement}${actualPlacement.endsWith('Right')
            ? 'Right'
            : 'Left'}`,
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
              `${prefix}-panel-container ${prefix}-time-panel-container`,
              semantic?.classes.popup.container
            ]}
            style={[
              config.direction === 'rtl'
                ? `margin-right:${timePosition.offset}px;margin-left:auto`
                : `margin-left:${timePosition.offset}px;margin-right:auto`,
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
      <div class={[`${prefix}-panel-container`, dateSemantic?.classes.popup.container]}
        style={dateSemantic?.styles.popup.container}>
        {#if panelRender}{@render panelRender(datePanelLayout)}
        {:else}{@render datePanelLayout()}{/if}
      </div>
      {/if}
    </div>
{/if}{/key}</NoCompactStyle>
