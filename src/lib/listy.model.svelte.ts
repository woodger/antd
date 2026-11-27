// Measures Listy rows and headings to compute the visible window and sticky header. Cancellation of
// measurements and scrollTo belongs to the current viewport attachment.
import { tick, untrack } from 'svelte';
import { measureListyRow } from './listy.dom';
import {
  listyScrollStep,
  listySizes,
  listySticky,
  listyTag,
  listyWindow,
  type ListyHeader,
  type ListyRow
} from './listy.engine';
import type { ListyKey, ListyScrollAlign, ListyScrollToConfig } from './listy.types';

export function createListyVirtual<T, K extends ListyKey>(options: {
  rows: () => readonly ListyRow<T, K>[];
  height: () => number | undefined;
  estimate: () => number;
  sticky: () => boolean;
}) {
  let heights = $state.raw(new Map<string, number>());
  let top = $state(0);
  let innerHeight = $state(0);
  let holderHeight = $state(untrack(() => options.height() ?? 0));
  let flash = $state(0);
  let moving = $state(false);
  let connected = $state(false);
  let holder: HTMLDivElement | undefined;
  let inner: HTMLDivElement | undefined;
  let measurementRevision = 0;
  let scrollRevision = 0;
  const nodes = new Map<string, HTMLElement>();
  const range = $derived(listyWindow(
    options.rows(), heights, options.estimate(), options.height(), top, innerHeight
  ));
  const sizes = $derived(listySizes(options.rows(), heights, options.estimate()));
  const headers = $derived(options.rows().filter(
    (row): row is ListyHeader<T, K> => row.type === 'group'
  ));
  const sticky = $derived(listySticky(headers, sizes, top));

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

  function measure() {
    measurementRevision++;
    if (!connected) {
      return;
    }
    const previousHeight = range.scrollHeight;
    const changes: { key: string; previous: number | undefined; height: number; }[] = [];
    for (const [key, element] of nodes) {
      const height = measureListyRow(element);
      if (height === undefined) {
        continue;
      }

      const previous = heights.get(key);
      if (previous !== height) {
        changes.push({ key, previous, height });
      }
    }

    if (changes.length) {
      const next = new Map(heights);
      for (const change of changes) next.set(change.key, change.height);
      heights = next;
      const change = changes[0];
      if (changes.length === 1 && change.previous === undefined
        && previousHeight !== range.scrollHeight
        && options.rows()[range.start]?.taggedKey === change.key) {
        sync(top + change.height - options.estimate());
      }
    }
    if (inner) innerHeight = inner.offsetHeight;
    if (holder) {
      const rectangle = holder.getBoundingClientRect().height;
      holderHeight = holder.offsetHeight === Math.round(rectangle) ? rectangle : holder.offsetHeight;
    }
  }

  // Combines pending measurements into one pass after the current update.
  function collect() {
    const scheduledRevision = ++measurementRevision;
    void Promise.resolve().then(() => {
      if (scheduledRevision === measurementRevision) measure();
    });
  }

  function attach(element: HTMLElement, key: string) {
    nodes.set(key, element);
    collect();
    return () => {
      if (nodes.get(key) === element) nodes.delete(key);
    };
  }

  function connect(viewport: HTMLDivElement, content: HTMLDivElement) {
    holder = viewport;
    inner = content;
    connected = true;
    const Observer = viewport.ownerDocument.defaultView?.ResizeObserver;
    const observer = Observer ? new Observer(entries => {
      if (entries.some(entry => entry.target === viewport || entry.contentRect.height)) collect();
    }) : undefined;
    observer?.observe(viewport);
    observer?.observe(content);
    measure();

    return () => {
      observer?.disconnect();
      connected = false;
      holder = undefined;
      inner = undefined;
      measurementRevision++;
      scrollRevision++;
    };
  }

  // Repeats the measurement after tick until the height and position of the target are stabilized.
  async function alignTo(
    key: string,
    align: ListyScrollAlign | undefined,
    baseOffset: number,
    stickyKey?: string
  ) {
    const alignmentRevision = ++scrollRevision;
    let index = options.rows().findIndex(row => row.taggedKey === key);
    let resolved = align;
    let lastTop: number | null | undefined;
    for (let times = 0; times < 10; times++) {
      if (alignmentRevision !== scrollRevision || !holder) {
        return;
      }
      measure();
      if (index < 0) index = options.rows().findIndex(row => row.taggedKey === key);
      if (index < 0) {
        await tick();
        continue;
      }
      const header = stickyKey && resolved === 'top' ? sizes.get(stickyKey) : undefined;
      const headerHeight = header ? header.bottom - header.top : 0;
      const rawOffset = baseOffset + (Number.isFinite(headerHeight) ? headerHeight : 0);
      const offset = Number.isFinite(rawOffset) ? rawOffset : 0;
      if (!holder.clientHeight) {
        return;
      }
      const step = listyScrollStep(
        options.rows(), heights, options.estimate(), index, resolved,
        offset, holder.scrollTop, holder.clientHeight
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

  function scrollTo(config?: ListyScrollToConfig) {
    if (!holder) {
      return;
    }
    if (config == null) {
      flash++;
      return;
    }
    if (typeof config === 'number') {
      scrollRevision++;
      sync(config);
      return;
    }

    // Listy chooses groupKey before the position; rc-virtual-list selects the position before item key.
    if ('groupKey' in config) {
      void alignTo(listyTag(config.groupKey, 'group'), config.align, config.offset ?? 0);
    }
    else if ('top' in config || 'left' in config) {
      scrollTo(config.top);
    }
    else if ('key' in config) {
      const key = listyTag(config.key, 'item');
      const stickyKey = options.sticky() && config.align !== 'bottom'
        ? findGroupHeader(key) : undefined;
      void alignTo(key, config.align, config.offset ?? 0, stickyKey);
    }
  }

  // Returns the header that precedes the element and can overlap it from above.
  function findGroupHeader(itemKey: string) {
    let headerKey: string | undefined;
    for (const row of options.rows()) {
      if (row.type === 'group') {
        headerKey = row.taggedKey;
      }
      else if (row.taggedKey === itemKey) {
        return headerKey;
      }
    }

    return undefined;
  }

  return {
    get range() { return range; },
    get top() { return top; },
    get holderHeight() { return holderHeight; },
    get sticky() { return sticky; },
    get connected() { return connected; },
    get flash() { return flash; },
    get moving() { return moving; },
    set moving(value: boolean) { moving = value; },
    attach,
    connect,
    measure,
    collect,
    sync,
    scrollTo,
    flashScrollbar() { flash++; },
    scrollBy(delta: number) { sync(top + delta); }
  };
}
