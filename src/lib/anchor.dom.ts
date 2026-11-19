// Связывает активную ссылку Anchor с прокруткой контейнера. Во время собственной анимации scroll
// listener не определяет ссылку заново.
import { anchorScrollFrame, anchorSection, anchorTargetId } from './anchor.engine';
import type { AnchorContainer, AnchorProps } from './anchor.types';

export interface AnchorRuntimeOptions {
  getContainer: () => AnchorContainer;
  links: readonly { href: string; targetOffset?: number; }[];
  offsetTop?: number;
  targetOffset?: number;
  bounds?: number;
  getCurrentAnchor?: AnchorProps['getCurrentAnchor'];
  onChange?: AnchorProps['onChange'];
}
// Удерживает исходный href отдельно от значения getCurrentAnchor и привязывает работу к окну узла
// Anchor.
export function createAnchorRuntime(root: HTMLElement, notify: (href: string) => void) {
  const view = root.ownerDocument.defaultView!;
  let options: AnchorRuntimeOptions;
  let container: AnchorContainer | undefined;
  let active = true;
  let current: string | null = null;
  let raw: string | null = null;
  let animating = false;
  let frame: number | undefined;
  let generation = 0;
  // Измеряет секцию относительно scroll container. Скрытый элемент даёт нулевой отступ.
  function offset(node: HTMLElement, target: AnchorContainer) {
    if (!node.getClientRects().length) {
      return 0;
    }
    const rect = node.getBoundingClientRect();
    if (rect.width
      || rect.height) {
      return rect.top - (target === view
        ? node.ownerDocument.documentElement.clientTop
        : (target as HTMLElement).getBoundingClientRect().top);
    }
    return rect.top;
  }
  // Публикует отображаемую ссылку и передаёт onChange исходный href с учётом принудительного
  // уведомления.
  function setCurrent(href: string, force = false) {
    raw = href;
    const next = options.getCurrentAnchor ? options.getCurrentAnchor(href) : href;
    if (!active || (next === current && !force)) {
      return;
    }
    if (next !== current) {
      current = next;
      notify(next);
    }
    options.onChange?.(href);
  }
  // Собирает координаты существующих целей и ищет секцию на границе активной области.
  function handleScroll() {
    if (!active || animating) {
      return;
    }
    const target = options.getContainer();
    if (!target) {
      return;
    }
    const sections = options.links.flatMap(link => {
      const id = anchorTargetId(link.href);
      const node = id ? root.ownerDocument.getElementById(id) : null;
      return node ? [{ ...link, top: offset(node, target) }] : [];
    });
    setCurrent(
      anchorSection(
        sections,
        typeof options.targetOffset === 'number' ? options.targetOffset : options.offsetTop || 0,
        options.bounds
      )
    );
  }
  // Инвалидирует все кадры прежней анимации, освобождая состояние для обычного scroll listener.
  function cancel() {
    generation++;
    if (frame !== undefined)
      view.cancelAnimationFrame(frame);
    frame = undefined;
    animating = false;
  }
  return {
    // Переносит scroll listener на новый контейнер и пересчитывает ссылку при изменении функции
    // отображения.
    configure(next: AnchorRuntimeOptions) {
      if (!active) {
        return;
      }
      const previousMapping = options?.getCurrentAnchor;
      options = next;
      const target = options.getContainer();
      if (target !== container) {
        container?.removeEventListener('scroll', handleScroll);
        container = target;
        container?.addEventListener('scroll', handleScroll);
      }
      handleScroll();
      if (options.getCurrentAnchor && previousMapping !== options.getCurrentAnchor)
        setCurrent(raw || '');
    },
    // Вначале уведомляет о выборе ссылки. Для существующей цели начинает анимацию с действующим
    // приоритетом отступов.
    scrollTo(href: string, targetOffset?: number) {
      if (!active) {
        return;
      }
      const previous = raw;
      setCurrent(href, previous !== href);
      const id = anchorTargetId(href);
      const node = id ? root.ownerDocument.getElementById(id) : null;
      if (!node || !active) {
        return;
      }
      if (animating && previous === href) {
        return;
      }
      cancel();
      const target = options.getContainer();
      if (!target) {
        return;
      }
      const start = target === view ? view.pageYOffset : (target as HTMLElement).scrollTop;
      const to = start + offset(node, target) - (targetOffset
        ?? options.targetOffset
        ?? options.offsetTop
        ?? 0);
      const started = Date.now();
      const ownGeneration = generation;
      animating = true;
      // Обновляет один кадр окна или элемента, пока актуальна ревизия этой анимации.
      const step = () => {
        if (!active || generation !== ownGeneration) {
          return;
        }
        const elapsed = Date.now() - started;
        const top = anchorScrollFrame(elapsed, start, to);
        if (target === view) {
          view.scrollTo(view.pageXOffset, top);
        }
        else {
          (target as HTMLElement).scrollTop = top;
        }
        if (elapsed < 450) {
          frame = view.requestAnimationFrame(step);
        }
        else {
          frame = undefined;
          animating = false;
        }
      };
      frame = view.requestAnimationFrame(step);
    },
    // Блокирует дальнейшие обновления перед снятием слушателя и отменой кадра.
    destroy() {
      active = false;
      cancel();
      container?.removeEventListener('scroll', handleScroll);
      container = undefined;
    }
  };
}
