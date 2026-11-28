<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ConfigProvider, Image } from '@woodger/antd';

  const source = '/image-progress.svg';
  const examples = [
    { id: 'busy', progress: true },
    { id: 'rounded', progress: { percent: 32.6 } },
    { id: 'under', progress: { percent: -5 } },
    { id: 'over', progress: { percent: 101.4 } },
    { id: 'invalid', progress: { percent: NaN } }
  ];

  let pending = $state(true);
  let percent = $state(20);
  let loads = $state(0);
  let imageElement = $state<HTMLImageElement>();
</script>

{#snippet progressContent(rail: Snippet, value: number)}
  {@render rail()}
  <span>Loaded {value}</span>
{/snippet}

{#snippet thumbnailLoading()}
  <span>Thumbnail loading</span>
{/snippet}

<section id="image-progress-fixture">
  {#each examples as { id, progress } (id)}
    <div data-image-progress={id}>
      <Image src={source} alt="Example thumbnail" width={220} height={112}
        placeholder={{ progress }} />
    </div>
  {/each}

  <div data-image-progress="custom">
    <Image src={source} alt="Custom thumbnail" prefixCls="photo" width={220} height={112}
      placeholder={{ progress: { percent: 12.6, render: progressContent } }}
      classNames={{ placeholder: { progress: { root: 'progress-root', rail: 'progress-rail' } } }}
      styles={{ placeholder: { progress: { root: 'width:192px', rail: 'height:9px' } } }} />
  </div>

  <ConfigProvider theme={{ components: { Image: { progressAnimationDuration: '5s' } } }}>
    <div data-image-progress="dynamic">
      <Image src={source} alt="Prepared thumbnail" width={220} height={112}
        placeholder={pending ? { progress: { percent } } : thumbnailLoading} bind:imageElement
        onLoad={() => loads++} />
    </div>
  </ConfigProvider>
  <button type="button" onclick={() => percent = 64.6}>Advance image progress</button>
  <button type="button" onclick={() => pending = !pending}>Toggle image progress</button>
  <output aria-label="Thumbnail load count">{loads}</output>
  <output aria-label="Thumbnail ref">{imageElement?.tagName ?? 'none'}</output>
</section>
