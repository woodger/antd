import { describe, expect, expectTypeOf, it } from 'vitest';
import { render } from 'svelte/server';
import type { Snippet } from 'svelte';
import {
  Mentions, type MentionsOption, type MentionsPopupMenu, type MentionsPopupRender,
  type MentionsPopupRenderInfo, type MentionsProps
} from '@woodger/antd';
import registry from '../../porting-registry';
import reference from '../../browser/fixtures/ant-design-mentions-popup-reference.json';
import menuReference from '../../browser/fixtures/ant-design-mentions-menu-reference.json';
import focusReference from '../../browser/fixtures/ant-design-mentions-menu-focus-reference.json';
import MentionsPopupCase from '../../browser/fixtures/MentionsPopupCase.svelte';
import MentionsMenuFixture from '../../browser/fixtures/MentionsMenuFixture.svelte';
import type { MentionsPopupCase as PopupCase } from '../../browser/fixtures/mentions-popup-presets';

describe('Mentions popup source contract SSR', () => {
  it('pins the getter and popup lifecycle to the official source archive', () => {
    expect(reference.reference).toMatchObject({
      version: registry.upstream.version,
      revision: registry.upstream.revision,
      archiveSha256: registry.upstream.archiveSha256,
      source: 'package/dist/antd.min.js'
    });
  });

  for (const sample of reference.cases) {
    it(`renders the native textarea without calling browser getters for ${sample.name}`, () => {
      const { body } = render(MentionsPopupCase, {
        props: {
          sample: sample as PopupCase,
          onCall: () => { throw new Error('Unexpected SSR container call'); }
        }
      });

      expect(body).toContain('<textarea');
      expect(body).toContain('aria-expanded="false"');
      expect(body).not.toContain('popover="manual"');
      expect(body).toContain('aria-label="Mention popup calls">[]');
      expect(body.toLowerCase()).not.toMatch(/(?:getpopupcontainer|popuprender)=/);
    });
  }

  it('keeps default mention text closed and defers the DOM getter until interaction', () => {
    const { body } = render(Mentions, {
      props: {
        defaultValue: '@alpha',
        getPopupContainer: () => { throw new Error('Unexpected default SSR getter'); }
      }
    });

    expect(body).toContain('@alpha');
    expect(body).toContain('aria-expanded="false"');
    expect(body).not.toContain('role="listbox"');
  });

  it('publishes a configurable menu while accepting existing one-argument snippets', () => {
    expectTypeOf<NonNullable<MentionsProps['popupRender']>>().toEqualTypeOf<MentionsPopupRender>();
    expectTypeOf<Snippet<[Snippet]>>().toExtend<MentionsPopupRender>();
    expectTypeOf<MentionsPopupMenu>().toExtend<Snippet>();
    expectTypeOf<MentionsPopupRenderInfo['options']>().toEqualTypeOf<readonly MentionsOption[]>();
    expectTypeOf<Parameters<MentionsPopupMenu>>()
      .toEqualTypeOf<[overrides?: Partial<MentionsPopupRenderInfo>]>();

    for (const measured of [menuReference, focusReference]) {
      expect(measured.reference).toMatchObject({
        version: registry.upstream.version,
        revision: registry.upstream.revision,
        archiveSha256: registry.upstream.archiveSha256,
        source: 'package/dist/antd.min.js',
        repeat: 2
      });
    }
  });

  it.each(['motion', 'copies-live'])('defers the configurable menu until client opening for %s', profile => {
    const { body } = render(MentionsMenuFixture, { props: { profile } });

    expect(body).toContain('aria-label="Menu editor"');
    expect(body).toContain('aria-expanded="false"');
    expect(body).not.toMatch(/aria-(?:controls|activedescendant)=|role="listbox"|data-menu-context/);
  });
});
