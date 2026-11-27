import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export type TourContent = string | number | bigint | boolean | null | undefined
  | Snippet | readonly TourContent[];
export type TourPlacement = 'center' | 'top' | 'bottom' | 'left' | 'right'
  | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
export type TourType = 'default' | 'primary';
export type TourTarget = HTMLElement | null | (() => HTMLElement | null | undefined);
export type TourArrow = boolean | { pointAtCenter: boolean; };
export type TourMask = boolean | { style?: string; color?: string; };
export type TourSemanticName = 'root' | 'cover' | 'close' | 'mask' | 'section' | 'footer'
  | 'actions' | 'indicator' | 'indicators' | 'header' | 'title' | 'description';
export type TourSlots = Partial<Record<TourSemanticName, string>>;
export type TourSemantic = TourSlots | ((info: { props: TourProps; }) => TourSlots);

/** Illuminated area: X/Y offset, default 6px; radius by default 2px. */
export interface TourGap {
  offset?: number | readonly [number, number];
  radius?: number;
}

/** False hides the closure and disables Escape; aria/data attributes refer to the button. */
export type TourClosable = boolean | {
  closeIcon?: TourContent;
  role?: HTMLAttributes<HTMLButtonElement>['role'];
  [name: `aria-${string}`]: string | number | boolean | undefined;
  [name: `data-${string}`]: string | number | boolean | undefined;
};

/** Settings Previous/Next/Finish button; callback goes after the transition. */
export interface TourButtonProps {
  children?: TourContent;
  onClick?: (event: MouseEvent & { currentTarget: HTMLButtonElement; }) => void;
  class?: string;
  style?: string;
}

/** Tour step; local arrow/mask/placement/type take precedence over the overall. */
export interface TourStepProps {
  title: TourContent;
  description?: TourContent;
  cover?: TourContent;
  /** Getter is called only in the browser; null/undefined means the center of the screen. */
  target?: TourTarget;
  placement?: TourPlacement;
  arrow?: TourArrow;
  mask?: TourMask;
  type?: TourType;
  closeIcon?: TourContent;
  closable?: TourClosable;
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions;
  nextButtonProps?: TourButtonProps;
  prevButtonProps?: TourButtonProps;
  class?: string;
  style?: string;
  classNames?: TourSlots;
  styles?: TourSlots;
  /** Inherited fields rc-tour replace the regular panel callbacks/metadata. */
  current?: number;
  total?: number;
  prefixCls?: string;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
  renderPanel?: Snippet<[step: TourPanelInfo, current: number]>;
}

/** Panel snippet data after combining the general and local pitch fields. */
export interface TourPanelInfo extends Omit<TourStepProps, 'closable'> {
  prefixCls: string;
  total: number;
  current: number;
  closable: Exclude<TourClosable, boolean> | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}

/** Result of the original alignment; the callback receives the actual points after the flip. */
export interface TourAlign {
  points?: readonly string[];
  offset?: readonly [number, number];
  dynamicInset?: boolean;
  autoArrow?: boolean;
  overflow?: {
    adjustX?: boolean | number;
    adjustY?: boolean | number;
    shiftX?: boolean | number;
    shiftY?: boolean | number;
  };
}

/** Ant Design tour: without open/defaultOpen is opened with a non-empty set of steps. */
export interface TourProps {
  steps?: readonly TourStepProps[];
  /** The given value is managed by the owner; onClose itself does not change it. */
  open?: boolean;
  defaultOpen?: boolean;
  /** The given value is managed by the owner; onChange receives a new index. */
  current?: number;
  /** It's read once. @defaultValue 0 */
  defaultCurrent?: number;
  onChange?: (current: number) => void;
  onClose?: (current: number) => void;
  /** Called after onClose when finishing with the built-in final button. */
  onFinish?: () => void;
  /** @defaultValue true */
  keyboard?: boolean;
  /** @defaultValue true */
  mask?: TourMask;
  /** @defaultValue true */
  arrow?: TourArrow;
  placement?: TourPlacement;
  type?: TourType;
  gap?: TourGap;
  closeIcon?: TourContent;
  closable?: TourClosable;
  disabledInteraction?: boolean;
  scrollIntoViewOptions?: boolean | ScrollIntoViewOptions;
  /** @defaultValue 1001 */
  zIndex?: number;
  /**
   * false keeps layers inline. As in rc-tour, the mask and placeholder invoke the getter without an
   * argument, and the popup passes the placeholder. The getter must handle both calls.
   */
  getPopupContainer?: false | ((target?: HTMLElement) => HTMLElement);
  onPopupAlign?: (popup: HTMLElement, align: TourAlign) => void;
  indicatorsRender?: Snippet<[current: number, total: number]>;
  actionsRender?: Snippet<[original: Snippet, info: { current: number; total: number; }]>;
  classNames?: TourSemantic;
  styles?: TourSemantic;
  class?: string;
  rootClassName?: string;
  style?: string;
  /** Local CSS prefix; empty/undefined inherited ConfigProvider. */
  prefixCls?: string;
  /** Ant Design forcibly includes placeholder animation, as in upstream. */
  animated?: boolean | { placeholder: boolean; };
  /** Ant Design replaces this rc-tour setup with its placements. */
  builtinPlacements?: Record<string, TourAlign> | ((info?: {
    arrowPointAtCenter?: boolean;
  }) => Record<string, TourAlign>);
}

/** Inherited design of the Tour; local semantic/style layers take precedence. */
export interface TourConfig {
  closeIcon?: TourContent;
  class?: string;
  style?: string;
  classNames?: TourSemantic;
  styles?: TourSemantic;
}

export interface TourLocale {
  Next: string;
  Previous: string;
  Finish: string;
}
