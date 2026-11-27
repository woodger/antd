<script module lang="ts">
  import type { DatePickerPicker } from '@woodger/antd';

  export type PickerProviderMode = 'inherit' | 'replace' | 'empty';

  export interface PickerProviderProfile {
    id: string;
    picker?: DatePickerPicker;
    range?: boolean;
    time?: boolean;
    rtl?: boolean;
    local?: boolean;
    onlySemantic?: boolean;
    showTime?: boolean;
    providerClear?: boolean;
    localClear?: boolean | 'icon' | 'empty' | 'null';
    nullSuffix?: boolean;
    booleanPrefix?: boolean;
    disabled?: boolean | [boolean, boolean];
    shorthand?: boolean;
  }

  export const hydrationProfile = {
    id: 'range-time-hydration', range: true, picker: 'date', showTime: true
  } satisfies PickerProviderProfile;
</script>

<script lang="ts">
  // Updates the provider’s settings around the mounted field. The same settings are used in server
  // rendering, where there should be no search for portal target.
  import dayjs, { type Dayjs } from 'dayjs';
  import { untrack } from 'svelte';
  import {
    ConfigProvider, DatePicker, RangePicker, TimePicker, TimeRangePicker, enUS,
    type DatePickerAllowClear, type DatePickerConfig, type DatePickerSlots,
    type RangePickerConfig, type TimePickerConfig
  } from '@woodger/antd';

  type AppearanceOwner = 'date' | 'inner' | 'time' | 'local';
  type ReportedProps = {
    size?: string;
    disabled?: boolean | [boolean, boolean] | null;
    status?: string;
    variant?: string;
    picker?: import('@woodger/antd').DatePickerProps['picker'];
    class?: string;
    allowClear?: DatePickerAllowClear;
    value?: unknown;
    defaultValue?: unknown;
  };

  // Parameter URL transmits the profile of independent measurement to the browser stand.
  function readProfile(): PickerProviderProfile {
    const profile = new URLSearchParams(globalThis.location?.search).get('profile');
    return profile ? JSON.parse(profile) : { id: 'date', picker: 'date' };
  }

  let {
    profile = readProfile(),
    initialMode = 'inherit',
    openOnMount = true,
    verifyServer = false
  }: {
    profile?: PickerProviderProfile;
    initialMode?: PickerProviderMode;
    openOnMount?: boolean;
    verifyServer?: boolean;
  } = $props();
  let mode = $state(untrack(() => initialMode));
  const first = dayjs('2024-06-13T16:30:00');
  const interval: [Dayjs, Dayjs] = [first, first.add(2, 'day')];
  const theme = { token: { motion: false } };
  const popupRoles = ['root', 'header', 'body', 'content', 'item', 'footer', 'container'];
  const rootRoles = ['root', 'prefix', 'input', 'suffix'];
  const colors = { date: '30,31,32', inner: '70,71,72', time: '50,51,52', local: '90,91,92' };
  const plainColors = { date: '33,34,35', inner: '73,74,75', time: '53,54,55', local: '93,94,95' };
  const events = new Map<string, unknown>();
  let report = $state('');
  let changes = $state(0);
  let nativeElement = $state<HTMLDivElement>();

  // The fixture mounts Dayjs pickers. An unexpected adapter value must fail the observation.
  function formatDefaultDate(value: unknown): string | null {
    if (value == null) return null;
    if (!dayjs.isDayjs(value)) {
      throw new TypeError('Expected a Dayjs default value in the provider fixture');
    }
    return value.format();
  }

  // Retains different public arguments for a single transition, excluding call repetitions.
  function record(owner: AppearanceOwner, role: 'classNames' | 'styles', props: ReportedProps) {
    const fields = ['size', 'disabled', 'status', 'variant', 'picker', 'class', 'allowClear'] as const;
    const entries = Object.fromEntries(fields.map(field => {
      const value = props[field];
      const normalized = value && typeof value === 'object' && field === 'allowClear'
        ? 'object' : value ?? null;
      const key = field === 'class' ? 'className' : field;
      return [key, { own: Object.hasOwn(props, field), value: normalized }];
    }));
    const initial = props.defaultValue;
    const value = Array.isArray(initial)
      ? initial.map(formatDefaultDate)
      : formatDefaultDate(initial);
    const event = { owner, role, props: entries, hasValue: Object.hasOwn(props, 'value'), value };

    events.set(JSON.stringify(event), event);
  }

  // Slots overlap the same CSS properties, and the classes leave both layers visible.
  function appearance(owner: AppearanceOwner) {
    /** Returns the names of all roles together with a snapshoot of the actual props. */
    function classNames({ props }: { props: ReportedProps; }): DatePickerSlots {
      record(owner, 'classNames', props);
      return {
        ...Object.fromEntries(rootRoles.map(role => [role, `slot-${owner}-${role}`])),
        popup: Object.fromEntries(popupRoles.map(role => [role, `slot-${owner}-popup-${role}`]))
      };
    }

    /** Records the overlapped color separately for each part of the field and the calendar. */
    function styles({ props }: { props: ReportedProps; }): DatePickerSlots {
      record(owner, 'styles', props);
      const color = `color:rgb(${colors[owner]})`;
      return {
        root: `${color};margin-inline-start:7px`,
        input: `background-${color}`,
        prefix: color,
        suffix: color,
        popup: Object.fromEntries(popupRoles.map(role => [role, color]))
      };
    }

    return { class: `plain-${owner}`, classNames, styles };
  }

  // Explicit {} replaces datePicker, and undefined returns inheritance.
  function setMode(next: PickerProviderMode) {
    events.clear();
    mode = next;
  }

  /** Verifies that the closed SSR does not evoke the granted getter. */
  function unexpectedPortal(): never {
    throw Error('Unexpected SSR picker portal lookup');
  }

  const datePicker: DatePickerConfig = $derived({
    ...appearance('date'),
    style: `color:rgb(${plainColors.date});`
      + `padding-inline-start:13px`,
    variant: 'underlined',
    suffixIcon: dateSuffix,
    allowClear: profile.providerClear ?? { clearIcon: dateClear }
  });
  const innerPicker: DatePickerConfig = {
    ...appearance('inner'),
    style: `color:rgb(${plainColors.inner});`
      + `padding-inline-start:13px`,
    variant: 'filled',
    suffixIcon: innerSuffix,
    allowClear: { clearIcon: innerClear }
  };
  const timePicker: TimePickerConfig = {
    ...appearance('time'),
    style: `color:rgb(${plainColors.time});`
      + `padding-inline-start:13px`,
    variant: 'underlined',
    suffixIcon: timeSuffix,
    allowClear: { clearIcon: timeClear }
  };
  const rangePicker: RangePickerConfig = {
    class: 'plain-range',
    style: 'color:rgb(43,44,45);'
      + 'padding-inline-start:19px',
    variant: 'borderless',
    separator
  };
  const inner = $derived(mode === 'inherit' ? undefined : mode === 'replace' ? innerPicker : {});
  const field = $derived({
    open: openOnMount ? true : undefined,
    prefix: profile.booleanPrefix ? true : prefix,
    needConfirm: true,
    'aria-label': 'Picker under test',
    getPopupContainer: verifyServer ? unexpectedPortal : undefined,
    onChange: () => { changes += 1; }
  });
  const local = $derived.by(() => {
    const clear = profile.localClear;
    const allowClear = clear === 'icon' ? { clearIcon: localClear }
      : clear === 'empty' ? {} : clear === 'null' ? { clearIcon: null } : clear;
    const localAppearance = profile.local ? {
      ...appearance('local'),
      size: 'small' as const,
      status: 'warning' as const,
      variant: 'outlined' as const,
      allowClear: false,
      suffixIcon: localSuffix
    } : {};
    const plainStyle = profile.local && !profile.onlySemantic
      ? { style: `color:rgb(${plainColors.local});`
        + `padding-inline-start:23px` } : {};
    const shorthand = profile.shorthand ? {
      classNames: { popup: 'slot-shorthand-popup-root' },
      styles({ props }: { props: ReportedProps; }) {
        record('local', 'styles', props);
        return undefined;
      }
    } : {};

    return {
      ...(profile.picker === undefined ? {} : { picker: profile.picker }),
      ...(profile.showTime ? { showTime: true } : {}),
      ...localAppearance,
      ...plainStyle,
      ...shorthand,
      ...(allowClear === undefined ? {} : { allowClear }),
      ...(profile.nullSuffix ? { suffixIcon: null } : {})
    };
  });
