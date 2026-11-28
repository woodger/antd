// Resolves the Image surface layers from a provider and its owner. Popup styles replace each
// supplied slot and placeholder styles replace the progress record as in the pinned React merge.
import { resolveDialogMask } from '../dialog/dialog-interaction.engine';
import { serializeInlineStyleLayers } from '../style/inline-style.engine';
import type { ImagePreviewGroupSemanticProps } from './image-preview-group.types';
import type {
  ImageConfig, ImagePreviewConfig, ImageSemantic, ImageSemanticProps, ImageSlots
} from './image.types';

const popupKeys = ['root', 'mask', 'body', 'footer', 'actions', 'close'] as const;
const progressKeys = ['root', 'content', 'rail', 'indicator'] as const;
type PreviewAppearance = Pick<ImagePreviewConfig, 'mask' | 'closeIcon'>;

/** Inherits unset preview appearance fields and preserves an explicit native closeIcon=null. */
export function resolveImagePreviewAppearance(
  local: PreviewAppearance,
  provider: PreviewAppearance | undefined
) {
  return {
    mask: resolveDialogMask(local.mask, provider?.mask),
    closeIcon: local.closeIcon === undefined ? provider?.closeIcon : local.closeIcon
  };
}

export type ResolvedImagePreviewAppearance = ReturnType<typeof resolveImagePreviewAppearance>;

/** Evaluates a semantic resolver with the component's render-time public props. */
function resolveSlots<Props>(value: ImageSemantic<Props> | undefined, props: Props): ImageSlots {
  return (typeof value === 'function' ? value({ props }) : value) ?? {};
}

/** Joins the class layers in provider-to-owner order. */
function joinClasses(provider: string | undefined, local: string | undefined) {
  return [provider, local].filter(Boolean).join(' ') || undefined;
}

/** Accumulates classes for the nested semantic nodes without flattening progress. */
function mergeClassGroup<Key extends string>(
  keys: readonly Key[],
  provider: Partial<Record<Key, string>> | undefined,
  local: Partial<Record<Key, string>> | undefined
) {
  const classes: Partial<Record<Key, string>> = {};
  for (const key of keys) {
    const value = joinClasses(provider?.[key], local?.[key]);
    if (value !== undefined) {
      classes[key] = value;
    }
  }

  return classes;
}

/** Merges thumbnail, progress, and viewer slots while preserving their different style layers. */
export function resolveImageSemantics<
  Props extends ImageSemanticProps | ImagePreviewGroupSemanticProps
>(
  provider: ImageConfig | undefined,
  classNames: ImageSemantic<Props> | undefined,
  styles: ImageSemantic<Props> | undefined,
  props: Props
) {
  const providerClasses = resolveSlots(provider?.classNames, props);
  const localClasses = resolveSlots(classNames, props);
  const providerStyles = resolveSlots(provider?.styles, props);
  const localStyles = resolveSlots(styles, props);
  const style = 'style' in props ? props.style : undefined;

  return {
    classes: {
      root: joinClasses(providerClasses.root, localClasses.root),
      image: joinClasses(providerClasses.image, localClasses.image),
      cover: joinClasses(providerClasses.cover, localClasses.cover),
      popup: mergeClassGroup(popupKeys, providerClasses.popup, localClasses.popup),
      progress: mergeClassGroup(
        progressKeys, providerClasses.placeholder?.progress, localClasses.placeholder?.progress
      )
    },
    styles: {
      root: serializeInlineStyleLayers([providerStyles.root, localStyles.root]),
      image: serializeInlineStyleLayers([
        providerStyles.image, provider?.style, localStyles.image, style
      ]),
      cover: serializeInlineStyleLayers([providerStyles.cover, localStyles.cover]),
      popup: { ...providerStyles.popup, ...localStyles.popup },
      progress: { ...providerStyles.placeholder, ...localStyles.placeholder }.progress,
      progressRoot: serializeInlineStyleLayers([
        providerStyles.root, provider?.style, localStyles.root, style
      ])
    }
  };
}
