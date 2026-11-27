<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Drawer, Modal, ModalHolder, Select, createModal,
    type ModalConfig, type ModalConfirmConfig, type ModalConfirmHandle, type ModalProps
  } from '@woodger/antd';
  import reference from './ant-design-modal-interaction-reference.json';

  interface Profile {
    id: string;
    confirm?: boolean;
    provider?: ModalConfig;
    props?: Pick<ModalConfirmConfig, 'mask' | 'focusable' | 'scrollLock' | 'getContainer'>;
  }

  let { initial = 'default', initiallyOpen = false }: {
    initial?: string;
    initiallyOpen?: boolean;
  } = $props();
  const profiles = reference.cases.map(({ profile }) => profile as Profile);
  let selected = $state(untrack(() => initial));
  let profile = $derived(profiles.find(item => item.id === selected) ?? profiles[0]);
  let open = $state(untrack(() => initiallyOpen));
  let mounted = $state(true);
  let nested = $state<'none' | 'native' | 'managed'>('none');
  let drawerOpen = $state(false);
  let free = $state(false);
  let cancelled = $state(0);
  let background = $state(0);
  let closed = $state(0);
  const modal = createModal();
  let confirmation: ModalConfirmHandle | undefined;
  let settings = $derived<Pick<ModalProps, 'mask' | 'focusable' | 'scrollLock' | 'getContainer'>>(
    free ? { mask: false, focusable: { trap: false }, scrollLock: false } : profile.props ?? {}
  );

  /** Оба владельца открываются от одной кнопки и регистрируют одинаковые наблюдения. */
  function launch() {
    mounted = true;
    if (nested !== 'none') {
      drawerOpen = true;
    }
    else if (profile.confirm) {
      confirmation = modal.confirm({
        ...profile.props,
        title: 'Interaction probe',
        content,
        onCancel: () => { cancelled++; },
        afterClose: () => { closed++; }
      });
    }
    else {
      open = true;
    }
  }

  /** Закрывает экземпляр от владельца без пользовательского onCancel. */
  function close() {
    if (profile.confirm) confirmation?.destroy();
    else open = false;
  }
</script>

<style>
  #modal-interaction-fixture { min-height: 2000px; }
  #interaction-opener, #interaction-background {
    position: fixed;
    left: 12px;
  }
  #interaction-opener { top: 12px; }
  #interaction-background { top: 72px; }
</style>

{#snippet content()}
  <div>
    <input id="interaction-editor" aria-label="Interaction draft" value="Seed" />
    <button id="interaction-last" type="button">Last interaction control</button>
    {#if nested !== 'none'}<Select aria-label="Nested interaction choice"
      options={[{ value: 'alpha', label: 'Alpha' }]} />{/if}
  </div>
{/snippet}

{#snippet panel()}
  {#if mounted}<Modal {...settings} bind:open title="Interaction probe" footer={null}
    onCancel={() => { cancelled++; }} afterClose={() => { closed++; }}>
    {@render content()}
  </Modal>{/if}
{/snippet}

<section id="modal-interaction-fixture">
  <label>Modal interaction profile <select bind:value={selected}>
    {#each profiles as item}<option value={item.id}>{item.id}</option>{/each}
  </select></label>
  <label>Modal interaction host <select bind:value={nested}>
    <option value="none">No host</option>
    <option value="native">Native Drawer</option>
    <option value="managed">Managed Drawer</option>
  </select></label>
  <button id="interaction-opener" type="button" onclick={launch}>Open interaction panel</button>
  <button id="interaction-background" type="button" onclick={() => { background++; }}>Background</button>
  <button id="interaction-close" type="button" onclick={close}>Close interaction panel</button>
  <button id="interaction-free" type="button" onclick={() => { free = true; }}>Use free focus</button>
  <button id="interaction-native" type="button" onclick={() => { free = false; }}>Use native focus</button>
  <button id="interaction-autofocus-cancel" type="button" onclick={() =>
    confirmation?.update({ focusable: { autoFocusButton: 'cancel' } })}>Autofocus Cancel</button>
  <button id="interaction-autofocus-none" type="button" onclick={() =>
    confirmation?.update({ focusable: { autoFocusButton: null } })}>Clear button autofocus</button>
  <button id="interaction-unmount" type="button"
    onclick={() => { mounted = false; }}>Unmount interaction panel</button>
  <output aria-label="Interaction background">{background}</output>
  <output aria-label="Interaction cancelled">{cancelled}</output>
  <output aria-label="Interaction closed">{closed}</output>
  <div id="destination"></div>
  <ConfigProvider modal={profile.provider} theme={{ token: { motion: false } }}>
    {#if nested !== 'none'}
      <Drawer bind:open={drawerOpen} title="Interaction Drawer"
        mask={nested === 'managed' ? false : undefined}
        focusable={nested === 'managed' ? { trap: true } : undefined}>
        <button type="button" onclick={() => { open = true; }}>Open nested interaction panel</button>
        {@render panel()}
      </Drawer>
    {:else if profile.confirm}
      <ModalHolder {modal} />
    {:else}
      {@render panel()}
    {/if}
  </ConfigProvider>
</section>
