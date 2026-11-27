import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';

// Allows the path to a local image relative to the module. Current working directory does not
// affect the result.
const fixture = name => new URL('./fixtures/' + name, import.meta.url);
// Returns SHA-256 in hexadecimal form for the reconciliation of the recorded data.
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const rawMetadata = fs.readFileSync(fixture('ant-design-date-picker-render-hooks-source-manifest.json'));
assert.equal(sha(rawMetadata), '4df99573380db77921cf00576aaaf04f66bee771315966792a0aa8f70d84aa1b');
const metadata = JSON.parse(rawMetadata);
assert.equal(metadata.sourceOnly, true);
assert.equal(metadata.NativeDataUsed, false);
const manifests = new Map();
const facts = new Map();
function decode(entry) {
  const stored = fs.readFileSync(fixture(entry.fixture));
  assert.equal(stored.length, entry.original.gzipBytes);
  assert.equal(sha(stored), entry.original.gzipSHA256);
  const raw = gunzipSync(stored);
  assert.equal(raw.length, entry.original.bytes);
  assert.equal(sha(raw), entry.original.sha256);
  return JSON.parse(raw);
}
export function readRenderHooksSourceManifest(kind, variant = 'first') {
  const key = kind + '-' + variant;
  assert(metadata.captures[key], 'Unknown complete Source capture');
  if (!manifests.has(key)) manifests.set(key, decode(metadata.captures[key]));
  return manifests.get(key);
}
export function readRenderHooksSourceCase(id, variant = 'first') {
  const row = readRenderHooksSourceManifest('csr', variant).cases.find(row => row.id === id);
  assert(row, 'Unknown Source renderer owner');
  return row;
}
export function readRenderHooksSourcePart(reference) {
  const original = reference.rawJSONPart ?? reference;
  const entry = metadata.parts[original.file];
  assert(entry, 'Missing whole original Source part');
  assert.deepEqual(entry.original, original);
  return decode(entry);
}
function rawProperty(graph, identity, key) {
  const node = graph.objects.find(node => node.id === identity);
  assert(node, 'Original object identity absent from its raw graph');
  const property = node.properties?.find(property => property.key === key);
  assert(property && Object.hasOwn(property, 'value'), 'Expected an original data property ' + key);
  return property.value;
}
function plain(graph, value, seen = new Map()) {
  if (value === null || typeof value !== 'object' || !Object.hasOwn(value, 'ref')) {
    return value;
  }
  if (seen.has(value.ref)) {
    return seen.get(value.ref);
  }
  const node = graph.objects.find(node => node.id === value.ref);
  assert(node, 'Original plain-value reference is absent');
  if (node.opaque || node.type === 'function') {
    return { $: node.opaque ?? 'function', identity: node.id, own: node.ownProperties ?? [] };
  }
  const result = node.array ? [] : {};
  seen.set(value.ref, result);
  for (const property of node.properties) {
    assert(typeof property.key === 'string' && Object.hasOwn(property, 'value'));
    result[property.key] = plain(graph, property.value, seen);
  }
  return result;
}
function elementShape(encoded, depth = 0) {
  const get = (value, key) => value?.properties?.find(property => property.key === key)?.value;
  const type = get(encoded, 'type');
  const props = get(encoded, 'props');
  if (!props) {
    return encoded;
  }
  const child = get(props, 'children');
  const children = child?.$ === 'array' ? child.properties.filter(property => /^\d+$/.test(property.key))
    .map(property => property.value) : child === undefined ? [] : [child];
  return { type: typeof type === 'string' ? type : { kind: type?.$, name: type?.name },
    propsOwnKeys: props.properties.map(property => property.key),
    className: get(props, 'className') ?? null,
    children: depth < 2 ? children.map(value => elementShape(value, depth + 1))
      : 'Whole descendant values retained in original raw argument graph.' };
}
// Looking for an attribute by name. The missing attribute remains null to compare images.
const attr = (node, name) => node.attributes.find(row => row[0] === name)?.[1] ?? null;
const hasClass = (node, name) => (attr(node, 'class') ?? '').split(' ').includes(name);
export function deriveRenderHooksSourceFacts(point, tape) {
  const locales = new Map();
  const today = new Map();
  const materializedCellSequences = point.markerSurfaces.flatMap(node => {
    const value = attr(node, 'data-hook-sequence');
    return value === null ? [] : [Number(value)];
  });
  const markerSequences = new Set(materializedCellSequences);
  assert.equal(markerSequences.size, materializedCellSequences.length);
  const cells = tape.rows.filter(row => row.kind === 'cell').map(row => {
    const localeID = row.info.localeIdentity;
    const localeNode = row.rawArguments.objects.find(node => node.id === localeID);
    assert(localeNode);
    if (!locales.has(localeID)) {
      locales.set(localeID, {
        identity: localeID, ownKeys: localeNode.ownProperties.map(property => property.key),
        plain: plain(row.rawArguments, { ref: localeID })
      });
    }
    const group = today.get(row.info.today.identity) ?? { identity: row.info.today.identity,
      temporal: row.info.today.temporal, types: [], subTypes: [], callSequences: [] };
    if (!group.types.includes(row.info.type)) group.types.push(row.info.type);
    if (row.info.subTypeOwn && !group.subTypes.includes(row.info.subType)) group.subTypes.push(row.info.subType);
    group.callSequences.push(row.sequence);
    today.set(group.identity, group);
    const origin = row.info.originNode.raw;
    const originID = origin.root.ref;
    const props = rawProperty(origin, originID, 'props');
    return { sequence: row.sequence, materializedMarker: markerSequences.has(row.sequence),
      current: row.current.kind === 'dayjs' ? { kind: 'dayjs', identity: row.current.value.identity,
        temporal: row.current.value.temporal, sameAsAuthored: row.current.value.sameAsAuthored }
        : row.current,
      ownKeys: row.info.ownKeys, own: row.info.own,
      type: row.info.type, subTypeOwn: row.info.subTypeOwn, subType: row.info.subType,
      rangeOwn: row.info.rangeOwn, range: row.info.range,
      prefixCls: row.info.prefixCls, localeIdentity: localeID,
      today: { identity: row.info.today.identity, temporal: row.info.today.temporal },
      origin: { identity: originID, ownKeys: row.info.originNode.ownKeys,
        type: plain(origin, rawProperty(origin, originID, 'type')),
        props: plain(origin, props) },
      returnedIsOrigin: row.returnedIsOrigin, returnedChildIsOrigin: row.returnedChildIsOrigin };
  });
  const surfaces = point.surfaces;
  const byID = new Map(surfaces.map(node => [node.identity, node]));
  const panelIDs = new Set(surfaces.filter(node => hasClass(node, 'ant-picker-panel')).map(node => node.identity));
  function insidePanel(node) {
    let parent = node.parentIdentity;
    while (byID.has(parent)) {
      if (panelIDs.has(parent)) {
        return true;
      }
      parent = byID.get(parent).parentIdentity;
    }
    return false;
  }
  const footer = surfaces.filter(node => hasClass(node, 'ant-picker-footer'));
  return {
    scope: 'Derived projection only; full original arguments and returns remain in linked raw parts.',
    actualHookRows: tape.rows.length,
    hookKinds: Object.fromEntries(['cell', 'panel', 'footer'].map(kind =>
      [kind, tape.rows.filter(row => row.kind === kind).length])),
    cells, materializedCellSequences,
    locales: [...locales.values()], todayGroups: [...today.values()],
    panelCalls: tape.rows.filter(row => row.kind === 'panel').map(row => ({
      sequence: row.sequence, strategy: row.strategy, actualArgumentCount: row.actualArgumentCount,
      receiver: row.receiver, originOwnKeys: row.originNode.ownKeys,
      originElement: elementShape(row.originNode.encoded),
      returnedIsOrigin: row.returnedIsOrigin, returnedChildrenContainOrigin: row.returnedChildrenContainOrigin })),
    footerCalls: tape.rows.filter(row => row.kind === 'footer').map(row => ({
      sequence: row.sequence, strategy: row.strategy, actualArgumentCount: row.actualArgumentCount,
      receiver: row.receiver, encodedArguments: row.encodedArguments,
      returnIsReactElement: row.returned.isValidElement, returnRoot: row.returned.raw.root })),
    owner: { open: point.owner.open, cell: point.owner.cell, panel: point.owner.panel,
      footer: point.owner.footer, revision: point.owner.revision, confirm: point.owner.confirm },
    inputValues: point.inputs.map(input => input.value),
    focusedField: point.inputs.findIndex(input => input.focused), focus: point.focus,
    renderedRangeValues: [...new Set(point.markerSurfaces.flatMap(node => {
      const value = attr(node, 'data-hook-range');
      return value === null ? [] : [value];
    }))],
    todayTitles: point.calendarCells.filter(node => hasClass(node, 'ant-picker-cell-today'))
      .map(node => attr(node, 'title')),
    layout: {
      panels: [...panelIDs],
      footer: footer.map(node => ({ identity: node.identity, parentIdentity: node.parentIdentity,
        parentClass: node.parentClass, insidePanel: insidePanel(node), text: node.text })),
      extraFooter: surfaces.filter(node => hasClass(node, 'ant-picker-footer-extra')).map(node => ({
        identity: node.identity, parentIdentity: node.parentIdentity,
        parentIsFooter: footer.some(parent => parent.identity === node.parentIdentity),
        text: node.text, childNodes: node.childNodes })),
      footerControls: point.footerSurfaces.filter(node => hasClass(node, 'ant-picker-now-btn')
        || hasClass(node, 'ant-picker-ok')).map(node => ({ tag: node.tag,
          text: node.text, attributes: node.attributes, parentIdentity: node.parentIdentity })),
      panelLayouts: surfaces.filter(node => hasClass(node, 'ant-picker-panel-layout'))
        .map(node => ({ identity: node.identity, parentIdentity: node.parentIdentity })),
      panelContainers: surfaces.filter(node => hasClass(node, 'ant-picker-panel-container'))
        .map(node => ({ identity: node.identity, parentIdentity: node.parentIdentity }))
    }
  };
}
function phaseIndex(row, phase) {
  const test = phase === 'firstwrap' ? action => action.type === 'owner-hooks' && action.value === true
    : phase === 'format-only' ? action => action.type === 'owner-clock'
      : phase === 'end-field' ? action => action.type === 'input-open' && action.index === 1
        : phase.startsWith('mode-') ? action => action.type === 'header' && action.selector === phase.slice(5)
          : phase === 'clock-repaint' ? action => action.type === phase
            : phase === 'need-confirm' ? action => action.type === 'owner-confirm'
              : phase.startsWith('panel-') ? action => action.type === 'owner-panel'
                && action.value === (phase === 'panel-empty' ? 'empty-fragment' : phase.slice(6))
                : phase.startsWith('footer-') ? action => action.type === 'owner-footer'
                  && action.value === (phase === 'footer-empty' ? 'empty-fragment' : phase.slice(7))
                  : null;
  assert(test, 'Unknown bounded Source phase');
  const index = row.sample.actions.findIndex(test);
  assert(index >= 0, 'Source owner has no declared phase ' + phase);
  return index;
}
export function readRenderHooksSourceFacts(id, phase = 'firstwrap', variant = 'first') {
  const key = [id, phase, variant].join('/');
  if (!facts.has(key)) {
    const row = readRenderHooksSourceCase(id, variant);
    const index = phaseIndex(row, phase);
    const pointPart = row.steps[index];
    const hooksPart = row.hookParts.find(part => part.rawJSONPart.file.endsWith(
      '/' + id + '-step-' + index + '-hooks.json'));
    assert(hooksPart);
    const point = readRenderHooksSourcePart(pointPart);
    const tape = readRenderHooksSourcePart(hooksPart);
    facts.set(key, { id, phase, variant, actionIndex: index, action: point.action,
      pointPart, hooksPart, ...deriveRenderHooksSourceFacts(point.actual, tape) });
  }
  return facts.get(key);
}
export function verifyRenderHooksSourceStoredParts() {
  for (const [file, blob] of Object.entries(metadata.blobs)) {
    const stored = fs.readFileSync(fixture(file));
    assert.equal(stored.length, blob.bytes);
    assert.equal(sha(stored), blob.sha256);
  }
  for (const document of Object.values(metadata.documents)) {
    const bytes = fs.readFileSync(fixture(document.fixture));
    assert.equal(bytes.length, document.bytes);
    assert.equal(sha(bytes), document.sha256);
  }
  return { sourceOnly: metadata.sourceOnly, captures: Object.keys(metadata.captures).length,
    originalParts: Object.keys(metadata.parts).length, blobs: Object.keys(metadata.blobs).length };
}

