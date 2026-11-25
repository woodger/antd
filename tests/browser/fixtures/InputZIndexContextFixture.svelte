<script lang="ts">
  import { untrack } from 'svelte';
  import {
    AutoComplete, Cascader, ConfigProvider, DatePicker, Dropdown, Mentions, Modal, Select,
    TimePicker, TimeRangePicker, Tooltip, TreeSelect, type ThemeConfig
  } from '@woodger/antd';
  import source from './ant-design-input-z-index-context-reference.json';

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'root' }: { profileId?: string; } = $props();
  const profile = untrack(() =>
    source.cases.find(entry => entry.profile.id === profileId)?.profile ?? source.cases[0].profile);
  const keyboard = untrack(() => profileId === 'keyboard');
  const theme: ThemeConfig = { token: { motion: false, zIndexPopupBase: profile.base ?? 1000 } };
  const options = [{ value: 'one', label: 'One' }];
  const treeData = [{ value: 'one', title: 'One' }];
  const popupStyle = profile.local === undefined ? undefined : `z-index:${profile.local}`;
  const hasSelectLayer = profile.local !== undefined || profile.empty !== undefined;
  const selectZIndex = profile.empty === 'null' ? null : profile.local;
  const selectStyles = hasSelectLayer ? { popup: { root: { zIndex: selectZIndex } } } : undefined;
  const popupStyles = popupStyle === undefined ? undefined : { popup: { root: popupStyle } };
  let layer = $state(untrack(() => keyboard ? 1500 : profile.initial));
  let dialogOpen = $state(false);
  let portal = $state<HTMLDivElement>();
  let timeLayer = $state(false);
  let timeStyles = $derived(timeLayer
    ? { popup: { root: 'z-index:0 !important' } } : undefined);

  /** Меняет слой владельца, сохраняя state всех открытых редакторов и списков. */
  function updateOwner() {
    layer = keyboard ? 1700 : profile.update ?? undefined;
  }

  /** Помещает панель рядом с полем внутри native dialog. */
  function getTimeContainer(trigger: HTMLElement) {
    return portal ?? trigger;
  }
</script>

{#snippet selectPopup(menu: import('svelte').Snippet)}
  <div>
    {@render menu()}
    <Tooltip open title="Input hint" rootClassName="zi-input-tip">
      <button type="button">Hint</button>
    </Tooltip>
  </div>
{/snippet}

{#snippet controls()}
  <div class="input-layer-grid">
    <Select open {options} virtual={false} styles={selectStyles} popupRender={() => selectPopup}
      classNames={{ popup: { root: 'zi-select' } }} />
    <AutoComplete open {options} styles={selectStyles}
      classNames={{ popup: { root: 'zi-autocomplete' } }} />
    <TreeSelect open {treeData} styles={popupStyles}
      classNames={{ popup: { root: 'zi-tree-select' } }} />
    <Cascader open {options} styles={popupStyles}
      classNames={{ popup: { root: 'zi-cascader' } }} />
    <Mentions aria-label="Layer mentions" {options} popupClassName="zi-mentions-popup" />
    <DatePicker open styles={popupStyles} classNames={{ popup: { root: 'zi-date' } }} />
    <DatePicker.RangePicker open styles={popupStyles}
      classNames={{ popup: { root: 'zi-range' } }} />
    <TimePicker open styles={popupStyles} classNames={{ popup: { root: 'zi-time' } }} />
    <TimeRangePicker open styles={popupStyles}
      classNames={{ popup: { root: 'zi-time-range' } }} />
  </div>
{/snippet}

<section id="input-z-index-context-fixture">
  <ConfigProvider {theme}>
    {#if keyboard}
      <button type="button" onclick={() => { dialogOpen = true; }}>Open input layers</button>
      <Modal bind:open={dialogOpen} title="Input layers" getContainer={false} footer={null}
        zIndex={layer}>
        <TimeRangePicker format="HH:mm" placeholder={['Layer start', 'Layer end']}
          classNames={{ popup: { root: 'zi-keyboard-time' } }} styles={timeStyles}
          getPopupContainer={getTimeContainer} />
        <div bind:this={portal} data-input-layer-portal></div>
        <button type="button" onclick={updateOwner}>Raise layer</button>
        <button type="button" onclick={() => { timeLayer = !timeLayer; }}>Toggle local layer</button>
      </Modal>
    {:else if profile.owner === 'modal'}
      <Modal open title="Modal" getContainer={false} footer={null} zIndex={layer}>
        {@render controls()}
      </Modal>
    {:else if profile.owner === 'tooltip'}
      <Tooltip open title="Owner" zIndex={layer}>
        <div>{@render controls()}</div>
      </Tooltip>
    {:else if profile.owner === 'modal-dropdown'}
      <Modal open title="Modal" getContainer={false} footer={null} zIndex={layer}>
        <Dropdown open menu={{ items: [] }} popupRender={controls}>
          <button type="button">Open</button>
        </Dropdown>
      </Modal>
    {:else}
      {@render controls()}
    {/if}
    {#if profile.update !== undefined}
      <button type="button" onclick={updateOwner} data-update-input-layer>Update owner layer</button>
    {/if}
  </ConfigProvider>
</section>

<style>
  .input-layer-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
    width: min(100%, 760px);
  }
</style>
