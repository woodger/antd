<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import dayjs, { type Dayjs } from 'dayjs';
  import { ConfigProvider, DatePicker, RangePicker, enUS,
    type DatePickerCellRenderInfo, type DatePickerMode } from 'antd-svelte';
  import type { RenderHooksCapture, RenderHooksCellObservation, RenderHooksOwner }
    from '../date-picker-render-hooks-native';

  let { owner, capture, initiallyOpen = false, hooksEnabled = false }: {
    owner: RenderHooksOwner; capture?: RenderHooksCapture; initiallyOpen?: boolean; hooksEnabled?: boolean;
  } = $props();
  const initialOwner = untrack(() => owner);
  const range = initialOwner.startsWith('range');
  const datetime = initialOwner.endsWith('datetime');
  const values = [dayjs(datetime ? '2024-06-13T06:15:20.500' : '2024-06-13'),
    dayjs(datetime ? '2024-06-16T18:30:40.000' : '2024-06-16')] as [Dayjs, Dayjs];
  const single = datetime ? dayjs('2024-06-13T18:30:20.500') : values[0];
  const clock = { format: 'hh:mm:ss.SSS A', use12Hours: true, hourStep: 6,
    minuteStep: 15, secondStep: 20, millisecondStep: 500, showMillisecond: true };
  const format = datetime ? 'YYYY-MM-DD hh:mm:ss.SSS A' : 'YYYY-MM-DD';
  const disabledDate = (date: Dayjs, info: { type: DatePickerMode }) =>
    info.type === 'date' && date.date() === 14;
  const disabledTime = () => ({ disabledMinutes: () => [0] });
  const cells: RenderHooksCellObservation[] = [], footers: string[] = [];
  const events: Array<{ name: string; text?: unknown }> = [];
  const identities = new WeakMap<object, number>();
  let identitySequence = 0, panels = 0;
  let open = $state(untrack(() => initiallyOpen)), enabled = $state(untrack(() => hooksEnabled));
  let cellStrategy = $state('wrap'), panelStrategy = $state('wrap');
  let footerStrategy = $state('element'), revision = $state(0), nested = $state(false);
  let forceConfirm = $state(false);
  let formatOnlyClock = $state(false);
  let usePanelTime = $state(false);
  const panelTime = dayjs('2000-01-01T09:12:34.567');
  let singleClock = $derived(formatOnlyClock ? { format: 'HH:mm' }
    : usePanelTime ? { ...clock, defaultOpenValue: panelTime } : clock);
  let rangeClock = $derived(formatOnlyClock ? { format: 'HH:mm' }
    : usePanelTime ? { ...clock, defaultOpenValue: [panelTime, panelTime] as [Dayjs, Dayjs] } : clock);
  let customCellLocale = $state(false);
  const cellLocale = { lang: { cellDateFormat: '[D]DD', monthFormat: '[M]MM',
    cellYearFormat: '[Y]YYYY', cellMeridiemFormat: '[period] A' } };
  let prefixCls = $state('ant-picker');
  const identify = (object: object) => {
    if (!identities.has(object)) identities.set(object, ++identitySequence);
    return identities.get(object)!;
  };
  function observe(current: Dayjs | number | 'am' | 'pm', info: DatePickerCellRenderInfo) {
    return untrack(() => {
      const observation: RenderHooksCellObservation = {
        sequence: cells.length,
        current: dayjs.isDayjs(current) ? current.format('YYYY-MM-DD') : current,
        currentKind: dayjs.isDayjs(current) ? 'dayjs' : typeof current as 'number' | 'string',
        ...(dayjs.isDayjs(current) ? { currentTemporal: {
          epoch: current.valueOf(), iso: current.toISOString(), utcOffset: current.utcOffset(),
          fields: [current.year(), current.month(), current.date(), current.hour(), current.minute(),
            current.second(), current.millisecond()]
        } } : {}),
        keys: Object.keys(info), type: info.type, range: info.range, subType: info.subType,
        prefixCls: info.prefixCls, today: info.today.toISOString(),
        todayIdentity: identify(info.today), localeIdentity: identify(info.locale),
        locale: { ...info.locale }, originKind: typeof info.originNode
      };
      cells.push(observation);
      return observation;
    });
  }
  function observeFooter(mode: DatePickerMode) { footers.push(mode); return mode; }
  function observePanel() { return ++panels; }
  function callback(name: string, text?: unknown) { events.push({ name, text }); }
  const onOpenChange = (next: boolean) => { open = next; callback('open', next); };
  const onChange = (_value: unknown, text: unknown) => callback('change', text);
  const onCalendarChange = (_value: unknown, text: unknown) => callback('calendar', text);
  export function read() {
    return { owner: initialOwner, open, enabled, cells: [...cells], footers: [...footers],
      panels, events: [...events] };
  }
  const output = untrack(() => capture);
  if (output) output.read = read;
</script>

