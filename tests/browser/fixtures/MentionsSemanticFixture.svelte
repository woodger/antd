<script lang="ts">
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Form, FormItem, Mentions, createForm,
    type MentionsComponentConfig, type MentionsOption,
    type MentionsSlots, type MentionsSemantic
  } from '@woodger/antd';

  let { profile }: { profile: string; } = $props();
  let revised = $state(false);
  let autoSize = $state(untrack(() => profile === 'autosize'));
  const form = createForm({ initialValues: {} });
  let events = $state<(string | undefined)[][]>([]);
  const options = [{ value: 'alice', label: 'Alice' }, { value: 'alina', label: 'Alina' }];

  /** Даёт различимые классы каждого источника во всех четырёх слотах. */
  function slots(scope: string): MentionsSlots {
    return {
      root: scope + '-root', textarea: scope + '-textarea',
      popup: scope + '-popup', suffix: scope + '-suffix'
    };
  }

  let config = $derived<MentionsComponentConfig>({
    class: revised ? 'new-wrapper' : 'provider-wrapper',
    variant: revised ? 'outlined' : 'filled',
    allowClear: { clearIcon: contextIcon },
    classNames: slots(revised ? 'revised' : 'context'),
    styles: ({ props }) => ({
      root: 'margin-top:4px;'
        + 'padding-bottom:4px',
      textarea: (
        'font:inherit;'
        + 'font-family:monospace;'
        + 'font-size:16px;'
        + 'letter-spacing:'
      )
        + (props.status === 'error' ? '3px' : '1px'),
      popup: 'background-color:#aabbcc;'
        + 'padding-top:3px;'
        + 'z-index:5',
      suffix: 'opacity:0.65'
    }),
    style: 'margin-top:5px;'
      + 'padding-bottom:5px'
  });

  const classes: MentionsSemantic = ({ props }) => ({
    ...slots('local'),
    textarea: 'local-textarea seen-' + props.status + '-' + (props.variant ?? 'none')
      + '-' + String(Boolean(props.disabled))
  });
  let styles = $derived<MentionsSlots>({
    root: 'margin-top:7px;'
      + 'padding-bottom:7px',
    textarea: profile === 'autosize' ? (revised ? 'height:71px' : 'height:59px') : undefined,
    popup: 'padding-top:9px;'
      + 'z-index:0'
  });

  /** Локальный portal запрашивается при первом открытии. */
  function getContainer() {
    const container = document.getElementById('portal');
    if (!container) {
      throw new Error('Missing Mentions test portal');
    }
    return container;
  }

  /** Сравнивает публикацию полного значения с callback выбора. */
  function select(option: MentionsOption, prefix: string) {
    events.push(['select', option.value, prefix]);
  }
</script>

{#snippet contextIcon()}<b data-clear-marker="context">Clear</b>{/snippet}
{#snippet control()}
  <Mentions
    prefixCls="compose"
    disabled={false}
    status={profile === 'pristine' ? undefined : revised ? 'error' : 'warning'}
    variant={revised ? undefined : 'borderless'}
    class="local-wrapper"
    rootClassName="outer-identity"
    popupClassName="local-popup-name"
    getPopupContainer={getContainer}
    {options}
    allowClear={profile === 'local-off' ? false : profile === 'live' ? true : undefined}
    autoSize={autoSize ? { minRows: 1, maxRows: 2 } : false}
    classNames={classes}
    {styles}
    style={'margin-top:9px;'
      + 'resize:vertical'}
    aria-label="Mention"
    onChange={value => events.push(['change', value])}
    onSelect={select}
    onClear={() => events.push(['clear'])}
  />
{/snippet}

<button type="button" onclick={() => revised = true}>Update Mentions styles</button>
<button type="button" onclick={() => autoSize = false}>Use authored height</button>
<output id="mention-events">{JSON.stringify(events)}</output>
<div id="portal"></div>
<ConfigProvider mentions={config} theme={{ token: { motion: false } }}>
  {#if profile === 'record-reset'}
    <ConfigProvider mentions={{}}>{@render control()}</ConfigProvider>
  {:else if profile === 'pristine'}
    <Form {form}><FormItem>{@render control()}</FormItem></Form>
  {:else}
    {@render control()}
  {/if}
</ConfigProvider>
