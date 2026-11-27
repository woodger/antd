// Allows the registration of the list and recording. The provider sets the base layer, and the
// explicit style of a separate record is used after semantics of all levels.
import { resolveNoticeAppearance } from '../notice-semantic.engine';
import type {
  MessageAppearance, MessageOptions, MessageSemanticName, MessageSemanticProps
} from './message.types';

const slots: readonly MessageSemanticName[] = ['list', 'listContent', 'root', 'wrapper', 'icon', 'title'];

export { resolveNoticeSemantic as resolveMessageSemantic } from '../notice-semantic.engine';

/** Unites the registration of the provider and the holder in separate DOM-parts. */
export function resolveMessageHolder(options: MessageOptions, provider: MessageAppearance | undefined) {
  return resolveNoticeAppearance<MessageSemanticName, MessageSemanticProps>(
    slots, options, options, provider
  );
}
