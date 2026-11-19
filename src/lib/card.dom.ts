// Инициализирует флаг наличия сетки и наблюдает изменения состава дочерних узлов.
// Выявляет прямые Card.Grid внутри body для режима раскладки Card. Изменения глубже первого
// уровня не наблюдаются.
export function connectCardGrid(
  body: HTMLElement,
  update: (containsGrid: boolean) => void
): () => void {
  let active = true;
  // Поддерживает как data-маркер, так и исходный класс ant-card-grid.
  const publish = () => {
    if (active) {
      update([...body.children].some(child => child.hasAttribute('data-ant-card-grid')
        || child.classList.contains('ant-card-grid')));
    }
  };
  const Observer = body.ownerDocument.defaultView!.MutationObserver;
  const observer = new Observer(publish);
  observer.observe(body, { childList: true });
  publish();
  // Отключает наблюдение и последующие публикации при уничтожении Card.
  return () => {
    active = false;
    observer.disconnect();
  };
}