{#snippet cell(current: Dayjs | number | 'am' | 'pm', info: DatePickerCellRenderInfo)}
  {@const observation = observe(current, info)}
  {#if cellStrategy !== 'empty-fragment'}
    <span data-hook-cell={cellStrategy} data-hook-revision={revision} data-hook-sequence={observation.sequence}
      data-hook-type={info.type} data-hook-unit={info.subType} data-hook-range={info.range}
      data-hook-value={observation.current} data-hook-today={observation.today}
      data-hook-today-identity={observation.todayIdentity}>
      {#if cellStrategy === 'editable' && (info.type === 'date' && dayjs.isDayjs(current)
        && current.format('YYYY-MM-DD') === '2024-06-18' || info.subType === 'minute' && current === 15)}
        <input aria-label="Cell editor" value="Cell" style="width:20px;box-sizing:border-box"
          onclick={event => event.stopPropagation()} />
      {:else if cellStrategy === 'wrap'}{@render info.originNode()}
      {:else}{dayjs.isDayjs(current) ? current.date() : current}{/if}
      {#if nested}<ul data-authored-list><li><button type="button"
        onkeydown={event => event.stopPropagation()} onclick={event => {
          event.stopPropagation(); callback('custom-cell');
        }}>Cell action</button></li></ul>{/if}
    </span>
  {/if}
{/snippet}
{#snippet revisedCell(current: Dayjs | number | 'am' | 'pm', info: DatePickerCellRenderInfo)}
  {@render cell(current, info)}
{/snippet}
{#snippet panel(content: Snippet)}
  {@const ordinal = observePanel()}
  {#if panelStrategy !== 'empty-fragment'}
    <section data-hook-panel={panelStrategy} data-panel-ordinal={ordinal}>
      {#if panelStrategy === 'wrap'}{@render content()}{/if}
      <button type="button" data-hook-panel-button onclick={() => callback('custom-panel')}>
        {panelStrategy === 'wrap' ? 'Panel action' : 'Custom panel'}
      </button>
      <input aria-label="Panel editor" value="Panel" />
    </section>
  {/if}
{/snippet}
{#snippet footer(mode: DatePickerMode)}
  {@const actualMode = observeFooter(mode)}
  {#if footerStrategy === 'element'}<button type="button" data-hook-footer
    data-hook-footer-mode={actualMode} onclick={() => callback('custom-footer')}>
    Footer {actualMode}
  </button>{/if}
  {#if footerStrategy === 'element'}<input aria-label="Footer editor" value="Footer" />{/if}
{/snippet}

<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}>
  <section id="date-picker-render-hooks-fixture" style="position:absolute;left:320px;top:80px;width:360px">
    {#if range}
      <RangePicker id={{ start: 'hook-field-start', end: 'hook-field-end' }} value={values}
        locale={customCellLocale ? cellLocale : undefined}
        {open} {format} {prefixCls} showTime={datetime ? rangeClock : false} showNow
        needConfirm={datetime || forceConfirm} {disabledDate} disabledTime={datetime ? disabledTime : undefined}
        {onOpenChange} {onChange} {onCalendarChange} style="width:100%"
        presets={[{ label: 'Preset pair', value: values }]}
        cellRender={enabled ? revision % 2 ? revisedCell : cell : undefined} panelRender={enabled ? panel : undefined}
        renderExtraFooter={enabled && footerStrategy !== 'absent' ? footer : undefined} />
    {:else}
      <DatePicker id="hook-field" value={single} {open} {format} {prefixCls}
        locale={customCellLocale ? cellLocale : undefined}
        showTime={datetime ? singleClock : false} showNow needConfirm={datetime || forceConfirm} {disabledDate}
        disabledTime={datetime ? disabledTime : undefined} {onOpenChange} {onChange}
        {onCalendarChange} style="width:100%" presets={[{ label: 'Preset date', value: single }]}
        cellRender={enabled ? revision % 2 ? revisedCell : cell : undefined} panelRender={enabled ? panel : undefined}
        renderExtraFooter={enabled && footerStrategy !== 'absent' ? footer : undefined} />
    {/if}
    <div style="margin-top:16px">
      <button type="button" data-control="enable" onclick={() => { enabled = true; }}>Enable hooks</button>
      {#each ['wrap', 'replace', 'empty-fragment', 'editable'] as strategy}
        <button type="button" data-control={`cell-${strategy}`} onclick={() => { cellStrategy = strategy; }}>Cell {strategy}</button>
        <button type="button" data-control={`panel-${strategy}`} onclick={() => { panelStrategy = strategy; }}>Panel {strategy}</button>
      {/each}
      {#each ['element', 'empty-fragment', 'absent'] as strategy}
        <button type="button" data-control={`footer-${strategy}`} onclick={() => { footerStrategy = strategy; }}>Footer {strategy}</button>
      {/each}
      <button type="button" data-control="close" onclick={() => { open = false; }}>Close picker</button>
      <button type="button" data-control="reopen" onclick={() => { open = true; }}>Reopen picker</button>
      <button type="button" data-control="repaint" onclick={() => { revision++; }}>Repaint cells</button>
      <button type="button" data-control="nested" onclick={() => { nested = !nested; }}>Toggle cell action</button>
      <button type="button" data-control="prefix" onclick={() => { prefixCls = 'hook-picker'; }}>Change prefix</button>
      <button type="button" data-control="confirm" onclick={() => { forceConfirm = true; }}>Require confirmation</button>
      <button type="button" data-control="format-only" onclick={() => { formatOnlyClock = true; }}>Set clock format only</button>
      <button type="button" data-control="cell-locale" onclick={() => { customCellLocale = true; }}>Set cell locale formats</button>
      <button type="button" data-control="panel-time" onclick={() => { usePanelTime = true; }}>Set panel time template</button>
    </div>
  </section>
</ConfigProvider>
