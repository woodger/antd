<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { DatePickerPresetLifecycle } from '../date-picker-presets-metrics.mjs';
  let { id, text, activity, lifecycle }: { id: string; text: string;
    activity: Array<{ id: string; text: string }>; lifecycle: DatePickerPresetLifecycle[] } = $props();
  // Real lifecycle Svelte; calls React and saved popup are not simulated.
  untrack(() => activity.push({ id, text }));
  onMount(() => {
    lifecycle.push({ slot: 'label', id, event: 'mount' });
    return () => { lifecycle.push({ slot: 'label', id, event: 'unmount' }); };
  });
</script>
<span data-preset-label={id}><b>{'Custom '}</b><em>June 12</em></span>
