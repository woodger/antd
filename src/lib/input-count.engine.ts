// Определяет счётчик, превышение лимита и локальный clear для Input. Во время IME-композиции
// значение не обрезается.
import type {
  InputAllowClear,
  InputCountConfig,
  InputCountInfo,
  InputShowCount
} from './input-count.types';

// Применяет настройки count после showCount и выбирает стратегию подсчёта.
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

// Передаёт formatter исходный текст, рассчитанное количество и действующий maxLength.
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
  const content = config.show
    ? config.formatter
      ? config.formatter(info)
      : `${info.count}${Number(info.maxLength) > 0 ? ` / ${info.maxLength}` : ''}`
    : undefined;

  return {
    info,
    content,
    show: config.show,
    exceeded: Boolean(info.maxLength) && info.count > info.maxLength!
  };
}

// При превышении заданного count.max применяет пользовательский formatter после композиции.
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

// Локальный false отключает унаследованный clear. Включённый clear получает defaults из
// контекста.
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
