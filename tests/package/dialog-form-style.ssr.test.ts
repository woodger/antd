import registry from '@woodger/antd/porting/registry.json';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import reference from '../browser/fixtures/ant-design-dialog-form-style-reference.json';
import DialogFormStyleFixtures from '../browser/fixtures/DialogFormStyleFixtures.svelte';

it('uses the pinned Ant Design archive for dialog style boundaries', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
});

for (const component of ['drawer', 'modal'] as const) {
  it(`renders only the owner and local Form.Item feedback when rendering ${component} on the server`, () => {
    const { body } = render(DialogFormStyleFixtures, { props: { component, initial: true } });
    const feedback = body.match(/<span[^>]*class="[^"]*\bant-form-item-feedback-icon\b/g);
    const status = body.match(/data-form-status-read="dialog-style">([^<]+)</)?.[1];

    expect(feedback).toHaveLength(4);
    expect(status).toBe('{"status":null,"errors":[],"warnings":[]}');
    expect(body).toContain('id="dialog-value"');
  });

  it(`keeps outer Form.Item messages inside ${component} while clearing its visible status`, () => {
    const props = { component, initial: true, messages: true };
    const { body } = render(DialogFormStyleFixtures, { props });
    const owner = body.match(/data-form-status-read="owner-style">([^<]+)</)?.[1];
    const status = body.match(/data-form-status-read="dialog-style">([^<]+)</)?.[1];

    expect(owner).toBe('{"status":"error","errors":["Invalid"],"warnings":["Check"]}');
    expect(status).toBe('{"status":null,"errors":["Invalid"],"warnings":["Check"]}');
  });
}
