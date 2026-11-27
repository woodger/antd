// Parks the focus on Spin while its contents are locked. The focus revision cancels the delayed
// recovery after a new transition or removal of Spin.
import { tick } from 'svelte';
import { focusAfterNotice } from '../notice/notice.dom';

// For recovery, only the visible and interactive DOM node is selected.
function available(node: HTMLElement | undefined): node is HTMLElement {
  if (!node?.isConnected
    || node.matches(':disabled')
    || node.closest('[inert]')
    || !node.getClientRects().length) {
    return false;
  }

  // Rule 2: Candidates come from mounted Spin and its current browser document.
  const view = node.ownerDocument.defaultView!;
  return view.getComputedStyle(node).visibility === 'visible';
}

// Keeps the original element and the neighbors only while Spin owns the focus.
export function createSpinFocus() {
  let target: HTMLElement | undefined;
  let parked: HTMLElement | undefined;
  let neighbors: HTMLElement[] = [];
  let removeListener: (() => void) | undefined;
  let focusRevision = 0;
  let active = true;

  // Removes the listener before the release of references to the elements of the previous parking.
  function clearTarget() {
    removeListener?.();
    removeListener = undefined;
    target = undefined;
    parked = undefined;
    neighbors = [];
  }

  // Waiting to apply the availability after tick and restores only the former Spin focus.
  function release(host: HTMLElement, content?: HTMLElement) {
    const releaseRevision = ++focusRevision;
    const previous = target;
    void tick().then(() => {
      if (!active || releaseRevision !== focusRevision) {
        return;
      }

      clearTarget();
      if (!available(host) || host.ownerDocument.activeElement !== host) {
        return;
      }

      if (content?.contains(previous ?? null) && available(previous)) {
        previous.focus({ preventScroll: true });
        return;
      }

      const candidates = content?.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, a[href], summary, [tabindex], [contenteditable="true"]'
      );
      const next = candidates && [...candidates].find(node => node.tabIndex >= 0 && available(node));
      if (next) {
        next.focus({ preventScroll: true });
      }
      else {
        focusAfterNotice(host, true);
      }
    });
  }

  return {
    // Parking the focus when blocking the content and memorizes the order of the neighbors in the scope.
    update(host: HTMLElement, content: HTMLElement | undefined, busy: boolean) {
      if (!active) {
        return;
      }

      if (!content || !busy) {
        if (parked)
          release(host, content);
        return;
      }
      focusRevision++;
      const focused = host.ownerDocument.activeElement;
      if (focused instanceof HTMLElement && content.contains(focused)) {
        clearTarget();
        target = focused;
        host.focus({ preventScroll: true });
        parked = host.ownerDocument.activeElement === host ? host : undefined;
        if (!parked) {
          target = undefined;
          return;
        }

        const document = host.ownerDocument;
        const dialog = host.closest<HTMLDialogElement>('dialog[open]');
        const scope = dialog ?? document;
        const candidates = [
          ...scope.querySelectorAll<HTMLElement>(
            'button, input, select, textarea, a[href], summary, iframe, [tabindex], [contenteditable="true"]'
          )
        ].filter(
          (node) => node.tabIndex >= 0 && !host.contains(node)
        );
        // Svelte can remove DOM to cleanup; the order of the neighbors is fixed when parking the focus.
        neighbors = [
          ...candidates.filter(
            (node) => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
          ),
          ...candidates.filter(
            (node) => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING
          ).reverse(),
          ...(dialog ? [dialog] : [])
        ];
        // Voluntary transition of the user cancels the previous parking.
        function handleFocus() {
          if (parked
            && document.activeElement !== parked
            && document.activeElement !== document.body) {
            focusRevision++;
            clearTarget();
          }
        }
        document.addEventListener('focusin', handleFocus);
        // The listener belongs to the document in which the parking was created.
        removeListener = () => document.removeEventListener('focusin', handleFocus);
      }
    },
    // With teardown, he searches for an affordable neighbor only if the previous focus still belongs to Spin.
    destroy() {
      active = false;
      focusRevision++;
      const host = parked;
      const candidates = neighbors;
      clearTarget();
      if (host?.isConnected) {
        focusAfterNotice(host, host.ownerDocument.activeElement === host);
      }
      else if (host && host.ownerDocument.activeElement === host.ownerDocument.body) {
        const next = candidates.find(available);
        next?.focus({ preventScroll: true });
      }
    }
  };
}
