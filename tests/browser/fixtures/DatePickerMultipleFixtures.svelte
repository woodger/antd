<script module lang="ts">
  import type { DatePickerMultipleProps, DatePickerPicker } from '@woodger/antd';

  export interface MultiplePickerProfile {
    id: string;
    picker?: DatePickerPicker;
    disabled?: boolean;
    ordered?: boolean;
    needConfirm?: boolean;
    controlled?: boolean;
    custom?: boolean;
    maxTagCount?: DatePickerMultipleProps['maxTagCount'];
    oneInitial?: boolean;
    empty?: boolean;
    nullable?: boolean;
    formatAll?: boolean;
    prefixCls?: string;
  }
</script>

<script lang="ts">
  // Mounts public DatePicker and preserves received data separately from events.
  import dayjs, { type Dayjs } from 'dayjs';
  import { untrack } from 'svelte';
  import { ConfigProvider, DatePicker, enUS, type DatePickerTagContext } from '@woodger/antd';

  function readProfile(): MultiplePickerProfile {
    const parameter = new URLSearchParams(globalThis.location?.search).get('profile');

    return parameter ? JSON.parse(parameter) : { id: 'default' };
  }

  let { profile = readProfile(), server = false }: {
    profile?: MultiplePickerProfile;
    server?: boolean;
  } = $props();

  const initial = untrack(() => profile.empty ? [] : (profile.oneInitial ? ['2024-06-10T12:30:00']
    : server ? ['2024-06-15T16:30:18', '2024-05-13T05:10:17', '2023-06-14T09:06:01']
    : ['2024-06-15T16:30:18', '2024-06-13T05:10:17']).map(value => dayjs(value)));
  const panelDate = untrack(() => dayjs(profile.oneInitial ? '2024-06-19T15:10' : '2024-06-19T11:00:00'));
  const presetDate = dayjs('2024-06-23T10:30:00');
  const theme = { token: { motion: false } };
  let value = $state.raw<readonly Dayjs[] | null>(untrack(() => profile.nullable ? null : initial));
  let accepted = $state(false);
  let events = $state<unknown[][]>([]);
  let width = $state(untrack(() => profile.maxTagCount === 'responsive' ? 230 : 520));
  let nativeElement = $state<HTMLDivElement>();

  /** In the events save the date with the time zone and the reference to the original Dayjs. */
  function encode(value: Dayjs) {
    return { date: value.format('YYYY-MM-DDTHH:mm:ss.SSSZ'), initialIndex: initial.indexOf(value) };
  }

  /** At SSR excludes any referrals to DOM and notice of choice. */
  function report(...event: unknown[]) {
    if (server) {
      throw Error('Unexpected DatePicker SSR event');
    }
    events.push(event);
  }
</script>

{#snippet customTag({ label, value, closable, disabled, onClose }: DatePickerTagContext)}
  <span data-custom-tag={value.format('YYYY-MM-DD')} data-closable={closable} data-disabled={disabled}
    data-alias={initial.indexOf(value)}>{label}{#if !server && closable && value.format('YYYY-MM-DD') !== '2024-06-15'}<button
      type="button" data-remove-custom onclick={onClose}>Remove</button>{/if}</span>
{/snippet}

<ConfigProvider locale={enUS} {theme}>
  <form aria-label="Date selection form">
    <label for="multiple-editor">Book dates</label>
    <div data-date-owner style:width={`${width}px`} data-ref={Boolean(nativeElement)}>
      <DatePicker multiple
        bind:nativeElement
        picker={profile.picker}
        id="multiple-editor"
        name="multiple-date"
        aria-label="Book dates"
        disabled={profile.disabled}
        prefixCls={profile.prefixCls}
        classNames={{ input: 'book-editor', prefix: 'book-prefix', suffix: 'book-suffix' }}
        prefix={server ? 'context' : undefined}
        defaultValue={initial}
        defaultPickerValue={panelDate}
        value={profile.controlled ? value : undefined}
        style="width:100%"
        placeholder="Pick one or more"
        order={profile.ordered}
        format={profile.formatAll ? () => 'same label' : undefined}
        needConfirm={profile.needConfirm}
        maxTagCount={profile.maxTagCount}
        tagRender={profile.custom ? customTag : undefined}
        presets={profile.oneInitial ? [{ label: 'Pick preset', value: presetDate }] : undefined}
        getPopupContainer={server ? () => { throw Error('Unexpected DatePicker SSR portal'); } : undefined}
        onChange={(next, text) => {
          report('change', next?.map(encode) ?? null, text);
          if (profile.controlled && accepted) value = next;
        }}
        onCalendarChange={(dates, texts, info) => report('calendar', dates.map(encode), texts, info)}
        onOk={dates => report('ok', dates.map(encode))}
        onOpenChange={open => report('open', open)}
        onPickerValueChange={(date, info) => report('picker', encode(date), info)}
        onClear={() => report('clear')}
      />
    </div>
  </form>
</ConfigProvider>
<button id="outside" type="button" style={'position:fixed;'
  + 'right:16px;'
  + 'bottom:16px'}>Outside</button>
<button id="accept" type="button" onclick={() => { accepted = true; }}>Accept next change</button>
<label>Owner width <input id="owner-width" type="number" bind:value={width} /></label>
<output id="multiple-events">{JSON.stringify(events)}</output>
<output id="multiple-owner">{JSON.stringify(profile.controlled ? value?.map(encode) ?? null : null)}</output>
