import { FastColor, type FastColorInput } from './fast-color.engine';

export interface ColorHsb { h: number; s: number; b: number; a: number; }
type ColorChannels<Channels extends string> = Record<Channels, number | string> & { a?: number; };
export type ColorGenInput<T = ColorCore> = string | number | ColorChannels<'r' | 'g' | 'b'>
  | ColorChannels<'h' | 's' | 'b'> | T;

// Converts HSB to HSV for FastColor while preserving FastColor instances and alpha.
function convertHsb(color: ColorGenInput | FastColor | null | undefined): FastColorInput {
  if (color instanceof FastColor) {
    return color;
  }
  if (color && typeof color === 'object' && 'h' in color && 'b' in color) {
    const { b, ...rest } = color;
    return { ...rest, v: b } as FastColorInput;
  }
  if (typeof color === 'string' && /hsb/.test(color)) {
    return color.replace(/hsb/, 'hsv');
  }
  return color as FastColorInput;
}

/** RcColor 3.1.1: HSB alias over the original FastColor arithmetic. */
export class ColorCore extends FastColor {
  // Normalizes the input to FastColor's shape before the base class computes the channels.
  constructor(color: ColorGenInput | FastColor | null | undefined) {
    super(convertHsb(color));
  }

  // Returns HSV value as brightness b and includes alpha.
  toHsb(): ColorHsb {
    const { v, ...rest } = this.toHsv();
    return { ...rest, b: v, a: this.a };
  }

  // Serializes rounded channels. Omits alpha when fully opaque.
  toHsbString(): string {
    const hsb = this.toHsb();
    const h = Math.round(Number(hsb.h || 0));
    const s = Math.round(Number(hsb.s * 100 || 0));
    const b = Math.round(Number(hsb.b * 100 || 0));
    return hsb.a === 1 ? `hsb(${h}, ${s}%, ${b}%)`
      : `hsba(${h}, ${s}%, ${b}%, ${hsb.a.toFixed(hsb.a === 0 ? 0 : 2)})`;
  }
}
