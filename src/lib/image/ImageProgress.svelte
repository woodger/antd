<script lang="ts">
  // Renders the Image progress surface while its owner holds back the thumbnail request.
  import type {
    ImageProgressClassNames,
    ImageProgressConfig,
    ImageProgressStyles
  } from './image.types';

  let {
    prefix,
    config,
    class: className,
    style,
    classNames,
    styles,
    nativeElement = $bindable()
  }: {
    prefix: string;
    config?: ImageProgressConfig;
    class?: string;
    style?: string;
    classNames?: ImageProgressClassNames;
    styles?: ImageProgressStyles;
    nativeElement?: HTMLElement;
  } = $props();

  let percent = $derived.by(() => {
    const value = config?.percent;
    if (value === undefined || !Number.isFinite(value)) {
      return undefined;
    }

    return Math.max(0, Math.min(100, Math.round(value)));
  });
  let progressLabel = $derived(percent === undefined ? undefined : `${percent}%`);
</script>

{#snippet rail()}
  {#if progressLabel !== undefined}
    <div class={[`${prefix}-progress-rail`, classNames?.rail]}
      style={[styles?.rail, `--progress-percent:${progressLabel}`].filter(Boolean).join(';')}></div>
  {/if}
{/snippet}

<div bind:this={nativeElement} data-ant-image-prefix={prefix}
  class={[prefix, `${prefix}-progress-wrapper`, 'ant-image-css-var', classNames?.root, className]}
  style={[style, styles?.root].filter(Boolean).join(';')}
  role={percent === undefined ? undefined : 'progressbar'}
  aria-busy={percent === undefined ? true : undefined}
  aria-label={progressLabel}
  aria-valuemin={percent === undefined ? undefined : 0}
  aria-valuemax={percent === undefined ? undefined : 100}
  aria-valuenow={percent}>
  {#if percent === undefined}
    <span class="loading-status" role="status" aria-live="polite">Loading</span>
  {/if}
  <div class={`${prefix}-progress-ink-1`}></div>
  <div class={`${prefix}-progress-ink-2`}></div>
  <div class={[`${prefix}-progress-content`, classNames?.content]} style={styles?.content}>
    {#if config?.render}
      {@render config.render(rail, percent ?? 0)}
    {:else}
      {@render rail()}
      {#if progressLabel !== undefined}
        <div class={[`${prefix}-progress-indicator`, classNames?.indicator]}
          style={styles?.indicator}>{progressLabel}</div>
      {/if}
    {/if}
  </div>
</div>

<style>
  .loading-status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
