import { tick, untrack } from 'svelte';
import { createVirtualList } from '../virtual-list/virtual-list.model.svelte';
import type {
  SelectOptionListItem, SelectOptionListKey, SelectOptionListScrollConfig
} from './select-option-list.types';

/** The model belongs to the control; DOM viewport follows the same conditional/retained popup. */
export function createSelectOptionList<Item>(options: {
  items: () => readonly SelectOptionListItem<Item>[];
  height: () => number | undefined;
  estimate: () => number;
  realVirtual: () => boolean;
  open: () => boolean;
  /** Delayed closure retains the last open collection. */
  lockOptions?: () => boolean;
  searchValue: () => string;
  selectedIndex: () => number;
  onSelectedActive?: (index: number) => void;
}) {
  let items = $state.raw(untrack(options.items));
  let hadItems = untrack(() => items.length > 0);
  let visited = false;
  let destroyed = false;
  let holderElement: HTMLDivElement | undefined;
  let initializing = false;
  let pendingPosition: { top?: number; left?: number } | undefined;
  let selectedRequest = 0;
  let pendingSelected: { index: number; request: number } | undefined;
  let restoration: { holder: HTMLDivElement; top: number; frame: number } | undefined;
  const viewport = createVirtualList<SelectOptionListItem<Item>, SelectOptionListKey>({
    rows: () => items,
    getKey: row => row.key,
    height: options.height,
    estimate: options.estimate,
    enabled: options.realVirtual,
    width: () => undefined,
    renderSizeCache: true
  });

  function cancelRestoration() {
    if (restoration) restoration.holder.ownerDocument.defaultView?.cancelAnimationFrame(restoration.frame);
    restoration = undefined;
  }

  // Source caches a closed collection, saving the reactive list sizes.
  $effect.pre(() => {
    const next = options.items();
    if (!options.open() || options.lockOptions?.()) {
      return;
    }
    untrack(() => {
      items = next;
      if (hadItems && !next.length) {
        cancelRestoration();
        viewport.reset();
        visited = false;
      }
      hadItems = next.length > 0;
    });
  });

  $effect(() => {
    if (!options.open()) {
      return;
    }
    return untrack(() => {
      let active = true;
      void tick().then(() => {
        if (active) prepare();
      });
      return () => { active = false; };
    });
  });

  // Selected scroll depends on open/search, and not re-creating view.
  $effect(() => {
    const open = options.open();
    void options.searchValue();
    if (!open) {
      return;
    }
    return untrack(() => {
      viewport.flashScrollbar();
      const index = options.selectedIndex();
      if (index < 0) {
        return;
      }
      options.onSelectedActive?.(index);
      const request = ++selectedRequest;
      const timer = setTimeout(() => {
        pendingSelected = { index, request };
        prepare();
      });
      return () => {
        clearTimeout(timer);
        if (pendingSelected?.request === request) pendingSelected = undefined;
      };
    });
  });

  $effect(() => () => {
    destroyed = true;
    pendingPosition = undefined;
    pendingSelected = undefined;
    cancelRestoration();
  });

  function applyScroll(config?: SelectOptionListScrollConfig | null) {
    const top = viewport.top;
    const domTop = holderElement?.scrollTop;
    // The number of public OptionList means an index, not a mirror-level virtual-list.
    viewport.scrollTo(typeof config === 'number' ? { index: config } : config);
    if (viewport.top !== top || holderElement?.scrollTop !== domTop) cancelRestoration();
  }

  function scrollTo(config?: SelectOptionListScrollConfig | null) {
    if (destroyed) {
      return;
    }
    if (!options.open() || !prepare()) {
      if (!visited) {
        return;
      }
      if (config == null) {
        viewport.flashScrollbar();
      }
      else if (typeof config === 'object' && ('top' in config || 'left' in config)) {
        // Closed positional request applies to the real viewport after opening.
        const { left, top } = config;
        pendingPosition = {
          left: left === undefined ? pendingPosition?.left : left,
          top: top === undefined ? pendingPosition?.top : top
        };
        if (top === undefined) viewport.flashScrollbar();
      }
      return;
    }
    pendingPosition = undefined;
    applyScroll(config);
  }

  function connect(holder: HTMLDivElement, inner: HTMLDivElement) {
    visited = true;
    holderElement = holder;
    cancelRestoration();
    initializing = true;
    const disconnect = viewport.connect(holder, inner);
    prepare();
    return () => {
      cancelRestoration();
      disconnect();
      if (holderElement === holder) {
        holderElement = undefined;
        initializing = false;
      }
    };
  }

  function prepare() {
    const holder = holderElement;
    if (destroyed || !options.open() || !holder?.clientHeight) {
      return false;
    }
    if (initializing) {
      initializing = false;
      viewport.measure();
      const top = viewport.top;
      if (holder.scrollTop !== top) {
        cancelRestoration();
        restoration = { holder, top, frame: holder.ownerDocument.defaultView!.requestAnimationFrame(() => {
          if (restoration?.holder === holder) restoration = undefined;
        }) };
        holder.scrollTop = top;
      }
    }
    const position = pendingPosition;
    pendingPosition = undefined;
    if (position && items.length) applyScroll(position);
    const selected = pendingSelected;
    pendingSelected = undefined;
    if (selected && items.length) applyScroll({ index: selected.index });
    return true;
  }

  function initializingScroll(event: UIEvent & { currentTarget: HTMLDivElement }) {
    const current = restoration;
    if (!current || event.currentTarget !== current.holder || event.target !== current.holder
      || !event.isTrusted) {
      return false;
    }
    // Only the first trusted scroll of the new holder to the saved offset; other events are published.
    cancelRestoration();
    return event.currentTarget.scrollTop === current.top;
  }

  return {
    viewport,
    get items() { return items; },
    get height() { return options.height(); },
    get realVirtual() { return options.realVirtual(); },
    connect,
    prepare,
    initializingScroll,
    scrollTo,
    scrollActive(index: number) { scrollTo({ index }); }
  };
}
