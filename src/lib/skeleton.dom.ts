// Сохраняет точку возврата фокуса при замене содержимого на Skeleton. Соседи
// фиксируются в момент парковки, пока исходная позиция в DOM ещё доступна.
import { focusAfterNotice } from './notice.dom';

// Проверяет исходных соседей заново: они могли скрыться или стать недоступными.
function available(node: HTMLElement): boolean {
  if (!node.isConnected
    || node.matches(':disabled')
    || node.closest('[inert]')
    || !node.getClientRects().length) {
    return false;
  }

  // Правило 2: кандидаты поступают из browser document смонтированного Skeleton.
  const view = node.ownerDocument.defaultView!;
  return view.getComputedStyle(node).visibility === 'visible';
}

// Состояние парковки принадлежит одному компоненту Skeleton.
export function createSkeletonFocus() {
  let parked: HTMLElement | undefined;
  let neighbors: HTMLElement[] = [];
  let removeListener: (() => void) | undefined;

  // Снимает слушатель и очищает сохранённую позицию.
  function clear() {
    removeListener?.();
    removeListener = undefined;
    parked = undefined;
    neighbors = [];
  }

  return {
    // Переносит фокус на Skeleton только с элемента, который будет скрыт.
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
      // Позиция соседей нужна и после удаления DOM-узла при unmount.
      neighbors = [
        ...candidates.filter(
          node => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
        ...candidates.filter(
          node => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING
        ).reverse(),
        ...(dialog ? [dialog] : [])
      ];
      // Фокус вне Skeleton завершает парковку. Body может быть результатом удаления узла.
      function handleFocus() {
        if (document.activeElement !== host && document.activeElement !== document.body)
          clear();
      }
      document.addEventListener('focusin', handleFocus);
      // Освобождает слушатель того document, где началась парковка.
      removeListener = () => document.removeEventListener('focusin', handleFocus);
    },
    // Восстанавливает навигацию по текущим или сохранённым соседям при teardown.
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
