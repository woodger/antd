import { render } from 'svelte/server';
import { describe, it, expect, vi } from 'vitest';
import { Image } from '@woodger/antd';
import ImageFixtures from '../../browser/fixtures/ImageFixtures.svelte';
import ImageSemanticFixtures from '../../browser/fixtures/ImageSemanticFixtures.svelte';

describe('Image SSR', () => {
  it(
    'renders a native preview button and image dimensions without rendering an open dialog on the server',
    () => {
      const body = render(
        Image,
        {
          props: {
            src: 'photo.svg',
            alt: 'Photo',
            width: 120,
            height: 80,
            preview: { open: true }
          }
        }
      ).body;

      expect(body).toContain('<button');
      expect(body).toContain('type="button"');
      expect(body).toContain('width:120px');
      expect(body).toContain('src="photo.svg"');
      expect(body).not.toContain('<dialog');
    }
  );
  it(
    'renders passive image semantics when preview is disabled and does not fetch or create timers in SSR',
    () => {
      vi.useFakeTimers();
      try {
        const body = render(Image, { props: { src: 'photo.svg', preview: false } }).body;
        expect(body).not.toContain('<button');
        expect(body).toContain('<img');
        expect(vi.getTimerCount()).toBe(0);
      } finally { vi.useRealTimers(); }
    }
  );
  it('keeps wrapper styles separate from the native image styles', () => {
    const body = render(Image, { props: {
      src: 'photo.svg', preview: false, width: 80, height: 40,
      styles: { root: 'width:72px;padding-top:7px' }, style: 'opacity:0.5'
    } }).body;
    const root = body.match(/<div[^>]*class="[^"]*ant-image[^>]*>/)![0];
    const image = body.match(/<img[^>]*>/)![0];

    expect(root).toContain('width:80px;height:40px;width:72px;padding-top:7px');
    expect(image).toContain('height:40px;opacity:0.5');
    expect(image).not.toContain('padding-top');
  });

  it('preserves placeholder snippets and lazy preview while rendering the fixture', () => {
    const body = render(ImageFixtures).body;

    expect(body).toContain('Image loading');
    expect(body.match(/Image loading/g)?.length).toBe(2);
    expect(body).not.toContain('ant-image-preview-actions-action');
  });

  it('renders progress in place of the thumbnail when an owner supplies a percentage', () => {
    const body = render(Image, { props: {
      src: 'photo.svg',
      width: 120,
      height: 80,
      preview: { open: true },
      placeholder: { progress: { percent: 32.6 } }
    } }).body;

    expect(body).toContain('ant-image-progress-wrapper');
    expect(body).toContain('width:120px;height:80px');
    expect(body).toContain('role="progressbar"');
    expect(body).toContain('aria-label="33%"');
    expect(body).toContain('aria-valuenow="33"');
    expect(body).toContain('--progress-percent:33%');
    expect(body).not.toContain('<img');
    expect(body).not.toContain('<dialog');
  });

  it('announces indeterminate progress through a polite status', () => {
    const body = render(Image, { props: { placeholder: { progress: true } } }).body;

    expect(body).toContain('aria-busy="true"');
    expect(body).toContain('role="status" aria-live="polite">Loading');
    expect(body).not.toContain('role="progressbar"');
    expect(body).not.toContain('ant-image-progress-rail');
  });

  it('renders the ordinary image when progress is explicitly disabled', () => {
    const body = render(Image, {
      props: { src: 'photo.svg', placeholder: { progress: false } }
    }).body;

    expect(body).toContain('<img');
    expect(body).toContain('src="photo.svg"');
    expect(body).not.toContain('ant-image-progress-wrapper');
  });

  it('applies Image provider and local semantics before the viewer mounts', () => {
    const { body } = render(ImageSemanticFixtures);

    expect(body).toMatch(/class="[^"]*provider-root single-root[^"]*"/);
    expect(body).toContain('--rank:provider-root;--provider-slot:yes;--rank:single-root');
    expect(body).toContain('single-base provider-base provider-image single-image');
    expect(body).toContain('provider-cover single-cover');
    expect(body).toContain('provider-progress single-progress');
    expect(body).not.toContain('<dialog');
  });
});
