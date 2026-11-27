// Determines the meter, limit exceedance and local clear for Input. During the IME-composition, the
// value is not circumcised.
import type {
  InputAllowClear,
  InputCountConfig,
  InputCountInfo,
  InputShowCount
} from './input-count.types';

// Applies count settings after showCount and selects the calculation strategy.
export function resolveInputCount(
  count: InputCountConfig | undefined,
  showCount: InputShowCount | undefined
) {
  const merged = {
    show: showCount && typeof showCount === 'object'
      ? showCount.formatter || true
      : Boolean(showCount),
    ...count
  };
  const show = merged.show;

  return {
    ...count,
    show: Boolean(show),
    formatter: typeof show === 'function' ? show : undefined,
    strategy: count?.strategy || ((value: string) => value.length)
  };
}

// Passes the original text, computed count, and effective maxLength to the formatter.
export function inputCountInfo(
  value: string,
  count: InputCountConfig | undefined,
  showCount: InputShowCount | undefined,
  maxLength?: number
) {
  const config = resolveInputCount(count, showCount);
  const info: InputCountInfo = {
    value,
    count: config.strategy(value),
    maxLength: count?.max ?? maxLength
  };
  let content: ReturnType<NonNullable<typeof config.formatter>> | undefined;
  if (config.show) {
    if (config.formatter) {
      content = config.formatter(info);
    }
    else {
      const suffix = Number(info.maxLength) > 0 ? ` / ${info.maxLength}` : '';
      content = `${info.count}${suffix}`;
    }
  }

  const maximum = info.maxLength;

  return {
    info,
    content,
    show: config.show,
    exceeded: !!maximum && info.count > maximum
  };
}

// When you exceed the specified count.max, apply a custom formatter after the composition.
export function inputExceedValue(
  value: string,
  count: InputCountConfig | undefined,
  composing: boolean
): string {
  if (
    !composing &&
    count?.exceedFormatter &&
    count.max &&
    (count.strategy || ((text: string) => text.length))(value) > count.max
  ) {
    return count.exceedFormatter(value, { max: count.max });
  }

  return value;
}

// Local false disables inherited clear. Included clear gets defaults out of context.
export function resolveInputClear(
  local: boolean | InputAllowClear | undefined,
  context: boolean | InputAllowClear | undefined
): InputAllowClear | false {
  if (!(local ?? context)) {
    return false;
  }

  const own = typeof local === 'object' ? local : undefined;
  const inherited = typeof context === 'object' ? context : undefined;

  return {
    clearIcon: own?.clearIcon !== undefined ? own.clearIcon : inherited?.clearIcon,
    disabled: own?.disabled ?? inherited?.disabled
  };
}
