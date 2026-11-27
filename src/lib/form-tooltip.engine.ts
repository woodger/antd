// Normalizes the label of the form. The local value is overlaid on context Tooltip.
import type { FormItemTooltip, FormTooltipProps } from './form.types';

// Distinguishes the settings object from the array or snippet, which are used as contents.
function isTooltipOptions(value: FormItemTooltip): value is FormTooltipProps {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** The arrays remain content, not turning into options through spread, as in source 6.6.8. */
export function resolveFormTooltip(
  value: FormItemTooltip,
  context?: FormTooltipProps
): FormTooltipProps | undefined {
  if (value === undefined || value === null || value === false || value === '') {
    return;
  }

  return isTooltipOptions(value) ? { ...context, ...value } : { ...context, title: value };
}
