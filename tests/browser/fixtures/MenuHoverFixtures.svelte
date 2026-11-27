<script lang="ts">
  // Submits the same disabled/portal props to public Menu and records real mouse events.
  import { ConfigProvider, Menu, type MenuHoverEventHandler, type MenuItem,
    type MenuItemType, type MenuMode } from '@woodger/antd';
  import reference from './ant-design-menu-hover-reference.json';
  import portals from './ant-design-menu-hover-portal-reference.json';
  import horizontal from './ant-design-menu-hover-horizontal-reference.json';

  type HoverProfile = {
    id: string;
    mode: MenuMode;
    destination?: string;
    direction?: 'ltr' | 'rtl';
    trigger: 'hover' | 'click';
    nested?: boolean;
    overflow?: boolean;
    width?: number;
    disabledMenu?: boolean;
    disabledBranch?: boolean;
    disabledLeaf?: boolean;
  };
  let { providerDirection, requestedDirection }: {
    providerDirection?: 'ltr' | 'rtl';
    requestedDirection?: 'ltr' | 'rtl';
  } = $props();

  const profiles: HoverProfile[] = [
    ...reference.passes[0].map(({ profile }) => ({
      ...profile, mode: profile.mode === 'vertical' ? 'vertical' as const : 'inline' as const,
      trigger: 'hover' as const
    })),
    ...portals.passes[0].map(({ profile }) => ({
      ...profile, id: `portal-${profile.id}`, disabledMenu: profile.disabled,
      mode: profile.mode === 'vertical' ? 'vertical' as const : 'inline' as const,
      direction: profile.direction === 'rtl' ? 'rtl' as const : undefined,
      trigger: 'click' as const
    })),
    ...horizontal.passes[0].map(({ id, inPopup }) => ({
      id, mode: 'horizontal' as const, trigger: 'click' as const, overflow: inPopup,
      width: inPopup ? 185 : 420
    }))
  ];
  let sample = $state(profiles[0].id);
  const profile = $derived(profiles.find(value => value.id === sample) ?? profiles[0]);
  let version = $state(0);
  let mounted = $state(true);
  let host = $state<HTMLDivElement>();
  let shadow = $state<ShadowRoot>();
  const items = $derived(buildItems(profile, version));
  const openKeys = $derived(profile.overflow ? ['rc-menu-more', 'branch']
    : profile.nested ? ['branch', 'nested'] : ['branch']);
  let events = $state<unknown[]>([]);
  let clicked = $state<unknown>(null);

  // Links recordings to a version of a custom handler without changing string keys.
  function record(name: string, version: number): MenuHoverEventHandler {
    return ({ key, domEvent }) => {
      const target = domEvent.currentTarget;
      events.push({ name, key, version, event: domEvent.type, native: domEvent instanceof MouseEvent,
        tag: target instanceof HTMLElement ? target.tagName : null,
        role: target instanceof HTMLElement ? target.getAttribute('role') : null });
    };
  }

  // The same record checks the projection of data-* and form itemData in the callback.
  function buildItems(profile: HoverProfile, version: number): MenuItemType[] {
    const payload = { customPayload: { ord: 2 } };
    const leaf: MenuItem = {
      ...payload, key: 4, label: leafLabel, disabled: profile.disabledLeaf,
      'data-extra-token': version ? 91 : 42, 'data-extra-flag': false, 'data-extra-name': 'sample',
      'data-item-token': 'kept',
      'data-menu-id': 'authored-marker',
      onMouseEnter: record('leaf-enter', version), onMouseLeave: record('leaf-leave', version)
    };
    const nested = {
      key: 'nested', label: nestedLabel, children: [leaf],
      onMouseEnter: record('nested-enter', version), onMouseLeave: record('nested-leave', version),
      onTitleMouseEnter: record('nested-title-enter', version),
      onTitleMouseLeave: record('nested-title-leave', version)
    };
    const branch = {
      key: 'branch', label: branchLabel, disabled: profile.disabledBranch,
      rootClassName: 'own-branch-class', children: profile.nested ? [nested] : [leaf],
      onMouseEnter: record('branch-enter', version), onMouseLeave: record('branch-leave', version),
      onTitleMouseEnter: record('branch-title-enter', version),
      onTitleMouseLeave: record('branch-title-leave', version)
    };
    if (profile.mode === 'horizontal') {
      return [
        { key: 'first', label: 'First', style: 'width:80px' },
        { key: 'blocked', label: 'Blocked', disabled: true, style: 'width:96px' },
        { ...branch, style: 'width:104px' },
        { key: 'other', label: otherLabel, style: 'width:76px' }
      ];
    }
    return [branch, { key: 'other', label: otherLabel }];
  }

  // Changes the original scenario and clears the magazine between independent runs.
  function selectProfile(event: Event & { currentTarget: HTMLSelectElement; }) {
    sample = event.currentTarget.value;
    version = 0;
    events = [];
    clicked = null;
    mounted = true;
  }

  // Transmits CSS to isolated ShadowRoot for this hit testing.
  function connectShadow(element: HTMLDivElement) {
    const root = element.attachShadow({ mode: 'open' });
    const style = element.ownerDocument.createElement('style');
    root.append(style);

    // Copies the styles of the test bench, including the late Svelte styles.
    function syncStyle() {
      const css = Array.from(element.ownerDocument.head.querySelectorAll('style'))
        .map(node => node.textContent).join('\n');
      if (style.textContent !== css) style.textContent = css;
    }

    const observer = new MutationObserver(syncStyle);
    observer.observe(element.ownerDocument.head, {
      childList: true, subtree: true, characterData: true
    });
    syncStyle();
    shadow = root;
    return () => observer.disconnect();
  }

  // Getter is waiting for the target associated with the current fixture and preserves type ShadowRoot.
  function getContainer(trigger: HTMLElement) {
    return (profile.destination === 'shadow' ? shadow : host) ?? trigger.ownerDocument.body;
  }
