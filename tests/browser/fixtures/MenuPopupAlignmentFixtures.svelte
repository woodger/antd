<script lang="ts">
  // Sets public positions and controlled disclosure for Menu measurements.
  import { untrack } from 'svelte';
  import {
    ConfigProvider,
    Menu,
    type MenuItemType,
    type MenuPopupAlign,
    type MenuProps
  } from '@woodger/antd';
  import source from './ant-design-menu-popup-alignment-reference.json';

  interface AlignmentSample {
    id: string;
    mode?: string;
    direction?: string;
    offset?: readonly number[];
    innerOffset?: readonly number[];
    builtinPlacements?: MenuProps['builtinPlacements'];
    x?: number;
    y?: number;
    width?: number;
    collapsed?: boolean;
    prefix?: string;
    localPrefix?: string;
  }

  let { kind = 'vertical-default', initiallyOpen = false }: {
    kind?: string;
    initiallyOpen?: boolean;
  } = $props();
  const samples: readonly AlignmentSample[] = [
    ...source.cases.map(sample => readSample(sample.options)),
    source.live.live
  ];
  const below = samples.find(sample => sample.id === 'builtin-below')?.builtinPlacements;
  let sampleId = $state(untrack(() => kind));
  let open = $state.raw<string[]>(untrack(() => initiallyOpen ? ['branch'] : []));
  let changedOffset = $state(false);
  let changedMap = $state(false);
  let sample = $derived(samples.find(value => value.id === sampleId) ?? samples[0]);
  let mode = $derived<MenuProps['mode']>(sample.mode === 'horizontal' || sample.mode === 'inline'
    ? sample.mode : 'vertical');
  let items = $derived<MenuItemType[]>([
    { key: 'before', label: 'Before', style: 'width:72px' },
    {
      key: 'branch', label: 'Branch', class: 'alignment-branch', style: 'width:105px',
      popupClassName: 'alignment-pane',
      popupStyle: 'width:140px',
      popupOffset: sample.offset,
      children: [
        { key: 'child', label: 'Child' },
        {
          key: 'inner', label: 'Inner', class: 'alignment-inner', popupClassName: 'alignment-deep',
          popupStyle: 'width:140px', popupOffset: changedOffset ? [10, 19] : sample.innerOffset,
          children: [{ key: 'leaf', label: 'Leaf' }]
        }
      ]
    }
  ]);

  // There are only transferred items in the measurement map.
  function readSample(options: typeof source.cases[number]['options']): AlignmentSample {
    const { builtinPlacements, ...sample } = options;
    if (!builtinPlacements) {
      return sample;
    }

    const placements: Record<string, MenuPopupAlign> = {};
    for (const [name, position] of Object.entries(builtinPlacements)) {
      if (position !== undefined) {
        placements[name] = position;
      }
    }

    return { ...sample, builtinPlacements: placements };
  }

  // Switches the case, resetting the state of the previous measurement.
  function selectSample(event: Event & { currentTarget: HTMLSelectElement; }) {
    sampleId = event.currentTarget.value;
    changedOffset = false;
    changedMap = false;
    open = [];
  }
</script>

<div data-testid="menu-popup-alignment-fixture">
  <label>
    Alignment sample
    <select value={sampleId} onchange={selectSample}>
      {#each samples as sample (sample.id)}
        <option value={sample.id}>{sample.id}</option>
      {/each}
    </select>
  </label>
  <input aria-label="Alignment open keys" value={open.join(',')}
    oninput={event => { open = event.currentTarget.value.split(',').filter(Boolean); }} />
  <button type="button" onclick={() => { changedOffset = true; }}>Update inner offset</button>
  <button type="button" onclick={() => { changedMap = true; }}>Replace placement</button>

  <main style:position="absolute" style:left={`${sample.x ?? 120}px`}
    style:top={`${sample.y ?? 110}px`}>
    {#key sampleId}
      <ConfigProvider direction={sample.direction === 'rtl' ? 'rtl' : 'ltr'}
        prefixCls={sample.prefix} theme={{ token: { motion: false } }}>
        <Menu aria-label="Alignment menu" {items} {mode} openKeys={open}
          builtinPlacements={changedMap ? below : sample.builtinPlacements}
          inlineCollapsed={sample.collapsed} prefixCls={sample.localPrefix}
          overflowedIndicatorPopupClassName="alignment-overflow"
          style={`width:${sample.width ?? 180}px`} />
      </ConfigProvider>
    {/key}
  </main>
</div>
