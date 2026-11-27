import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import MenuConfigFixtures from '../../browser/fixtures/MenuConfigFixtures.svelte';

describe('packaged Menu semantic config', () => {
  it('renders provider and local slots, a custom expand icon and hidden submenu markup', () => {
    const { body } = render(MenuConfigFixtures, { props: { kind: 'vertical' } });

    expect(body).toContain('provider-menu local-menu local-root p-root l-root');
    expect(body).toContain('background-color:#223344');
    expect(body).toContain('color:#666666');
    expect(body).toContain('p-title l-title');
    expect(body).toContain('p-nested-item l-nested-item');
    expect(body).toContain('class="provider-expand">+');
    expect(body).toContain('item-nested');
    expect(body).toContain('popover="manual" hidden');
    expect(body).toContain('background-color:#556677;z-index:3023');
    expect(body).not.toContain('classname=');
    expect(body).not.toContain('expandicon=');
  });
});
