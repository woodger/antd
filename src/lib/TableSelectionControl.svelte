<script lang="ts">
  // Checkbox и Radio используют нативный ввод, а состояние принадлежит Table.
  // Click нужен Shift-выбору, поскольку DOM change не содержит модификаторы.
  import { onDestroy, tick } from 'svelte';
  import Checkbox from './Checkbox.svelte';
  import Radio from './Radio.svelte';
  import { isolateRadioContext } from './radio-context';
  import type { CheckboxChangeEvent } from './checkbox.types';
  import type { RadioChangeEvent } from './radio.types';
  import type { TableSelectionControlProps } from './table.types';

  let {
    radio = false, checked, mixed = false, disabled, label, control = {}, onToggle
  }: {
    radio?: boolean;
    checked: boolean;
    mixed?: boolean;
    disabled: boolean;
    label: string;
    control?: TableSelectionControlProps;
    onToggle: (checked: boolean, event: Event) => void;
  } = $props();

  isolateRadioContext();

  const {
    'aria-label': ariaLabel, disabled: _disabled, indeterminate: _indeterminate,
    onChange, onClick, value, ...attributes
  } = $derived(control);
  const radioValue = $derived(typeof value === 'string' || typeof value === 'number'
    || typeof value === 'boolean' ? value : undefined);
  let input = $state<HTMLInputElement>();
  let activation: MouseEvent | undefined;
  let activationTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => clearTimeout(activationTimer));

  function handleClick(event: MouseEvent & { currentTarget: HTMLInputElement; }) {
    activation = event;
    clearTimeout(activationTimer);
    activationTimer = setTimeout(() => { activation = undefined; }, 0);
    event.stopPropagation();
    onClick?.(event);
  }

  // Дочерний контрол не получает собственный checked поверх принятого значения.
  function keepOwnerValue() {}

  // Нативная группа по name снимает старую отметку ещё до решения владельца.
  function restoreRadioPeer(element: HTMLInputElement) {
    const table = element.closest('table');
    if (!table || !element.name) {
      return;
    }

    const peers = table.querySelectorAll<HTMLInputElement>(
      'input[data-ant-table-selection-radio][aria-checked="true"]'
    );
    for (const peer of peers) {
      if (peer.name === element.name && peer.form === element.form && peer.closest('table') === table) {
        peer.checked = true;
        return;
      }
    }
  }

  // Пока владелец решает, принять ли ключ, браузер уже переключил native input.
  async function restoreInput(element: HTMLInputElement | undefined) {
    await tick();
    if (!element || element !== input || !element.isConnected) {
      return;
    }

    element.checked = checked;
    if (!radio) {
      element.indeterminate = mixed;
    }
    else if (!checked) {
      restoreRadioPeer(element);
    }
  }

  function handleChange(change: CheckboxChangeEvent | RadioChangeEvent) {
    const event = activation ?? change.nativeEvent;
    const element = input;
    activation = undefined;
    clearTimeout(activationTimer);

    try {
      onToggle(change.target.checked, event);
      onChange?.(change);
    }
    finally {
      void restoreInput(element);
    }
  }
</script>

{#if radio}
  <Radio
    {...attributes}
    bind:inputElement={input}
    bind:checked={() => checked, keepOwnerValue}
    data-ant-table-selection-radio=""
    value={radioValue}
    {disabled}
    aria-label={ariaLabel ?? label}
    onClick={handleClick}
    onChange={handleChange}
  />
{:else}
  <Checkbox
    {...attributes}
    skipGroup
    bind:inputElement={input}
    bind:checked={() => checked, keepOwnerValue}
    bind:indeterminate={() => mixed, keepOwnerValue}
    {value}
    {disabled}
    aria-label={ariaLabel ?? label}
    onClick={handleClick}
    onChange={handleChange}
  />
{/if}
