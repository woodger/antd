<script lang="ts">
  // Renders one card and its exit transition. Progress subscribes to the queue clock, and focus is
  // restored before inert is set and before DOM removal.
  import { onDestroy, tick, untrack } from 'svelte';
  import Icon from '../Icon.svelte';
  import { useConfig } from '../config-context';
  import { useDesignTokenContext } from '../theme-context.svelte';
  import { inheritedComponentThemeStyle } from '../theme-component-style.engine';
  import { notificationHolderKey, type NotificationNotice } from './notification.model.svelte.js';
  import { animateNotice, focusAfterNotice } from '../notice.dom';
  import { serializeInlineStyleLayers } from '../inline-style.engine';
  import type {
    NotificationContent, NotificationInstance, NotificationSemanticName, NotificationSemanticSlots
  } from './notification.types';

  let {
    notice,
    notification,
    prefixCls,
    appearance,
    providerClass,
    providerCloseIcon,
    holderCloseIcon,
    stackRank,
    stackThreshold,
    collapsed
  }: {
    notice: NotificationNotice;
    notification: NotificationInstance;
    prefixCls: string;
    appearance: { classes: NotificationSemanticSlots; styles: NotificationSemanticSlots; };
    providerClass?: string;
    providerCloseIcon?: NotificationContent;
    holderCloseIcon?: NotificationContent;
    stackRank?: number;
    stackThreshold: number;
    collapsed: boolean;
  } = $props();
  const id = untrack(() => notice.id);
  const runtime = untrack(() => notification[notificationHolderKey]);
  const config = useConfig();
  const designTheme = useDesignTokenContext();
  let inheritedStyle = $derived(designTheme.enabled && designTheme.state.prefix !== 'ant'
    ? inheritedComponentThemeStyle(
      'Notification',
      designTheme.state.token,
      designTheme.state.prefix
    )
    : undefined);
  let rootStyle = $derived(serializeInlineStyleLayers([
    inheritedStyle,
    stackRank === undefined ? undefined : [['--notification-index', String(stackRank)]],
    slotStyle('root'),
    notice.style
  ]));
  const identity = $props.id();
  const icons = {
    success: 'check-circle-filled',
    info: 'info-circle-filled',
    warning: 'exclamation-circle-filled',
    error: 'close-circle-filled'
  } as const;
  let node = $state<HTMLDivElement>();
  let present = $state(true);
  let entered = false;
  let active = true;
  let disposeMotion: (() => void) | undefined;
  let hasTitle = $derived(isContent(notice.title));
  let hasDescription = $derived(isContent(notice.description));
  let customIcon = $derived(isContent(notice.icon));
  let hasIcon = $derived(customIcon || Boolean(notice.type));
  let ariaLabel = $derived(notice['aria-label'] ?? notice.props?.['aria-label']);
  let ariaLabelledBy = $derived(notice['aria-labelledby'] ?? notice.props?.['aria-labelledby']
    ?? (!ariaLabel && hasTitle ? `${identity}-title` : undefined));
  let ariaDescribedBy = $derived(notice['aria-describedby'] ?? notice.props?.['aria-describedby']
    ?? (hasDescription ? `${identity}-description` : undefined));
  let closeConfig = $derived(typeof notice.closable === 'object' ? notice.closable : undefined);
  let closeIcon = $derived(
    [closeConfig?.closeIcon, notice.closeIcon, holderCloseIcon, providerCloseIcon]
      .find(icon => icon !== undefined)
  );
  let closable = $derived(notice.closable !== false && closeIcon !== false && closeIcon !== null);
  let customCloseIcon = $derived(typeof closeIcon === 'string' || isContent(closeIcon));
  let stacked = $derived(collapsed && stackRank !== 0);
  let obscured = $derived(
    stacked && (stackRank === undefined || stackRank >= Math.min(3, stackThreshold))
  );
  let progress = $derived(notice.showProgress && runtime.timer(id) !== undefined);

  function isContent(value: NotificationContent | undefined) {
    return typeof value === 'function' || typeof value === 'number'
      || typeof value === 'string' && value.length > 0;
  }

  function slotClasses(name: NotificationSemanticName) {
    return [appearance.classes[name], notice.classNames?.[name]];
  }

  function slotStyle(name: NotificationSemanticName) {
    return serializeInlineStyleLayers([appearance.styles[name], notice.styles?.[name]]);
  }

  function mounted() {
    runtime.mounted(id);
  }
  function handleClose(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (closable && !closeConfig?.disabled) {
      runtime.close(id);
    }
  }

  /** RAF updates only value while the timer is running. Pausing or unmounting cancels the frame. */
  function connectProgress(progressNode: HTMLProgressElement) {
    const view = progressNode.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    $effect(() => {
      const timing = runtime.timer(id);
      if (!timing) {
        return;
      }

      let frame = 0;
      function paint() {
        const current = runtime.timer(id);
        if (!current) {
          return;
        }

        progressNode.value = current.remaining * 100;
        if (current.running) frame = view?.requestAnimationFrame(paint) ?? 0;
      }

      paint();
      return () => view.cancelAnimationFrame(frame);
    });
  }
  function handleFocusOut(event: FocusEvent) {
    if (!node?.contains(event.relatedTarget instanceof Node ? event.relatedTarget : null))
      runtime.focus(id, false);
  }

  $effect.pre(() => {
    const root = node;
    const closing = notice.closing;
    // Capture focus before setting inert and before an action snippet can be removed.
    if (root) {
      untrack(() => {
        const ownedFocus = root.contains(root.ownerDocument.activeElement);
        if (closing) {
          focusAfterNotice(root, ownedFocus);
        }
        else {
          void tick().then(() => {
            if (!active || !root.isConnected) {
              return;
            }
            if (ownedFocus && !root.contains(root.ownerDocument.activeElement))
              focusAfterNotice(root, true);
            runtime.focus(id, root.contains(root.ownerDocument.activeElement));
          });
        }
      });
    }
  });

  $effect(() => {
    const root = node;
    const current = notice;
    const visible = runtime.visible;
    if (!root || !present) {
      return;
    }

    untrack(() => {
      const shift = current.placement.endsWith('Left')
        ? 'translateX(-64px)'
        : current.placement.endsWith('Right')
          ? 'translateX(64px)'
          : current.placement === 'bottom' ? 'translateY(64px)' : 'translateY(-64px)';
      if (current.closing) {
        const style = root.ownerDocument.defaultView!.getComputedStyle(root);
        const from = { opacity: style.opacity, transform: style.transform };
        disposeMotion?.();
        const finish = () => {
          present = false;
          void tick().then(() => {
            if (active)
              runtime.complete(id, current.version);
          });
        };
        if (!visible) {
          finish();
        }
        else {
          disposeMotion = animateNotice(root, true, from, finish, shift);
        }
      }
      else if (visible && !entered) {
        entered = true;
        disposeMotion = animateNotice(root, false, undefined, () => { }, shift);
      }
    });
  });

  onDestroy(() => {
    active = false;
    disposeMotion?.();
    if (node)
      focusAfterNotice(node, node.contains(node.ownerDocument.activeElement));
    runtime.hover(id, false);
    runtime.focus(id, false);
  });
