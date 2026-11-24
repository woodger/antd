<script lang="ts">
  // Сохраняет одну фокусируемую кнопку при смене настроек подсказки.
  // Клики Tooltip и сортировки выполняются на том же native trigger.
  import { useDesignTokenContext } from './theme-context.svelte';
  import TableSorterTooltip from './TableSorterTooltip.svelte';
  import type { TableColumn, TableSorterTooltipProps, TableSortOrder } from './table.types';

  let {
    prefix, label, order, directions, sortIcon, description, tooltip, wholeCell, disabled, onSort
  }: {
    prefix: string;
    label: string;
    order?: TableSortOrder;
    directions: readonly (TableSortOrder | null)[];
    sortIcon?: TableColumn<object>['sortIcon'];
    description: string;
    tooltip: boolean | TableSorterTooltipProps;
    wholeCell: boolean;
    disabled: boolean;
    onSort: () => void;
  } = $props();

  const designTheme = useDesignTokenContext();
  const generatedId = $props.id();
  const descriptionId = `ant-table-sort-description-${generatedId}`;
  const options = $derived(typeof tooltip === 'object' ? tooltip : undefined);
  const iconTarget = $derived(options?.target === 'sorter-icon');
  const up = $derived(directions.includes('ascend'));
  const down = $derived(directions.includes('descend'));
  let button = $state<HTMLButtonElement>();
  let icon = $state<HTMLSpanElement>();
  let popupDescriptionId = $state<string>();
  let tooltipClick: ((event: MouseEvent) => void) | undefined;

  /** Связывает один обработчик с текущим экземпляром Tooltip. */
  function connectClick(handler: (event: MouseEvent) => void) {
    tooltipClick = handler;
    return () => {
      if (tooltipClick === handler) {
        tooltipClick = undefined;
      }
    };
  }

  /** Открытая подсказка временно заменяет описание самой кнопки. */
  function connectDescription(popupId: string) {
    popupDescriptionId = popupId;

    return () => {
      if (popupDescriptionId === popupId) {
        popupDescriptionId = undefined;
      }
    };
  }

  /** Для иконки учитывает путь события, сохраняя клавиатурный клик кнопки. */
  function activate(event: MouseEvent) {
    if (disabled) {
      return;
    }

    if (!iconTarget || icon && event.composedPath().includes(icon)) {
      tooltipClick?.(event);
    }
    onSort();
  }
</script>

<style>
  .sort-button:focus-visible {
    outline: var(--ant-line-width-focus) solid var(--ant-color-primary-border);
    outline-offset: 2px;
  }
  .sort-button {
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: inherit;
    cursor: pointer;
  }
  .sort-button:disabled { cursor: not-allowed; }
  .sort-button:not(.sort-button-full)::after { content: none; }
  .sort-arrow { display: block; width: 0; height: 0; border-inline: 4px solid transparent; }
  .sort-arrow.active { color: var(--ant-color-primary); }
  .sort-up { margin-bottom: 2px; border-bottom: 5px solid currentColor; }
  .sort-down { border-top: 5px solid currentColor; }
</style>

{#snippet sortArrow(direction: 'up' | 'down', active: boolean)}
  {#if designTheme.enabled}<span class={[
      `anticon anticon-caret-${direction} ${prefix}-column-sorter-${direction}`,
      active && 'active'
    ]}><svg viewBox="0 0 1024 1024" width="1em" height="1em" fill="currentColor" focusable="false">
      {#if direction === 'up'}
        <path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z" />
      {:else}
        <path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" />
      {/if}
    </svg></span>{:else}<span class={['sort-arrow', `sort-${direction}`, active && 'active']}></span>{/if}
{/snippet}

<button
  bind:this={button}
  type="button"
  class={[
    'sort-button',
    `${prefix}-column-sorters`,
    iconTarget && `${prefix}-column-sorters-tooltip-target-sorter`
  ]}
  class:sort-button-full={wholeCell && Boolean(tooltip) && !iconTarget && !disabled}
  {disabled}
  aria-describedby={popupDescriptionId ?? (description ? descriptionId : undefined)}
  onclick={activate}
>
  <span class={`${prefix}-column-title`}>{label}</span>
  <span bind:this={icon} data-ant-table-part="sorter" class={[
    `${prefix}-column-sorter`, !sortIcon && up && down && `${prefix}-column-sorter-full`
  ]} aria-hidden="true">
    {#if sortIcon}
      {@render sortIcon({ sortOrder: order ?? null })}
    {:else}
      <span class={`${prefix}-column-sorter-inner`}>
        {#if up}{@render sortArrow('up', order === 'ascend')}{/if}
        {#if down}{@render sortArrow('down', order === 'descend')}{/if}
      </span>
    {/if}
  </span>
  {#if description}
    <!-- Описание доступно по ID и не добавляет текст к заголовку колонки. -->
    <span id={descriptionId} role="note" aria-label={description} hidden></span>
  {/if}
</button>
{#if tooltip}
  {#key iconTarget}
    <TableSorterTooltip anchor={iconTarget ? icon : button}
      connectDescription={iconTarget ? undefined : connectDescription}
      {description} {disabled} {options} {connectClick} />
  {/key}
{/if}
