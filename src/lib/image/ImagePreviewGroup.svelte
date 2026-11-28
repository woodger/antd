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
  import { provideImageGroup } from './image-group-context';
  import { getImagePreviewItems, getImagePreviewIndex } from './image-preview-group.engine';
  import { resolveImagePreviewAppearance, resolveImageSemantics } from './image-semantic.engine';
  import ImagePreview from './ImagePreview.svelte';

  let {
    items, preview = true, fallback, children, classNames, styles, previewPrefixCls
  }: ImagePreviewGroupProps = $props();
  const context = useConfig();
  let componentPrefix = $derived(context.getPrefixCls('image', previewPrefixCls));
  let prefixCss = $derived(getImagePrefixCss(componentPrefix));
  let config = $derived<ImagePreviewGroupConfig>(typeof preview === 'object' ? preview : {});
  let appearance = $derived(resolveImagePreviewAppearance(
    config, preview ? context.image?.preview : undefined
  ));
  let semanticProps = $derived<ImagePreviewGroupSemanticProps>({
    items, fallback, children, classNames, styles
  });
  let semantics = $derived(resolveImageSemantics(context.image, classNames, styles, semanticProps));
  let registered = $state.raw<ReadonlyMap<string, ImageGroupEntry>>(new Map());
  let entries = $derived(getImagePreviewItems(items, registered));
  let innerCurrent = $state(untrack(() => config.current ?? 0));
  let current = $derived(config.current ?? innerCurrent);
  let innerOpen = $state(untrack(() => Boolean(config.open)));
  let opened = $derived(config.open ?? innerOpen);
  let data = $derived(entries[current]?.data ?? {});
  let viewerConfig = $derived({ ...config, onOpenChange: undefined });
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
  function fromImage(id: string, source: string | undefined) {
    const before = current;
    innerCurrent = getImagePreviewIndex(entries, id, source, items !== undefined);
    requestOpen(true, before);
    keepOpenIndex = true;
  }
  function change(next: number, previous: number) {
    innerCurrent = next;
    config.onChange?.(next, previous);
  }
  provideImageGroup({ register, preview: fromImage });
</script>

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`image-prefix:${componentPrefix}`} />{/if}{#if children}{@render children()}{/if}<ImagePreview imagePrefix={componentPrefix} open={opened} image={{ url: data.src ?? undefined, alt: data.alt ?? undefined }} config={viewerConfig}
  {appearance} classNames={semantics.classes.popup} styles={semantics.styles.popup} {fallback}
  imageAttributes={data} onClose={() => requestOpen(false)} {current} count={entries.length} group onChange={change} countRender={config.countRender} />
