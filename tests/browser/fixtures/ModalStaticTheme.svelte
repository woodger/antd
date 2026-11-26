<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { ConfigProvider, Modal, type ModalStaticHandle, type ThemeConfig } from '@woodger/antd';

  let { profile }: { profile: string; } = $props();
  const mode = untrack(() => profile);
  const dark: ThemeConfig = { mode: 'dark' };
  const accent: ThemeConfig = { mode: 'dark', cssVar: {}, token: { colorPrimary: '#f5222d' } };
  const theme = mode.endsWith('accent') ? accent : dark;
  let open = $state(false);
  let handle: ModalStaticHandle | undefined;

  function showStatic() {
    const useHolder = mode.startsWith('holder-');
    ConfigProvider.config({
      theme: useHolder ? { mode: 'light' } : theme,
      holderRender: useHolder ? renderHolder : undefined
    });

    handle = Modal.confirm({
      title: 'Static modal',
      getContainer: mode === 'local' ? '#theme-container' : undefined
    });
  }

  function refreshAccent() {
    ConfigProvider.config({ theme: accent });
    handle?.update({ title: 'Updated modal' });
  }
</script>

{#snippet renderHolder(content: Snippet)}
  <ConfigProvider {theme}>
    {@render content()}
  </ConfigProvider>
{/snippet}

<ConfigProvider {theme}>
  <div id="theme-container"></div>
  <button type="button" onclick={() => open = true}>Open regular modal</button>
  <button type="button" onclick={showStatic}>Open static modal</button>
  <button type="button" onclick={refreshAccent}>Update static theme</button>
  <Modal bind:open title="Regular modal" />
</ConfigProvider>
