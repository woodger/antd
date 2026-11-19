import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';
import type { Page } from '@playwright/test';
import { readSelectSurface } from './select-surface-metrics';
import { drainSelectSurface } from './select-surface-driver';
import { decodeSelectSurface } from './select-surface-receipts';
import { nativeSelectPopupUnmounted, normalizedSelectSurfaceAuthoredProps, readNativeSurfaceTopology, selectSurfaceEventValue,
  verifySelectSurfaceEventGraph, verifySelectSurfaceNode } from './select-surface-assertions';
import type { SelectSurfaceProducerCall } from './select-surface-producers.mjs';
import type { SelectIconSample } from './select-icons-cases.mjs';
import { readSelectIcons, type SelectIconNode } from './select-icons-metrics.mjs';
import type { IconOwner, IconPoint, IconCase } from './select-icons-reference';
import type { readSelectIconsSSR } from './select-icons-ssr-metrics';

export interface IconNodeSpecification { role: unknown; raw: unknown }
export interface NativeIconOwner extends IconOwner {
  alive: boolean; events: unknown[]; rawEvents: unknown[]; calls: SelectSurfaceProducerCall[]; lifecycle: unknown[];
  nodeSpecifications: IconNodeSpecification[];
  nativeRemountClosures?: Array<{ actionIndex: number; eventIndex: number; rawEventIndex: number;
    before: boolean; after: boolean; wasFocused: boolean; connected: boolean }>;
}
export interface NativeIconPoint {
  dom: ReturnType<typeof readSelectSurface>; icons: ReturnType<typeof readSelectIcons>;
  topology: ReturnType<typeof readNativeSurfaceTopology>; owner: NativeIconOwner;
}
export function createIconIdentityLedger() {
  const native = new Map<number, number>(), original = new Map<number, number>();
  const compare = (
    actual: SelectIconNode | null | undefined,
    source: SelectIconNode | null | undefined,
    label: string
  ) => {
    assert.equal(Boolean(actual), Boolean(source), label + ' physical node presence');
    if (!actual || !source) {
      return;
    }
    if (native.has(actual.identity)) {
      assert.equal(
        native.get(actual.identity),
        source.identity,
        label + ' retained Native node matches the same Source node'
      );
    }
    else {
      assert(
        !original.has(source.identity),
        label + ' Source retained node was not replaced in Native'
      );
      native.set(actual.identity, source.identity);
      original.set(source.identity, actual.identity);
    }
  };
  return Object.assign(compare, { releaseDefaultPopup(ids: ReadonlySet<number>) {
    for (const id of ids) {
      const actual = original.get(id);
      if (actual !== undefined) native.delete(actual);
      original.delete(id);
    }
  } });
}
interface GraphNode { id: number; type: string; array: boolean; authoredRole: unknown; opaque?: string;
  ownProperties?: Array<Record<string, unknown>>; properties?: Array<{
    key: unknown;
    value?: unknown;
    get?: unknown;
    set?: unknown
  }> }
interface Graph { root: unknown; objects: GraphNode[] }
const ref = (v: unknown): number | undefined => v && typeof v === 'object' && 'ref' in v ? (v as { ref: number }).ref : undefined;
const property = (n: GraphNode, key: string) => n.properties?.find(p => p.key === key)?.value;
const undefinedValue = (value: unknown) => value !== null && typeof value === 'object'
  && '$' in value && value.$ === 'undefined';
