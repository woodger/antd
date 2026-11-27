<script lang="ts">
  import Alert from './Alert.svelte';
  import RenderContent from '../RenderContent.svelte';
  import type { AlertErrorBoundaryProps } from './alert-error-boundary.types';

  let {
    title, description: customDescription, children, id
  }: AlertErrorBoundaryProps = $props();
  let failure = $state<{ message: string; stack?: string; }>();

  function handleError(error: unknown) {
    const stack = error && typeof error === 'object' && 'stack' in error
      && typeof error.stack === 'string' ? error.stack : undefined;

    failure = { message: String(error), stack };
  }
</script>

<!-- The fallback sits outside the boundary. Its errors reach the parent, and SSR children still throw. -->
<svelte:boundary onerror={handleError}>
  <RenderContent value={children} />
</svelte:boundary>
{#if failure}
  <Alert {id} type="error" title={title ?? failure.message}>
    {#snippet description()}<pre style={'font-size:0.9em;'
      + 'overflow-x:auto'}><RenderContent
      value={customDescription ?? failure?.stack ?? null} /></pre>{/snippet}
  </Alert>
{/if}
