// Синхронизирует DOM Badge с фазами CSSMotion. Ревизия кадра ограничивает работу устаревших
// переходов.
export interface BadgeZoomState {
  rendered: boolean;
  className?: string;
}

/** CSSMotion Badge: no appear, два RAF, собственные end events и deadline 1000 ms. */
export function createBadgeZoom(
  view: Window,
  getElement: () => HTMLElement | undefined,
  publish: (state: BadgeZoomState) => void
) {
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let previous: boolean | undefined;
  let visible = false;
  let rendered = false;
  let status: 'enter' | 'leave' | undefined;
  let step: 'start' | 'active' | 'activated' | undefined;
  let ending = false;
  let frame: number | undefined;
  let deadline: number | undefined;
  let bound: HTMLElement | undefined;
  let revision = 0;
  let alive = true;

  // Публикует наличие узла и классы текущего перехода. После start используются active-классы.
  function update() {
    publish({
      rendered,
      className: status && step
        ? `ant-badge-zoom-${status} ant-badge-zoom-${status}-${step === 'start' ? 'start' : 'active'} ant-badge-zoom`
        : undefined
    });
  }

  // Отменяет запланированный кадр и инвалидирует callbacks очереди перехода.
  function cancelFrame() {
    revision++;
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    frame = undefined;
  }

  // Ожидает два кадра, чтобы разделить смену CSS-классов. В каждом кадре учитывает текущую
  // ревизию.
  function nextFrame(callback: () => void) {
    const current = revision;
    frame = view.requestAnimationFrame(() => {
      if (!alive || current !== revision) {
        return;
      }

      frame = view.requestAnimationFrame(() => {
        frame = undefined;
        if (alive && current === revision) callback();
      });
    });
  }

  // Снимает оба события завершения с ранее привязанного узла.
  function unbind() {
    bound?.removeEventListener('animationend', handleEnd);
    bound?.removeEventListener('transitionend', handleEnd);
    bound = undefined;
  }

  // Сбрасывает переход и передаёт фактическую видимость в состояние рендера.
  function finish() {
    cancelFrame();
    status = undefined;
    step = undefined;
    ending = false;
    rendered = visible;
    update();
  }

  // Обрабатывает события самого Badge. Раннее завершение откладывает удаление узла до нужного
  // кадра.
  function handleEnd(event: Event) {
    if (!alive || !status || !step || step === 'start' || ending
      || event.target !== getElement()) {
      return;
    }

    if (step === 'activated') {
      finish();
      return;
    }

    // CSSMotion удерживает предыдущий render до STEP_ACTIVATED при раннем end.
    cancelFrame();
    ending = true;
    nextFrame(finish);
  }

  // Завершает активный переход при включении reduced motion.
  function reduce() {
    if (reduced.matches && status) finish();
  }

  reduced.addEventListener('change', reduce);

  return {
    // Синхронизирует режим и видимость. Обычный повтор значения не запускает ещё одну анимацию.
    sync(next: boolean, enabled: boolean, normal = true) {
      if (!alive) {
        return;
      }
      visible = next;
      if (!normal) {
        cancelFrame();
        if (deadline !== undefined) view.clearTimeout(deadline);
        deadline = undefined;
        unbind();
        previous = undefined;
        status = undefined;
        step = undefined;
        ending = false;
        rendered = false;
        update();
        return;
      }
      if (previous === next) {
        return;
      }

      const initial = previous === undefined;
      previous = next;
      cancelFrame();
      ending = false;
      if (initial || !enabled || reduced.matches) {
        finish();
        return;
      }

      status = next ? 'enter' : 'leave';
      step = 'start';
      rendered = true;
      update();
      nextFrame(() => {
        step = 'active';
        update();
        const element = getElement();
        if (bound !== element) {
          unbind();
          bound = element;
          bound?.addEventListener('animationend', handleEnd);
          bound?.addEventListener('transitionend', handleEnd);
        }
        if (deadline !== undefined) view.clearTimeout(deadline);
        deadline = view.setTimeout(() => {
          deadline = undefined;
          if (alive && status && !ending && step !== 'start') finish();
        }, 1000);
        nextFrame(() => {
          step = 'activated';
        });
      });
    },
    // Освобождает кадр, deadline, DOM listeners и media listener при уничтожении компонента.
    destroy() {
      alive = false;
      cancelFrame();
      if (deadline !== undefined) view.clearTimeout(deadline);
      unbind();
      reduced.removeEventListener('change', reduce);
    }
  };
}
