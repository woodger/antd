<script lang="ts">
  import { untrack } from 'svelte';
  import { Mentions } from '@woodger/antd';

  let { profile }: { profile: string; } = $props();
  const mode = untrack(() => profile);
  const options = [{ value: 'alice', label: 'Alice option' }];
  let events = $state<(string | boolean)[][]>([]);

  function captureCancelledEnter(node: HTMLElement) {
    if (mode !== 'pre-cancelled') {
      return;
    }

    function capture(event: KeyboardEvent) {
      if (event.key === 'Enter') event.preventDefault();
    }

    node.addEventListener('keydown', capture, true);
    return () => node.removeEventListener('keydown', capture, true);
  }

  function handlePressEnter(event: KeyboardEvent) {
    events.push(['press', event.defaultPrevented]);
    if (mode === 'prevent-press') event.preventDefault();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Enter') {
      return;
    }

    events.push(['down', event.defaultPrevented]);
    if (mode === 'prevent-down' || mode === 'open-prevent-down') event.preventDefault();
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === 'Enter' || mode.startsWith('keyup-')) {
      events.push(['up', event.defaultPrevented]);
    }

    const editor = event.currentTarget;
    if (!(editor instanceof HTMLTextAreaElement)) {
      return;
    }
    if (mode === 'keyup-move-out') editor.setSelectionRange(0, 0);
    if (mode === 'keyup-move-in') editor.setSelectionRange(1, 1);
  }
</script>

<main {@attach captureCancelledEnter}>
  <Mentions
    aria-label="Keyboard editor"
    {options}
    defaultValue={mode === 'keyup-move-in' ? '@ city' : ''}
    readonly={mode === 'readonly'}
    onPressEnter={handlePressEnter}
    onKeyDown={handleKeyDown}
    onKeyUp={handleKeyUp}
    onkeydown={mode === 'open-native-cancel' ? event => {
      if (event.key === 'Enter') {
        events.push(['native-down', event.defaultPrevented]);
        event.preventDefault();
      }
    } : undefined}
    onkeyup={mode === 'keyup-native-move-out' ? event => {
      events.push(['native-up', event.defaultPrevented]);
      event.currentTarget.setSelectionRange(0, 0);
    } : undefined}
    onChange={text => events.push(['change', text])}
    onSelect={(option, prefix) => events.push(['select', option.value, prefix])}
    onSearch={(text, prefix) => events.push(['search', text, prefix])}
  />
  <button type="button" id="reset-keyboard-events" onclick={() => { events = []; }}>Reset log</button>
  <output id="keyboard-events">{JSON.stringify(events)}</output>
</main>
