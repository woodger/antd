import assert from 'node:assert/strict';
import { readSelectComponentsModesKeyedCase } from './select-components-modes-keyed-reference';
import { verifySelectComponentsModesKeyedSourcePair } from './select-components-modes-keyed-source-proof';
import type { ModesCase, ModesPoint } from './select-components-modes-reference';
import type { SelectComponentsModesDOM, SelectComponentsModesNode } from './select-components-modes-metrics.mjs';
const checked = new WeakSet<ModesCase>();
const tagsOwners = new Set(['select-components-modes-tags-intrinsic-input',
  'select-components-modes-tags-function-textarea', 'select-components-modes-tags-element-textarea']);
/** Source-only selection: never reads Native output and never creates DOM/CSS
 * values. Both complete independent Source points remain available to traces. */
export function selectComponentsModesPopupSource(point: ModesPoint, owner: ModesCase) {
  if (!tagsOwners.has(owner.id)) return undefined;
  const index = point === owner.initial ? -1 : owner.steps.indexOf(point as ModesCase['steps'][number]);
  assert(index >= -1);
  assert(index >= 0 || point === owner.initial);
  if (index < 2) return undefined;
  assert.deepEqual(owner.steps[2].action, { type: 'component-key', key: 'Enter' });
  const originalRows = point.icons.nodes.filter(node => node.classes.includes('ant-select-item-option'));
  const attribute = (node: SelectComponentsModesNode, key: string) => node.attributes.find(([name]) => name === key)?.[1];
  const number = originalRows.filter(node => node.text === 'Number one'), string = originalRows.filter(node => node.text === 'String one');
  assert.equal(number.length, 2, 'the exact measured stale numeric option is present');
  assert.equal(string.length, 1);
  assert.deepEqual(
    number.map(node => attribute(node, 'id')),
    ['select-icons-field_list_2', 'select-icons-field_list_1']
  );
  assert.equal(
    attribute(string[0], 'id'),
    'select-icons-field_list_2',
    'the stale Number one shares String one list_2'
  );
  const counterpart = readSelectComponentsModesKeyedCase(owner.id);
  if (!checked.has(owner)) {
    verifySelectComponentsModesKeyedSourcePair(owner, counterpart);
    checked.add(owner);
  }
  const keyed = counterpart.steps[index];
  assert.deepEqual(keyed.action, owner.steps[index].action);
  const cleanRows = keyed.icons.nodes.filter(node => node.classes.includes('ant-select-item-option'));
  assert.equal(cleanRows.length, originalRows.length - 1);
  assert.equal(cleanRows.filter(node => node.text === 'Number one').length, 1);
  assert.equal(cleanRows.filter(node => node.text === 'String one').length, 1);
  const cleanIds = cleanRows.map(node => attribute(node, 'id'));
  assert.equal(new Set(cleanIds).size, cleanIds.length);
  const popupView = (dom: SelectComponentsModesDOM, values: SelectComponentsModesNode[]) => {
    assert(dom.current.popup);
    const rootIds = new Set(dom.layout.map(node => node.identity));
    const root: SelectComponentsModesNode[] = [], popup: SelectComponentsModesNode[] = [];
    let insidePopup = false;
    for (const node of values) if (rootIds.has(node.identity)) {
      assert.equal(insidePopup, false, 'the frozen root nodes precede the external Source portal');
      root.push(node);
    }
    else {
      assert(
        dom.current.popup.html.includes(node.html),
        'only actual Source popup descendants use this view'
      );
      insidePopup = true;
      popup.push(node);
    }
    return { root, popup };
  };
  const originalNodes = popupView(point.icons, point.icons.nodes), cleanNodes = popupView(
    keyed.icons,
    keyed.icons.nodes
  );
  const originalSVG = popupView(point.icons, point.icons.svg), cleanSVG = popupView(
    keyed.icons,
    keyed.icons.svg
  );
  // Original root nodes remain the very same objects; every popup node comes
  // directly from the independent clean capture, including all CSS/boxes/HTML.
  return { name: 'React-key-collision/Native-typed-distinct-keys' as const, canonical: point, keyed,
    nodes: [...originalNodes.root, ...cleanNodes.popup], svg: [...originalSVG.root, ...cleanSVG.popup],
    popupNodes: new Set(cleanNodes.popup), popupSVG: new Set(cleanSVG.popup) };
}
