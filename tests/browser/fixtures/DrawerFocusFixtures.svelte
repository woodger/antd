<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, Drawer, Modal, Popover, type DrawerConfig, type DrawerFocusableConfig,
    type DrawerMask, type DrawerProps
  } from '@woodger/antd';
  import reference from './ant-design-drawer-focus-reference.json';

  type Profile = (typeof reference.cases)[number]['profile'];
  type Id = 'a' | 'b';
  type Action = ['request', Id] | ['settled', Id, boolean];
  type Options = Pick<DrawerProps, 'autoFocus' | 'keyboard' | 'mask' | 'focusable'>;

  const profiles = new Map(reference.cases.map(({ profile }) => [profile.name, profile]));
  let { initialProfile = 'default', initialOpen = false }: {
    initialProfile?: string;
    initialOpen?: boolean;
  } = $props();

  let profile = $state.raw<Profile>(untrack(() => find(initialProfile)));
  let open = $state(untrack(() => initialOpen));
  let childOpen = $state(false);
  let mask = $state.raw<DrawerMask | undefined>(untrack(() => profile.local?.mask));
  let focusable = $state.raw<DrawerFocusableConfig | undefined>(untrack(() => profile.local?.focusable));
  let outsideClicks = $state(0);
  let events = $state<Action[]>([]);
  let custom = $state<HTMLDivElement>();
  let shadow = $state.raw<ShadowRoot>();
  let shadowEnabled = $state(false);
  let extraOverlays = $state(false);
  let cover = $state(false);

  const getContainer = $derived.by<DrawerProps['getContainer']>(() => {
    if (shadowEnabled) return () => shadow ?? document.body;
    if (profile.container === 'inline') return false;
    if (profile.container === 'custom') return () => custom ?? document.body;
    return undefined;
  });

  function find(name: string) {
    const result = profiles.get(name);
    if (!result) throw new Error(`Unknown Drawer focus profile ${name}`);
    return result;
  }

  function select(name: string) {
    profile = find(name);
    mask = profile.local?.mask;
    focusable = profile.local?.focusable;
    open = false;
    childOpen = false;
    outsideClicks = 0;
    events = [];
    shadowEnabled = false;
    extraOverlays = false;
  }

  function setOpen(id: Id, next: boolean) {
    if (id === 'a') {
      open = next;
    }
    else {
      childOpen = next;
    }
  }

  function installShadow(element: HTMLElement) {
    const root = element.attachShadow({ mode: 'open' });
    const document = element.ownerDocument;
    const styles = document.createElement('style');
    root.append(styles);

    function syncStyles() {
      styles.textContent = [...document.head.querySelectorAll('style')].map(node => node.textContent)
        .join('\n');
    }

    const observer = new MutationObserver(syncStyles);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    syncStyles();
    shadow = root;
    return () => observer.disconnect();
  }
</script>

{#snippet panel(id: Id, options?: Options, content?: Snippet)}
  {@const first = id === 'a'}
  <Drawer
    {...options}
    id={`${id}-root`}
    class={`study-drawer-${id}`}
    title={`Drawer ${id}`}
    bind:open={() => first ? open : childOpen, next => setOpen(id, next)}
    getContainer={first ? getContainer : undefined}
    destroyOnHidden
    onClose={() => events.push(['request', id])}
    afterOpenChange={next => events.push(['settled', id, next])}
  >
    <label>First {id}<input id={`${id}-first`} value="first" /></label>
    <label>Last {id}<input id={`${id}-last`} value="draft" /></label>
    {@render content?.()}
    {#if first && extraOverlays}
      {#snippet popupEditor()}<label>Portal editor<input id="portal-input" /></label>{/snippet}
      <Popover trigger="click" title="Portaled editor" content={popupEditor}
        getPopupContainer={() => document.body}>
        <button id="portal-trigger" type="button">Open portal</button>
      </Popover>
      <button id="modal-trigger" type="button" onclick={() => { cover = true; }}>Open modal</button>
      <Modal title="Covering modal" bind:open={cover}>
        <label>Modal editor<input id="modal-input" /></label>
      </Modal>
    {/if}
  </Drawer>
{/snippet}

{#snippet child()}{@render panel('b', profile.nested)}{/snippet}
{#snippet owner()}
  {@render panel('a', { ...profile.local, mask, focusable }, profile.nested ? child : undefined)}
{/snippet}

<section id="drawer-focus-fixture" style="min-height:1400px">
  <label>Drawer focus profile
    <select value={profile.name} onchange={event => select(event.currentTarget.value)}>
      {#each reference.cases as { profile }}<option value={profile.name}>{profile.name}</option>{/each}
    </select>
  </label>
  <button type="button" data-testid="open-child" onclick={() => { childOpen = true; }}>
    Open child
  </button>
  <button type="button" data-testid="close-child" onclick={() => { childOpen = false; }}>
    Close child
  </button>
  <button type="button" data-testid="close" onclick={() => { open = false; }}>Close owner</button>
  <button type="button" data-testid="mask-off" onclick={() => { mask = false; }}>Disable mask</button>
  <button type="button" data-testid="mask-on" onclick={() => { mask = true; }}>Enable mask</button>
  <button type="button" data-testid="trap-on" onclick={() => { focusable = { trap: true }; }}>
    Enable trap
  </button>
  <button type="button" data-testid="trap-off" onclick={() => { focusable = { trap: false }; }}>
    Disable trap
  </button>
  <button type="button" data-testid="use-shadow" onclick={() => { shadowEnabled = true; }}>
    Use shadow root
  </button>
  <button type="button" data-testid="use-extra" onclick={() => { extraOverlays = true; }}>
    Use extra overlays
  </button>
  <output data-testid="drawer-focus-events" hidden>{JSON.stringify(events)}</output>
  <output data-testid="outside-clicks" hidden>{outsideClicks}</output>
  <div id="focus-shadow" {@attach installShadow}></div>
  <button id="before" type="button" onclick={() => { open = true; }}>Open focus drawer</button>
  <button id="outside" type="button" onclick={() => { outsideClicks++; }}>Outside drawer</button>
  <div id="focus-host" bind:this={custom} style={'position:relative;'
    + 'min-height:320px'}>
    {#key profile.name}
      <ConfigProvider drawer={profile.provider} theme={{ token: { motion: false } }}>
        {#if profile.nestedProvider}
          <ConfigProvider drawer={profile.nestedProvider satisfies DrawerConfig}>{@render owner()}</ConfigProvider>
        {:else}
          {@render owner()}
        {/if}
      </ConfigProvider>
    {/key}
  </div>
  <button id="after" type="button">After drawer</button>
</section>
