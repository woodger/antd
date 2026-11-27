<script lang="ts">
  // Content gets the menu context and Form.Item styling. The panel fields keep their values and
  // registration independently of the parent field.
  import { untrack, type Snippet } from 'svelte';
  import { provideDropdownMenu, type DropdownMenuContext } from './dropdown-menu-context';
  import { provideFormField } from './form-context';

  let { renderer, origin, context }: {
    renderer: Snippet<[origin?: Snippet]>;
    origin?: Snippet;
    context: DropdownMenuContext;
  } = $props();

  provideDropdownMenu(untrack(() => context));
  provideFormField(undefined);
</script>

{@render renderer(origin)}
