// Управляет фазами появления и ухода панели Tabs. До start hooks коммитит состояния панелей, а
// callbacks устаревших переходов отбрасывает по ревизии.
import { getTabsMotionClassName } from './tabs-motion.engine';
import type { TabsMotionEvent, TabsPaneMotion } from './tabs-motion.types';
import { createCssMotionFrame } from './css-motion-frame.dom';

type MotionStatus = 'appear' | 'enter' | 'leave';
type MotionStep = 'prepare' | 'start' | 'active';

export interface TabsPaneMotionState {
  running: boolean;
  className?: string;
  style?: string;
}

/** CSSMotion phases без React: собственные end events, два RAF и отмена stale prepare/deadline. */
export function createTabsPaneMotion(
  node: HTMLDivElement,
  publish: (state: TabsPaneMotionState, commit?: boolean) => void
) {
  const view = node.ownerDocument.defaultView!;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  const frames = createCssMotionFrame(view);
  let config: TabsPaneMotion | undefined;
  let enabled = true;
  let previous: boolean | undefined;
  let visible = false;
  let seenVisible = false;
  let notified = false;
  let status: MotionStatus | undefined;
  let step: MotionStep | undefined;
  let style: string | undefined;
  let deadline: number | undefined;
  let visibleTimer: number | undefined;
  let revision = 0;
  let active = true;

  // Разрешает callbacks по текущему статусу, читая конфигурацию на момент фазы.
  const handlers = () => {
    const prefix = status === 'appear' ? 'Appear' : status === 'enter' ? 'Enter' : 'Leave';
    return {
      prepare: config?.[`on${prefix}Prepare`],
      start: config?.[`on${prefix}Start`],
      active: config?.[`on${prefix}Active`],
      end: config?.[`on${prefix}End`]
    };
  };
  // Проверяет имя CSSMotion, глобальное разрешение и настройку reduced motion.
  const supported = () => !!config?.motionName && enabled && !reduced.matches;
  // Учитывает флаг текущего appear, enter или leave. По умолчанию фаза разрешена.
  const allowed = () => config?.[status === 'appear' ? 'motionAppear'
    : status === 'enter' ? 'motionEnter' : 'motionLeave'] !== false;

  // Инвалидирует очередь кадров и снимает таймеры завершения и уведомления.
  function cancel() {
    revision++;
    frames.cancel();
    if (deadline !== undefined) view.clearTimeout(deadline);
    if (visibleTimer !== undefined) view.clearTimeout(visibleTimer);
    deadline = undefined;
    visibleTimer = undefined;
  }

  // Публикует классы и стиль фазы с возможностью синхронно закоммитить DOM.
  function update(commit = false) {
    publish(
      {
        running: status !== undefined,
        className: status && step ? getTabsMotionClassName(config?.motionName, status, step) : undefined,
        style
      },
      commit
    );
  }

  // Снимает временные классы и выбирает момент onVisibleChanged по способу завершения.
  function finish(passive = false) {
    cancel();
    status = undefined;
    step = undefined;
    style = undefined;
    update();
    if ((seenVisible || notified) && config?.onVisibleChanged) {
      const current = revision;
      // Вызывает уведомление видимости только для актуального перехода после синхронизации DOM.
      const notify = () => {
        visibleTimer = undefined;
        if (active && current === revision) config?.onVisibleChanged?.(visible);
      };
      // CSS end callbacks завершаются до passive notification; без motion хватит DOM commit.
      if (passive) {
        visibleTimer = view.setTimeout(notify, 0);
      }
      else {
        queueMicrotask(notify);
      }
    }
    notified = true;
  }

  // Откладывает смену фазы до двух RAF и учитывает ревизию контроллера панели.
  function nextFrame(callback: () => void) {
    const current = revision;
    frames.next(() => {
      if (active && current === revision) callback();
    });
  }

  // Принимает события собственной панели и deadline. End callback может оставить переход
  // активным.
  function handleEnd(event: TabsMotionEvent) {
    if (!active || !status || step !== 'active') {
      return;
    }
    if ('target' in event && event.target !== node) {
      return;
    }
    const current = revision;
    const result = handlers().end?.(node, event);
    if (active && current === revision && result !== false) finish(true);
  }

  // Коммитит prepare и start до active. Каждый пользовательский callback может изменить текущую
  // ревизию.
  function start() {
    if (!supported()) {
      finish();
      return;
    }
    update();
    const current = revision;
    // Сначала commit обоих panel slots и notifications без motion, затем layout start hooks.
    queueMicrotask(() => {
      if (!active || current !== revision) {
        return;
      }
      queueMicrotask(() => {
        if (!active || current !== revision) {
          return;
        }
        // React успевает commit prepare даже при пропущенном prepare hook.
        step = 'prepare';
        update(true);
        if (!active || current !== revision) {
          return;
        }
        step = 'start';
        const result = handlers().start?.(node, null);
        if (!active || current !== revision) {
          return;
        }
        style = handlers().prepare
          ? ['transition:none', result].filter(Boolean).join(';') : result || undefined;
        update(true);
        if (!active || current !== revision) {
          return;
        }
        nextFrame(() => {
          step = 'active';
          style = handlers().active?.(node, null) || undefined;
          if (!active || current !== revision) {
            return;
          }
          update();
          if (config?.motionDeadline && config.motionDeadline > 0) {
            deadline = view.setTimeout(() => {
              deadline = undefined;
              if (active && current === revision) handleEnd({ deadline: true });
            }, config.motionDeadline);
          }
        });
      });
    });
  }

  // Завершает движение при включении reduced motion, сохраняя уже ожидающую prepare-фазу.
  function reduce() {
    if (reduced.matches && status && step !== 'prepare') finish();
  }

  node.addEventListener('transitionend', handleEnd);
  node.addEventListener('animationend', handleEnd);
  reduced.addEventListener('change', reduce);

  return {
    // Согласует изменение видимости с конфигурацией. Prepare должен завершиться перед началом фаз
    // движения.
    sync(next: boolean, options: TabsPaneMotion | undefined, motionEnabled: boolean) {
      if (!active) {
        return;
      }
      config = options;
      enabled = motionEnabled;
      seenVisible ||= next;

      if (previous === next) {
        if (status && (!allowed() || !supported() && step !== 'prepare')) {
          finish();
        }
        else if (status) update();
        return;
      }
      const first = previous === undefined;
      previous = next;
      visible = next;
      cancel();
      status = next ? first ? 'appear' : 'enter'
        : !first || config?.motionLeaveImmediately ? 'leave' : undefined;
      step = undefined;
      style = undefined;
      if (!status || !allowed() || !supported() && !handlers().prepare) {
        finish();
        return;
      }
      const prepare = handlers().prepare;
      if (prepare) {
        step = 'prepare';
        update();
        const current = revision;
        queueMicrotask(() => {
          if (!active || current !== revision) {
            return;
          }
          update(true);
          if (!active || current !== revision) {
            return;
          }
          const result = prepare(node);
          if (!active || current !== revision) {
            return;
          }
          nextFrame(() => {
            void Promise.resolve(result).then(() => {
              if (active && current === revision) start();
            });
          });
        });
      }
      else {
        start();
      }
    },
    // Отсоединяет подписки и инвалидирует всю отложенную работу панели.
    destroy() {
      active = false;
      cancel();
      node.removeEventListener('transitionend', handleEnd);
      node.removeEventListener('animationend', handleEnd);
      reduced.removeEventListener('change', reduce);
    }
  };
}
