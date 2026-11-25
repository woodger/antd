// Разрешает оформление списка и записи. Провайдер задаёт базовый слой, а явный
// style отдельной записи применяется после семантики всех уровней.
import { serializeInlineStyleLayers } from './inline-style.engine';
import type {
  MessageAppearance, MessageOptions, MessageSemantic, MessageSemanticName,
  MessageSemanticProps, MessageSemanticSlots
} from './message.types';

const slots: readonly MessageSemanticName[] = ['list', 'listContent', 'root', 'wrapper', 'icon', 'title'];

/** Вычисляет настройки с текущими props владельца соответствующего слота. */
export function resolveMessageSemantic(
  value: MessageSemantic | undefined, props: MessageSemanticProps
) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** Объединяет оформление провайдера и держателя по отдельным DOM-частям. */
export function resolveMessageHolder(options: MessageOptions, provider: MessageAppearance | undefined) {
  const providerClasses = resolveMessageSemantic(provider?.classNames, options);
  const holderClasses = resolveMessageSemantic(options.classNames, options);
  const providerStyles = resolveMessageSemantic(provider?.styles, options);
  const holderStyles = resolveMessageSemantic(options.styles, options);
  const classes: MessageSemanticSlots = {};
  const styles: MessageSemanticSlots = {};

  for (const slot of slots) {
    classes[slot] = [providerClasses?.[slot], holderClasses?.[slot]].filter(Boolean).join(' ') || undefined;
    styles[slot] = serializeInlineStyleLayers([
      providerStyles?.[slot], slot === 'root' ? provider?.style : undefined, holderStyles?.[slot]
    ]);
  }

  return { classes, styles };
}
