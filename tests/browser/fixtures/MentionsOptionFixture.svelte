<script lang="ts">
  import { Mentions, type MentionsOption } from '@woodger/antd';

  let { profile }: { profile: string; } = $props();
  const alice = { value: 'alice', label: 'Alice', key: 'real' };
  const noValue = { label: 'Name only', key: 'none' };
  const twins = [{ label: 'First' }, { label: 'Second' }];
  const sameKey = [
    { value: 'first', label: 'First', key: 'shared' },
    { value: 'second', label: 'Second', key: 'shared' }
  ];
  const custom = { label: 'From owner', key: 0, detail: 'retained' };
  const cases: Record<string, readonly MentionsOption[]> = {
    absent: [noValue],
    'explicit-undefined': [{ ...noValue, value: undefined }],
    'empty-value': [{ ...noValue, value: '' }],
    'zero-label': [{ ...alice, label: 0 }],
    'empty-label': [{ ...alice, label: '' }],
    'absent-label': [{ value: 'alice' }],
    'null-label': [{ ...alice, label: null }],
    'false-label': [{ ...alice, label: false }],
    'disabled-missing': [{ ...noValue, disabled: true }, alice],
    'filtered-empty': [noValue, alice],
    'twins-pointer': twins,
    'twins-keyboard': twins,
    'array-label': [{ ...alice, label: ['[', 0, true, [']']] }],
    'explicit-pointer': sameKey,
    'explicit-keyboard': sameKey,
    'explicit-filtered': sameKey,
    'explicit-disabled': [{ ...sameKey[0], disabled: true }, sameKey[1]],
    'numeric-key': [{ ...alice, key: 0 }],
    'custom-filter': [custom]
  };
  const options = $derived(cases[profile]);
  let events = $state<unknown[][]>([]);

  function fromOwner(text: string, option: MentionsOption) {
    return text === '' && option === custom && !Object.hasOwn(option, 'value');
  }

  function select(option: MentionsOption, prefix: string) {
    const fields = Object.entries(option).map(([key, value]) => [key, value ?? null]);
    events.push(['select', fields, prefix]);
  }
</script>

<Mentions
  aria-label="Option editor"
  {options}
  filterOption={profile === 'custom-filter' ? fromOwner : undefined}
  onChange={value => events.push(['change', value])}
  onSearch={(text, prefix) => events.push(['search', text, prefix])}
  onSelect={select}
/>
<output id="option-events">{JSON.stringify(events)}</output>
