import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import { decodeSelectSurface } from './select-surface-receipts';
import { verifyIconGraph, type IconNodeSpecification } from './select-icons-assertions';

interface Field { key: unknown; value?: unknown; get?: unknown; set?: unknown }
interface Node {
  id: number; type: string; array: boolean; authoredRole: Record<string, unknown> | null; opaque?: string;
  ownProperties?: Array<Record<string, unknown>>; properties?: Field[];
}
interface Graph { root: unknown; objects: Node[] }
const reference = (value: unknown): number | undefined => value && typeof value === 'object' && 'ref' in value
  ? (value as { ref: number }).ref : undefined;
const field = (node: Node, key: string) => node.properties?.find(p => p.key === key)?.value;
const aliases: Record<string, string> = { class: 'className', onmousedown: 'onMouseDown', onkeydown: 'onKeyDown',
  oninput: 'onChange', onfocusin: 'onFocus', onfocusout: 'onBlur', onclick: 'onClick' };
const ownKeys = (node: Node) => node.ownProperties?.map(p => p.key);
function css(value: unknown): Array<[string, string]> {
  if (typeof value === 'string') {
    return value.split(';').map(part => part.trim()).filter(Boolean).map(part => {
      const colon = part.indexOf(':');
      return [part.slice(0, colon).trim(), part.slice(colon + 1).trim()];
    });
  }
  assert(
    value && typeof value === 'object',
    'authored component style is an object or native CSS string'
  );
  return Object.entries(value).map(([name, v]) => [name.replace(
    /[A-Z]/g,
    c => '-' + c.toLowerCase()
  ),
    typeof v === 'number' && !['opacity', 'lineHeight', 'zIndex', 'flex'].includes(name) ? v + 'px' : String(v)]);
}
function rawValue(graph: Graph, value: unknown, seen = new Map<number, unknown>()): unknown {
  const id = reference(value);
  if (id === undefined) {
    return decodeSelectSurface(value);
  }
  if (seen.has(id)) {
    return seen.get(id);
  }
  const node = graph.objects.find(n => n.id === id);
  assert(node, 'complete component graph');
  if (node.authoredRole) {
    return { $: 'authored', role: node.authoredRole };
  }
  const result: Record<string, unknown> = {};
  seen.set(id, result);
  for (const p of node.properties ?? []) result[String(p.key)] = rawValue(graph, p.value, seen);
  return result;
}
function definition(node: Node) {
  const role = node.authoredRole;
  if (typeof role?.component === 'string' && /^(root|input):(function|composite|composite-native-only)$/.test(role.component)) {
    return 'function';
  }
  if (typeof role?.node === 'string' && /^component-(root|input):element$/.test(role.node)) {
    return 'element';
  }
  return role?.node === 'flow-prefix-element' ? 'prefix' : undefined;
}
/**
 * Whole raw graphs are retained. Only the declared React component definitions
 * cross a representation boundary: forwardRef -> Snippet, intrinsic ReactElement
 * -> {element,props,ref}, and the zero-prop PrefixProbe element -> prefix Snippet.
 * The element's complete authored props/ref are checked before that boundary.
 */
