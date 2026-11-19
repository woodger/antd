// Подстраивает масштаб текста Avatar под размеры контейнера. Измерение привязано к окну и
// lifecycle текущих DOM-узлов.
import { getAvatarScale } from './avatar.engine';

// Подписывается на изменения размеров текста и контейнера и задаёт начальный масштаб синхронно.
export function connectAvatarText(host: HTMLElement, text: HTMLElement, gap: number) {
  let active = true;
  // Обновляет transform только пока подключение активно.
  const measure = () => {
    if (active)
      text.style.transform = `scale(${getAvatarScale(text.offsetWidth, host.offsetWidth, gap)})`;
  };
  const resize = new host.ownerDocument.defaultView!.ResizeObserver(measure);
  resize.observe(host);
  resize.observe(text);
  measure();
  // Отключает наблюдение и снимает transform, которым управляло это подключение.
  return () => {
    active = false;
    resize.disconnect();
    text.style.removeProperty('transform');
  };
}
