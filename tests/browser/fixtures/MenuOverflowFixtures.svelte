<script lang="ts">
  import {
    ConfigProvider,
    Menu,
    type MenuItemType,
    type MenuMode,
    type MenuProps
  } from '@woodger/antd';

  let width = $state(420);
  let mode = $state<MenuMode>('horizontal');
  let indicator = $state('default');
  let rtl = $state(false);
  let prefixed = $state(false);
  let disabledOverflow = $state(false);
  let forceSubMenuRender = $state(false);
  let addItem = $state(false);
  let grouped = $state(false);
  let mounted = $state(true);
  let popupHost = $state<HTMLDivElement>();
  let instance = $state<Menu>();
  let events = $state<unknown[][]>([]);

  const items: MenuItemType[] = [
    { key: 'first', label: 'First', style: 'width:80px', class: 'sample-first' },
    {
      key: 'blocked', label: 'Blocked', style: 'width:96px', disabled: true,
      class: 'sample-blocked'
    },
    {
      key: 'branch', label: 'Branch', style: 'width:104px', class: 'sample-branch',
      children: [
        { key: 'nested', label: 'Nested', class: 'sample-nested' },
        {
          key: 'inner', label: 'Inner', class: 'sample-inner',
          children: [{ key: 'leaf', label: leafLink, class: 'sample-leaf' }]
        }
      ]
    },
    { key: 'last', label: 'Last', style: 'width:76px', class: 'sample-last' }
  ];
  const additional: MenuItemType = {
    key: 'added', label: 'Added', style: 'width:88px', class: 'sample-added'
  };
  const groups: MenuItemType[] = [
    items[0],
    {
      type: 'group', key: 'group', label: 'Group', class: 'sample-group',
      children: [
        { key: 'g1', label: 'G1', style: 'width:40px', class: 'sample-g1' },
        { key: 'g2', label: 'G2', style: 'width:48px', class: 'sample-g2' }
      ]
    },
    { type: 'divider', key: 'divider', class: 'sample-divider', style: 'width:15px' },
    ...items.slice(2)
  ];
  let sourceItems = $derived(grouped ? groups : items);
  let currentItems = $derived(addItem
    ? [sourceItems[0], additional, ...sourceItems.slice(1)] : sourceItems);

  let indicatorProps = $derived.by<Pick<MenuProps, 'overflowedIndicator'>>(() => {
    switch (indicator) {
      case 'custom': return { overflowedIndicator: customIndicator };
      case 'undefined': return { overflowedIndicator: undefined };
      case 'null': return { overflowedIndicator: null };
      default: return {};
    }
  });
</script>

{#snippet customIndicator()}
  <span class="custom-rest" style={'display:inline-block;'
    + 'width:48px'}>More</span>
{/snippet}
{#snippet leafLink()}<a href="#menu-overflow-destination">Leaf</a>{/snippet}

<section id="menu-overflow-fixture">
  <label>Menu width <input type="number" bind:value={width} /></label>
  <label>Menu mode <select bind:value={mode}>
    <option value="horizontal">Horizontal</option>
    <option value="vertical">Vertical</option>
    <option value="inline">Inline</option>
  </select></label>
  <label>Menu indicator <select bind:value={indicator}>
    <option value="default">Default</option>
    <option value="custom">Custom</option>
    <option value="undefined">Undefined</option>
    <option value="null">Null</option>
  </select></label>
  <label><input type="checkbox" bind:checked={rtl} /> Menu RTL</label>
  <label><input type="checkbox" bind:checked={prefixed} /> Menu custom prefix</label>
  <label><input type="checkbox" bind:checked={disabledOverflow} /> Disable menu overflow</label>
  <label><input type="checkbox" bind:checked={forceSubMenuRender} /> Force submenu render</label>
  <label><input type="checkbox" bind:checked={addItem} /> Add menu item</label>
  <label><input type="checkbox" bind:checked={grouped} /> Group menu items</label>
  <label><input type="checkbox" bind:checked={mounted} /> Mount overflow menu</label>
  <button type="button" onclick={() => instance?.focus()}>Focus overflow menu</button>
  <button type="button" onclick={() => instance?.findItem({ key: 'last' })?.focus()}>
    Focus last menu item
  </button>

  <ConfigProvider direction={rtl ? 'rtl' : 'ltr'} prefixCls={prefixed ? 'shell' : undefined}
    theme={{ token: { motion: false } }}>
    {#if mounted}
      <Menu {...indicatorProps} {mode} {disabledOverflow} {forceSubMenuRender}
        prefixCls={prefixed ? 'navigation' : undefined} items={currentItems}
        classNames={{ item: 'slot-first', subMenu: { item: 'slot-nested' } }}
        style={`width:${width}px;`
          + `position:relative`} aria-label="Overflow menu"
        overflowedIndicatorPopupClassName="custom-overflow-popup"
        defaultSelectedKeys={['last']}
        triggerSubMenuAction="click"
        getPopupContainer={() => popupHost ?? document.body}
        bind:this={instance}
        onOpenChange={keys => events.push(['open', keys])}
        onClick={info => events.push(['click', info.key, info.keyPath, info.itemData.key])}
        onSelect={info => events.push(['select', info.selectedKeys])} />
    {/if}
  </ConfigProvider>
  <div id="menu-overflow-popups" bind:this={popupHost}></div>
  <p id="menu-overflow-destination">Destination</p>
  <output aria-label="Menu overflow events">{JSON.stringify(events)}</output>
</section>
