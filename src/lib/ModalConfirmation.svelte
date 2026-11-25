<script lang="ts">
  // Отображает подтверждение контроллера на зарезервированном слое Modal.
  import { untrack } from 'svelte';
  import Modal from './Modal.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';
  import { useConfig } from './config-context';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { normalizeDialogMask } from './dialog-interaction.engine';
  import { modalHolderKey, type ModalConfirmation } from './modal.model.svelte.js';
  import type { ModalHolderProps } from './modal-confirm.types';
  import type { ModalContent } from './modal.types';

  let { confirmation, modal }: ModalHolderProps & { confirmation: ModalConfirmation; } = $props();
  const runtime = untrack(() => modal[modalHolderKey]);
  const id = untrack(() => confirmation.id);
  const generatedId = $props.id();
  const titleId = `ant-modal-confirm-title-${generatedId}`;
  const contentId = `ant-modal-confirm-content-${generatedId}`;
  const config = useConfig();
  const theme = useDesignTokenContext();
  const icons = {
    info: 'info-circle-filled',
    success: 'check-circle-filled',
    error: 'close-circle-filled',
    warning: 'exclamation-circle-filled',
    confirm: 'exclamation-circle-filled'
  } as const;
  let options = $derived(confirmation.config);
  const zIndex = $derived(options.zIndex ?? theme.state.token.zIndexPopupBase + 1000);
  let componentPrefix = $derived(config.getPrefixCls('modal', options.prefixCls));
  let hasTitle = $derived(options.title !== undefined
    && options.title !== null && typeof options.title !== 'boolean' && options.title !== '');
  let hasIcon = $derived(options.icon !== null && options.icon !== false);
  let okCancel = $derived(options.okCancel ?? confirmation.type === 'confirm');
  const autofocusButton = $derived.by(() => {
    const target = options.focusable?.autoFocusButton;
    return target === undefined ? 'ok' : target;
  });
  const visible = $derived(confirmation.open);
  let okButton = $state<HTMLButtonElement | HTMLAnchorElement>();
  let cancelButton = $state<HTMLButtonElement | HTMLAnchorElement>();
  let previousAutofocus = untrack(() => autofocusButton);
  let mask = $derived.by(() => {
    const own = normalizeDialogMask(options.mask);
    return { ...own, closable: own.closable ?? false };
  });
  let okText = $derived(
    options.okText ?? (!okCancel ? config.locale.justOkText : undefined) ?? config.locale.okText
  );

  $effect(() => {
    const target = autofocusButton;
    const open = visible;
    const ok = okButton;
    const cancel = cancelButton;
    // Svelte добавляет autofocus через spread. При смене выбора обновляем DOM property.
    if (ok) ok.autofocus = target === 'ok';
    if (cancel) cancel.autofocus = target === 'cancel';

    const changed = target !== previousAutofocus;
    previousAutofocus = target;
    if (!open || !changed || target === null) {
      return;
    }

    const button = target === 'ok' ? ok : cancel;
    const view = button?.ownerDocument.defaultView;
    if (!button || !view) {
      return;
    }

    // Начальный фокус задаёт dialog. Update переносит фокус после обновления footer.
    const timer = view.setTimeout(() => {
      if (button.isConnected && button.closest('dialog[open]')) {
        button.focus({ preventScroll: true });
      }
    }, 0);
    return () => view.clearTimeout(timer);
  });

  function mounted() {
    runtime.mounted(id);
  }

  function afterOpenChange(open: boolean) {
    if (open) {
      options.afterOpenChange?.(true);
    }
  }
</script>

<style>
  :global(dialog.modal-confirm-dialog [data-ant-modal-body]) { padding: var(--ant-modal-confirm-body-padding); }
</style>

{#snippet content(value: ModalContent | undefined)}
  {#if typeof value === 'function'}{@render value()}
  {:else if typeof value !== 'boolean'}{value ?? ''}{/if}
{/snippet}

<Modal
  prefixCls={componentPrefix}
  open={confirmation.open}
  width={options.width || 416}
  height={options.height}
  centered={options.centered}
  {zIndex}
  closable={options.closable ?? false}
  keyboard={options.keyboard}
  {mask}
  focusable={options.focusable}
  scrollLock={options.scrollLock}
  forceRender={options.forceRender}
  destroyOnHidden={options.destroyOnHidden}
  transitionName={options.transitionName}
  maskTransitionName={options.maskTransitionName}
  mousePosition={options.mousePosition}
  getContainer={options.getContainer}
  class={['modal-confirm-dialog', `${componentPrefix}-confirm`, `${componentPrefix}-confirm-${confirmation.type}`, options.class]
    .filter(Boolean).join(' ')}
  aria-labelledby={hasTitle ? titleId : contentId}
  onCancel={() => runtime.dismiss(id)}
  afterClose={() => runtime.complete(id, true)}
  {afterOpenChange}
  footer={null}
>
  <div class={`${componentPrefix}-confirm-body-wrapper`} {@attach mounted}>
    <div class={[
      `${componentPrefix}-confirm-body`,
      hasTitle && `${componentPrefix}-confirm-body-has-title`,
      !hasIcon && `${componentPrefix}-confirm-body-no-icon`
    ]}>
      {#if hasIcon}
        {#if options.icon}{@render options.icon()}
        {:else}<span class="anticon" aria-hidden="true"><Icon name={icons[confirmation.type]} /></span>{/if}
      {/if}
      <div class={`${componentPrefix}-confirm-paragraph`}>
        {#if hasTitle}<span id={titleId} class={`${componentPrefix}-confirm-title`}>{@render content(options.title)}</span>{/if}
        <div id={contentId} class={`${componentPrefix}-confirm-content`}>{@render content(options.content)}</div>
      </div>
    </div>
    {#if options.footer === undefined}
      <div class={`${componentPrefix}-confirm-btns`}>
        {#if okCancel}
          <Button loading={confirmation.pendingCancel} autofocus={autofocusButton === 'cancel'}
            bind:nativeElement={cancelButton}
            onclick={() => runtime.act(id, false)}
            children={options.cancelText ?? config.locale.cancelText} />
        {/if}
        <Button type="primary" loading={confirmation.pendingOk} autofocus={autofocusButton === 'ok'}
          bind:nativeElement={okButton}
          onclick={() => runtime.act(id, true)} children={okText} />
      </div>
    {:else if options.footer}
      {@render options.footer()}
    {/if}
  </div>
</Modal>