/** Plain bounded fixture projection; original graphs remain in the whole-byte parts. */
export function projectRenderHooksSourceFacts(value) {
  const bySequence = new Map(value.cells.map(cell => [cell.sequence, cell]));
  const cells = value.materializedCellSequences.map(sequence => {
    const cell = bySequence.get(sequence);
    assert(cell?.materializedMarker, 'Materialized DOM marker has no actual hook invocation');
    return cell;
  });
  const locales = new Set(cells.map(cell => cell.localeIdentity));
  const sequences = new Set(cells.map(cell => cell.sequence));
  return {
    actionIndex: value.actionIndex,
    action: value.action,
    pointPart: value.pointPart,
    hooksPart: value.hooksPart,
    cells: cells.map(cell => ({ sequence: cell.sequence, current: cell.current,
      ownKeys: cell.ownKeys, type: cell.type, subTypeOwn: cell.subTypeOwn, subType: cell.subType,
      rangeOwn: cell.rangeOwn, range: cell.range, prefixCls: cell.prefixCls,
      localeIdentity: cell.localeIdentity, today: cell.today })),
    locales: value.locales.filter(locale => locales.has(locale.identity)),
    todayGroups: value.todayGroups.map(group => ({ ...group,
      callSequences: group.callSequences.filter(sequence => sequences.has(sequence))
    })).filter(group => group.callSequences.length > 0),
    todayTitles: value.todayTitles
  };
}
