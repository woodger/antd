<script lang="ts">
  // Пункты заголовка используют Dropdown для меню, клавиатуры и возврата фокуса.
  import Dropdown from './Dropdown.svelte';
  import Icon from './Icon.svelte';
  import type { DropdownMenuEntry, DropdownProps } from './dropdown.types';
  import type { ResolvedTableLocale } from './table-locale.engine';
  import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from './table-selection.constants';
  import type { TableSelectionItem, TableSelectionPreset } from './table.types';

  type Command = TableSelectionPreset | TableSelectionItem;
  let { prefix, commands, strings, getPopupContainer, disabled, onCommand }: {
    prefix: string;
    commands: readonly Command[];
    strings: Pick<ResolvedTableLocale, 'selectionMenu' | 'selectionAll' | 'selectInvert' | 'selectNone'>;
    getPopupContainer?: DropdownProps['getPopupContainer'];
    disabled: boolean;
    onCommand: (command: Command) => void;
  } = $props();
  const label = $derived(strings.selectionMenu);
  const items = $derived<DropdownMenuEntry[]>(commands.map(menuItem));

  /** Сохраняет связь каждой подписи с командой, выполняемой над доступными ключами. */
  function menuItem(command: Command): DropdownMenuEntry {
    const onClick = () => onCommand(command);
    if (command === SELECTION_ALL) {
      return { key: 'all', label: strings.selectionAll, onClick };
    }
    if (command === SELECTION_INVERT) {
      return { key: 'invert', label: strings.selectInvert, onClick };
    }
    if (command === SELECTION_NONE) {
      return { key: 'none', label: strings.selectNone, onClick };
    }

    return { key: command.key, label: command.text, onClick };
  }
</script>

<div class={`${prefix}-selection-extra`}>
  <Dropdown {disabled} {getPopupContainer} menu={{ items }} trigger={['hover', 'click']}
    aria-label={label}>
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
