<script lang="ts">
  // Owns the DOM and visibility phase of one entry. The queue receives completion after DOM removal
  // and only for the version of the entry that was closing.
  import { onDestroy, tick, untrack } from 'svelte';
  import { on } from 'svelte/events';
  import type { Attachment } from 'svelte/attachments';
  import Icon from '../icon/Icon.svelte';
  import { useDesignTokenContext } from '../theme/theme-context.svelte';
  import { inheritedComponentThemeStyle } from '../theme/theme-component-style.engine';
  import { messageHolderKey, type MessageNotice } from './message.model.svelte.js';
  import { animateMessageNotice } from './message.dom';
  import { createCssMotion } from '../motion/css-motion.dom';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import type { MessageInstance, MessageSemanticSlots } from './message.types';

  let { notice, message, prefixCls, appearance, providerClass, transitionName, obscured, measure }: {
    notice: MessageNotice;
    message: MessageInstance;
    prefixCls: string;
    appearance: { classes: MessageSemanticSlots; styles: MessageSemanticSlots; };
    providerClass?: string;
    transitionName?: string;
    obscured: boolean;
    measure?: Attachment<HTMLDivElement>;
  } = $props();
  const id = untrack(() => notice.id);
  const runtime = untrack(() => message[messageHolderKey]);
  const designTheme = useDesignTokenContext();
  // Canonical variables resolve here, after local variables for a different prefix.
  let inheritedStyle = $derived(designTheme.enabled && designTheme.state.prefix !== 'ant'
    ? inheritedComponentThemeStyle('Message', designTheme.state.token, designTheme.state.prefix)
    : undefined);
  let rootStyle = $derived(serializeInlineStyleLayers([
    inheritedStyle, appearance.styles.root, notice.styles?.root, notice.style
  ]));
  const icons = {
    success: 'check-circle-filled',
    info: 'info-circle-filled',
    warning: 'exclamation-circle-filled',
    error: 'close-circle-filled',
    loading: 'loading'
  } as const;
  let typeIcon = $derived(notice.type ? icons[notice.type] : undefined);
  let icon = $derived(typeof notice.icon === 'boolean' ? undefined : notice.icon ?? undefined);
  let hasIcon = $derived(icon !== undefined || typeIcon !== undefined);
  let node = $state<HTMLDivElement>();
  let present = $state(true);
  let motionClass = $state<string>();
  let namedMotion = $state.raw<ReturnType<typeof createCssMotion>>();
  let reducedMotion = $state(false);
  let entered = false;
  let active = true;
  let disposeMotion: (() => void) | undefined;

  function mounted() {
    runtime.mounted(id);
  }

  function finish(version: number) {
    present = false;
    void tick().then(() => {
      if (active) runtime.complete(id, version);
    });
  }

  /** A local CSS transitionName follows the same phases as other popup surfaces. */
  function connectNamedMotion(root: HTMLDivElement) {
    const view = root.ownerDocument.defaultView;
    if (!view) {
      return;
    }

    disposeMotion?.();
    const preference = view.matchMedia('(prefers-reduced-motion: reduce)');
    const controller = createCssMotion(view, () => root, state => { motionClass = state.className; });
    function syncPreference() {
      reducedMotion = preference.matches;
    }
    const listeners = [
      on(root, 'animationend', controller.end),
      on(root, 'animationcancel', controller.end),
      on(root, 'transitionend', controller.end),
      on(root, 'transitioncancel', controller.end)
    ];
    preference.addEventListener('change', syncPreference);
    syncPreference();
    namedMotion = controller;

    return () => {
      controller.destroy();
      for (const remove of listeners) remove();
      preference.removeEventListener('change', syncPreference);
      namedMotion = undefined;
      motionClass = undefined;
    };
  }

  $effect(() => {
    const root = node;
    if (root && transitionName !== undefined) {
      return untrack(() => connectNamedMotion(root));
    }
  });

  $effect(() => {
    const root = node;
    const current = notice;
    const visible = runtime.visible;
    const name = transitionName;
    const controller = namedMotion;
    const motionEnabled = name !== undefined && designTheme.state.token.motion && !reducedMotion;
    if (!root || !present || !visible && !current.closing) {
      return;
    }

    untrack(() => {
      if (current.closing && (!visible || name === '')) {
        disposeMotion?.();
        finish(current.version);
        return;
      }

      if (name !== undefined) {
        if (controller) {
          controller.sync({
            motion: {
              motionName: name,
              motionLeaveImmediately: true,
              onVisibleChanged(open) {
                if (!open && current.closing) finish(current.version);
              }
            },
            initialVisibility: entered ? true : undefined,
            present: true,
            visible: !current.closing,
            enabled: motionEnabled,
            settleWithoutAnimation: true,
            settleOnCutoff: true
          });
          entered = true;
        }
        return;
      }

      if (current.closing) {
        const style = root.ownerDocument.defaultView!.getComputedStyle(root);
        const from = { opacity: style.opacity, transform: style.transform };
        disposeMotion?.();
        disposeMotion = animateMessageNotice(root, true, from, () => finish(current.version));
      }
      else if (visible && !entered) {
        entered = true;
        disposeMotion = animateMessageNotice(root, false, undefined, () => { });
      }
    });
  });

  onDestroy(() => {
    active = false;
    disposeMotion?.();
  });
