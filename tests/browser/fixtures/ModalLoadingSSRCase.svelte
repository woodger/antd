<script lang="ts">
  import { ConfigProvider, Modal } from '@woodger/antd';
  import Body from './ModalLoadingBody.svelte';
  import Footer from './ModalLoadingFooter.svelte';
  import type { ModalLoadingSample } from '../modal-loading-cases.mjs';
  import type { ModalLoadingActivity } from '../modal-loading-metrics.mjs';
  let { sample, loading, activity }: {
    sample: ModalLoadingSample;
    loading: boolean;
    activity: ModalLoadingActivity[]
  } = $props();
  const record = (kind: ModalLoadingActivity['kind']) => { activity.push({ kind }); };
  const neverAttach = () => { throw Error('SSR must not attach DOM refs'); };
  const neverMount = () => { throw Error('SSR must not execute onMount'); };
  let modalProps = $derived({ open: true, loading, title, width: 520, getContainer: false as const,
    ...(sample.customizePrefix ? { prefixCls: sample.prefixCls } : {}), ...(sample.footer === 'custom-node' ? { footer } : {}) });
</script>
{#snippet title()}<span data-modal-loading-title="">Loading panel</span>{/snippet}
{#snippet footer()}<Footer attachFooter={neverAttach} activity={record} lifecycle={neverMount} />{/snippet}
<ConfigProvider theme={{ token: { motion: false } }}><Modal {...modalProps}><Body attachBody={neverAttach} attachEditor={neverAttach} activity={record} lifecycle={neverMount} /></Modal></ConfigProvider>
