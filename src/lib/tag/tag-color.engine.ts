import { FastColor } from '../color/fast-color.engine';
import { presetColors } from '../theme/theme-token.types';
import type { TagProps, TagVariant } from './tag.types';

export function getTagColor(
  props: Pick<TagProps, 'color' | 'variant'>,
  contextVariant?: TagVariant
) {
  const variant = props.variant || contextVariant || 'filled';
  let color = props.color;
  if (color === undefined && variant === 'solid') color = 'default';

  const preset = presetColors.some(preset => color === preset);
  const status = ['success', 'processing', 'error', 'default', 'warning'].includes(color ?? '');
  const style: (readonly [string, string])[] = [];
  if (!preset && !status && color) {
    if (variant === 'solid') {
      style.push(['background-color', props.color!]);
    }
    else {
      const inputColor = new FastColor(color);
      const hsl = inputColor.toHsl();
      hsl.l = 0.95;
      const background = new FastColor(hsl);
      style.push(['background-color', background.toHexString()], ['color', props.color!]);
      if (variant === 'outlined') style.push(['border-color', props.color!]);
    }
  }

  return { variant, color, internal: preset || status, style };
}
