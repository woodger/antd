import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import type { FormItemProps } from '@woodger/antd';
import registry from '../../porting-registry';
import FormItemRowFixtures from '../../browser/fixtures/FormItemRowFixtures.svelte';
import reference from '../../browser/fixtures/ant-design-form-item-row-observation.json';

it('renders styled FormItem row attributes and grid settings in the public package', () => {
  const props: Pick<FormItemProps, 'align' | 'dir' | 'gutter' | 'wrap' | 'onclick' | 'aria-label'> = {
    align: { md: 'top' }, dir: 'auto', gutter: [4, 8], wrap: false,
    'aria-label': 'Label',
    onclick: (event) => { event.currentTarget.scrollTop = 0; }
  };
  expect(props.dir).toBe('auto');
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version, revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });

  const { body } = render(FormItemRowFixtures);
  const row = body.match(/<div\b[^>]*data-audit="initial"[^>]*>/)?.[0];
  const field = body.match(/<div\b[^>]*class="[^"]*\brow-observation\b[^"]*"[^>]*>/)?.[0];

  expect(row).toContain('class="ant-row');
  expect(row).toContain('role="group"');
  expect(row).toContain('aria-label="initial row"');
  expect(row).toContain('aria-hidden="true"');
  expect(row).toContain('title="Attachment"');
  expect(row).toContain('customtag="preserved"');
  expect(row).toContain('dir="ltr"');
  expect(row).toContain('margin-inline:-10px');
  expect(row).toContain('row-gap:6px');
  expect(field).toContain('item-root');
  expect(field).toContain('color:rgb(12, 34, 56)');
  expect(field).not.toContain('data-audit=');
  expect(body).not.toMatch(/legacy-row-id|caller-scope|\sfieldkey=|\slabelwrap=/i);
});
