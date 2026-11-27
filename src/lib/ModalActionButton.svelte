<script lang="ts">
  // Applies Button settings and preserves the order of the Modal action and native onclick.
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
      // Svelte's spread sets autofocus only for true. Reset the DOM property explicitly.
      nativeElement.autofocus = Boolean(buttonProps.autofocus);
    }
  });

  function click(event: Parameters<NonNullable<ModalButtonProps['onclick']>>[0]) {
    // The local handler takes precedence even when the context uses another alias.
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
