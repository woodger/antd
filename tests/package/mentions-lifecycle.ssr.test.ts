import { Mentions, type MentionsProps } from '@woodger/antd';
import registry from '../porting-registry';
import { render } from 'svelte/server';
import { expect, expectTypeOf, it, vi } from 'vitest';
import reference from '../browser/fixtures/ant-design-mentions-lifecycle-reference.json';

it('pins the lifecycle observations to the official Mentions bundle', () => {
  expect(reference.reference).toMatchObject({
    version: registry.upstream.version,
    revision: registry.upstream.revision,
    archiveSha256: registry.upstream.archiveSha256,
    rcMentions: '1.12.0',
    source: 'package/dist/antd.min.js',
    repeat: 2
  });
  expect(reference.cases).toHaveLength(9);
});

it('publishes lifecycle props and serializes only native autofocus in SSR', () => {
  expectTypeOf<Pick<MentionsProps, 'transitionName' | 'autoFocus' | 'silent' | 'direction'>>()
    .toEqualTypeOf<{
      transitionName?: string;
      autoFocus?: boolean;
      silent?: boolean;
      direction?: 'ltr' | 'rtl';
    }>();

  const getPopupContainer = vi.fn<() => HTMLElement>();
  const onChange = vi.fn();
  const props: MentionsProps = {
    transitionName: 'appear',
    autoFocus: true,
    silent: false,
    direction: 'rtl',
    defaultValue: '@alice',
    getPopupContainer,
    onChange
  };

  const { body } = render(Mentions, { props });
  const explicit = render(Mentions, { props: { ...props, autofocus: false } });

  expect(body).toMatch(/<textarea[^>]*\bautofocus(?:[=\s>])/);
  expect(explicit.body).not.toMatch(/<textarea[^>]*\bautofocus(?:[=\s>])/);
  expect(body).toContain('@alice');
  expect(body).toContain('aria-expanded="false"');
  expect(body).not.toMatch(/\b(?:transitionname|silent|direction)=/i);
  expect(body).not.toContain('role="listbox"');
  expect(getPopupContainer).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
});
