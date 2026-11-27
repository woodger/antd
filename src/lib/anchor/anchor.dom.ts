// Connects the active Anchor link to container scrolling. The scroll listener skips link detection
// during Anchor's own animation.
import { anchorScrollFrame, anchorSection, anchorTargetId } from './anchor.engine';
import type { AnchorContainer, AnchorProps } from './anchor.types';

export interface AnchorRuntimeOptions {
  getContainer: () => AnchorContainer;
  links: readonly { href: string; targetOffset?: number; }[];
  offsetTop?: number;
  targetOffset?: number;
  bounds?: number;
  getCurrentAnchor?: AnchorProps['getCurrentAnchor'];
  onChange?: AnchorProps['onChange'];
}
// Keeps the original href separate from getCurrentAnchor's result and uses the Anchor node's
// window.
export function createAnchorRuntime(root: HTMLElement, notify: (href: string) => void) {
  const view = root.ownerDocument.defaultView!;
  let options: AnchorRuntimeOptions;
  let container: AnchorContainer | undefined;
  let active = true;
  let current: string | null = null;
  let raw: string | null = null;
  let animating = false;
  let frame: number | undefined;
  let generation = 0;
  // Measures the section relative to the scroll container. A hidden element has zero offset.
  function offset(node: HTMLElement, target: AnchorContainer) {
    if (!node.getClientRects().length) {
      return 0;
    }
    const rect = node.getBoundingClientRect();
    if (rect.width
      || rect.height) {
      return rect.top - (target === view
        ? node.ownerDocument.documentElement.clientTop
        : (target as HTMLElement).getBoundingClientRect().top);
    }
    return rect.top;
  }
  // Publishes the displayed link and passes the original href to onChange, honoring forced
  // notification.
  function setCurrent(href: string, force = false) {
    raw = href;
    const next = options.getCurrentAnchor ? options.getCurrentAnchor(href) : href;
    if (!active || (next === current && !force)) {
      return;
    }
    if (next !== current) {
      current = next;
      notify(next);
    }
    options.onChange?.(href);
  }
  // Collects coordinates of existing targets and finds the section at the edge of the active area.
  function handleScroll() {
    if (!active || animating) {
      return;
    }
    const target = options.getContainer();
    if (!target) {
      return;
    }
    const sections = options.links.flatMap(link => {
      const id = anchorTargetId(link.href);
      const node = id ? root.ownerDocument.getElementById(id) : null;
      return node ? [{ ...link, top: offset(node, target) }] : [];
    });
    setCurrent(
      anchorSection(
        sections,
        typeof options.targetOffset === 'number' ? options.targetOffset : options.offsetTop || 0,
        options.bounds
      )
    );
  }
  // Invalidates all frames of the previous animation so the ordinary scroll listener can resume.
  function cancel() {
    generation++;
    if (frame !== undefined)
      view.cancelAnimationFrame(frame);
    frame = undefined;
    animating = false;
  }
  return {
    // Moves the scroll listener to the new container and recomputes the link when the display
    // function changes.
    configure(next: AnchorRuntimeOptions) {
      if (!active) {
        return;
      }
      const previousMapping = options?.getCurrentAnchor;
      options = next;
      const target = options.getContainer();
      if (target !== container) {
        container?.removeEventListener('scroll', handleScroll);
        container = target;
        container?.addEventListener('scroll', handleScroll);
      }
      handleScroll();
      if (options.getCurrentAnchor && previousMapping !== options.getCurrentAnchor)
        setCurrent(raw || '');
    },
    // First notifies link selection. If the target exists, starts an animation using the current
    // offset precedence.
    scrollTo(href: string, targetOffset?: number) {
      if (!active) {
        return;
      }
      const previous = raw;
      setCurrent(href, previous !== href);
      const id = anchorTargetId(href);
      const node = id ? root.ownerDocument.getElementById(id) : null;
      if (!node || !active) {
        return;
      }
      if (animating && previous === href) {
        return;
      }
      cancel();
      const target = options.getContainer();
      if (!target) {
        return;
      }
      const start = target === view ? view.pageYOffset : (target as HTMLElement).scrollTop;
      const to = start + offset(node, target) - (targetOffset
        ?? options.targetOffset
        ?? options.offsetTop
        ?? 0);
      const started = Date.now();
      const ownGeneration = generation;
      animating = true;
      // Updates one frame for the window or element while the animation revision is current.
      const step = () => {
        if (!active || generation !== ownGeneration) {
          return;
        }
        const elapsed = Date.now() - started;
        const top = anchorScrollFrame(elapsed, start, to);
        if (target === view) {
          view.scrollTo(view.pageXOffset, top);
        }
        else {
          (target as HTMLElement).scrollTop = top;
        }
        if (elapsed < 450) {
          frame = view.requestAnimationFrame(step);
        }
        else {
          frame = undefined;
          animating = false;
        }
      };
      frame = view.requestAnimationFrame(step);
    },
    // Blocks further updates before removing the listener and cancelling the frame.
    destroy() {
      active = false;
      cancel();
      container?.removeEventListener('scroll', handleScroll);
      container = undefined;
    }
  };
}
