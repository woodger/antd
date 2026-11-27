<script lang="ts" generics="DateType extends object">
  // Shows selected periods and the responsive count. Hidden tags stay in measurement order and are
  // excluded from keyboard navigation.
  import { onMount } from 'svelte';
  import type { DatePickerMultipleProps } from './date-picker.types';
  import { connectSelectTagOverflow } from './select-tag-overflow.dom';
  import Icon from './Icon.svelte';

  let {
    prefix, input, values, format, dateKey, disabled, placeholder, clearLabel,
    maxTagCount, tagRender, removeIcon, onRemove
  }: {
    prefix: string;
    input?: HTMLInputElement;
    values: readonly DateType[];
    format: (value: DateType) => string;
    dateKey: (value: DateType) => string | number;
    disabled: boolean;
    placeholder?: string;
    clearLabel: string;
    maxTagCount?: DatePickerMultipleProps<DateType>['maxTagCount'];
    tagRender?: DatePickerMultipleProps<DateType>['tagRender'];
    removeIcon?: DatePickerMultipleProps<DateType>['removeIcon'];
    onRemove: (value: DateType, event?: MouseEvent) => void;
  } = $props();

  let host = $state<HTMLDivElement>();
  let mounted = $state(false);
  let responsiveCount = $state<number>();
  let responsive = $derived(maxTagCount === 'responsive');
  let tags = $derived.by(() => {
    const occurrences = new Map<string | number, number>();

    return values.map(value => {
      const key = dateKey(value);
      const occurrence = occurrences.get(key) ?? 0;
      occurrences.set(key, occurrence + 1);

      return { key: `${key}:${occurrence}`, label: format(value), value };
    });
  });
  let visibleCount = $derived(responsive
    ? Math.min(responsiveCount ?? tags.length, tags.length)
    : typeof maxTagCount === 'number' && !Number.isNaN(maxTagCount)
      ? tags.slice(0, maxTagCount).length : tags.length);
  let rendered = $derived(responsive ? (mounted ? tags : []) : tags.slice(0, visibleCount));
  let omitted = $derived(tags.length - visibleCount);

  onMount(() => { mounted = true; });
  $effect(() => {
    if (!host || !input || !mounted || !responsive || !tags.length) {
      return;
    }

    return connectSelectTagOverflow(host, count => { responsiveCount = count; }, {
      tag: ':scope > [data-picker-selection-tag]',
      rest: ':scope > [data-picker-selection-rest]',
      input
    });
  });
</script>

<div class={`${prefix}-selector`} data-picker-tag-selector>
  <div bind:this={host} class={`${prefix}-selection-overflow`}>
    {#each rendered as tag, index (tag.key)}
      {@const hidden = index >= visibleCount}
      <div
        class={`${prefix}-selection-overflow-item`}
        data-picker-selection-tag
        data-picker-measure-tag={hidden || undefined}
        aria-hidden={hidden || undefined}
        inert={hidden}
      >
        {#if tagRender}
          {@render tagRender({
            label: tag.label,
            value: tag.value,
            disabled,
            closable: !disabled,
            onClose: event => onRemove(tag.value, event)
          })}
        {:else}
          <span class={`${prefix}-selection-item`} title={tag.label}>
            <span class={`${prefix}-selection-item-content`}>{tag.label}</span>
            {#if !disabled}
              <button
                type="button"
                data-picker-tag-remove
                class={`${prefix}-selection-item-remove`}
                aria-label={`${clearLabel} ${tag.label}`}
                onmousedown={event => event.preventDefault()}
                onclick={event => onRemove(tag.value, event)}
              >
                {#if typeof removeIcon === 'function'}{@render removeIcon()}
                {:else if removeIcon === true || removeIcon === undefined}<Icon name="close" />
                {:else if typeof removeIcon !== 'boolean'}{removeIcon}{/if}
              </button>
            {/if}
          </span>
        {/if}
      </div>
    {/each}
    {#if omitted || responsive && tags.length}
      <div
        class={`${prefix}-selection-overflow-item ${prefix}-selection-overflow-item-rest`}
        data-picker-selection-rest
        data-picker-measure-tag={!omitted || undefined}
        aria-hidden={!omitted || undefined}
        inert={!omitted}
      >
        <span class={`${prefix}-selection-item`} title={`+ ${omitted || 1} ...`}>
          <span class={`${prefix}-selection-item-content`}>+ {omitted || 1} ...</span>
        </span>
      </div>
    {/if}
  </div>
  {#if !values.length}
    <span class={`${prefix}-selection-placeholder`}>{placeholder}</span>
  {/if}
</div>

<style>
  [data-picker-measure-tag] {
    position:absolute;
    visibility:hidden;
    pointer-events:none;
  }
  [data-picker-tag-remove] {
    background:transparent;
    border:0;
    padding:0;
    font:inherit;
  }
  /* The field can receive focus. The selection wrapper displays its text and border. */
  :global([data-ant-picker-prefix]) [data-picker-tag-selector] + :global(input[data-picker-multiple-input]) {
    visibility:visible;
    opacity:0;
    z-index:0;
    inset-inline-start:0;
  }
</style>
