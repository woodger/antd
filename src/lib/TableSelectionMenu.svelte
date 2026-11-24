<script lang="ts">
  // Пункты заголовка используют Dropdown для меню, клавиатуры и возврата фокуса.
  import Dropdown from './Dropdown.svelte';
  import Icon from './Icon.svelte';
  import type { DropdownMenuEntry } from './dropdown.types';
  import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from './table-selection.constants';
  import type { TableSelectionItem, TableSelectionPreset } from './table.types';
  import { ruRU, type TableLocale } from './types';

  type Command = TableSelectionPreset | TableSelectionItem;
  let { prefix, commands, strings, disabled, onCommand }: {
    prefix: string;
    commands: readonly Command[];
    strings: TableLocale;
    disabled: boolean;
    onCommand: (command: Command) => void;
  } = $props();
  const label = $derived(strings.selectionMenu ?? 'Команды выбора строк');
  const items = $derived<DropdownMenuEntry[]>(commands.map(menuItem));

  function menuItem(command: Command): DropdownMenuEntry {
    const onClick = () => onCommand(command);
    const fallback = ruRU.table;
    if (command === SELECTION_ALL) {
      return { key: 'all', label: strings.selectionAll ?? fallback.selectionAll ?? 'Все', onClick };
    }
    if (command === SELECTION_INVERT) {
      const title = strings.selectInvert ?? fallback.selectInvert ?? 'Инвертировать';
      return { key: 'invert', label: title, onClick };
    }
    if (command === SELECTION_NONE) {
      return { key: 'none', label: strings.selectNone ?? fallback.selectNone ?? 'Сбросить', onClick };
    }

    return { key: command.key, label: command.text, onClick };
  }
</script>

<div class={`${prefix}-selection-extra`}>
  <Dropdown {disabled} menu={{ items }} trigger={['hover', 'click']} aria-label={label}>
    <button type="button" {disabled} aria-label={label}>
      <span aria-hidden="true"><Icon name="down" /></span>
    </button>
  </Dropdown>
</div>

<style>
  button {
    display: block;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }
</style>
