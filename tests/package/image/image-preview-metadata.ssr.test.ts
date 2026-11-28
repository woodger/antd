import { ImagePreviewGroup } from '@woodger/antd';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import registry from '../../porting-registry';
import ImagePreviewMetadataFixtures from '../../browser/fixtures/ImagePreviewMetadataFixtures.svelte';
import reference from '../../browser/fixtures/ant-design-image-preview-metadata-reference.json';

describe('Image preview metadata in SSR', () => {
  it('binds the measured metadata to the pinned upstream archive', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js',
      rcImage: '1.10.0'
    });
  });

  it('renders the thumbnail metadata and defers the configured viewer', () => {
    const { body } = render(ImagePreviewMetadataFixtures, { props: { initialCase: 'single-override' } });

    expect(body).toContain('#thumbnail');
    expect(body).toContain('alt="Thumbnail label"');
    expect(body).not.toContain('#override');
    expect(body).not.toContain('alt="Viewer label"');
    expect(body).not.toContain('<dialog');
  });

  it('defers an open group even when its override supplies an image for an empty list', () => {
    const { body } = render(ImagePreviewGroup, {
      props: { items: [], preview: { open: true, src: '/preview.svg', alt: 'Group cover' } }
    });

    expect(body).not.toContain('/preview.svg');
    expect(body).not.toContain('Group cover');
    expect(body).not.toContain('<dialog');
  });
});
