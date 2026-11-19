import type { AnchorConfig, AnchorProps, AnchorSlots } from './anchor.types';
import { mergeComponentSemantics } from './semantic-style.engine';

// Ограничивает результат слияния слотами Anchor и передаёт props экземпляра callbacks семантики.
export function anchorSemantics(context: AnchorConfig | undefined, props: AnchorProps) {
  return mergeComponentSemantics<keyof AnchorSlots, AnchorProps>(
    context,
    props,
    ['root', 'item', 'itemTitle', 'indicator']
  );
}
