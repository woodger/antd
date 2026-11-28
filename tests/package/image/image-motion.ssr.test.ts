import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import registry from '../../porting-registry';
import ImageMotionFixtures from '../../browser/fixtures/ImageMotionFixtures.svelte';
import reference from '../../browser/fixtures/ant-design-image-motion-reference.json';

describe('Image preview motion in SSR', () => {
  it('uses measurements bound to the pinned React release', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js',
      rcImage: '1.10.0'
    });
  });

  it('exposes the CSS motion name to semantic resolvers and defers even an initially open preview', () => {
    const { body } = render(ImageMotionFixtures, { props: { initialCase: 'custom' } });

    expect(body).toContain('fixture-motion:photo-motion');
    expect(body).toContain('alt="Motion sample"');
    expect(body).toContain('aria-label="Preview completions">[]');
    expect(body).not.toContain('<dialog');
  });
});
