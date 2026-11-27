// The group owns one surface and a request to show it. Changing the goal during the enter is
// waiting for the end of the current movement, and the remote participant releases his record
// immediately.
import { getContext, onDestroy, setContext } from 'svelte';
import type { ClassValue } from 'svelte/elements';
import type { InlineStyleLayer } from '../inline-style.engine';
import type { PopupSourceAlign } from '../popup-position.engine';
import type { TooltipSourcePlacement } from './tooltip.engine';
import type { AdjustOverflow, TooltipContent, TooltipPlacement } from './tooltip.types';

export interface TooltipUniqueView {
  readonly kind: 'tooltip' | 'dialog';
  readonly id: string;
  readonly prefix: string;
  readonly direction?: 'ltr' | 'rtl';
  readonly content: TooltipContent;
  readonly available: boolean;
  readonly rootClasses: ClassValue;
  readonly containerClasses: ClassValue;
  readonly backgroundClasses: ClassValue;
  readonly rootLayers: readonly InlineStyleLayer[];
  readonly containerLayers: readonly InlineStyleLayer[];
  readonly presetBackground?: string;
  readonly customColor: boolean;
  readonly anchor?: Element;
  readonly trigger?: Element;
  readonly placement: TooltipPlacement;
  readonly autoAdjustOverflow: boolean | AdjustOverflow;
  readonly sourcePlacement?: TooltipSourcePlacement;
  readonly sourceAlign?: PopupSourceAlign;
  readonly placements: Readonly<Record<string, PopupSourceAlign>>;
  readonly gap?: number;
  readonly motion: boolean;
  readonly defaultMotionName: string;
  readonly motionName?: string;
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly ariaDescribedby?: string;
  readonly ariaBusy?: boolean;
  readonly outsideEvents?: 'pointer' | 'mouse';
  readonly onPopupClick?: (event: MouseEvent) => void;
  onDismiss: (reason: 'escape' | 'outside') => void;
  onHoverChange?: (next: boolean) => void;
  onFocusIn?: (event: FocusEvent) => void;
  onFocusOut?: (event: FocusEvent) => void;
  onHidden?: () => void;
  onTransfer?: (element: HTMLDivElement) => void;
}

export interface TooltipUniqueOwner {
  readonly view: TooltipUniqueView;
  readonly context: Map<unknown, unknown>;
  isOpen: () => boolean;
}

export interface TooltipUniqueSurface {
  getPopupElement: () => HTMLDivElement | undefined;
  isShowing: () => boolean;
  forceAlign: () => void;
}

const key = Symbol('ant-tooltip-unique');

/** Returns the nearest group at the initialization of the participant. */
export function useTooltipUnique() {
  return getContext<TooltipUnique | undefined>(key);
}

/** The content of the panel does not overuse the surface of its parent. */
export function isolateTooltipUnique() {
  setContext(key, undefined);
}

/** Popup inside another native surface retains its own Escape and top layer. */
export function hasTooltipPopupAncestor(anchor: Element | undefined) {
  let node = anchor;
  while (node) {
    if (node.closest('[popover]')) return true;
    const root = node.getRootNode();
    node = 'host' in root ? (root as ShadowRoot).host : undefined;
  }
  return false;
}

/** Stores the group’s last request and holds only one owner of the content. */
export function provideTooltipUnique(getSurface: () => TooltipUniqueSurface | undefined) {
  let owner = $state.raw<TooltipUniqueOwner>();
  let open = $state(false);
  let ready = $state(false);
  let active = true;
  let entering = false;
  let queued: TooltipUniqueOwner | undefined;
  let scheduled: { owner: TooltipUniqueOwner; open: boolean; } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  // Also invalidates a zero-delay request waiting for Svelte to finish updating.
  function cancel() {
    clearTimeout(timer);
    timer = undefined;
    scheduled = undefined;
  }

  // Returns the sign of the removed display, which could hold the previous panel.
  function discardPending(target: TooltipUniqueOwner) {
    const pending = scheduled?.owner === target ? scheduled : undefined;
    const wasNext = queued === target || pending?.open === true;
    if (pending) cancel();
    if (queued === target) queued = undefined;

    return wasNext;
  }

  // Leaves the old content on the screen until the completion of the first enter.
  function show(next: TooltipUniqueOwner) {
    if (open && entering && owner !== next) {
      queued = next;
      return;
    }

    queued = undefined;
    if (!open) entering = true;
    owner = next;
    open = true;
  }

  // The previous participant's early closure does not reset the wait-and-see show of the next.
  function request(target: TooltipUniqueOwner, next: boolean, delay: number) {
    if (!active) return;

    if (next && owner === target && open) {
      cancel();
      queued = undefined;
      return;
    }

    let requestedOwner = target;
    if (!next) {
      const canceledShow = discardPending(target);
      const current = owner;
      if (!current || current !== target && !canceledShow || scheduled?.open || queued
        || current.isOpen()) {
        return;
      }

      requestedOwner = current;
    }

    cancel();
    const change = { owner: requestedOwner, open: next };
    scheduled = change;

    // Checks the current state after the delay and before contacting the owner.
    function apply() {
      if (scheduled !== change) return;

      cancel();
      if (next) {
        if (requestedOwner.isOpen()) {
          show(requestedOwner);
        }
        else if (!queued && owner && !owner.isOpen()) {
          open = false;
        }
      }
      else if (owner === requestedOwner && !requestedOwner.isOpen() && !queued) {
        open = false;
      }
    }

    if (delay > 0) timer = setTimeout(apply, delay);
    else queueMicrotask(apply);
  }

  onDestroy(() => {
    active = false;
    cancel();
    queued = undefined;
  });

  const group = {
    // The owner retains an identity, even if its props or DOM is updated.
    get owner() { return owner; },
    // Switching between open participants retains the appearance of a common surface.
    get open() { return open; },
    // The background moves after the zoom entrance is completed, and when you leave, it retains the calculated position.
    get ready() { return ready; },
    request,
    // Removes all references to the destroyed participant, including delayed impressions.
    release(target: TooltipUniqueOwner) {
      if (!active) return;

      const canceledShow = discardPending(target);
      if (owner !== target) {
        if (canceledShow && owner && !scheduled?.open && !queued) request(owner, false, 0);
        return;
      }

      const replacement = queued;
      entering = false;
      queued = undefined;
      if (replacement?.isOpen()) {
        show(replacement);
      }
      else {
        open = false;
        ready = false;
        owner = undefined;
      }
    },
    // Applies the last request received during the entry animation.
    settled(visible: boolean) {
      if (!active) return;

      entering = false;
      ready = visible;
      const next = queued;
      queued = undefined;
      if (!visible || !next) return;

      if (next.isOpen()) {
        show(next);
      }
      else if (owner && !scheduled?.open) {
        request(owner, false, 0);
      }
    },
    // Ref and alignment are tied to the owner with whom DOM is now connected.
    surfaceFor(target: TooltipUniqueOwner) {
      return owner === target ? getSurface() : undefined;
    }
  };
  setContext(key, group);
  return group;
}

export type TooltipUnique = ReturnType<typeof provideTooltipUnique>;
