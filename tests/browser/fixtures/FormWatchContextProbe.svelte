<script lang="ts">
  import { untrack } from 'svelte';
  import { useFormInstance, useFormWatch, type FormInstance } from '@woodger/antd';
  import {
    describeSelection, selectHidden, selectProfile, type WatchSampleValues
  } from './form-watch-sample';

  let { id, expected, writeTitle, onProfile }: {
    id: string;
    expected: FormInstance<WatchSampleValues>;
    writeTitle?: string;
    onProfile?: (name: string) => void;
  } = $props();

  const owner = useFormInstance<WatchSampleValues>();
  const title = useFormWatch('title');
  const profile = useFormWatch(selectProfile);
  const counts = useFormWatch(selectHidden, { preserve: true });
  const whole = useFormWatch();
  const wholeKeys = $derived(whole.value && Object.keys(whole.value).sort());

  $effect(() => {
    const { name } = profile.value;
    untrack(() => onProfile?.(name));
  });

  function writeContextValue() {
    if (writeTitle !== undefined) {
      owner.current?.setFieldValue('title', writeTitle);
    }
  }
</script>

<output data-watch={id}>{describeSelection({
  title: title.value, profile: profile.value, counts: counts.value,
  matchesOwner: owner.current === expected, wholeKeys
})}</output>
{#if writeTitle !== undefined}
  <button type="button" id={id + '-write'} onclick={writeContextValue}>Write from context</button>
{/if}
