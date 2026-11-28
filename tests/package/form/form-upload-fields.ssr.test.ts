import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-form-upload-fields-observation.json';
import FormUploadFieldsFixtures from '../../browser/fixtures/FormUploadFieldsFixtures.svelte';

it('renders Upload associations and descriptions from the public package during SSR', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  vi.useFakeTimers();
  try {
    const { body } = render(FormUploadFieldsFixtures);
    const labelled = body.match(/<input\b[^>]*\bname="labelled-file"[^>]*>/)?.[0];
    const display = body.match(/<input\b[^>]*\bname="display-file"[^>]*>/)?.[0];
    const id = labelled?.match(/\sid="([^"]+)"/)?.[1];
    const description = labelled?.match(/\saria-describedby="([^"]+)"/)?.[1]?.split(' ');

    expect(labelled).toContain('type="file"');
    expect(labelled).toContain('aria-required="true"');
    expect(id).toBeTruthy();
    expect(body).toContain(`for="${id}"`);
    expect(description).toHaveLength(2);
    expect(body).toContain(`id="${description?.[0]}"`);
    expect(body).toContain(`id="${description?.[1]}"`);
    expect(body).toContain('File instructions');
    expect(body).toContain('Maximum size');
    expect(display).toContain('type="file"');
    expect(display).not.toMatch(/\sid=/);
    expect(vi.getTimerCount()).toBe(0);
  }
  finally {
    vi.useRealTimers();
  }
});
