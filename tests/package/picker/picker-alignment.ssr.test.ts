import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import registry from '../../porting-registry';
import PickerAlignmentFixtures from '../../browser/fixtures/PickerAlignmentFixtures.svelte';
import reference from '../../browser/fixtures/ant-design-picker-alignment-reference.json';

describe('Picker popup alignment from the public package', () => {
  it('pins the browser observations to the catalog release and source archive', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      repeated: 2
    });
  });

  for (const { sample } of reference.cases) {
    it(`keeps popup geometry options out of the SSR editor for ${sample.id}`, () => {
      const { body } = render(PickerAlignmentFixtures, { props: { preset: sample.id } });

      expect(body).toContain('id="start"');
      expect(body).toContain('aria-expanded="true"');
      expect(body).not.toMatch(/\s(popupalign|builtinplacements)=/i);
    });
  }
});
