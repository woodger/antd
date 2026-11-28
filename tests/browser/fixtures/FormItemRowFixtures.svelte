<script lang="ts">
  import { ConfigProvider, Form, FormItem } from '@woodger/antd';

  const stages = ['initial', 'changed', 'unstyled', 'hidden'] as const;
  type Stage = typeof stages[number];
  let stage = $state<Stage>('initial');
  const custom = $derived(stage !== 'initial');
  const clicks = $state<[Stage, boolean, string][]>([]);
  const incoming = {
    customtag: 'preserved', id: 'legacy-row-id', fieldKey: 'legacy', labelWrap: true,
    'data-ant-form-prefix': 'caller-scope'
  };
  const rowClick = $derived.by(() => {
    const currentStage = stage;
    const rowClass = custom ? 'probe-item-row' : 'ant-form-item-row';

    return (event: MouseEvent & { currentTarget: HTMLDivElement }) => {
      const target = event.target;
      clicks.push([currentStage, event.currentTarget.classList.contains(rowClass),
        target instanceof Element ? target.tagName : '']);
    };
  });
</script>

<section id="form-item-row-fixture" aria-label="FormItem row forwarding">
  {#each stages as next (next)}
    <button type="button" onclick={() => { stage = next; }}>Set {next}</button>
  {/each}
  <ConfigProvider prefixCls={custom ? 'ui' : undefined} direction={custom ? 'rtl' : undefined}>
    <Form>
      <FormItem {...incoming}
        class="row-observation"
        rootClassName="item-root"
        prefixCls={custom ? 'probe' : undefined}
        style="color:rgb(12, 34, 56)"
        label="Row label"
        title={custom ? undefined : 'Attachment'}
        role="group"
        tabindex={-1}
        data-audit={stage}
        aria-label={stage + ' row'}
        aria-hidden={!custom}
        dir="ltr"
        gutter={custom ? [24, 8] : [20, 6]}
        align={custom ? { lg: 'top' } : 'middle'}
        justify="space-between"
        wrap={false}
        noStyle={stage === 'unstyled' || stage === 'hidden'}
        hidden={stage === 'hidden'}
        onclick={rowClick}
      >
        <button type="button" data-row-child>Row action</button>
      </FormItem>
    </Form>
  </ConfigProvider>
  <output aria-label="Row click log">{JSON.stringify(clicks)}</output>
</section>
