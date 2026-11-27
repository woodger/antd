// Saves the focus return point when replacing the contents with Skeleton. Neighbors are fixed at
// the time of parking, while the original position in DOM is still available.
import { focusAfterNotice } from '../notice.dom';

// Checks the original neighbors again: they could hide or become inaccessible.
function available(node: HTMLElement): boolean {
  if (!node.isConnected
    || node.matches(':disabled')
    || node.closest('[inert]')
    || !node.getClientRects().length) {
    return false;
  }

  // Rule 2: Candidates come from a browser document mounted by Skeleton.
  const view = node.ownerDocument.defaultView!;
  return view.getComputedStyle(node).visibility === 'visible';
}

// The parking condition belongs to one component of Skeleton.
export function createSkeletonFocus() {
  let parked: HTMLElement | undefined;
  let neighbors: HTMLElement[] = [];
  let removeListener: (() => void) | undefined;

  // Removes the listener and clears the stored position.
  function clear() {
    removeListener?.();
    removeListener = undefined;
    parked = undefined;
    neighbors = [];
  }

  return {
    // Carries the focus to Skeleton only from an element that will be hidden.
    update(host: HTMLElement, content: HTMLElement | undefined, loading: boolean) {
      if (!loading || !content?.contains(host.ownerDocument.activeElement)) {
        return;
      }

      clear();
      host.focus({ preventScroll: true });
      const document = host.ownerDocument;
      if (document.activeElement !== host) {
        return;
      }

      parked = host;
      const dialog = host.closest<HTMLDialogElement>('dialog[open]');
      const scope = dialog ?? document;
      const candidates = [
        ...scope.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, a[href], summary, iframe, [tabindex], [contenteditable="true"]'
        )
      ].filter(
        node => node.tabIndex >= 0 && !host.contains(node)
      );
      // Neighborhood position is also needed after the removal of the DOM node at unmount.
      neighbors = [
        ...candidates.filter(
          node => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
        ...candidates.filter(
          node => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING
        ).reverse(),
        ...(dialog ? [dialog] : [])
      ];
      // Focus outside Skeleton completes parking. Body can result from the removal of the node.
      function handleFocus() {
        if (document.activeElement !== host && document.activeElement !== document.body)
          clear();
      }
      document.addEventListener('focusin', handleFocus);
      // Liberates the listener of the document where the parking began.
      removeListener = () => document.removeEventListener('focusin', handleFocus);
    },
    // Restores navigation on current or saved neighbors at teardown.
    destroy() {
      const host = parked;
      const candidates = neighbors;
      clear();
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
