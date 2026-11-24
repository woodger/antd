<script lang="ts">
  // Содержимое получает контекст меню и оформление Form.Item. Поля панели
  // сохраняют свои значения и регистрацию независимо от родительского поля.
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
