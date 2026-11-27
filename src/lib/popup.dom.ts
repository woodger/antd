// Connects the popover to and manages its position, visibility, and. Interaction stack belongs to
// the document. Connection holder protects retarget.
import {
  getTooltipPosition,
  type TooltipPosition,
  type TooltipRect,
  type TooltipSourcePlacement
} from './tooltip/tooltip.engine';
import type { PopupFlipCache, PopupSourceAlign } from './popup-position.engine';
import type { AdjustOverflow, TooltipPlacement } from './tooltip/tooltip.types';

const openPopups = new WeakMap<Document, HTMLElement[]>();
const popupConnections = new WeakMap<HTMLElement, { anchor: Element; }>();

/** Cleanup remains a called function; forceAlign uses the same position controller. */
export interface PopupConnection {
  (retainSurface?: boolean): void;
  forceAlign: () => void;
  /** After CSS, the motion returns the position to visibility notification. */
  align: () => void;
}

// Take into account the active node in ShadowRoot before the transition to the document.
export function getPopupActiveElement(element: Element) {
  const root = element.getRootNode() as Document | ShadowRoot;
  return root.activeElement ?? element.ownerDocument.activeElement;
}

/** Take into account the logical connection with the trigger, even when the panel is removed from the scope portal. */
export function isPopupFocusWithin(scope: HTMLElement, element: Element | null): boolean {
  let current = element;
  const visited = new Set<Element>();
  while (current && !visited.has(current)) {
    if (scope === current || scope.contains(current)) return true;

    visited.add(current);
    const popup = current.closest<HTMLElement>('[popover]:popover-open');
    const owner = popup ? popupConnections.get(popup) : undefined;
    if (owner) {
      current = owner.anchor;
    }
    else {
      const root = current.getRootNode();
      current = root instanceof ShadowRoot ? root.host : null;
    }
  }

  return false;
}

