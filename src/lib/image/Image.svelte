<script lang="ts">
  // Displays an image and opens its preview. If the image belongs to a group, its owner handles
  // image selection.
  import { onDestroy, untrack } from 'svelte';
  import type {
    ImageProps, ImagePreviewConfig, ImageElementData, ImageSemanticProps
  } from './image.types';
  import { useConfig } from '../config-provider/config-context';
  import { serializeInlineStyleLayers } from '../style/inline-style.engine';
  import { getImagePrefixCss } from './image-prefix.engine';
  import { resolveImagePreviewAppearance, resolveImageSemantics } from './image-semantic.engine';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useImageGroup } from './image-group-context';
  import { checkImageSource } from './image-status.dom';
  import ImagePreview from './ImagePreview.svelte';
  import { defaultImagePreviewIcons } from './ImagePreviewIcons.svelte';
  import ImageProgress from './ImageProgress.svelte';

  let {
    prefixCls: customizePrefixCls,
    previewPrefixCls,
    src,
    alt,
    width,
    height,
    preview = true,
    fallback,
    placeholder,
    class: className = '',
    style,
    rootClassName = '',
    styles,
    classNames,
    onError,
    onLoad,
    onClick,
    onKeyDown,
    tabindex,
    nativeElement = $bindable(),
    imageElement = $bindable(),
    ...attributes
  }: ImageProps = $props();
  const context = useConfig();
  let componentPrefix = $derived(context.getPrefixCls('image', customizePrefixCls));
  let prefixCss = $derived(getImagePrefixCss(componentPrefix, previewPrefixCls));
  const componentTheme = useComponentTheme('Image');
  const group = useImageGroup();
  const id = $props.id();
  let config = $derived<ImagePreviewConfig>(typeof preview === 'object' ? preview : {});
  let appearance = $derived(resolveImagePreviewAppearance(config, context.image?.preview));
  let resolvedFallback = $derived(fallback ?? context.image?.fallback);
  let semanticProps = $derived<ImageSemanticProps>({
    ...attributes,
    prefixCls: customizePrefixCls,
    previewPrefixCls,
    src,
    alt,
    width,
    height,
    fallback,
    placeholder,
    class: className,
    style,
    rootClassName,
    styles,
    classNames,
    onError,
    onLoad,
    onClick,
    onKeyDown,
    tabindex,
    preview: preview ? {
      ...config,
      icons: defaultImagePreviewIcons,
      getContainer: config.getContainer ?? context.getPopupContainer,
      cover: config.cover ?? true,
      mask: appearance.mask.enabled,
      closeIcon: appearance.closeIcon
    } : null
  });
  let semantics = $derived(resolveImageSemantics(context.image, classNames, styles, semanticProps));
  let progress = $derived(typeof placeholder === 'object' ? placeholder?.progress : undefined);
  let canPreview = $derived(
    !progress && Boolean(preview) && !(typeof placeholder === 'function' && !src)
  );
  let rootStyle = $derived(serializeInlineStyleLayers([
    componentTheme.style,
    width === undefined ? undefined : `width:${dimension(width)}`,
    height === undefined ? undefined : `height:${dimension(height)}`
  ]));
  let previewSource = $derived(config.src ?? src ?? undefined);
  let internalOpen = $state(untrack(() => Boolean(config.open)));
  let actualOpen = $derived(config.open ?? internalOpen);
  let status = $state<'loading' | 'normal' | 'error'>(
    untrack(() => typeof placeholder === 'function' ? 'loading' : 'normal')
  );
  let displayed = $derived(status === 'error' && resolvedFallback ? resolvedFallback : src);
  let previousSource = untrack(() => src);
  let sourceSuspended = false;
  let previousOpen = untrack(() => config.open);
  let unregister: (() => void) | undefined;
  let common = $derived<ImageElementData>({
    src: previewSource,
    alt,
    crossorigin: attributes.crossorigin,
    decoding: attributes.decoding,
    draggable: attributes.draggable,
    loading: attributes.loading,
    referrerpolicy: attributes.referrerpolicy,
    sizes: attributes.sizes,
    srcset: attributes.srcset,
    usemap: attributes.usemap,
    fetchpriority: attributes.fetchpriority
  });
  $effect(() => {
    const next = src;
    if (progress) {
      sourceSuspended = true;
      status = 'normal';
      return;
    }
    if (!nativeElement) {
      return;
    }
    if (sourceSuspended || previousSource !== next) {
      status = typeof placeholder === 'function' ? 'loading' : 'normal';
      previousSource = next;
      sourceSuspended = false;
    }
    return checkImageSource(next ?? undefined, nativeElement.ownerDocument, () => {
      status = 'error';
    });
  });
  $effect(() => {
    const next = config.open;
    if (next !== previousOpen || progress) {
      internalOpen = Boolean(next);
    }
    previousOpen = next;
  });
  $effect(() => {
    if (imageElement?.complete
      && (imageElement.naturalWidth
        || imageElement.naturalHeight)
      && status === 'loading') {
      status = 'normal';
    }
  });
  $effect(() => {
    const data = common;
    const enabled = canPreview;
    if (group)
      unregister = untrack(() => group.register(id, { data, canPreview: enabled }));
  });
  onDestroy(() => unregister?.());
  function requestOpen(next: boolean) {
    internalOpen = next;
    config.onOpenChange?.(next);
  }
  function activate() {
    if (group) {
      group.preview(id, previewSource);
    }
    else {
      requestOpen(true);
    }
  }
  function click(event: MouseEvent) {
    if (canPreview)
      activate();
    onClick?.(event);
  }
  function keydown(event: KeyboardEvent) {
    onKeyDown?.(event);
    if (canPreview && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      activate();
    }
  }
  function dimension(value: string | number | undefined) {
    return typeof value === 'number' ? `${value}px` : value;
  }
