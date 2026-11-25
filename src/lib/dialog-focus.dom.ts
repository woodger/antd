// Согласует нативную модальность с открытым dialog без нативного барьера. Стек определяет
// владельца Escape и ловушки фокуса. Смена режима сохраняет тот же DOM и исходный opener.
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

/** Находит текущий фокус и внутри ShadowRoot, куда портал может вынести панель. */
function activeElement(document: Document): Element | null {
  let element = document.activeElement;
  while (element?.shadowRoot?.activeElement) {
    element = element.shadowRoot.activeElement;
  }
  return element;
}

/** Сохраняет порядок Tab, включая положительный tabindex, и пропускает скрытые controls. */
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

/** Управляет видимостью dialog, клавиатурой и возвратом фокуса независимо от анимации. */
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

  /** Учитывает последнюю открытую панель и приоритет вышестоящего нативного dialog. */
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

  /** Возвращает фокус после фактического выхода, включая программное focus(). */
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

  /** Оставляет обычный порядок Tab внутри панели и замыкает его на границе. */
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

  /** Даёт вложенному popup обработать Escape на document, затем обращается к верхнему dialog. */
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

  /** Снимает слушатели до закрытия и до смены способа открытия. */
  function stopListening() {
    view.removeEventListener('focusin', keepFocus);
    view.removeEventListener('keydown', handleKeydown);
  }

  /** Обычный open оставляет фокус владельцу; showModal включает нативный барьер. */
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

  /** Запоминает внешний opener только при первом показе, до переброса фокуса. */
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

  /** showModal при смене режима поднимает диалог, сохраняя логический стек фокуса. */
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

  /** Живое изменение mask/focusable переводит тот же открытый dialog в другой режим. */
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

  /** Убирает панель из стека и откладывает возврат к opener до уведомления владельца. */
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

    // Повторное открытие из afterOpenChange(false) владеет следующим фокусом.
    return restore ? () => {
      const top = stack.findLast(node => node.open && node.isConnected);
      if (restore.isConnected && !dialog.open && successor === top) {
        restore.focus({ preventScroll: true });
      }
    } : undefined;
  }

  return { open, sync, close, ownsNativeLayer };
}
