<script lang="ts">
  import { flushSync, untrack } from 'svelte';
  import { Button, ConfigProvider, type ButtonLoading, type ThemeConfig } from '@woodger/antd';

  let { profile }: { profile: string; } = $props();
  let active = $state(untrack(() => profile === 'initial'));
  let ordinary = $state(untrack(() => profile === 'existing-icon' || profile === 'appear'));
  let alternate = $derived(profile === 'prefix-end-link');
  let loading = $derived<ButtonLoading>(active && (profile === 'custom-loading-icon'
    ? { icon: customIcon }
    : true));
  const off: ThemeConfig = { token: { motion: false } };

  /** Publishes DOM in the same action to remove the state of the beginning of the transition. */
  function setLoading(next: boolean) {
    flushSync(() => {
      active = next;
    });
  }
</script>

{#snippet actionIcon()}<span data-kind="ordinary">Icon</span>{/snippet}
{#snippet customIcon()}<span data-kind="custom">Busy</span>{/snippet}

<button type="button" onclick={() => setLoading(true)}>Start loading</button>
<button type="button" id="stop-loading" onclick={() => setLoading(false)}>Stop loading</button>
<button type="button" onclick={() => ordinary = false}>Remove ordinary icon</button>
<ConfigProvider
  theme={profile === 'motion-off' ? off : undefined}
  prefixCls={alternate ? 'sample' : undefined}
  direction={alternate ? 'rtl' : undefined}
>
  <Button
    id="action"
    href={alternate ? '#target' : undefined}
    prefixCls={alternate ? 'sample-button' : undefined}
    iconPlacement={alternate ? 'end' : undefined}
    icon={ordinary ? actionIcon : undefined}
    {loading}
  >Save</Button>
</ConfigProvider>
