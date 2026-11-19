// Следит за фактическим текстовым содержимым Button для режима autoInsertSpace. Наблюдение
// принадлежит текущему DOM-узлу.
import { buttonTwoCN } from './button.engine';

// Отслеживает текстовые изменения и сразу публикует состояние для первого рендера.
export function connectButtonText(
  content: HTMLElement,
  getEnabled: () => boolean,
  notify: (twoCN: boolean) => void
) {
  let active = true;
  // Проверяет режим вставки пробела, когда содержимое представлено одним значимым дочерним узлом.
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
    // Отключает наблюдение, блокируя публикацию уже поставленных в очередь обновлений.
    destroy() {
      active = false;
      observer.disconnect();
    }
  };
}
