<script lang="ts">
  // Использует одни данные для снимков SSR, браузера и проверки редактора.
  import { untrack } from 'svelte';
  import {
    ConfigProvider, Table, type SpinSemanticInfo, type TableColumn, type TableProps, type ThemeConfig
  } from '@woodger/antd';
  import enUS from '@woodger/antd/locale/en_US';
  import source from './ant-design-table-loading-reference.json';

  interface Row { key: string; name: string; }
  const query = new URLSearchParams(globalThis.location?.search);
  let {
    profileId = query.get('profile') ?? 'omitted',
    initiallyIdle = query.has('idle'),
    themed = query.has('themed'),
    customThemePrefix = query.has('theme-prefix')
  }: { profileId?: string; initiallyIdle?: boolean; themed?: boolean; customThemePrefix?: boolean; } = $props();
  const profile = untrack(() => {
    const sample = source.cases.find(({ profile }) => profile.id === profileId);
    return sample?.profile ?? source.cases[0].profile;
  });
  const values: readonly Row[] = [{ key: 'row', name: 'Anna' }];
  const dataSource = profile.data === 'editor' ? values : profile.data === 'empty' ? []
    : profile.data === 'null' ? null : undefined;
  const columns: TableColumn<Row>[] = [{
    key: 'name', title: 'Name', dataIndex: 'name', render: editor,
    sorter: (left, right) => left.name.localeCompare(right.name), showSorterTooltip: false
  }];
  let loading = $state.raw<TableProps<Row>['loading']>(untrack(() =>
    initiallyIdle ? false : loadingOptions()
  ));
  const theme = $derived<ThemeConfig>({
    token: { motion: false },
    cssVar: customThemePrefix ? { prefix: 'loading-test' } : undefined,
    components: themed ? {
      Table: { colorText: '#722ed1', lineWidth: 2 },
      Spin: { colorText: '#cf1322', colorPrimary: '#fa541c' }
    } : undefined
  });

  /** Добавляет нативные сниппеты и semantic callback к настройкам из замера. */
  function loadingOptions(): TableProps<Row>['loading'] {
    const options = profile.loading;
    if (typeof options !== 'object') {
      return options;
    }

    const size = options.size === 'small' || options.size === 'large' ? options.size : undefined;
    return {
      ...options,
      size,
      indicator: profile.indicator ? customIndicator : undefined,
      classNames: profile.semantic ? semanticClasses : undefined,
      styles: profile.semantic ? {
        root: 'margin-inline-start:5px', section: 'color:#123456', container: 'min-width:2px'
      } : undefined
    };
  }

  /** Привязывает метку к фактическим props видимого индикатора. */
  function semanticClasses({ props }: SpinSemanticInfo) {
    return {
      root: 'saving-root', section: 'saving-section', container: 'saving-container',
      indicator: `saving-indicator-${props.size}-${props.spinning}-${props.percent}`
    };
  }
</script>

{#snippet editor(row: Row)}<input aria-label="Row draft" defaultValue={row.name} />{/snippet}
{#snippet customIndicator()}<span data-saving-indicator>Pending</span>{/snippet}

<section id="table-loading-fixture">
  <ConfigProvider locale={enUS} {theme}>
    <Table {dataSource} {columns} pagination={false} {loading} locale={{ emptyText: 'No matches' }}
      styles={themed ? { root: '--ant-line-height:2' } : undefined} />
  </ConfigProvider>
  <button type="button" onclick={() => { loading = loadingOptions(); }}>Apply loading options</button>
  <button type="button" onclick={() => { loading = false; }}>Finish table loading</button>
  <button type="button" onclick={() => { loading = true; }}>Use boolean loading</button>
</section>
