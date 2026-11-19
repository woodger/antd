import assert from 'node:assert/strict';
import { verifySelectComponentsResponsiveSSRLayout } from './select-components-responsive-ssr-assertions';
import { readSelectComponentsSSRFields } from './select-components-ssr-metrics';
import { verifySelectComponentsAttributes, type ComponentsObservation } from './select-components-assertions';
import { verifyResponsiveTagPrefixSSRState, verifyResponsiveTagPrefixTagCalls } from './select-components-responsive-tag-prefix-assertions';
import type { SelectCustomTagPrefixOwner } from './select-components-responsive-tag-prefix-metrics.mjs';
import type { ResponsiveTagPrefixSSRSerialization } from './select-components-responsive-tag-prefix-reference';
export function verifyResponsiveTagPrefixSSR(body: string, actual: SelectCustomTagPrefixOwner, refs: Record<string, boolean>,
  source: ResponsiveTagPrefixSSRSerialization, label: string) {
  verifyResponsiveTagPrefixSSRState(actual, source, label);
  assert.deepEqual(refs, source.refs);
  assert(Object.values(refs).every(Boolean));
  verifySelectComponentsResponsiveSSRLayout(
    body,
    source.rawHtml,
    label + ' full content subtree',
    { responsiveCustomTag: true }
  );
  const currentFields = readSelectComponentsSSRFields(body), originalFields = readSelectComponentsSSRFields(source.rawHtml);
  assert.deepEqual(
    currentFields,
    originalFields,
    label + ' complete initial input fields/attrs/value'
  );
  // Prefix is an authored single SPAN outside the content parser's subtree.
  // Its complete serializer output is strict; this is not a generic HTML strip.
  const prefix = (html: string) => html.match(/<span\b[^>]*\bdata-custom-tag-prefix(?:="[^"]*")?[^>]*>P<\/span>/g) ?? [];
  assert.equal(prefix(source.rawHtml).length, 1, label + ' measured Source leading PrefixBody');
  assert.deepEqual(
    prefix(body),
    prefix(source.rawHtml),
    label + ' full authored leading PrefixBody markup'
  );
  verifyResponsiveTagPrefixTagCalls(
    actual.calls,
    source.state.calls,
    label + ' SSR public tag info'
  );
  const components = source.state.calls.filter(call => call.kind === 'components.input');
  assert(components.length);
  assert(actual.componentObservations.length);
  for (const observation of actual.componentObservations as ComponentsObservation[]) {
    assert(components.some(call => {
      try {
      verifySelectComponentsAttributes(observation, call, label + '/SSR input');
      return true;
    }
    catch {
      return false;
    }
    }),
      label + ' each actual complete SSR input context belongs to Source');
  }
}
