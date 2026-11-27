<script lang="ts">
  import Button from '../button/Button.svelte';
  import type { DatePickerComponents } from './picker-components.types';

  let { component, disabled, onclick, children }: {
    component?: DatePickerComponents['button'];
    disabled: boolean;
    onclick: () => void;
    children: string;
  } = $props();
</script>

{#if typeof component === 'function'}
  {@render component({ attributes: { type: 'button', disabled, onclick }, children })}
{:else if component === 'button'}
  <button type="button" {disabled} {onclick}>{children}</button>
{:else}
  <Button type="primary" size="small" {disabled} {onclick} {children} />
{/if}
