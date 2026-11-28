import { render } from 'svelte/server';
import { expect, it, vi } from 'vitest';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-form-rich-validation-reference.json';
import FormRichValidationFixtures from '../../browser/fixtures/FormRichValidationFixtures.svelte';

it('compares rich messages against the pinned Form reference', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256
  });
  expect(reference.quiet[0]?.errors[0]).toMatchObject({ type: 'strong', text: 'Enter a name' });
  expect(reference.seen.child.itemMarkers).toEqual([['A', 'rich-child']]);
  expect(reference.external.name.markers).toEqual([
    ['SPAN', 'rich-external'], ['EM', 'rich-warning']
  ]);
});

it('server renders rich errors, warnings and list messages with accessible descriptions', () => {
  vi.useFakeTimers();
  try {
    const { body } = render(FormRichValidationFixtures, { props: { initialMessages: true } });
    const html = body.replace(/<!--[\s\S]*?-->/g, '');
    const name = html.match(/<input[^>]*\sname="name"[^>]*>/)?.[0];
    const child = html.match(/<input[^>]*\sname="child"[^>]*>/)?.[0];
    const nameDescription = name?.match(/\saria-describedby="([^"]+)"/)?.[1];
    const childDescription = child?.match(/\saria-describedby="([^"]+)"/)?.[1];

    expect(nameDescription).toBeTruthy();
    expect(childDescription).toBeTruthy();
    expect(name).toContain('aria-invalid="true"');
    expect(child).toContain('aria-invalid="true"');
    expect(html).toContain(`id="${nameDescription}" role="alert"`);
    expect(html).toContain(`id="${childDescription}" role="alert"`);
    expect(html).toContain('<strong data-message="rich-error">Enter a name</strong>');
    expect(html).toContain('<em data-message="rich-warning">Keep it concise</em>');
    expect(html).toContain('<a href="#details" data-message="rich-child">Read field details</a>');
    expect(html).toContain('<strong data-message="rich-list">Add at least one item</strong>');
    expect(html).toContain('data-rich-feedback');
    expect(vi.getTimerCount()).toBe(0);
  }
  finally {
    vi.useRealTimers();
  }
});
