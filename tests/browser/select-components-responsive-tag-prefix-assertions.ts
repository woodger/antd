import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import { decodeSelectSurface } from './select-surface-receipts';
import { normalizedSelectSurfaceAuthoredProps, verifySelectSurfaceEventGraph } from './select-surface-assertions';
import { verifyIconGraph } from './select-icons-assertions';
import { verifySelectComponentsNode, verifySelectComponentsDOMAttributes, verifySelectComponentsAttributes,
  selectComponentsFocusEvent, selectComponentsSourceFocusGraph, type ComponentsObservation } from './select-components-assertions';
import { readSelectComponentsSSRFields } from './select-components-ssr-metrics';
import { readResponsiveTagPrefixSourceInfo, type ResponsiveTagPrefixSourcePoint, type ResponsiveTagPrefixCSRCase,
  type ResponsiveTagPrefixProducerCall } from './select-components-responsive-tag-prefix-reference';
import type { SelectCustomTagPrefixNode, SelectCustomTagPrefixOwner } from './select-components-responsive-tag-prefix-metrics.mjs';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { ResponsiveTagPrefixNativePoint, ResponsiveTagPrefixNativeLedger } from './select-components-responsive-tag-prefix-driver';
import { verifyResponsiveTagPrefixLabel, verifyResponsiveTagPrefixSingleTag, type ResponsiveTagPrefixRenderer } from './select-components-responsive-tag-prefix-snippet-assertions';
const keys = ['label', 'value', 'index', 'disabled', 'closable', 'onClose', 'isMaxTag'];
const undefinedValue = { $: 'undefined' };
export interface ResponsiveTagPrefixPointScope { id: string; index: number; path: 'csr'; renderer?: ResponsiveTagPrefixRenderer; applied?: Set<string> }
export function verifyResponsiveTagPrefixSelection(actual: SelectCustomTagPrefixNode, source: SelectCustomTagPrefixNode,
  label: string, scope?: ResponsiveTagPrefixPointScope) {
  if (isDeepStrictEqual(actual.selection, source.selection)) {
    return;
  }
  assert(scope && scope.path === 'csr' && Number.isInteger(scope.index) && scope.index >= 0 && scope.index <= 3,
    label + ' only the eight measured pre-edit CSR constructor positions qualify');
  assert(['select-responsive-custom-tag-prefix-multiple', 'select-responsive-custom-tag-prefix-tags-fragment'].includes(scope.id));
  for (const node of [actual, source]) {
    assert.equal(node.tag, 'INPUT');
    assert.equal(node.connected, true);
    assert.equal(node.focused, false);
    assert.equal(node.value, '');
    assert.equal(node.defaultValue, '');
    for (const [key, value] of [['id', 'select-icons-field'], ['type', 'text'], ['value', ''], ['data-select-icons-component', 'input:function']]) {
      assert.equal(
        node.attributes.find(([name]) => name === key)?.[1],
        value,
        label + '/' + key + ' exact measured editor'
      );
    }
  }
  assert.deepEqual(source.selection, [0, 0, 'forward']);
  assert.deepEqual(actual.selection, [0, 0, 'none']);
  scope.applied?.add('empty-unfocused-input-createElement-vs-template-constructor-direction');
}
function object(value: unknown): Record<string, unknown> {
  assert(value && typeof value === 'object');
  return value as Record<string, unknown>;
}
function properties(value: unknown) {
  const item = object(value);
  assert(Array.isArray(item.properties));
  return item.properties as Array<{ key: string; value: unknown }>;
}
function functionValue(value: unknown) {
  const item = object(value);
  assert.equal(item.$, 'function');
}
function tagInfo(call: SelectSurfaceProducerCall) {
  const args = properties(call.argument);
  assert.deepEqual(args.map(p => p.key), ['0', 'length']);
  assert.equal(args[1].value, 1);
  const fields = properties(args[0].value);
  assert.deepEqual(
    fields.map(p => p.key),
    keys,
    'seven actual info own keys in Source insertion order'
  );
  assert.deepEqual(call.argumentOwnKeys, [keys]);
  const descriptors = call.argumentDescriptors as Array<Array<Record<string, unknown>>>;
  assert.equal(descriptors.length, 1);
  assert.deepEqual(descriptors[0].map(p => p.key), keys);
  for (const descriptor of descriptors[0]) {
    assert.deepEqual({ ...descriptor, valueType: undefined },
      {
        key: descriptor.key,
        enumerable: true,
        configurable: true,
        writable: true,
        kind: 'value',
        valueType: undefined
      });
  }
  return {
    info: Object.fromEntries(fields.map(p => [p.key, p.value])),
    descriptors: descriptors[0]
  };
}
/** Public Native label/result are actual Snippets. Source retains its string /
 * ReactElement. No private Snippet arguments, closure fields or React counts are fabricated.
 */
