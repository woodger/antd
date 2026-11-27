import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import { expect, it } from 'vitest';
import { Table } from '@woodger/antd';
import registry from '../porting-registry';
import Fixture from '../browser/fixtures/TableDomAttributesFixture.svelte';
import source from '../browser/fixtures/ant-design-table-dom-attributes-reference.json';
import {
  expectedTableDomAttributes, tableAriaNames, tableDataNames
} from '../browser/fixtures/table-dom-attributes-reference';

/** Reads one attribute from an opening tag in the server fixture. */
function attribute(tag: string, name: string) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] ?? null;
}

/** Retains missing attribute names to compare where those attributes appear. */
function attributes(tag: string, names: string[]) {
  return Object.fromEntries(names.map(name => [name, attribute(tag, name)]));
}

/** Finds the opening tag of one of the two Table containers. */
function part(markup: string, name: 'wrapper' | 'table') {
  const pattern = new RegExp(`<div\\b([^>]*\\sdata-ant-table-part="${name}"[^>]*)>`);
  return markup.match(pattern)?.[1] ?? '';
}

/** Reads the caption and nested markup before browser hydration. */
function caption(markup: string, prefix: string) {
  const match = markup.match(/<caption\b([^>]*)>([\s\S]*?)<\/caption>/);
  if (!match) {
    return null;
  }

  const [, tag, content] = match;
  const names = attribute(tag, 'class')?.split(' ');
  return {
    text: content.replace(/<[^>]*>/g, ''),
    class: names?.find(name => name === prefix + '-caption') ?? '',
    rich: content.match(/<([a-z]+)\b[^>]*\sdata-probe-caption=/)?.[1] ?? null
  };
}

it('pins the owner and caption observations to the supported archive', () => {
  const { version, revision, archiveSha256 } = registry.upstream;
  expect(source.reference).toMatchObject({
    version, revision, archiveSha256, tableVersion: '1.11.1', repeat: 2
  });
  expect(source.cases).toHaveLength(15);
});

for (const sample of source.cases) {
  const { profile } = sample;
  it(`renders the ${profile.id} owner, table and caption attributes on the server`, () => {
    const { body } = render(Fixture, { props: { profileId: profile.id } });
    const expected = expectedTableDomAttributes(sample, 'ssr');
    const owner = part(body, 'table');
    const outer = part(body, 'wrapper');
    const tables = Array.from(body.matchAll(/<table\b([^>]*)>([\s\S]*?)<\/table>/g),
      ([, tag, markup]) => ({
        aria: attributes(tag, tableAriaNames),
        data: attributes(tag, tableDataNames),
        id: attribute(tag, 'id'),
        customHeader: attribute(tag, 'data-probe-header') !== null,
        caption: caption(markup, profile.prefix ?? 'ant-table')
      }));

    expect({
      id: attribute(owner, 'id'), aria: attributes(owner, tableAriaNames),
      data: attributes(owner, tableDataNames)
    }).toEqual(expected.owner);
    expect({ id: attribute(outer, 'id'), data: attributes(outer, tableDataNames) })
      .toEqual(expected.outer);
    expect(tables).toEqual(expected.tables.map(({ band: _band, ...table }) => table));
    expect(body.includes('data-probe-custom-body=""')).toBe(expected.customBody);
  });
}

it('links the native scroll region to the caption snippet in the server response', () => {
  const richCaption = createRawSnippet(() => ({ render: () => '<strong>SSR report</strong>' }));
  const { body } = render(Table<{ key: number; }>, {
    props: { caption: richCaption, columns: [{ key: 'key' }], dataSource: [{ key: 1 }] }
  });
  const captionTag = body.match(/<caption\b([^>]*)>/)?.[1] ?? '';
  const region = body.match(/<div\b([^>]*\srole="region"[^>]*)>/)?.[1] ?? '';
  const id = attribute(captionTag, 'id');

  expect(id).toBeTruthy();
  expect(attribute(region, 'aria-labelledby')).toBe(id);
  expect(body).toContain('<strong>SSR report</strong>');
});