</script>

<style>
  :global([data-ant-notification-root][data-ant-notification-list]) > :global([data-ant-notification-content]) > [data-ant-notification-notice] {
    position: relative;
    inset: auto;
    max-width: 100%;
    transform: none;
    transition: none;
  }
  :global([data-ant-notification-root][data-placement]) > :global([data-ant-notification-folded])
    > [data-ant-notification-stacked] {
    position: absolute;
    inset-inline: 0;
    margin-inline: auto;
    scale: calc(1 - min(var(--notification-index, 0), 2) * 0.06);
    --ant-svelte-notification-stack-offset:
      max(0px, calc(var(--ant-svelte-notification-stack-depth) - var(--notification-index, 0) * 8px));
  }
  :global([data-ant-notification-root][data-placement^='top']) > :global([data-ant-notification-folded])
    > [data-ant-notification-stacked] { inset-block-end: var(--ant-svelte-notification-stack-offset); }
  :global([data-ant-notification-root][data-placement^='bottom']) > :global([data-ant-notification-folded])
    > [data-ant-notification-stacked] { inset-block-start: var(--ant-svelte-notification-stack-offset); }
  [data-ant-notification-stacked][data-ant-notification-obscured] {
    opacity: 0;
    pointer-events: none;
  }
  [data-ant-notification-notice-title], [data-ant-notification-notice-description] {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  [data-ant-notification-notice-icon] { display: inline-flex; }
  /* Upstream's absolutely positioned notice creates a BFC. The native relative notice retains floats with flow-root. */
  .notification-source-theme { display: flow-root; }
  .notification-source-theme [data-ant-notification-notice-icon] { display: block; }
  .notification-source-theme [data-ant-notification-notice-actions] { display: block; }
  /* Shared markup keeps controls mounted through theme changes. The grid follows the previous layout. */
  [data-ant-notification-notice]:not(.notification-source-theme) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--ant-margin-xs);
  }
  [data-ant-notification-notice]:not(.notification-source-theme).notification-with-icon {
    grid-template-columns: max-content minmax(0, 1fr);
    column-gap: var(--ant-margin-sm);
  }
  [data-ant-notification-notice]:not(.notification-source-theme) [data-ant-notification-notice-wrapper] { display: contents; }
  [data-ant-notification-notice]:not(.notification-source-theme) :is([data-ant-notification-notice-section], [data-ant-notification-notice-title], [data-ant-notification-notice-description]) {
    grid-column: -2 / -1;
    grid-row: 1;
  }
  [data-ant-notification-notice]:not(.notification-source-theme) [data-ant-notification-notice-icon] {
    grid-column: 1;
    grid-row: 1;
    align-self: start;
  }
  [data-ant-notification-notice]:not(.notification-source-theme):has(> [data-ant-notification-notice-actions]) [data-ant-notification-notice-icon] { grid-row: 1 / span 2; }
  [data-ant-notification-notice]:not(.notification-source-theme):not(.notification-with-text) { row-gap: 0; }
  [data-ant-notification-notice]:not(.notification-source-theme) > [data-ant-notification-notice-actions] {
    grid-column: -2 / -1;
    grid-row: 2;
    float: none;
  }
  [data-ant-notification-notice-close] {
    min-width: 24px;
    min-height: 24px;
    padding: 0;
    cursor: pointer;
  }
  [data-ant-notification-notice-close]:disabled { cursor: default; }
  [data-ant-notification-notice-actions] {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--ant-margin-xs);
    max-width: 100%;
  }
  [data-ant-notification-notice-progress] {
    position: absolute;
    inset-inline: var(--ant-border-radius-lg);
    bottom: 0;
    display: block;
    appearance: none;
    inline-size: calc(100% - var(--ant-border-radius-lg) * 2);
    block-size: 2px;
    border: 0;
    pointer-events: none;
  }
  [data-ant-notification-notice-progress], [data-ant-notification-notice-progress]::-webkit-progress-bar {
    border-radius: var(--ant-border-radius-lg);
    background-color: rgb(0 0 0 / 4%);
  }
  [data-ant-notification-notice-progress]::-webkit-progress-value {
    border-radius: var(--ant-border-radius-lg);
    background: var(--ant-notification-progress-bg);
  }
  [data-ant-notification-notice-progress]::-moz-progress-bar {
    background: var(--ant-notification-progress-bg);
  }
  @media (prefers-reduced-motion: reduce) { [data-ant-notification-notice-close] { transition: none; } }
