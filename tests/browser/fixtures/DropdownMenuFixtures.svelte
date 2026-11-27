<script lang="ts">
  // Verifies public menu options and the observed callback order between Dropdown and Menu.
  import {
    ConfigProvider, Dropdown, type DropdownMenuClickInfo, type DropdownMenuEntry,
    type DropdownMenuProps, type DropdownSlots, type MenuSelectInfo
  } from '@woodger/antd';
  import { untrack } from 'svelte';
  import reference from './ant-design-dropdown-menu-reference.json';

  interface Profile {
    id: string;
    nested?: boolean;
    portal?: boolean;
    shadow?: boolean;
    link?: boolean;
    force?: boolean;
    controlled?: boolean;
    preventDefault?: boolean;
    selectable?: boolean;
    multiple?: boolean;
    liveActive?: boolean;
    semantics?: boolean;
    direction?: string;
    autoFocus?: boolean;
    external?: boolean;
  }

  const profiles: Profile[] = [
    ...reference.passes[0].map(sample => sample.profile),
    { id: 'shadow-portal', nested: true, portal: true, shadow: true, force: true },
    { id: 'nested-link', nested: true, link: true, force: true },
    { id: 'external-autofocus', nested: true, external: true, autoFocus: true, liveActive: true }
  ];
  let { initial = profiles[0].id, startOpen = false }: {
    initial?: string;
    startOpen?: boolean;
  } = $props();
  let current = $state(untrack(() => initial));
  const profile = $derived(profiles.find(item => item.id === current) ?? profiles[0]);
  let ownerOpen = $state(false);
  let activeKey = $state<string | undefined>('omega');
  let menuPrefix = $state('custom-nested');
  let fontSize = $state(17);
  let mounted = $state(true);
  let holdClose = false;
  let host = $state<HTMLDivElement>();
  let shadowRoot = $state<ShadowRoot>();
  let events = $state<unknown[][]>([]);
  let lastInfo: DropdownMenuClickInfo | undefined;
  let sharedInfo = $state(true);
  const theme = { token: { motion: false } };
  const classes: DropdownSlots = {
    root: 'source-dropdown', item: 'dropdown-item', itemTitle: 'dropdown-item-title',
    itemContent: 'dropdown-item-content'
  };

  const items = $derived<DropdownMenuEntry[]>(buildItems(profile));
  const menu = $derived<DropdownMenuProps>({
    id: 'source-menu', items,
    selectable: profile.selectable, multiple: profile.multiple,
    triggerSubMenuAction: 'click', subMenuOpenDelay: 0, subMenuCloseDelay: 0,
    forceSubMenuRender: profile.force,
    activeKey: profile.liveActive ? activeKey : undefined,
    onOpenChange: keys => events.push(['branches', keys]),
    onClick: info => {
      if (profile.controlled) holdClose = true;
      sharedInfo &&= lastInfo === info;
      record('menu-click', info);
    },
    onSelect: info => record('select', info),
    onDeselect: info => record('deselect', info),
    ...profile.portal ? { getPopupContainer: getSubmenuHost } : {},
    ...profile.semantics ? {
      mode: 'horizontal', prefixCls: menuPrefix, class: 'menu-plain-class',
      classNames: { item: 'menu-local-item', root: 'menu-local-root' },
      styles: { item: 'font-size:28px' }
    } : {}
  });

  // Complements the journal only with public data and the type of native event.
  function record(kind: string, info: DropdownMenuClickInfo | MenuSelectInfo) {
    const selected = 'selectedKeys' in info ? info.selectedKeys : undefined;
    events.push([kind, info.key, info.keyPath, info.domEvent.type,
      info.domEvent.defaultPrevented, selected ?? null]);
  }

  // Two implementations receive the same keys and observed team events.
  function buildItems(sample: Profile): DropdownMenuEntry[] {
    function command(key: string | number, label: string, disabled = false): DropdownMenuEntry {
      return {
        key, label, disabled,
        href: sample.link && key === 4 ? '#dropdown-nested-link' : undefined,
        'data-menu-payload': 'command-' + key,
        onClick: info => {
          lastInfo = info;
          record('item-click', info);
          if (sample.preventDefault) info.domEvent.preventDefault();
        }
      };
    }

    const result = [command('alpha', 'Alpha'), command('blocked', 'Blocked', true)];
    if (sample.nested) {
      result.push({
        key: 'branch', label: 'Branch', children: [command(4, 'Leaf')],
        onClick: info => {
          sharedInfo &&= lastInfo === info;
          record('branch-click', info);
        },
        onTitleClick: ({ key, domEvent }) => events.push(['title-click', key, domEvent.type])
      });
    }
    result.push({ type: 'divider', key: 'line', dashed: true }, command('omega', 'Omega'));
    return result;
  }

  // A managed script accepts the trigger and rejects the closing request from the team.
  function getOpen() {
    return profile.controlled || profile.external ? ownerOpen : undefined;
  }

  function setOpen(next: boolean | undefined) {
    if (next !== undefined && (profile.controlled || profile.external) && !holdClose) {
      ownerOpen = next;
    }
  }

  function selectProfile(event: Event & { currentTarget: HTMLSelectElement; }) {
    current = event.currentTarget.value;
    ownerOpen = false;
    activeKey = 'omega';
    mounted = true;
    holdClose = false;
    menuPrefix = 'custom-nested';
    fontSize = 17;
    events = [];
    lastInfo = undefined;
    sharedInfo = true;
  }

  function getSubmenuHost() {
    const target = profile.shadow ? shadowRoot : host;
    if (!target) throw new Error('Missing submenu portal host');
    return target;
  }

  // Just like an external consumer, connects the styles into the open ShadowRoot.
  function connectShadow(element: HTMLDivElement) {
    const root = element.attachShadow({ mode: 'open' });
    shadowRoot = root;
    const style = element.ownerDocument.createElement('style');
    root.append(style);

    function updateStyle() {
      const sheets = element.ownerDocument.head.querySelectorAll('style');
      const css = Array.from(sheets, sheet => sheet.textContent).join('\n');
      if (style.textContent !== css) style.textContent = css;
    }

    updateStyle();
    const observer = new MutationObserver(updateStyle);
    observer.observe(element.ownerDocument.head, { subtree: true, childList: true });
    return () => {
      observer.disconnect();
      style.remove();
      shadowRoot = undefined;
    };
  }
