<script lang="ts">
  import { ColorPicker, ConfigProvider, enUS } from 'antd-svelte';

  let top = $state('343.64');
</script>

<section id="color-picker-viewport-fixture" style="height:1400px">
  <label>Viewport color top<select bind:value={top}>
    <option>343.64</option><option>344</option>
  </select></label>
  <ConfigProvider locale={enUS}>
    <div style={`position:absolute;left:480px;top:${top}px`}>
      <ColorPicker defaultValue="#52c41a" showText aria-label="Viewport color"
        presets={[
          { key: 'green', label: 'Зелёная палитра',
            colors: ['#f6ffed', '#b7eb8f', '#52c41a', '#237804'] },
          { key: 'warm', label: 'Тёплая палитра', defaultOpen: false,
            colors: ['#faad14', '#fa8c16', '#f5222d'] }
        ]} />
    </div>
  </ConfigProvider>
</section>