</style>

{#snippet content(value: NotificationContent | undefined)}
  {#if typeof value === 'function'}{@render value()}
  {:else if typeof value === 'string' || typeof value === 'number'}{value}{/if}
{/snippet}

{#snippet titleContent()}
  <div data-ant-notification-notice-title id={`${identity}-title`}
    class={[`${prefixCls}-notice-title`, slotClasses('title')]} style={slotStyle('title')}
  >{@render content(notice.title)}</div>
{/snippet}
{#snippet descriptionContent()}
  <div data-ant-notification-notice-description id={`${identity}-description`}
    class={[`${prefixCls}-notice-description`, slotClasses('description')]}
    style={slotStyle('description')}
  >{@render content(notice.description)}</div>
{/snippet}
{#snippet textContent()}
  {#if hasTitle && hasDescription}
    <div data-ant-notification-notice-section
      class={[`${prefixCls}-notice-section`, slotClasses('section')]} style={slotStyle('section')}>
      {@render titleContent()}
      {@render descriptionContent()}
    </div>
  {:else if hasTitle}{@render titleContent()}
  {:else if hasDescription}{@render descriptionContent()}{/if}
{/snippet}

{#if present}
  <div {...notice.props} data-ant-notification-notice
    data-ant-notification-stacked={stacked || undefined}
    data-ant-notification-obscured={obscured || undefined}
    data-notification-index={stackRank}
    bind:this={node} {@attach mounted} role={notice.role}
    aria-atomic={notice.props?.['aria-atomic'] ?? true}
    aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} aria-describedby={ariaDescribedBy}
    aria-hidden={notice.closing || obscured || notice.props?.['aria-hidden']}
    inert={notice.closing || obscured || notice.props?.inert}
    class={[
      `${prefixCls}-notice`,
      designTheme.enabled && 'notification-source-theme',
      hasIcon && 'notification-with-icon',
      (hasTitle || hasDescription) && 'notification-with-text',
      notice.type && `${prefixCls}-notice-${notice.type}`,
      closable && `${prefixCls}-notice-closable`,
      stackRank !== undefined && stackRank < stackThreshold && `${prefixCls}-notice-stack-in-threshold`,
      providerClass,
      slotClasses('root'),
      notice.class
    ]} style={rootStyle}
    onclick={notice.onClick}
    onpointerenter={(event) => {
      if (event.pointerType !== 'touch') runtime.hover(id, true);
    }}
    onpointerleave={() => runtime.hover(id, false)}
    onfocusin={() => runtime.focus(id, true)}
    onfocusout={handleFocusOut}>
    {#if hasIcon}
      <div data-ant-notification-notice-wrapper
        class={[`${prefixCls}-notice-wrapper`, slotClasses('wrapper')]} style={slotStyle('wrapper')}>
        <span data-ant-notification-notice-icon class={[
          `${prefixCls}-notice-icon`,
          notice.type && (!designTheme.enabled || !customIcon)
            && `${prefixCls}-notice-icon-${notice.type}`,
          slotClasses('icon')
        ]} style={slotStyle('icon')} aria-hidden="true"
        >{#if customIcon}{@render content(notice.icon)}
          {:else if notice.type}<Icon name={icons[notice.type]} />{/if}</span>
        {@render textContent()}
      </div>
    {:else}{@render textContent()}{/if}
    {#if isContent(notice.actions)}
      <div data-ant-notification-notice-actions
        class={[`${prefixCls}-notice-actions`, slotClasses('actions')]} style={slotStyle('actions')}
      >{@render content(notice.actions)}</div>
    {/if}
    {#if closable}
      <button type="button" data-ant-notification-notice-close
        class={[`${prefixCls}-notice-close`, slotClasses('close')]} style={slotStyle('close')}
        disabled={notice.closing || closeConfig?.disabled}
        aria-label={closeConfig?.['aria-label'] ?? config.locale.closeText}
        aria-labelledby={closeConfig?.['aria-labelledby']} aria-describedby={closeConfig?.['aria-describedby']}
        onclick={handleClose}
      ><span aria-hidden="true">{#if customCloseIcon}{@render content(closeIcon)}
          {:else}<Icon name="close" />{/if}</span></button>
    {/if}
    {#if progress}
      <progress data-ant-notification-notice-progress
        class={[`${prefixCls}-notice-progress`, slotClasses('progress')]} style={slotStyle('progress')}
        aria-label={ariaLabel} aria-labelledby={ariaLabelledBy}
        max={100} value={100} {@attach connectProgress}
      ></progress>
    {/if}
  </div>
{/if}
