<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, Modal, ModalHolder, createModal, type ModalConfig, type ModalConfirmHandle,
    type ModalProps, type ModalSemanticSlots, type ModalSurfaceProps
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import reference from './ant-design-modal-semantics-reference.json';

  interface Profile {
    id: string;
    local?: string;
    provider?: boolean;
    customize?: boolean;
    minimal?: boolean;
    elementProps?: boolean;
    render?: boolean;
    destroy?: boolean;
    confirm?: boolean;
  }

  let { id }: { id: string; } = $props();
  const profile: Profile = untrack(() => reference.cases.find(entry => entry.profile.id === id)
    ?.profile ?? { id });
  const replaceConfirmation = profile.id === 'replace-confirmation';
  const interactiveMask = profile.id === 'interactive-mask';
  const animatedMask = profile.id === 'animated-mask';
  const namedMask = profile.id === 'named-mask';
  const managedMask = profile.id === 'managed-mask';
  const slots = [
    'root', 'wrapper', 'mask', 'container', 'close', 'header', 'title', 'body', 'footer'
  ] as const;
  const inputs: Record<string, unknown> = {};
  const modal = createModal();
  let handle: ModalConfirmHandle | undefined;
  let open = $state(true);
  let panel = $state<HTMLDialogElement>();
  let width = $state<number | undefined>(profile.customize ? 626 : undefined);
  let events = $state<(string | boolean)[]>([]);
  const refState = $derived({
    attached: Boolean(panel?.isConnected),
    role: panel?.localName ?? null,
    isPanel: panel?.matches('dialog.explicit-root') ?? false
  });

  onMount(() => {
    Object.assign(window, { modalSemanticInputs: inputs });
  });

  /** Проецирует вход в semantic callback на те же поля, что в измерениях UMD. */
  function storeInput(source: string, props: ModalProps) {
    const { open, width, prefixCls, centered, focusable, mask, zIndex, loading, closable } = props;
    inputs[source] = {
      open: open ?? null,
      width: width ?? null,
      prefixCls: prefixCls ?? null,
      centered: centered ?? null,
      focusable: focusable ?? null,
      mask: mask ?? null,
      zIndex: zIndex ?? null,
      loading: loading ?? null,
      closable: typeof closable === 'boolean' ? closable : null
    };
  }

  /** Сопоставляет строковые CSS-слои с объектами style в исходном замере. */
  function styles(source: string, border: number): ModalSemanticSlots {
    return Object.fromEntries(slots.map(slot => [
      slot, `--winner:${source};--${source}:${slot};border-top-width:${border}px`
    ]));
  }

  /** Помечает владельца класса на каждой части DOM. */
  function classes(source: string): ModalSemanticSlots {
    return Object.fromEntries(slots.map(slot => [slot, `${source}-${slot}`]));
  }

  const provider: ModalConfig | undefined = profile.provider ? {
    class: 'provider-panel',
    style: '--winner:providerStyle;--provider-panel:panel',
    classNames: ({ props }) => {
      storeInput('providerClasses', props);
      return classes('provider');
    },
    styles: ({ props }) => {
      storeInput('providerStyles', props);
      return styles('provider', 2);
    }
  } : undefined;

  /** Функциональный профиль меняет классы тела при обновлении width. */
  function localOptions(): ModalSurfaceProps {
    if (profile.local === 'object') {
      return { classNames: classes('local'), styles: styles('local', 3) };
    }
    if (profile.local === 'function') {
      return {
        classNames: ({ props }) => {
          storeInput('localClasses', props);
          return {
            ...classes('local'), root: `local-root width-${props.width}`,
            body: `local-body width-${props.width}`
          };
        },
        styles: ({ props }) => {
          storeInput('localStyles', props);
          return { ...styles('local', 3), body: `--winner:local;--width:${props.width}` };
        }
      };
    }

    return {};
  }

  const nativeParts: ModalSurfaceProps = profile.elementProps ? {
    wrapProps: { class: 'replacement-wrap', 'data-extra': 'wrapper',
      style: '--winner:wrapProps;z-index:1200' },
    maskProps: { class: 'replacement-mask', 'data-extra': 'mask',
      style: '--winner:maskProps;z-index:1199' },
    bodyProps: { class: 'replacement-body', 'data-extra': 'body',
      style: '--winner:bodyProps;padding:11px', 'aria-label': 'body props' }
  } : interactiveMask || animatedMask || namedMask || managedMask ? {
    wrapProps: interactiveMask ? {
      onclick: event => {
        if (event.target === event.currentTarget) {
          events.push('wrapper-click');
        }
      }
    } : undefined,
    maskProps: {
      style: 'background:rgb(20,30,40);z-index:1500',
      onclick: () => events.push('mask-click')
    }
  } : {};

  const shared: ModalSurfaceProps = {
    ...localOptions(), ...nativeParts, rootClassName: 'explicit-root',
    wrapClassName: 'explicit-wrapper', style: '--winner:explicitStyle;--explicit:panel',
    modalRender: profile.render ? renderWrapper : undefined
  };

  function recordClose() {
    events.push('close');
  }

  function recordVisibility(open: boolean) {
    events.push(open);
  }

  /** Открывает контекстную панель через её обычный контроллер. */
  function confirm() {
    handle = modal.confirm({
      ...shared,
      class: 'explicit-panel',
      title: 'Semantic probe',
      content: editor,
      closable: true,
      afterClose: recordClose,
      afterOpenChange: recordVisibility,
      ...(replaceConfirmation && {
        modalRender: replacement,
        wrapProps: { 'aria-label': 'Replacement confirmation' },
        panelRef: node => {
          panel = node;
          events.push(node ? 'ref-set' : 'ref-clear');
        }
      })
    });
  }