</script>

{#snippet branchLabel()}<span data-testid="hover-branch">Branch</span>{/snippet}
{#snippet nestedLabel()}<span data-testid="hover-nested">Nested</span>{/snippet}
{#snippet leafLabel()}<span data-testid="hover-leaf">Leaf</span>{/snippet}
{#snippet otherLabel()}<span data-testid="hover-other">Other</span>{/snippet}

<section id="menu-hover-fixture">
  <label>Menu hover sample <select value={sample} onchange={selectProfile}>
    {#each profiles as option (option.id)}<option value={option.id}>{option.id}</option>{/each}
  </select></label>
  <button type="button" onclick={() => { version++; }}>Replace menu hover callbacks</button>
  <button type="button" onclick={() => { mounted = false; }}>Unmount hover menu</button>
  <output hidden aria-label="Menu hover events">{JSON.stringify(events)}</output>
  <output hidden aria-label="Menu hover selection">{JSON.stringify(clicked)}</output>
  <div bind:this={host} data-testid="hover-container"></div>
  <div {@attach connectShadow} data-testid="hover-shadow"></div>
  <div style={`width:${profile.width ?? 220}px;`
    + `margin:80px 0 0 330px`}>
    {#if mounted}
      {#key sample}
        <ConfigProvider direction={providerDirection ?? profile.direction}
          theme={{ token: { motion: false } }}>
          <Menu {items} aria-label="Hover menu" mode={profile.mode} direction={requestedDirection}
            disabled={profile.disabledMenu}
            tooltip={false} selectable={false} {openKeys}
            triggerSubMenuAction={profile.trigger} subMenuOpenDelay={0} subMenuCloseDelay={0}
            getPopupContainer={profile.destination === 'default' || !profile.destination
              ? undefined : getContainer}
            onClick={info => {
              clicked = { key: info.key, keyPath: info.keyPath, itemData: info.itemData,
                hoverCallbackKeys: Object.keys(info.itemData).filter(name => /^onMouse/.test(name)) };
            }} />
        </ConfigProvider>
      {/key}
    {/if}
  </div>
</section>
