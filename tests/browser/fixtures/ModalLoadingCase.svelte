<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { ConfigProvider, Modal } from 'antd-svelte';
  import Body from './ModalLoadingBody.svelte';
  import Footer from './ModalLoadingFooter.svelte';
  import { createSelectSurfaceRecorder } from '../select-surface-producers.mjs';
  import { modalLoadingGeometry, type ModalLoadingSample, type ModalLoadingUpdate } from '../modal-loading-cases.mjs';
  import type { ModalLoadingActivity, ModalLoadingCapture, ModalLoadingLifecycle, ModalLoadingRefSlot, ModalLoadingRefs } from '../modal-loading-metrics.mjs';
  let { sample, capture }: { sample: ModalLoadingSample; capture?: ModalLoadingCapture } = $props();
  const initial = untrack(() => sample), ownerCapture = untrack(() => capture), recorder = createSelectSurfaceRecorder();
  const events: unknown[] = [], rawEvents: unknown[] = [], lifecycle: ModalLoadingLifecycle[] = [], activity: ModalLoadingActivity[] = [];
  const refs: ModalLoadingRefs = { owner: null, body: null, editor: null, footer: null };
  let open = $state(true), loading = $state(false), alive = false;
  const event = (...args: unknown[]) => {
    events.push(recorder.encode(args));
    rawEvents.push(recorder.raw(args));
  };
  const handler = <Value,>(name: string, callback: Value): Value => recorder.register(
    callback,
    { callback: 'modal-loading-' + name }
  );
  const attach = (slot: ModalLoadingRefSlot) => (node: HTMLElement) => {
    refs[slot] = node;
    lifecycle.push({ slot, event: 'attach', observation: ownerCapture?.observeRef?.(node) ?? null });
    return () => {
      refs[slot] = null;
      lifecycle.push({ slot, event: 'detach', observation: null });
    };
  };
  const attachOwner = attach('owner'), attachBody = attach('body'), attachEditor = attach('editor'), attachFooter = attach('footer');
  const recordActivity = (kind: ModalLoadingActivity['kind']) => { activity.push({ kind }); };
  const recordLifecycle = (slot: 'body' | 'footer', event: 'mount' | 'unmount') => {
    lifecycle.push({ slot, event });
  };
  const onCancel = handler('cancel', () => {
    event('cancel');
    open = false;
  });
  const onOk = handler('ok', () => event('ok'));
  const afterClose = handler('after-close', () => event('after-close'));
  // The same ordinary props object is used for the initial and loading states.
  let ownerProps = $derived({ open, loading, title: titleContent, width: modalLoadingGeometry.width, getContainer: false as const,
    onCancel, onOk, afterClose, ...(initial.customizePrefix ? { prefixCls: initial.prefixCls } : {}),
    ...(initial.footer === 'custom-node' ? { footer: footerContent } : {}) });
  let last: { props: unknown; rawProps: unknown } | undefined;
  export function read() {
    if (alive || !last) {
      last = {
        props: recorder.encode(ownerProps),
        rawProps: recorder.raw(ownerProps)
      };
    }
    return { alive, open, loading, footer: initial.footer, prefixCls: initial.prefixCls,
      events: [...events], rawEvents: [...rawEvents], lifecycle: [...lifecycle], activity: [...activity], ...last };
  }
  export function readRefs() { return { ...refs }; }
  export function update(action: ModalLoadingUpdate) {
    if (action.type !== 'loading' || typeof action.value !== 'boolean') {
      throw Error('Unknown ordinary Modal caller update');
    }
    loading = action.value;
  }
  if (ownerCapture) {
    ownerCapture.read = read;
    ownerCapture.readRefs = readRefs;
    ownerCapture.update = update;
  }
  onMount(() => {
    alive = true;
    return () => { alive = false; };
  });
</script>
{#snippet titleContent()}<span data-modal-loading-title="">Loading panel</span>{/snippet}
{#snippet footerContent()}<Footer {attachFooter} activity={recordActivity} lifecycle={recordLifecycle} />{/snippet}
<ConfigProvider theme={{ token: { motion: false } }}><section data-modal-loading-owner={initial.id} {@attach attachOwner}>
  <Modal {...ownerProps}><Body {attachBody} {attachEditor} activity={recordActivity} lifecycle={recordLifecycle} /></Modal>
</section></ConfigProvider>
