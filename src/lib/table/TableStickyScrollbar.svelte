<script lang="ts">
  // The extra scrollbar forwards pointer input to the main scrollport. Its thumb width reflects the
  // visible fraction of the table.
  import { tableStickyBarHeight, type TableStickyBarLayout } from './table-sticky.dom';

  let { prefix, layout, rtl, onScroll, onMoving }: {
    prefix: string;
    layout: TableStickyBarLayout;
    rtl: boolean;
    onScroll: (offset: number) => void;
    onMoving: (moving: boolean) => void;
  } = $props();

  let drag = $state<{ pointerId: number; start: number; offset: number; }>();
  const scale = $derived(layout.size / layout.range);

  function start(event: PointerEvent & { currentTarget: HTMLDivElement; }) {
    if (drag || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag = { pointerId: event.pointerId, start: event.clientX, offset: layout.offset };
    onMoving(true);
  }

  function move(event: PointerEvent) {
    if (drag?.pointerId !== event.pointerId) {
      return;
    }

    const travel = (event.clientX - drag.start) * (rtl ? -1 : 1);
    const offset = drag.offset + travel / scale;
    onScroll(Math.max(0, Math.min(layout.range - layout.size, offset)));
  }

  function stop(event: PointerEvent) {
    if (drag?.pointerId === event.pointerId) {
      drag = undefined;
      onMoving(false);
    }
  }
</script>

<div
  aria-hidden="true"
  class={`${prefix}-sticky-scroll sticky-track`}
  style:top={`${layout.top}px`}
  style:width={`${layout.size}px`}
  style:height={`${tableStickyBarHeight}px`}
>
  <div
    role="presentation"
    class={[
      `${prefix}-sticky-scroll-bar sticky-thumb`,
      drag && `${prefix}-sticky-scroll-bar-active`
    ]}
    style:inset-inline-start={`${layout.offset * scale}px`}
    style:width={`${layout.size * scale}px`}
    onpointerdown={start}
    onpointermove={move}
    onlostpointercapture={stop}
  ></div>
</div>

<style>
  .sticky-track[aria-hidden] {
    position: absolute;
    inset-inline-start: 0;
    z-index: 5;
  }

  .sticky-track .sticky-thumb {
    cursor: pointer;
    touch-action: none;
    user-select: none;
    transition-property: background-color;
  }
</style>
