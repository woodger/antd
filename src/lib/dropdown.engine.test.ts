import { describe, expect, it } from 'vitest';
import { getDropdownMatch, normalizeDropdownItems } from './dropdown.engine';
import type { DropdownItem } from './dropdown.types';

const items: DropdownItem[] = [
  { key: '', label: 'Open' },
  { key: 'disabled', label: 'Export', disabled: true },
  { key: 'divider', type: 'divider' },
  { key: 'rename', label: 'Rename' },
  { key: 'report', label: 'Report' },
  { key: 'archive', label: 'Archive', danger: true }
];

describe('Dropdown menu normalization', () => {
  it('preserves the first command or divider with each key without changing the source', () => {
    const source = [
      ...items,
      { key: '', label: 'Duplicate' },
      { key: 'rename', type: 'divider' as const }
    ];

    expect(normalizeDropdownItems(source)).toEqual(items);
    expect(source).toHaveLength(8);
  });
});

describe('Dropdown typeahead', () => {
  const commands = [
    { key: '', text: ' Open' },
    { key: 'rename', text: 'Rename' },
    { key: 'report', text: 'Report' },
    { key: 'ru', text: 'Архив' }
  ];

  it('cycles a single letter after the current command and wraps', () => {
    expect(getDropdownMatch(commands, '', 'r')).toBe('rename');
    expect(getDropdownMatch(commands, 'rename', 'R')).toBe('report');
    expect(getDropdownMatch(commands, 'report', 'r')).toBe('rename');
  });

  it('refines a prefix from the current command, trims labels and ignores case', () => {
    expect(getDropdownMatch(commands, 'rename', 'ren')).toBe('rename');
    expect(getDropdownMatch(commands, 'rename', 'rep')).toBe('report');
    expect(getDropdownMatch(commands, null, 'OPEN')).toBe('');
    expect(getDropdownMatch(commands, '', 'АР')).toBe('ru');
  });

  it('leaves focus unchanged when no label matches or no command is available', () => {
    expect(getDropdownMatch(commands, '', 'missing')).toBeNull();
    expect(getDropdownMatch(commands, '', ' ')).toBeNull();
    expect(getDropdownMatch([], null, 'r')).toBeNull();
  });
});
