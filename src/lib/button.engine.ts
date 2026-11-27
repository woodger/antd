// Resolves Button's color and variant pair, initial loading phase, and short text formatting.
import type {
  ButtonColor,
  ButtonConfig,
  ButtonContent,
  ButtonLoading,
  ButtonType,
  ButtonVariant
} from './button.types';
const types: Record<ButtonType, readonly [ButtonColor | 'link', ButtonVariant]> = {
  default: ['default', 'outlined'],
  primary: ['primary', 'solid'],
  dashed: ['default', 'dashed'],
  text: ['default', 'text'],
  link: ['link', 'link']
};
// Applies the explicit pair before type and danger, then checks context. Ghost changes solid to
// outlined.
export function buttonAppearance(
  type?: ButtonType,
  danger = false,
  color?: ButtonColor,
  variant?: ButtonVariant,
  ghost = false,
  context?: Pick<ButtonConfig, 'color' | 'variant'>
): { color: ButtonColor | 'link'; variant: ButtonVariant; } {
  let parsed: readonly [ButtonColor | 'link', ButtonVariant];
  if (color && variant) {
    parsed = [color, variant];
  }
  else if (type || danger) {
    const pair = types[type || 'default'];
    parsed = danger ? ['danger', pair[1]] : pair;
  }
  else if (variant === 'solid') {
    parsed = ['primary', 'solid'];
  }
  else if (context?.color && context.variant) {
    parsed = [context.color, context.variant];
  }
  else if (context?.variant === 'solid') {
    parsed = ['primary', 'solid'];
  }
  else {
    parsed = ['default', 'outlined'];
  }
  return { color: parsed[0], variant: ghost && parsed[1] === 'solid' ? 'outlined' : parsed[1] };
}
// Distinguishes delayed loading from immediate indicator display.
export function buttonLoading(loading: ButtonLoading): { loading: boolean; delay: number; } {
  if (typeof loading === 'object' && loading !== null) {
    const delay = typeof loading.delay === 'number' ? loading.delay : 0;
    return { loading: delay <= 0, delay };
  }
  return { loading: Boolean(loading), delay: 0 };
}
// Treats numeric 0 as content and keeps missing values and false empty.
export function buttonHasContent(content: ButtonContent): boolean {
  return content !== undefined && content !== null && content !== false && content !== '';
}
// Recognizes exactly two ideographs in the supported range for autoInsertSpace.
export function buttonTwoCN(value: string): boolean {
  return /^[\u4E00-\u9FA5]{2}$/.test(value);
}
// Inserts a space only between two ideographs when the behavior is enabled.
export function buttonText(value: string, insert: boolean): string {
  return insert && buttonTwoCN(value) ? value.split('').join(' ') : value;
}
