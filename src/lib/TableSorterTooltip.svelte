<script lang="ts">
  // Подключает общий Tooltip к готовому элементу сортировки.
  // Контекст якоря принадлежит только этой подсказке.
  import { untrack } from 'svelte';
  import Tooltip, { provideTooltipAnchor } from './Tooltip.svelte';
  import type { TableSorterTooltipProps } from './table.types';

  let { anchor, description, disabled, options, connectClick, connectDescription }: {
    anchor?: HTMLElement;
    description: string;
    disabled: boolean;
    options?: TableSorterTooltipProps;
    connectClick: (handler: (event: MouseEvent) => void) => () => void;
    connectDescription?: (id: string) => () => void;
  } = $props();

  let localOpen = $state(untrack(() => options?.defaultOpen ?? false));
  const open = $derived(!disabled && (options?.open ?? localOpen));
  const popupProps = $derived.by(() => {
    const { target, ...props } = options ?? {};
    return { title: description, ...props };
  });

  provideTooltipAnchor({
    element: () => anchor,
    enabled: () => !disabled,
    connectClick: handler => connectClick(handler),
    get connectDescription() { return connectDescription; }
  });

  $effect.pre(() => {
    if (disabled) {
      localOpen = false;
    }
  });

  /** Владелец open получает запрос, а локальное состояние используется без open. */
  function changeOpen(next: boolean) {
    if (disabled) {
      return;
    }

    localOpen = next;
    options?.onOpenChange?.(next);
  }
</script>

{#snippet empty()}{/snippet}
<Tooltip {...popupProps} {open} onOpenChange={changeOpen} children={empty} />
