// Coordinates native modality with an open dialog that has no native barrier. The stack determines
// who handles Escape and traps focus. Switching modes preserves the existing DOM and original
// opener.
import { isPopupFocusWithin } from './popup.dom';

interface DialogFocusOptions {
  native: boolean;
  trap: boolean;
  restoreFocus: boolean;
  autoFocus: boolean;
}

const dialogsByDocument = new WeakMap<Document, HTMLDialogElement[]>();
const nativePresentationOrder = new WeakMap<HTMLDialogElement, number>();
let nextNativePresentation = 0;
const tabbableSelector = [
  'button', 'input', 'select', 'textarea', 'a[href]', 'area[href]', 'summary', 'iframe',
  '[tabindex]', '[contenteditable]', 'audio[controls]', 'video[controls]'
].join(',');

/** Finds the current focus even inside a ShadowRoot that hosts a portaled panel. */
function activeElement(document: Document): Element | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}

/** Preserves Tab order, including positive tabindex values, and skips hidden controls. */
function tabStops(dialog: HTMLDialogElement): HTMLElement[] {
  const view = dialog.ownerDocument.defaultView;
  if (!view) return [];

  const candidates = [...dialog.querySelectorAll<HTMLElement>(tabbableSelector)];
  return candidates.filter(node => {
    const owner = node.closest('dialog');
    return owner === dialog && node.tabIndex >= 0
      && !node.matches(':disabled, input[type="hidden"]')
      && !node.closest('[inert]')
      && node.getClientRects().length > 0
      && view.getComputedStyle(node).visibility === 'visible';
  }).sort((a, b) => {
    const first = a.tabIndex || Infinity;
    const second = b.tabIndex || Infinity;
    return first === second ? 0 : first - second;
  });
}

/** Manages dialog visibility, keyboard input, and focus restoration independently of animation. */
export function connectDialogFocus(
  dialog: HTMLDialogElement,
  getInteraction: () => DialogFocusOptions,
  getInitialFocus?: (controls: HTMLElement[]) => HTMLElement | undefined
) {
  const document = dialog.ownerDocument;
  const documentView = document.defaultView;
  if (!documentView) {
    throw new Error('Dialog requires an active document');
  }
  const view = documentView;

  const stack = dialogsByDocument.get(document) ?? [];
  dialogsByDocument.set(document, stack);
  let native: boolean | undefined;
  let opener: HTMLElement | undefined;
  let lastFocused: HTMLElement | undefined;

  /** Accounts for the last opened panel and the priority of a higher native dialog. */
  function canManage(target: Element | null) {
    if (native !== false || !dialog.open || !dialog.isConnected) {
      return false;
    }
    const topDialog = stack.findLast(node => node.open && node.isConnected);
    if (topDialog !== dialog) {
      return false;
    }

    const targetModal = target?.closest('dialog:modal');
    return !targetModal || targetModal === dialog.closest('dialog:modal');
  }

  /** Restores focus after the dialog actually exits, including programmatic focus(). */
  function keepFocus() {
    const target = activeElement(document);
    if (!getInteraction().trap || !canManage(target)) {
      return;
    }

    if (isPopupFocusWithin(dialog, target)) {
      if (target instanceof view.HTMLElement) lastFocused = target;
      return;
    }

    const targets = tabStops(dialog);
    const previous = lastFocused && targets.includes(lastFocused) ? lastFocused : undefined;
    (previous ?? targets[0] ?? dialog).focus({ preventScroll: true });
  }

  /** Keeps normal Tab order within the panel and wraps it at either end. */
  function moveTab(event: KeyboardEvent, focused: Element | null) {
    const targets = tabStops(dialog);
    const first = targets[0] ?? dialog;
    const last = targets.at(-1) ?? dialog;
    const boundary = event.shiftKey ? first : last;
    const reverseFromRoot = event.shiftKey && focused === dialog;
    if (focused === boundary || reverseFromRoot || !isPopupFocusWithin(dialog, focused)) {
      event.preventDefault();
      const next = event.shiftKey ? last : first;
      next.focus({ preventScroll: true });
    }
  }

  /** Lets nested popups handle Escape on document before notifying the topmost dialog. */
  function handleKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing) return;

    const focused = activeElement(document);
    if (!canManage(focused)) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      dialog.dispatchEvent(new view.Event('cancel', { cancelable: true }));
    }
    else if (event.key === 'Tab' && getInteraction().trap) {
      moveTab(event, focused);
    }
  }

  /** Removes listeners before closing and before switching opening modes. */
  function stopListening() {
    view.removeEventListener('focusin', keepFocus);
    view.removeEventListener('keydown', handleKeydown);
  }

  /** Regular open leaves focus to the owner. showModal enables the native barrier. */
  function present(modal: boolean) {
    native = modal;
    if (modal) {
      nativePresentationOrder.set(dialog, ++nextNativePresentation);
      dialog.showModal();
    }
    else {
      dialog.setAttribute('open', '');
      view.addEventListener('focusin', keepFocus);
      view.addEventListener('keydown', handleKeydown);
    }
  }

  /** Remembers the external opener only on first show, before moving focus. */
  function open() {
    const current = activeElement(document);
    opener = current instanceof view.HTMLElement ? current : undefined;
    stack.push(dialog);
    const interaction = getInteraction();
    present(interaction.native);
    if (!interaction.native && interaction.autoFocus) {
      const target = getInitialFocus?.(tabStops(dialog)) ?? dialog;
      target.focus({ preventScroll: true });
    }
    keepFocus();
  }

  /** showModal raises the dialog when switching modes while preserving the logical focus stack. */
  function ownsNativeLayer() {
    const order = nativePresentationOrder.get(dialog);
    if (order === undefined || !dialog.matches(':modal')) {
      return false;
    }

    return !stack.some(node => {
      const otherOrder = nativePresentationOrder.get(node);
      return otherOrder !== undefined && otherOrder > order && node.isConnected
        && node.matches(':modal');
    });
  }

  /** A live mask or focusable change switches modes on the same open dialog. */
  function sync() {
    if (native === undefined) {
      dialog.close();
      open();
      return;
    }

    const interaction = getInteraction();
    const matchesMode = dialog.matches(':modal') === interaction.native;
    if (native !== interaction.native || !matchesMode) {
      const previous = activeElement(document);
      const preserve = previous instanceof view.HTMLElement
        && (isPopupFocusWithin(dialog, previous) || !interaction.native);
      stopListening();
      dialog.close();
      present(interaction.native);
      if (preserve && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    }
    keepFocus();
  }

  /** Removes the panel from the stack and defers focus restoration to the opener until after notifying the owner. */
  function close() {
    let restore: HTMLElement | undefined;
    if (native !== undefined) {
      const top = stack.findLast(node => node === dialog || node.open && node.isConnected);
      if (top === dialog && getInteraction().restoreFocus
        && opener && !isPopupFocusWithin(dialog, opener)) {
        restore = opener;
      }

      const index = stack.indexOf(dialog);
      if (index !== -1) stack.splice(index, 1);
      stopListening();
      native = undefined;
    }
    opener = undefined;
    lastFocused = undefined;
    if (dialog.open) dialog.close();
    const successor = stack.findLast(node => node.open && node.isConnected);

    // A panel reopened from afterOpenChange(false) owns the next focus target.
    return restore ? () => {
      const top = stack.findLast(node => node.open && node.isConnected);
      if (restore.isConnected && !dialog.open && successor === top) {
        restore.focus({ preventScroll: true });
      }
    } : undefined;
  }

  return { open, sync, close, ownsNativeLayer };
}
