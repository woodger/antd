<script lang="ts">
  // Reproduces Menu variants from measurements and provides a controlled collapse switch.
  import { untrack } from 'svelte';
  import {
    ConfigProvider,
    LayoutSider,
    Menu,
    Modal,
    type MenuClickInfo,
    type MenuItem,
    type MenuItemType,
    type MenuSelectInfo,
    type MenuTooltip
  } from '@woodger/antd';
  import reference from './ant-design-menu-tooltip-reference.json';
  import optionsReference from './ant-design-menu-tooltip-options-reference.json';

  let { sampleId = 'default', initiallyCollapsed = true }: {
    sampleId?: string;
    initiallyCollapsed?: boolean;
  } = $props();
  let current = $state(untrack(() => sampleId));
  const sample = $derived(reference.results.find(entry => entry.sample.id === current)?.sample
    ?? reference.results[0].sample);
  let collapsed = $state(untrack(() => initiallyCollapsed));
  let changes = $state<boolean[]>([]);
  let sequence = $state<unknown[][]>([]);
  const seenContainers = new Set<string>();
  let containers = $state('[]');
  let active = $state(true);
  const item = $derived.by<MenuItem>(() => {
    const title = sample.itemTitle;
    if (title === true) {
      throw new Error(`Unexpected item title in Menu tooltip sample ${sample.id}`);
    }

    return {
      key: 'leaf',
      label: 'Warehouse',
      extra: current === 'extra-zero' ? 0 : undefined,
      class: 'tooltip-leaf',
      title,
      disabled: sample.disabled
    };
  });
  const items = $derived<MenuItemType[]>(sample.nested
    ? [{ key: 'branch', label: 'Branch', children: [item] }] : [item]);
  const tooltip = $derived.by<MenuTooltip>(() => {
    const defaults = { mouseEnterDelay: 0, mouseLeaveDelay: 0, onOpenChange: record };
    switch (current) {
      case 'click':
        return { ...defaults, trigger: 'click' };
      case 'semantic-portal':
        return {
          ...defaults,
          prefixCls: 'hint',
          id: 'owned-hint',
          class: 'tooltip-plain',
          rootClassName: 'tooltip-root',
          style: 'padding-top:17px',
          color: '#39332b',
          getPopupContainer,
          classNames: ({ props }) => ({
            root: `tooltip-${props.placement}`,
            container: 'tooltip-text'
          }),
          styles: { container: 'font-size:19px' }
        };
      case 'semantic-implicit-portal':
        return {
          ...defaults,
          classNames: ({ props }) => ({
            root: props.getPopupContainer === undefined ? 'tooltip-implicit' : 'tooltip-configured'
          }),
          styles: ({ props }) => ({
            container: props.getPopupContainer === undefined ? 'font-size:19px' : 'font-size:17px'
          })
        };
      case 'force-expanded':
        return { ...defaults, title: 'Hidden label', forceRender: true, getPopupContainer };
      case 'pending-collapse':
        return { ...defaults, mouseEnterDelay: 0.25 };
    }

    const options = sample.tooltip;
    if (options === false) {
      return false;
    }
    if (options === true) {
      throw new Error(`Unexpected options in Menu tooltip sample ${sample.id}`);
    }

    return {
      ...defaults,
      ...options,
      placement: options?.placement === 'topLeft' ? 'topLeft' : undefined,
      trigger: options?.trigger === 'focus' ? 'focus' : undefined
    };
  });

  // Saves visibility requests separately from the controlled prop from the original scenario.
  function record(open: boolean) {
    changes.push(open);
    sequence.push(['tooltip', open]);
  }

  // Records the order of synchronous handlers on the existing line.
  function recordClick(info: MenuClickInfo) {
    sequence.push(['click', info.key]);
  }

  // Saves the keys accepted when clicking on the line.
  function recordSelect(info: MenuSelectInfo) {
    sequence.push(['select', info.selectedKeys]);
  }

  // Recorders the actual trigger and returns the owner's container.
  function getPopupContainer(element: HTMLElement) {
    seenContainers.add(element.tagName);
    containers = JSON.stringify([...seenContainers]);
    const document = element.ownerDocument;
    return document.getElementById('tooltip-container') ?? document.body;
  }

  // Isolates Menu state between scenarios.
  function select(event: Event & { currentTarget: HTMLSelectElement; }) {
    current = event.currentTarget.value;
    collapsed = current !== 'force-expanded' && current !== 'sider';
    changes = [];
    sequence = [];
    seenContainers.clear();
    containers = '[]';
    active = true;
  }
</script>

{#snippet fixtureMenu()}
  <Menu {items} {tooltip} mode="inline" inlineCollapsed={collapsed}
    openKeys={sample.nested ? ['branch'] : []} aria-label="Tooltip menu"
    onClick={recordClick} onSelect={recordSelect} />
{/snippet}

<div data-testid="menu-tooltip-fixture">
  <label>Menu tooltip sample <select value={current} onchange={select}>
    {#each reference.results as { sample } (sample.id)}
      <option value={sample.id}>{sample.id}</option>
    {/each}
    {#each [...optionsReference.results.map(({ kind }) => kind), 'pending-collapse', 'modal']
      as kind (kind)}
      <option value={kind}>{kind}</option>
    {/each}
  </select></label>
  <button type="button" onclick={() => { collapsed = !collapsed; }}>Toggle collapse</button>
  <button type="button" onclick={() => { active = false; }}>Remove menu</button>
  <output aria-label="Menu tooltip events">{JSON.stringify(changes)}</output>
  <output aria-label="Menu tooltip sequence">{JSON.stringify(sequence)}</output>
  <output aria-label="Menu tooltip containers">{containers}</output>
  <div id="tooltip-container"></div>
  <div style={'position:absolute;'
    + 'left:400px;'
    + 'top:180px'}>
    {#if active}
      {#key current}
        <ConfigProvider direction={sample.direction === 'rtl' ? 'rtl' : 'ltr'}
          theme={{ token: { motion: false } }}>
          {#if current === 'sider'}
            <LayoutSider collapsed>{@render fixtureMenu()}</LayoutSider>
          {:else if current === 'modal'}
            <Modal open title="Modal with collapsed Menu">{@render fixtureMenu()}</Modal>
          {:else}
            {@render fixtureMenu()}
          {/if}
        </ConfigProvider>
      {/key}
    {/if}
  </div>
</div>