export function verifySelectComponentsGraph(actualValue: unknown, sourceValue: unknown, label: string,
  specs: readonly IconNodeSpecification[] = [], authoredProps = false) {
  const actual = structuredClone(actualValue) as Graph, source = structuredClone(sourceValue) as Graph;
  const originals = new Map(actual.objects.map(n => [n.id, n])), sourceOriginals = new Map(source.objects.map(n => [n.id, n]));
  const replacements = new Set<number>(), sourceReplacements = new Set<number>();
  const subgraph = (graph: Graph, root: unknown): Graph => ({ root, objects: graph.objects });
  for (const right of source.objects) {
    const kind = definition(right);
    if (!kind) continue;
    const left = actual.objects.find(n => isDeepStrictEqual(n.authoredRole, right.authoredRole));
    assert(left, label + ' complete declared component role');
    assert.equal(left.array, false);
    if (kind === 'function') {
      assert.equal(right.type, 'object');
      assert.deepEqual(ownKeys(right), ['$$typeof', 'render']);
      assert.deepEqual(
        field(right, '$$typeof'),
        { $: 'symbol', symbol: 'react.forward_ref', description: 'react.forward_ref' }
      );
      assert.equal(sourceOriginals.get(reference(field(right, 'render'))!)?.type, 'function');
      assert.equal(left.type, 'function', label + ' actual callable replacement Snippet');
    }
    else {
      assert.equal(right.type, 'object');
      assert.deepEqual(ownKeys(right), ['$$typeof', 'type', 'key', 'ref', 'props', '_owner']);
      assert.deepEqual(
        field(right, '$$typeof'),
        { $: 'symbol', symbol: 'react.element', description: 'react.element' }
      );
      assert.equal(field(right, 'key'), null);
      assert.equal(field(right, '_owner'), null);
      const rightProps = sourceOriginals.get(reference(field(right, 'props'))!)!;
      assert(rightProps);
      if (kind === 'prefix') {
        assert.equal(left.type, 'function');
        assert.equal(field(right, 'ref'), null);
        assert.deepEqual(ownKeys(rightProps), []);
        assert.deepEqual(
          sourceOriginals.get(reference(field(right, 'type'))!)?.authoredRole,
          { component: 'flow-prefix-probe' }
        );
      }
      else {
        assert.equal(left.type, 'object');
        assert.deepEqual(ownKeys(left), ['element', 'props', 'ref']);
        assert.equal(field(left, 'element'), field(right, 'type'));
        verifyIconGraph(
          subgraph(actual, field(left, 'ref')),
          subgraph(source, field(right, 'ref')),
          label + ' authored component ref',
          specs
        );
        const leftProps = originals.get(reference(field(left, 'props'))!)!;
        assert(leftProps);
        const target = structuredClone(subgraph(source, field(right, 'props'))), current = structuredClone(subgraph(
          actual,
          field(left, 'props')
        ));
        const a = current.objects.find(n => n.id === leftProps.id)!, b = target.objects.find(n => n.id === rightProps.id)!;
        for (const p of a.ownProperties ?? []) p.key = aliases[String(p.key)] ?? p.key;
        for (const p of a.properties ?? []) p.key = aliases[String(p.key)] ?? p.key;
        const aStyle = a.properties?.find(p => p.key === 'style'), bStyle = b.properties?.find(p => p.key === 'style');
        if (aStyle || bStyle) {
          assert(aStyle && bStyle, label + ' authored style presence');
          const nativeStyle = rawValue(actual, aStyle.value), sourceStyle = rawValue(
            source,
            bStyle.value
          );
          if (typeof nativeStyle === 'string' || typeof sourceStyle === 'string') {
            assert.deepEqual(
              css(nativeStyle),
              css(sourceStyle),
              label + ' every authored CSS declaration/order'
            );
            // Only the native string versus original object crosses representation.
            aStyle.value = bStyle.value = 'component-authored-style';
            a.ownProperties!.find(p => p.key === 'style')!.valueType = b.ownProperties!.find(p => p.key === 'style')!.valueType = 'string';
          }
          else {
            // Object/null/undefined already share the public representation.
            // Preserve their full own descriptors, order, values and aliases.
            verifyIconGraph(
              subgraph(actual, aStyle.value),
              subgraph(source, bStyle.value),
              label + ' complete authored style graph',
              specs
            );
          }
        }
        verifyIconGraph(current, target, label + ' complete authored component props', specs);
      }
    }
    replacements.add(left.id);
    sourceReplacements.add(right.id);
  }
  const replace = (graph: Graph, ids: Set<number>) => {
    for (const node of graph.objects) {
      if (ids.has(node.id)) {
        node.type = 'object';
        node.opaque = 'declared-component-definition';
        node.ownProperties = [];
        node.properties = [];
      }
      else {
        for (const p of node.properties ?? []) {
          if (ids.has(reference(p.value)!)) {
            const descriptor = node.ownProperties?.find(d => isDeepStrictEqual(d.key, p.key));
            assert(descriptor);
            descriptor.valueType = 'object';
          }
        }
      }
    }
  };
  replace(actual, replacements);
  replace(source, sourceReplacements);
  verifyIconGraph(actual, source, label, specs, authoredProps);
}
function argument(call: SelectSurfaceProducerCall) {
  const value = decodeSelectSurface(call.argument) as { props?: Record<string, unknown> };
  if (!value?.props) {
    return value;
  }
  const props = { ...value.props };
  if (Object.hasOwn(props, 'class')) {
    props.className = props.class;
    delete props.class;
  }
  if (props.id === 'select-icons-field' && props.mode !== 'SECRET_COMBOBOX_MODE_DO_NOT_USE') {
    if (props.value === undefined) delete props.value;
    if (props.open === undefined) delete props.open;
  }
  return { ...value, props };
}
function invocation(actual: SelectSurfaceProducerCall, source: SelectSurfaceProducerCall) {
  return actual.kind === source.kind && actual.side === source.side && isDeepStrictEqual(
    argument(actual),
    argument(source)
  )
    && isDeepStrictEqual(actual.result, source.result) && ['argumentCount', 'argumentOwnKeys', 'argumentDescriptors'].every(key => isDeepStrictEqual(
      actual[key],
      source[key]
    ));
}
/** Source component invocations use the separately recorded Native Snippet context. No Source ledger row is deleted. */
export function verifySelectComponentsProducers(actual: readonly SelectSurfaceProducerCall[], source: readonly SelectSurfaceProducerCall[],
  label: string, specs: readonly IconNodeSpecification[] = [], ssr = false) {
  const kinds = new Set(['classNames', 'styles', 'suffix']);
  const completeInvocation = (actual: SelectSurfaceProducerCall, source: SelectSurfaceProducerCall) => {
    if (!invocation(actual, source)) {
      return false;
    }
    try {
      verifySelectComponentsGraph(
        actual.rawArgument,
        source.rawArgument,
        label + '/' + actual.kind + ' raw argument',
        specs
      );
      verifySelectComponentsGraph(
        actual.rawResult,
        source.rawResult,
        label + '/' + actual.kind + ' raw result',
        specs
      );
      return true;
    }
    catch { return false; }
  };
  for (const [index, call] of actual.entries()) {
    assert.equal(call.index, index, label + ' complete Native ledger index');
    assert(kinds.has(call.kind), label + ' explicitly covered Native pure producer kind');
    const target = source.find(p => completeInvocation(call, p));
    assert(target, label + ' every Native invocation belongs to the whole Source prefix');
    verifySelectComponentsGraph(
      call.rawArgument,
      target.rawArgument,
      label + '/' + call.kind + ' raw argument',
      specs
    );
    verifySelectComponentsGraph(
      call.rawResult,
      target.rawResult,
      label + '/' + call.kind + ' raw result',
      specs
    );
  }
  for (const call of source) {
    assert(
      kinds.has(call.kind) || /^components\.(root|input)$/.test(call.kind),
      label + ' every Source kind has a named verifier'
    );
    if (kinds.has(call.kind)) {
      assert(
        actual.some(p => completeInvocation(p, call)),
        label + ' every complete Source pure invocation executes'
      );
    }
  }
  if (ssr) {
    const expected: Array<[string, string]> = [];
    // Component calls are represented by context observations, compared separately.
    for (const call of source) {
      if (kinds.has(call.kind)) expected.push([call.kind, call.side]);
    }
    assert.deepEqual(
      actual.map(call => [call.kind, call.side]),
      expected,
      label + ' exact SSR pure callback order/count'
    );
  }
}
