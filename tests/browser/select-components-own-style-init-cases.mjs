// Read-only Source protocol proposal. No DOM, measurement, rendering, or runtime patch.
export const selectOwnStyleInitEntryPaths = ['csr', 'hydrate-same', 'hydrate-mismatch', 'hydrate-dirty-mismatch'];

export const selectOwnStyleInitActions = [
  { type: 'own-style-phase', phase: 'top-green' },
  { type: 'own-style-phase', phase: 'remove-overlap' },
  { type: 'own-style-phase', phase: 'restore-overlap' },
  { type: 'own-style-phase', phase: 'left-logical' },
  { type: 'own-style-phase', phase: 'property-null' },
  { type: 'own-style-phase', phase: 'property-undefined' },
  { type: 'own-style-phase', phase: 'style-null' },
  { type: 'own-style-phase', phase: 'style-undefined' },
  { type: 'own-style-phase', phase: 'style-omitted' },
  { type: 'own-style-phase', phase: 'restore-object' },
  { type: 'fill', text: 'Measure WMWM' },
  { type: 'own-style-phase', phase: 'width-only' },
];

export const selectOwnStyleInitOptions = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

export const selectOwnStyleInitFallback = { input: { color: 'rgb(37,51,73)' } };

export const selectOwnStyleInitSamples = [
  { id: 'select-components-own-style-init-select-multiple-input', control: 'select',
    syncWidth: true, value: ['a'],
    settings: { mode: 'multiple', componentOwner: true, form: true, name: 'own-style-field',
      observeFocus: true, open: false, showSearch: { filterOption: false },
      components: { slot: 'input', kind: 'element' }, componentTag: 'input',
      styles: selectOwnStyleInitFallback },
    actions: selectOwnStyleInitActions },
  { id: 'select-components-own-style-init-ac-textarea', control: 'autocomplete',
    syncWidth: false, value: 'a',
    settings: { componentOwner: true, form: true, name: 'own-style-field',
      observeFocus: true, open: false, showSearch: { filterOption: false },
      components: { slot: 'input', kind: 'element' }, componentTag: 'textarea',
      styles: selectOwnStyleInitFallback },
    actions: selectOwnStyleInitActions },
];

export const selectOwnStyleInitGeometry = {
  viewport: { width: 2300, height: 1900 },
  root: { left: 300, top: 200, width: 280 },
};

export function selectOwnStyleInitClientProfile(entryPath) {
  if (!selectOwnStyleInitEntryPaths.includes(entryPath)) throw new Error('Unknown own-style entry path');
  return entryPath === 'hydrate-mismatch' || entryPath === 'hydrate-dirty-mismatch' ? 'mismatch' : 'same';
}

/** The ordinary caller applies this CSS setter after parsing SSR and before hydrateRoot. */
export function selectOwnStyleInitPrehydrateSetters(entryPath) {
  selectOwnStyleInitClientProfile(entryPath);
  return entryPath === 'hydrate-dirty-mismatch' ? [{ property: 'fontSize', value: '31px' }] : [];
}

/** Allocate once for each ordinary owner. Actual own undefined must not pass through JSON. */
export function createSelectOwnStyleInitFrames(profile = 'same') {
  if (!['same', 'mismatch'].includes(profile)) throw new Error('Unknown own-style profile');
  const initial = {
    borderTopColor: 'rgb(231,41,51)',
    border: profile === 'mismatch' ? '4px dashed rgb(73,83,93)' : '2px solid rgb(21,31,41)',
    borderLeftWidth: 5,
    paddingInlineStart: 7,
    padding: '3px 11px',
    width: 91,
    fontSize: profile === 'mismatch' ? 23 : 17,
  };
  const topGreen = { ...initial, borderTopColor: 'rgb(31,171,61)' };
  const removeOverlap = { ...topGreen };
  delete removeOverlap.border;
  delete removeOverlap.padding;
  const restoreOverlap = { ...topGreen };
  const leftLogical = { ...topGreen, borderLeftWidth: 9, paddingInlineStart: 17 };
  const propertyNull = { ...leftLogical, borderTopColor: null, paddingInlineStart: null };
  const propertyUndefined = { ...leftLogical, borderTopColor: undefined, paddingInlineStart: undefined };
  const widthOnly = { ...leftLogical, width: 133 };
  const own = style => ({ className: 'select-own-style-editor', placeholder: 'Own CSS editor', style });
  const frames = new Map([
    ['initial', own(initial)],
    ['top-green', own(topGreen)],
    ['remove-overlap', own(removeOverlap)],
    ['restore-overlap', own(restoreOverlap)],
    ['left-logical', own(leftLogical)],
    ['property-null', own(propertyNull)],
    ['property-undefined', own(propertyUndefined)],
    ['style-null', own(null)],
    ['style-undefined', own(undefined)],
    ['style-omitted', { className: 'select-own-style-editor', placeholder: 'Own CSS editor' }],
    ['restore-object', own(leftLogical)],
    ['width-only', own(widthOnly)],
  ]);
  return {
    profile,
    get(phase) {
      if (!frames.has(phase)) throw new Error('Unknown own-style phase');
      return frames.get(phase);
    },
  };
}

// SSR always uses the same initial profile. A mismatch is CSS-only: same owner,
// tag, key, ref, value, attributes and tree; only client border/fontSize differ.
export const selectOwnStyleInitSSR = {
  profile: 'same', phase: 'initial',
  serializers: ['renderToString', 'renderToStaticMarkup'],
  hydrateFrom: 'renderToString', uniqueStates: 2,
};
