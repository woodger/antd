// Collects transfers of Modal from mounted providers for individual browser roots.
import type { AntDesignLocale } from '../locale.types';
import english from '../locale/en_US';
import { enUS, type Locale } from '../types';

type ModalLabels = Pick<Locale, 'okText' | 'cancelText' | 'justOkText'>;
const providers = new Set<Partial<ModalLabels>>();

/** Takes into account only the clearly defined keys, so that the partial dictionaries complement each other. */
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

  /** Removes the contribution of a particular instance when changing the vocabulary or unmount. */
  return () => {
    providers.delete(labels);
  };
}

/** Provides a picture of English defaults with up-to-date static confirmation labels. */
export function readModalLocale(): Locale {
  const locale = { ...enUS, ...english.Modal };
  for (const labels of providers) {
    Object.assign(locale, labels);
  }
  return locale;
}