export function verifyResponsiveTagPrefixTagCalls(
  actual: readonly SelectSurfaceProducerCall[],
  source: readonly ResponsiveTagPrefixProducerCall[],
  label: string
) {
  const originals = source.filter(call => call.kind === 'tagRender');
  assert(originals.length);
  for (const call of actual.filter(call => call.kind === 'tagRender')) {
    const { info, descriptors } = tagInfo(call);
    assert.equal(call.publicArgumentCount, 1, label + ' declared public Snippet parameter');
    functionValue(info.label);
    assert.equal(descriptors[0].valueType, 'function');
    const candidate = originals.find(original => {
      const other = readResponsiveTagPrefixSourceInfo(original);
      return ['value', 'index', 'disabled', 'closable', 'isMaxTag'].every(key => isDeepStrictEqual(
        info[key],
        other[key]
      ));
    });
    assert(candidate, label + ' every actual complete scalar info belongs to observed Source data');
    const other = readResponsiveTagPrefixSourceInfo(candidate), originalDescriptors = candidate.argumentDescriptors![0];
    for (let index = 1; index < keys.length; index++) {
      assert.deepEqual(
        descriptors[index],
        originalDescriptors[index],
        label + '/' + keys[index] + ' descriptor'
      );
    }
    if (info.isMaxTag) {
      for (const key of ['value', 'index', 'onClose']) {
        assert.deepEqual(
          info[key],
          undefinedValue,
          label + ' own undefined ' + key
        );
      }
    }
    else {
      functionValue(info.onClose);
      functionValue(other.onClose);
    }
    const result = object(call.result);
    assert.equal(result.$, 'authored');
    assert.deepEqual(
      result.role,
      { node: 'custom-tag-render-' + (info.isMaxTag ? 'rest' : info.value) }
    );
    const raw = call.rawResult as {
      root: { ref: number };
      objects: Array<{ id: number; type: string; array: boolean; authoredRole: unknown }>
    };
    const returned = raw.objects.find(node => node.id === raw.root.ref);
    assert(returned);
    assert.equal(returned.type, 'function');
    assert.equal(returned.array, false);
    assert.deepEqual(returned.authoredRole, result.role);
  }
  assert(
    actual.some(call => call.kind === 'tagRender'),
    label + ' actual public tag producer executed'
  );
}
/** This is deliberately strict before the paired Native geometry/anchor review.
 * Any compiler DOM/markup difference remains a reported failure and full raw.
 */
