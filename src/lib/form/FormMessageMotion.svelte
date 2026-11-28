<script module lang="ts">
  import type { CssMotionConfig, CssMotionEvent } from '../motion/css-motion.types';

  /** Rows start at zero height and opacity before the connected holder opens. */
  function collapsed() {
    return { height: 0, opacity: 0 };
  }

  /** scrollHeight includes the text even while the row is collapsed. */
  function expanded(node: HTMLDivElement) {
    return { height: node.scrollHeight, opacity: 1 };
  }

  /** The leave starts at the rendered height, including any interrupted entry. */
  function leaving(node: HTMLDivElement) {
    return { height: node.offsetHeight };
  }

  /** A fading row can still be reducing its height. */
  function heightFinished(_node: HTMLDivElement, event: CssMotionEvent) {
    return 'deadline' in event || ('propertyName' in event && event.propertyName === 'height');
  }

  const collapse: CssMotionConfig<HTMLDivElement> = {
    onAppearStart: collapsed,
    onAppearActive: expanded,
    onAppearEnd: heightFinished,
    onEnterStart: collapsed,
    onEnterActive: expanded,
    onEnterEnd: heightFinished,
    onLeaveStart: leaving,
    onLeaveActive: collapsed,
    onLeaveEnd: heightFinished
  };
</script>

<script lang="ts">
  // Applies the connected Form help phases to the actual holder or row without adding a wrapper.
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';
  import { on } from 'svelte/events';
  import { createCssMotion, type CssMotionState } from '../motion/css-motion.dom';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { useDesignTokenContext } from '../theme/theme-context.svelte';

  interface MotionOptions {
    name: string;
    visible: boolean;
    enabled: boolean;
    onFinish: (shown: boolean) => void;
  }

  let {
    kind, prefix, scope, visible, onFinish, id, role, ariaHidden,
    class: className, style, children
  }: {
    kind: 'holder' | 'message';
    prefix: string;
    scope?: string;
    visible: boolean;
    onFinish: (shown: boolean) => void;
    id?: string;
    role?: 'alert' | 'status';
    ariaHidden?: boolean;
    class: ClassValue;
    style?: string;
    children: Snippet;
  } = $props();

  const theme = useDesignTokenContext();
  let motionName = $derived(`${prefix}-show-help${kind === 'message' ? '-item' : ''}`);
  let painted = $state.raw<CssMotionState>({});

  /** The action is destroyed with its element, including when a field changes layout. */
  function connect(node: HTMLDivElement, initial: MotionOptions) {
    const view = node.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    const reduced = view.matchMedia('(prefers-reduced-motion: reduce)');
    const motion = createCssMotion(view, () => node, (state) => { painted = state; });
    const configuration = kind === 'message' ? collapse : undefined;
    let options = initial;

    /** A motion setting update settles the current phase when it disables transitions. */
    function sync() {
      motion.sync({
        present: true,
        visible: options.visible,
        enabled: options.enabled && !reduced.matches,
        settleOnCutoff: true,
        motion: {
          ...configuration,
          motionName: options.name,
          motionDeadline: 500,
          motionLeaveImmediately: !initial.visible,
          onVisibleChanged: options.onFinish
        }
      });
    }

    const disconnect = [
      on(reduced, 'change', sync),
      on(node, 'transitionend', motion.end),
      on(node, 'animationend', motion.end)
    ];
    sync();

    return {
      /** Use the latest classes and callbacks without moving the node. */
      update(next: MotionOptions) {
        options = next;
        sync();
      },
      /** Invalidates frames and callbacks when the field or row is removed. */
      destroy() {
        motion.destroy();
        for (const remove of disconnect) remove();
      }
    };
  }
</script>

<div
  {id}
  {role}
  aria-hidden={ariaHidden || undefined}
  data-ant-form-prefix={scope}
  class={[className, painted.className]}
  style={serializeInlineStyleLayers([style, painted.style])}
  use:connect={{ name: motionName, visible, enabled: theme.state.token.motion, onFinish }}
>{@render children()}</div>
