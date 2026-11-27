<script lang="ts">
  // Reproduces the opening at the carriage and considers only mount user content.
  import { untrack, type Snippet } from 'svelte';
  import { ConfigProvider, Mentions } from '@woodger/antd';
  import type reference from './ant-design-mentions-lifecycle-reference.json';

  type Profile = (typeof reference.cases)[number]['profile'];
  let { profile }: { profile: Profile; } = $props();
  let renamed = $state(false);
  let popupMounts = $state(0);
  let popupUnmounts = $state(0);
  let events = $state<(string | undefined)[][]>([]);
  const options = [{ value: 'alice', label: 'Alice' }, { value: 'alina', label: 'Alina' }];
  const theme = $derived({ token: { motion: profile.motion !== false } });

  /** Places the list separately from the editor, as in profile React. */
  function container() {
    const target = document.getElementById('portal');
    if (!target) {
      throw new Error('Missing Mentions lifecycle portal');
    }
    return target;
  }

  /** Considers snippet instances through its DOM lifecycle. */
  function countPopup() {
    untrack(() => { popupMounts++; });
    return () => { popupUnmounts++; };
  }
</script>

{#snippet wrap(menu: Snippet)}
  <section data-probe-custom="" {@attach countPopup}>{@render menu()}</section>
{/snippet}

<button type="button" onclick={() => { renamed = true; }}>Rename motion</button>
<output id="probe-events">{JSON.stringify(events)}</output>
<output id="probe-mounts">{popupMounts},{popupUnmounts}</output>
<div style={'margin:100px 300px;'
  + 'width:280px'}>
  <ConfigProvider {theme}>
    <Mentions
      aria-label="Mention editor"
      prefixCls="probe-mentions"
      popupClassName="mentions-probe-panel"
      {options}
      autoFocus={profile.autoFocus}
      loading={profile.loading}
      silent={profile.silent}
      direction={profile.direction === 'rtl' ? 'rtl' : undefined}
      transitionName={renamed ? 'mention-revised' : profile.transitionName}
      getPopupContainer={profile.portal ? container : undefined}
      popupRender={profile.wrap ? wrap : undefined}
      onSearch={(text, prefix) => events.push(['search', text, prefix])}
      onChange={value => events.push(['change', value])}
      onSelect={(option, prefix) => events.push(['select', option.value, prefix])}
    />
  </ConfigProvider>
</div>
<div id="portal"></div>
