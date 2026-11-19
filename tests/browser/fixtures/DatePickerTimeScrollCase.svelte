<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, enUS, type DatePickerProps } from 'antd-svelte';
  import { createDatePickerPresetsRecorder } from '../date-picker-presets-recorder.mjs';
  import type { DateMap, DateRole, NativeControl, OwnerCapture, ScrollSample } from '../date-picker-time-scroll-native-types';

  let { sample, capture }: { sample: ScrollSample; capture: OwnerCapture; } = $props();
  const initial = untrack(() => sample);
  const ownerCapture = untrack(() => capture);
  const recorder = createDatePickerPresetsRecorder();
  const roles: DateRole[] = ['value', 'pickerValue', 'nextPickerValue',
    'defaultOpenValue', 'nextDefaultOpenValue'];
  const dates = Object.fromEntries(roles.map(name => [name, dayjs(initial[name])])) as DateMap;
  for (const [name, value] of Object.entries(dates)) {
    recorder.register(
      value,
      { authoredDate: name }
    );
  }
  const callbacks: unknown[] = [];
  const getters: unknown[] = [];
  const ownerActions: unknown[] = [];
  const lifecycle: unknown[] = [];
  let open = $state(false);
  let picker = $state.raw(dates.pickerValue);
  let template = $state.raw(dates.defaultOpenValue);
  let getterMode = $state('initial');
  let owner = $state<HTMLElement>();
  let control = $state<NativeControl>();
  let nativeElement = $state<HTMLDivElement>();
  let targetA = $state<HTMLDivElement>();
  let targetB = $state<HTMLDivElement>();
  let alive = false;
  let actionIndex = -1;
  const temporal = (value: Dayjs) => ({
    isDayjs: dayjs.isDayjs(value), valid: value.isValid(), epoch: value.valueOf(),
    iso: value.isValid() ? value.toISOString() : null, utcOffset: value.utcOffset(),
    fields: [value.year(), value.month(), value.date(), value.hour(), value.minute(),
      value.second(), value.millisecond()]
  });
  const dateSnapshot = (value: Dayjs) => ({
    identity: recorder.identity(value), temporal: temporal(value),
    sameAsAuthored: Object.fromEntries(Object.entries(dates).map(([name, date]) => [name, date === value])),
    encoded: recorder.encode(value), raw: recorder.raw(value)
  });
  const receiver = (value: unknown) => ({ type: typeof value,
    isUndefined: value === undefined, isNull: value === null,
    identity: value !== null && (typeof value === 'object' || typeof value === 'function')
      ? recorder.identity(value) : null });
  function record(name: string, args: unknown[], context: unknown, publicProp: string) {
    const focus = typeof FocusEvent !== 'undefined' && args[0] instanceof FocusEvent ? args[0] : null;
    callbacks.push({ index: callbacks.length, actionIndex, name, publicProp,
      actualArgumentCount: args.length, encodedArguments: recorder.encode(args),
      rawArguments: recorder.raw(args), receiver: receiver(context),
      dates: args.flatMap((value, argument) => dayjs.isDayjs(value)
        ? [{ argument, value: dateSnapshot(value) }] : []),
      ...(focus ? { nativeFocus: { type: focus.type, isTrusted: focus.isTrusted,
        timeStamp: focus.timeStamp, ownerAlive: alive,
        targetIdentity: focus.target === null ? null : recorder.identity(focus.target),
        targetTag: focus.target instanceof Element ? focus.target.tagName : null,
        targetId: focus.target instanceof Element ? focus.target.id : null,
        targetConnected: focus.target instanceof Node ? focus.target.isConnected : null,
        currentTargetIdentity: focus.currentTarget === null ? null : recorder.identity(focus.currentTarget),
        currentTargetTag: focus.currentTarget instanceof Element ? focus.currentTarget.tagName : null,
        currentTargetMatchesTarget: focus.currentTarget === focus.target,
        relatedTargetIsNull: focus.relatedTarget === null,
        relatedTargetIdentity: focus.relatedTarget === null ? null : recorder.identity(focus.relatedTarget),
        relatedTargetTag: focus.relatedTarget instanceof Element ? focus.relatedTarget.tagName : null
      } } : {}) });
  }
  const handler = <Value,>(name: string, callback: Value): Value =>
    recorder.register(callback, { callback: name });
  const onChange = handler('change', function onChange(this: unknown) {
    record('change', Array.from(arguments), this, 'onChange');
  });
  const onCalendarChange = handler('calendar', function onCalendarChange(this: unknown) {
    record('calendar', Array.from(arguments), this, 'onCalendarChange');
  });
  const onPickerValueChange = handler('picker-value', function onPickerValueChange(this: unknown) {
    record('picker-value', Array.from(arguments), this, 'onPickerValueChange');
  });
  const onPanelChange = handler('panel', function onPanelChange(this: unknown) {
    record('panel', Array.from(arguments), this, 'onPanelChange');
  });
  const onOpenChange = handler('open', function onOpenChange(this: unknown, next: boolean) {
    record('open', Array.from(arguments), this, 'onOpenChange');
    open = next;
  });
  const onFocus = handler('focus', function onFocus(this: unknown, event: FocusEvent) {
    record('focus', Array.from(arguments), this, 'onfocus');
  });
  const onBlur = handler('blur', function onBlur(this: unknown, event: FocusEvent) {
    record('blur', Array.from(arguments), this, 'onblur');
  });
  const onOk = handler('ok', function onOk(this: unknown) {
    record('ok', Array.from(arguments), this, 'onOk');
  });
  function getContainer(name: string, args: unknown[], context: unknown, target?: HTMLElement) {
    if (!target) {
      throw Error('Actual Native authored portal target is not mounted');
    }
    recorder.register(target, { authoredPortalTarget: target === targetA ? 'A' : 'B' });
    getters.push({ index: getters.length, actionIndex, name,
      actualArgumentCount: args.length, encodedArguments: recorder.encode(args),
      rawArguments: recorder.raw(args), receiver: receiver(context),
      result: recorder.encode(target), rawResult: recorder.raw(target),
      targetIdentity: recorder.identity(target),
      triggerIdentity: args[0] == null ? null : recorder.identity(args[0]) });
    return target;
  }
  const initialGetter = handler('initial-target-A', function initialGetter(
    this: unknown,
    trigger: HTMLElement
  ) {
    return getContainer('initial-target-A', Array.from(arguments), this, targetA);
  });
  const sameTargetGetter = handler('new-callback-same-target-A', function sameTargetGetter(
    this: unknown,
    trigger: HTMLElement
  ) {
    return getContainer('new-callback-same-target-A', Array.from(arguments), this, targetA);
  });
  const differentTargetGetter = handler('new-callback-different-target-B', function differentTargetGetter(
    this: unknown,
    trigger: HTMLElement
  ) {
    return getContainer('new-callback-different-target-B', Array.from(arguments), this, targetB);
  });
  let getPopupContainer = $derived(getterMode === 'initial' ? initialGetter
    : getterMode === 'same-target-new-callback' ? sameTargetGetter : differentTargetGetter);
  let publicProps = $derived<DatePickerProps>({ id: 'scroll-picker-input', value: dates.value,
    pickerValue: picker, open, format: initial.format, style: 'width:100%',
    showTime: { ...initial.showTime, defaultOpenValue: template }, showNow: false,
    onChange, onCalendarChange, onPickerValueChange, onPanelChange, onOpenChange,
    onfocus: onFocus, onblur: onBlur, onOk,
    ...(initial.portal ? { getPopupContainer } : {}) });
  const provider = recorder.register({ theme: { token: { motion: false } }, locale: enUS },
    { authoredProvider: 'motion-false-explicit-English' });
  let lastProps: unknown;
  export function read() {
    if (alive || lastProps === undefined) {
      lastProps = { encoded: recorder.encode(publicProps), raw: recorder.raw(publicProps) };
    }
    return { alive, actionIndex, open, getterMode,
      value: dateSnapshot(dates.value), pickerValue: dateSnapshot(picker),
      defaultOpenValue: dateSnapshot(template),
      authoredDates: Object.fromEntries(Object.entries(dates).map(([name, value]) => [
        name, { identity: recorder.identity(value), temporal: temporal(value) }
      ])), callbacks: [...callbacks], getters: [...getters], ownerActions: [...ownerActions],
      lifecycle: [...lifecycle], publicProps: lastProps,
      publicPropsObservation: alive ? 'live-owner-props' : 'last-observed-before-disposal',
      providerProps: { encoded: recorder.encode(provider), raw: recorder.raw(provider) },
      publicGetterIdentity: initial.portal ? recorder.identity(getPopupContainer) : null };
  }
  export function readRefs() {
    return { owner: owner ?? null, control: control ?? null,
      nativeElement: nativeElement ?? null, targetA: targetA ?? null, targetB: targetB ?? null };
  }
  export function setActionIndex(index: number) { actionIndex = index; }
  ownerCapture.recorder = recorder;
  ownerCapture.read = read;
  ownerCapture.readRefs = readRefs;
  ownerCapture.setActionIndex = setActionIndex;
  onMount(() => {
    alive = true;
    lifecycle.push({ phase: 'mounted', actionIndex });
    return () => {
      alive = false;
      lifecycle.push({ phase: 'unmounted', actionIndex });
    };
  });
  function ownerAction(kind: string, next: string | boolean, event: MouseEvent) {
    untrack(() => ownerActions.push({ actionIndex, kind, next,
      event: { type: event.type, isTrusted: event.isTrusted,
        actualTargetIdentity: event.target === null ? null : recorder.identity(event.target),
        actualCurrentTargetIdentity: event.currentTarget === null ? null : recorder.identity(event.currentTarget) } }));
    if (kind === 'open') {
      open = Boolean(next);
    }
    else if (kind === 'template') {
      template = dates[next as DateRole];
    }
    else if (kind === 'picker') {
      picker = dates.nextPickerValue;
    }
    else {
      getterMode = String(next);
    }
  }
