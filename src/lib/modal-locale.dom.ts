// Собирает переводы Modal от смонтированных провайдеров для отдельных браузерных корней.
import type { AntDesignLocale } from './locale.types';
import english from './locale/en_US';
import { enUS, type Locale } from './types';

type ModalLabels = Pick<Locale, 'okText' | 'cancelText' | 'justOkText'>;
const providers = new Set<Partial<ModalLabels>>();

/** Учитывает только явно заданные ключи, чтобы частичные словари дополняли друг друга. */
export function registerModalLocale(locale: Partial<Locale> | AntDesignLocale) {
  const source = 'locale' in locale ? locale.Modal : locale;
  if (!source) {
    return undefined;
  }

  const labels: Partial<ModalLabels> = {};
  for (const key of ['okText', 'cancelText', 'justOkText'] as const) {
    const label = source[key];
    if (label !== undefined) {
      labels[key] = label;
    }
  }
  providers.add(labels);

  /** Снимает вклад конкретного экземпляра при смене словаря или unmount. */
  return () => {
    providers.delete(labels);
  };
}

/** Отдаёт снимок английских defaults с актуальными подписями статического подтверждения. */
export function readModalLocale(): Locale {
  const locale = { ...enUS, ...english.Modal };
  for (const labels of providers) {
    Object.assign(locale, labels);
  }
  return locale;
}
