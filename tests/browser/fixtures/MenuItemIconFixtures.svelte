<script lang="ts">
  // Changes the owner of the badge and the selection through the published props Menu.
  import { untrack, type Snippet } from 'svelte';
  import { ConfigProvider, Menu } from '@woodger/antd';
  import type { MenuItemIcon, MenuItemIconInfo, MenuItemType, MenuMode } from '@woodger/antd';
  import source from './ant-design-menu-item-icon-reference.json';

  let { kind = 'global' }: { kind?: string; } = $props();
  const samples = source.cases.map(sample => sample.options);
  let sampleId = $state(untrack(() => kind));
  let selected = $state.raw(['leaf']);
  let replace = $state(false);
  const sample = $derived(samples.find(entry => entry.id === sampleId) ?? samples[0]);
  const mode = $derived<MenuMode>(sample.mode === 'horizontal' || sample.mode === 'inline'
    ? sample.mode : 'vertical');
  const open = $derived(mode === 'horizontal' ? ['rc-menu-more', 'branch'] : ['branch']);
  const items = $derived<MenuItemType[]>([
    {
      key: 'branch',
      label: 'Branch',
      class: 'sample-branch',
      itemIcon: icon(sample.branchIcon, branchIcon),
      children: [
        {
          key: 'leaf', label: 'Leaf', extra: 'Extra', class: 'sample-leaf',
          disabled: sample.localDisabled, itemIcon: icon(sample.leafIcon, leafIcon),
          icon: sample.icon ? leading : undefined
        },
        { key: 'other', label: 'Other', class: 'sample-other' }
      ]
    },
    { key: 'root-entry', label: 'Root', class: 'sample-root' }
  ]);

  // Restores a value or snippet from the settings of the original scenario.
  function icon(
    value: MenuItemIcon | undefined,
    render: Snippet<[MenuItemIconInfo]>
  ): MenuItemIcon | undefined {
    return value === 'snippet' ? render : value;
  }

  // Begins the following measurement with the original set of selectedKeys.
  function selectSample(event: Event & { currentTarget: HTMLSelectElement; }) {
    sampleId = event.currentTarget.value;
    selected = ['leaf'];
    replace = false;
  }
</script>

{#snippet leading()}<i data-main-icon="">lead</i>{/snippet}
{#snippet marker(owner: string, info: MenuItemIconInfo)}
  <span data-item-icon={owner} data-event-key={info.eventKey}
    data-selected={String(info.isSelected)}
    data-disabled={info.disabled === undefined ? undefined : String(info.disabled)}>mark</span>
{/snippet}
{#snippet rootIcon(info: MenuItemIconInfo)}{@render marker('root', info)}{/snippet}
{#snippet branchIcon(info: MenuItemIconInfo)}{@render marker('branch', info)}{/snippet}
{#snippet leafIcon(info: MenuItemIconInfo)}{@render marker('leaf', info)}{/snippet}
{#snippet replacement(info: MenuItemIconInfo)}{@render marker('replacement', info)}{/snippet}

<div data-testid="menu-item-icon-fixture">
  <label>
    Menu item icon sample
    <select value={sampleId} onchange={selectSample}>
      {#each samples as sample (sample.id)}
        <option value={sample.id}>{sample.id}</option>
      {/each}
    </select>
  </label>
  <button type="button" onclick={() => { selected = ['other']; }}>Select Other</button>
  <button type="button" onclick={() => { replace = true; }}>Replace root item icon</button>
  {#key sampleId}
    <ConfigProvider theme={{ token: { motion: false } }}>
      <Menu aria-label="Menu with item icons" {mode} {items}
        itemIcon={replace ? replacement : icon(sample.rootIcon, rootIcon)}
        openKeys={open} selectedKeys={selected} disabled={sample.disabled}
        style={mode === 'horizontal' ? 'width:42px' : 'width:190px'} />
    </ConfigProvider>
  {/key}
</div>
