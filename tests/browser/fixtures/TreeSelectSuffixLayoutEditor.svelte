<script lang="ts">
  import type { TreeSelectInputContext } from '@woodger/antd-svelte';
  import type { TreeSelectSuffixLayoutKind } from './tree-select-suffix-layout-cases';
  let { context, kind, prefixWidth }: {
    context: TreeSelectInputContext<HTMLInputElement>;
    kind: TreeSelectSuffixLayoutKind;
    prefixWidth: number;
  } = $props();
  let input = $state<HTMLInputElement>();
  let wrapper = $state<HTMLSpanElement>();
  let register = $derived(context.register);
  $effect(() => {
    const field = input, nativeElement = wrapper;
    if (kind !== 'composite-ref' || !field || !nativeElement) {
      return;
    }
    return register({
      inputElement: field,
      nativeElement,
      focus: options => field.focus(options),
      blur: () => field.blur()
    });
  });
</script>

{#snippet prefix()}<span data-suffix-layout-prefix style={`display:inline-block;width:${prefixWidth}px;flex:none`}>Prefix</span>{/snippet}
{#if kind === 'fragment'}{@render prefix()}<input {...context.attributes} {@attach context.register} data-suffix-layout-editor />
{:else if kind === 'wrapped-dom-ref' || kind === 'composite-ref'}
  <span data-suffix-layout-wrapper bind:this={wrapper} style="display:inline-flex">
    {@render prefix()}
    {#if kind === 'composite-ref'}
      <input {...context.attributes} bind:this={input} data-suffix-layout-editor />
    {:else}
      <input {...context.attributes} {@attach context.register} data-suffix-layout-editor />
    {/if}
  </span>
{:else}
  <input {...context.attributes} {@attach context.register} data-suffix-layout-editor />
{/if}