export function verifyResponsiveTagPrefixPhysicalNode(actual: SelectCustomTagPrefixNode | null, source: SelectCustomTagPrefixNode | null, label: string,
  scope?: ResponsiveTagPrefixPointScope) {
  assert.equal(Boolean(actual), Boolean(source), label + ' physical presence');
  if (!actual || !source) {
    return;
  }
  assert.equal(actual.tag, source.tag, label + '/tag');
  verifySelectComponentsDOMAttributes(actual, source, actual.attributes, source.attributes, label);
  for (const key of ['connected', 'text', 'styleAttribute', 'cssText', 'inlineProperties', 'css', 'box', 'clientRects', 'metrics',
    'focused', 'value', 'defaultValue'] as const) {
    assert.deepEqual(
      actual[key],
      source[key],
      label + '/' + key
    );
  }
  verifyResponsiveTagPrefixSelection(actual, source, label, scope);
  if (source.tag === 'INPUT') {
    for (const node of [actual, source]) {
      const parsed = readSelectComponentsSSRFields(node.html);
      assert.equal(parsed.fields.length, 1, label + ' one complete INPUT HTML field');
      const field = parsed.fields[0];
      assert.equal(field.tag, 'input');
      assert.equal(field.content, '');
      assert.deepEqual(
        field.attributes,
        node.attributes,
        label + ' raw HTML preserves its exact recorded ordered attrs'
      );
      assert.equal(field.value, node.attributes.find(([key]) => key === 'value')?.[1] ?? '');
    }
    // Ordered DOM attrs already passed the existing type-first/style-last
    // checker above. Parsing each full INPUT verifies its raw HTML without
    // imposing the rejected duplicate serializer-order comparison.
    if (actual.html !== source.html) scope?.applied?.add('existing-input-type-first-and-style-materialization-order');
  }
  else {
    assert.equal(
      actual.html,
      source.html,
      label + ' literal authored HTML before any new framework boundary review'
    );
  }
  const children = (node: SelectCustomTagPrefixNode) => node.childNodes.map(({
    identity: _identity,
    ...child
  }) => child);
  assert.deepEqual(
    children(actual),
    children(source),
    label + ' every physical child type/tag/text including anchors'
  );
}
export function verifyResponsiveTagPrefixPoint(actual: ResponsiveTagPrefixNativePoint | ResponsiveTagPrefixSourcePoint,
  source: ResponsiveTagPrefixSourcePoint, label: string, scope?: ResponsiveTagPrefixPointScope): string[] {
  const failures: string[] = [], check = (name: string, work: () => void) => {
    try {
    work();
  }
  catch (error) {
    failures.push(label + '/' + name + ': ' + String(error));
  }
  };
  check('public-owner', () => {
    for (const key of ['model', 'open', 'query', 'alive', 'settings', 'context', 'authoredSample', 'authoredProvider', 'eventCount', 'rawEventCount'] as const)
      assert.deepEqual(actual.owner[key], source.owner[key], label + '/' + key);
    for (const key of ['rawModel', 'rawSettings', 'rawContext', 'rawAuthoredSample', 'rawAuthoredProvider'] as const)
      verifyIconGraph(actual.owner[key], source.owner[key], label + '/' + key);
    assert.deepEqual(
      normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
      normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps)
    );
  });
  check(
    'actual-editor',
    () => verifySelectComponentsNode(
      actual.icons.current.editor,
      source.icons.current.editor,
      label + '/editor'
    )
  );
  check('stable-physical-editor', () => {
    assert.equal(actual.icons.sameAsOriginal.root, source.icons.sameAsOriginal.root);
    assert.equal(actual.icons.sameAsOriginal.editor, source.icons.sameAsOriginal.editor);
    assert(actual.icons.current.editor && actual.icons.publicRefs.authoredInput);
    assert.equal(
      actual.icons.publicRefs.authoredInput.identity,
      actual.icons.current.editor.identity
    );
    assert.equal(actual.customTagsPrefix.editor?.identity, actual.icons.current.editor.identity);
    assert.deepEqual(actual.icons.formData, source.icons.formData);
  });
  check(
    'prefix-outside-overflow',
    () => assert.deepEqual(
      actual.customTagsPrefix.prefixTopology,
      source.customTagsPrefix.prefixTopology
    )
  );
  for (const role of ['editor', 'prefixBody'] as const) {
    check(
      role,
      () => verifyResponsiveTagPrefixPhysicalNode(
        actual.customTagsPrefix[role],
        source.customTagsPrefix[role],
        label + '/' + role,
        scope
      )
    );
  }
  for (const collection of ['customTags', 'customLabels', 'customCloseButtons'] as const) {
    check(collection, () => {
      assert.equal(
        actual.customTagsPrefix[collection].length,
        source.customTagsPrefix[collection].length,
        label + ' complete ' + collection
      );
      source.customTagsPrefix[collection].forEach((node, index) => {
        const current = actual.customTagsPrefix[collection][index], path = label + '/' + collection + '/' + index;
        if (!scope || collection === 'customCloseButtons') {
          verifyResponsiveTagPrefixPhysicalNode(current, node, path);
          return;
        }
        assert.equal(scope.path, 'csr');
        assert(Number.isInteger(scope.index) && scope.index >= 0 && scope.index <= 9);
        assert(['select-responsive-custom-tag-prefix-multiple', 'select-responsive-custom-tag-prefix-tags-fragment'].includes(scope.id));
        const renderer = scope.renderer ?? 'vite-hmr';
        if (collection === 'customLabels') {
          verifyResponsiveTagPrefixLabel(
            current,
            node,
            renderer,
            path
          );
        }
        else {
          verifyResponsiveTagPrefixSingleTag(current, node, actual.customTagsPrefix.customLabels, source.customTagsPrefix.customLabels,
            actual.customTagsPrefix.customCloseButtons, source.customTagsPrefix.customCloseButtons, renderer, path);
        }
        scope.applied?.add('exact-' + renderer + '-custom-tag-snippet-anchors');
      });
    });
  }
  check('whole-overflow-geometry', () => {
    for (const role of ['root', 'content', 'editor', 'suffix', 'adornment'] as const) {
      const a = actual.overflow[role], b = source.overflow[role];
      assert.equal(Boolean(a), Boolean(b), role + ' presence');
      if (!a || !b) continue;
      for (const key of ['css', 'box', 'clientRects', 'metrics', 'focused', 'value', 'caret'] as const) {
        assert.deepEqual(
          a[key],
          b[key],
          role + '/' + key
        );
      }
    }
    for (const key of ['suffixContainsEditor', 'editorIsDirectSuffixChild', 'rootHasSamePublicEditor'] as const) {
      assert.equal(
        actual.overflow[key],
        source.overflow[key]
      );
    }
  });
  return failures;
}
export function verifyResponsiveTagPrefixLedger(actual: ResponsiveTagPrefixNativeLedger, source: ResponsiveTagPrefixCSRCase,
  point: ResponsiveTagPrefixSourcePoint, label: string, applied?: Set<string>): string[] {
  const failures: string[] = [], check = (name: string, work: () => void) => {
    try {
    work();
  }
  catch (error) {
    failures.push(label + '/' + name + ': ' + String(error));
  }
  };
  const calls = source.ledger.producerCalls.slice(0, point.owner.producerCount);
  check('all-public-events', () => {
    assert.deepEqual(
      actual.events.map(selectComponentsFocusEvent),
      source.ledger.events.slice(0, point.owner.eventCount).map(selectComponentsFocusEvent)
    );
    assert.equal(actual.rawEvents.length, point.owner.rawEventCount);
    actual.rawEvents.forEach((raw, index) => {
      verifySelectSurfaceEventGraph(
        raw,
        selectComponentsSourceFocusGraph(
          source.ledger.rawEvents[index],
          source.ledger.events[index]
        ),
        label + '/event' + index
      );
      const event = decodeSelectSurface(source.ledger.events[index]);
      if (Array.isArray(event) && ['public-focus', 'public-blur'].includes(String(event[0]))) applied?.add('existing-react-focus-blur-vs-native-focusin-focusout');
    });
  });
  check('tag-info', () => verifyResponsiveTagPrefixTagCalls(actual.producerCalls, calls, label));
  check('complete-input-contexts', () => {
    const originals = calls.filter(call => call.kind === 'components.input'), observations = actual.componentObservations as ComponentsObservation[];
    const matches = (observation: ComponentsObservation, call: ResponsiveTagPrefixProducerCall) => {
      try {
        verifySelectComponentsAttributes(observation, call, label);
        return true;
      }
      catch {
        return false;
      }
    };
    for (const observation of observations) {
      assert(
        originals.some(call => matches(observation, call)),
        label + ' every actual complete input context belongs to observed Source'
      );
    }
    for (const original of originals) {
      assert(
        observations.some(observation => matches(observation, original)),
        label + ' every whole Source input context represented without React count assertion'
      );
    }
  });
  check('actual-body-context-data', () => {
    const originals = source.ledger.bodyActivity.slice(0, point.owner.bodyActivityCount);
    const semantic = (value: unknown) => {
      const { rawContext: _raw, ...entry } = object(value);
      return entry;
    };
    for (const entry of actual.bodyActivity) {
      const current = object(entry);
      assert(current.kind === 'tag' || current.kind === 'prefix');
      const original = originals.find(other => isDeepStrictEqual(semantic(entry), semantic(other)));
      assert(
        original,
        label + ' each actual body context/value/rest flag belongs to the observed Source prefix'
      );
      verifyIconGraph(current.rawContext, original.rawContext, label + ' body complete raw context');
    }
    for (const original of originals) {
      assert(actual.bodyActivity.some(entry => isDeepStrictEqual(
        semantic(entry),
        semantic(original)
      )),
        label + ' each distinct complete Source body argument executes without an invocation-count assertion');
    }
  });
  check('semantic-style-producers', () => {
    const normalize = (call: SelectSurfaceProducerCall) => {
      const argument = decodeSelectSurface(call.argument) as { props: unknown };
      return { ...argument, props: normalizedSelectSurfaceAuthoredProps(argument.props) };
    };
    for (const [index, call] of actual.producerCalls.entries()) {
      assert.equal(call.index, index, label + ' retained chronological ledger index');
      assert.equal(call.side, 'own');
      assert(
        ['classNames', 'styles', 'components.input', 'tagRender', 'tagBody', 'prefixBody'].includes(call.kind),
        'No unverified producer kind'
      );
      if (!['classNames', 'styles'].includes(call.kind)) continue;
      const original = calls.find(other => other.kind === call.kind && isDeepStrictEqual(
        normalize(call),
        normalize(other)
      ) && isDeepStrictEqual(
        call.result,
        other.result
      ));
      assert(original, label + ' every complete actual semantic input/result belongs to Source');
      verifyIconGraph(
        call.rawResult,
        original.rawResult,
        label + '/' + call.kind + ' raw style/class result'
      );
    }
  });
  return failures;
}
export function verifyResponsiveTagPrefixSSRState(
  actual: SelectCustomTagPrefixOwner,
  source: { state: Omit<SelectCustomTagPrefixOwner, 'componentObservations'> },
  label: string
) {
  for (const key of ['model', 'open', 'query', 'alive', 'settings', 'context', 'authoredSample', 'authoredProvider', 'events', 'rawEvents', 'lifecycle'] as const)
    assert.deepEqual(actual[key], source.state[key], label + '/' + key);
  for (const key of ['rawModel', 'rawSettings', 'rawContext', 'rawAuthoredSample', 'rawAuthoredProvider'] as const) {
    verifyIconGraph(
      actual[key],
      source.state[key],
      label + '/' + key
    );
  }
  assert.deepEqual(
    normalizedSelectSurfaceAuthoredProps(actual.authoredProps),
    normalizedSelectSurfaceAuthoredProps(source.state.authoredProps)
  );
}
