<script lang="ts">
  import { Button } from '@woodger/antd';

  let { profile }: { profile: 'button' | 'link'; } = $props();
  let nativeElement = $state<HTMLButtonElement | HTMLAnchorElement>();
  let activations = $state<{ tag: string; matchesRef: boolean; }[]>([]);

  /** Записывает нативную активацию и сверяет её источник с bind:nativeElement. */
  function activate(event: MouseEvent & {
    currentTarget: HTMLButtonElement | HTMLAnchorElement;
  }) {
    event.preventDefault();
    const target = event.currentTarget;
    activations.push({ tag: target.localName, matchesRef: target === nativeElement });
  }
</script>

<Button href={profile === 'link' ? '#details' : undefined} bind:nativeElement onclick={activate}>
  Hydrated action
</Button>
<output id="activations">{JSON.stringify(activations)}</output>
