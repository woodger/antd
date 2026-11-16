export interface TreeSelectMotionFrameState {
  revision: number;
  status?: 'appear' | 'enter' | 'leave';
  step?: 'prepare' | 'start' | 'active' | 'activated';
}

export interface TreeSelectMotionTransitionEnd {
  revision: number;
  propertyName: string;
  elapsedTime: number;
}

const properties = [
  'left', 'top', 'right', 'bottom', 'position',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'transform', 'transform-origin', 'translate', 'rotate', 'scale',
  'offset-path', 'offset-distance', 'offset-position', 'offset-anchor', 'offset-rotate'
];
const transitionProperties = [
  'transition-property', 'transition-duration', 'transition-delay',
  'transition-timing-function', 'transition-behavior'
];

interface SourceStyle {
  values: Record<string, string>;
  transition: Record<string, string>;
}
interface Stage {
  id: number;
  style: SourceStyle;
  time: number;
  previous: Record<string, number>;
}
interface History {
  base: SourceStyle;
  stages: Stage[];
}
interface TransitionClock {
  animation: Animation;
  property: string;
  duration: number;
  phase: 'before' | 'active' | 'after';
}
const frames = new WeakMap<HTMLElement, ReturnType<typeof createMotionFrame>>();

/** A comma in a timing function is not a CSS-list separator. */
function list(value: string) {
  const result: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index++) {
    const character = value[index];
    if (character === '(') depth++;
    else if (character === ')') depth--;
    else if (character === ',' && !depth) {
      result.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  result.push(value.slice(start).trim());
  return result;
}

/** Keep projection writes out of real CSS transitions; other properties retain native clocks/events. */
function nativeTransitions(
  style: SourceStyle, declaration: CSSStyleDeclaration, excluded?: ReadonlySet<string>
) {
  const source = list(style.transition['transition-property']);
  const timing = transitionProperties.slice(1).map(name => list(style.transition[name]));
  const names: string[] = [];
  const values = timing.map(() => [] as string[]);
  const projected = (name: string) => excluded ? excluded.has(name) : properties.includes(name)
    || name === 'margin' || name.startsWith('margin-') || name === 'inset'
    || name.startsWith('inset-') || name === '-webkit-transform';
  source.forEach((property, index) => {
    const candidates = property === 'all' ? Array.from(declaration) : [property];
    for (const name of candidates) {
      if (name === 'none' || projected(name) || name.startsWith('transition-')
        || name.startsWith('animation-')) continue;
      names.push(name);
      timing.forEach((items, part) => values[part].push(items[index % items.length]));
    }
  });
  return transitionProperties.map((name, index) => {
    const value = index ? values[index - 1].join(',') : names.join(',') || 'none';
    return `${name}:${value || (index === 3 ? 'ease' : index === 4 ? 'normal' : '0s')}!important`;
  }).join(';');
}

/**
 * Recreate a Source CSS frame synchronously, then retain only style snapshots and timeline times.
 * Replaying actual CSSTransitions lets the browser preserve delay, easing and reversal shortening.
 */
function createMotionFrame(popup: HTMLElement) {
  const document = popup.ownerDocument;
  const view = document.defaultView!;
  let getState: (() => TreeSelectMotionFrameState | undefined) | undefined;
  let onTransitionEnd: ((detail: TreeSelectMotionTransitionEnd) => void) | undefined;
  let leases = 0;
  let release = 0;
  let history: History | undefined;
  let latest: SourceStyle | undefined;
  let progressing = false;
  let active = true;
  let sequence = 0;
  let animationTargets: { key: string; values: Record<string, string> } | undefined;
  const clocks = new Map<string, TransitionClock>();
  const notified = new Set<string>();
  const now = () => Number(document.timeline.currentTime ?? view.performance.now());
  const isTransition = (animation: Animation): animation is CSSTransition =>
    animation instanceof view.CSSTransition;

  function complete(key: string, clock: TransitionClock) {
    const state = getState?.();
    if (!active || clocks.get(key) !== clock || !state?.status
      || state.step !== 'active' && state.step !== 'activated'
      || clock.animation.playState === 'idle') return;
    const token = `${state.revision}:${key}`;
    if (notified.has(token)) return;
    notified.add(token);
    const detail = {
      revision: state.revision,
      propertyName: clock.property,
      elapsedTime: clock.phase === 'before' ? 0 : clock.duration / 1000
    };
    Promise.resolve().then(() => {
      if (active && getState?.()?.revision === detail.revision) onTransitionEnd?.(detail);
    });
  }

  function phase(animation: Animation): TransitionClock['phase'] {
    const timing = animation.effect?.getComputedTiming();
    const delay = timing?.delay ?? 0;
    const end = timing?.endTime;
    const time = Number(animation.currentTime);
    const reverse = animation.playbackRate < 0;
    if (time < delay || time === delay && reverse) return 'before';
    return typeof end === 'number' && (time > end || time === end && !reverse)
      ? 'after' : 'active';
  }

  function inspect(key: string, clock: TransitionClock) {
    if (clock.animation.playState === 'idle') return;
    const previous = clock.phase;
    clock.phase = phase(clock.animation);
    if (clock.phase !== previous && clock.phase !== 'active') complete(key, clock);
  }

  function sample(proxy: HTMLElement, capture = true) {
    const declarations = new Map([...properties, ...transitionProperties].map(name => [name, {
      value: proxy.style.getPropertyValue(name), priority: proxy.style.getPropertyPriority(name)
    }]));
    const original = view.getComputedStyle(proxy);
    const transition = Object.fromEntries(transitionProperties.map(name => [
      name, original.getPropertyValue(name)
    ]));
    const animations = popup.getAnimations().filter(animation => animation instanceof view.CSSAnimation
      && animation.effect instanceof view.KeyframeEffect && animation.effect.target === popup
      && !animation.effect.pseudoElement);
    const animated = new Set(animations.flatMap(animation =>
      (animation.effect as KeyframeEffect).getKeyframes().flatMap(frame => Object.keys(frame)
        .map(name => name.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`)))));
    // New proxy CSS animations have new clocks. Sample the original element's effects instead.
    proxy.style.setProperty('animation-name', 'none', 'important');
    proxy.style.setProperty('transition-property', 'none', 'important');
    const underlying = view.getComputedStyle(proxy);
    const typed = proxy.computedStyleMap?.();
    const style: SourceStyle = {
      // Typed OM preserves transform operations (rotate(270deg), percentages, etc.). A matrix
      // serialization would change CSS interpolation to a shortest-path matrix decomposition.
      values: Object.fromEntries(properties.map(name => [name,
        typed?.get(name)?.toString() ?? underlying.getPropertyValue(name)])),
      transition
    };
    const mirrors: Animation[] = [];
    for (const animation of animations) {
      if (!(animation.effect instanceof view.KeyframeEffect)) continue;
      const effect = new view.KeyframeEffect(proxy,
        animation.effect.getKeyframes(), animation.effect.getTiming());
      effect.composite = animation.effect.composite;
      const mirror = new view.Animation(effect, animation.timeline ?? document.timeline);
      mirror.pause();
      mirror.currentTime = animation.currentTime;
      mirrors.push(mirror);
    }
    const animationKey = JSON.stringify([style, popup.className, animations.map(animation => [
      (animation as CSSAnimation).animationName,
      animation.effect instanceof view.KeyframeEffect ? animation.effect.getKeyframes() : [],
      animation.effect?.getTiming()
    ])]);
    if (!animationTargets || animationTargets.key !== animationKey) {
      const observed = proxy.computedStyleMap?.();
      const computed = view.getComputedStyle(proxy);
      const target = { key: animationKey, values: Object.fromEntries(properties
        .filter(name => animated.has(name)).map(name => [name,
          observed?.get(name)?.toString() ?? computed.getPropertyValue(name)])) };
      if (capture) animationTargets = target;
      Object.assign(style.values, target.values);
    } else Object.assign(style.values, animationTargets.values);
    const nativeStyle = nativeTransitions(style, underlying);
    const time = now();
    if (capture) {
      if (!history) history = { base: style, stages: [] };
      else if (JSON.stringify(latest) !== JSON.stringify(style)) {
        history.stages.push({ id: ++sequence, style, time,
          previous: Object.fromEntries([...clocks].map(([key, clock]) => {
            const end = clock.animation.effect?.getComputedTiming().endTime;
            return [key, clock.animation.playState === 'idle' && typeof end === 'number'
              ? end : Number(clock.animation.currentTime)];
          })) });
      }
      latest = style;
    }
    const current = history ?? { base: style, stages: [] };
    const origins = new Map<Animation, Stage>();
    let transitions: CSSTransition[] = [];

    function write(snapshot: SourceStyle, enabled: boolean) {
      for (const property of properties)
        proxy.style.setProperty(property, snapshot.values[property], 'important');
      for (const property of transitionProperties) {
        const value = !enabled && property === 'transition-property'
          ? 'none' : snapshot.transition[property];
        proxy.style.setProperty(property, value, 'important');
      }
      void proxy.offsetWidth;
    }

    write(current.base, false);
    for (const [index, stage] of current.stages.entries()) {
      write(stage.style, true);
      transitions = proxy.getAnimations().filter(isTransition);
      const next = current.stages[index + 1];
      for (const animation of transitions) {
        let origin = origins.get(animation);
        if (!origin) {
          origin = stage;
          origins.set(animation, origin);
        }
        const key = `${origin.id}:${animation.transitionProperty}`;
        const clock = clocks.get(key)?.animation;
        const end = animation.effect?.getComputedTiming().endTime;
        const elapsed = next ? next.previous[key] ?? next.time - origin.time
          : clock ? clock.playState === 'idle' && typeof end === 'number'
            ? end : Number(clock.currentTime) : time - origin.time;
        animation.pause();
        animation.currentTime = elapsed;
      }
      // The next style change must observe this sampled value, including the reversing start value.
      void proxy.offsetWidth;
    }

    const retained = new Set<string>();
    for (const transition of transitions) {
      const origin = origins.get(transition)!;
      const key = `${origin.id}:${transition.transitionProperty}`;
      retained.add(key);
      if (clocks.has(key) || !(transition.effect instanceof view.KeyframeEffect)) continue;
      const timing = transition.effect.getTiming();
      const effect = new view.KeyframeEffect(popup, transition.effect.getKeyframes(), timing);
      const animation = new view.Animation(effect, document.timeline);
      const clock: TransitionClock = {
        animation,
        property: transition.transitionProperty,
        duration: typeof timing.duration === 'number' ? timing.duration : 0,
        phase: 'active'
      };
      clocks.set(key, clock);
      // This lower-priority effect exposes a real public WAAPI clock. The projected !important
      // frame paints the element; no CSS transition object or DOM end event is fabricated.
      animation.startTime = origin.time;
      clock.phase = phase(animation);
      animation.onfinish = () => inspect(key, clock);
    }
    if (capture) for (const [key, clock] of clocks) {
      if (retained.has(key)) continue;
      clock.animation.onfinish = null;
      clock.animation.cancel();
      clocks.delete(key);
    }

    const transitioned = new Set(transitions.map(animation => animation.transitionProperty));
    const restore = new Set(properties.filter(name => animated.has(name) && !transitioned.has(name)));
    const parser = document.createElement('span').style;
    parser.cssText = nativeTransitions(style, view.getComputedStyle(proxy), restore);
    for (const name of transitionProperties)
      proxy.style.setProperty(name, parser.getPropertyValue(name), 'important');
    void proxy.offsetWidth;
    for (const [property, value] of declarations) {
      // Restoring an equivalent transform function can retarget a CSSTransition. With a negative
      // delay this would advance the sampled value twice. Only CSS-animation properties need
      // their original cascade back; transitions keep the reconstructed target declarations.
      if (!restore.has(property)) continue;
      if (value.value) proxy.style.setProperty(property, value.value, value.priority);
      else proxy.style.removeProperty(property);
    }
    void proxy.offsetWidth;
    for (const name of transitionProperties) {
      const value = declarations.get(name)!;
      if (value.value) proxy.style.setProperty(name, value.value, value.priority);
      else proxy.style.removeProperty(name);
    }

    progressing = transitions.some(animation => {
      const end = animation.effect?.getComputedTiming().endTime;
      return typeof end === 'number' && Number(animation.currentTime) < end;
    });
    if (capture) for (const [key, clock] of clocks) inspect(key, clock);
    if (capture && !transitions.length) history = { base: style, stages: [] };

    return {
      style: nativeStyle,
      destroy() {
        for (const animation of mirrors) animation.cancel();
        for (const animation of proxy.getAnimations()) animation.cancel();
      }
    };
  }

  return {
    sample,
    signature() {
      const state = getState?.();
      const animations = popup.getAnimations().filter(animation => animation instanceof view.CSSAnimation)
        .map(animation => `${animation.id}:${animation.currentTime}:${animation.playState}:${
          animation.effect instanceof view.KeyframeEffect
            ? JSON.stringify(animation.effect.getKeyframes()) : ''}`);
      const transitions = [...clocks.values()]
        .map(clock => `${clock.animation.currentTime}:${clock.animation.playState}`);
      return `${state?.revision}:${state?.status}:${state?.step}:${state?.status || progressing ? now() : ''}:${animations.join('|')}:${transitions.join('|')}`;
    },
    retain(
      state: (() => TreeSelectMotionFrameState | undefined) | undefined,
      end: ((detail: TreeSelectMotionTransitionEnd) => void) | undefined
    ) {
      getState = state;
      onTransitionEnd = end;
      leases++;
      release++;
      active = true;
    },
    release() {
      if (--leases) return;
      active = false;
      const current = ++release;
      // Registering a replacement root recreates the alignment connection for the same popup.
      // A same-commit handoff retains its real clocks and Source transition history.
      Promise.resolve().then(() => {
        if (leases || current !== release) return;
        history = undefined;
        latest = undefined;
        animationTargets = undefined;
        progressing = false;
        notified.clear();
        for (const clock of clocks.values()) {
          clock.animation.onfinish = null;
          clock.animation.cancel();
        }
        clocks.clear();
        frames.delete(popup);
      });
    }
  };
}

export function createTreeSelectMotionFrame(
  popup: HTMLElement,
  getState?: () => TreeSelectMotionFrameState | undefined,
  onTransitionEnd?: (detail: TreeSelectMotionTransitionEnd) => void
) {
  let frame = frames.get(popup);
  if (!frame) {
    frame = createMotionFrame(popup);
    frames.set(popup, frame);
  }
  frame.retain(getState, onTransitionEnd);
  let released = false;
  return {
    sample: frame.sample,
    signature: frame.signature,
    destroy() {
      if (released) return;
      released = true;
      frame.release();
    }
  };
}
