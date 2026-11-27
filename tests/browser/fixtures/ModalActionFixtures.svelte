<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Modal, ModalHolder, createModal,
    type ModalClosable, type ModalConfig, type ModalConfirmConfig, type ModalConfirmHandle,
    type ModalFooterButtons, type ModalProps
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import type { Snippet } from 'svelte';
  import reference from './ant-design-modal-actions-reference.json';

  let {
    kind = 'ordinary', profile = 'footer-render'
  }: { kind?: 'ordinary' | 'confirmation' | 'overrides' | 'live'; profile?: string; } = $props();

  interface Profile {
    id: string;
    action?: string;
    method?: string;
    closeHandlers?: boolean;
    disableIcon?: boolean;
    hideIcon?: boolean;
    provider?: boolean;
    replaceOk?: boolean;
    buttonProps?: boolean;
    renderFooter?: boolean;
    close?: boolean;
    closeDisabled?: boolean;
    footer?: boolean;
    pending?: boolean;
    loading?: boolean;
    disabled?: boolean;
    closeIcon?: null;
    closable?: boolean;
    closeObject?: string;
    inherit?: string;
    danger?: boolean;
    explicitIcon?: null;
  }

  const family = untrack(() => kind);
  const sample: Profile = untrack(() => family === 'live' ? { id: profile }
    : reference[family].find(entry => entry.profile.id === profile)?.profile ?? { id: profile });
  const confirmation = family === 'confirmation' || family === 'live' || sample.method !== undefined;
  const modal = createModal();
  let open = $state(true);
  let events = $state<unknown[][]>([]);
  let handle: ModalConfirmHandle | undefined;
  let resolveAction: (() => void) | undefined;

  function record(...entry: unknown[]) {
    events.push(entry);
  }

  function hooks(scope: string) {
    return {
      onClose: () => record(scope + '.onClose'),
      afterClose: () => record(scope + '.afterClose')
    };
  }

  /** Complies with the profiles of the original provider and a separate change of handle settings. */
  function provider(): ModalConfig | undefined {
    if (family === 'confirmation' || family === 'live') {
      return {
        okButtonProps: {
          danger: true, title: 'Inherited OK',
          ...(family === 'live' && { onclick: () => record('inherited click') })
        },
        cancelButtonProps: {
          id: 'parent-cancel', title: 'Inherited Cancel',
          onClick: event => record('cancelButtonProps', event.type)
        }
      };
    }
    if (family === 'ordinary') {
      if (!sample.provider && !sample.buttonProps) {
        return undefined;
      }
      return {
        closable: {
          closeIcon: parentCloseIcon, 'aria-label': 'Parent dismiss', ...hooks('provider')
        },
        okButtonProps: { danger: true, title: 'Parent action', id: 'parent-ok' },
        cancelButtonProps: { title: 'Parent cancel', id: 'parent-cancel' }
      };
    }

    const closable: ModalClosable | undefined = sample.inherit === 'object' ? {
      closeIcon: inheritedCloseIcon, disabled: true, 'aria-label': 'Inherited close',
      'aria-describedby': 'override-description', ...hooks('provider')
    } : sample.inherit === 'false' ? false : undefined;
    return { closable, infoIcon: null, successIcon, errorIcon, warningIcon };
  }

  /** Observes only local handlers and separately the properties of the closing button. */
  function closeConfig(): ModalClosable | undefined {
    if (family === 'ordinary') {
      if (sample.hideIcon) return false;
      return sample.closeHandlers ? {
        ...hooks('closable'), closeIcon: localCloseIcon,
        disabled: sample.disableIcon, 'aria-label': 'Dismiss probe'
      } : undefined;
    }
    if (family === 'confirmation') {
      return sample.close ? {
        ...hooks('closable'), closeIcon: confirmCloseIcon,
        disabled: sample.closeDisabled, 'aria-label': 'Local dismiss'
      } : undefined;
    }

    switch (sample.closeObject) {
      case 'null': return { closeIcon: null };
      case 'false': return { closeIcon: false };
      case 'override': return { disabled: false, 'aria-label': 'Local close' };
      case 'hooks': return hooks('first');
      default: return sample.closable;
    }
  }

  const context = provider();
  const closable = closeConfig();
  const title = family === 'ordinary' ? 'Action probe'
    : family === 'overrides' ? 'Override probe' : 'Confirmation actions';

  const dialogSettings: ModalProps = {
    closable,
    title,
    closeIcon: sample.closeIcon,
    okText: sample.danger ? richLabel : 'OK',
    cancelText: sample.danger ? null : 'Cancel',
    okType: sample.danger ? 'danger' : undefined,
    confirmLoading: sample.loading,
    okButtonProps: sample.buttonProps ? {
      id: 'local-ok', type: 'dashed',
      ...(sample.replaceOk && { onClick: event => record('override', event.type) })
    } : family === 'overrides' && sample.loading ? { loading: false } : undefined,
    footer: sample.renderFooter ? actionFooter : undefined,
    onOk: (...args: unknown[]) => {
      if (family === 'ordinary') record('ok', args.length);
      else record('ok');
      open = false;
    },
    onCancel: (...args: unknown[]) => {
      if (family === 'ordinary') record('cancel', args.length);
      else record('cancel');
      open = false;
    },
    afterClose: () => record('afterClose'),
    afterOpenChange: visible => record('afterOpenChange', visible)
  };

  /** Opens the context version with the same type that uses the original profile. */
  function showConfirmation() {
    const options: ModalConfirmConfig = {
      class: 'actions-probe',
      title,
      content: confirmContent,
      icon: sample.explicitIcon,
      closable,
      mask: { closable: true },
      okText: 'OK',
      cancelText: 'Cancel',
      okButtonProps: family === 'confirmation' ? {
        id: 'local-ok', type: 'dashed',
        ...(sample.loading !== undefined && { loading: sample.loading }),
        onClick: event => record('okButtonProps', event.type)
      } : undefined,
      focusable: family === 'live' ? { autoFocusButton: 'cancel' } : undefined,
      footer: family === 'live' ? liveFooter : sample.footer ? actionFooter : undefined,
      onOk: () => {
        record(family === 'confirmation' ? 'onOk' : 'ok');
        if (sample.pending || sample.action === 'async') {
          return new Promise<void>(resolve => { resolveAction = resolve; });
        }
      },
      onCancel: () => record(family === 'confirmation' ? 'onCancel' : 'cancel'),
      afterClose: () => record('afterClose'),
      afterOpenChange: visible => record('afterOpenChange', visible)
    };
    const method = sample.method;
    switch (method) {
      case 'info':
      case 'success':
      case 'error':
      case 'warning':
        handle = modal[method](options);
        break;
      default:
        handle = modal.confirm(options);
    }
    void handle.then(accepted => record('result', accepted));
  }

  /** Late update changes the real action and preserves the internal state of the dialogue. */
  function updateConfirmation() {
    handle?.update(family === 'live' ? {
      okButtonProps: {
        href: '#accepted', title: 'Updated OK',
        onClick: event => {
          event.preventDefault();
          record('link', event.currentTarget.tagName, event.currentTarget.getAttribute('href'));
        }
      },
      focusable: { autoFocusButton: 'ok' }
    } : { closable: hooks('updated') });
  }
