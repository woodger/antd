// Combines notifications on slots. Inline style of the provider refers to the card, and the list
// and card settings can be calculated separately.
import { serializeInlineStyleLayers } from '../style/inline-style.engine';

type Slots<Name extends string> = Partial<Record<Name, string>>;
type Semantic<Name extends string, Props> = Slots<Name>
  | ((info: { props: Props; }) => Slots<Name> | undefined);

interface Appearance<Name extends string, Props> {
  style?: string;
  classNames?: Semantic<Name, Props>;
  styles?: Semantic<Name, Props>;
}

/** The function receives props of the area whose slots it designs. */
export function resolveNoticeSemantic<Name extends string, Props>(
  value: Semantic<Name, Props> | undefined, props: Props
) {
  return typeof value === 'function' ? value({ props }) : value;
}

/** The classes are folded, the inline holder layer follows after the provider. */
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
