<script lang="ts">
  import { ConfigProvider, DatePicker, RangePicker, TimePicker, TimeRangePicker }
    from '@woodger/antd';

  const profile = new URLSearchParams(globalThis.location?.search);
  const prefixCls = profile.has('prefix') ? 'demo' : undefined;
  const size = profile.get('size') === 'large' ? 'large'
    : profile.get('size') === 'small' ? 'small' : undefined;
  const disabled = profile.has('disabled');
  const direction = profile.has('rtl') ? 'rtl' : 'ltr';
  const theme = {
    mode: profile.has('dark') ? 'dark' as const : 'light' as const,
    token: { fontFamily: 'Georgia, serif', motion: false },
    components: { DatePicker: { inputFontSize: 16, inputFontSizeSM: 13, inputFontSizeLG: 19 } }
  };
  const editors = ['input', 'textarea'] as const;
</script>

<ConfigProvider {prefixCls} {direction} {theme}>
  {#each editors as editor}
    {@const components = { input: editor }}
    <div data-picker-editor-column={editor} class="picker-column">
      <DatePicker {components} {size} {disabled} />
      <RangePicker {components} {size} {disabled} />
      <TimePicker {components} {size} {disabled} />
      <TimeRangePicker {components} {size} {disabled} />
    </div>
  {/each}
</ConfigProvider>

<style>
  .picker-column {
    box-sizing: border-box;
    width: 320px;
    padding: 16px;
    display: grid;
    gap: 16px;
  }
</style>
