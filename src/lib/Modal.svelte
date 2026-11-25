<script lang="ts">
  // Удерживает native dialog, модальность и содержимое до окончания закрытия.
  // Заменяет содержимое при loading независимо от переходов видимости.
  import { flushSync, tick, untrack } from 'svelte';
  import NoCompactStyle from './NoCompactStyle.svelte';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import { getModalPrefixCss } from './modal-prefix.engine';
  import { useConfig } from './config-context';
  import { isolateFormItemStyle } from './form-item-status';
  import { useComponentTheme } from './theme-component.svelte';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { getModalLayout } from './modal-layout.engine';
  import { serializeInlineStyleLayers } from './inline-style.engine';
  import { provideZIndex, useZIndex } from './z-index-context.svelte';
  import { useWatermarkPanel } from './watermark-context';
  import { createDialogContainer } from './dialog-container.model.svelte.js';
  import { connectDialogFocus } from './dialog-focus.dom';
  import { resolveDialogFocusable, resolveDialogMask } from './dialog-interaction.engine';
  import { createModalMotion } from './modal-motion.dom';
  import { getPopupActiveElement, isPopupFocusWithin } from './popup.dom';
  import type { ModalContent, ModalProps as ModalComponentProps } from './modal.types';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import Skeleton from './Skeleton.svelte';

  export type ModalProps = ModalComponentProps;

  let {
    prefixCls: customizePrefixCls,
    open = $bindable(false),
    title,
    children,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    footer,
    width = 520,
    height,
    centered,
    zIndex,
    closable = true,
    keyboard = true,
    mask,
    focusable,
    scrollLock = true,
    confirmLoading = false,
    loading = false,
    forceRender,
    destroyOnHidden,
    okText,
    cancelText,
    onOk,
    onCancel,
    afterClose,
    afterOpenChange,
    getContainer,
    class: className = ''
  }: ModalProps = $props();

  const config = useConfig();
  isolateFormItemStyle();
  const interaction = $derived.by(() => {
    const mergedMask = resolveDialogMask(mask, config.modal?.mask);
    const focus = resolveDialogFocusable(focusable, config.modal?.focusable, mergedMask.enabled);
    const restoreFocus = mergedMask.enabled && focus.restoreFocus;

    return {
      mask: mergedMask,
      trap: focus.trap,
      restoreFocus,
      native: focus.trap && restoreFocus,
      autoFocus: true
    };
  });
  let componentPrefix = $derived(config.getPrefixCls('modal', customizePrefixCls));
  let rootPrefix = $derived(config.getPrefixCls());
  let prefixCss = $derived(getModalPrefixCss(componentPrefix, rootPrefix));
  const componentTheme = useComponentTheme('Modal');
  const designTheme = useDesignTokenContext();
  const placement = $derived(centered ?? config.modal?.centered);
  const layout = $derived(getModalLayout(
    width, height, placement, componentPrefix, designTheme.state.token
  ));
  const style = $derived(serializeInlineStyleLayers([componentTheme.style, layout.variables]));
  const layer = useZIndex('container', () => zIndex);
  provideZIndex(() => layer.contextZIndex);
  const watermarkPanel = useWatermarkPanel();
  const generatedId = $props.id();
  const titleId = `ant-modal-${generatedId}`;
  let hasTitle = $derived(title !== undefined && title !== null && title !== false && title !== '');
  let dialog = $state<HTMLDialogElement>();
  let backdrop = $state<HTMLDivElement>();
  let backdropPointer: number | undefined;
  let presented = $state(false);
  let visited = $state(false);
  // Без параметров lifecycle остаётся прежний eager SSR и монтаж закрытых snippets.
  const preload = $derived(forceRender ?? (destroyOnHidden === undefined));
  const renderDialog = $derived(open || presented || preload || (visited && !destroyOnHidden));
  const motionToken = $derived(designTheme.state.token);
  let runtime = $state.raw<{ sync(open: boolean, token: typeof motionToken): void; closed(): void }>();
  const container = createDialogContainer(() => ({
    component: 'modal',
    open,
    getContainer,
    getPopupContainer: config.getPopupContainer,
    resolveWhenClosed: renderDialog,
    portalByDefault: !interaction.native && (open || presented),
    style,
    onPointerDown: event => {
      backdropPointer = event.button === 0 && isBackdrop(event) ? event.pointerId : undefined;
    },
    onPointerUp: handlePointerUp,
    onPointerCancel: () => { backdropPointer = undefined; }
  }));
  const scrollUnlocked = $derived.by(() => {
    if (!scrollLock) {
      return true;
    }
    if (interaction.native) {
      return false;
    }

    const target = container.target;
    return target === false || target !== undefined && target !== dialog?.ownerDocument.body;
  });

  $effect(() => {
    const current = runtime;
    const requested = open;
    const token = motionToken;
    void interaction;
    if (!current || !container.connected || !dialog?.isConnected) {
      return;
    }

    untrack(() => current.sync(requested, token));
  });

  $effect(() => {
    if (!open && !presented && destroyOnHidden && !preload) {
      visited = false;
    }
  });

  function connectDialog(node: HTMLDialogElement) {
    const focus = connectDialogFocus(node, () => interaction, controls => {
      const autofocus = controls.find(control => control.hasAttribute('autofocus'));
      return autofocus ?? (interaction.trap ? controls[0] : undefined);
    });
    const motion = createModalMotion(node, settled);
    let shown = false;
    let pendingRestore: (() => void) | undefined;

    function sync(visible: boolean, token: typeof motionToken) {
      if (visible) {
        if (node.open) focus.sync();
        else focus.open();

        shown = node.open;
        if (shown) {
          pendingRestore = undefined;
          presented = true;
        }
      }
      if (node.open) {
        motion.sync(visible, token, interaction.mask.enabled);
      }
    }

    function settled(visible: boolean) {
      if (!node.open || open !== visible) {
        return;
      }
      if (visible) {
        afterOpenChange?.(true);
      }
      else {
        pendingRestore = focus.close();
      }
    }

    function closed() {
      // Смена режима тоже создаёт close event. Уведомление принадлежит фактическому закрытию.
      if (node.open || !shown) {
        return;
      }

      shown = false;
      const restore = pendingRestore ?? focus.close();
      pendingRestore = undefined;
      motion.reset();
      finishClose();
      restore?.();
      afterClose?.();
      afterOpenChange?.(false);
    }

    const current = { sync, closed };
    visited = true;
    runtime = current;
    return () => {
      const document = node.ownerDocument;
      const active = getPopupActiveElement(node);
      const restore = pendingRestore ?? focus.close();
      motion.destroy();
      if (runtime === current) {
        runtime = undefined;
        presented = false;
      }

      if (active && active !== document.body && !isPopupFocusWithin(node, active)) {
        return;
      }
      if (restore) {
        void tick().then(() => {
          const focused = document.activeElement;
          if (!focused || focused === document.body || focused === node) {
            restore();
          }
        });
      }
    };
  }

  function finishClose() {
    if (destroyOnHidden && forceRender !== true) {
      // afterClose наблюдает удалённые children и завершённый cleanup.
      flushSync(() => {
        open = false;
        presented = false;
        visited = false;
      });
    }
    else {
      open = false;
      presented = false;
    }
  }

  function handleClose(event: Event) {
    if (event.currentTarget === dialog) runtime?.closed();
  }

  function cancel() {
    if (!confirmLoading) {
      open = false;
      onCancel?.();
    }
  }

  function handleCancel(event: Event) {
    event.preventDefault();

    if (keyboard) {
      cancel();
    }
  }

  function isBackdrop(event: PointerEvent) {
    if (event.target === backdrop) {
      return true;
    }
    if (!dialog || event.target !== dialog || !dialog.matches(':modal')) {
      return false;
    }

    const bounds = dialog.getBoundingClientRect();

    return event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  function handlePointerUp(event: PointerEvent) {
    const start = backdropPointer;
    backdropPointer = undefined;
    if (start === event.pointerId && interaction.mask.closable && isBackdrop(event)) {
      cancel();
    }
  }

  function handleOk() {
    if (onOk) {
      onOk();
    }
    else {
      open = false;
    }
  }
</script>

<style>
  :global(html:has(dialog.ant-svelte-dialog[open]:not([data-ant-dialog-unlocked]))) {
    overflow: hidden;
  }
  .ant-svelte-dialog { max-width: calc(100vw - 32px); max-height: calc(100dvh - 48px); padding: 0; border: 0; overflow: visible; background: transparent; color: var(--ant-color-text); }
  .ant-svelte-dialog {
    --ant-svelte-modal-offset: 24px;
    z-index: var(--ant-z-index-popup-base, 1000);
  }
  .ant-svelte-dialog[data-ant-modal-managed] { position: fixed; inset: 0; margin: auto; }
  .ant-svelte-dialog[data-ant-modal-layout] { max-width: var(--ant-svelte-modal-max-width); }
  .ant-svelte-dialog[data-ant-modal-top] {
    --ant-svelte-modal-offset: min(var(--ant-svelte-modal-top, 100px), max(0px, 100dvh - 96px));
    inset-block-start: var(--ant-svelte-modal-offset);
    inset-block-end: auto;
    margin-block: 0;
    max-height: calc(100dvh - var(--ant-svelte-modal-offset) - 24px);
  }
  .ant-svelte-dialog::backdrop { background: var(--ant-color-bg-mask); }
  .ant-svelte-dialog[data-ant-modal-mask-blur]::backdrop,
  [data-ant-modal-mask][data-ant-modal-mask-blur] { backdrop-filter: blur(4px); }
  [data-ant-modal-backdrop] { position: fixed; inset: 0; z-index: -1; }
  [data-ant-modal-mask] { background: var(--ant-color-bg-mask); }
  [data-ant-modal-panel] { top: auto; max-width: none; width: 100%; margin: 0; padding: 0; }
  [data-ant-modal-container] {
    max-height: calc(100dvh - var(--ant-svelte-modal-offset, 24px) - 24px);
    overflow: auto;
  }
  [data-ant-modal-title] { padding-inline-end: 32px; }
  [data-ant-modal-close] { display: flex; align-items: center; justify-content: center; }
</style>

{#snippet content(value: ModalContent | undefined)}
  {#if typeof value === 'function'}{@render value()}
  {:else if typeof value !== 'boolean'}{value ?? ''}{/if}
{/snippet}

<!-- Keyed range содержит только переносимый dialog; head-style anchors остаются снаружи. -->
<NoCompactStyle>
{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`modal-prefix:${componentPrefix}:${rootPrefix}`} />{/if}{#if layout.css && layout.scope}<ThemeScopeStyle css={layout.css} scope={layout.scope} />{/if}{#if renderDialog}{#key container.key}<dialog
  data-ant-modal-prefix={componentPrefix} data-ant-modal-root-prefix={rootPrefix}
  data-ant-modal-layout={layout.scope}
  data-ant-modal-top={placement === false || undefined}
  data-ant-modal-managed={!interaction.native || undefined}
  data-ant-modal-mask-blur={interaction.mask.enabled && interaction.mask.blur || undefined}
  data-ant-dialog-unlocked={scrollUnlocked || undefined}
  bind:this={dialog}
  tabindex={interaction.native ? undefined : -1}
  class={[
    'ant-svelte-dialog ant-modal-css-var',
    componentTheme.className,
    placement && `${componentPrefix}-centered`,
    className
  ]}
  {style}
  style:width={layout.width}
  style:height={layout.height}
  style:z-index={layer.zIndex}
  dir={config.direction}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledBy ?? (ariaLabel?.trim() ? undefined : hasTitle ? titleId : undefined)}
  aria-modal={interaction.trap || undefined}
  oncancel={handleCancel}
  onclose={handleClose}
  {@attach container.attach}
  {@attach connectDialog}
>
  {#if !interaction.native}<div data-ant-modal-backdrop
    data-ant-modal-mask={interaction.mask.enabled || undefined}
    data-ant-modal-mask-blur={interaction.mask.blur || undefined}
    aria-hidden="true" bind:this={backdrop}></div>{/if}
  <div data-ant-modal-panel data-ant-modal-prefix={componentPrefix}
    data-ant-modal-root-prefix={rootPrefix} class={componentPrefix}
    style:height={layout.height === undefined ? undefined : '100%'}>
    <div data-ant-modal-container class={`${componentPrefix}-container`} {@attach watermarkPanel}>
      {#if closable}
        <button type="button" data-ant-modal-close class={`${componentPrefix}-close`} disabled={confirmLoading} aria-label={config.locale.closeText} onclick={cancel}>
          {#if designTheme.enabled}<span data-ant-modal-close-x class={`${componentPrefix}-close-x`}><Icon name="close" /></span>{:else}<Icon name="close" />{/if}
        </button>
      {/if}
      {#if hasTitle}<div data-ant-modal-header class={`${componentPrefix}-header`}><h2 id={titleId} data-ant-modal-title class={`${componentPrefix}-title`}>{@render content(title)}</h2></div>{/if}
      <div data-ant-modal-body class={`${componentPrefix}-body`}>{#if loading}<Skeleton active title={false} paragraph={{ rows: 4 }} rootClassName={`${componentPrefix}-body-skeleton`} />{:else}{@render children?.()}{/if}</div>
      {#if footer !== null && !loading}
        <div data-ant-modal-footer class={`${componentPrefix}-footer`}>
          {#if footer}
            {@render footer()}
          {:else}
            <Button disabled={confirmLoading} onclick={cancel}
              children={cancelText ?? config.locale.cancelText} />
            <Button type="primary" loading={confirmLoading} onclick={handleOk}
              children={okText ?? config.locale.okText} />
          {/if}
        </div>
      {/if}
    </div>
  </div>
</dialog>
{/key}{/if}
</NoCompactStyle>
