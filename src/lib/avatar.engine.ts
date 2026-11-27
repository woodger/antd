// Normalizes dimensions and computes Avatar text scale for the provided geometry.
import type { AvatarSize } from './avatar.types';
import type { ComponentSize } from './types';

// Chooses the local size. Nonpositive or nonfinite numbers fall back to the context size.
export function resolveAvatarSize(
  size: AvatarSize | undefined,
  context: ComponentSize = 'medium'
): AvatarSize {
  const inherited = context;
  return typeof size === 'number'
    ? Number.isFinite(size) && size > 0 ? size : inherited
    : size ?? inherited;
}

// Uses the standard gap for negative and nonfinite values.
export function normalizeAvatarGap(gap = 4): number {
  return Number.isFinite(gap) && gap >= 0 ? gap : 4;
}

// Shrinks text only if the available width remains positive after accounting for spacing.
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
