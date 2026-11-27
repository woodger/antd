<script module lang="ts">
  /** The first frame accounts for the icon's space in the button row. */
  function collapsed() {
    return { width: 0, opacity: 0, transform: 'scale(0)' };
  }

  /** scrollWidth is available even when the wrapper starts the transition at zero width. */
  function expanded(node: HTMLSpanElement) {
    const width = node.scrollWidth;
    return { width, opacity: 1, transform: 'scale(1)' };
  }
</script>

<script lang="ts">
  // Keeps the default icon until the leave transition ends. The loading state controls button accessibility.
  import { untrack } from 'svelte';
  import { on } from 'svelte/events';
  import { createCssMotion, type CssMotionState } from '../motion/css-motion.dom';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { useDesignTokenContext } from '../theme/theme-context.svelte';
  import Icon from '../icon/Icon.svelte';

  let { owner, prefixCls, visible, appear, classNames, style }: {
    owner?: HTMLElement;
    prefixCls: string;
    visible: boolean;
    appear: boolean;
    classNames: (string | undefined)[];
    style: string;
  } = $props();

  const theme = useDesignTokenContext();
  // The indicator is visible immediately on Button's first render, including on the server.
  const motionAppear = untrack(() => appear);
  let span = $state<HTMLSpanElement>();
  let retained = $state(false);
  let reduced = $state(false);
  let painted = $state.raw<CssMotionState>({});
  let motion = $state.raw<ReturnType<typeof createCssMotion<HTMLSpanElement>>>();

  $effect(() => {
    const view = owner?.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    const media = view.matchMedia('(prefers-reduced-motion: reduce)');
    reduced = media.matches;
    const detachPreference = on(media, 'change', () => {
      reduced = media.matches;
    });
    const controller = createCssMotion(view, () => span, next => { painted = next; });
    motion = controller;

    return () => {
      detachPreference();
      controller.destroy();
    };
  });

  $effect.pre(() => {
    const controller = motion;
    const showing = visible;
    const enabled = theme.state.token.motion && !reduced;
    const motionName = `${prefixCls}-loading-icon-motion`;
    if (showing || !enabled) {
      retained = showing;
    }

    untrack(() => controller?.sync({
      present: true,
      visible: showing,
      enabled,
      settleWithoutAnimation: true,
      settleOnCutoff: true,
      motion: {
        motionName,
        motionAppear,
        onAppearStart: collapsed,
        onAppearActive: expanded,
        onEnterStart: collapsed,
        onEnterActive: expanded,
        onLeaveStart: expanded,
        onLeaveActive: collapsed,
        onVisibleChanged(open) {
          if (!open) retained = false;
        }
      }
    }));
  });

  /** CSSMotion checks whether the finished transition belongs to the icon wrapper. */
  function end(event: TransitionEvent | AnimationEvent) {
    motion?.end(event);
  }

  /** The old transition can report cancellation after the new one has started. */
  function cancel(event: TransitionEvent | AnimationEvent) {
    const node = span;
    if (node && event.target === node && node.getAnimations().length === 0) {
      end(event);
    }
  }
</script>

{#if visible || retained}
  <span
    bind:this={span}
    class={[`${prefixCls}-icon`, `${prefixCls}-loading-icon`, classNames, painted.className]}
    style={serializeInlineStyleLayers([style, painted.style])}
    ontransitionend={end}
    ontransitioncancel={cancel}
    onanimationend={end}
    {@attach node => on(node, 'animationcancel', cancel)}
  ><Icon name="loading" /></span>
{/if}
