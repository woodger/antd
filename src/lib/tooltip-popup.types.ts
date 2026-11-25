import type { TooltipUnique } from './tooltip-unique.model.svelte';
import type { ZIndexLayer } from './z-index-context.svelte';
import type {
  AdjustOverflow, TooltipArrow, TooltipColor, TooltipContent, TooltipPlacement, TooltipProps
} from './tooltip.types';

/** Входы одной поверхности. Группа повторно использует их при передаче панели между целями. */
export interface TooltipPopupProps {
  title: TooltipContent;
  contentAvailable?: boolean;
  color?: TooltipColor;
  prefixCls?: string;
  openClassName?: string;
  destroyOnHidden?: boolean;
  fresh?: boolean;
  open: boolean;
  id?: string;
  disabled?: boolean;
  forceRender?: boolean;
  zIndex?: number;
  zIndexLayer?: ZIndexLayer;
  anchor?: Element;
  describe?: Element | ((id: string) => () => void);
  trigger?: Element;
  placement?: TooltipPlacement;
  align?: TooltipProps['align'];
  builtinPlacements?: TooltipProps['builtinPlacements'];
  onPopupAlign?: TooltipProps['onPopupAlign'];
  arrow?: TooltipArrow;
  autoAdjustOverflow?: boolean | AdjustOverflow;
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement | ShadowRoot;
  semanticProps?: Omit<TooltipProps, 'children'>;
  ownerClassName?: string;
  sourceAnchor?: boolean;
  unique?: boolean;
  presentation?: TooltipUnique;
  outsideEvents?: 'pointer' | 'mouse';
  onDismiss: (reason: 'escape' | 'outside') => void;
  onHoverChange?: (hovered: boolean) => void;
}
