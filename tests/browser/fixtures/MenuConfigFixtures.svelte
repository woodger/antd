<script lang="ts">
  import {
    ConfigProvider,
    Menu,
    type MenuClassNames,
    type MenuConfig,
    type MenuExpandIconInfo,
    type MenuItemType,
    type MenuMode,
    type MenuProps,
    type MenuStyles
  } from '@woodger/antd';

  let { kind: profile = 'inline' }: {
    kind?: 'inline' | 'vertical' | 'horizontal' | 'collapsed' | 'provider-only' | 'reset';
  } = $props();
  let updated = $state(false);
  let theme = $state<'light' | 'dark'>('light');
  let hideExpandIcon = $state(false);
  let manualPosition = $state(false);
  let host = $state<HTMLElement>();
  let menu = $state<HTMLUListElement>();
  let openKeys = $state(['parent', 'nested']);

  const items: MenuItemType[] = [
    { key: 'leaf', label: 'Leaf', class: 'x-leaf', style: 'padding-inline-start:29px', icon: leafIcon },
    { key: 'group', label: 'Group', type: 'group', class: 'x-group', children: [
      { key: 'group-child', label: 'Group child', class: 'x-group-child', icon: groupIcon }
    ] },
    { key: 'parent', label: 'Parent', class: 'x-parent', popupClassName: 'x-popup-parent',
      popupStyle: 'z-index:3021', icon: parentIcon, children: [
        { key: 'child', label: 'Child', class: 'x-child', icon: childIcon },
        { key: 'nested-group', label: 'Nested group', type: 'group', class: 'x-nested-group', children: [
          { key: 'nested-group-child', label: 'Nested group child', class: 'x-nested-group-child', icon: nestedGroupIcon }
        ] },
        { key: 'nested', label: 'Nested', class: 'x-nested', popupClassName: 'x-popup-nested',
          expandIcon: nestedExpand, children: [
            { key: 'grandchild', label: 'Grandchild', class: 'x-grandchild' }
          ] }
      ] }
  ];
  const calls: Record<string, unknown> = {};

  // Captures semantic callback arguments without changing reactive state from $derived.
  function capture(name: string, props: MenuProps) {
    calls[name] = {
      mode: props.mode ?? null,
      theme: props.theme,
      inlineCollapsed: props.inlineCollapsed ?? null,
      selectable: props.selectable ?? null,
      items: props.items === items,
      disabled: props.disabled ?? null
    };
  }

  let mode: MenuMode = $derived(profile === 'vertical' || profile === 'reset' ? 'vertical'
    : profile === 'horizontal' ? 'horizontal' : 'inline');
  let collapsed = $derived(profile === 'collapsed' ? true : undefined);
  let providerOnly = $derived(profile === 'provider-only');
  let innerMenu = $derived(profile === 'reset' ? {} : undefined);
  let localExpand = $derived(hideExpandIcon ? null : undefined);
  const provider: MenuConfig = {
    class: 'provider-menu',
    style: 'color:#222222;'
      + 'padding-block-end:9px',
    classNames({ props }) {
      capture('providerClasses', props);
      return {
        root: 'p-root',
        item: 'p-item',
        itemTitle: 'p-title',
        list: 'p-list',
        itemIcon: 'p-icon',
        itemContent: 'p-content',
        popup: 'p-popup',
        subMenu: {
          item: 'p-nested-item',
          itemTitle: 'p-nested-title',
          list: 'p-nested-list',
          itemIcon: 'p-nested-icon',
          itemContent: 'p-nested-content'
        }
      };
    },
    styles({ props }) {
      capture('providerStyles', props);
      return {
        root: 'color:#111111;'
          + 'background-color:#223344',
        itemTitle: 'font-weight:600',
        list: 'letter-spacing:1px',
        item: 'color:#112244;'
          + 'background-color:#dfefff',
        itemContent: 'font-weight:500',
        itemIcon: 'opacity:.5',
        popup: { root: 'color:#444444;'
          + 'opacity:.92;'
          + 'z-index:3022' },
        subMenu: {
          item: 'color:#223344;'
            + 'background-color:#ffeedd',
          itemContent: 'font-weight:600',
          itemTitle: 'letter-spacing:3px',
          list: 'color:#565656',
          itemIcon: 'opacity:.65'
        }
      };
    },
    expandIcon: providerExpand
  };
  const localClasses: NonNullable<MenuProps['classNames']> = ({ props }): MenuClassNames => {
    capture('localClasses', props);

    return {
      root: updated ? 'l-root-live' : 'l-root',
      list: 'l-list',
      itemTitle: 'l-title',
      item: 'l-item',
      itemIcon: 'l-icon',
      itemContent: 'l-content',
      popup: { root: 'l-popup' },
      subMenu: {
        item: 'l-nested-item',
        itemTitle: 'l-nested-title',
        list: 'l-nested-list',
        itemIcon: 'l-nested-icon',
        itemContent: 'l-nested-content'
      }
    };
  };
  const localStyles: NonNullable<MenuProps['styles']> = ({ props }): MenuStyles => {
    capture('localStyles', props);

    return {
      root: 'color:#333333;'
        + 'padding-inline-start:7px',
      item: 'color:#445566;'
        + 'padding-inline-start:21px',
      itemIcon: 'opacity:.6',
      itemContent: 'font-weight:700',
      popup: { root: [
        updated ? 'background-color:#776655' : 'background-color:#556677',
        'z-index:3023',
        manualPosition && (
          'left:640px;'
          + 'top:320px;'
          + 'max-width:212px'
        )
      ].filter(Boolean).join(';') },
      subMenu: { item: 'color:#334455', itemContent: 'color:#445566' }
    };
  };

  // The picture is read from Playwright after the end of the reactive update.
  function connectCalls(node: HTMLElement) {
    Object.defineProperty(node, 'menuConfigCalls', { value: calls });
  }

