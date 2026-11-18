<script lang="ts">
  import { ColorPicker, ConfigProvider, enUS } from 'antd-svelte';

  let { kind }: { kind?: string } = $props();
  let top = $state('343.64');
  let selected = $state('#52c41a');
  let fixedPopup = $derived(kind === 'fixed');
</script>

<section id="color-picker-viewport-fixture" style={kind === 'short' ? undefined : 'height:1400px'}>
  {#if kind !== 'short'}<label>Viewport color top<select bind:value={top}>
    <option>343.64</option><option>344</option>
  </select></label>{/if}
  <ConfigProvider locale={enUS}>
    <div style={kind === 'short'
      ? 'position:absolute;left:35vw;top:calc(50vh - 16.36px)'
      : `position:absolute;left:480px;top:${top}px`}>
      <ColorPicker defaultValue="#52c41a" showText aria-label="Viewport color"
        styles={fixedPopup ? { popup: { root: 'position:fixed' } } : undefined}
        onChange={color => { selected = color.toHexString(); }}
        presets={[
          { key: 'green', label: 'Зелёная палитра',
            colors: ['#f6ffed', '#b7eb8f', '#52c41a', '#237804'] },
          { key: 'warm', label: 'Тёплая палитра', defaultOpen: false,
            colors: ['#faad14', '#fa8c16', '#f5222d'] }
        ]} />
    </div>
  </ConfigProvider>
  <output aria-label="Selected viewport color">{selected}</output>
</section>
