// Управляет одной поверхностью Drawer. CSS-фазы получают узел callback отдельно от обёртки,
// на которой появляется стиль. Штатное движение остаётся на Web Animations.
import { createCssMotion, type CssMotionState } from './css-motion.dom';

type AnimatedProperty = 'transform' | 'opacity';

interface NativeMotion {
  animation: Animation;
  node: HTMLDivElement;
  property: AnimatedProperty;
}

/** Связывает сроки и cleanup одной поверхности с её фактическим DOM. */
export function createDrawerMotion(
  view: Window & typeof globalThis,
  getNode: () => HTMLDivElement | undefined,
  getCssTarget: () => HTMLDivElement | undefined,
  publish: (state: CssMotionState, commit?: boolean) => void
) {
  const css = createCssMotion(view, getCssTarget, publish);
  let native: NativeMotion | undefined;

  /** Удаляет эффект и считает его ожидающее уведомление устаревшим. */
  function cancelNative() {
    const current = native;
    native = undefined;
    current?.animation.cancel();
  }

  /** Свойство из semantic style перекрывает эффект без изменения срока завершения. */
  function syncStyles() {
    if (!native) {
      return;
    }

    const { animation, node, property } = native;
    const effect = animation.effect;
    if (effect instanceof view.KeyframeEffect) {
      const target = node.style.getPropertyValue(property) ? null : node;
      if (effect.target !== target) effect.target = target;
    }
  }

  /** Запускает или прерывает штатный переход, оставляя callback только у текущего эффекта. */
  function animate(
    property: AnimatedProperty,
    from: string,
    to: string,
    options: KeyframeAnimationOptions | undefined,
    onFinish?: () => void
  ) {
    cancelNative();
    const node = getNode();
    if (!node || !options) {
      return false;
    }

    const animation = node.animate([{ [property]: from }, { [property]: to }], options);
    const current = { animation, node, property };
    native = current;
    syncStyles();

    void animation.finished.then(() => {
      if (native === current) {
        cancelNative();
        onFinish?.();
      }
    }, () => {});
    return true;
  }

  /** Завершает штатный переход при включении reduced motion. */
  function finishNative() {
    native?.animation.finish();
  }

  /** Сбрасывает CSS-историю, когда владелец перестал удерживать содержимое. */
  function reset() {
    cancelNative();
    css.sync({ motion: {}, present: false, visible: false, enabled: false, inactive: true });
  }

  /** Уничтожение поверхности инвалидирует обе очереди. */
  function destroy() {
    cancelNative();
    css.destroy();
  }

  return { css, animate, cancelNative, syncStyles, finishNative, reset, destroy };
}
