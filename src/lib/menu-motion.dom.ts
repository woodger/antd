// Управляет фазами CSSMotion подменю. Каждое переключение инвалидирует ожидающие кадры,
// Promise подготовки, deadline и уведомление предыдущей ревизии.
import { createCssMotionFrame } from './css-motion-frame.dom';
import { getCssMotionClassName, type CssMotionPhase, type CssMotionStep }
  from './css-motion.engine';
import { serializeCssProperties, serializeInlineStyleLayers } from './inline-style.engine';
import type { MenuMotion, MenuMotionEvent, MenuMotionStyle } from './menu-motion.types';

export interface MenuMotionState {
  phase?: CssMotionPhase;
  step?: CssMotionStep;
  className?: string;
  style?: string;
}

export interface MenuMotionInput {
  motion: MenuMotion;
  present: boolean;
  visible: boolean;
  enabled: boolean;
  inactive?: boolean;
  initialVisibility?: boolean;
  forced?: boolean;
  settleWithoutAnimation?: boolean;
}

/** Объект в Source использует те же единицы, что и inline style option. */
export function getMenuMotionStyle(value: MenuMotionStyle | void) {
  if (typeof value === 'string') {
    return value;
  }

  return value ? serializeCssProperties(value) : undefined;
}

/** Фазы по rc-motion 1.3.3. MIT, vendor/LICENSE.rc-motion. */
export function createMenuMotion(
  view: Window,
  getElement: () => HTMLElement | undefined,
  publish: (state: MenuMotionState, commit?: boolean) => void
) {
  const frames = createCssMotionFrame(view);
  let active = true;
  let revision = 0;
  let previous: boolean | undefined;
  let initialized = false;
  let input: MenuMotionInput;
  let phase: CssMotionPhase | undefined;
  let step: CssMotionStep | undefined;
  let style: string | undefined;
  let deadline: number | undefined;
  let painted: MenuMotionState = {};

  // Сохраняет обработчики отдельно для каждой фазы, читая текущую конфигурацию перед вызовом.
  function handlers(phase: CssMotionPhase) {
    const key = phase === 'appear' ? 'Appear' : phase === 'enter' ? 'Enter' : 'Leave';
    return {
      prepare: input.motion[`on${key}Prepare`],
      start: input.motion[`on${key}Start`],
      active: input.motion[`on${key}Active`],
      end: input.motion[`on${key}End`]
    };
  }

  // Удаляет ожидающую работу без уведомления: callback предыдущей фазы уже устарел.
  function cancel() {
    revision++;
    frames.cancel();
    if (deadline !== undefined) {
      view.clearTimeout(deadline);
      deadline = undefined;
    }
  }

  // Коммит синхронен только перед пользовательскими измерениями из browser callback.
  function paint(commit = false) {
    const className = phase && step
      ? getCssMotionClassName(input.motion.motionName, phase, step) : undefined;
    if (!commit && painted.phase === phase && painted.step === step
      && painted.className === className && painted.style === style) {
      return;
    }

    painted = { phase, step, className, style };
    publish(painted, commit);
  }

  // Снимает классы до уведомления о конечной видимости.
  function finish(notify: boolean) {
    cancel();
    phase = undefined;
    step = undefined;
    style = undefined;
    if (!input.present && !input.visible) previous = undefined;
    paint();

    if (notify) {
      const current = revision;
      queueMicrotask(() => {
        if (active && current === revision) input.motion.onVisibleChanged?.(input.visible);
      });
    }
  }

  // Отбрасывает анимации потомков и учитывает возможность отложить завершение.
  function end(event: MenuMotionEvent) {
    if (!active || !phase || step !== 'active') {
      return;
    }
    const element = getElement();
    if ('target' in event && event.target !== element) {
      return;
    }

    const current = revision;
    const result = element && handlers(phase).end?.(element, event);
    if (active && revision === current && result !== false) finish(true);
  }

  // Измеряет кадр start перед применением конечного стиля и подключает deadline.
  function enterActive(current: number) {
    if (!active || current !== revision || !phase) {
      return;
    }
    const element = getElement();
    const result = element && handlers(phase).active?.(element, null);
    if (!active || current !== revision) {
      return;
    }

    step = 'active';
    style = getMenuMotionStyle(result);
    paint();

    const timeout = input.motion.motionDeadline;
    if (timeout && timeout > 0) {
      deadline = view.setTimeout(() => {
        deadline = undefined;
        if (current === revision) end({ deadline: true });
      }, timeout);
    }
    if (input.settleWithoutAnimation) {
      frames.next(() => {
        if (active && current === revision && !getElement()?.getAnimations().length) {
          finish(true);
        }
      });
    }
  }

  // Сохраняет предыдущие классы до вызова start hook и открывает переход после двух кадров.
  function enterStart(current: number, prepared: boolean) {
    if (!active || current !== revision || !phase) {
      return;
    }
    const element = getElement();
    const result = element && handlers(phase).start?.(element, null);
    if (!active || current !== revision) {
      return;
    }

    step = 'start';
    style = serializeInlineStyleLayers([
      prepared ? 'transition:none' : undefined, getMenuMotionStyle(result)
    ]);
    paint();
    frames.next(() => enterActive(current));
  }

  // Prepare остаётся доступен при выключенном движении и может вернуть Promise измерения.
  function prepare(current: number) {
    if (!active || current !== revision || !phase) {
      return;
    }
    const callback = handlers(phase).prepare;
    if (!callback) {
      enterStart(current, false);
      return;
    }

    paint(true);
    if (!active || current !== revision) {
      return;
    }
    const element = getElement();
    const pending = element && callback(element);
    if (!active || current !== revision) {
      return;
    }

    frames.next(() => {
      void Promise.resolve(pending).then(() => {
        if (!active || current !== revision) {
          return;
        }
        if (input.enabled && input.motion.motionName) enterStart(current, true);
        else finish(true);
      });
    });
  }

  // Выбирает appear/enter/leave по присутствию Motion до изменения видимости.
  function sync(next: MenuMotionInput) {
    if (!active) {
      return;
    }
    const initial = !initialized;
    const wasEnabled = input?.enabled && Boolean(input.motion.motionName);
    initialized = true;
    input = next;
    if (initial && next.initialVisibility !== undefined) {
      previous = next.initialVisibility;
    }
    if (next.inactive) {
      previous = undefined;
      finish(false);
      return;
    }
    if (!next.present && !next.visible && previous !== true && !phase) {
      previous = undefined;
      return;
    }
    const enabled = next.enabled && Boolean(next.motion.motionName);
    if (previous === next.visible) {
      if (phase && (wasEnabled && !enabled || !allows(phase))) finish(false);
      else if (phase) paint();
      return;
    }

    const before = previous;
    previous = next.visible;
    cancel();
    phase = next.visible ? before === undefined && !next.forced ? 'appear' : 'enter'
      : before === true || next.motion.motionLeaveImmediately ? 'leave' : undefined;
    step = undefined;
    style = undefined;

    if (!phase || !allows(phase) || !enabled && !handlers(phase).prepare) {
      finish(before !== undefined || next.visible);
      return;
    }

    step = handlers(phase).prepare ? 'prepare' : undefined;
    paint();
    const current = revision;
    queueMicrotask(() => prepare(current));
  }

  // Каждый флаг разрешает свою фазу. Отсутствующее поле следует CSSMotion defaults.
  function allows(phase: CssMotionPhase) {
    const key = phase === 'appear' ? 'motionAppear' : phase === 'enter' ? 'motionEnter'
      : 'motionLeave';
    return input.motion[key] !== false;
  }

  return {
    sync,
    end,
    // Уничтожение владельца исключает поздние DOM-измерения и callbacks.
    destroy() {
      active = false;
      cancel();
    }
  };
}
