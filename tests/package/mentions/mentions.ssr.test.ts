import { render } from 'svelte/server';
import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import {
  Mentions,
  type InputCountConfig,
  type MentionsOption,
  type MentionsProps,
  type RenderEmptyContent
} from '@woodger/antd';
import MentionsFixtures from '../../browser/fixtures/MentionsFixtures.svelte';

describe('Mentions SSR', () => {
  it('renders native textarea text and constraints without measuring or opening a popup', () => {
    const body = render(
      Mentions,
      { props: { value: '<@alice>', name: 'note', required: true, rows: 3 } }
    ).body;

    expect(body).toContain('&lt;@alice>');
    expect(body).toContain('name="note"');
    expect(body).toContain('required');
    expect(body).toContain('rows="3"');
    expect(body).not.toContain('role="listbox"');
  });
  it('keeps controlled empty text ahead of defaultValue and preserves readonly', () => {
    const body = render(Mentions, { props: { value: '', defaultValue: 'seed', readonly: true } }).body;

    expect(body).not.toContain('seed');
    expect(body).toContain('readonly');
    expect(body).toContain('aria-expanded="false"');
  });

  it('renders an independent count limit without truncating server-provided text', () => {
    expectTypeOf<MentionsProps['count']>().toEqualTypeOf<InputCountConfig | undefined>();
    expectTypeOf<MentionsProps['onCompositionStart']>()
      .toEqualTypeOf<MentionsProps['oncompositionstart']>();
    expectTypeOf<MentionsProps['onCompositionEnd']>()
      .toEqualTypeOf<MentionsProps['oncompositionend']>();
    expectTypeOf<'showCount' extends keyof MentionsProps ? true : false>().toEqualTypeOf<false>();

    const { body } = render(Mentions, {
      props: {
        defaultValue: 'a😀bc',
        maxLength: 4,
        maxlength: 6,
        count: { max: 3, show: true },
        readonly: true
      }
    });

    expect(body).toContain('maxlength="4"');
    expect(body).toContain('a😀bc</textarea>');
    expect(body).toContain('rc-textarea-affix-wrapper-readonly rc-textarea-out-of-range');
    expect(body).toContain('data-count="5 / 3"');
    expect(body).toContain('class="rc-textarea-data-count">');
    expect(body).not.toContain('defaultvalue=');
    expect(body).not.toContain('count="[object Object]"');
  });

  it('accepts options without a value and keeps their label data out of the closed SSR field', () => {
    expectTypeOf<MentionsOption['value']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<MentionsOption['label']>().toEqualTypeOf<RenderEmptyContent>();
    expectTypeOf<Parameters<NonNullable<MentionsProps['onSelect']>>[0]>()
      .toEqualTypeOf<MentionsOption>();
    const options: readonly MentionsOption[] = [
      { key: 0, label: 'Only a label' },
      { value: undefined, label: [0, null, false] },
      { value: '', label: null }
    ];

    const { body } = render(Mentions, { props: { options, defaultValue: 'seed' } });

    expect(body).toContain('seed</textarea>');
    expect(body).not.toContain('Only a label');
    expect(body).not.toContain('role="listbox"');
  });

  it('renders autosize fixtures without browser measurements or timers on the server', () => {
    vi.useFakeTimers();
    try {
      const body = render(MentionsFixtures).body;
      expect(body).toContain('seed');
      expect(body).toContain('Autosize mentions');
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
});
