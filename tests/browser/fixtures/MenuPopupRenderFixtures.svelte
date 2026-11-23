<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import {
    ConfigProvider,
    Menu,
    type MenuItemType,
    type MenuMode,
    type MenuPopupRenderInfo
  } from '@woodger/antd';
  import source from './ant-design-menu-popup-render-reference.json';

  let { kind = 'vertical-initial', initiallyOpen = false }: {
    kind?: string;
    initiallyOpen?: boolean;
  } = $props();
  const samples = source.cases.map(sample => sample.options);
  let sampleId = $state(untrack(() => kind));
  let sample = $derived(samples.find(value => value.id === sampleId) ?? samples[0]);
  let mode = $derived<MenuMode>(sample.mode === 'vertical' || sample.mode === 'horizontal'
    ? sample.mode : 'inline');
  let open = $state.raw<string[]>(untrack(() => initiallyOpen ? ['branch', 'inner'] : []));
  let events = $state<unknown[][]>([]);
  let acceptOpen = $state(false);
  let updated = $state(false);
  let perBranch = $state(true);
  let useRoot = $state(true);
  let plainList = $state(false);
  let addGroup = $state(false);
  let mounted = $state(true);
  let portal = $state(false);
  let host = $state<HTMLDivElement>();
  let instance = $state<Menu>();
  let menuElement = $state<HTMLUListElement>();
  const groupRows: MenuItemType[] = [
    null,
    { type: 'divider', dashed: true },
    { type: 'group', label: 'Extra group', children: [
      { key: 'disabled', label: 'Disabled', disabled: true },
      { key: 'extra', label: 'Extra' }
    ] }
  ];
  let items = $derived<MenuItemType[]>([
    { key: 'before', label: 'Before', style: 'width:96px' },
    {
      key: 'branch', label: 'Branch', style: 'width:112px',
      popupRender: sample.direct && perBranch ? branchRender : undefined,
      children: [
        { key: 'child', label: 'Child' },
        { key: 'inner', label: 'Inner', children: [{ key: 'leaf', label: 'Leaf' }] },
        ...addGroup ? groupRows : []
      ]
    },
    { key: 'after', label: 'After', style: 'width:96px' }
  ]);

  // Имитирует изменение управляемых props без перекрытия пользовательского focus.
  function selectSample(event: Event & { currentTarget: HTMLSelectElement; }) {
    sampleId = event.currentTarget.value;
    open = [];
    events = [];
  }

  // Регистрирует запрос раскрытия и по команде применяет его к props.
  function changeOpen(keys: string[]) {
    events.push(['open', keys]);
    if (acceptOpen) {
      open = keys;
    }
  }

  // Даёт portal стабильный элемент после mount, в том числе при рендере до открытия.
  function getContainer() {
    return host ?? document.body;
  }
</script>

{#snippet renderSurface(owner: string, originMenu: Snippet<[children?: Snippet]>,
    info: MenuPopupRenderInfo)}
  {#if !(sample.empty && info.item.eventKey === 'branch')}
    <section data-menu-render-owner={owner} data-menu-render-branch={info.item.eventKey}
      data-menu-render-path={info.keys.join('/')}
      data-menu-render-label={typeof info.item.label === 'string' ? info.item.label : undefined}>
      {#if sample.replace && info.item.eventKey === 'branch'}
        {#snippet rows()}
          {#each [...info.item.children].reverse() as child (child)}
            {@render info.renderItem(child)}
          {/each}
        {/snippet}
        {#if plainList}
          <ul role="menu" data-plain-list>{@render rows()}</ul>
        {:else}
          {@render originMenu(rows)}
        {/if}
      {:else}
        {@render originMenu()}
      {/if}
      <input aria-label={`Menu draft ${info.item.eventKey}`} value="Warehouse" />
    </section>
  {/if}
{/snippet}

{#snippet rootRender(origin: Snippet<[children?: Snippet]>, info: MenuPopupRenderInfo)}
  {@render renderSurface(updated ? 'updated' : 'root', origin, info)}
{/snippet}
{#snippet branchRender(origin: Snippet<[children?: Snippet]>, info: MenuPopupRenderInfo)}
  {@render renderSurface('branch', origin, info)}
{/snippet}

<section id="menu-popup-render-fixture">
  <label>Popup render sample <select value={sampleId} onchange={selectSample}>
    {#each samples as value (value.id)}
      <option value={value.id}>{value.id}</option>
    {/each}
  </select></label>
  <label>Popup render open keys <input value={open.join(',')}
    oninput={event => { open = event.currentTarget.value.split(',').filter(Boolean); }} /></label>
  <label><input type="checkbox" bind:checked={acceptOpen} /> Accept popup render keys</label>
  <label><input type="checkbox" bind:checked={updated} /> Update popup content</label>
  <label><input type="checkbox" bind:checked={perBranch} /> Override branch popup</label>
  <label><input type="checkbox" bind:checked={useRoot} /> Render root popups</label>
  <label><input type="checkbox" bind:checked={plainList} /> Use a plain popup list</label>
  <label><input type="checkbox" bind:checked={addGroup} /> Add popup group</label>
  <label><input type="checkbox" bind:checked={portal} /> Use popup render container</label>
  <label><input type="checkbox" bind:checked={mounted} /> Mount popup render menu</label>
  <button type="button" onclick={() => instance?.findItem({ key: 'child' })?.focus()}>
    Focus rendered Child
  </button>
  <ConfigProvider theme={{ token: { motion: false } }}>
    {#key sampleId}
      {#if mounted}
        <Menu {mode} {items} inlineCollapsed={sample.collapsed} forceSubMenuRender={sample.force}
          popupRender={useRoot ? rootRender : undefined} openKeys={open}
          style={`width:${sample.width ?? 420}px;position:relative`}
          aria-label="Popup render menu" triggerSubMenuAction="click"
          subMenuOpenDelay={0} subMenuCloseDelay={0} bind:this={instance}
          bind:nativeElement={menuElement}
          getPopupContainer={portal ? getContainer : undefined}
          onOpenChange={changeOpen}
          onClick={info => events.push(['click', info.key, info.keyPath])}
          onSelect={info => events.push(['select', info.key, info.selectedKeys])} />
      {/if}
    {/key}
  </ConfigProvider>
  <div id="menu-popup-render-host" bind:this={host}></div>
  <output aria-label="Popup render mounted">{menuElement?.tagName ?? 'none'}</output>
  <output aria-label="Popup render events">{JSON.stringify(events)}</output>
</section>
