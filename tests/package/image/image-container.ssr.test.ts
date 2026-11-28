import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-image-container-reference.json';
import ImageContainerFixtures from '../../browser/fixtures/ImageContainerFixtures.svelte';

describe('Image preview containers in SSR', () => {
  it('pins browser measurements to the official Ant Design archive', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js'
    });
  });

  for (const initialCase of ['provider', 'local-callback', 'group-provider']) {
    it(`defers the viewer and ${initialCase} getter until the browser even with controlled open`, () => {
      const { body } = render(ImageContainerFixtures, { props: { initialCase } });

      expect(body).toContain('alt="Container sample"');
      expect(body).toContain('aria-label="Image container calls">[]');
      expect(body).not.toContain('<dialog');
    });
  }
});
