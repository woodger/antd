<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, DatePicker, RangePicker, TimePicker, TimeRangePicker, enUS,
    type DatePickerProps, type DatePickerPopupAlign
  } from '@woodger/antd';
  import reference from './ant-design-picker-alignment-reference.json';

  let { preset }: { preset?: string } = $props();
  const query = typeof window === 'undefined' ? undefined
    : new URLSearchParams(window.location.search).get('profile');
  const profile = untrack(() => preset ?? query ?? 'date-default');
  const authored = reference.cases.find(item => item.sample.id === profile);
  if (!authored) {
    throw new Error('Unknown picker alignment profile');
  }
  const { sample } = authored;
  const isRange = sample.entry === 'range' || sample.entry === 'time-range';
  const initialWidth = sample.narrow ? isRange ? 294 : 164 : isRange ? 298 : 232;
  const [left, top] = sample.position ?? [240, 148];
  const bottomLeft = sample.map?.bottomLeft ?? sample.custom;
  const initialPlacements: Record<string, DatePickerPopupAlign> | undefined =
    sample.map || bottomLeft ? {} : undefined;
  if (initialPlacements && bottomLeft) {
    initialPlacements.bottomLeft = bottomLeft;
  }
  const initialPlacement = sample.placement === 'topRight' ? sample.placement : undefined;
  const clock = sample.narrow
    ? { use12Hours: true, showMillisecond: true, format: 'hh:mm:ss.SSS A' }
    : {};

  let clip = $state<HTMLDivElement>();
  let open = $state(true);
  let width = $state(initialWidth);
  let popupAlign = $state.raw<DatePickerPopupAlign | undefined>(capturedAlignment(sample.align));
  let builtinPlacements = $state.raw<DatePickerProps['builtinPlacements']>(initialPlacements);
  let placement = $state<DatePickerProps['placement']>(initialPlacement);

  /** Восстанавливает тип области проверки из строки эталонного JSON. */
  function capturedAlignment(align: typeof sample.align): DatePickerPopupAlign | undefined {
    if (!align) {
      return undefined;
    }
    const { htmlRegion, ...values } = align;
    if (htmlRegion === undefined) {
      return values;
    }
    if (htmlRegion === 'visible' || htmlRegion === 'scroll' || htmlRegion === 'visibleFirst') {
      return { ...values, htmlRegion };
    }
    throw new Error(`Unknown picker alignment region ${htmlRegion}`);
  }

  /** Возвращает заданный scroll-контейнер после привязки DOM. */
  function resolveContainer(trigger: HTMLElement) {
    return clip ?? trigger.ownerDocument.body;
  }

  /** Повторяет изменение настройки у открытого React popup. */
  function update() {
    if ('update' in sample) popupAlign = sample.update ?? undefined;
    if (sample.updateMap) builtinPlacements = sample.updateMap;
    if (sample.move === 'topRight') placement = sample.move;
  }

  /** Изменяет ширину trigger без изменения viewport. */
  function resizeAnchor() {
    if (sample.resizeAnchor) width = sample.resizeAnchor;
  }

  let options = $derived({
    open, style: `width:${width}px`, popupAlign, builtinPlacements, placement,
    getPopupContainer: sample.container ? resolveContainer : undefined
  });
</script>

{#snippet picker()}
  <div data-picker-alignment-anchor style:position="absolute" style:left={`${left}px`}
    style:top={`${top}px`}>
    {#if sample.entry === 'range'}
      <RangePicker {...options} id={{ start: 'start', end: 'end' }} />
    {:else if sample.entry === 'time-range'}
      <TimeRangePicker {...options} {...clock} id={{ start: 'start', end: 'end' }} />
    {:else if sample.entry === 'time'}
      <TimePicker {...options} {...clock} id="start" />
    {:else if sample.entry === 'root-time'}
      <DatePicker {...options} picker="time" id="start" />
    {:else}
      <DatePicker {...options} id="start" />
    {/if}
  </div>
{/snippet}

<section id="picker-alignment-fixture">
  <button type="button" onclick={update}>Update picker alignment</button>
  <button type="button" onclick={() => open = !open}>{open ? 'Close picker' : 'Open picker'}</button>
  {#if sample.resizeAnchor}
    <button type="button" onclick={resizeAnchor}>Resize picker trigger</button>
  {/if}
  <ConfigProvider locale={enUS} direction={sample.rtl ? 'rtl' : 'ltr'}
    theme={{ token: { motion: false } }}>
    {#if sample.container}
      <div id="clip" bind:this={clip}
        style="position:absolute;left:90px;top:82px;width:487px;height:378px;overflow:auto;border:3px solid black">
        {@render picker()}
        {#if sample.scroll}
          <div aria-hidden="true" style:height="900px"></div>
        {/if}
      </div>
    {:else}
      {@render picker()}
    {/if}
  </ConfigProvider>
  {#if sample.documentHeight}
    <div aria-hidden="true" style:height={`${sample.documentHeight}px`}></div>
  {/if}
</section>
