<script lang="ts">
  import { Mentions } from '@woodger/antd';

  let { profile }: { profile: string; } = $props();
  const initial = 'Draft @ali';
  const controlled = $derived(profile.startsWith('controlled-'));
  const count = $derived(profile.startsWith('count-') ? { show: true, max: 20 } : undefined);
  let events = $state<string[]>([]);
</script>

<Mentions
  id={profile === 'default-generated' ? undefined : 'hydrating-mentions'}
  aria-label="Hydration editor"
  value={controlled ? initial : undefined}
  defaultValue={initial}
  {count}
  onChange={text => events.push(text)}
/>
<output id="hydration-events">{JSON.stringify(events)}</output>
