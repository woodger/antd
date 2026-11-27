<script lang="ts">
  // Manages the native button and sort tooltip. An interactive heading sits next to the button and
  // shares its hover area.
  import type { Snippet } from 'svelte';
  import { on } from 'svelte/events';
  import { useDesignTokenContext } from '../theme-context.svelte';
  import TableSorterTooltip from './TableSorterTooltip.svelte';
  import type { TableColumn, TableSorterTooltipProps, TableSortOrder } from './table.types';

  let {
    prefix, label, accessibleLabel, titleId, labelledby, titleContent, order, directions,
    sortIcon, description, tooltip, wholeCell, disabled, onSort
  }: {
    prefix: string;
    label?: string;
    accessibleLabel?: string;
    titleId?: string;
    labelledby?: string;
    titleContent?: Snippet;
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
  const fullTarget = $derived(wholeCell && Boolean(tooltip) && !iconTarget && !disabled);
  let button = $state<HTMLButtonElement>();
  let heading = $state<HTMLDivElement>();
  let icon = $state<HTMLSpanElement>();
  let popupDescriptionId = $state<string>();
  let tooltipClick: ((event: MouseEvent) => void) | undefined;

  /** Connects one handler to the current Tooltip instance. */
  function connectClick(handler: (event: MouseEvent) => void) {
    tooltipClick = handler;
    return () => {
      if (tooltipClick === handler) {
        tooltipClick = undefined;
      }
    };
  }

  /** An open tooltip temporarily replaces the button's own description. */
  function connectDescription(popupId: string) {
    popupDescriptionId = popupId;

    return () => {
      if (popupDescriptionId === popupId) {
        popupDescriptionId = undefined;
      }
    };
  }

  /** Checks the event path for the icon while retaining keyboard clicks on the button. */
  function activate(event: MouseEvent) {
    if (disabled) {
      return;
    }

    if (!iconTarget || icon && event.composedPath().includes(icon)) {
      tooltipClick?.(event);
    }
    onSort();
  }

  /** Fields, links, and other controls keep their own actions inside the heading. */
  function handleHeadingClick(event: MouseEvent) {
    if (event.defaultPrevented) {
      return;
    }

    const controls = 'button,input,select,textarea,a[href],label,summary,[tabindex],'
      + '[contenteditable]:not([contenteditable="false"]),'
      + '[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],'
      + '[role^="menuitem"],[role="option"],[role="tab"]';

    for (const node of event.composedPath()) {
      if (node === event.currentTarget) {
        break;
      }
      if (node instanceof Element && node.matches(controls)) {
        return;
      }
    }

    activate(event);
  }

  function connectHeading(element: HTMLDivElement) {
    return on(element, 'click', handleHeadingClick);
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
  .sort-heading {
    display: flex;
    align-items: center;
    min-width: 0;
  }
  .sort-heading:not(.sort-heading-disabled) { cursor: pointer; }
  .sort-heading:not(.sort-heading-full)::after { content: none; }
  .sort-title {
    position: relative;
    z-index: 1;
    flex: 1;
    min-width: 0;
  }
  .sort-button-icon {
    display: inline-flex;
    align-items: center;
    position: relative;
    z-index: 1;
    width: auto;
    flex: none;
  }
  .sort-arrow {
    display: block;
    width: 0;
    height: 0;
    border-inline: 4px solid transparent;
  }
  .sort-arrow.active { color: var(--ant-color-primary); }
  .sort-up {
    margin-bottom: 2px;
    border-bottom: 5px solid currentColor;
  }
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

{#snippet sortButton(iconOnly: boolean)}
  <button
    bind:this={button}
    type="button"
    class={[
      'sort-button',
      !iconOnly && `${prefix}-column-sorters`,
      !iconOnly && iconTarget && `${prefix}-column-sorters-tooltip-target-sorter`
    ]}
    class:sort-button-full={!iconOnly && fullTarget}
    class:sort-button-icon={iconOnly}
    {disabled}
    aria-label={accessibleLabel}
    aria-labelledby={labelledby}
    aria-describedby={popupDescriptionId ?? (description ? descriptionId : undefined)}
    onclick={activate}
  >
    {#if !iconOnly}<span class={`${prefix}-column-title`}>{label ?? ''}</span>{/if}
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
      <!-- The description is available by ID and adds no text to the column heading. -->
      <span id={descriptionId} role="note" aria-label={description} hidden></span>
    {/if}
  </button>
{/snippet}

{#if titleContent}
  <div
    bind:this={heading}
    class={['sort-heading', `${prefix}-column-sorters`,
      iconTarget && `${prefix}-column-sorters-tooltip-target-sorter`]}
    class:sort-heading-full={fullTarget}
    class:sort-heading-disabled={disabled}
    {@attach connectHeading}
  >
    <div id={titleId} class={`sort-title ${prefix}-column-title`}>{@render titleContent()}</div>
    {@render sortButton(true)}
  </div>
{:else}
  {@render sortButton(false)}
{/if}
{#if tooltip}
  {#key iconTarget}
    <TableSorterTooltip anchor={iconTarget ? icon : heading ?? button}
      connectDescription={iconTarget ? undefined : connectDescription}
      {description} {disabled} {options} {connectClick} />
  {/key}
{/if}
