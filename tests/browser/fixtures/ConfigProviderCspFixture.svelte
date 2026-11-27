<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, ConfigProvider, Modal, type ThemeConfig } from '@woodger/antd';
  import reference from './ant-design-config-provider-csp-reference.json';

  let { profile = 'nested' }: { profile?: 'nested' | 'strict' | 'shadow' } = $props();
  const [firstNonce, nextNonce] = reference.nonces;
  const theme: ThemeConfig = { token: { colorPrimary: '#237804', motion: false } };
  let nonce = $state(firstNonce);
  let host = $state<HTMLDivElement>();
  let shadow = $state<ShadowRoot>();
  let open = $state(false);

  onMount(() => {
    if (host) shadow = host.attachShadow({ mode: 'open' });
  });
</script>

<ConfigProvider prefixCls="nonce-outer" csp={{ nonce }} {theme}>
  <Button id="outer" type="primary">Outer button</Button>
  <ConfigProvider prefixCls="nonce-inherit">
    <Button id="inherit" type="primary">Inherited button</Button>
  </ConfigProvider>
  {#if profile === 'nested'}
    <ConfigProvider prefixCls="nonce-override" csp={{ nonce: nextNonce }}>
      <Button id="override" type="primary">Override button</Button>
    </ConfigProvider>
    <ConfigProvider prefixCls="nonce-reset" csp={{}}>
      <Button id="reset" type="primary">Reset button</Button>
    </ConfigProvider>
  {/if}
  <button type="button" onclick={() => { nonce = nextNonce; }}>Change nonce</button>
  {#if profile === 'shadow'}
    <div bind:this={host}></div>
    {#if shadow}
      <button type="button" onclick={() => { open = true; }}>Open CSP dialog</button>
      <Modal bind:open title="CSP dialog" getContainer={shadow}>Shadow content</Modal>
    {/if}
  {/if}
</ConfigProvider>
