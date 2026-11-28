<script module lang="ts">
  export type ZeroRuntimeScenario = 'prebuilt' | 'custom' | 'nested' | 'live' | 'rename'
    | 'layout' | 'dropdown';
</script>

<script lang="ts">
  import { Col, ConfigProvider, Dropdown, Modal, Row, Tooltip, type ThemeConfig } from '@woodger/antd';
  import ThemeZeroRuntimeControls from './ThemeZeroRuntimeControls.svelte';

  let {
    scenario = 'prebuilt', initialZeroRuntime = true, overrideNested = false
  }: {
    scenario?: ZeroRuntimeScenario;
    initialZeroRuntime?: boolean;
    overrideNested?: boolean;
  } = $props();

  let phase = $state(0);
  let mounted = $state(true);
  const live = $derived(scenario === 'live' || scenario === 'rename');
  const zeroRuntime = $derived(live ? phase === 1 : initialZeroRuntime);
  const primary = $derived(live && phase > 0 ? '#1d762c' : '#ab321f');
  const config = $derived<ThemeConfig>({
    zeroRuntime,
    cssVar: { key: 'zero-outer' },
    token: {
      colorPrimary: primary,
      motion: scenario === 'dropdown',
      ...(scenario === 'layout' ? { screenMD: 960, screenMDMin: 960 } : {}),
      ...(scenario === 'dropdown' ? { motionDurationMid: '1s' } : {})
    },
    components: { Button: { contentFontSize: 21 } }
  });
  const nestedConfig = $derived<ThemeConfig>({
    inherit: false,
    cssVar: { key: 'zero-inner' },
    ...(overrideNested ? { zeroRuntime: false } : {})
  });
  const outerPrefix = $derived.by(() => {
    if (scenario === 'live') {
      return 'stable-btn';
    }
    if (scenario === 'rename' && phase > 0) {
      return 'active-rename-btn';
    }

    return undefined;
  });
  const latePrefix = $derived.by(() => {
    if (scenario === 'rename') {
      return phase === 1 ? 'stopped-btn' : 'stopped-rename-btn';
    }

    return 'late-btn';
  });
</script>

{#if live}
  <button type="button" onclick={() => phase += 1}>Advance zero-runtime phase</button>
  <button type="button" onclick={() => mounted = false}>Remove themed controls</button>
  <output id="zero-phase">{phase}</output>
{/if}

{#if mounted}
  <ConfigProvider theme={config} csp={{ nonce: 'zero-runtime-nonce' }}
    prefixCls={scenario === 'custom' ? 'suite' : undefined}>
    {#if scenario === 'layout'}
      <Row style="width:400px">
        <Col id="zero-grid-col" xs={24} md={12}>Responsive column</Col>
      </Row>
      {#if overrideNested}
        <ConfigProvider theme={{ zeroRuntime: false }}>
          <Row style="width:400px">
            <Col id="zero-nested-grid-col" xs={24} md={12}>Nested column</Col>
          </Row>
        </ConfigProvider>
      {/if}
      <Modal open getContainer={false} title="Responsive modal" width={{ xs: 266, md: 438 }}
        footer={null}>Responsive body</Modal>
    {:else if scenario === 'dropdown'}
      <Dropdown trigger="click" placement="bottomLeft"
        menu={{ items: [{ key: 'download', label: 'Download file' }] }}>
        <button type="button">Open dropdown</button>
      </Dropdown>
    {:else}
      <ThemeZeroRuntimeControls id="outer" buttonPrefix={outerPrefix} />
    {/if}

    {#if scenario === 'nested'}
      <ConfigProvider prefixCls="inner" theme={nestedConfig}>
        <ThemeZeroRuntimeControls id="inner" />
      </ConfigProvider>
    {/if}

    {#if scenario === 'rename'}
      <Tooltip prefixCls="active-tip" trigger="click" title="Existing tooltip">
        <button type="button">Open existing tooltip</button>
      </Tooltip>
    {/if}

    {#if live && phase > 0}
      <ThemeZeroRuntimeControls id="late" buttonPrefix={latePrefix} />
    {/if}
    {#if live && phase > 1}
      <ThemeZeroRuntimeControls id="fresh" buttonPrefix="fresh-btn" />
    {/if}
  </ConfigProvider>
{/if}
