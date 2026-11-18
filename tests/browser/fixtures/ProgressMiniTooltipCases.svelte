<script lang="ts">
  import { createRawSnippet, untrack } from 'svelte';
  import { ConfigProvider, Progress } from 'antd-svelte';
  import type { ProgressStatus } from 'antd-svelte';
  import reference from './ant-design-progress-mini-tooltip-reference.json';

  const samples = reference.cases as readonly {
    name: string;
    props: { type: 'circle'; size: number; percent: number; status: ProgressStatus; };
  }[];
  let mounted = $state(true);
  let alternateGetter = $state(false);
  let providerTarget = $state<HTMLDivElement>();
  let providerRoot = $state<HTMLDivElement>();
  let getterCalls = $state(0);
  let receivedTrigger = $state<HTMLElement>();
  let snippetMounts = $state(0);
  let snippetUnmounts = $state(0);
  let percent = $state(60);
  let modal = $state<HTMLDialogElement>();
  const caption = createRawSnippet(() => ({
    render: () => '<strong data-mini-progress-caption>Lazy caption</strong>',
    setup() {
      untrack(() => snippetMounts++);
      return () => { untrack(() => snippetUnmounts++); };
    }
  }));
  const formatter = () => caption;

  function container(trigger?: HTMLElement) {
    untrack(() => {
      getterCalls++;
      receivedTrigger = trigger;
    });
    if (!providerTarget) throw new Error('Progress popup target is not mounted');
    return providerTarget;
  }

  const firstContainer = (trigger?: HTMLElement) => container(trigger);
  const secondContainer = (trigger?: HTMLElement) => container(trigger);
</script>

<section data-mini-progress-fixture style="padding:32px;display:flex;gap:28px;flex-wrap:wrap">
  {#each samples as sample (sample.name)}
    <div data-mini-progress={sample.name}>
      {#if mounted}<Progress {...sample.props} aria-label="Miniature circle" />{/if}
    </div>
  {/each}

  <div data-mini-progress-target bind:this={providerTarget}></div>
  <ConfigProvider getPopupContainer={alternateGetter ? secondContainer : firstContainer}>
    <div data-mini-progress="provider">
      {#if mounted}<Progress type="circle" percent={60} size={18}
        aria-label="Provider miniature circle" bind:nativeElement={providerRoot} />{/if}
    </div>
  </ConfigProvider>
  <ConfigProvider prefixCls="suite">
    <div data-mini-progress="snippet">
      {#if mounted}<Progress type="circle" {percent} size={18} format={formatter}
        prefixCls="tiny-progress" aria-label="Lazy miniature circle"
        classNames={{ indicator: 'tiny-caption' }}
        styles={{ indicator: 'color:rgb(102,34,170);font-size:19px' }} />{/if}
    </div>
  </ConfigProvider>
</section>
<dialog bind:this={modal}>
  {#if mounted}<Progress type="circle" percent={60} size={18} aria-label="Modal miniature circle" />{/if}
  <button type="button" onclick={() => modal?.close()}>Close tiny Progress modal</button>
</dialog>
<button type="button" onclick={() => modal?.showModal()}>Open tiny Progress modal</button>
<button type="button" onclick={() => alternateGetter = !alternateGetter}>
  Replace tiny Progress getter
</button>
<button type="button" onclick={() => percent = 80}>Update tiny Progress percent</button>
<button type="button" onclick={() => mounted = false}>Unmount tiny Progress cases</button>
<output aria-label="Tiny Progress getter calls">{getterCalls}</output>
<output aria-label="Tiny Progress getter trigger">
  {receivedTrigger !== undefined
    && receivedTrigger === providerRoot?.querySelector('[data-ant-progress-circle-body]')}
</output>
<output aria-label="Tiny Progress snippet mounts">{snippetMounts}</output>
<output aria-label="Tiny Progress snippet unmounts">{snippetUnmounts}</output>
