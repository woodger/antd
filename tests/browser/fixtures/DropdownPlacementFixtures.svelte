<script lang="ts">
  // Воспроизводит публичные настройки, размеры trigger и журнал событий эталона.
  import { ConfigProvider, Dropdown, type DropdownMenuProps, type DropdownProps } from '@woodger/antd';
  import { dropdownPlacementCases } from '../dropdown-placement-reference';

  const sample = new URLSearchParams(location.search).get('sample');
  const entry = dropdownPlacementCases.find(item => item.profile.id === sample);
  if (!entry) throw new Error('Missing Dropdown placement reference profile');

  const profile = entry.profile;
  let owner = $state(profile.initial ?? false);
  let mounted = $state(true);
  let trigger = $state<DropdownProps['trigger']>(profile.trigger ?? ['contextMenu']);
  let host = $state<HTMLDivElement>();
  let events = $state<unknown[][]>([]);
  const theme = { token: { motion: false } };
  const menu: DropdownMenuProps = {
    id: 'context-menu',
    items: [
      { key: 'alpha', label: 'Alpha' },
      { key: 'beta', label: 'Beta command' },
      ...Array.from({ length: profile.manyItems ? 22 : 0 }, (_, index) =>
        ({ key: `item-${index}`, label: `Item ${index + 1}` }))
    ],
    onClick: info => events.push(['command', info.key, info.domEvent.type])
  };

  function getOpen() {
    return profile.controlled ? owner : undefined;
  }

  function setOpen() {
    // Владелец применяет значение отдельным действием из наблюдения React.
  }

  function getContainer(trigger: HTMLElement) {
    if (!host) throw new Error('Missing Dropdown portal host');
    if (!events.some(event => event[0] === 'container')) {
      events.push(['container', trigger.id]);
    }
    return host;
  }

  function onContext(event: MouseEvent) {
    events.push(['child-context', event.clientX, event.clientY, event.defaultPrevented]);
    if (profile.cancelChild) event.preventDefault();
  }

  function onClick(event: MouseEvent) {
    events.push(['child-click', event.clientX, event.clientY, event.defaultPrevented]);
  }
</script>

{#snippet subject()}
  {#if mounted}<ConfigProvider direction={profile.rtl ? 'rtl' : 'ltr'} {theme}>
    <Dropdown {menu} {trigger} disabled={profile.disabled} autoFocus={profile.autoFocus}
      placement={profile.placement} arrow={profile.arrow} align={profile.align}
      autoAdjustOverflow={profile.autoAdjustOverflow}
      mouseEnterDelay={profile.mouseEnterDelay ?? 0} mouseLeaveDelay={0} bind:open={getOpen, setOpen}
      getPopupContainer={profile.portal ? getContainer : undefined}
      classNames={{ root: 'context-popup' }}
      styles={profile.minWidth === undefined ? undefined : { root: `min-width:${profile.minWidth}px` }}
      onOpenChange={next => events.push(['open', next, 'trigger'])}>
      <button type="button" id="trigger" disabled={profile.disabled}
        class:corner={profile.corner} class:centered={profile.centered}
        oncontextmenu={onContext} onclick={onClick}>Commands</button>
    </Dropdown>
  </ConfigProvider>{/if}
{/snippet}

<div id="dropdown-placement-fixture" data-long-page={!profile.short || undefined}
  data-scroll-menu={profile.manyItems || undefined}>
  {#if profile.scrollingAnchor}<section id="scroller">
    {@render subject()}<div class="filler"></div>
  </section>{:else}{@render subject()}{/if}
  <div id="host" class:scrolling={profile.scrollingPortal} bind:this={host}>
    {#if profile.scrollingPortal}<div class="filler"></div>{/if}
  </div>
  <button hidden id="set-owner-open" onclick={() => { owner = true; }}>Open</button>
  <button hidden id="set-owner-closed" onclick={() => { owner = false; }}>Close</button>
  <button hidden id="set-trigger-click" onclick={() => { trigger = 'click'; }}>Click trigger</button>
  <button hidden id="set-trigger-context" onclick={() => { trigger = 'contextMenu'; }}>Context trigger</button>
  <button hidden id="unmount" onclick={() => { mounted = false; }}>Unmount</button>
  <output hidden id="placement-events">{JSON.stringify(events)}</output>
</div>

<style>
  :global(body:has(#dropdown-placement-fixture)) { margin: 0; }
  :global(body:has(#dropdown-placement-fixture[data-long-page])) { min-height: 1400px; }
  #trigger { position: absolute; left: 64px; top: 120px; width: 260px; height: 60px; }
  #trigger.centered { left: 400px; }
  #trigger.corner { left: 727px; top: 630px; }
  #host { position: absolute; top: 80px; left: 38px; }
  #host.scrolling { width: 800px; height: 420px; overflow: auto; pointer-events: none; }
  :global(body:has(#dropdown-placement-fixture) .context-popup) { pointer-events: auto; }
  [data-scroll-menu] :global(#context-menu) { max-height: 110px; overflow: auto; }
  #scroller { position: absolute; top: 0; left: 0; width: 100%; height: 440px; overflow: auto; }
  .filler { height: 1000px; }
</style>
