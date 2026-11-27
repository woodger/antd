import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { Menu } from '@woodger/antd';

describe('packaged horizontal Menu overflow', () => {
  it('renders every first-level item before measuring the client width', () => {
    const { body } = render(Menu, {
      props: {
        items: [{ key: 'first', label: 'First' }, { key: 'second', label: 'Second' }],
        mode: 'horizontal',
        style: 'width:10px'
      }
    });

    expect(body).toContain('ant-menu-overflow-item ant-menu-item');
    expect(body).toContain('First');
    expect(body).toContain('Second');
    expect(body).toContain('ant-menu-overflow-item-rest');
    const indicator = body.match(/<li\b[^>]*data-menu-overflow-rest="true"[^>]*>/)?.[0];
    expect(indicator).toContain('inert=""');
    expect(indicator).toContain('aria-hidden="true"');
    expect(body).not.toContain('popover="manual"');
  });

  it('accepts the opt-out and keeps the default markup outside horizontal mode', () => {
    const items = [{ key: 'first', label: 'First' }];

    for (const props of [
      { items, mode: 'horizontal' as const, disabledOverflow: true },
      { items, mode: 'vertical' as const }
    ]) {
      const { body } = render(Menu, { props });

      expect(body).toContain('First');
      expect(body).not.toContain('ant-menu-overflow-item');
    }
  });
});
