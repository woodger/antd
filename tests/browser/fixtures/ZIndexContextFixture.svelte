<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, createModal, Drawer, Dropdown, Menu, Modal, ModalHolder, Popconfirm, Popover,
    Tooltip, type ModalConfirmHandle, type ThemeConfig
  } from '@woodger/antd';
  import source from './ant-design-z-index-context-reference.json';

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'root' }: { profileId?: string; } = $props();
  const profile = untrack(() => {
    const id = profileId === 'cascade' ? 'dropdown-explicit' : profileId;
    return source.cases.find(entry => entry.profile.id === id)?.profile ?? source.cases[0].profile;
  });
  const keyboard = untrack(() => profileId === 'keyboard');
  const cascade = untrack(() => profileId === 'cascade');
  const scope = untrack(() => profile.owner);
  const theme: ThemeConfig = {
    token: { motion: false, zIndexPopupBase: profile.base ?? 1000 },
    components: profile.dropdownToken === undefined ? undefined : {
      Dropdown: { zIndexPopup: profile.dropdownToken },
      Menu: { zIndexPopup: profile.menuToken }
    }
  };
  const modal = createModal();
  const commands = [{ key: 'one', label: 'One' }];
  const menuItems = [{
    key: 'branch', label: 'Branch', popupClassName: 'zi-child-menu', children: commands
  }];
  const childStyle = profile.child === undefined ? undefined : `z-index:${profile.child}`;
  let zIndex = $state(untrack(() => keyboard ? 1500 : profile.zIndex));
  let dialogOpen = $state(false);
  let confirmation: ModalConfirmHandle | undefined;
  const ownerStyle = $derived.by(() => {
    if (zIndex === undefined) {
      return undefined;
    }

    return cascade ? `Z-Index: ${zIndex} !important; z-index: 9000` : `z-index:${zIndex}`;
  });

  onMount(() => {
    if (scope === 'confirmation') {
      confirmation = modal.confirm({
        title: 'Confirmation',
        content: overlays,
        getContainer: false,
        class: 'zi-owner-modal',
        zIndex
      });
    }
  });

  /** Обновляет тот же диалог, через handle подтверждения или реактивный prop. */
  function updateOwner() {
    const next = keyboard ? 1700 : profile.update;
    if (next === undefined) {
      return;
    }
    if (confirmation) {
      confirmation.update({ zIndex: next });
    }
    else {
      zIndex = next;
    }
  }
</script>

{#snippet overlays()}
  <Tooltip open placement="right" title="Child tooltip" rootClassName="zi-child-tooltip"
    zIndex={profile.child}>
    <button type="button">Tooltip</button>
  </Tooltip>
  <Dropdown open menu={{ items: commands }} rootClassName="zi-child-dropdown"
    styles={{ root: childStyle }}>
    <button type="button">Dropdown</button>
  </Dropdown>
  <Popover open content="Child popover" rootClassName="zi-child-popover" zIndex={profile.child}>
    <button type="button">Popover</button>
  </Popover>
  <Popconfirm open title="Child popconfirm" rootClassName="zi-child-popconfirm"
    zIndex={profile.child}>
    <button type="button">Popconfirm</button>
  </Popconfirm>
  <Menu mode="vertical" openKeys={['branch']} items={menuItems} />
{/snippet}

{#snippet modalOwner(contents: Snippet, value: number | undefined)}
  <Modal open title="Modal owner" class="zi-owner-modal" getContainer={false} footer={null}
    zIndex={value}>
    {@render contents()}
  </Modal>
{/snippet}

{#snippet drawerOwner(contents: Snippet, value: number | undefined)}
  <Drawer open title="Drawer owner" class="zi-owner-drawer" getContainer={false} zIndex={value}>
    {@render contents()}
  </Drawer>
{/snippet}

{#snippet tooltipTarget()}<button type="button">Tooltip owner</button>{/snippet}

{#snippet dropdownOwner(style?: string)}
  <Dropdown open rootClassName="zi-owner-dropdown" popupRender={overlays} styles={{ root: style }}>
    <button type="button">Dropdown owner</button>
  </Dropdown>
{/snippet}

{#snippet nestedDropdown()}{@render dropdownOwner()}{/snippet}
{#snippet nestedModal()}{@render modalOwner(overlays, undefined)}{/snippet}
{#snippet nestedDrawer()}{@render drawerOwner(overlays, undefined)}{/snippet}

<section id="z-index-context-fixture">
  <ConfigProvider {theme}>
    {#if keyboard}
      <button type="button" onclick={() => { dialogOpen = true; }}>Open layer dialog</button>
      <Modal bind:open={dialogOpen} title="Layer dialog" getContainer={false} footer={null}
        {zIndex}>
        <input aria-label="Layer draft" />
        <Dropdown menu={{ items: commands }} trigger={['click']} rootClassName="zi-child-dropdown">
          <button type="button">Layer commands</button>
        </Dropdown>
        <button type="button" onclick={updateOwner}>Raise layer</button>
      </Modal>
    {:else if scope === 'modal'}
      {@render modalOwner(overlays, zIndex)}
    {:else if scope === 'confirmation'}
      <ModalHolder {modal} />
    {:else if scope === 'drawer'}
      {@render drawerOwner(overlays, zIndex)}
    {:else if scope === 'tooltip'}
      <Tooltip open title={overlays} rootClassName="zi-owner-tooltip" {zIndex}>
        {@render tooltipTarget()}
      </Tooltip>
    {:else if scope === 'tooltip-trigger'}
      <Tooltip open title="Tooltip owner" rootClassName="zi-owner-tooltip" {zIndex}>
        <div>{@render overlays()}</div>
      </Tooltip>
    {:else if scope === 'popover'}
      <Popover open content={overlays} rootClassName="zi-owner-popover" {zIndex}>
        <button type="button">Popover owner</button>
      </Popover>
    {:else if scope === 'popconfirm'}
      <Popconfirm open title="Owner confirmation" description={overlays}
        rootClassName="zi-owner-popconfirm" {zIndex}>
        <button type="button">Popconfirm owner</button>
      </Popconfirm>
    {:else if scope === 'dropdown'}
      {@render dropdownOwner(ownerStyle)}
    {:else if scope === 'modal-dropdown'}
      {@render modalOwner(nestedDropdown, zIndex)}
    {:else if scope === 'modal-drawer'}
      {@render modalOwner(nestedDrawer, zIndex)}
    {:else if scope === 'drawer-modal'}
      {@render drawerOwner(nestedModal, zIndex)}
    {:else}
      {@render overlays()}
    {/if}

    {#if profile.update !== undefined}
      <button type="button" onclick={updateOwner} data-update-layer>Update owner layer</button>
    {/if}
    {#if cascade}
      <button type="button" onclick={() => { zIndex = 0; }}>Set zero layer</button>
      <button type="button" onclick={() => { zIndex = undefined; }}>Remove local layer</button>
    {/if}
  </ConfigProvider>
</section>
