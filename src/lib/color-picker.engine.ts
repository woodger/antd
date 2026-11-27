// Prepares single and gradient ColorPicker values. Formatting and palette calculations are
// independent of the DOM.
import { AggregationColor, type ColorStops } from './color';
import { ColorCore, type ColorGenInput } from './color-core.engine';

export type ColorMode = 'single' | 'gradient';
export type ColorFormat = 'hex' | 'rgb' | 'hsb';
export type ColorValue = AggregationColor | string | null | readonly {
  color: AggregationColor | string;
  percent: number;
}[];

// Reuses the Aggregate value to preserve its identity for callbacks.
export function generateColor(
  input: ColorGenInput<AggregationColor> | ColorCore | ColorStops | null | undefined
): AggregationColor {
  return input instanceof AggregationColor ? input : new AggregationColor(input);
}

// Returns rounded opacity as a percentage.
export function getColorAlpha(color: AggregationColor): number {
  return Math.round(Number(color.toHsb().a * 100 || 0));
}

// Changes alpha while preserving HSB for pure black.
export function genAlphaColor(color: AggregationColor, alpha?: number): AggregationColor {
  const rgba = color.toRgb();
  if (!rgba.r && !rgba.g && !rgba.b) {
    return generateColor({ ...color.toHsb(), a: alpha || 1 });
  }
  return generateColor({ ...rgba, a: alpha || 1 });
}

/** Follows rc-color interpolation: integer RGB values and alpha rounded to two decimal places. */
export function getGradientPercentColor(
  colors: readonly { percent: number; color: string; }[],
  percent: number
): string {
  const points = [{ percent: 0, color: colors[0].color }, ...colors,
    { percent: 100, color: colors[colors.length - 1].color }];
  for (let index = 0; index < points.length - 1; index++) {
    const start = points[index];
    const end = points[index + 1];
    if (start.percent <= percent && percent <= end.percent) {
      const distance = end.percent - start.percent;
      if (distance === 0) {
        return start.color;
      }
      const startColor = new ColorCore(start.color);
      const endColor = new ColorCore(end.color);
      const ratio = (percent - start.percent) / distance * 100;
      const mixedColor = startColor.mix(endColor, ratio);
      return mixedColor.toRgbString();
    }
  }
  return '';
}

// Removes duplicates and keeps single before gradient, regardless of input order.
export function getColorModes(mode?: ColorMode | readonly ColorMode[]): ColorMode[] {
  const modes = new Set(Array.isArray(mode) ? mode : mode ? [mode] : ['single']);
  if (!modes.size) modes.add('single');
  return (['single', 'gradient'] as const).filter(value => modes.has(value));
}

// Creates the starting and ending stops for a cleared gradient.
export function getPickerColors(color: AggregationColor): GradientColorList {
  return color.cleared ? [{ percent: 0, color: generateColor('') },
    { percent: 100, color: generateColor('') }] : color.getColors();
}

type GradientColorList = { percent: number; color: AggregationColor; }[];

// Applies the color to the active stop or replaces the single value. Initializes an empty value
// first.
export function fillPickerColor(
  current: AggregationColor,
  mode: ColorMode,
  active: number,
  next: AggregationColor | ColorCore,
  info?: { type?: 'hue' | 'alpha'; value?: number; }
): AggregationColor {
  let submittedColor = generateColor(next);
  if (current.cleared) {
    const rgb = submittedColor.toRgb();
    if (!rgb.r && !rgb.g && !rgb.b && info) {
      submittedColor = generateColor({
        h: info.type === 'hue' ? info.value ?? 0 : 0,
        s: 1,
        b: 1,
        a: info.type === 'alpha' ? (info.value ?? 0) / 100 : 1
      });
    }
    else {
      submittedColor = genAlphaColor(submittedColor);
    }
  }
  if (mode === 'single') {
    return submittedColor;
  }

  const colors = [...getPickerColors(current)];
  colors[active] = { ...colors[active], color: submittedColor };
  return generateColor(colors);
}

// Converts palette coordinates to saturation and brightness, with the Y axis inverted.
export function calculatePickerColor(
  color: AggregationColor,
  x: number,
  y: number
): AggregationColor {
  const hsb = color.toHsb();
  return generateColor({ h: hsb.h, s: Math.max(0, Math.min(1, x)),
    b: 1 - Math.max(0, Math.min(1, y)), a: hsb.a });
}

// Formats the label in the selected color model. HEX shows alpha as a percentage.
export function getColorText(color: AggregationColor, format: ColorFormat | undefined): string {
  if (format === 'rgb') {
    return color.toRgbString();
  }
  if (format === 'hsb') {
    return color.toHsbString();
  }
  const hex = color.toHexString().toUpperCase();
  const alpha = getColorAlpha(color);
  return alpha < 100 ? `${hex.slice(0, 7)},${alpha}%` : hex;
}

// Estimates the brightness of a translucent color composited over the background.
export function isBrightColor(color: AggregationColor, background: string): boolean {
  const { r, g, b, a } = color.toRgb();
  if (a <= .5) {
    return new ColorCore(color.toRgbString()).onBackground(background).toHsv().v > .5;
  }
  return r * .299 + g * .587 + b * .114 > 192;
}