</script>

<style>
  :global(.semantic-mask-leave-active) {
    animation: leave-mask 8s both;
  }
  @keyframes leave-mask {
    from { opacity: 1; }
    to { opacity: 0; }
  }
</style>

{#snippet editor()}
  <input id="modal-semantic-editor" aria-label="Draft" value="Seed" />
{/snippet}

{#snippet renderWrapper(content: Snippet)}
  <section data-custom-render>{@render content()}</section>
{/snippet}

{#snippet replacement()}
  <button type="button" id="replacement" onclick={() => handle?.destroy()}>Finish</button>
{/snippet}

<button type="button" id="semantic-open" onclick={() => open = true}>Open</button>
<button type="button" id="semantic-close" onclick={() => open = false}>Close</button>
<button type="button" id="semantic-update" onclick={() => width = 699}>Update width</button>
<output id="semantic-ref">{JSON.stringify(refState)}</output>
<output id="semantic-events">{JSON.stringify(events)}</output>
<ConfigProvider locale={enUS} modal={provider} theme={{ token: {
  motion: animatedMask || namedMask, motionUnit: animatedMask ? 1 : undefined
} }}>
  {#if profile.confirm || replaceConfirmation}
    <button type="button" id="modal-semantic-confirm" onclick={confirm}>Open confirmation</button>
    <ModalHolder {modal} />
  {:else}
    <Modal {...shared}
      bind:open bind:panelRef={panel} {width}
      prefixCls={profile.customize ? 'probe-modal' : undefined}
      title={profile.minimal ? null : 'Semantic probe'}
      footer={profile.minimal ? null : undefined}
      mask={profile.minimal ? false : profile.customize ? { blur: true, closable: false } : undefined}
      closable={profile.minimal ? false : undefined}
      focusable={profile.customize || managedMask
        ? { trap: false, focusTriggerAfterClose: false } : undefined}
      centered={profile.customize || undefined}
      getContainer={false}
      rootStyle="--winner:rawRootStyle;--raw-root:raw-root"
      class="explicit-panel"
      transitionName={namedMask ? '' : undefined}
      maskTransitionName={namedMask ? 'semantic-mask' : undefined}
      destroyOnHidden={profile.destroy}
      afterClose={recordClose}
      afterOpenChange={recordVisibility}
    >
      {@render editor()}
    </Modal>
  {/if}
</ConfigProvider>
