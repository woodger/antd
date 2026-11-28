<script lang="ts">
  // Registers images and ties the viewer index to the group's current list. Selection events go to
  // the same owner.
  import { untrack } from 'svelte';
  import { useConfig } from '../config-provider/config-context';
  import { getImagePrefixCss } from './image-prefix.engine';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import type {
    ImagePreviewGroupProps,
    ImagePreviewGroupConfig,
    ImagePreviewGroupSemanticProps
  } from './image-preview-group.types';
  import type { ImageGroupEntry } from './image-group-context';
  import type { ImagePoint } from './image-preview.engine';
  import { provideImageGroup } from './image-group-context';
  import { getImagePreviewItems, getImagePreviewIndex } from './image-preview-group.engine';
  import { resolveImagePreviewAppearance, resolveImageSemantics } from './image-semantic.engine';
  import ImagePreview from './ImagePreview.svelte';

  let {
    items, preview = true, fallback, children, classNames, styles, previewPrefixCls, ...rest
  }: ImagePreviewGroupProps = $props();
  const icons = $derived(rest.icons);
  const ownsIcons = $derived(Object.hasOwn(rest, 'icons'));
  const viewerIcons = $derived(preview === false && ownsIcons ? icons ?? {} : undefined);
  const context = useConfig();
  let componentPrefix = $derived(context.getPrefixCls('image', previewPrefixCls));
  let prefixCss = $derived(getImagePrefixCss(componentPrefix));
  let config = $derived<ImagePreviewGroupConfig>(typeof preview === 'object' ? preview : {});
  let appearance = $derived(resolveImagePreviewAppearance(
    config, preview ? context.image?.preview : undefined
  ));
  let semanticProps = $derived<ImagePreviewGroupSemanticProps>({
    items, fallback, children, classNames, styles, ...(ownsIcons ? { icons } : {})
  });
  let semantics = $derived(resolveImageSemantics(context.image, classNames, styles, semanticProps));
  let registered = $state.raw<ReadonlyMap<string, ImageGroupEntry>>(new Map());
  let entries = $derived(getImagePreviewItems(items, registered));
  let innerCurrent = $state(untrack(() => config.current ?? 0));
  let current = $derived(config.current ?? innerCurrent);
  let innerOpen = $state(untrack(() => Boolean(config.open)));
  let opened = $derived(config.open ?? innerOpen);
  let data = $derived(entries[current]?.data ?? {});
  const viewerConfig = $derived({ ...config, onOpenChange: undefined });
  const motionName = $derived.by(() => {
    if (preview === false) return undefined;
    return Object.hasOwn(config, 'motionName') ? config.motionName : `${componentPrefix}-preview-fade`;
  });
  let previewOrigin = $state.raw<ImagePoint>();
  let keepOpenIndex = false;
  let previousOpen = false;
  let previous = untrack(() => ({ current: config.current, open: config.open }));
  $effect(() => {
    const next = { current: config.current, open: config.open };
    if (next.current !== previous.current)
      innerCurrent = next.current ?? 0;
    if (next.open !== previous.open)
      innerOpen = Boolean(next.open);
    previous = next;
  });
  $effect(() => {
    const next = opened;
    untrack(() => {
      if (next && !previousOpen && !keepOpenIndex)
        innerCurrent = 0;
      if (!next)
        keepOpenIndex = false;
      previousOpen = next;
    });
  });
  function register(id: string, entry: ImageGroupEntry) {
    const next = new Map(registered);
    next.set(id, entry);
    registered = next;
    return () => {
      const next = new Map(registered);
      next.delete(id);
      registered = next;
    };
  }
  function requestOpen(next: boolean, index = current) {
    const before = opened;
    innerOpen = next;
    if (next !== before)
      config.onOpenChange?.(next, { current: index });
  }
  function fromImage(id: string, source: string | undefined, origin: ImagePoint | undefined) {
    const before = current;
    innerCurrent = getImagePreviewIndex(entries, id, source, items !== undefined);
    requestOpen(true, before);
    previewOrigin = origin;
    keepOpenIndex = true;
  }
  function close() {
    requestOpen(false);
    previewOrigin = undefined;
  }
  function change(next: number, previous: number) {
    innerCurrent = next;
    config.onChange?.(next, previous);
  }
  provideImageGroup({ register, preview: fromImage });
</script>

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`image-prefix:${componentPrefix}`} />{/if}{#if children}{@render children()}{/if}<ImagePreview imagePrefix={componentPrefix} open={opened} image={{ url: data.src ?? undefined, alt: data.alt ?? undefined }} config={viewerConfig}
  {motionName} inheritContainer={preview !== false} icons={viewerIcons}
  origin={previewOrigin} {appearance} classNames={semantics.classes.popup} styles={semantics.styles.popup} {fallback}
  imageAttributes={data} onClose={close} {current} count={entries.length} group onChange={change} countRender={config.countRender} />
