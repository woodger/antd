import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';
import { selectComponentsModesSamples, readSelectComponentsModesCase, readSelectComponentsModesSSR } from '../browser/select-components-modes-reference';
import { readSelectComponentsModesKeyedCase, readSelectComponentsModesKeyedSSR, readSelectComponentsModesKeyedSource } from '../browser/select-components-modes-keyed-reference';
import { verifySelectComponentsModesKeyedSourcePair } from '../browser/select-components-modes-keyed-source-proof';
import { selectComponentsModesPopupSource } from '../browser/select-components-modes-key-collision';
for (const sample of selectComponentsModesSamples) it(`proves independent Original keyed counterpart ${sample.id}`, () => {
  const proof = verifySelectComponentsModesKeyedSourcePair(
    readSelectComponentsModesCase(sample.id),
    readSelectComponentsModesKeyedCase(sample.id)
  );

  expect(proof.controlPoints).toBe(sample.actions.length + 1);
  expect(proof.descendantIdentityPairs).toBe(38);
});
it('preserves all six diagnostics and all29 complete Original SSR HTML bytes with explicit option keys', () => {
  const current = readSelectComponentsModesKeyedSource();

  expect(current.reference.diagnostics).toHaveLength(6);
  const original = readSelectComponentsModesSSR().normal, keyed = readSelectComponentsModesKeyedSSR();
  const hash = (value: string) => createHash('sha256').update(value).digest('hex');
  let count = 0;
  for (const [index, owner] of original.cases.entries()) {
    expect(keyed.cases[index].id).toBe(owner.id);
    for (const [ordinal, state] of owner.states.entries()) {
      const counterpart = keyed.cases[index].states[ordinal];
      expect(counterpart.name).toBe(state.name);
      expect(counterpart.rawHtml).toBe(state.rawHtml);
      expect(hash(counterpart.rawHtml)).toBe(hash(state.rawHtml));
      expect(counterpart.resources).toEqual(state.resources);
      count++;
    }
  }
  expect(count).toBe(29);
});
it('gates only27 captured stale-popup points and retains direct canonical/keyed Source objects across all78 points', () => {
  let points = 0, collisions = 0, untouched = 0, tagsPrefix = 0, multiple = 0;
  for (const sample of selectComponentsModesSamples) {
    const original = readSelectComponentsModesCase(sample.id), keyed = readSelectComponentsModesKeyedCase(sample.id);
    for (const [index, point] of [original.initial, ...original.steps].entries()) {
      points++;
      const view = selectComponentsModesPopupSource(point, original), tags = sample.settings.mode === 'tags';
      if (!tags || index < 3) {
        expect(view).toBeUndefined();
        untouched++;
        if (tags) tagsPrefix++; else multiple++;
        continue;
      }
      expect(view).toBeTruthy();
      collisions++;
      expect(view!.name).toBe('React-key-collision/Native-typed-distinct-keys');
      expect(view!.canonical).toBe(point);
      expect(view!.keyed).toBe(keyed.steps[index - 1]);
      const originalRootIds = new Set(point.icons.layout.map(node => node.identity));
      const keyedRootIds = new Set(view!.keyed.icons.layout.map(node => node.identity));
      for (const key of ['nodes', 'svg'] as const) {
        const root = point.icons[key].filter(node => originalRootIds.has(node.identity));
        const popup = view!.keyed.icons[key].filter(node => !keyedRootIds.has(node.identity));
        const actual = view![key], popupSet = key === 'nodes' ? view!.popupNodes : view!.popupSVG;
        expect(actual).toHaveLength(root.length + popup.length);
        expect(actual.slice(0, root.length).every((node, ordinal) => node === root[ordinal])).toBe(true);
        expect(actual.slice(root.length).every((node, ordinal) => node === popup[ordinal])).toBe(true);
        expect([...popupSet].every((node, ordinal) => node === popup[ordinal])).toBe(true);
        expect(popupSet.size).toBe(popup.length);
      }
    }
  }
  expect({ points, collisions, untouched, tagsPrefix, multiple }).toEqual({
    points: 78,
    collisions: 27,
    untouched: 51,
    tagsPrefix: 9,
    multiple: 42
  });
});
