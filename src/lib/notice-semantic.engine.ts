// Объединяет оформление уведомлений по слотам. Inline style провайдера относится
// к карточке, а настройки списка и карточки могут вычисляться отдельно.
import { serializeInlineStyleLayers } from './inline-style.engine';

type Slots<Name extends string> = Partial<Record<Name, string>>;
type Semantic<Name extends string, Props> = Slots<Name>
  | ((info: { props: Props; }) => Slots<Name> | undefined);

interface Appearance<Name extends string, Props> {
  style?: string;
  classNames?: Semantic<Name, Props>;
  styles?: Semantic<Name, Props>;
}

/** Функция получает props той области, чьи слоты она оформляет. */
export function resolveNoticeSemantic<Name extends string, Props>(
  value: Semantic<Name, Props> | undefined, props: Props
) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Классы складываются, inline слой holder следует после оформления провайдера. */
export function resolveNoticeAppearance<Name extends string, Props>(
  slots: readonly Name[],
  props: Props,
  holder: Appearance<Name, Props>,
  provider: Appearance<Name, Props> | undefined
) {
  const providerClasses = resolveNoticeSemantic(provider?.classNames, props);
  const holderClasses = resolveNoticeSemantic(holder.classNames, props);
  const providerStyles = resolveNoticeSemantic(provider?.styles, props);
  const holderStyles = resolveNoticeSemantic(holder.styles, props);
  const classes: Slots<Name> = {};
  const styles: Slots<Name> = {};

  for (const slot of slots) {
    const slotClasses = [providerClasses?.[slot], holderClasses?.[slot]];
    classes[slot] = slotClasses.filter(Boolean).join(' ') || undefined;
    styles[slot] = serializeInlineStyleLayers([
      providerStyles?.[slot], slot === 'root' ? provider?.style : undefined, holderStyles?.[slot]
    ]);
  }

  return { classes, styles };
}