</script>

{#snippet marker(id: string, text: string)}<span data-marker={id}>{text}</span>{/snippet}
{#snippet prefix()}{@render marker('prefix', 'prefix')}{/snippet}
{#snippet dateSuffix()}{@render marker('date-suffix', 'date icon')}{/snippet}
{#snippet dateClear()}{@render marker('date-clear', 'date clear')}{/snippet}
{#snippet innerSuffix()}{@render marker('inner-suffix', 'inner icon')}{/snippet}
{#snippet innerClear()}{@render marker('inner-clear', 'inner clear')}{/snippet}
{#snippet timeSuffix()}{@render marker('time-suffix', 'time icon')}{/snippet}
{#snippet timeClear()}{@render marker('time-clear', 'time clear')}{/snippet}
{#snippet localSuffix()}{@render marker('local-suffix', 'local icon')}{/snippet}
{#snippet localClear()}{@render marker('local-clear', 'Local clear')}{/snippet}
{#snippet separator()}{@render marker('range-separator', 'range separator')}{/snippet}

<section id="date-picker-provider-fixture">
  <button id="inherit" type="button" onclick={() => setMode('inherit')}>Inherit dates</button>
  <button id="replace" type="button" onclick={() => setMode('replace')}>Replace dates</button>
  <button id="empty" type="button" onclick={() => setMode('empty')}>Clear date settings</button>
  <button id="read-producers" type="button" onclick={() => {
    report = JSON.stringify([...events.values()]);
  }}>Read semantic producers</button>
  <output id="picker-producers">{report}</output>
  <output id="picker-changes">{changes}</output>
  <div data-picker-control data-picker-ref={Boolean(nativeElement)}>
    <ConfigProvider
      {theme}
      {datePicker}
      {rangePicker}
      {timePicker}
      componentSize="large"
      componentDisabled={false}
      locale={enUS}
      direction={profile.rtl ? 'rtl' : 'ltr'}
    >
      <ConfigProvider datePicker={inner}>
        {#if profile.time && profile.range}
          <TimeRangePicker {...field} defaultValue={interval} bind:nativeElement />
        {:else if profile.time}
          <TimePicker {...field} defaultValue={first} bind:nativeElement />
        {:else if profile.range}
          <RangePicker {...field} {...local} defaultValue={interval} disabled={profile.disabled}
            bind:nativeElement />
        {:else}
          <DatePicker {...field} {...local} defaultValue={first}
            disabled={typeof profile.disabled === 'boolean' ? profile.disabled : undefined}
            bind:nativeElement />
        {/if}
      </ConfigProvider>
    </ConfigProvider>
  </div>
</section>
