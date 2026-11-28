import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-image-action-icons-reference.json';
import ImageActionIconsFixtures from '../../browser/fixtures/ImageActionIconsFixtures.svelte';

describe('Image preview icons in SSR', () => {
  it('binds the render-info measurements to the pinned React archive', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js',
      rcImage: '1.10.0'
    });
  });

  it('makes the effective artwork available to semantic resolvers before the viewer mounts', () => {
    const { body } = render(ImageActionIconsFixtures, { props: { initialCase: 'single' } });

    expect(body).toContain('semantic-preview-icon-zoomIn');
    expect(body).toContain('builtin-zoom-icon');
    expect(body).not.toContain('supplied-zoom-icon');
    expect(body).not.toContain('data-reference-toolbar');
    expect(body).not.toContain('<dialog');
  });
});
