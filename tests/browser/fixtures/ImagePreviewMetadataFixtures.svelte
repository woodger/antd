<script lang="ts">
  // Exposes the original image metadata through both render snippets and can mutate preview props
  // in place while a native viewer is open.
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Image, ImagePreviewGroup,
    type ImageInfo, type ImagePreviewConfig, type ImagePreviewGroupConfig,
    type ImagePreviewGroupItem, type ImagePreviewRenderInfo
  } from '@woodger/antd';
  import reference from './ant-design-image-preview-metadata-reference.json';
  import { imageInvalid } from './image-data';

  let { initialCase = '' }: { initialCase?: string; } = $props();

  const photo = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2280%22%3E%3C/svg%3E';
  const thumbnail = source('thumbnail');
  const items: ImagePreviewGroupItem[] = [
    { src: source('item-first'), alt: 'First item', decoding: 'async' },
    { src: source('item-second'), alt: 'Second item', decoding: 'sync' }
  ];
  const childPreview: ImagePreviewConfig = { src: source('child-preview'), alt: 'Child viewer label' };
  const locale = { image: { preview: 'Preview fallback label' } };
  const classNames = { popup: { root: 'image-metadata-viewer' } };

  let name = $state(untrack(() => initialCase));
  const sample = $derived(reference.cases.find(item => item.id === name));
  const fallback = $derived(sample?.fallback ? source('fallback') : undefined);
  let single = $state<ImagePreviewConfig>(untrack(() => previewFor(initialCase)));
  let group = $state<ImagePreviewGroupConfig>(untrack(() => ({
    ...previewFor(initialCase), current: 0, onChange: change
  })));
  let changes = $state<[number, number][]>([]);

  /** Uses an inline image for deterministic loading and a real invalid payload for fallback. */
  function source(key: string | null) {
    if (key === null) return undefined;
    if (key === '') return '';
    if (key === 'invalid') return imageInvalid;

    return `${photo}#${key}`;
  }

  /** Preserves the difference between a missing key and an explicit undefined property. */
  function previewFor(id: string): ImagePreviewConfig {
    const selected = reference.cases.find(item => item.id === id);
    const preview: ImagePreviewConfig = {
      open: true,
      motionName: '',
      getContainer: false,
      imageRender: renderImage,
      actionsRender: renderActions,
      onOpenChange: next => {
        if (sample?.group) group.open = next;
        else single.open = next;
      }
    };
    if (selected && Object.hasOwn(selected, 'alt')) preview.alt = selected.alt ?? undefined;
    if (selected && Object.hasOwn(selected, 'src')) preview.src = source(selected.src ?? null);

    return preview;
  }

  /** Keeps the source key and the raw description even when the visible image uses a fallback. */
  function readInfo(image: ImageInfo, current: number | undefined) {
    const url = image.url === imageInvalid ? 'invalid'
      : image.url?.split('#').at(-1) ?? null;

    return {
      url,
      alt: image.alt ?? null,
      width: image.width ?? null,
      height: image.height ?? null,
      current: current ?? null
    };
  }

  function choose(next: string) {
    single = previewFor(next);
    group = { ...previewFor(next), current: 0, onChange: change };
    changes = [];
    name = next;
  }

  function change(next: number, previous: number) {
    changes.push([next, previous]);
    group.current = next;
  }

  function setGroupPreview() {
    group.src = source('override');
    group.alt = 'Shared viewer label';
  }

  function clearGroupPreview() {
    delete group.src;
    delete group.alt;
  }
</script>

{#snippet renderImage(original: Snippet, info: { image: ImageInfo; current?: number; })}
  {@render original()}
  <output data-image-render>{JSON.stringify(readInfo(info.image, info.current))}</output>
{/snippet}

{#snippet renderActions(original: Snippet, info: ImagePreviewRenderInfo)}
  {@render original()}
  <output data-image-actions>{JSON.stringify({
    ...readInfo(info.image, info.current), total: info.total, scale: info.transform.scale
  })}</output>
{/snippet}

<section id="image-preview-metadata-fixture">
  <label>Image metadata case
    <select value={name} onchange={event => choose(event.currentTarget.value)}>
      <option value="">Choose a case</option>
      {#each reference.cases as entry}<option value={entry.id}>{entry.id}</option>{/each}
    </select>
  </label>
  <button type="button" onclick={setGroupPreview}>Set group preview image</button>
  <button type="button" onclick={clearGroupPreview}>Clear group preview image</button>
  <button type="button" onclick={() => { group.current = 1; }}>Select second item</button>
  <button type="button" onclick={() => { single.alt = 'Updated viewer label'; }}>Rename preview image</button>
  <button type="button" onclick={() => { delete single.alt; }}>Restore thumbnail wording</button>
  <output id="image-metadata-changes">{JSON.stringify(changes)}</output>

  {#if sample}{#key sample.id}
    <ConfigProvider {locale} theme={{ token: { motion: false } }}>
      {#if sample.group}
        <ImagePreviewGroup items={sample.child ? undefined : sample.empty ? [] : items}
          preview={group} {fallback} {classNames}>
          {#if sample.child}
            <Image id="metadata-thumbnail" src={thumbnail} alt="Thumbnail label" preview={childPreview} />
          {/if}
        </ImagePreviewGroup>
      {:else}
        <Image id="metadata-thumbnail" src={thumbnail} alt="Thumbnail label" width={120}
          height={80} preview={single} {fallback} {classNames} />
      {/if}
    </ConfigProvider>
  {/key}{/if}
</section>
