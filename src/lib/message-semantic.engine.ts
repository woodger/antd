// Разрешает оформление списка и записи. Провайдер задаёт базовый слой, а явный
// style отдельной записи применяется после семантики всех уровней.
import { resolveNoticeAppearance } from './notice-semantic.engine';
import type {
  MessageAppearance, MessageOptions, MessageSemanticName, MessageSemanticProps
} from './message.types';

const slots: readonly MessageSemanticName[] = ['list', 'listContent', 'root', 'wrapper', 'icon', 'title'];

export { resolveNoticeSemantic as resolveMessageSemantic } from './notice-semantic.engine';

/** Объединяет оформление провайдера и держателя по отдельным DOM-частям. */
export function resolveMessageHolder(options: MessageOptions, provider: MessageAppearance | undefined) {
  return resolveNoticeAppearance<MessageSemanticName, MessageSemanticProps>(
    slots, options, options, provider
  );
}