</script>

{#snippet parentCloseIcon()}<span data-probe-close-icon="provider">Parent X</span>{/snippet}
{#snippet localCloseIcon()}<span data-probe-close-icon="local">Local X</span>{/snippet}
{#snippet confirmCloseIcon()}<span data-confirm-close="local">Dismiss</span>{/snippet}
{#snippet inheritedCloseIcon()}
  <span data-source-icon="inherited-close">inherited-close</span>
{/snippet}
{#snippet successIcon()}<span data-source-icon="success">success</span>{/snippet}
{#snippet errorIcon()}<span data-source-icon="error">error</span>{/snippet}
{#snippet warningIcon()}<span data-source-icon="warning">warning</span>{/snippet}
{#snippet richLabel()}<strong data-source-rich="ok">Take action</strong>{/snippet}

{#snippet confirmContent()}
  <input aria-label="Confirmation draft" value="Seed" />
{/snippet}

{#snippet actionFooter(standard: Snippet, { OkBtn, CancelBtn }: ModalFooterButtons)}
  <span data-footer-contract={String(Boolean(standard))}>Footer</span>
  {@render OkBtn()}{@render CancelBtn()}
{/snippet}

{#snippet liveFooter(standard: Snippet)}
  {@render standard()}
{/snippet}

<button id="action-update" type="button" onclick={updateConfirmation}>Update action</button>
<button id="action-release" type="button" onclick={() => resolveAction?.()}>Release action</button>
<button id="action-destroy" type="button" onclick={() => handle?.destroy()}>Destroy confirmation</button>
<button id="action-close" type="button" onclick={() => open = false}>Close externally</button>
<output id="action-events">{JSON.stringify(events)}</output>
<ConfigProvider locale={enUS} theme={{ token: { motion: false } }}
  componentDisabled={sample.disabled} modal={context}>
  {#if confirmation}
    <button id="action-open" type="button" onclick={showConfirmation}>Open confirmation</button>
    <ModalHolder {modal} />
  {:else}
    <Modal {...dialogSettings} bind:open class="actions-probe">
      <p id="override-description">Description</p>
      <input aria-label="Action content" value="Seed" />
    </Modal>
  {/if}
</ConfigProvider>
