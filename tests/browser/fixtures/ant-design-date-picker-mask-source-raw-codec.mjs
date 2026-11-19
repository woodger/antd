/** Authored identity roles are declared by each framework adapter before observations. */
export function createSelectSurfaceRecorder() {
  const roles = new Map(), identities = new WeakMap();
  let nextIdentity = 0;
  const key = value => typeof value === 'symbol' ? { symbol: Symbol.keyFor(value) ?? null, description: value.description } : value;
  const id = value => {
    if (!identities.has(value)) identities.set(value, ++nextIdentity);
    return identities.get(value);
  };
  const scalar = value => value === undefined ? { $: 'undefined' }
    : typeof value === 'number' && !Number.isFinite(value) ? { $: 'number', value: String(value) }
    : typeof value === 'symbol' ? { $: 'symbol', ...key(value) }
    : typeof value === 'bigint' ? { $: 'bigint', value: String(value) } : value;
  const own = value => Reflect.ownKeys(value).map(name => {
    const d = Object.getOwnPropertyDescriptor(value, name);
    return { key: key(name), enumerable: d.enumerable, configurable: d.configurable,
      ...('value' in d ? { writable: d.writable, kind: 'value', valueType: typeof d.value }
        : { kind: 'accessor', get: Boolean(d.get), set: Boolean(d.set) }) };
  });
  const encode = value => {
    const seen = new Map();
    function walk(item) {
      if (item === null || !['object', 'function'].includes(typeof item)) return scalar(item);
      if (roles.has(item)) return { $: 'authored', role: roles.get(item) };
      if (typeof Node !== 'undefined' && item instanceof Node) return { $: 'dom-node',
        nodeType: item.nodeType, nodeName: item.nodeName,
        attributes: item.nodeType === 1 ? [...item.attributes].map(attr => [attr.name, attr.value]) : null };
      if (seen.has(item)) return { $: 'alias', index: seen.get(item) };
      seen.set(item, seen.size);
      if (typeof item === 'function') return { $: 'function', name: Object.getOwnPropertyDescriptor(item, 'name')?.value ?? '', own: own(item) };
      const properties = Reflect.ownKeys(item).map(name => {
        const d = Object.getOwnPropertyDescriptor(item, name);
        return { key: key(name), ...('value' in d ? { value: walk(d.value) }
          : { accessor: { get: d.get ? walk(d.get) : null, set: d.set ? walk(d.set) : null } }) };
      });
      return { $: Array.isArray(item) ? 'array' : 'object', properties };
    }
    return walk(value);
  };
  const raw = value => {
    const seen = new Set(), objects = [];
    function walk(item, opaqueOwner = false) {
      if (item === null || !['object', 'function'].includes(typeof item)) return scalar(item);
      const identity = id(item);
      if (seen.has(item)) return { ref: identity };
      seen.add(item);
      const node = { id: identity, type: typeof item, array: Array.isArray(item),
        authoredRole: roles.has(item) ? roles.get(item) : null };
      objects.push(node);
      if (typeof Node !== 'undefined' && item instanceof Node) {
        node.opaque = 'dom-node'; node.nodeType = item.nodeType; node.nodeName = item.nodeName;
        node.attributes = item.nodeType === 1 ? [...item.attributes].map(attr => [attr.name, attr.value]) : null;
        return { ref: identity };
      }
      node.ownProperties = own(item);
      if (opaqueOwner) {
        node.opaque = 'private-react-owner';
        return { ref: identity };
      }
      node.properties = Reflect.ownKeys(item).map(name => {
        const d = Object.getOwnPropertyDescriptor(item, name);
        return { key: key(name), ...('value' in d ? { value: walk(d.value, name === '_owner') }
          : { get: d.get ? walk(d.get) : null, set: d.set ? walk(d.set) : null }) };
      });
      return { ref: identity };
    }
    return { root: walk(value), objects };
  };
  const calls = [];
  return { register(value, role) { roles.set(value, role); return value; }, encode, raw, own,
    identity: id, calls,
    record(kind, side, argument, result, extra = {}) {
      const call = { index: calls.length, kind, side, argument: encode(argument), result: encode(result),
        rawArgument: raw(argument), rawResult: raw(result), ...extra };
      calls.push(call); return result;
    } };
}
