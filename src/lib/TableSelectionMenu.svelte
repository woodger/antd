<script lang="ts">
  // Пункты заголовка используют Dropdown для меню, клавиатуры и возврата фокуса.
  import type { Snippet } from 'svelte';
  import Dropdown from './Dropdown.svelte';
  import Icon from './Icon.svelte';
  import RenderContent from './RenderContent.svelte';
  import type { DropdownMenuEntry } from './dropdown.types';
  import type { MenuContent } from './menu.types';
  import type { ResolvedTableLocale } from './table-locale.engine';
  import { SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE } from './table-selection.constants';
  import type { TableSelectionItem, TableSelectionPreset } from './table.types';
  import type { RenderEmptyContent } from './types';

  type Command = TableSelectionPreset | TableSelectionItem;
  let { prefix, commands, strings, disabled, onCommand }: {
    prefix: string;
    commands: readonly Command[];
    strings: Pick<ResolvedTableLocale, 'selectionMenu' | 'selectionAll' | 'selectInvert' | 'selectNone'>;
    disabled: boolean;
    onCommand: (command: Command) => void;
  } = $props();
  const label = $derived(strings.selectionMenu);
  const items = $derived<DropdownMenuEntry[]>(commands.map(menuItem));

  /** Числа и строки остаются подписями Menu, массивы используют общий renderer. */
  function commandLabel(value: RenderEmptyContent, renderArray: Snippet): MenuContent | undefined {
    if (value !== null && typeof value === 'object') {
      return renderArray;
    }

    return value === null || typeof value === 'boolean' ? undefined : value;
  }

  function menuItem(command: Command): DropdownMenuEntry {
    const onClick = () => onCommand(command);
    if (command === SELECTION_ALL) {
      return { key: 'all', label: commandLabel(strings.selectionAll, allLabel), onClick };
    }
    if (command === SELECTION_INVERT) {
      return { key: 'invert', label: commandLabel(strings.selectInvert, invertLabel), onClick };
    }
    if (command === SELECTION_NONE) {
      return { key: 'none', label: commandLabel(strings.selectNone, noneLabel), onClick };
    }

    return { key: command.key, label: command.text, onClick };
  }
</script>

{#snippet allLabel()}<RenderContent value={strings.selectionAll} />{/snippet}
{#snippet invertLabel()}<RenderContent value={strings.selectInvert} />{/snippet}
{#snippet noneLabel()}<RenderContent value={strings.selectNone} />{/snippet}

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
