<script lang="ts">
  // Отображает подтверждение контроллера на зарезервированном слое Modal.
  import { untrack } from 'svelte';
  import Modal from './Modal.svelte';
  import ModalActionButton from './ModalActionButton.svelte';
  import Icon from './Icon.svelte';
  import { useConfig } from './config-context';
  import { useDesignTokenContext } from './theme-context.svelte';
  import { normalizeDialogMask } from './dialog-interaction.engine';
  import { modalHolderKey, type ModalConfirmation } from './modal.model.svelte.js';
  import type { ModalHolderProps } from './modal-confirm.types';
  import type { ModalSemanticBody } from './modal-semantic.engine';
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
    info: { name: 'info-circle-filled', option: 'infoIcon' },
    success: { name: 'check-circle-filled', option: 'successIcon' },
    error: { name: 'close-circle-filled', option: 'errorIcon' },
    warning: { name: 'exclamation-circle-filled', option: 'warningIcon' },
    confirm: { name: 'exclamation-circle-filled', option: 'warningIcon' }
  } as const;
  let options = $derived(confirmation.config);
  const zIndex = $derived(options.zIndex ?? theme.state.token.zIndexPopupBase + 1000);
  let componentPrefix = $derived(config.getPrefixCls('modal', options.prefixCls));
  let hasTitle = $derived(options.title !== undefined
    && options.title !== null && typeof options.title !== 'boolean' && options.title !== '');
  const panelRef = $derived(options.panelRef);
  const labelledBy = $derived(options.wrapProps?.['aria-labelledby']
    ?? (options.wrapProps?.['aria-label']?.trim() ? undefined : hasTitle ? titleId : contentId));
  const defaultIcon = $derived(icons[confirmation.type]);
  const icon = $derived(options.icon === undefined ? config.modal?.[defaultIcon.option] : options.icon);
  const hasIcon = $derived(icon !== null && typeof icon !== 'boolean');
  let okCancel = $derived(options.okCancel ?? confirmation.type === 'confirm');
  // Контроллер выполняет afterClose вместе с cleanup записи подтверждения.
  const closable = $derived(typeof options.closable === 'object'
    ? { ...options.closable, afterClose: undefined } : options.closable ?? false);
  const autofocusButton = $derived.by(() => {
    const target = options.focusable?.autoFocusButton;
    return target === undefined ? 'ok' : target;
  });
  const visible = $derived(confirmation.open);
  let body = $state<HTMLDivElement>();
  let panel = $state<HTMLDialogElement>();
  let previousAutofocus = untrack(() => autofocusButton);
  let mask = $derived.by(() => {
    const own = normalizeDialogMask(options.mask);
    return { ...own, closable: own.closable ?? false };
  });
  let okText = $derived(
    options.okText === undefined
      ? (!okCancel ? config.locale.justOkText : undefined) ?? config.locale.okText
      : options.okText
  );
  const cancelText = $derived(
    options.cancelText === undefined ? config.locale.cancelText : options.cancelText
  );

  $effect(() => {
    const target = autofocusButton;
    const open = visible;
    const changed = target !== previousAutofocus;
    previousAutofocus = target;
    if (!open || !changed || target === null) {
      return;
    }

    const wrapper = body;
    const view = wrapper?.ownerDocument.defaultView;
    if (!wrapper || !view) {
      return;
    }

    // После update ищем доступную кнопку в новом footer, включая пользовательский snippet.
    const timer = view.setTimeout(() => {
      const owner = wrapper.closest('dialog[open]');
      if (!owner) {
        return;
      }
      const buttons = wrapper.querySelectorAll<HTMLElement>(
        `[data-ant-modal-action="${target}"]`
      );
      const button = [...buttons].find(candidate => candidate.closest('dialog') === owner
        && !candidate.matches(':disabled, [aria-disabled="true"]'));
      button?.focus({ preventScroll: true });
    }, 0);
    return () => view.clearTimeout(timer);
  });

  $effect(() => {
    const node = panel;
    const ref = panelRef;
    if (!node) {
      return;
    }

    // Отрисованная оболочка проходит lifecycle, даже если modalRender заменил всё тело.
    runtime.mounted(id);
    if (ref) {
      untrack(() => ref(node));
      return () => ref(undefined);
    }
  });

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

{#snippet OkBtn()}
  <ModalActionButton
    inherited={config.modal?.okButtonProps}
    options={options.okButtonProps}
    type={options.okType ?? 'primary'}
    loading={confirmation.pendingOk}
    autofocus={autofocusButton === 'ok'}
    text={okText}
    part="ok"
    action={() => runtime.act(id, true)}
  />
{/snippet}

{#snippet CancelBtn()}
  {#if okCancel}
    <ModalActionButton
      inherited={config.modal?.cancelButtonProps}
      options={options.cancelButtonProps}
      loading={confirmation.pendingCancel}
      autofocus={autofocusButton === 'cancel'}
      text={cancelText}
      part="cancel"
      action={() => runtime.act(id, false)}
    />
  {/if}
{/snippet}

{#snippet defaultFooter()}
  <div class={`${componentPrefix}-confirm-btns`}>
    {@render CancelBtn()}{@render OkBtn()}
  </div>
{/snippet}

{#snippet confirmBody({ className, style }: ModalSemanticBody)}
  <div class={`${componentPrefix}-confirm-body-wrapper`} bind:this={body}>
    <div class={[
      `${componentPrefix}-confirm-body`,
      hasTitle && `${componentPrefix}-confirm-body-has-title`,
      !hasIcon && `${componentPrefix}-confirm-body-no-icon`
    ]}>
      {#if hasIcon}
        {#if icon === undefined}
          <span class="anticon" aria-hidden="true"><Icon name={defaultIcon.name} /></span>
        {:else}
          {@render content(icon)}
        {/if}
      {/if}
      <div class={`${componentPrefix}-confirm-paragraph`}>
        {#if hasTitle}<span id={titleId} class={`${componentPrefix}-confirm-title`}>{@render content(options.title)}</span>{/if}
        <div id={contentId} class={[`${componentPrefix}-confirm-content`, className]} {style}>
          {@render content(options.content)}
        </div>
      </div>
    </div>
    {#if options.footer === undefined}
      {@render defaultFooter()}
    {:else if options.footer}
      {@render options.footer(defaultFooter, { OkBtn, CancelBtn })}
    {/if}
  </div>
{/snippet}

<Modal
  prefixCls={componentPrefix}
  open={confirmation.open}
  title={options.title}
  width={options.width || 416}
  height={options.height}
  centered={options.centered}
  {zIndex}
  {closable}
  closeIcon={options.closeIcon}
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
  class={[
    'modal-confirm-dialog', `${componentPrefix}-confirm`,
    `${componentPrefix}-confirm-${confirmation.type}`, options.class
  ].filter(Boolean).join(' ')}
  style={options.style}
  rootClassName={options.rootClassName}
  rootStyle={options.rootStyle}
  wrapClassName={options.wrapClassName}
  classNames={options.classNames}
  styles={options.styles}
  wrapProps={options.wrapProps}
  bodyProps={options.bodyProps}
  maskProps={options.maskProps}
  modalRender={options.modalRender}
  bind:panelRef={panel}
  aria-labelledby={labelledBy}
  onCancel={() => runtime.dismiss(id)}
  afterClose={() => runtime.complete(id, true)}
  {afterOpenChange}
  footer={null}
  _renderSemanticContent={confirmBody}
/>
