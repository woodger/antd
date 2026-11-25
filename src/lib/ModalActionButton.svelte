<script lang="ts">
  // Применяет настройки Button и сохраняет порядок действия Modal и нативного onclick.
  import Button from './Button.svelte';
  import type { ModalButtonProps, ModalContent, ModalOkType } from './modal.types';

  interface Props {
    inherited?: ModalButtonProps;
    options?: ModalButtonProps;
    type?: ModalOkType;
    text: ModalContent;
    loading?: boolean;
    disabled?: boolean;
    autofocus?: boolean;
    part?: 'ok' | 'cancel';
    action: () => void | boolean;
  }

  let { inherited, options, type, text, loading, disabled, autofocus, part, action }: Props = $props();
  const appearance = $derived(type === 'danger' ? { danger: true } : { type });
  const buttonProps = $derived({ autofocus, ...inherited, ...options });
  let nativeElement = $state<HTMLButtonElement | HTMLAnchorElement>();

  $effect(() => {
    if (nativeElement) {
      // Spread в Svelte выставляет autofocus только при true. Сбрасываем DOM-свойство явно.
      nativeElement.autofocus = Boolean(buttonProps.autofocus);
    }
  });

  function click(event: Parameters<NonNullable<ModalButtonProps['onclick']>>[0]) {
    // Локальный обработчик имеет приоритет, даже если в контексте использован другой alias.
    const source = options && ('onclick' in options || 'onClick' in options) ? options : inherited;
    const handler = source?.onclick ?? source?.onClick;
    if (action() !== false) {
      handler?.(event);
    }
  }
</script>

<Button
  {...appearance}
  {loading}
  {disabled}
  {...buttonProps}
  bind:nativeElement
  data-ant-modal-action={part}
  onclick={click}
  children={text}
/>
