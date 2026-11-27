import type { AnchorConfig, AnchorProps, AnchorSlots } from './anchor.types';
import { mergeComponentSemantics } from '../style/semantic-style.engine';

// Limits the merge result to Anchor slots and passes instance props to semantic callbacks.
export function anchorSemantics(context: AnchorConfig | undefined, props: AnchorProps) {
  return mergeComponentSemantics<keyof AnchorSlots, AnchorProps>(
    context,
    props,
    ['root', 'item', 'itemTitle', 'indicator']
  );
}
