<script lang="ts">
  import { onMount } from 'svelte';
  import Case from './DatePickerRenderHooksCase.svelte';
  import type { RenderHooksOwner } from '../date-picker-render-hooks-native';
  const owner = (new URLSearchParams(window.location.search).get('owner') ?? 'single-date') as RenderHooksOwner;
  let instance: Case;
  onMount(() => {
    const target = window as typeof window & { renderHooksRead?: Case['read'] };
    target.renderHooksRead = () => instance.read();
    return () => { delete target.renderHooksRead; };
  });
</script>

<Case {owner} bind:this={instance} />
