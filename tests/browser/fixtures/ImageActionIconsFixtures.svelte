<script lang="ts">
  // Exposes the render-info contract and renders the supplied buttons beside the original toolbar.
  import { untrack, type Snippet } from 'svelte';
  import { ConfigProvider, Image, ImagePreviewGroup } from '@woodger/antd';
  import type {
    ImagePreviewConfig, ImagePreviewGroupProps, ImagePreviewIcons, ImagePreviewRenderInfo,
    ImageSemantic, ImageTransform, ImageTransformAction
  } from '@woodger/antd';
  import reference from './ant-design-image-action-icons-reference.json';

  let { initialCase = '' }: { initialCase?: string; } = $props();
  const photo = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2280%22%3E%3C/svg%3E';
  const images = ['First', 'Second'].map((alt, index) => ({ src: `${photo}#${index}`, alt }));
  const configured: ImagePreviewIcons = {
    zoomIn: customZoom, rotateLeft: customRotate, close: customClose,
    prev: customPrev, next: customNext
  };
  let name = $state(untrack(() => initialCase));
  const sample = $derived(reference.cases.find(item => item.name === name));
  const groupIcons = $derived.by((): Pick<ImagePreviewGroupProps, 'icons'> => {
    if (sample?.topIcons === 'undefined') return { icons: undefined };
    if (sample?.topIcons === 'empty') return { icons: {} };
    return sample?.topIcons ? { icons: configured } : {};
  });
  let transformEvents = $state<[ImageTransformAction, ImageTransform][]>([]);
  let indexChanges = $state<[number, number][]>([]);
  const preview: ImagePreviewConfig = {
    open: true,
    minScale: 1,
    maxScale: 1.5,
    icons: configured,
    onTransform: ({ action, transform }) => transformEvents.push([action, transform]),
    actionsRender: replacement
  };
  const groupPreview = $derived.by((): ImagePreviewGroupProps['preview'] => {
    if (sample?.config === 'disabled') return false;
    if (sample?.config === 'true') return true;
    if (sample?.config === 'default') return undefined;
    return { ...preview, onChange: (next, previous) => indexChanges.push([next, previous]) };
  });

  const semantics: ImageSemantic = ({ props }) => {
    if (!props.preview) return {};
    const icons = props.preview.icons;
    const names = Object.keys(icons).map(key => `semantic-preview-icon-${key}`);
    const origin = icons.zoomIn === configured.zoomIn ? 'supplied-zoom-icon' : 'builtin-zoom-icon';
    return { root: [...names, origin].join(' ') };
  };

  function choose(next: string) {
    name = next;
    transformEvents = [];
    indexChanges = [];
  }
</script>

{#snippet customZoom()}<span data-custom-icon="zoomIn">Zoom</span>{/snippet}
{#snippet customRotate()}<span data-custom-icon="rotateLeft">Rotate</span>{/snippet}
{#snippet customClose()}<span data-custom-icon="close">Dismiss</span>{/snippet}
{#snippet customPrev()}<span data-custom-icon="prev">Earlier</span>{/snippet}
{#snippet customNext()}<span data-custom-icon="next">Later</span>{/snippet}

{#snippet replacement(original: Snippet, info: ImagePreviewRenderInfo)}
  <div data-reference-toolbar data-current={info.current} data-total={info.total}
    data-fields={JSON.stringify(Object.keys(info).sort())}
    data-icon-keys={JSON.stringify(Object.keys(info.icons))}>
    {#each Object.values(info.icons) as icon}
      {#if icon}{@render icon()}{/if}
    {/each}
    <section data-original-toolbar>{@render original()}</section>
  </div>
{/snippet}

<section id="image-action-icons-fixture">
  <label>Image icon case
    <select value={name} onchange={event => choose(event.currentTarget.value)}>
      <option value="">Choose a case</option>
      {#each reference.cases as item}<option value={item.name}>{item.name}</option>{/each}
    </select>
  </label>
  {#if sample}{#key sample.name}
    <ConfigProvider direction={sample.rtl ? 'rtl' : 'ltr'} theme={{ token: { motion: false } }}>
      {#if sample.group}
        <ImagePreviewGroup items={images.slice(0, sample.count ?? 2)} preview={groupPreview} {...groupIcons}>
          {#if sample.config}<Image src={images[0].src} alt={images[0].alt} />{/if}
        </ImagePreviewGroup>
      {:else}
        <Image src={images[0].src} alt={images[0].alt} {preview} classNames={semantics} />
      {/if}
    </ConfigProvider>
  {/key}{/if}
  <output aria-label="Image action events">{JSON.stringify(transformEvents)}</output>
  <output aria-label="Image action index changes">{JSON.stringify(indexChanges)}</output>
</section>
