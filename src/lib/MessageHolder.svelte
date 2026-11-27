<script lang="ts">
  // The surface lives independently of the queue. Changing the container can recreate DOM while
  // preserving the deadlines and handles of open messages.
  import { untrack } from 'svelte';
  import { on } from 'svelte/events';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getMessagePrefixCss } from './message-prefix.engine';
  import MessageNotice from './MessageNotice.svelte';
  import { useConfig } from './config-context';
  import { useComponentTheme } from './theme-component.svelte';
  import { connectInlineStyle } from './inline-style.dom';
  import { serializeInlineStyleLayers, type InlineStyleLayer } from './inline-style.engine';
  import { messageHolderKey } from './message.model.svelte.js';
  import { resolveMessageHolder } from './message-semantic.engine';
  import { createNoticeContainer } from './notice-container.model.svelte';
  import type { MessageHolderProps } from './message.types';

  let {
    message,
    id,
    class: className = '',
    style,
    ...overrides
  }: MessageHolderProps = $props();
  const config = useConfig();
  let runtime = $derived(message[messageHolderKey]);
  let options = $derived({ ...runtime.options, ...overrides });
  let componentPrefix = $derived(config.getPrefixCls('message', options.prefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getMessagePrefixCss(componentPrefix, rootPrefix));
  const componentTheme = useComponentTheme('Message');
  let anchor = $state<HTMLSpanElement>();
  let surface = $state<HTMLDivElement>();
  let notices = $derived(runtime.notices);
  let top = $derived(options.top ?? 8);
  let rtl = $derived(options.rtl ?? config.direction === 'rtl');
  let appearance = $derived(resolveMessageHolder(options, config.message));
  let hovering = $state(false);
  let stack = $derived(Boolean(options.stack));
  let threshold = $derived(typeof options.stack === 'object' ? options.stack.threshold ?? 3 : 3);
  let lastNotice = $derived(notices.findLast(notice => !notice.closing));
  let activeCount = $derived(stack ? notices.filter(notice => !notice.closing).length : 0);
  let expanded = $derived(stack && (hovering || activeCount <= threshold));
  let collapsed = $derived(stack && !expanded);
  let stackSizes = $state.raw({ width: 0, height: 0 });
  let stackStyle = $derived(stack ? serializeInlineStyleLayers([
    appearance.styles.listContent,
    [
      ['--top-notificiation-width', `${stackSizes.width}px`],
      ['--top-notificiation-height', `${stackSizes.height}px`],
      ['--ant-svelte-message-depth', `${Math.max(0, Math.min(activeCount, threshold) - 1) * 8}px`]
    ]
  ]) : appearance.styles.listContent);
  let resolvedTop = $derived(
    typeof top === 'number'
      ? `${Number.isFinite(top) && top >= 0 ? top : 8}px`
      : top.trim() || '8px'
  );
  let rootLayers = $derived<readonly InlineStyleLayer[]>([
    componentTheme.style,
    appearance.styles.list,
    style,
    [['--notification-top', resolvedTop]]
  ]);
  let rootStyle = $derived(serializeInlineStyleLayers(rootLayers));
  const container = createNoticeContainer(
    () => anchor,
    () => ({ getContainer: options.getContainer, getPopupContainer: config.getPopupContainer }),
    () => ({ node: surface, onVisible: runtime.setVisible }),
    () => rootLayers
  );

  function connectRootStyle(node: HTMLDivElement) {
    const update = connectInlineStyle(node);
    $effect(() => {
      update(rootLayers);
      container.syncTheme();
    });
  }

  function connectHost(node: HTMLSpanElement) {
    const view = node.ownerDocument.defaultView!;
    return runtime.connect({
      now: () => view.performance.now(),
      schedule(callback, milliseconds) {
        const timer = view.setTimeout(callback, milliseconds);
        return () => view.clearTimeout(timer);
      }
    });
  }

  function setListHover(next: boolean) {
    hovering = next && stack;
    runtime.hoverList(hovering);
  }

  /** Hover expands the list and pauses timers while the pointer remains in the stack. */
  function connectListHover(node: HTMLDivElement) {
    const enter = on(node, 'pointerenter', event => {
      if (event.pointerType !== 'touch') setListHover(true);
    });
    const leave = on(node, 'pointerleave', () => setListHover(false));
    return () => {
      enter();
      leave();
      setListHover(false);
    };
  }

  $effect(() => {
    if (!stack || !notices.length) {
      untrack(() => setListHover(false));
    }
  });

  /** Only the last active card's size determines the collapsed stack's shape. */
  function measureStack(node: HTMLDivElement) {
    const view = node.ownerDocument.defaultView;
    if (!view) {
      return;
    }
    function measure() {
      stackSizes = { width: node.offsetWidth, height: node.offsetHeight };
    }
    const observer = new view.ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }
</script>

<style>
  .ant-message-anchor {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
    visibility: hidden;
  }
  [data-ant-message-root][data-ant-message-list] {
    position: fixed;
    inset: auto;
    top: calc(var(--notification-top) + var(--ant-svelte-notice-viewport-top, 0px) - var(--notification-margin-edge));
    left: 0;
    right: auto;
    width: 100%;
    max-width: 100vw;
    height: auto;
    max-height: calc(100dvh - var(--notification-top) + var(--notification-margin-edge));
    margin: 0;
    border: 0;
    background: transparent;
    transform: none;
    outline: none;
  }
  [data-ant-message-root]:not(:popover-open) { display: none; }
  [data-ant-message-root] > [data-ant-message-content] {
    align-items: center;
    flex-direction: column-reverse;
  }
  [data-ant-message-content][data-ant-message-stack] { isolation: isolate; }
  [data-ant-message-content][data-ant-message-collapsed] {
    padding-block-end: var(--ant-svelte-message-depth);
  }
  [data-ant-message-stack]::before, [data-ant-message-stack]::after {
    position: absolute;
    left: 50%;
    height: calc(var(--ant-margin-xs) * 2);
    border-radius: var(--ant-border-radius-lg);
    background: var(--ant-message-content-bg);
    box-shadow: var(--ant-box-shadow-tertiary);
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%) translateY(100%);
    transition:
      opacity var(--ant-motion-duration-fast) var(--ant-motion-ease-in-out),
      transform var(--ant-motion-duration-fast) var(--ant-motion-ease-in-out),
      width var(--ant-motion-duration-slow) var(--ant-motion-ease-in-out);
    content: '';
  }
  [data-ant-message-stack]::before {
    top: calc(var(--top-notificiation-height) - var(--ant-margin-xs));
    z-index: -1;
    width: max(0px, calc(var(--top-notificiation-width) - var(--ant-margin)));
  }
  [data-ant-message-stack]::after {
    top: var(--top-notificiation-height);
    z-index: -2;
    width: max(0px, calc(var(--top-notificiation-width) - var(--ant-margin) * 2));
  }
  [data-ant-message-collapsed]::before, [data-ant-message-collapsed]::after {
    opacity: 1;
    transform: translateX(-50%);
  }
  @media (prefers-reduced-motion: reduce) {
    [data-ant-message-stack]::before, [data-ant-message-stack]::after { transition: none; }
  }
  [data-ant-message-root]::backdrop {
    pointer-events: none;
    background: transparent;
  }