</script>

<ConfigProvider {...provider}>
  <section bind:this={owner} data-time-scroll-owner={initial.id}
    style="position:absolute;left:320px;top:120px;width:320px">
    <div bind:this={targetA} data-scroll-target="A"></div>
    <div bind:this={targetB} data-scroll-target="B"></div>
    <DatePicker {...publicProps} bind:this={control} bind:nativeElement />
    <div style="margin-top:16px">
      {#each [false, true] as next}
        <button type="button" data-scroll-control="open" data-scroll-value={String(next)}
          onclick={event => ownerAction('open', next, event)}>Owner open {String(next)}</button>
      {/each}
      {#each ['defaultOpenValue', 'nextDefaultOpenValue'] as name}
        <button type="button" data-scroll-control="template" data-scroll-value={name}
          onclick={event => ownerAction('template', name, event)}>Owner template {name}</button>
      {/each}
      <button type="button" data-scroll-control="picker" data-scroll-value="nextPickerValue"
        onclick={event => ownerAction('picker', 'nextPickerValue', event)}>Owner picker value</button>
      {#each ['same-target-new-callback', 'different-target-new-callback'] as next}
        <button type="button" data-scroll-control="getter" data-scroll-value={next}
          onclick={event => ownerAction('getter', next, event)}>Owner getter {next}</button>
      {/each}
    </div>
  </section>
</ConfigProvider>
