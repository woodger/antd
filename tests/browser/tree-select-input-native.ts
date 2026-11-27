import type { TreeSelectInputSample } from './fixtures/tree-select-input-cases';
import type { readTreeSelectInput } from './tree-select-input-metrics';

// Native maintains Tree popup and its existing ARIA connections. Own descriptor overlaps generated
// attrs; Source golden and general projector remain raw.
export function nativeTreeSelectInputView(
  view: ReturnType<typeof readTreeSelectInput>,
  sample: TreeSelectInputSample,
  treeDescendant: string | null
) {
  const ownAria = sample.own === 'attrs';
  // React SyntheticEvent marks preventDefault even at noncancelable input, focus and blur. DOM
  // preserves false; cancelable keyboard/composition/paste raw.
  const events = sample.preventOwn ? view.events.map((event: unknown[]) => {
    const [scope, kind] = event;
    return (scope === 'own' || scope === 'generated')
      && (kind === 'change' || kind === 'focus' || kind === 'blur') && event.length === 5
      ? [...event.slice(0, 4), false] : event;
  }) : view.events;
  return { ...view, events, attrs: { ...view.attrs,
    'aria-haspopup': ownAria ? view.attrs['aria-haspopup'] : 'tree',
    'aria-controls': ownAria ? view.attrs['aria-controls'] : 'tree-select-input-control-list',
    'aria-owns': ownAria ? view.attrs['aria-owns'] : null,
    'aria-autocomplete': ownAria ? view.attrs['aria-autocomplete'] : view.readonly ? 'none' : 'list',
    'aria-activedescendant': view.open ? treeDescendant : null
  } };
}
