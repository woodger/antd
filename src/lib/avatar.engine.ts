// Нормализует размеры и рассчитывает масштаб текста Avatar для переданной геометрии.
import type { AvatarSize } from './avatar.types';
import type { ComponentSize } from './types';

// Выбирает локальный размер. Неположительное или неконечное число уступает размеру из контекста.
export function resolveAvatarSize(size:
  AvatarSize
  | undefined, context: ComponentSize = 'medium'): AvatarSize {
  const inherited = context;
  return typeof size === 'number'
    ? Number.isFinite(size) && size > 0 ? size : inherited
    : size ?? inherited;
}

// Подставляет стандартный отступ для отрицательных и неконечных значений.
export function normalizeAvatarGap(gap = 4): number {
  return Number.isFinite(gap) && gap >= 0 ? gap : 4;
}

// Уменьшает текст только при положительной доступной ширине после учёта отступов.
export function getAvatarScale(textWidth: number, containerWidth: number, gap = 4): number {
  if (!Number.isFinite(textWidth)
    || !Number.isFinite(containerWidth)
    || textWidth <= 0
    || containerWidth <= 0) {
    return 1;
  }

  const available = containerWidth - normalizeAvatarGap(gap) * 2;
  return available > 0 ? Math.min(1, available / textWidth) : 1;
}
