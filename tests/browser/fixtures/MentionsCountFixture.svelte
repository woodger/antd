<script lang="ts">
  import { untrack } from 'svelte';
  import { ConfigProvider, Mentions, type InputCountConfig, type InputCountInfo } from '@woodger/antd';

  let { profile }: { profile: string; } = $props();
  const mode = untrack(() => profile);
  const controlled = mode === 'accept' || mode === 'reject';
  const combined = mode === 'combined';
  const format = ['format', 'composition', 'option', 'composition-callbacks'].includes(mode);
  const recordNative = mode === 'plain' || mode === 'composition-callbacks';
  const options = [{ value: 'alexandria', label: 'Long mention' }];
  const initial = controlled || mode === 'hidden' ? 'abcd' : mode === 'snippet' ? 'ab' : '';
  let value = $state(initial);
  let showCounter = $state(mode !== 'switch' && mode !== 'hidden');
  let events = $state<(string | number | undefined)[][]>([]);
  const count = $derived(createCount());

  function trimText(text: string, { max }: { max: number; }) {
    events.push(['exceed', text, max]);
    return format ? Array.from(text).slice(0, max).join('') : text.slice(0, max);
  }

  function createCount(): InputCountConfig | undefined {
    if (mode === 'plain') {
      return undefined;
    }

    const count: InputCountConfig = {
      max: mode === 'limit' ? 2 : mode === 'zero' ? 0 : mode === 'fallback' ? undefined : 3,
      show: showCounter
    };
    if (format) {
      count.strategy = text => Array.from(text).length;
      count.show = ({ value, count, maxLength }) => `${value} [${count}/${maxLength}]`;
    }
    if (format || controlled || mode === 'zero' || mode === 'composition-same') {
      count.exceedFormatter = trimText;
    }
    if (mode === 'zero' || mode === 'fallback') {
      count.show = ({ value, count, maxLength }) => JSON.stringify([value, count, maxLength]);
    }
    if (mode === 'snippet') {
      count.show = () => countLabel;
    }
    return count;
  }

  function handleChange(text: string) {
    events.push(['change', text]);
    if (mode === 'accept') {
      value = text;
    }
  }
</script>

{#snippet countLabel(info: InputCountInfo)}
  <output id="snippet-count">{info.value}:{info.count}:{info.maxLength}</output>
{/snippet}

<main style="width:360px">
  <ConfigProvider direction={combined ? 'rtl' : undefined}>
    <Mentions aria-label="Count editor" {options} {count}
      value={controlled ? value : undefined}
      defaultValue={initial}
      maxLength={mode === 'limit' || mode === 'zero' ? 4 : undefined}
      maxlength={mode === 'fallback' ? 4 : mode === 'limit' ? 6 : undefined}
      allowClear={combined}
      autoSize={combined ? { minRows: 2, maxRows: 3 } : undefined}
      onChange={handleChange}
      onSelect={(option, prefix) => events.push(['select', option.value, prefix])}
      onCompositionStart={recordNative ? event => events.push(['start', event.data]) : undefined}
      onCompositionEnd={recordNative ? event => events.push(['end', event.data]) : undefined}
      oninput={recordNative ? event => events.push(['input', event.currentTarget.value]) : undefined}
      oncompositionstart={recordNative
        ? event => events.push(['native-start', event.data]) : undefined}
      oncompositionend={recordNative
        ? event => events.push(['native-end', event.data]) : undefined}
    />
  </ConfigProvider>
  <button type="button" id="toggle-count" onclick={() => { showCounter = !showCounter; }}>
    Toggle counter
  </button>
  <output id="count-events">{JSON.stringify(events)}</output>
</main>