</script>

<style>
  :global([data-ant-message-top]) > :global([data-ant-message-content]) > [data-ant-message-notice] {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    max-width: 100%;
  }
  [data-ant-message-notice][data-ant-message-native-motion] { transition: none; }
  :global([data-ant-message-top]) > :global([data-ant-message-content]) > [data-ant-message-obscured] {
    position: absolute;
    inset-block-start: 0;
    inset-inline: auto;
    opacity: 0;
    pointer-events: none;
  }
  [data-ant-message-title] {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  [data-ant-message-wrapper] { min-width: 0; }
  [data-ant-message-icon] { display: inline-flex; }
  .message-source-theme [data-ant-message-icon] { display: block; }
  @media (prefers-reduced-motion: reduce) { [data-ant-message-icon] :global(.loading) { animation: none; } }
</style>

{#snippet title()}
  {#if notice.content !== null}
    <div data-ant-message-title
      class={[`${prefixCls}-notice-title`, appearance.classes.title, notice.classNames?.title]}
      style={serializeInlineStyleLayers([appearance.styles.title, notice.styles?.title])}
    >{#if typeof notice.content === 'function'}{@render notice.content()}{:else if typeof notice.content !== 'boolean'}{notice.content}{/if}</div>
  {/if}
{/snippet}

{#if present}
  <div data-ant-message-notice data-ant-message-obscured={obscured || undefined}
    data-ant-message-native-motion={transitionName === undefined || undefined}
    bind:this={node} {@attach mounted} {@attach measure} role={notice.role} aria-atomic="true"
    aria-hidden={notice.closing || obscured || undefined} inert={notice.closing || obscured}
    class={[
      `${prefixCls}-notice`,
      notice.type && `${prefixCls}-notice-${notice.type}`,
      designTheme.enabled && 'message-source-theme',
      providerClass,
      appearance.classes.root,
      notice.classNames?.root,
      motionClass,
      notice.class
    ]} style={rootStyle} onclick={notice.onClick} onpointerenter={(event) => {
      if (event.pointerType !== 'touch')
        runtime.hover(id, true);
    }} onpointerleave={() => runtime.hover(id, false)}>
    {#if hasIcon}
      <div data-ant-message-wrapper class={[
        `${prefixCls}-notice-wrapper`,
        notice.type && `${prefixCls}-${notice.type}`,
        appearance.classes.wrapper,
        notice.classNames?.wrapper
      ]} style={serializeInlineStyleLayers([appearance.styles.wrapper, notice.styles?.wrapper])}>
        <span data-ant-message-icon class={[
          `${prefixCls}-notice-icon`,
          notice.type && `${prefixCls}-notice-icon-${notice.type}`,
          appearance.classes.icon,
          notice.classNames?.icon
        ]} style={serializeInlineStyleLayers([appearance.styles.icon, notice.styles?.icon])}
          aria-hidden="true"
        >{#if typeof icon === 'function'}{@render icon()}{:else if icon !== undefined}{icon}{:else if typeIcon}<Icon name={typeIcon} />{/if}</span>
        {@render title()}
      </div>
    {:else}
      {@render title()}
    {/if}
  </div>
{/if}
