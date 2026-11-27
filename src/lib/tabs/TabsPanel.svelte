<script lang="ts">
  import { flushSync, untrack, type Snippet } from 'svelte';
  import { createTabsPaneMotion, type TabsPaneMotionState } from './tabs-motion.dom';
  import type { TabsPaneMotion } from './tabs-motion.types';

  let {
    prefixCls = 'ant-tabs',
    id,
    labelledBy,
    itemKey,
    active,
    children,
    forceRender = false,
    destroyOnHidden = false,
    class: className,
    style,
    motion,
    motionEnabled = true
  }: {
    prefixCls?: string;
    id: string;
    labelledBy: string;
    itemKey: string;
    active: boolean;
    children?: Snippet;
    forceRender?: boolean;
    destroyOnHidden?: boolean;
    class?: string;
    style?: string;
    motion?: TabsPaneMotion;
    motionEnabled?: boolean;
  } = $props();
  let root = $state<HTMLDivElement>();
  let runtime = $state<ReturnType<typeof createTabsPaneMotion>>();
  let motionState = $state<TabsPaneMotionState>({ running: false });
  let mounted = $state(false);
  let wasVisible = $state(false);
  let visible = $derived(motion && Object.hasOwn(motion, 'visible')
    ? motion.visible ?? true : active);
  let force = $derived(motion && Object.hasOwn(motion, 'forceRender')
    ? !!motion.forceRender : forceRender);
  let remove = $derived(motion && Object.hasOwn(motion, 'removeOnLeave')
    ? motion.removeOnLeave ?? true : destroyOnHidden);
  let leavedClassName = $derived(motion && Object.hasOwn(motion, 'leavedClassName')
    ? motion.leavedClassName : `${prefixCls}-content-hidden`);
  let renderContent = $derived(visible || force || motionState.running || mounted && !remove);
  let retainedClass = $derived(!visible && !remove && wasVisible && !!leavedClassName);
  let forcedHidden = $derived(!visible && !retainedClass && (force || !remove && !leavedClassName));
  let eventClass = $derived(!motionState.running && (visible || forcedHidden)
    ? motion?.eventProps?.className : undefined);
  let hiddenClass = $derived(!visible && !motionState.running
    && (!motion?.eventProps || !forcedHidden) ? leavedClassName : undefined);
  let motionStyle = $derived.by(() => {
    if (motionState.running) {
      return motionState.style;
    }
    const props = motion?.eventProps;
    if (!props) {
      return undefined;
    }
    if (forcedHidden) {
      return 'display:none';
    }
    return visible || retainedClass ? props.style : undefined;
  });

  $effect(() => {
    const element = root;
    if (!element) {
      return;
    }
    const controller = createTabsPaneMotion(element, (next, commit) => {
      // Measurement hooks read DOM after prepare commits, like CSSMotion layout effects.
      if (commit) {
        flushSync(() => { motionState = next; });
      }
      else {
        motionState = next;
      }
    });
    runtime = controller;
    return () => {
      controller.destroy();
      runtime = undefined;
    };
  });

  $effect.pre(() => {
    const controller = runtime;
    const next = visible;
    const config = motion;
    const enabled = motionEnabled;
    if (next) wasVisible = true;
    untrack(() => controller?.sync(next, config, enabled));
  });

  // Track whether content has appeared in the DOM independently of active. After destruction, the
  // panel waits for activation again even if destroyOnHidden is disabled.
  function rememberContent() {
    mounted = true;
    return () => {
      mounted = false;
    };
  }
</script>

<style>
  [data-ant-tabs-part="content"] {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  [data-ant-tabs-part="content"][hidden] { display: none; }
</style>

<div bind:this={root} {id} role="tabpanel" aria-labelledby={labelledBy}
  data-ant-tabs-part="content"
  aria-hidden={!active} tabindex={active ? 0 : -1} inert={!active && motionState.running}
  hidden={!visible && !motionState.running} data-tabs-key={itemKey} class={[
    `${prefixCls}-content`,
    active && `${prefixCls}-content-active`,
    className,
    eventClass,
    hiddenClass,
    motionState.className
  ]} style={[style, motionStyle].filter(Boolean).join(';') || undefined}>
  {#if renderContent}<div class={`${prefixCls}-content-inner`} {@attach rememberContent}>{@render children?.()}</div>{/if}
</div>