// Starts measurement and returns one handle for popup updates and cleanup.
export function connectPopup(popup: HTMLElement, anchor: Element, options: {
  trigger?: Element;
  placement: TooltipPlacement;
  autoAdjustOverflow: boolean | AdjustOverflow;
  sourcePlacement?: TooltipSourcePlacement;
  sourceAlign?: PopupSourceAlign;
  builtinPlacements?: Readonly<Record<string, PopupSourceAlign>>;
  /** For a virtual anchor, the placement name is determined by the point of the panel itself. */
  alignPoint?: boolean;
  onAlign?: (position: TooltipPosition) => void;
  onPlacement: (placement: TooltipPlacement, position: TooltipPosition) => void;
  onDismiss: (reason: 'escape' | 'outside', outsideTarget?: Node) => void;
  /** An internal opt-out for a surface without an Escape handler, such as a replaced Select menu. */
  dismissOnEscape?: boolean;
  outsideEvents?: 'pointer' | 'mouse';
  /** Takes into account the associated surfaces taken from the DOM popup individual portal. */
  isRelatedTarget?: (target: Node) => boolean;
  onKeydown?: (event: KeyboardEvent) => void;
  preserveFocus?: boolean | ((event: PointerEvent) => boolean);
  maxWidth?: string | false;
  align?: 'left' | 'right' | 'top' | 'bottom';
  matchAnchorWidth?: boolean;
  anchorWidthVariable?: string;
  getAnchorWidth?: () => number | undefined;
  constrainWidth?: boolean;
  gap?: number | (() => number | undefined);
  allowZeroSize?: boolean | (() => boolean);
  allowOffscreenAnchor?: boolean;
  /** Retains the last geometry of the painted surface during CSS transform. */
  pauseAlignment?: () => boolean;
  interactive?: boolean;
  measurePopup?: () => DOMRect;
  getPosition?: (anchor: DOMRect, popup: DOMRect, viewport: TooltipRect) => TooltipPosition | undefined;
  getAnchorRect?: (current: DOMRect, popup: DOMRect) => DOMRect;
  applyPosition?: (position: TooltipPosition) => void;
  onVisibilityChange?: (visible: boolean) => void;
}): PopupConnection {
  const document = anchor.ownerDocument;
  // Rule 2: Popup connection is done only in browser lifecycle.
  const view = document.defaultView!;
  const owner = { anchor };
  popupConnections.set(popup, owner);
  let frame = 0;
  let shown = false;
  let disposed = false;
  let alignmentRevision = 0;
  let lastPosition = '';
  let lastAlignment = '';
  let flips: PopupFlipCache | undefined;

  // Removes the popup from the interaction stack before notification and hiding.
  function hide() {
    const stack = openPopups.get(document);
    const index = stack?.indexOf(popup) ?? -1;

    if (stack && index !== -1) {
      stack.splice(index, 1);
    }
    if (shown)
      options.onVisibilityChange?.(false);
    if (popup.matches(':popover-open'))
      popup.hidePopover();
    popup.hidden = true;
    shown = false;
  }

  // Verifies the availability of anchor, measures the popup and publishes the changed position.
  function update(manual = false) {
    if (disposed || shown && options.pauseAlignment?.()) {
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const visual = view.visualViewport;
    const viewport = {
      x: visual?.offsetLeft ?? 0,
      y: visual?.offsetTop ?? 0,
      width: visual?.width ?? view.innerWidth,
      height: visual?.height ?? view.innerHeight
    };
    const modal = getPopupActiveElement(popup)?.closest('dialog:modal')
      ?? document.querySelector('dialog:modal');
    const zeroAllowed = typeof options.allowZeroSize === 'function'
      ? options.allowZeroSize() : options.allowZeroSize;
    const horizontalVisible = zeroAllowed && rect.width === 0
      ? rect.left >= viewport.x && rect.left <= viewport.x + viewport.width
      : rect.right > viewport.x && rect.left < viewport.x + viewport.width;
    const verticalVisible = zeroAllowed && rect.height === 0
      ? rect.top >= viewport.y && rect.top <= viewport.y + viewport.height
      : rect.bottom > viewport.y && rect.top < viewport.y + viewport.height;
    const visible = anchor.isConnected
      && !anchor.closest('[inert]')
      && anchor.getClientRects().length
      && (zeroAllowed || rect.width && rect.height)
      && (options.allowOffscreenAnchor || horizontalVisible && verticalVisible)
      && (!modal || modal.contains(anchor) || popup.contains(modal));

    if (!visible) {
      hide();
      return;
    }

    if (options.maxWidth !== false) {
      popup.style.maxWidth = `min(${options.maxWidth
        ?? 'var(--ant-tooltip-max-width)'}, ${Math.max(
          0,
          viewport.width - 16
        )}px)`;
    }
    const { matchAnchorWidth, anchorWidthVariable } = options;
    if (matchAnchorWidth || anchorWidthVariable) {
      const anchorWidth = options.getAnchorWidth?.() ?? rect.width;
      const width = `${options.constrainWidth === false ? anchorWidth
        : Math.min(anchorWidth, Math.max(0, viewport.width - 16))}px`;
      if (matchAnchorWidth) popup.style.minWidth = width;
      if (anchorWidthVariable && popup.style.getPropertyValue(anchorWidthVariable) !== width)
        popup.style.setProperty(anchorWidthVariable, width);
    }
    popup.hidden = false;

    if (!popup.matches(':popover-open')) {
      popup.showPopover();
    }
    const stack = openPopups.get(document) ?? [];
    const index = stack.indexOf(popup);
    if (options.interactive === false && index !== -1) {
      stack.splice(index, 1);
    }
    else if (options.interactive !== false && index === -1) stack.push(popup);
    openPopups.set(document, stack);

    const bounds = options.measurePopup?.() ?? popup.getBoundingClientRect();
    const positionRect = options.getAnchorRect?.(rect, bounds) ?? rect;
    const position = options.getPosition?.(positionRect, bounds, viewport) ?? getTooltipPosition(
      positionRect,
      bounds,
      viewport,
      options.placement,
      options.autoAdjustOverflow,
      options.align,
      typeof options.gap === 'function' ? options.gap() : options.gap,
      {
        flips,
        source: options.sourcePlacement,
        align: options.sourceAlign,
        builtinPlacements: options.builtinPlacements,
        alignPoint: options.alignPoint,
        scrollRegion: {
          x: -document.documentElement.scrollLeft,
          y: -document.documentElement.scrollTop,
          width: Math.max(document.documentElement.scrollWidth, bounds.width),
          height: Math.max(document.documentElement.scrollHeight, bounds.height)
        }
      }
    );
    flips = position.flips;
    if (disposed) {
      return;
    }
    const signature = `${position
      .left}:${position
        .top}:${position
          .arrowX}:${position
            .arrowY}:${position
              .placement}:${JSON.stringify(position.sourceAlign)}:${position.alignedPlacement}`;

    const onAlign = options.onAlign;
    if (onAlign) {
      const geometry = `${signature}:${rect.x}:${rect.y}:${rect.width}:${rect.height}:${bounds.width}:${bounds.height}`;
      if (manual || geometry !== lastAlignment) {
        onAlign(position);
        lastAlignment = geometry;
      }
    }
    options.applyPosition?.(position);
    if (signature !== lastPosition) {
      if (!options.applyPosition) {
        popup.style.left = `${position.left}px`;
        popup.style.top = `${position.top}px`;
        popup.style.setProperty('--arrow-x', `${position.arrowX}px`);
        popup.style.setProperty('--arrow-y', `${position.arrowY}px`);
      }
      options.onPlacement(position.placement, position);
      lastPosition = signature;
    }
    const wasShown = shown;
    shown = true;
    if (!wasShown)
      options.onVisibilityChange?.(true);
  }

  // Measures each frame, including movements anchor without changing dimensions.
  function tick() {
    update();
    if (!disposed)
      frame = view.requestAnimationFrame(tick);
  }

  // Combines manual measurement queries into a single microtask.
  function forceAlign() {
    const scheduledRevision = ++alignmentRevision;
    Promise.resolve().then(() => {
      if (scheduledRevision === alignmentRevision) update(true);
    });
  }

  // Reads an up-to-date stack at every check, including after callbacks.
  function isTopInteractivePopup() {
    if (!shown || options.interactive === false || anchor.closest('[inert]')) {
      return false;
    }

    const stack = openPopups.get(document);
    const top = stack?.findLast(element => !element.inert);
    return top === popup;
  }

  // Upper available popup handles Escape keys and closures.
  function handleKeydown(event: KeyboardEvent) {
    const dialog = getPopupActiveElement(popup)?.closest('dialog[open]');
    // The nested native dialog gets its keys before containing its popup.
    if (dialog && popup.contains(dialog) && !dialog.contains(anchor)) {
      return;
    }

    const current = isTopInteractivePopup();
    if (current && !event.defaultPrevented && event.key !== 'Escape')
      options.onKeydown?.(event);
    if (isTopInteractivePopup()
      && options.dismissOnEscape !== false
      && event.key === 'Escape'
      && !event.defaultPrevented) {
      event.preventDefault();
      event.stopPropagation();
      options.onDismiss('escape');
    }
  }

  // Considers popup and their Shadow DOM hosts to be part of a single interaction surface.
  function handleOutside(event: MouseEvent | PointerEvent) {
    const target = event.composedPath()[0] ?? event.target;
    const popupRoot = popup.getRootNode();
    const trigger = options.trigger ?? anchor;
    const triggerRoot = trigger.getRootNode();

    if (shown
      && options.interactive !== false
      && !popup.inert
      && !anchor.closest('[inert]')
      && target instanceof Node
      && !popup.contains(target)
      && !('host' in popupRoot && popupRoot.host === target)
      && !trigger.contains(target)
      && !('host' in triggerRoot && triggerRoot.host === target)
      && !options.isRelatedTarget?.(target)) {
      options.onDismiss('outside', target);
    }
  }

  // The default outside is the pointerdown, including touch and pen.
  function handlePointerdown(event: PointerEvent) {
    if (options.outsideEvents !== 'mouse') handleOutside(event);
  }

  // Mode uses mouse events and a context menu.
  function handleMousedown(event: MouseEvent) {
    if (options.outsideEvents === 'mouse') handleOutside(event);
  }

  // Allows the editor to save focus when clicking in popup.
  function preserveFocus(event: PointerEvent) {
    if (typeof options.preserveFocus !== 'function' || options.preserveFocus(event))
      event.preventDefault();
  }

  // While the surface is open, tracks anchor movement without a resize, including slider thumb movement.
  tick();
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('pointerdown', handlePointerdown, true);
  view.addEventListener('mousedown', handleMousedown, true);
  view.addEventListener('contextmenu', handleMousedown, true);
  if (options.preserveFocus !== false)
    popup.addEventListener('pointerdown', preserveFocus);

  return Object.assign(disconnect, { forceAlign, align: update });

  // Removes listeners immediately. With retarget may postpone the release of DOM-surface.
  function disconnect(retainSurface = false) {
    disposed = true;
    view.cancelAnimationFrame(frame);
    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('pointerdown', handlePointerdown, true);
    view.removeEventListener('mousedown', handleMousedown, true);
    view.removeEventListener('contextmenu', handleMousedown, true);
    popup.removeEventListener('pointerdown', preserveFocus);
    // The surface remains open if a new owner has already joined it.
    const release = () => {
      if (popupConnections.get(popup) !== owner) {
        return;
      }
      popupConnections.delete(popup);
      hide();
    };
    // Retargeting within one flush can temporarily unregister the trigger.
    if (retainSurface) {
      queueMicrotask(release);
    }
    else {
      release();
    }
  }
}
