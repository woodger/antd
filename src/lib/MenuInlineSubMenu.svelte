<script lang="ts">
  // Retains the inline list through close and mode changes. The leaving copy keeps its inline
  // layout and releases the navigation keys.
  import { untrack } from 'svelte';
  import { provideMenu, useMenu, type MenuContext } from './menu-context';
  import type { MenuEntry } from './menu.engine';
  import { getMenuMotionStyle } from './menu-motion.dom';
  import { getMenuInlineMotion } from './menu-motion.engine';
  import { useMenuMotion } from './menu-motion.svelte';
  import type { MenuTheme } from './menu.types';
  import MenuList from './MenuList.svelte';

  let { entry, theme, id, style, open }: {
    entry: MenuEntry;
    theme: MenuTheme;
    id: string;
    style?: string;
    open: boolean;
  } = $props();
  const parent = useMenu();
  const inline = $derived(parent.mode === 'inline');
  const exiting = $derived(parent.exiting || !inline);
  const locked = $derived(parent.locked || exiting);
  const motion = $derived(getMenuInlineMotion(
    `${parent.rootPrefixCls}-motion-collapse`, parent.motion, Boolean(entry.parent)
  ));
  const visible = $derived(!locked && (Object.hasOwn(motion, 'visible')
    ? motion.visible ?? true : open));
  let list = $state<HTMLUListElement>();
  let visited = $state(untrack(() => visible));
  let forcedBefore = $state(untrack(() => inline && parent.forceRender));
  const initialVisibility = untrack(() => inline && !parent.motionReady ? open : undefined);

  const runtime = useMenuMotion(() => parent.nativeElement, () => list, () => ({
    motion,
    enabled: parent.motionEnabled,
    visible,
    present: inline,
    initialVisibility
  }));
  const phase = $derived(runtime.state.phase);
  const present = $derived(inline && (visible || visited || forcedBefore || parent.forceRender)
    || phase === 'leave');
  const hidden = $derived(!visible && !phase);
  const transitionStyle = $derived(phase ? runtime.state.style
    : visible || visited ? getMenuMotionStyle(motion.eventProps?.style) : undefined);

  const context: MenuContext = Object.create(parent, {
    mode: { value: 'inline' },
    locked: { get: () => locked },
    exiting: { get: () => exiting },
    open: { get: () => locked ? [] : parent.open }
  });
  provideMenu(context);

  $effect.pre(() => {
    if (visible) visited = true;
    else if (!inline && !phase) visited = false;
    if (inline && parent.forceRender) forcedBefore = true;
  });
</script>

<style>
  [data-ant-menu-inline-list][hidden] { display: none; }
</style>

{#if present}
  <ul bind:this={list} id={exiting ? undefined : id} role="menu" data-menu-list="true"
    data-ant-menu-prefix={parent.prefixCls} data-ant-menu-root-prefix={parent.rootPrefixCls}
    data-ant-menu-inline-list data-ant-menu-motion={parent.rootPrefixCls}
    {hidden} inert={phase === 'leave' || locked || undefined}
    aria-hidden={phase === 'leave' || locked || undefined}
    class={[
      `${parent.prefixCls} ant-menu-css-var ${parent.prefixCls}-sub ${parent.prefixCls}-inline`,
      hidden && visited && `${parent.prefixCls}-hidden`,
      parent.direction === 'rtl' && `${parent.prefixCls}-rtl`,
      !phase && (!hidden || !visited) && motion.eventProps?.className,
      runtime.state.className
    ]}
    style={[style, transitionStyle].filter(Boolean).join(';') || undefined}
    ontransitionend={runtime.end} onanimationend={runtime.end}>
    <MenuList entries={entry.children} {theme} />
  </ul>
{/if}
