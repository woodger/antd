<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    ColorPicker, ConfigProvider, Drawer, Dropdown, FloatButton, FloatButtonBackTop,
    FloatButtonGroup, Image, ImagePreviewGroup, Modal, Table, Tooltip, Tour,
    type TableColumn, type ThemeConfig
  } from '@woodger/antd';
  import source from './ant-design-auxiliary-z-index-context-reference.json';

  const query = new URLSearchParams(globalThis.location?.search);
  let { profileId = query.get('profile') ?? 'root' }: { profileId?: string; } = $props();
  const profile = untrack(() =>
    source.cases.find(entry => entry.profile.id === profileId)?.profile ?? source.cases[0].profile);
  const keyboard = untrack(() => profileId === 'palette');
  const theme: ThemeConfig = {
    token: { motion: false, zIndexPopupBase: profile.base ?? 1000 },
    components: {
      ...(profile.dropdownZIndex === undefined ? {} : {
        Dropdown: { zIndexPopup: profile.dropdownZIndex }
      }),
      ...(profile.imageZIndex === undefined ? {} : { Image: { zIndexPopup: profile.imageZIndex } })
    }
  };
  const asset = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">'
    + '<rect width="16" height="16" fill="navy"/></svg>'
  );
  const localStyle = profile.child === undefined ? undefined : `z-index:${profile.child}`;
  const colorStyles = { popup: { root: localStyle } };
  const tableData = [{ key: 'one', text: 'One' }];
  type Row = (typeof tableData)[number];
  const defaultColumn: TableColumn<Row> = {
    key: 'text',
    dataIndex: 'text',
    title: 'Text',
    filters: [{ text: 'One', value: 'one' }],
    onFilter: (value, row) => row.text === value,
    filterIcon: tableTriggerTip
  };
  const customColumn: TableColumn<Row> = {
    key: 'text',
    dataIndex: 'text',
    title: 'Text',
    filterDropdown: tableContent,
    filterDropdownProps: { open: true, rootClassName: 'zi-table-filter', styles: { root: localStyle } }
  };
  let ownerLayer = $state(untrack(() => keyboard ? 1500 : profile.initial));
  let paletteLayer = $state(false);
  let portal = $state<HTMLDivElement>();
  const paletteStyles = $derived(paletteLayer
    ? { popup: { root: 'z-index:0 !important' } } : undefined);

  /** Переводит открытые поверхности на новый уровень уже показанного владельца. */
  function updateOwner() {
    ownerLayer = keyboard ? 1700 : profile.update;
  }

  /** Переносит палитру в соседний узел внутри того же нативного диалога. */
  function getPaletteContainer(trigger: HTMLElement) {
    return portal ?? trigger;
  }
</script>

{#snippet tourTip()}
  <Tooltip open title="Tour hint" rootClassName="zi-tour-tooltip">
    <button type="button">Tour hint</button>
  </Tooltip>
{/snippet}

{#snippet colorPanel(panel: Snippet)}
  <div>
    {@render panel()}
    <Tooltip open title="Color hint" rootClassName="zi-color-tooltip">
      <button type="button">Color hint</button>
    </Tooltip>
  </div>
{/snippet}

{#snippet imageActions(actions: Snippet)}
  <div>
    {@render actions()}
    <Tooltip open title="Image hint" rootClassName="zi-image-tooltip">
      <button type="button">Image hint</button>
    </Tooltip>
  </div>
{/snippet}

{#snippet tableContent()}
  <Tooltip open title="Filter content" rootClassName="zi-table-tooltip">
    <button type="button">Filter content</button>
  </Tooltip>
{/snippet}

{#snippet tableTriggerTip()}
  <Tooltip open title="Filter trigger" rootClassName="zi-table-icon-tooltip">
    <span>Filter trigger</span>
  </Tooltip>
{/snippet}

{#snippet surfaces()}
  <Tour open class="zi-tour" zIndex={profile.child}
    steps={[{ target: null, title: 'Tour', description: tourTip }]} />
  <ColorPicker open classNames={{ popup: { root: 'zi-color' } }} styles={colorStyles}
    panelRender={colorPanel} />
  <FloatButton class="zi-float" style={localStyle}
    tooltip={{ open: true, title: 'Float', rootClassName: 'zi-float-tooltip' }} />
  <FloatButton class="zi-float-semantic" styles={{ root: 'z-index:1660' }} style={localStyle} />
  <FloatButtonGroup class="zi-float-group" style={localStyle} trigger="click" open>
    <FloatButton class="zi-float-item" />
  </FloatButtonGroup>
  <FloatButtonBackTop class="zi-float-back-top" style={localStyle} visibilityHeight={0} />
  <Image src={asset} alt="Image" width={32} classNames={{ popup: { root: 'zi-image' } }}
    preview={{ open: true, focusTrap: false, zIndex: profile.child, actionsRender: imageActions }} />
  <ImagePreviewGroup items={[asset]} classNames={{ popup: { root: 'zi-image-group' } }}
    preview={{ open: true, focusTrap: false, zIndex: profile.child }} />
  <Table dataSource={tableData} columns={[customColumn]} pagination={false} />
  <Table rootClassName="zi-table-default" dataSource={tableData} columns={[defaultColumn]}
    pagination={false} />
{/snippet}

{#snippet paletteEditor(panel: Snippet)}
  <div>
    {@render panel()}
    <input aria-label="Palette draft" />
  </div>
{/snippet}

<section id="auxiliary-z-index-context-fixture">
  <ConfigProvider {theme}>
    {#if keyboard}
      <Modal open title="Layer owner" getContainer={false} footer={null} zIndex={ownerLayer}>
        <ColorPicker classNames={{ popup: { root: 'zi-keyboard-palette' } }}
          panelRender={paletteEditor} styles={paletteStyles} getPopupContainer={getPaletteContainer} />
        <div bind:this={portal} data-palette-portal></div>
        <button type="button" onclick={updateOwner}>Raise owner layer</button>
        <button type="button" onclick={() => { paletteLayer = !paletteLayer; }}>
          Toggle palette layer
        </button>
      </Modal>
    {:else if profile.owner === 'modal'}
      <Modal open title="Modal" getContainer={false} footer={null} zIndex={ownerLayer}>
        {@render surfaces()}
      </Modal>
    {:else if profile.owner === 'drawer'}
      <Drawer open title="Drawer" getContainer={false} zIndex={ownerLayer}>
        {@render surfaces()}
      </Drawer>
    {:else if profile.owner === 'dropdown'}
      <Dropdown open menu={{ items: [] }} popupRender={surfaces}
        styles={{ root: ownerLayer === undefined ? undefined : `z-index:${ownerLayer}` }}>
        <button type="button">Open</button>
      </Dropdown>
    {:else}
      {@render surfaces()}
    {/if}
    {#if profile.update !== undefined}
      <button type="button" onclick={updateOwner} data-update-auxiliary-layer>Update layer</button>
    {/if}
  </ConfigProvider>
</section>
