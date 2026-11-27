// Manages one surface Drawer. Phase CSS receives the callback knot separately from the wrapper on
// which the style appears. The full-time movement remains on Web Animations.
import { createCssMotion, type CssMotionState } from '../css-motion.dom';

type AnimatedProperty = 'transform' | 'opacity';

interface NativeMotion {
  animation: Animation;
  node: HTMLDivElement;
  property: AnimatedProperty;
}

/** Connects the timing and cleanup of one surface with its actual DOM. */
export function createDrawerMotion(
  view: Window & typeof globalThis,
  getNode: () => HTMLDivElement | undefined,
  getCssTarget: () => HTMLDivElement | undefined,
  publish: (state: CssMotionState, commit?: boolean) => void
) {
  const css = createCssMotion(view, getCssTarget, publish);
  let native: NativeMotion | undefined;

  /** Removes the effect and considers its pending notification obsolete. */
  function cancelNative() {
    const current = native;
    native = undefined;
    current?.animation.cancel();
  }

  /** The property from semantic style overlaps the effect without changing the completion date. */
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

  /** Starts or interrupts the built-in transition. Only the current effect retains its callback. */
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

  /** Finishes the built-in transition when reduced motion becomes enabled. */
  function finishNative() {
    native?.animation.finish();
  }

  /** Resets the CSS-story when the owner stopped holding the contents. */
  function reset() {
    cancelNative();
    css.sync({ motion: {}, present: false, visible: false, enabled: false, inactive: true });
  }

  /** Destroying the surface invalidates both queues. */
  function destroy() {
    cancelNative();
    css.destroy();
  }

  return { css, animate, cancelNative, syncStyles, finishNative, reset, destroy };
}
