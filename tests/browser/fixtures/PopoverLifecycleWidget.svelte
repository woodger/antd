<script lang="ts">
  let count = $state(0);
</script>

<!-- There is no text node: fixture repeats JSX standards. -->
<div data-lifecycle-payload=""><input aria-label="Lifecycle draft" value="Draft" /><button type="button" aria-label="Lifecycle count" onclick={() => count++}>{count}</button></div>