function reactElement(n: GraphNode | undefined) {
  const type = n && property(n, '$$typeof');
  return n?.type === 'object' && type && typeof type === 'object' && 'symbol' in type && type.symbol === 'react.element';
}
function publicReactNode(graph: Graph, node: GraphNode): Graph {
  const keys = ['type', 'key', 'ref', 'props'];
  return { root: { ref: -1 }, objects: [{ id: -1, type: 'object', array: false, authoredRole: null,
    ownProperties: keys.map(key => node.ownProperties!.find(p => p.key === key)!),
    properties: keys.map(key => node.properties!.find(p => p.key === key)!) }, ...graph.objects] };
}
/** Raw graphs stay intact. Only the documented public React node/Svelte producer boundary is projected for comparison. */
export function verifyIconGraph(
  actualValue: unknown,
  sourceValue: unknown,
  label: string,
  nodeSpecs: readonly IconNodeSpecification[] = [],
  authoredProps = false
) {
  const a = actualValue as Graph, b = sourceValue as Graph;
  const actual = new Map(a.objects.map(n => [n.id, n])), source = new Map(b.objects.map(n => [n.id, n]));
  const pairs = new Map<number, number>(), reverse = new Map<number, number>();
  function walk(left: unknown, right: unknown, root = false) {
    const ai = ref(left), bi = ref(right);
    if (ai === undefined || bi === undefined) {
      assert.deepEqual(left, right, label);
      return;
    }
    if (pairs.has(ai)) {
      assert.equal(pairs.get(ai), bi, label + ' repeated raw alias');
      return;
    }
    assert(!reverse.has(bi), label + ' distinct raw aliases');
    pairs.set(ai, bi);
    reverse.set(bi, ai);
    const x = actual.get(ai)!, y = source.get(bi)!;
    assert(x && y, label + ' complete referenced graph');
    assert.deepEqual(x.authoredRole, y.authoredRole, label + ' complete authored role');
    if (reactElement(y) && (x.type === 'function' || x.array)) {
      if (x.array) {
        // Один явно статический Snippet сохраняет typeof object для RenderNode;
        // полные raw graph и public node specification остаются в наблюдении.
        assert.equal(x.type, 'object');
        assert.deepEqual(x.properties?.map(p => p.key), ['0', 'length']);
        assert.equal(property(x, 'length'), 1);
        const snippet = actual.get(ref(property(x, '0'))!);
        assert(snippet && snippet.type === 'function' && !snippet.array);
        assert.deepEqual(snippet.authoredRole, y.authoredRole);
      }
      else {
        assert.equal(x.array, false);
      }
      const specification = nodeSpecs.find(s => isDeepStrictEqual(s.role, y.authoredRole));
      assert(
        specification,
        label + ' every actual Snippet has a recorded public node specification'
      );
      verifyIconGraph(
        specification.raw,
        publicReactNode(b, y),
        label + ' full public type/key/ref/props'
      );
      return;
    }
    assert.equal(x.type, y.type, label + ' raw typeof');
    assert.equal(x.array, y.array, label + ' raw array');
    assert.equal(x.opaque, y.opaque, label + ' opaque owner kind');
    const props = authoredProps && root || property(y, 'id') === 'select-icons-field' && property(
      y,
      'options'
    ) !== undefined;
    const aliasKey = (key: unknown) => props && key === 'class' ? 'className' : key;
    // Select's named bindables leave props-rest and are appended separately. This
    // changes only value/open placement and loses an own undefined; every other
    // key, descriptor, value and alias remains checked in its original order.
    const selectBindings = props && !(authoredProps && root)
      && property(y, 'mode') !== 'SECRET_COMBOBOX_MODE_DO_NOT_USE';
    const binding = (key: unknown) => key === 'value' || key === 'open';
    const omittedBinding = (key: unknown) => selectBindings && binding(key)
      && !x.properties?.some(p => p.key === key) && undefinedValue(property(y, String(key)));
    const ordered = <Value extends { key?: unknown }>(fields: Value[]) => selectBindings
      ? [...fields.filter(p => !binding(p.key)), ...fields.filter(p => p.key === 'value'), ...fields.filter(p => p.key === 'open')]
      : fields;
    const iconProducer = (node: GraphNode) => node.type === 'function' && !node.array
      && node.authoredRole !== null && typeof node.authoredRole === 'object' && 'callback' in node.authoredRole
      && typeof node.authoredRole.callback === 'string'
      && /^icons-(?:suffix|menuItemSelectedIcon|removeIcon):(?:own|context|inner):(?:node|undefined|null|false|zero|empty|empty-array|array)$/.test(node.authoredRole.callback)
      && property(node, 'name') === 'iconsRenderNode' && property(node, 'length') === 0;
    const strictIconProducer = iconProducer(x) && iconProducer(y)
      && y.ownProperties?.some(p => p.key === 'arguments' || p.key === 'caller');
    if (strictIconProducer) {
      for (const key of ['arguments', 'caller']) {
        assert.deepEqual(y.ownProperties?.find(p => p.key === key), { key, enumerable: false, configurable: false,
          writable: false, kind: 'value', valueType: 'object' }, label + ' fixed non-strict Source function reflection');
        assert.deepEqual(
          y.properties?.find(p => p.key === key),
          { key, value: null },
          label + ' reflection-only Source null'
        );
        assert.equal(
          x.ownProperties?.some(p => p.key === key),
          false,
          label + ' strict Native producer has no own reflection field'
        );
        assert.equal(x.properties?.some(p => p.key === key), false);
      }
    }
    const reflectionOnly = (key: unknown) => strictIconProducer && (key === 'arguments' || key === 'caller');
    const sourceFields = ordered(y.ownProperties?.filter(p => !(authoredProps && root && p.key === 'ref')
      && !omittedBinding(p.key) && !reflectionOnly(p.key)) ?? []);
    const actualFields = (x.ownProperties ?? []).map(p => {
      const key = aliasKey(p.key), target = sourceFields.find(f => f.key === key);
      if (p.valueType === 'function' && target?.valueType === 'object' && typeof p.key === 'string') {
        const an = actual.get(ref(property(x, p.key))!), sn = source.get(ref(property(
          y,
          String(key)
        ))!);
        if (an?.type === 'function' && reactElement(sn)) {
          return { ...p, key, valueType: 'object' };
        }
      }
      return { ...p, key };
    });
    assert.deepEqual(
      ordered(actualFields),
      sourceFields,
      label + ' full own descriptors/order with only named binding placement'
    );
    if (x.opaque || y.opaque) {
      return;
    }
    const xs = ordered((x.properties ?? []).map(p => ({ ...p, key: aliasKey(p.key) })));
    const ys = ordered((y.properties ?? []).filter(p => !(authoredProps && root && p.key === 'ref')
      && !omittedBinding(p.key) && !reflectionOnly(p.key)));
    assert.deepEqual(xs.map(p => p.key), ys.map(p => p.key), label + ' every raw key/order');
    for (const [index, p] of xs.entries()) {
      const q = ys[index];
      assert.equal(Object.hasOwn(p, 'value'), Object.hasOwn(q, 'value'), label + ' data/accessor');
      if (Object.hasOwn(p, 'value')) {
        walk(p.value, q.value);
      }
      else {
        walk(p.get, q.get);
        walk(p.set, q.set);
      }
    }
  }
  walk(a.root, b.root, true);
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
function sameInvocation(a: SelectSurfaceProducerCall, b: SelectSurfaceProducerCall) {
  return a.kind === b.kind && a.side === b.side && isDeepStrictEqual(argument(a), argument(b))
    && isDeepStrictEqual(a.result, b.result) && isDeepStrictEqual(a.argumentCount, b.argumentCount)
    && isDeepStrictEqual(a.argumentOwnKeys, b.argumentOwnKeys) && isDeepStrictEqual(
      a.argumentDescriptors,
      b.argumentDescriptors
    );
}
/** Both complete repetitions remain authoritative; pure duplicate passes do not set a React render-count requirement. */
export function verifyIconCalls(
  actual: readonly SelectSurfaceProducerCall[],
  sources: readonly (readonly SelectSurfaceProducerCall[])[],
  label: string,
  specs: readonly IconNodeSpecification[],
  ssr = false
) {
  const all = sources.flat();
  if (ssr) {
    assert.deepEqual(
      actual.map(p => [p.kind, p.side]),
      all.map(p => [p.kind, p.side]),
      label + ' exact SSR pure call order/count'
    );
  }
  for (const [index, call] of actual.entries()) {
    assert.equal(call.index, index, label + ' full Native call ledger');
    const source = ssr ? all[index] : all.find(p => sameInvocation(call, p));
    assert(
      source && sameInvocation(call, source),
      label + ' every actual full invocation belongs to a complete Source prefix'
    );
    verifyIconGraph(
      call.rawArgument,
      source.rawArgument,
      label + ' raw argument descriptors/aliases',
      specs
    );
    verifyIconGraph(
      call.rawResult,
      source.rawResult,
      label + ' raw result descriptors/aliases',
      specs
    );
    for (const key of ['argumentCount', 'argumentOwnKeys', 'argumentDescriptors']) {
      assert.deepEqual(
        call[key],
        source[key],
        label + '/' + key
      );
    }
  }
  for (const source of all) {
    assert(
      actual.some(p => sameInvocation(p, source)),
      label + ' every observed Original semantic invocation executed'
    );
  }
}
const scopeClass = (name: string) => name.startsWith('svelte-') || /^s-[A-Za-z0-9]+$/.test(name);
function attrs(n: SelectIconNode) {
  return n.attributes.map(([name, value]) => [name, name === 'class' ? value.split(/\s+/).filter(c => !scopeClass(c)).join(' ') : value]);
}
function withoutCompilerComments(html: string) { return html.replace(/<!--[\s\S]*?-->/g, ''); }
interface IconBoundary {
  control: SelectIconSample['control'];
  legacyClear: boolean;
  rootDisabled: boolean;
  hiddenPopup: boolean;
  removeLabel?: string;
  feedbackSVG?: boolean;
}
function usesLegacyClear(owner: IconOwner, sample: SelectIconSample) {
  const own = normalizedSelectSurfaceAuthoredProps(owner.authoredProps);
  const provider = decodeSelectSurface(owner.authoredProvider) as { select?: { allowClear?: unknown } };
  const inner = decodeSelectSurface(owner.authoredInnerProvider) as typeof provider | undefined;
  const context = inner === undefined ? provider.select : inner.select;
  return (own.allowClear ?? (sample.control === 'select' ? context?.allowClear : false)) === true;
}
function sourceRemoveLabel(node: SelectIconNode, nodes: readonly SelectIconNode[]) {
  const index = nodes.indexOf(node);
  const parent = nodes.slice(0, index).reverse().find(n => n.classes.includes('ant-select-selection-item'));
  const matchingAttribute = parent?.attributes.find(([key]) => key === 'title');
  const title = matchingAttribute?.[1];
  assert.equal(typeof title, 'string', 'Source remove span belongs to the preceding titled tag');
  return `Удалить ${title}`;
}
function withoutSourceUserSelect(node: SelectIconNode, label: string) {
  const declaration = node.inlineProperties.find(p => p.name === 'user-select');
  assert.deepEqual(
    declaration,
    { name: 'user-select', value: 'none', priority: '' },
    label + ' original nonselectable remove span'
  );
  const inlineProperties = node.inlineProperties.filter(p => p.name !== 'user-select');
  const cssText = node.cssText.replace(/^user-select: none;\s*/, '');
  assert.equal(
    cssText.startsWith('user-select:'),
    false,
    label + ' one Source generated user-select declaration'
  );
  const attributes = node.attributes.flatMap(([key, value]) => key === 'style'
    ? cssText ? [[key, cssText]] : [] : [[key, value]]);
  return { ...node, styleAttribute: cssText || null, cssText, inlineProperties, attributes };
}
function verifyFeedbackSVGAttributes(actual: string[][], source: string[][], label: string) {
  assert.deepEqual(Object.fromEntries(actual.filter(([key]) => key !== 'class')),
    { 'aria-hidden': 'true', focusable: 'false', viewBox: '64 64 896 896' }, label + ' fixed Native feedback SVG attributes');
  const matchingEntry = actual.find(([key]) => key === 'class');
  const classes = matchingEntry?.[1] ?? '';
  assert.equal(classes, '', label + ' feedback SVG has only compiler classes');
  assert.deepEqual(source, [['fill-rule', 'evenodd'], ['viewBox', '64 64 896 896'], ['focusable', 'false'],
    ['data-icon', 'close-circle'], ['width', '1em'], ['height', '1em'], ['fill', 'currentColor'], ['aria-hidden', 'true']],
  label + ' pinned Source feedback SVG attributes');
}
/** Exact authored nodes, all CSSOM, boxes and SVG/path markup; live animation geometry follows the frozen observer boundary. */
export function verifyIconNode(
  actualNode: SelectIconNode,
  sourceNode: SelectIconNode,
  label: string,
  boundary?: IconBoundary
) {
  let actual = actualNode, source = sourceNode;
  let currentAttrs = attrs(actual), originalAttrs = attrs(source);
  let wrapper = false;
  const hasClass = (name: string) => source.classes.includes(name);
  const attribute = (values: string[][], key: string) => values.find(([name]) => name === key)?.[1];
  const removeAttribute = (key: string, value: string | undefined, original = false) => {
    const values = original ? originalAttrs : currentAttrs;
    assert.equal(
      attribute(values, key),
      value,
      label + '/' + key + ' exact physical-wrapper boundary'
    );
    if (original) {
      originalAttrs = values.filter(([name]) => name !== key);
    }
    else {
      currentAttrs = values.filter(([name]) => name !== key);
    }
  };
  const removePrivateClass = (name: string) => {
    assert.equal(
      actual.classes.includes(name),
      true,
      label + ' retained Native ' + name + ' wrapper'
    );
    currentAttrs = currentAttrs.map(([key, value]) => [key, key === 'class' ? value.split(/\s+/).filter(c => c !== name).join(' ') : value]);
  };
  if (boundary && hasClass('ant-select-suffix')) {
    wrapper = true;
    assert.equal(source.tag, 'DIV');
    assert.equal(
      actual.tag,
      boundary.control === 'select' ? 'SPAN' : 'DIV',
      label + ' retained Native suffix element'
    );
    removePrivateClass(boundary.control === 'select' ? 'suffix' : 'feedback-suffix');
    actual = { ...actual, tag: source.tag };
  }
  else if (boundary && hasClass('ant-select-clear')) {
    wrapper = true;
    removePrivateClass('clear');
    if (boundary.legacyClear) {
      assert.equal(attribute(originalAttrs, 'aria-label'), 'Clear');
      assert.equal(
        attribute(currentAttrs, 'aria-label'),
        'Очистить',
        label + ' retained localized boolean-clear name'
      );
      currentAttrs = currentAttrs.map(([key, value]) => [key, key === 'aria-label' ? 'Clear' : value]);
    }
  }
  else if (boundary && hasClass('ant-select-selection-item-remove')) {
    wrapper = true;
    assert.equal(actual.tag, 'BUTTON');
    assert.equal(source.tag, 'SPAN');
    removeAttribute('type', 'button');
    removeAttribute('data-ant-select-selection-item-remove', 'true');
    removeAttribute('aria-label', boundary.removeLabel);
    removeAttribute('aria-hidden', undefined);
    removeAttribute('unselectable', undefined);
    removeAttribute('unselectable', 'on', true);
    removeAttribute('aria-hidden', 'true', true);
    source = withoutSourceUserSelect(source, label);
    originalAttrs = attrs(source).filter(([key]) => key !== 'unselectable' && key !== 'aria-hidden');
    assert.equal(actual.value, '', label + ' Native removal button value');
    assert.equal(source.value, null);
    actual = { ...actual, tag: source.tag, value: null };
  }
  else if (boundary && hasClass('ant-select-selection-item')) {
    wrapper = true;
    removeAttribute('data-ant-select-selection-item', 'true');
    removeAttribute('role', 'presentation');
    const individuallyDisabled = source.classes.includes('ant-select-selection-item-disabled');
    removeAttribute(
      'data-ant-select-selection-item-disabled',
      individuallyDisabled || boundary.rootDisabled ? 'true' : undefined
    );
    if (boundary.rootDisabled && !individuallyDisabled) removePrivateClass('ant-select-selection-item-disabled');
    // Native tags are direct flex items; Source grows the inner tag inside an
    // overflow item. The frozen pre-migration owner has these exact annotations
    // and the same boxes. Authored inline layout and every box remain strict.
    if (actual.styleAttribute === null && source.styleAttribute === null) {
      assert.equal(actual.css.flex, '0 0 auto', label + ' flat Native tag flex');
      assert.equal(source.css.flex, '1 1 0%', label + ' Source inner overflow tag flex');
      assert.equal(actual.css.maxWidth, 'calc(100% - 8px)', label + ' flat Native tag width bound');
      assert.equal(source.css.maxWidth, 'none', label + ' Source inner overflow tag bound');
      actual = {
        ...actual,
        css: { ...actual.css, flex: source.css.flex, maxWidth: source.css.maxWidth }
      };
    }
    if (actual.css.minHeight === 'auto' && source.css.minHeight === '0px' && !/(?:^|;)\s*min-height\s*:/.test(source.styleAttribute ?? ''))
      actual = { ...actual, css: { ...actual.css, minHeight: source.css.minHeight } };
  }
  else if (boundary && hasClass('ant-select-item-option')) {
    wrapper = true;
    assert.equal(actual.tag, 'BUTTON');
    assert.equal(source.tag, 'DIV');
    removeAttribute('type', 'button');
    removeAttribute('tabindex', '-1');
    if (boundary.control === 'select') {
      removeAttribute('data-ant-select-item', 'true');
    }
    else {
      removeAttribute('data-ant-auto-complete-item', 'true');
      removeAttribute('data-ant-auto-complete-item-option', 'true');
      removeAttribute(
        'data-ant-auto-complete-item-option-disabled',
        attribute(originalAttrs, 'aria-disabled') === 'true' ? 'true' : undefined
      );
    }
    removeAttribute(
      'disabled',
      attribute(originalAttrs, 'aria-disabled') === 'true' ? '' : undefined
    );
    assert.equal(actual.value, '', label + ' Native option button value');
    assert.equal(source.value, null);
    actual = { ...actual, tag: source.tag, value: null };
    if (boundary.control === 'autocomplete' && actual.styleAttribute === null && source.styleAttribute === null) {
      assert.equal(actual.css.flex, '0 0 auto', label + ' retained Native popup flex item');
      assert.equal(source.css.flex, '0 1 auto', label + ' Source option flex');
      actual = { ...actual, css: { ...actual.css, flex: source.css.flex } };
      if (boundary.hiddenPopup) {
        assert(actual.box && source.box
          && [...Object.values(actual.box), ...Object.values(source.box)].every(value => value === 0),
        label + ' both retained options have no layout box');
        assert.equal(actual.css.width, '100%', label + ' hidden Native option width annotation');
        assert.equal(source.css.width, 'auto', label + ' hidden Source option width annotation');
        assert.equal(source.css.pointerEvents, 'none', label + ' hidden Source pointer annotation');
        assert.equal(
          actual.css.pointerEvents,
          source.css.pointerEvents,
          label + ' inactive Native popup pointer state'
        );
        actual = { ...actual, css: { ...actual.css, width: source.css.width } };
      }
    }
  }
  else if (hasClass('ant-select-item-option-state')) {
    // React assigns the TransBtn style after its static attributes in CSR;
    // Svelte declares this same fixed style alongside the class.
    assert.deepEqual(currentAttrs.filter(([key]) => key !== 'style'), originalAttrs.filter(([key]) => key !== 'style'),
      label + ' complete TransBtn static attribute order');
    assert.equal(
      attribute(currentAttrs, 'style'),
      attribute(originalAttrs, 'style'),
      label + ' exact TransBtn style value'
    );
    currentAttrs = originalAttrs;
  }
  else if (actual.attributes.some(([key]) => key === 'data-form-feedback-glyph')) {
    assert.deepEqual(currentAttrs, [['data-form-feedback-glyph', ''], ['role', 'img'], ['class', 'anticon anticon-close-circle'], ['aria-label', 'close-circle']],
      label + ' fixed Native feedback glyph marker and attributes');
    assert.deepEqual(originalAttrs, [['role', 'img'], ['aria-label', 'close-circle'], ['class', 'anticon anticon-close-circle']],
      label + ' fixed Source feedback glyph attributes');
    currentAttrs = originalAttrs;
  }
  else if (boundary?.feedbackSVG) {
    verifyFeedbackSVGAttributes(currentAttrs, originalAttrs, label);
    currentAttrs = originalAttrs;
  }
  for (const key of ['tag', 'connected', 'text', 'styleAttribute', 'cssText', 'inlineProperties', 'css', 'box', 'geometryBoundary', 'value', 'caret', 'focused'] as const)
    assert.deepEqual(actual[key], source[key], label + '/' + key);
  if (wrapper) {
    assert.deepEqual(
      Object.fromEntries(currentAttrs),
      Object.fromEntries(originalAttrs),
      label + ' all physical-wrapper attributes'
    );
  }
  else {
    assert.deepEqual(currentAttrs, originalAttrs, label + ' all attributes/order');
  }
  const classes = (values: string[][]) => attribute(values, 'class')?.split(/\s+/).filter(Boolean) ?? [];
  assert.deepEqual(classes(currentAttrs), classes(originalAttrs), label + ' all classes/order');
  if (source.tag.toLowerCase() === 'svg') {
    if (boundary?.feedbackSVG) {
      const descendants = (html: string) => withoutCompilerComments(html).slice(html.indexOf('>') + 1)
        .replace(/ class="(?:svelte-[^"]+|s-[A-Za-z0-9]+)"/g, '');
      assert.equal(
        descendants(actual.html),
        descendants(source.html),
        label + ' exact feedback SVG descendants and paths'
      );
    }
    else {
      assert.equal(
        withoutCompilerComments(actual.html),
        withoutCompilerComments(source.html),
        label + ' complete SVG and descendant paths'
      );
    }
  }
}
interface SSRIconElement { tag: string; attributes: string[][]; children?: Array<SSRIconElement | string>; text?: string }
/** Whole HTML stays raw; these fixed templates differ only at named framework boundaries. */
export function verifySelectIconSSRNodes(
  actual: ReturnType<typeof readSelectIconsSSR>,
  source: ReturnType<typeof readSelectIconsSSR>,
  owner: IconOwner,
  sample: SelectIconSample,
  label: string
) {
  const legacyClear = usesLegacyClear(owner, sample);
  const metadata = (decodeSelectSurface(owner.settings) as { metadata?: boolean }).metadata === true;
  const declarations = (style: string) => style.split(';').filter(part => part.trim()).map(part => {
    const match = /^\s*([\w-]+)\s*:\s*(.*?)\s*(!important)?\s*$/.exec(part);
    assert(match, label + ' fixed authored icon declaration is retained');
    return { property: match[1], value: match[2], priority: match[3] ?? '' };
  });
  const clean = (attributes: string[][]) => attributes.flatMap(([key, value]) => {
    if (key !== 'class') {
      return [[key, value]];
    }
    const classes = value.split(/\s+/).filter(c => !scopeClass(c));
    return classes.length ? [[key, classes.join(' ')]] : [];
  });
  const get = (attributes: string[][], key: string) => attributes.find(([name]) => name === key)?.[1];
  const compare = (a: SSRIconElement, b: SSRIconElement, point: string, feedbackSVG = false) => {
    let x = clean(a.attributes), y = clean(b.attributes), tag = a.tag;
    const classes = get(y, 'class')?.split(/\s+/) ?? [];
    const is = (name: string) => classes.includes(name);
    let wrapper = false;
    const drop = (key: string, value: string | undefined, original = false) => {
      const attrs = original ? y : x;
      assert.equal(get(attrs, key), value, point + '/' + key);
      if (original) {
        y = attrs.filter(([name]) => name !== key);
      }
      else {
        x = attrs.filter(([name]) => name !== key);
      }
    };
    const privateClass = (name: string) => {
      assert(get(x, 'class')?.split(/\s+/).includes(name), point + ' known Native wrapper class');
      x = x.map(([key, value]) => [key, key === 'class' ? value.split(/\s+/).filter(c => c !== name).join(' ') : value]);
    };
    const hasFeedback = a.attributes.some(([key]) => key === 'data-form-feedback-glyph');
    if (is('ant-select-suffix')) {
      wrapper = true;
      assert.equal(b.tag, 'div');
      assert.equal(a.tag, sample.control === 'select' ? 'span' : 'div');
      tag = b.tag;
      privateClass(sample.control === 'select' ? 'suffix' : 'feedback-suffix');
    }
    else if (is('ant-select-clear')) {
      wrapper = true;
      privateClass('clear');
      if (legacyClear) {
        assert.equal(get(y, 'aria-label'), 'Clear');
        assert.equal(get(x, 'aria-label'), 'Очистить');
        x = x.map(([key, value]) => [key, key === 'aria-label' ? 'Clear' : value]);
      }
    }
    else if (is('ant-select-selection-item-remove')) {
      wrapper = true;
      assert.equal(a.tag, 'button');
      assert.equal(b.tag, 'span');
      tag = b.tag;
      drop('type', 'button');
      drop('data-ant-select-selection-item-remove', 'true');
      assert.match(
        get(x, 'aria-label') ?? '',
        /^Удалить .+$/,
        point + ' localized Native remove label'
      );
      x = x.filter(([key]) => key !== 'aria-label');
      drop('aria-hidden', undefined);
      drop('unselectable', undefined);
      drop('aria-hidden', 'true', true);
      drop('unselectable', 'on', true);
      const sourceStyle = declarations(get(y, 'style') ?? '');
      assert.deepEqual(sourceStyle.slice(0, 2), [
        { property: 'user-select', value: 'none', priority: '' },
        { property: '-webkit-user-select', value: 'none', priority: '' }
      ], point + ' original fixed nonselectable span declarations');
      const remainder = sourceStyle.slice(2).map(p => `${p.property}:${p.value}${p.priority}`).join(';');
      y = y.flatMap(([key, value]) => key === 'style' ? remainder ? [[key, remainder]] : [] : [[key, value]]);
    }
    else if (hasFeedback) {
      assert.deepEqual(x, [['data-form-feedback-glyph', ''], ['class', 'anticon anticon-close-circle'], ['role', 'img'], ['aria-label', 'close-circle']],
        point + ' fixed Native feedback glyph');
      assert.deepEqual(
        y,
        [['role', 'img'], ['aria-label', 'close-circle'], ['class', 'anticon anticon-close-circle']],
        point + ' fixed Source feedback glyph'
      );
      x = y;
    }
    else if (feedbackSVG) {
      verifyFeedbackSVGAttributes(x, y, point);
      x = y;
    }
    if (metadata && (is('ant-select-suffix') || is('ant-select-selection-item-remove'))) {
      assert.equal(
        get(y, 'data-ant-native-select-style-ssr'),
        undefined,
        point + ' Source has no Native SSR style marker'
      );
      assert.equal(get(y, 'style'), is('ant-select-suffix') ? 'color:rgb(17,31,47)' : 'color:rgb(47,31,17)',
        point + ' complete fixed semantic style owns the SSR marker');
      drop('data-ant-native-select-style-ssr', '');
    }
    assert.equal(tag, b.tag, point + ' physical tag');
    if (a.attributes.some(([key]) => key === 'data-select-icons-node')) {
      assert.deepEqual(declarations(get(y, 'style') ?? '').map(p => p.property), ['display', 'width', 'height', 'line-height', 'font-size'],
        point + ' fixed complete authored icon styles');
      assert.deepEqual(
        declarations(get(x, 'style') ?? ''),
        declarations(get(y, 'style') ?? ''),
        point + ' complete ordered authored declarations'
      );
      x = x.map(([key, value]) => [key, key === 'style' ? get(y, 'style')! : value]);
    }
    if (wrapper) {
      assert.deepEqual(
        Object.fromEntries(x),
        Object.fromEntries(y),
        point + ' complete physical-wrapper attributes'
      );
    }
    else {
      assert.deepEqual(x, y, point + ' complete attributes and order');
    }
    if (Object.hasOwn(b, 'text')) assert.equal(a.text, b.text, point + ' complete text');
    assert.equal(
      Object.hasOwn(a, 'children'),
      Object.hasOwn(b, 'children'),
      point + ' complete child descriptor'
    );
    if (b.children) {
      assert.equal(a.children?.length, b.children.length, point + ' every descendant');
      for (const [index, child] of b.children.entries()) {
        const other: SSRIconElement | string = a.children![index];
        if (typeof other === 'string' || typeof child === 'string') {
          assert.deepEqual(
            other,
            child,
            point + '/' + index + ' text'
          );
        }
        else {
          compare(other, child, point + '/' + index, hasFeedback);
        }
      }
    }
  };
  for (const key of ['authored', 'svg', 'affixes'] as const) {
    assert.equal(actual[key].length, source[key].length, label + '/' + key + ' all nodes');
    for (const [index, node] of source[key].entries()) {
      compare(actual[key][index] as SSRIconElement, node as SSRIconElement,
        label + '/' + key + index, key === 'svg' && actual.feedbackSVGIndices.includes(index));
    }
  }
}
export async function readNativeSelectIcons(page: Page): Promise<NativeIconPoint> {
  const dom = await page.evaluate(readSelectSurface), icons = await page.evaluate(readSelectIcons), topology = await page.evaluate(readNativeSurfaceTopology);
  const owner = await page.evaluate(() => {
    const detail = {} as { read?: () => NativeIconOwner };
    document.querySelector('[data-select-icons-fixture-command]')!.dispatchEvent(new CustomEvent(
      'selecticonscapture',
      { detail }
    ));
    if (!detail.read) {
      throw Error('Actual icon owner absent');
    }
    return detail.read();
  });
  return { dom, icons, topology, owner };
}
export async function settleNativeSelectIcons(page: Page) {
  let previous = '', stable = 0;
  for (let i = 0; i < 90; i++) {
    await drainSelectSurface(page);
    const current = await readNativeSelectIcons(page), next = JSON.stringify(current);
    stable = next === previous ? stable + 1 : 0;
    if (stable >= 3) {
      return current;
    }
    previous = next;
  }
  throw Error('Actual Native public icon owner, all raw ledgers and UI did not settle');
}
export function verifySelectIconPoint(
  actual: NativeIconPoint,
  source: IconPoint,
  repeat: IconPoint,
  entries: readonly [IconCase, IconCase],
  sample: SelectIconSample,
  label: string,
  identity = createIconIdentityLedger(),
  emptyCounterpart?: IconPoint,
  controlledCloseCalls?: readonly SelectSurfaceProducerCall[]
) {
  const failures: string[] = [];
  const check = (name: string, run: () => void) => {
    try {
    run();
  }
  catch (e) {
    failures.push(label + '/' + name + ': ' + String(e));
  }
  };
  const authoredProps = normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps);
  const defaultPopup = sample.control === 'select' && authoredProps.popupRender === undefined;
  const unmountedPopup = defaultPopup && source.dom.view.popup.present && !source.dom.view.popup.visible
    && !actual.dom.view.popup.present;
  const inSourcePopup = (node: SelectIconNode) => Boolean(source.icons.current.popup?.html.includes(node.html)
    && (node.tag.toLowerCase() === 'svg' || node.box && Object.values(node.box).every(value => value === 0)));
  const currentNodes = unmountedPopup ? source.icons.nodes.filter(node => !inSourcePopup(node)) : source.icons.nodes;
  let currentSVG = unmountedPopup ? source.icons.svg.filter(node => !inSourcePopup(node)) : source.icons.svg;
  const plainEmpty = Boolean(emptyCounterpart && source.dom.view.popup.visible
    && source.icons.current.popup?.html.includes('ant-empty-image'));
  const surface = plainEmpty ? emptyCounterpart!.dom : source.dom;
  if (plainEmpty) {
    // The documented plain Native empty UI has a complete public Original
    // notFoundContent counterpart. Its actual boxes and paint are compared;
    // the canonical rich Empty trajectory remains retained without changes.
    assert(!Object.hasOwn(authoredProps, 'notFoundContent'));
    assert.deepEqual(surface.view.popup.extras.map(node => node.text), ['Ничего не найдено']);
    assert.equal(surface.view.popup.visible, true);
    assert.equal(emptyCounterpart!.icons.current.popup!.html.includes('<svg'), false);
    const emptySVG = source.icons.svg.filter(node => source.icons.current.popup!.html.includes(node.html));
    assert.equal(emptySVG.length, 1);
    assert.deepEqual(
      emptySVG[0].attributes,
      [['width', '64'], ['height', '41'], ['viewBox', '0 0 64 41'], ['xmlns', 'http://www.w3.org/2000/svg']]
    );
    currentSVG = currentSVG.filter(node => node !== emptySVG[0]);
    assert.equal(emptyCounterpart!.icons.svg.length, currentSVG.length);
    for (const [index, node] of currentSVG.entries()) {
      const { identity: _canonicalIdentity, ...canonical } = node;
      const { identity: _counterpartIdentity, ...counterpart } = emptyCounterpart!.icons.svg[index];
      assert.deepEqual(
        counterpart,
        canonical,
        label + ' public empty content leaves every other SVG field unchanged'
      );
    }
  }
  if (unmountedPopup) {
    identity.releaseDefaultPopup(new Set([
      source.icons.current.popup!.identity, ...(source.icons.current.list ? [source.icons.current.list.identity] : []),
      ...source.icons.nodes.filter(inSourcePopup).map(node => node.identity), ...source.icons.svg.filter(inSourcePopup).map(node => node.identity)
    ]));
  }
  const boundary: IconBoundary = { control: sample.control, legacyClear: usesLegacyClear(
    source.owner,
    sample
  ),
    hiddenPopup: actual.dom.view.popup.present && source.dom.view.popup.present
      && !actual.dom.view.popup.visible && !source.dom.view.popup.visible,
    rootDisabled: actual.dom.view.editor.disabled && source.dom.view.editor.disabled
      && actual.icons.current.root?.classes.includes('ant-select-disabled') === true
      && source.icons.current.root?.classes.includes('ant-select-disabled') === true };
  const verifyNode = (node: SelectIconNode, original: SelectIconNode, nodeLabel: string) => verifyIconNode(node, original, nodeLabel,
    { ...boundary, removeLabel: original.classes.includes('ant-select-selection-item-remove')
      ? sourceRemoveLabel(original, source.icons.nodes) : undefined,
    feedbackSVG: node.tag.toLowerCase() === 'svg' && actual.icons.nodes.some(parent => parent.attributes.some(([key]) => key === 'data-form-feedback-glyph') && parent.html.includes(node.html)) });
  check('whole-public-owner', () => {
    assert.equal(actual.owner.alive, true);
    for (const key of ['settings', 'model', 'open', 'query', 'authoredProvider', 'authoredInnerProvider'] as const) {
      assert.deepEqual(
        actual.owner[key],
        source.owner[key],
        key
      );
    }
    assert.deepEqual(
      normalizedSelectSurfaceAuthoredProps(actual.owner.authoredProps),
      normalizedSelectSurfaceAuthoredProps(source.owner.authoredProps)
    );
    verifySelectSurfaceEventGraph(
      actual.owner.rawModel,
      source.owner.rawModel,
      label + ' complete model raw graph'
    );
    verifyIconGraph(
      actual.owner.rawAuthoredProps,
      source.owner.rawAuthoredProps,
      label + ' all raw authored props',
      actual.owner.nodeSpecifications,
      true
    );
    verifyIconGraph(
      actual.owner.rawAuthoredProvider,
      source.owner.rawAuthoredProvider,
      label + ' all raw provider props',
      actual.owner.nodeSpecifications
    );
    verifyIconGraph(
      actual.owner.rawAuthoredInnerProvider,
      source.owner.rawAuthoredInnerProvider,
      label + ' all raw inner provider props',
      actual.owner.nodeSpecifications
    );
  });
  check('all-public-events', () => {
    const expected = entries[0].events.slice(0, source.owner.eventCount).map(selectSurfaceEventValue);
    const rawExpected = entries[0].rawEvents.slice(0, source.owner.rawEventCount);
    const closures = actual.owner.nativeRemountClosures ?? [];
    for (const closure of closures) {
      assert.equal(
        sample.id,
        'select-icons-nested-provider',
        label + ' only the focused provider owner remounts'
      );
      assert(Number.isInteger(closure.actionIndex) && closure.actionIndex >= 0);
      const step = entries[0].steps[closure.actionIndex], previous = closure.actionIndex
        ? entries[0].steps[closure.actionIndex - 1] : entries[0].initial;
      assert.equal(step.action.type, 'inner');
      assert.notEqual(step.icons.current.root!.identity, previous.icons.current.root!.identity,
        label + ' Original provider insertion also replaces the physical control');
      assert.equal(
        previous.icons.current.editor!.focused,
        true,
        label + ' committed retiring editor was focused'
      );
      const hasInner = (owner: IconOwner) => {
        const settings = decodeSelectSurface(owner.settings) as { inner?: unknown };
        return settings.inner !== undefined && settings.inner !== 'omitted';
      };
      assert.equal(closure.before, hasInner(previous.owner));
      assert.equal(closure.after, hasInner(step.owner));
      assert.notEqual(closure.before, closure.after);
      assert.equal(closure.wasFocused, true);
      assert.equal(closure.connected, true);
      assert.equal(closure.eventIndex, closure.rawEventIndex);
      const closeIndex = entries[0].events.findIndex(event => {
        const value = decodeSelectSurface(event);
        return Array.isArray(value) && value.length === 2 && value[0] === 'open' && value[1] === false;
      });
      assert(
        closeIndex >= 0,
        label + ' unchanged Original contains the same full public close payload'
      );
      expected.splice(closure.eventIndex, 0, selectSurfaceEventValue(entries[0].events[closeIndex]));
      rawExpected.splice(closure.rawEventIndex, 0, entries[0].rawEvents[closeIndex]);
    }
    assert.deepEqual(actual.owner.events.map(selectSurfaceEventValue), expected);
    assert.equal(actual.owner.rawEvents.length, rawExpected.length);
    for (const [i, event] of actual.owner.rawEvents.entries()) {
      verifySelectSurfaceEventGraph(
        event,
        rawExpected[i],
        label + '/event' + i
      );
    }
    assert.deepEqual(
      actual.owner.lifecycle,
      entries[0].lifecycle.slice(0, source.owner.lifecycleCount)
    );
  });
  check('all-producers-both-repetitions', () => verifyIconCalls(actual.owner.calls,
    controlledCloseCalls ? [controlledCloseCalls] : [entries[0].producerCalls.slice(
      0,
      source.owner.producerCount
    ),
      entries[1].producerCalls.slice(0, repeat.owner.producerCount)], label, actual.owner.nodeSpecifications));
  check('complete-public-surface', () => {
    assert.equal(nativeSelectPopupUnmounted(actual.dom, surface, sample.control, authoredProps), unmountedPopup,
      label + ' precise existing conditional default popup boundary');
    for (const [slot, nodes] of Object.entries(surface.view.slots)) {
      if (unmountedPopup && slot.startsWith('popup.')) {
        assert.equal(actual.dom.view.slots[slot].length, 0);
        continue;
      }
      assert.equal(actual.dom.view.slots[slot].length, nodes.length, label + '/' + slot + ' count');
      for (const [i, node] of nodes.entries()) {
        if (slot === 'suffix') {
          assert(
            source.icons.current.suffix && actual.icons.current.suffix,
            label + ' physical suffix exists'
          );
          // The shared surface helper fixes Select's SPAN wrapper for both
          // controls. The icon reader checks this actual suffix more completely,
          // including AC's preserved DIV and Source inline-child paint.
          verifyNode(
            actual.icons.current.suffix,
            source.icons.current.suffix,
            label + '/suffix-surface' + i
          );
          continue;
        }
        let current = actual.dom.view.slots[slot][i];
        if (slot === 'itemRemove') {
          const name = current.attributes.find(([key]) => key === 'aria-label')?.[1];
          assert.match(name ?? '', /^Удалить .+$/, label + ' retained localized remove name');
          current = { ...current, attributes: current.attributes.map(([key, value]) =>
            [key, key === 'aria-label' ? value.replace(/^Удалить /, 'Remove ') : value]) };
        }
        else if (slot === 'clear' && boundary.legacyClear) {
          assert.equal(current.attributes.find(([key]) => key === 'aria-label')?.[1], 'Очистить');
          current = {
            ...current,
            attributes: current.attributes.map(([key, value]) => [key, key === 'aria-label' ? 'Clear' : value])
          };
        }
        verifySelectSurfaceNode(current, node, slot,
          { control: sample.control, mode: sample.settings.mode }, ['surface-control'], label + '/' + i,
          surface.raw.slots[slot][i].attributes.find(([name]) => name === 'style')?.[1] ?? '',
          {
            callerLabel: 'Icon value',
            inputLayout: actual.topology.editorLayout,
            raw: actual.dom.raw.slots[slot][i]
          });
      }
    }
    let editor = surface.view.editor;
    if (sample.control === 'select' && !sample.settings.mode && (editor.expanded === 'false' || editor.readonly)) {
      assert.equal(editor.value, '', label + ' original empty single editor');
      assert.deepEqual(editor.caret, [0, 0]);
      const model = decodeSelectSurface(source.owner.model);
      const text = typeof model === 'string' || typeof model === 'number' ? surface.view.slots.content[0]?.text ?? '' : '';
      editor = { ...editor, value: text, caret: [text.length, text.length] };
    }
    assert.deepEqual(
      actual.dom.view.editor,
      editor,
      label + ' existing scalar editor/caret boundary'
    );
    assert.equal(actual.dom.view.focus, surface.view.focus);
    assert.deepEqual(actual.dom.view.leaks, []);
    assert.equal(actual.dom.view.popup.present, unmountedPopup ? false : surface.view.popup.present);
    assert.equal(actual.dom.view.popup.visible, surface.view.popup.visible);
    assert.equal(
      actual.dom.view.popup.extras.length,
      unmountedPopup ? 0 : surface.view.popup.extras.length
    );
    for (const [i, node] of (unmountedPopup ? [] : surface.view.popup.extras).entries()) {
      verifySelectSurfaceNode(actual.dom.view.popup.extras[i], node, 'extra',
        { control: sample.control }, [], label + '/extra' + i, surface.raw.extras[i].attributes.find(([name]) => name === 'style')?.[1] ?? '',
        { callerLabel: 'Icon value', raw: actual.dom.raw.extras[i] });
    }
  });
  check('all-current-ref-identities', () => {
    const original = { ...source.icons.sameAsOriginal };
    if (defaultPopup) {
      for (const key of ['popup', 'list'] as const) {
        const first = actual.icons.original[key], current = actual.icons.current[key];
        original[key] = first ? current?.identity === first.identity : null;
        if (first && first.identity !== current?.identity) {
          assert.equal(
            first.connected,
            false,
            label + ' old default popup disconnected'
          );
        }
      }
    }
    assert.deepEqual(actual.icons.sameAsOriginal, original);
    assert.equal(actual.icons.publicRefs.rootMatches, false);
    assert.equal(source.icons.publicRefs.rootMatches, true);
    assert.equal(actual.icons.publicRefs.authoredRoot, source.icons.publicRefs.authoredRoot);
    assert.equal(actual.icons.publicRefs.authoredInput, source.icons.publicRefs.authoredInput);
    for (const [key, node] of Object.entries(source.icons.current)) {
      const current = actual.icons.current[key as keyof typeof actual.icons.current];
      if (unmountedPopup && (key === 'popup' || key === 'list')) {
        assert.equal(current, null);
        continue;
      }
      assert.equal(Boolean(current), Boolean(node), label + '/' + key + ' present');
      assert.equal(current?.connected ?? null, node?.connected ?? null);
      identity(current, node, label + '/' + key);
      if (!defaultPopup || key !== 'popup' && key !== 'list') {
        identity(
          actual.icons.original[key as keyof typeof actual.icons.current],
          source.icons.original[key as keyof typeof source.icons.current],
          label + '/original-' + key
        );
      }
    }
    for (const key of ['focus', 'blur', 'scrollTo']) {
      assert.equal(
        actual.icons.publicRefs.methods?.[key],
        source.icons.publicRefs.methods?.[key]
      );
    }
  });
  check('all-authored-icon-nodes', () => {
    const authored = (nodes: SelectIconNode[]) => nodes.filter(n => n.attributes.some(([name]) => name === 'data-select-icons-node'));
    const x = authored(actual.icons.nodes), y = authored(currentNodes);
    assert.equal(x.length, y.length);
    for (const [i, node] of y.entries()) {
      verifyNode(x[i], node, label + '/authored' + i);
      identity(x[i], node, label + '/authored' + i);
    }
  });
  check('observed-root-icon-attributes', () => {
    const names = new Set(['suffix', 'suffixicon', 'loadingicon', 'menuitemselectedicon', 'removeicon']);
    const observed = (node: SelectIconNode | null) => node?.attributes.filter(([key]) => names.has(key.toLowerCase())) ?? [];
    assert.deepEqual(
      observed(actual.icons.current.root),
      observed(source.icons.current.root),
      label + ' literal Source root icon attributes'
    );
  });
  check('all-icon-wrappers-and-svg', () => {
    assert.equal(
      actual.icons.nodes.length,
      currentNodes.length,
      label + ' complete icon/option/tag/wrapper count'
    );
    for (const [i, node] of currentNodes.entries()) {
      verifyNode(actual.icons.nodes[i], node, label + '/node' + i);
      identity(actual.icons.nodes[i], node, label + '/node' + i);
    }
    assert.equal(actual.icons.svg.length, currentSVG.length, label + ' complete SVG count');
    for (const [i, node] of currentSVG.entries()) {
      verifyNode(actual.icons.svg[i], node, label + '/svg' + i);
      identity(actual.icons.svg[i], node, label + '/svg' + i);
    }
    for (const key of ['suffix', 'clear'] as const) {
      const x = actual.icons.current[key], y = source.icons.current[key];
      assert.equal(Boolean(x), Boolean(y));
      if (x && y) verifyNode(x, y, label + '/' + key);
    }
  });
  return failures;
}