</script>

<style>
  section { max-width: 420px; }
</style>

{#snippet leafIcon()}L{/snippet}
{#snippet groupIcon()}G{/snippet}
{#snippet parentIcon()}P{/snippet}
{#snippet childIcon()}C{/snippet}
{#snippet nestedGroupIcon()}N{/snippet}
{#snippet providerExpand(info: MenuExpandIconInfo)}
  <span class="provider-expand">{info.isOpen ? '+' : '-'}</span>
{/snippet}
{#snippet nestedExpand(info: MenuExpandIconInfo)}
  <span class="provider-expand">item-{info.eventKey}</span>
{/snippet}

<section id="menu-config-fixture" bind:this={host} {@attach connectCalls}>
  <label><input type="checkbox" bind:checked={updated} /> Update menu styles</label>
  <label><input type="checkbox" bind:checked={manualPosition} /> Position menu popup</label>
  <label><input type="checkbox" bind:checked={hideExpandIcon} /> Hide menu expand icon</label>
  <label>Menu theme <select bind:value={theme}>
    <option value="light">Light</option><option value="dark">Dark</option>
  </select></label>
  <ConfigProvider theme={{ token: { motion: false } }} menu={provider}>
    <ConfigProvider menu={innerMenu}>
      <Menu
        {mode}
        {theme}
        {items}
        inlineCollapsed={collapsed}
        getPopupContainer={() => host ?? document.body}
        triggerSubMenuAction="click"
        {openKeys}
        onOpenChange={keys => { openKeys = keys; }}
        forceSubMenuRender
        class={providerOnly ? undefined : 'local-menu'}
        rootClassName={providerOnly ? undefined : 'local-root'}
        style={providerOnly ? undefined : 'color:#666666;'
          + 'padding-block-start:6px'}
        classNames={providerOnly ? undefined : localClasses}
        styles={providerOnly ? undefined : localStyles}
        expandIcon={localExpand}
        bind:nativeElement={menu}
        aria-label="Semantic menu"
      />
    </ConfigProvider>
  </ConfigProvider>
  <output aria-label="Menu config ref">{menu ? 'mounted' : 'pending'}</output>
</section>
