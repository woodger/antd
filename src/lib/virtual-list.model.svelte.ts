// Связывает окно виртуального списка с реальными размерами DOM и scrollTo.
// Измерение и прокрутка отменяются раздельно, сохраняя высоты переиспользуемых строк.
import { tick, untrack } from 'svelte';
import { virtualListScrollStep, virtualListSizes, virtualListWindow } from './virtual-list.engine';
import { createVirtualListSizeCache } from './virtual-list-size-cache.engine';
import { measureVirtualListRow } from './virtual-list.dom';
import type { VirtualScrollAlign } from './virtual-list.engine';
import type { VirtualScrollConfig, VirtualScrollOffset } from './virtual-list.types';

/** Общий viewport: retained heights, source window и до десяти проходов scrollTo. */
export function createVirtualList<Row, Key>(options: {
  rows: () => readonly Row[];
  getKey: (row: Row) => Key;
  height: () => number | undefined;
  estimate: () => number;
  enabled: () => boolean;
  width: () => number | undefined;
  renderSizeCache?: boolean;
}) {
  let heights = $state.raw(new Map<Key, number>());
  let top = $state(0);
  let left = $state(0);
  let innerHeight = $state(0);
  let holderHeight = $state(untrack(() => options.height() ?? 0));
  let holderWidth = $state(0);
  let flash = $state(0);
  let moving = $state(false);
  let connected = $state(false);
  let holder: HTMLDivElement | undefined;
  let inner: HTMLDivElement | undefined;
  let observer: ResizeObserver | undefined;
  let measurementRevision = 0;
  let scrollRevision = 0;
  type Alignment = {
    revision: number;
    times: number;
    index: number;
    key: Key | undefined;
    originAlign: VirtualScrollAlign | undefined;
    targetAlign?: VirtualScrollAlign;
    offset: VirtualScrollOffset<Key>;
    lastTop?: number | null;
  };
  let alignment = $state.raw<Alignment>();
  const nodes = new Map<Key, HTMLElement>();
  const range = $derived(virtualListWindow(
    options.rows(), options.getKey, heights, options.estimate(), options.height(), top,
    innerHeight, options.enabled(), options.width()
  ));
  const sizes = $derived(virtualListSizes(
    options.rows(),
    options.getKey,
    heights,
    options.estimate()
  ));
  let renderedGetSize = options.renderSizeCache ? untrack(() => createVirtualListSizeCache(
    options.rows(), options.getKey, () => heights, options.estimate()
  )) : undefined;

  if (options.renderSizeCache) {
    $effect(() => {
      const rows = options.rows();
      const estimate = options.estimate();
      void heights;
      // Source сбрасывает ленивый кеш после render, а не внутри синхронного measure.
      renderedGetSize = createVirtualListSizeCache(rows, options.getKey, () => heights, estimate);
    });

    $effect(() => {
      const pending = alignment;
      if (pending && connected && pending.times < 10) untrack(() => alignRendered(pending));
    });

    $effect(() => () => {
      scrollRevision++;
      alignment = undefined;
    });
  }

  function sync(next: number) {
    if (!holder) {
      return;
    }
    const maximum = (range.scrollHeight ?? NaN) - (options.height() ?? NaN);
    const value = Math.max(0, Number.isNaN(maximum) ? next : Math.min(next, maximum));
    holder.scrollTop = value;
    if (top !== value) {
      top = value;
      flash++;
    }
  }

  function syncLeft(next: number) {
    const maximum = Math.max(0, (options.width() ?? holderWidth) - holderWidth);
    const value = Math.max(0, Math.min(next, maximum));
    if (left !== value) {
      left = value;
      flash++;
    }
  }

  function measure() {
    measurementRevision++;
    if (!connected) {
      return;
    }
    const previousHeight = range.scrollHeight;
    const changes = measureRows();
    if (changes.length) {
      const next = new Map(heights);
      for (const change of changes) next.set(change.key, change.height);
      heights = next;

      const change = changes[0];
      const first = options.rows()[range.start];
      if (changes.length === 1 && change.previous === undefined
        && previousHeight !== range.scrollHeight && first
        && options.getKey(first) === change.key) {
        sync(top + change.height - options.estimate());
      }
    }

    if (inner) innerHeight = inner.offsetHeight;
    if (holder) {
      const rect = holder.getBoundingClientRect();
      holderHeight = holder.offsetHeight === Math.round(rect.height)
        ? rect.height : holder.offsetHeight;
      holderWidth = holder.offsetWidth === Math.round(rect.width) ? rect.width : holder.offsetWidth;
      syncLeft(left);
    }
  }

  // Учитывает прежнюю высоту для компенсации позиции при первом измерении строки.
  function measureRows() {
    const changes: { key: Key; previous: number | undefined; height: number; }[] = [];
    for (const [key, element] of nodes) {
      const height = measureVirtualListRow(element);
      if (height === undefined) {
        continue;
      }

      const previous = heights.get(key);
      if (previous !== height) {
        changes.push({ key, previous, height });
      }
    }

    return changes;
  }

  // Несколько DOM-изменений до одной микрозадачи требуют только последнего измерения.
  function collect() {
    const scheduledRevision = ++measurementRevision;
    void Promise.resolve().then(() => {
      if (scheduledRevision === measurementRevision) measure();
    });
  }

  function attach(element: HTMLElement, key: Key) {
    nodes.set(key, element);
    observer?.observe(element);
    collect();

    // При смене элемента с тем же ключом старый cleanup сохраняет новую регистрацию.
    return () => {
      observer?.unobserve(element);
      if (nodes.get(key) === element) nodes.delete(key);
    };
  }

  function connect(viewport: HTMLDivElement, content: HTMLDivElement) {
    holder = viewport;
    inner = content;
    connected = true;
    const Observer = viewport.ownerDocument.defaultView?.ResizeObserver;
    observer = Observer ? new Observer(entries => {
      if (entries.some(entry => entry.target === viewport || entry.contentRect.height)) collect();
    }) : undefined;
    observer?.observe(viewport);
    observer?.observe(content);
    for (const node of nodes.values()) observer?.observe(node);
    measure();

    // Отключение viewport лишает отложенные операции их DOM-цели.
    return () => {
      observer?.disconnect();
      observer = undefined;
      connected = false;
      holder = undefined;
      inner = undefined;
      measurementRevision++;
      scrollRevision++;
      if (options.renderSizeCache) alignment = undefined;
    };
  }

  function getSize(startKey: Key, endKey = startKey) {
    const start = sizes.get(startKey);
    const top = start?.top ?? 0;
    const end = sizes.get(endKey);
    return { top, bottom: end?.bottom };
  }

  function alignRendered(pending: Alignment) {
    if (pending.revision !== scrollRevision || !holder) {
      return;
    }
    const rows = options.rows();
    const estimate = options.estimate();
    const size = renderedGetSize ?? getSize;
    // Как useScrollTo layoutEffect: render-кеш уже опубликован, измерение меняет лишь heights.
    measure();
    const index = pending.index >= 0 ? pending.index
      : rows.findIndex(row => options.getKey(row) === pending.key);
    const resolved = pending.targetAlign || pending.originAlign;
    const value = typeof pending.offset === 'function'
      ? pending.offset({ getSize: size, align: resolved }) : pending.offset;
    if (pending.revision !== scrollRevision || !holder) {
      return;
    }
    const offset = Number.isFinite(value) ? value : 0;
    let unknown = index < 0;
    let target: number | null = null;
    let targetAlign = pending.targetAlign;
    if (holder.clientHeight && index >= 0) {
      const step = virtualListScrollStep(
        rows, options.getKey, heights, estimate, index, resolved, offset,
        holder.scrollTop, holder.clientHeight
      );
      if (step.top !== undefined) sync(step.top);
      target = step.top ?? null;
      targetAlign = step.align;
      unknown = step.unknown || target !== pending.lastTop;
    }
    if (unknown && pending.revision === scrollRevision) {
      alignment = {
        ...pending, times: pending.times + 1, index, targetAlign, lastTop: target
      };
    }
  }

  function align(
    index: number,
    key: Key | undefined,
    originAlign: VirtualScrollAlign | undefined,
    offset: VirtualScrollOffset<Key>
  ) {
    if (options.renderSizeCache) {
      alignment = {
        revision: ++scrollRevision, times: 0, index, key, originAlign, offset
      };
    }
    else {
      void alignTo(index, key, originAlign, offset);
    }
  }

  async function alignTo(
    index: number,
    key: Key | undefined,
    align: VirtualScrollAlign | undefined,
    rawOffset: VirtualScrollOffset<Key>
  ) {
    const alignmentRevision = ++scrollRevision;
    let resolved = align;
    let lastTop: number | null | undefined;
    for (let times = 0; times < 10; times++) {
      if (alignmentRevision !== scrollRevision || !holder) {
        return;
      }
      measure();
      if (index < 0) index = options.rows().findIndex(row => options.getKey(row) === key);
      const value = typeof rawOffset === 'function'
        ? rawOffset({ getSize, align: resolved }) : rawOffset;
      const offset = Number.isFinite(value) ? value : 0;
      if (index < 0) {
        await tick();
        continue;
      }
      if (!holder.clientHeight) {
        return;
      }
      const step = virtualListScrollStep(
        options.rows(),
        options.getKey,
        heights,
        options.estimate(),
        index,
        resolved,
        offset,
        holder.scrollTop,
        holder.clientHeight
      );
      if (step.top !== undefined) sync(step.top);
      const target = step.top ?? null;
      if (!step.unknown && target === lastTop) {
        return;
      }
      resolved = step.align;
      lastTop = target;
      await tick();
    }
  }

  function scrollTo(config?: VirtualScrollConfig<Key> | null) {
    if (!holder) {
      return;
    }
    if (config == null) {
      flash++;
      return;
    }
    if (typeof config === 'number') {
      scrollRevision++;
      if (options.renderSizeCache) alignment = undefined;
      sync(config);
      return;
    }
    if ('top' in config || 'left' in config) {
      if (options.renderSizeCache) {
        scrollRevision++;
        alignment = undefined;
      }
      if (config.left !== undefined) syncLeft(config.left);
      scrollTo(config.top);
    }
    else if ('index' in config) {
      align(config.index, undefined, config.align, config.offset ?? 0);
    }
    else if ('key' in config) {
      const rows = options.rows();
      const index = rows.findIndex(row => options.getKey(row) === config.key);
      align(index, config.key, config.align, config.offset ?? 0);
    }
  }

  return {
    get range() { return range; },
    get top() { return top; },
    get left() { return left; },
    get holderHeight() { return holderHeight; },
    get holderWidth() { return holderWidth; },
    get flash() { return flash; },
    get moving() { return moving; },
    set moving(value: boolean) { moving = value; },
    attach,
    connect,
    measure,
    collect,
    sync,
    syncLeft,
    scrollTo,
    reset() {
      measurementRevision++;
      scrollRevision++;
      if (options.renderSizeCache) alignment = undefined;
      for (const node of nodes.values()) observer?.unobserve(node);
      nodes.clear();
      heights = new Map();
      if (options.renderSizeCache) {
        renderedGetSize = createVirtualListSizeCache(
          options.rows(), options.getKey, () => heights, options.estimate()
        );
      }
      top = 0;
      left = 0;
      innerHeight = 0;
      holderHeight = options.height() ?? 0;
      holderWidth = 0;
      flash = 0;
      moving = false;
    },
    flashScrollbar() { flash++; },
    scrollBy(delta: number) { sync(top + delta); },
    scrollByX(delta: number) { syncLeft(left + delta); }
  };
}
