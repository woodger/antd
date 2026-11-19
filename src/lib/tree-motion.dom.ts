// Управляет CSSMotion группы Tree. DOM, callbacks и состояние видимости используют одну ревизию
// текущего перехода.
// CSSMotion @rc-component/motion 1.3.3; MIT, vendor/LICENSE.rc-motion.
import { getTreeMotionClassName } from './tree-motion.engine';
import type { TreeMotionConfig, TreeMotionEvent } from './tree-motion.types';

type Status = 'appear' | 'enter' | 'leave';
type Step = 'prepare' | 'start' | 'active';
export interface TreeGroupMotionState {
  running: boolean;
  className?: string;
  style?: string;
}

/** DOM phases группы с отменой RAF, prepare Promise, deadline и поздних end events. */
export function createTreeGroupMotion(
  node: HTMLDivElement,
  publish: (state: TreeGroupMotionState, commit?: boolean) => void,
  onVisible: (visible: boolean) => void,
  previous?: boolean
) {
  const view = node.ownerDocument.defaultView!;
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
  let config: TreeMotionConfig = {};
  let enabled = true;
  let visible = false;
  let seen = false;
  let status: Status | undefined;
  let step: Step | undefined;
  let style: string | undefined;
  let frame: number | undefined;
  let deadline: number | undefined;
  let notification: number | undefined;
  let revision = 0;
  let active = true;

  // Проверяет наличие класса motion и разрешение движения для текущей группы.
  const supported = () => !!config.motionName && enabled && !reduced.matches;
  // Читает флаг выбранной фазы. Неявный флаг сохраняет возможность анимации.
  const allowed = () => config[status === 'appear' ? 'motionAppear'
    : status === 'enter' ? 'motionEnter' : 'motionLeave'] !== false;
  // Собирает callbacks текущего статуса из последней конфигурации дерева.
  const handlers = () => {
    const prefix = status === 'appear' ? 'Appear' : status === 'enter' ? 'Enter' : 'Leave';
    return {
      prepare: config[`on${prefix}Prepare`], start: config[`on${prefix}Start`],
      active: config[`on${prefix}Active`], end: config[`on${prefix}End`]
    };
  };
  // Инвалидирует callbacks предыдущего перехода и снимает его кадр и таймеры.
  function cancel() {
    revision++;
    if (frame !== undefined) view.cancelAnimationFrame(frame);
    if (deadline !== undefined) view.clearTimeout(deadline);
    if (notification !== undefined) view.clearTimeout(notification);
    frame = deadline = notification = undefined;
  }
  // Публикует классы, inline style и running для текущей группы. Commit доступен перед layout
  // hooks.
  function update(commit = false) {
    publish({ running: status !== undefined,
      className: status && step ? getTreeMotionClassName(config.motionName, status, step) : undefined,
      style }, commit);
  }
  // Очищает состояние фазы и публикует видимость после обновления DOM.
  function finish(passive = false) {
    cancel();
    status = step = undefined;
    style = undefined;
    update();
    if (seen || visible) {
      const current = revision;
      // Сообщает о видимости, только если завершённый переход остаётся актуальным.
      const notify = () => {
        notification = undefined;
        if (active && current === revision) onVisible(visible);
      };
      if (passive) {
        notification = view.setTimeout(notify, 0);
      }
      else {
        queueMicrotask(notify);
      }
    }
    seen = true;
  }
  // Даёт DOM два кадра для смены CSS-перехода с проверкой текущей ревизии.
  function nextFrame(callback: () => void) {
    const current = revision;
    frame = view.requestAnimationFrame(() => {
      if (!active || current !== revision) {
        return;
      }
      frame = view.requestAnimationFrame(() => {
        frame = undefined;
        if (active && current === revision) callback();
      });
    });
  }
  // Фильтрует события потомков и даёт end hook право оставить переход активным.
  function end(event: TreeMotionEvent) {
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
  // Планирует commit prepare и start, затем активирует motion и его deadline.
  function start() {
    if (!supported()) {
      finish();
      return;
    }
    update();
    const current = revision;
    queueMicrotask(() => {
      if (!active || current !== revision) {
        return;
      }
      queueMicrotask(() => {
        if (!active || current !== revision) {
          return;
        }
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
        style = handlers().prepare ? ['transition:none', result].filter(Boolean).join(';')
          : result || undefined;
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
          if (config.motionDeadline && config.motionDeadline > 0) {
            deadline = view.setTimeout(() => {
              deadline = undefined;
              if (active && current === revision) end({ deadline: true });
            }, config.motionDeadline);
          }
        });
      });
    });
  }
  // При включении reduced motion завершает начатый переход, если prepare уже пройден.
  function reduce() {
    if (reduced.matches && status && step !== 'prepare') finish();
  }
  node.addEventListener('transitionend', end);
  node.addEventListener('animationend', end);
  reduced.addEventListener('change', reduce);
  return {
    // Обновляет конфигурацию группы и запускает обработку новой видимости. Prepare Promise связан
    // с ревизией.
    sync(next: boolean, options: TreeMotionConfig, motionEnabled: boolean) {
      if (!active) {
        return;
      }
      config = options;
      enabled = motionEnabled;
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
      seen ||= next || !first;
      cancel();
      status = next ? first ? 'appear' : 'enter'
        : !first || config.motionLeaveImmediately ? 'leave' : undefined;
      step = undefined;
      style = undefined;
      if (!status || !allowed() || !supported() && !handlers().prepare) {
        finish();
        return;
      }
      const prepare = handlers().prepare;
      if (!prepare) {
        start();
      }
      else {
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
    },
    // Снимает собственные end и media listeners и отменяет все ожидающие кадры и таймеры.
    destroy() {
      active = false;
      cancel();
      node.removeEventListener('transitionend', end);
      node.removeEventListener('animationend', end);
      reduced.removeEventListener('change', reduce);
    }
  };
}
