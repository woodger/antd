import type {
  FormValidateStatus,
  MentionsComponentConfig,
  MentionsProps,
  MentionsSemantic,
  MentionsSemanticProps
} from '@woodger/antd';
import { render } from 'svelte/server';
import { describe, expect, expectTypeOf, it } from 'vitest';
import Fixture from '../../browser/fixtures/MentionsSemanticFixture.svelte';

describe('Mentions semantic slots in the public package', () => {
  it('renders authored root, textarea and suffix outside a browser', () => {
    expectTypeOf<MentionsComponentConfig['styles']>().toEqualTypeOf<MentionsSemantic | undefined>();
    expectTypeOf<MentionsProps['classNames']>().toEqualTypeOf<MentionsSemantic | undefined>();

    const { body } = render(Fixture, { props: { profile: 'live' } });

    expect(body).toContain('provider-wrapper local-wrapper outer-identity context-root local-root');
    expect(body).toMatch(/<textarea[^>]*context-textarea local-textarea seen-warning-borderless-false/);
    expect(body).toMatch(/<textarea[^>]*font-size:16px;letter-spacing:1px/);
    expect(body).toContain('compose-suffix context-suffix local-suffix');
    expect(body).toContain('opacity:0.65');
    expect(body).not.toContain('popover="manual"');
  });

  it('reports the pristine FormItem status to a semantic callback', () => {
    expectTypeOf<MentionsSemanticProps['status']>().toEqualTypeOf<FormValidateStatus | undefined>();
    const { body } = render(Fixture, { props: { profile: 'pristine' } });

    expect(body).toContain('seen--borderless-false');
  });
});
