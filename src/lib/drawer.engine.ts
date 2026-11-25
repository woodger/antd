// Преобразует dimension и placement Drawer в размер, смещение и параметры движения без DOM.
import type { DrawerPlacement, DrawerPushConfig, DrawerSize } from './drawer.types';

/** Сохраняет CSS-длины. Ноль допустим как результат изменения размера панели. */
export function getDrawerSize(size: DrawerSize = 'default', allowZero = false): string {
  if (size === 'default') {
    return '378px';
  }
  if (size === 'large') {
    return '736px';
  }
  if (typeof size === 'number') {
    const valid = size > 0 || size === 0 && allowZero;
    return Number.isFinite(size) && valid ? `${size}px` : '378px';
  }

  const text = size.trim();
  return /^\d+(\.\d+)?$/.test(text) ? `${text}px` : text || '378px';
}

/** Только абсолютный размер в пикселях может заменить измерение в начале drag. */
export function getDrawerPixelSize(size: string): number | undefined {
  return /^(\d+(\.\d*)?|\.\d+)px$/i.test(size) ? Number.parseFloat(size) : undefined;
}

/** Ось resize следует физической стороне панели и не зависит от direction. */
export function isDrawerHorizontal(placement: DrawerPlacement): boolean {
  return placement === 'left' || placement === 'right';
}

/** Возвращает предлагаемый размер из полной дельты от момента захвата. */
export function getDrawerResizeSize(
  placement: DrawerPlacement,
  startSize: number,
  delta: number,
  maxSize?: number
): number {
  const reverse = placement === 'right' || placement === 'bottom';
  const next = Math.max(0, startSize + (reverse ? -delta : delta));

  return maxSize !== undefined && Number.isFinite(maxSize) && maxSize > 0
    ? Math.min(maxSize, next) : next;
}

/** Неявный push задаёт 180px. Явный true или пустой объект наследуют distance. */
export function getDrawerPushDistance(
  push: boolean | DrawerPushConfig | undefined,
  parentDistance?: number
): number {
  if (push === false) {
    return 0;
  }
  if (push === undefined) {
    return 180;
  }

  const distance = push === true ? parentDistance : push.distance ?? parentDistance;
  if (distance === undefined) {
    return 180;
  }

  const pixels = Number(distance);
  return Number.isFinite(pixels) ? pixels : 0;
}

/** Смещает открытую панель от края. Translate складывается с собственной анимацией transform. */
export function getDrawerPushOffset(placement: DrawerPlacement, distance: number): string | undefined {
  if (distance === 0) {
    return undefined;
  }

  const reverse = placement === 'right' || placement === 'bottom';
  const offset = `${reverse ? -distance : distance}px`;
  return isDrawerHorizontal(placement) ? offset : `0px ${offset}`;
}

/** Начальный и конечный кадры движения относятся к физической стороне. */
export function getDrawerTransform(placement: DrawerPlacement): string {
  return {
    left: 'translateX(-100%)',
    right: 'translateX(100%)',
    top: 'translateY(-100%)',
    bottom: 'translateY(100%)'
  }[placement];
}

/** Возвращает длительность в миллисекундах, включая нулевое значение темы. */
export function getDrawerMotionDuration(value: string): number {
  const match = value.trim().match(/^(\d*\.?\d+)(ms|s)$/);
  if (!match) {
    return 300;
  }

  const duration = Number(match[1]) * (match[2] === 's' ? 1000 : 1);
  return Number.isFinite(duration) ? duration : 300;
}