</style>

<span bind:this={anchor} class="ant-message-anchor" aria-hidden="true" {@attach connectHost}></span>
{#key message}
  {#if notices.length}
    {#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`message-prefix:${componentPrefix}:${rootPrefix}`} />{/if}
    {#key container.key}
    <div bind:this={surface}
      data-ant-message-root data-ant-message-list data-ant-message-top
      data-ant-message-prefix={componentPrefix} data-ant-message-root-prefix={rootPrefix}
      popover="manual" {id} dir={rtl ? 'rtl' : 'ltr'} class={[
        `${componentPrefix} ant-message-css-var ${componentPrefix}-list ${componentPrefix}-top`,
        componentTheme.className,
        rtl && `${componentPrefix}-rtl`,
        stack && `${componentPrefix}-stack`,
        expanded && `${componentPrefix}-stack-expanded`,
        hovering && `${componentPrefix}-list-hovered`,
        appearance.classes.list,
        className
      ]} style={untrack(() => rootStyle)} {@attach connectRootStyle}>
      <div
        data-ant-message-content
        data-ant-message-stack={stack || undefined}
        data-ant-message-collapsed={collapsed || undefined}
        class={[`${componentPrefix}-list-content`, appearance.classes.listContent]}
        style={stackStyle}
        {@attach stack ? connectListHover : undefined}
      >
        {#each notices as notice (notice.id)}
          <MessageNotice
            {notice}
            {message}
            prefixCls={componentPrefix}
            {appearance}
            providerClass={config.message?.class}
            transitionName={options.transitionName}
            obscured={collapsed && lastNotice?.id !== notice.id && !notice.closing}
            measure={stack && lastNotice?.id === notice.id ? measureStack : undefined}
          />
        {/each}
      </div>
    </div>
    {/key}
  {/if}
{/key}
