import assert from 'node:assert/strict';
import { readSelectComponentsSSRFields } from './select-components-ssr-metrics';

export const selectComponentEditorSSRMarker = 'data-ant-native-select-component-editor-ssr';
/** Exact private intrinsic-leaf SSR annotation; never a prefix-based filter.
 * Its existing Svelte UID is opaque, including any render idPrefix. */
export function selectComponentEditorSSRAttributes<Attribute extends string[]>(attributes: Attribute[], allowed: boolean, label: string) {
  const markers = attributes.filter(([name]) => name === selectComponentEditorSSRMarker);
  assert.equal(markers.length, allowed ? 1 : 0, label + ' exact intrinsic editor UID count');
  if (allowed) assert(markers[0][1].length > 0, label + ' nonempty opaque parent Svelte UID');
  return attributes.filter(([name]) => name !== selectComponentEditorSSRMarker);
}
/** Preserve raw HTML separately. The comparison view removes exactly one
 * validated input/textarea annotation while retaining every other attr/order. */
export function selectComponentEditorSSRView(html: string, allowed: boolean, label: string) {
  const view = readSelectComponentsSSRFields(html);
  const markerPattern = new RegExp('\\s' + selectComponentEditorSSRMarker + '(?=[\\s=>])', 'i');
  const markedTags = [...html.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)].filter(match => markerPattern.test(match[0]));
  assert.equal(markedTags.length, allowed ? 1 : 0, label + ' UID belongs only to the single intrinsic SSR leaf');
  if (allowed) assert(['input', 'textarea'].includes(markedTags[0][1].toLowerCase()), label + ' UID cannot annotate a root/container');
  const markedFields = view.fields.filter(field => field.attributes.some(([name]) => name === selectComponentEditorSSRMarker));
  assert.equal(markedFields.length, allowed ? 1 : 0, label + ' same one UID field in the complete raw field reader');
  const fields = view.fields.map(field => ({ ...field, attributes: selectComponentEditorSSRAttributes(field.attributes,
    allowed && field === markedFields[0], label + '/' + field.tag) }));
  const attributePattern = new RegExp('\\s' + selectComponentEditorSSRMarker + '(?:\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s>]+))?', 'i');
  const comparisonHTML = allowed ? html.replace(markedTags[0][0], markedTags[0][0].replace(attributePattern, '')) : html;
  return { ...view, fields, comparisonHTML };
}
