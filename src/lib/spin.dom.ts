// Паркует фокус на Spin, пока его содержимое заблокировано. Ревизия фокуса
// отменяет отложенное восстановление после нового перехода или удаления Spin.
import { tick } from 'svelte';
import { focusAfterNotice } from './notice.dom';

// Для восстановления выбирается только видимый и интерактивный DOM-узел.
function available(node: HTMLElement | undefined): node is HTMLElement {
  if (!node?.isConnected
    || node.matches(':disabled')
    || node.closest('[inert]')
    || !node.getClientRects().length) {
    return false;
  }

  // Правило 2: кандидаты поступают из mounted Spin и его текущего browser document.
  const view = node.ownerDocument.defaultView!;
  return view.getComputedStyle(node).visibility === 'visible';
}

// Хранит исходный элемент и соседей только пока Spin владеет фокусом.
export function createSpinFocus() {
  let target: HTMLElement | undefined;
  let parked: HTMLElement | undefined;
  let neighbors: HTMLElement[] = [];
  let removeListener: (() => void) | undefined;
  let focusRevision = 0;
  let active = true;

  // Снимает слушатель до освобождения ссылок на элементы предыдущей парковки.
  function clearTarget() {
    removeListener?.();
    removeListener = undefined;
    target = undefined;
    parked = undefined;
    neighbors = [];
  }

  // Ждёт применения доступности после tick и восстанавливает только прежний фокус Spin.
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
    // Паркует фокус при блокировке содержимого и запоминает порядок соседей в scope.
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
        // Svelte может удалить DOM до cleanup; порядок соседей фиксируется при парковке фокуса.
        neighbors = [
          ...candidates.filter(
            (node) => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING
          ),
          ...candidates.filter(
            (node) => host.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_PRECEDING
          ).reverse(),
          ...(dialog ? [dialog] : [])
        ];
        // Добровольный переход пользователя отменяет прежнюю парковку.
        function handleFocus() {
          if (parked
            && document.activeElement !== parked
            && document.activeElement !== document.body) {
            focusRevision++;
            clearTarget();
          }
        }
        document.addEventListener('focusin', handleFocus);
        // Слушатель принадлежит document, в котором была создана парковка.
        removeListener = () => document.removeEventListener('focusin', handleFocus);
      }
    },
    // При teardown ищет доступного соседа, только если прежний фокус ещё принадлежит Spin.
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
