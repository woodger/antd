<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider, Drawer, type DrawerPlacement, type DrawerPushConfig,
    type DrawerResizableConfig, type DrawerSize
  } from '@woodger/antd';
  import reference from './ant-design-drawer-geometry-reference.json';

  type Id = 'a' | 'b' | 'c';
  type Profile = (typeof reference.cases)[number]['profile'];
  type Action = ['start' | 'resize' | 'end', number] | ['settled', Id, boolean, boolean];
  const ids = ['a', 'b', 'c'] as const;
  const profiles = new Map(reference.cases.map(({ profile }) => [profile.name, profile]));
  let { initialProfile = 'lifecycle-lazy' }: { initialProfile?: string; } = $props();
  let profile = $state.raw<Profile>(untrack(() => findProfile(initialProfile)));
  let open = $state({ a: initialOpen(untrack(() => profile)), b: false, c: false });
  let size = $state<DrawerSize | undefined>(untrack(() => profile.size));
  let resizeEnabled = $state(true);
  let renderFirst = $state(true);
  let events = $state<Action[]>([]);

  function findProfile(name: string) {
    const result = profiles.get(name);
    if (!result) {
      throw new Error(`Unknown Drawer profile ${name}`);
    }

    return result;
  }

  function initialOpen(next: Profile) {
    return next.initialOpen ?? next.mode !== 'lifecycle';
  }

  function placement(value: string): DrawerPlacement {
    return value === 'left' || value === 'top' || value === 'bottom' ? value : 'right';
  }

  function select(name: string) {
    const next = findProfile(name);
    profile = next;
    open = { a: initialOpen(next), b: false, c: false };
    size = next.size;
    resizeEnabled = true;
    renderFirst = true;
    events = [];
  }

  function resize(next: number) {
    events.push(['resize', next]);
    if (profile.accept) size = next;
  }

  function settled(id: Id, next: boolean) {
    const draft = document.getElementById(`geometry-draft-${id}`);
    events.push(['settled', id, next, Boolean(draft)]);
  }

  const drag: DrawerResizableConfig = {
    onResizeStart: start => events.push(['start', start]),
    onResize: resize,
    onResizeEnd: end => events.push(['end', end])
  };
</script>

{#snippet drawer(
  id: Id,
  side: DrawerPlacement,
  push?: boolean | DrawerPushConfig,
  nested?: Snippet
)}
  {@const first = id === 'a'}
  <Drawer
    prefixCls={profile.draggerSize ? 'geometry-panel' : undefined}
    id={`geometry-drawer-${id}`}
    class={`study-drawer-${id}`}
    title={`Drawer ${id}`}
    placement={side}
    bind:open={open[id]}
    size={first ? size : 210}
    defaultSize={first ? profile.defaultSize : undefined}
    maxSize={first ? profile.maxSize : undefined}
    {push}
    resizable={first && resizeEnabled && profile.mode === 'resize' ? drag : undefined}
    destroyOnHidden={first ? profile.destroyOnHidden : true}
    forceRender={first ? profile.forceRender : undefined}
    afterOpenChange={next => settled(id, next)}
  >
    <label>Draft {id}<input id={`geometry-draft-${id}`} value={`draft ${id}`} /></label>
    {@render nested?.()}
  </Drawer>
{/snippet}

{#snippet grandchild()}{@render drawer('c', 'bottom')}{/snippet}
{#snippet children()}
  {@render drawer('b', 'top', profile.childPush, profile.siblings ? undefined : grandchild)}
  {#if profile.siblings}{@render grandchild()}{/if}
{/snippet}

<section id="drawer-geometry-fixture">
  <label>Drawer profile
    <select value={profile.name} onchange={event => select(event.currentTarget.value)}>
      {#each reference.cases as { profile }}<option value={profile.name}>{profile.name}</option>{/each}
    </select>
  </label>
  {#each ids as id}
    <button type="button" data-testid={`open-${id}`} onclick={() => { open[id] = true; }}>
      Open {id}
    </button>
    <button type="button" data-testid={`close-${id}`} onclick={() => { open[id] = false; }}>
      Close {id}
    </button>
  {/each}
  <button type="button" data-testid="remove-size" onclick={() => { size = undefined; }}>
    Remove size
  </button>
  <button type="button" data-testid="stop-resize" onclick={() => { resizeEnabled = false; }}>
    Disable resize
  </button>
  <button type="button" data-testid="remove-drawer" onclick={() => { renderFirst = false; }}>
    Remove Drawer
  </button>
  <output data-testid="geometry-events" hidden>{JSON.stringify(events)}</output>
  {#key profile.name}
    <ConfigProvider direction={profile.rtl ? 'rtl' : 'ltr'} theme={{
      token: { motion: Boolean(profile.motion) },
      components: profile.draggerSize ? { Drawer: { draggerSize: profile.draggerSize } } : undefined
    }}>
      {#if renderFirst}
        {@render drawer('a', placement(profile.placement), profile.push,
          profile.mode === 'push' ? children : undefined)}
      {/if}
    </ConfigProvider>
  {/key}
</section>