</script>

<style>
  .image-trigger {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    vertical-align: middle;
  }
  .image-trigger:focus-visible {
    outline: 2px solid var(--ant-color-primary);
    outline-offset: 2px;
  }
</style>

{#if prefixCss}<ThemeScopeStyle css={prefixCss}
  scope={`image-prefix:${componentPrefix}:${previewPrefixCls ?? `${componentPrefix}-preview`}`} />{/if}{#if progress}
  <ImageProgress bind:nativeElement prefix={componentPrefix}
    config={typeof progress === 'object' ? progress : undefined}
    class={[componentTheme.className, rootClassName, className, context.image?.class]
      .filter(Boolean).join(' ')}
    style={serializeInlineStyleLayers([rootStyle, semantics.styles.progressRoot])}
    classNames={semantics.classes.progress} styles={semantics.styles.progress} />
{:else}
  <svelte:element this={canPreview ? 'button' : 'div'} data-ant-image-prefix={componentPrefix}
    bind:this={nativeElement} type={canPreview ? 'button' : undefined}
    role={canPreview ? 'button' : undefined}
    class={[
      `image-trigger ${componentPrefix} ant-image-css-var`,
      componentTheme.className,
      rootClassName,
      semantics.classes.root,
      status === 'error' && `${componentPrefix}-error`
    ]}
    style={serializeInlineStyleLayers([rootStyle, semantics.styles.root]) ?? ''}
    tabindex={canPreview ? tabindex ?? 0 : tabindex} aria-label={canPreview
      ? attributes['aria-label'] ?? alt ?? context.locale.image?.preview ?? 'Image preview'
      : attributes['aria-label']}
    onclick={click} onkeydown={keydown}>
    {#if !(typeof placeholder === 'function' && !src)}
      {#key displayed}
        <img {...attributes} bind:this={imageElement} src={displayed || undefined}
          {alt} {width} {height}
          class={[
            `${componentPrefix}-img`,
            placeholder === true && `${componentPrefix}-img-placeholder`,
            className,
            context.image?.class,
            semantics.classes.image
          ]}
          style={serializeInlineStyleLayers([
            height === undefined ? undefined : `height:${dimension(height)}`, semantics.styles.image
          ]) ?? ''}
          onload={event => {
            if (event.currentTarget !== imageElement || !event.currentTarget.isConnected) return;
            if (!(status === 'error' && resolvedFallback))
              status = 'normal';
            onLoad?.(event);
          }}
          onerror={event => {
            if (event.currentTarget !== imageElement || !event.currentTarget.isConnected) return;
            status = 'error';
            onError?.(event);
          }} />
      {/key}
    {/if}
    {#if typeof placeholder === 'function' && (!src || status === 'loading')}
      <div class={`${componentPrefix}-placeholder`} aria-hidden="true">{@render placeholder()}</div>
    {/if}
    {#if canPreview && config.cover !== false}
      <div class={[
        `${componentPrefix}-cover`,
        `${componentPrefix}-cover-${typeof config.cover === 'object'
          ? config.cover.placement ?? 'center'
          : 'center'}`,
        semantics.classes.cover
      ]} style={semantics.styles.cover} aria-hidden="true">
        {#if typeof config.cover === 'function'}
          {@render config.cover()}
        {:else if typeof config.cover === 'object' && config.cover.coverNode}
          {@render config.cover.coverNode()}
        {/if}
      </div>
    {/if}
  </svelte:element>
{/if}
{#if canPreview && !group}
  <ImagePreview imagePrefix={componentPrefix} previewPrefix={previewPrefixCls}
    open={actualOpen} image={{ url: previewSource, alt: alt ?? undefined, width, height }}
    {config} {appearance} classNames={semantics.classes.popup} styles={semantics.styles.popup}
    fallback={resolvedFallback} imageAttributes={common} onClose={() => requestOpen(false)} />
{/if}
