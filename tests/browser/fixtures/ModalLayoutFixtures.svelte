<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Modal, ModalHolder, createModal, type ConfigProviderProps, type ModalWidth
  } from '@woodger/antd';
  import reference from './ant-design-modal-layout-reference.json';

  let { profile = 'default' }: { profile?: string; } = $props();
  interface LayoutProfile {
    id: string;
    confirm?: boolean;
    props?: {
      width?: ModalWidth;
      height?: number | string;
      centered?: boolean;
      getContainer?: string;
      prefixCls?: string;
    };
    provider?: { centered?: boolean; };
    token?: NonNullable<ConfigProviderProps['theme']>['token'];
  }
  const initial: LayoutProfile | undefined = untrack(() =>
    reference.cases.find(item => item.profile.id === profile)?.profile
  );
  const confirmWidth = typeof initial?.props?.width === 'object' ? undefined : initial?.props?.width;
  let width = $state(initial?.props?.width);
  let height = $state(initial?.props?.height);
  let centered = $state(initial?.props?.centered);
  let nestedOpen = $state(false);
  let freeFocus = $state(false);
  const modal = createModal();
</script>

{#snippet editor()}<input id="layout-editor" aria-label="Layout editor" value="Seed" />{/snippet}
<div id="layout-host" style="width:280px"></div>
<button type="button" onclick={() => centered = undefined}>Inherit alignment</button>
<button type="button" onclick={() => width = '50%'}>Use percentage width</button>
<button type="button" onclick={() => height = 210}>Set fixed height</button>
<button type="button" onclick={() => freeFocus = true}>Free layout focus</button>
<ConfigProvider modal={{ centered: initial?.provider?.centered }}
  theme={{ token: { ...initial?.token, motion: false } }}>
  {#if initial?.confirm}
    <button type="button" onclick={() => modal.confirm({
      title: 'Layout probe',
      width: confirmWidth,
      height,
      centered: initial?.props?.centered,
      content: editor
    })}>Confirm layout</button>
    <ModalHolder {modal} />
  {:else if profile === 'nested'}
    <Modal open title="Outer layout" footer={null} width={{ sm: 490 }} centered={false}>
      <button type="button" onclick={() => nestedOpen = true}>Open nested layout</button>
      <Modal bind:open={nestedOpen} title="Layout probe" footer={null} width={{ md: 220 }}
        getContainer={false}>
        {@render editor()}
      </Modal>
    </Modal>
  {:else if profile === 'managed'}
    <Modal open title="Layout probe" footer={null} centered={false} focusable={{ trap: !freeFocus }}>
      {@render editor()}
    </Modal>
  {:else}
    <Modal open title="Layout probe" footer={null} {width} {height} {centered}
      getContainer={initial?.props?.getContainer} prefixCls={initial?.props?.prefixCls}>
      {@render editor()}
    </Modal>
  {/if}
</ConfigProvider>
