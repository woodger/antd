import type { ComponentProps } from 'svelte';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import FormHostFixtures from '../../browser/fixtures/FormHostFixtures.svelte';
import observation from '../../browser/fixtures/ant-design-form-host-observation.json';
import registry from '../../porting-registry';

const cases = {
  named: {},
  customId: { formAttributes: { id: 'given' } },
  emptyId: { formAttributes: { id: '' } },
  nullId: { formAttributes: { id: null } },
  undefinedId: { formAttributes: { id: undefined } },
  unwrapped: { initialHost: 'bare' },
  tag: { initialHost: 'section' },
  custom: { initialHost: 'custom' },
  render: { initialHost: 'section', initialRender: true },
  empty: { includeField: false }
} as const satisfies Record<keyof typeof observation.ssr, ComponentProps<typeof FormHostFixtures>>;

function attribute(node: string | undefined, name: string): string | null {
  return node?.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null;
}

describe('Form host SSR', () => {
  it('records the independently measured source revision and runtime', () => {
    expect(observation.upstream).toMatchObject({
      version: registry.upstream.version, revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256, reactVersion: '18.3.1'
    });
  });

  it.each(Object.entries(cases))('renders the %s host and keeps field associations', (name, props) => {
    const expected = observation.ssr[name as keyof typeof cases];
    const body = render(FormHostFixtures, { props }).body.replace(/<!--[\s\S]*?-->/g, '');
    const root = body.match(/<([a-z]+)\b([^>]*\sdata-owner="root"[^>]*)>/);
    const input = body.match(/<input\b[^>]*\sdata-editor(?==|\s|>)[^>]*>/)?.[0];

    expect(root?.[1].toUpperCase() ?? null).toBe(expected.tag);
    expect(attribute(root?.[2], 'id')).toBe(expected.id);
    expect(attribute(root?.[2], 'name')).toBe(expected.tag ? 'named-owner' : null);
    expect(attribute(input, 'value')).toBe(expected.value);
    if (input) {
      const id = attribute(input, 'id');
      expect(id).toMatch(/^ant-field-/);
      expect(body).toContain(`for="${id}"`);
    }
    expect(root?.[0] ?? '').not.toMatch(/\b(?:nativeElement|render|ref|children)=/);

    if ('rendered' in expected) {
      const { values, word } = JSON.parse(expected.rendered);
      expect(body).toContain(`<output id="root-value">${JSON.stringify(values)}</output>`);
      expect(body).toContain(`<output id="render-model-word">${word}</output>`);
      expect(body).toContain('<output id="render-handle-bound">false</output>');
    }
  });
});