</script>

<style>
  .case { margin: 70px 10%; }
</style>

<label for="dropdown-menu-profile">Dropdown menu profile</label>
<select id="dropdown-menu-profile" value={current} onchange={selectProfile}>
  {#each profiles as sample (sample.id)}<option value={sample.id}>{sample.id}</option>{/each}
</select>
<button type="button" onclick={() => { activeKey = 'alpha'; }}>Activate Alpha</button>
<button type="button" onclick={() => { activeKey = undefined; }}>Release active key</button>
<button type="button" onclick={() => { ownerOpen = true; }}>Open externally</button>
<button type="button" onclick={() => { ownerOpen = false; }}>Close externally</button>
<button type="button" onclick={() => { menuPrefix = 'changed-nested'; fontSize = 19; }}>
  Change Dropdown menu styling
</button>
<button type="button" onclick={() => { mounted = false; }}>Unmount Dropdown</button>
<div class="case">
  {#key current}
    {#if mounted}<ConfigProvider direction={profile.direction === 'rtl' ? 'rtl' : undefined} {theme}
      menu={profile.semantics
        ? { classNames: { root: 'provider-root', item: 'provider-item' } } : undefined}>
      <Dropdown {menu} aria-label="Commands menu" trigger="click" autoFocus={profile.autoFocus}
        defaultOpen={startOpen}
        prefixCls={profile.semantics ? 'custom-dropdown' : undefined}
        classNames={classes} styles={profile.semantics ? { item: `font-size:${fontSize}px` } : undefined}
        onOpenChange={(next, info) => events.push(['dropdown', next, info])}
        bind:open={getOpen, setOpen}>
        <button type="button" onclick={() => { holdClose = false; }}>Commands</button>
      </Dropdown>
    </ConfigProvider>{/if}
  {/key}
</div>
<div id="submenu-host" bind:this={host}></div>
<div id="submenu-shadow" {@attach connectShadow}></div>
<button type="button" id="outside-dropdown-menu">Outside</button>
<button type="button" id="dropdown-nested-link">Link destination</button>
<output hidden id="dropdown-menu-events">{JSON.stringify(events)}</output>
<output hidden id="dropdown-menu-shared-info">{String(sharedInfo)}</output>
