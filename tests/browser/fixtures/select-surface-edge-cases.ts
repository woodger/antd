export interface SelectSurfaceEdgeSample {
  id: string;
  control: 'select' | 'autocomplete';
  axis: 'replacement' | 'prefix' | 'placeholder';
  initialValue?: string;
  placeholder: 'text' | 'omitted' | 'empty';
}
export type SelectSurfaceEdgeAction =
  | { type: 'click' }
  | { type: 'prefix' }
  | { type: 'outside' }
  | { type: 'clear' }
  | { type: 'key'; key: string }
  | { type: 'fill'; text: string }
  | { type: 'choose'; text: string };

export const selectSurfaceEdgeSamples: readonly SelectSurfaceEdgeSample[] =
  (['select', 'autocomplete'] as const).flatMap(control =>
    (['replacement', 'prefix', 'placeholder'] as const).map((axis): SelectSurfaceEdgeSample => ({
      id: `select-surface-edge-${control}-${axis}`, control, axis,
      initialValue: axis === 'prefix' ? 'a' : undefined,
      placeholder: axis === 'placeholder' ? control === 'select' ? 'omitted' : 'empty' : 'text',
    })));

export function selectSurfaceEdgeActions(sample: SelectSurfaceEdgeSample): SelectSurfaceEdgeAction[] {
  if (sample.axis === 'replacement') return [{ type: 'click' }, { type: 'key', key: 'ArrowDown' },
    { type: 'key', key: 'Enter' }, { type: 'key', key: 'Escape' }, { type: 'key', key: 'Tab' }, { type: 'outside' }];
  if (sample.axis === 'prefix') return [{ type: 'prefix' }, { type: 'key', key: 'Escape' },
    { type: 'prefix' }, { type: 'choose', text: 'Beta' }, { type: 'outside' }];
  return [{ type: 'click' }, { type: 'fill', text: 'Query' }, { type: 'clear' }, { type: 'outside' }];
}

export const selectSurfaceEdgePaintStyles = {
  placeholder: { height: 20, backgroundColor: 'rgb(231, 41, 51)', visibility: 'visible' },
  input: { color: 'rgb(61, 141, 201)' },
} as const;
