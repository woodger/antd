<script module lang="ts">
  export interface PickerComponentsProfile {
    id: string;
    input?: boolean;
    textarea?: boolean;
    editor?: 'input' | 'textarea';
    nativeSlot?: boolean;
    range?: boolean;
    time?: boolean;
    multiple?: boolean;
    mask?: boolean;
    button?: boolean;
    nativeButton?: boolean;
    needConfirm?: boolean;
    empty?: boolean;
    open?: boolean;
  }

  export const editorHydrationProfile = {
    id: 'hydration', range: true, editor: 'textarea', mask: true, input: true
  } satisfies PickerComponentsProfile;
</script>

<script lang="ts">
  // Both editors retain the real shape fields and refs.
  import dayjs, { type Dayjs } from 'dayjs';
  import {
    ConfigProvider, DatePicker, RangePicker, TimePicker, TimeRangePicker, enUS,
    type DatePickerButtonContext, type DatePickerComponents, type DatePickerEditorContext,
    type RangePickerValue
  } from '@woodger/antd';

  /** Uses the parameters of independent measurement or a given SSR profile. */
  function readProfile(): PickerComponentsProfile {
    const current = new URLSearchParams(globalThis.location?.search).get('profile');
    return current ? JSON.parse(current) : { id: 'input', input: true };
  }

  let { profile = readProfile(), server = false }: {
    profile?: PickerComponentsProfile;
    server?: boolean;
  } = $props();

  const dates: [Dayjs, Dayjs] = [
    dayjs('2024-06-15T13:10:18'), dayjs('2024-06-23T14:26:40')
  ];
  const panel = dayjs('2024-06-19T11:00');
  const panelDates: [Dayjs, Dayjs] = [panel, panel];
  const theme = { token: { motion: false } };
  const rangeId = { start: 'start', end: 'end' };
  const labels = { start: 'Start', end: 'End' };
  let format = $derived(profile.mask ? { format: 'YYYY-MM-DD', type: 'mask' as const } : undefined);
  let events = $state<unknown[][]>([]);
  let startInput = $state<HTMLInputElement>();
  let endInput = $state<HTMLInputElement>();
  let replacement = $state<'profile' | 'missing' | 'textarea'>('profile');
  let appearances = $state(false);
  let replacements: DatePickerComponents = $derived({
    input: replacement === 'missing' || !profile.input ? undefined
      : replacement === 'textarea' ? 'textarea'
      : profile.nativeSlot ? profile.editor ?? 'input' : editor,
    button: profile.nativeButton ? 'button' : profile.button ? confirm : undefined
  });
  let classNames = $derived({ input: appearances ? 'edited-picker' : 'original-picker' });

  /** Returns the same timelines that are recorded in React. */
  function encode(value: Dayjs | Dayjs[] | RangePickerValue | null) {
    if (Array.isArray(value)) {
      return value.map(item => item?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? null);
    }
    return value?.format('YYYY-MM-DDTHH:mm:ss.SSSZ') ?? null;
  }

  /** The publication error on SSR immediately interrupts verification. */
  function report(...event: unknown[]) {
    if (server) {
      throw Error('Unexpected picker component event during SSR');
    }
    events.push(event);
  }

  /** The general listener preserves the data of solitary and multiple choices. */
  function change(value: Dayjs | Dayjs[] | RangePickerValue | null, text: string | string[] | null) {
    report('change', encode(value), text);
  }

  /** Retains the proposed value together with the boundary metadata. */
  function calendar(
    value: Dayjs | Dayjs[] | RangePickerValue | null,
    text: string | string[],
    info: object
  ) {
    report('calendar', encode(value), text, info);
  }

  /** Shows the transition of visibility separately from the publication of the choice. */
  function openChange(open: boolean) {
    report('open', open);
  }

  /** The confirmation button receives the same dates as the calendar. */
  function ok(value: Dayjs | Dayjs[] | RangePickerValue) {
    report('ok', encode(value));
  }

  /** A separate native form button is only needed to check the risk of accidentally submitted. */
  function submit(event: SubmitEvent) {
    event.preventDefault();
    report('submit');
  }
</script>

{#snippet editor({ attributes, register, range }: DatePickerEditorContext)}
  {#if profile.textarea || profile.editor === 'textarea'}
    {@const { value, defaultValue, type, size, ...textareaAttributes } = attributes}
    <textarea {...textareaAttributes} {value} data-editor={range ?? 'single'}
      {@attach register}></textarea>
  {:else}
    <input {...attributes} data-editor={range ?? 'single'} {@attach register} />
  {/if}
{/snippet}

{#snippet confirm({ attributes, children }: DatePickerButtonContext)}
  <button {...attributes} data-custom-confirm>{children}</button>
{/snippet}

<ConfigProvider locale={enUS} {theme}>
  <form aria-label="Picker form" onsubmit={submit}>
    <label for="start">{labels.start}</label>
    {#if profile.range}<label for="end">{labels.end}</label>{/if}
    <div data-components-owner data-start-ref={Boolean(startInput)} data-end-ref={Boolean(endInput)}>
      {#if profile.range && profile.time}
        <TimeRangePicker id={rangeId} name="chosen" previewValue={false}
          bind:startInput bind:endInput
          components={replacements} {classNames} open={profile.open}
          defaultValue={profile.empty ? undefined : dates} defaultPickerValue={panelDates}
          onOpenChange={openChange} onChange={change} onCalendarChange={calendar} onOk={ok} />
      {:else if profile.range}
        <RangePicker id={rangeId} name="chosen" previewValue={false} {format}
          bind:startInput bind:endInput
          components={replacements} {classNames} open={profile.open}
          defaultValue={profile.empty ? undefined : dates} defaultPickerValue={panelDates}
          onOpenChange={openChange} onChange={change} onCalendarChange={calendar} onOk={ok} />
      {:else if profile.time}
        <TimePicker id="start" name="chosen" previewValue={false}
          components={replacements} {classNames} open={profile.open}
          defaultValue={profile.empty ? undefined : dates[0]} defaultPickerValue={panel}
          onOpenChange={openChange} onChange={change} onCalendarChange={calendar} onOk={ok} />
      {:else if profile.multiple}
        <DatePicker multiple id="start" name="chosen" previewValue={false} {format}
          components={replacements} {classNames} open={profile.open}
          defaultValue={profile.empty ? undefined : dates} defaultPickerValue={panel}
          onOpenChange={openChange} onChange={change} onCalendarChange={calendar} onOk={ok} />
      {:else}
        <DatePicker id="start" name="chosen" previewValue={false} {format}
          components={replacements} {classNames} open={profile.open}
          needConfirm={profile.needConfirm}
          defaultValue={profile.empty ? undefined : dates[0]} defaultPickerValue={panel}
          onOpenChange={openChange} onChange={change} onCalendarChange={calendar} onOk={ok} />
      {/if}
    </div>
  </form>
</ConfigProvider>
<button id="outside" type="button" style={'position:fixed;'
  + 'right:16px;'
  + 'bottom:16px'}>Outside</button>
<button id="appearance" type="button" onclick={() => { appearances = !appearances; }}>Appearance</button>
<button id="ordinary-input" type="button" onclick={() => { replacement = 'missing'; }}>Default input</button>
<button id="textarea-input" type="button" onclick={() => { replacement = 'textarea'; }}>Textarea</button>
<output id="picker-component-events">{JSON.stringify(events)}</output>
