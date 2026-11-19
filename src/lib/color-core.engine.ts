import { FastColor, type FastColorInput } from './fast-color.engine';

export interface ColorHsb { h: number; s: number; b: number; a: number; }
type ColorChannels<Channels extends string> = Record<Channels, number | string> & { a?: number; };
export type ColorGenInput<T = ColorCore> = string | number | ColorChannels<'r' | 'g' | 'b'>
  | ColorChannels<'h' | 's' | 'b'> | T;

// Преобразует HSB в HSV для FastColor, сохраняя переданный экземпляр FastColor и alpha.
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

/** RcColor 3.1.1: HSB alias поверх исходной арифметики FastColor. */
export class ColorCore extends FastColor {
  // Приводит вход к форме FastColor до расчёта каналов базовым классом.
  constructor(color: ColorGenInput | FastColor | null | undefined) {
    super(convertHsb(color));
  }

  // Возвращает brightness как b вместо поля v из HSV, дополняя результат alpha.
  toHsb(): ColorHsb {
    const { v, ...rest } = this.toHsv();
    return { ...rest, b: v, a: this.a };
  }

  // Сериализует округлённые каналы. При полной непрозрачности alpha не включается в строку.
  toHsbString(): string {
    const hsb = this.toHsb();
    const h = Math.round(Number(hsb.h || 0));
    const s = Math.round(Number(hsb.s * 100 || 0));
    const b = Math.round(Number(hsb.b * 100 || 0));
    return hsb.a === 1 ? `hsb(${h}, ${s}%, ${b}%)`
      : `hsba(${h}, ${s}%, ${b}%, ${hsb.a.toFixed(hsb.a === 0 ? 0 : 2)})`;
  }
}
