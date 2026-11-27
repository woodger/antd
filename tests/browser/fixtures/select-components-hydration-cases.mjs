export const selectComponentsHydrationSamples = [
  {
    id: 'select-components-hydration-select-root-default', control: 'select', initialSlot: 'root-element',
    actions: [{ type: 'rerender' }, { type: 'slot', value: 'root-string' },
      { type: 'slot', value: 'root-element' }, { type: 'focus' },
      { type: 'fill', value: 'Root draft after hydration' }, { type: 'model', value: 'b' }, { type: 'blur' }]
  },
  {
    id: 'select-components-hydration-ac-root-string', control: 'autocomplete', initialSlot: 'root-string',
    actions: [{ type: 'rerender' }, { type: 'slot', value: 'root-element' },
      { type: 'slot', value: 'root-string' }, { type: 'focus' },
      { type: 'fill', value: 'Root draft after hydration' }, { type: 'model', value: 'b' }, { type: 'blur' }]
  },
  {
    id: 'select-components-hydration-select-input-textarea', control: 'select', initialSlot: 'input-string',
    actions: [{ type: 'rerender' }, { type: 'focus' }, { type: 'fill', value: 'Hydrated typed value' },
      { type: 'model', value: 'b' }, { type: 'blur' }]
  },
  {
    id: 'select-components-hydration-ac-input-textarea', control: 'autocomplete', initialSlot: 'input-string',
    actions: [{ type: 'rerender' }, { type: 'focus' }, { type: 'fill', value: 'Hydrated typed value' },
      { type: 'model', value: 'b' }, { type: 'blur' }]
  },
  {
    id: 'select-components-hydration-select-input-composite', control: 'select', initialSlot: 'input-composite',
    actions: [{ type: 'rerender' }, { type: 'focus' }, { type: 'fill', value: 'Hydrated typed value' },
      { type: 'model', value: 'b' }, { type: 'blur' }]
  },
  {
    id: 'select-components-hydration-ac-replace-close', control: 'autocomplete', initialSlot: 'input-string',
    actions: [{ type: 'slot', value: 'input-element' }, { type: 'slot', value: 'root-element' },
      { type: 'slot', value: 'input-string' }, { type: 'root-click' }, { type: 'close-dispose' }]
  }
].map(sample => ({ ...sample,
  preHydration: { value: 'Draft before hydration', selection: [2, 8], focused: true }
}));
