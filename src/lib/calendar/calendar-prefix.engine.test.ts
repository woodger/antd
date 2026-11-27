import { describe, expect, it } from 'vitest';
import { getCalendarPrefixCss } from './calendar-prefix.engine';

describe('Calendar prefix stylesheet', () => {
  it('keeps canonical styling without an extra sheet', () => {
    expect(getCalendarPrefixCss('ant-picker')).toBeUndefined();
  });

  it('isolates local Calendar roots while preserving tokens, marker and responsive rules', () => {
    const css = getCalendarPrefixCss('dates');

    expect(css).toContain('.dates-calendar:where([data-ant-calendar-prefix="dates"])');
    expect(css).toContain('.dates-calendar-mini:where(');
    expect(css).toContain('.ant-picker-calendar-css-var:where(');
    expect(css).toContain('.dates-cell-selected');
    expect(css).toContain('[class^="dates"]');
    expect(css).toContain('--ant-calendar-mini-content-height');
    expect(css).toContain('@media');
    expect(css).not.toContain('.ant-picker-cell');
    expect(css).toMatch(/:where\(\.ant-picker-calendar-css-var[^\n]+\)\{--ant-calendar-/);
  });

  it('escapes class identifiers while keeping the same prefix in quoted selectors', () => {
    const css = getCalendarPrefixCss('dates+ui');

    expect(css).toContain(String.raw`.dates\2b ui-calendar:where([data-ant-calendar-prefix="dates+ui"])`);
    expect(css).toContain(String.raw`.dates\2b ui-cell-selected`);
    expect(css).toContain('[class^="dates+ui"]');
    expect(css).toContain('[class*=" dates+ui"]');
  });

  it('serializes quotes and backslashes inside quoted selectors', () => {
    const css = getCalendarPrefixCss('dates"\\&ui');

    expect(css).toContain(String.raw`[class^="dates\22 \5c \26 ui"]`);
  });

  it('keeps literal prefix characters and escapes closing style tags', () => {
    expect(getCalendarPrefixCss('dates-$&')).toContain(String.raw`.dates-\24 \26 -cell`);
    expect(getCalendarPrefixCss('dates-</style><script>')).not.toContain('</style');
  });
});
