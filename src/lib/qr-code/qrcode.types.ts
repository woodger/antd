import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLCanvasAttributes, SVGAttributes } from 'svelte/elements';

export type QRCodeErrorLevel = 'L' | 'M' | 'Q' | 'H';
export type QRStatus = 'active' | 'expired' | 'loading' | 'scanned';

/** The first three labels QRCode; ConfigProvider.locale.qrcode are combined into fields. */
export interface QRCodeLocale {
  expired: string;
  refresh: string;
  scanned: string;
}

/** Low-level image settings rc-qrcode; QRCode uses icon/iconSize. */
export interface ImageSettings {
  src: string;
  height: number;
  width: number;
  excavate: boolean;
  x?: number;
  y?: number;
  opacity?: number;
  crossOrigin?: 'anonymous' | 'use-credentials' | '';
}

/** Type rc-qrcode for compatibility; low-level React renderers are not exported. */
export interface QRProps {
  value: string | string[];
  boostLevel?: boolean;
  size?: number;
  level?: QRCodeErrorLevel;
  bgColor?: string;
  fgColor?: string;
  style?: string;
  marginSize?: number;
  imageSettings?: ImageSettings;
  title?: string;
  minVersion?: number;
}

export type QRPropsCanvas = QRProps & Omit<HTMLCanvasAttributes, keyof QRProps>;
export type QRPropsSvg = QRProps & Omit<SVGAttributes<SVGSVGElement>, keyof QRProps>;

/** Status snippet is called only for inactive status and receives a callback. */
export interface StatusRenderInfo {
  status: Exclude<QRStatus, 'active'>;
  locale: QRCodeLocale;
  onRefresh?: () => void;
}

export interface QRCodeSlots {
  root?: string;
  cover?: string;
}

/** Callback receives allowed type/size/status/bordered/errorLevel/bgColor. */
export type QRCodeSemantic = QRCodeSlots
  | ((info: { props: QRCodeProps; }) => QRCodeSlots | undefined);

/** Root/cover decoration; nested ConfigProvider.qrcode replaces the object in its entirety. */
export interface QRCodeConfig {
  class?: string;
  style?: string;
  classNames?: QRCodeSemantic;
  styles?: QRCodeSemantic;
}

/** QRCode Ant Design 6.6.8 from canvas/SVG; children and title are not transferred to drawing. */
export interface QRCodeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'class'> {
  /** Local prefix root/cover/status classes; blank line inherits ConfigProvider prefix. */
  prefixCls?: string;
  /** An empty line does not create DOM; the array sets individual segments, including an empty array. */
  value: string | string[];
  /** By default canvas; SVG is fully generated at SSR, canvas is drawn after mount. */
  type?: 'canvas' | 'svg';
  /** Bitmap size and fallback root width/height, by default 160. */
  size?: number;
  /** By default, the text color of the current theme; style.color does not change the modules. */
  /** Token themes use the global colorText. Component aliases leave module colors unchanged. */
  color?: string;
  bgColor?: string;
  /** Definition M. */
  errorLevel?: QRCodeErrorLevel;
  /** By default true: Increases the correction if the version stays the same. */
  boostLevel?: boolean;
  /** Quiet zone in modules: floor and clamp from the bottom to 0; by default 0. */
  marginSize?: number;
  /** The image is loaded from crossOrigin=anonymous; in SVG the place is carved before download. */
  icon?: string;
  /** By default 40 × 40 px; 0 preserves fallback rc-qrcode to 10% from size. */
  iconSize?: number | { width: number; height: number; };
  /** By default true; false preserves a transparent boundary without padding/radius. */
  bordered?: boolean;
  status?: QRStatus;
  onRefresh?: () => void;
  /** Replaces the default cover content; the empty snippet does not include fallback. */
  statusRender?: Snippet<[StatusRenderInfo]>;
  class?: string;
  rootClassName?: string;
  /** After semantic root; only width/height plain style are also transmitted canvas/SVG. */
  style?: string;
  classNames?: QRCodeSemantic;
  styles?: QRCodeSemantic;
  /** Compatible alias; native onclick has priority. */
  onClick?: HTMLAttributes<HTMLDivElement>['onclick'];
  /** Native root ref instead of React QRCodeRef; cleared at an empty value and unmount. */
  nativeElement?: HTMLDivElement;
}
