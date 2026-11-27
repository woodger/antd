// Tracks Button's actual text content for autoInsertSpace. Observation belongs to the current DOM
// node.
import { buttonTwoCN } from './button.engine';

// Observes text mutations and publishes the initial state immediately for the first render.
export function connectButtonText(
  content: HTMLElement,
  getEnabled: () => boolean,
  notify: (twoCN: boolean) => void
) {
  let active = true;
  // Checks whether spacing should be inserted when content has a single meaningful child node.
  const refresh = () => {
    if (!active) {
      return;
    }
    const children = [...content.childNodes].filter(
      node => node.nodeType === 1 || node.nodeType === 3 && node.textContent !== ''
    );
    notify(getEnabled() && children.length === 1 && buttonTwoCN(content.textContent ?? ''));
  };
  const observer = new content.ownerDocument.defaultView!.MutationObserver(refresh);
  observer.observe(content, { childList: true, subtree: true, characterData: true });
  refresh();
  return {
    refresh,
    // Disconnects observation and blocks publication of already queued updates.
    destroy() {
      active = false;
      observer.disconnect();
    }
  };
}
