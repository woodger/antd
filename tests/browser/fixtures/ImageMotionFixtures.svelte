<script lang="ts">
  // Drives controlled preview changes and records completion after the native dialog has settled.
  import { untrack } from 'svelte';
  import { ConfigProvider, Image, ImagePreviewGroup } from '@woodger/antd';
  import type { ImagePreviewConfig, ImageSemantic } from '@woodger/antd';
  import reference from './ant-design-image-motion-reference.json';

  let { initialCase = '' }: { initialCase?: string; } = $props();
  const photo = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2280%22%3E%3C/svg%3E';
  const classNames = { popup: { root: 'image-motion-probe', body: 'image-motion-body' } };
  const styles = { popup: { body: 'transform-origin:25% 75%;--body-marker:configured' } };
  const semanticNames: ImageSemantic = ({ props }) => ({
    ...classNames,
    root: `fixture-motion:${props.preview?.motionName ?? 'undefined'}`
  });
  let name = $state(untrack(() => initialCase));
  const sample = $derived(reference.cases.find(item => item.name === name));
  let open = $state(untrack(() => reference.cases.some(item =>
    item.name === initialCase && item.initial
  )));
  let retargeted = $state(false);
  let targetPresent = $state(true);
  let requested = $state<boolean[]>([]);
  let reported = $state<boolean[]>([]);
  let hiddenFocus = $state<(string | null)[]>([]);
  let transformActions = $state<string[]>([]);

  const motionName = $derived(sample?.undefinedName || sample?.css !== undefined
    ? { motionName: sample?.css } : {});
  const getContainer = $derived.by(() => {
    if (retargeted) return '#image-motion-retargeted';
    if (name === 'detached-target') return '#image-motion-target';
    return sample?.inline ? false : undefined;
  });
  const preview = $derived<ImagePreviewConfig>({
    open,
    cover: false,
    getContainer,
    ...motionName,
    onOpenChange(next) {
      requested.push(next);
      open = next;
    },
    afterOpenChange(next) {
      reported.push(next);
      if (!next) hiddenFocus.push(document.activeElement?.getAttribute('aria-label') ?? null);
    },
    onTransform({ action }) {
      transformActions.push(action);
    }
  });

  function choose(next: string) {
    open = reference.cases.some(item => item.name === next && item.initial);
    retargeted = false;
    targetPresent = true;
    requested = [];
    reported = [];
    hiddenFocus = [];
    transformActions = [];
    name = next;
  }
</script>

<section id="image-motion-fixture">
  <label>Preview motion case
    <select value={name} onchange={event => choose(event.currentTarget.value)}>
      <option value="">Choose a case</option>
      {#each reference.cases as item}<option value={item.name}>{item.name}</option>{/each}
      <option value="detached-target">detached-target</option>
    </select>
  </label>
  <button type="button" onclick={() => { open = true; }}>Open motion preview</button>
  <button type="button" onclick={() => { open = false; }}>Close motion preview</button>
  <button type="button" onclick={() => { retargeted = true; }}>Retarget motion preview</button>
  <button type="button" onclick={() => { targetPresent = false; }}>Remove preview target</button>
  <button type="button" onclick={() => { name = ''; }}>Unmount motion preview</button>
  <output aria-label="Preview requests">{JSON.stringify(requested)}</output>
  <output aria-label="Preview completions">{JSON.stringify(reported)}</output>
  <output aria-label="Focus on completion">{JSON.stringify(hiddenFocus)}</output>
  <output aria-label="Preview transforms">{JSON.stringify(transformActions)}</output>
  {#if targetPresent}<div id="image-motion-target"></div>{/if}
  <div id="image-motion-retargeted"></div>

  {#if name}{#key name}
    <ConfigProvider theme={{ token: { motion: sample?.theme !== false } }}>
      {#if sample?.group}
        <ImagePreviewGroup preview={sample.disabled ? false : preview}
          previewPrefixCls={sample.prefix} {classNames} {styles}>
          <Image src={photo} width={120} height={80} alt="Motion sample" preview={{ cover: false }} />
          <Image src={photo} width={120} height={80} alt="Motion next" preview={{ cover: false }} />
        </ImagePreviewGroup>
      {:else}
        <Image src={photo} width={120} height={80} alt="Motion sample"
          previewPrefixCls={sample?.independentPrefix} {preview} classNames={semanticNames} {styles} />
      {/if}
    </ConfigProvider>
  {/key}{/if}
</section>

<style>
  :global(.photo-motion-appear-active),
  :global(.photo-motion-enter-active) {
    animation: photo-show .32s linear both;
  }
  :global(.photo-motion-leave-active) {
    animation: photo-hide .32s linear both;
  }
  @keyframes -global-photo-show {
    from {
      opacity: .2;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes -global-photo-hide {
    from {
      opacity: 1;
    }
    to {
      opacity: .2;
    }
  }
</style>
