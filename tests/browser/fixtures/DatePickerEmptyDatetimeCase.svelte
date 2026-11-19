<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, RangePicker, enUS,
    type DatePickerProps, type RangePickerProps } from 'antd-svelte';
  import { createDatePickerPresetsRecorder }
    from '../date-picker-presets-recorder.mjs';
  import { authoring } from '../date-picker-empty-datetime-cases.mjs';
  import type { EmptyDatetimeCapture, EmptyDatetimeControl, EmptyDatetimeOwner } from '../date-picker-empty-datetime-native-types';

  let { owner, capture }: { owner: EmptyDatetimeOwner; capture: EmptyDatetimeCapture } = $props();
  const profile = untrack(() => owner), output = untrack(() => capture);
  const range = profile === 'range', recorder = createDatePickerPresetsRecorder();
  const panel = recorder.register(dayjs(authoring.defaultPickerValue), { authoredDate: 'panel' });
  const template = recorder.register(dayjs(authoring.defaultOpenValue), { authoredDate: 'template' });
  const emptyPair: [null, null] = recorder.register([null, null], { authoredValue: 'empty-pair' });
  const panelPair: [Dayjs, Dayjs] = [panel, panel];
  const plainClock = recorder.register({ ...authoring.clock }, { authoredClock: 'omitted' });
  const templateClock = recorder.register({ ...authoring.clock, defaultOpenValue: template },
    { authoredClock: 'template' });
  const rangeTemplateClock = recorder.register({ ...authoring.clock,
    defaultOpenValue: [template, template] as [Dayjs, Dayjs] }, { authoredClock: 'template-pair' });
  const callbacks: unknown[] = [], ownerActions: unknown[] = [], lifecycle: unknown[] = [];
  let open = $state(false), hasTemplate = $state(false), alive = false, actionIndex = -1;
  let ownerElement = $state<HTMLElement>(), control = $state<EmptyDatetimeControl>();
  let root = $state<HTMLDivElement>();
  const dates = (date: Dayjs) => ({ identity: recorder.identity(date), encoded: recorder.encode(date),
    raw: recorder.raw(date), temporal: { valid: date.isValid(), epoch: date.valueOf(),
      iso: date.isValid() ? date.toISOString() : null, utcOffset: date.utcOffset(),
      fields: [date.year(), date.month(), date.date(), date.hour(), date.minute(),
        date.second(), date.millisecond()], locale: date.locale() },
    sameAsAuthored: { panel: date === panel, template: date === template } });
  function nestedDates(value: unknown, path: number[] = []): unknown[] {
    return dayjs.isDayjs(value) ? [{ path, value: dates(value) }]
      : Array.isArray(value) ? value.flatMap((item, index) => nestedDates(item, [...path, index])) : [];
  }
  function record(name: string, args: unknown[], context: unknown) {
    callbacks.push({ index: callbacks.length, actionIndex, name, actualArgumentCount: args.length,
      encodedArguments: recorder.encode(args), rawArguments: recorder.raw(args),
      dates: nestedDates(args), receiver: { type: typeof context,
        isUndefined: context === undefined, isNull: context === null,
        identity: context !== null && (typeof context === 'object' || typeof context === 'function')
          ? recorder.identity(context) : null } });
  }
  const handler = <Value,>(name: string, value: Value): Value => recorder.register(value, { callback: name });
  const onChange = handler('change', function (this: unknown) {
    record('change', Array.from(arguments), this);
  });
  const onCalendarChange = handler('calendar', function (this: unknown) {
    record('calendar', Array.from(arguments), this);
  });
  const onPickerValueChange = handler('picker-value', function (this: unknown) {
    record('picker-value', Array.from(arguments), this);
  });
  const onPanelChange = handler('panel', function (this: unknown) {
    record('panel', Array.from(arguments), this);
  });
  const onOk = handler('ok', function (this: unknown) { record('ok', Array.from(arguments), this); });
  const onOpenChange = handler('open', function (this: unknown, next: boolean) {
    record('open', Array.from(arguments), this); open = next;
  });
  const shared = $derived({ format: authoring.format, needConfirm: true, showNow: false, open,
    style: 'width:100%', onChange, onCalendarChange, onPickerValueChange, onPanelChange, onOk,
    onOpenChange });
  const singleProps = $derived({ ...shared, value: null, defaultPickerValue: panel,
    showTime: hasTemplate ? templateClock : plainClock, id: 'empty-datetime-input' } satisfies DatePickerProps);
  const rangeProps = $derived({ ...shared, value: emptyPair, defaultPickerValue: panelPair,
    showTime: hasTemplate ? rangeTemplateClock : plainClock,
    id: { start: 'empty-datetime-input', end: 'empty-datetime-end' } } satisfies RangePickerProps);
  output.recorder = recorder;
  output.setActionIndex = index => { actionIndex = index; };
  output.readRefs = () => ({ owner: ownerElement ?? null, control: control ?? null, root: root ?? null });
  output.read = () => ({ owner: profile, actionIndex, alive, open, hasTemplate,
    authoredModel: recorder.encode(range ? emptyPair : null),
    rawAuthoredModel: recorder.raw(range ? emptyPair : null),
    authoredDates: { panel: dates(panel), template: dates(template) },
    authoredProps: recorder.encode(range ? rangeProps : singleProps),
    rawAuthoredProps: recorder.raw(range ? rangeProps : singleProps),
    callbacks: [...callbacks], ownerActions: [...ownerActions], lifecycle: [...lifecycle] });
  onMount(() => { alive = true; lifecycle.push({ phase: 'mount' });
    return () => { alive = false; lifecycle.push({ phase: 'unmount' }); }; });
</script>

<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
  <section bind:this={ownerElement} data-empty-datetime-owner={profile}
    style="position:absolute;left:240px;top:80px;width:420px">
    {#if range}<RangePicker {...rangeProps} bind:this={control} bind:nativeElement={root} />
    {:else}<DatePicker {...singleProps} bind:this={control} bind:nativeElement={root} />{/if}
    <button type="button" tabindex="-1" data-empty-datetime-control="template" onclick={event => {
      ownerActions.push({ actionIndex, type: event.type, isTrusted: event.isTrusted,
        targetTag: event.target instanceof Element ? event.target.tagName : null,
        currentTargetTag: event.currentTarget.tagName, before: { open, hasTemplate } });
      hasTemplate = true;
    }}>Use authored time template</button>
  </section>
</ConfigProvider>
