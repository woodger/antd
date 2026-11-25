<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Modal, ModalHolder, createModal, type ModalConfirmConfig, type ModalConfirmHandle
  } from '@woodger/antd';
  import Body from './ModalLifecycleBody.svelte';
  import reference from './ant-design-modal-lifecycle-reference.json';

  let {
    profile = 'default', initiallyOpen = false, managed = false
  }: { profile?: string; initiallyOpen?: boolean; managed?: boolean } = $props();
  interface Profile {
    id: string;
    forceRender?: boolean;
    destroyOnHidden?: boolean;
    motion?: boolean;
    confirm?: boolean;
  }
  const initial: Profile | undefined = untrack(() =>
    [...reference.cases, ...reference.updates].find(item => item.profile.id === profile)?.profile
  );
  let forceRender = $state(initial?.id === 'default' ? false : initial?.forceRender);
  let destroyOnHidden = $state(initial?.destroyOnHidden);
  let open = $state(untrack(() => initiallyOpen));
  let mounted = $state(true);
  let motion = $state(Boolean(initial?.motion));
  let handle: ModalConfirmHandle | undefined;
  const modal = createModal();
  const confirm = initial?.confirm;
  type LifecycleEvent =
    | 'mount' | 'destroy'
    | ['afterClose', editorMounted: boolean, openerFocused: boolean]
    | ['afterOpenChange', visible: boolean];
  let events = $state<LifecycleEvent[]>([]);

  function show() {
    if (confirm) {
      handle = modal.confirm({
        title: 'Lifecycle probe',
        content: body,
        afterClose,
        afterOpenChange
      });
    }
    else {
      open = true;
    }
  }

  function close() {
    if (confirm) handle?.destroy();
    else open = false;
  }

  function record(kind: 'mount' | 'destroy') {
    events.push(kind);
  }

  function afterClose(this: ModalConfirmConfig | undefined) {
    if (confirm && this?.afterClose !== afterClose) {
      throw new Error('Expected the confirmation config as the callback receiver');
    }

    events.push([
      'afterClose',
      Boolean(document.getElementById('lifecycle-editor')),
      document.activeElement?.id === 'lifecycle-opener'
    ]);
  }

  function afterOpenChange(visible: boolean) {
    events.push(['afterOpenChange', visible]);
  }
</script>

{#snippet body()}<Body {record} {close} />{/snippet}

<button id="lifecycle-opener" type="button" onclick={show}>Open lifecycle</button>
<button id="lifecycle-unmount" type="button" onclick={() => mounted = false}>Unmount lifecycle</button>
<button id="lifecycle-keep" type="button" onclick={() => destroyOnHidden = false}>Keep hidden</button>
<button type="button" onclick={() => forceRender = false}>Disable preload</button>
<button id="lifecycle-disable-motion" type="button" onclick={() => motion = false}>Disable motion</button>
<output id="lifecycle-events">{JSON.stringify(events)}</output>
<ConfigProvider theme={{ token: { motion } }}>
  {#if mounted}
    {#if confirm}
      <ModalHolder {modal} />
    {:else}
      <Modal bind:open title="Lifecycle probe" footer={null} {forceRender} {destroyOnHidden}
        focusable={managed ? { trap: false } : undefined} {afterClose} {afterOpenChange}>
        {@render body()}
      </Modal>
    {/if}
  {/if}
</ConfigProvider>
