<script lang="ts">
  import { untrack } from 'svelte';
  import dayjs from 'dayjs';
  import 'dayjs/locale/ar.js';
  import 'dayjs/locale/de.js';
  import 'dayjs/locale/en-gb.js';
  import 'dayjs/locale/fr.js';
  import 'dayjs/locale/hy-am.js';
  import 'dayjs/locale/ja.js';
  import 'dayjs/locale/pt-br.js';
  import 'dayjs/locale/sl.js';
  import 'dayjs/locale/uz.js';
  import 'dayjs/locale/zh-cn.js';
  import {
    Calendar, ConfigProvider, DatePicker, Empty, Modal, Pagination, Popconfirm, RangePicker,
    Table, TimePicker, TimeRangePicker, type AntDesignLocale
  } from '@woodger/antd';
  import ar_EG from '@woodger/antd/locale/ar_EG';
  import de_DE from '@woodger/antd/locale/de_DE';
  import en_GB from '@woodger/antd/locale/en_GB';
  import en_US from '@woodger/antd/locale/en_US';
  import fr_FR from '@woodger/antd/locale/fr_FR';
  import hy_AM from '@woodger/antd/locale/hy_AM';
  import ja_JP from '@woodger/antd/locale/ja_JP';
  import pt_BR from '@woodger/antd/locale/pt_BR';
  import ru_RU from '@woodger/antd/locale/ru_RU';
  import sl_SI from '@woodger/antd/locale/sl_SI';
  import uz_UZ from '@woodger/antd/locale/uz_UZ';
  import zh_CN from '@woodger/antd/locale/zh_CN';

  let { preset }: { preset?: string; } = $props();
  const locales: Readonly<Record<string, AntDesignLocale>> = {
    ar_EG, de_DE, en_GB, en_US, fr_FR, hy_AM, ja_JP, pt_BR, ru_RU, sl_SI, uz_UZ, zh_CN
  };
  const query = typeof window === 'undefined' ? null
    : new URLSearchParams(window.location.search).get('code');
  const code = untrack(() => preset ?? query ?? 'fr_FR');
  const direction = code === 'ar_EG' ? 'rtl' : undefined;
  const seed = dayjs('2024-06-19T15:14:15');
  const columns = [{ key: 'entry', title: 'Entry', dataIndex: 'entry' as const }];
  const rows: { entry: string; }[] = [];
  let locale = $state.raw(locales[code] ?? fr_FR);
  let dialog = $state<'' | 'modal' | 'popconfirm'>('');
</script>

<section id="locale-catalog-fixture">
  <button type="button" onclick={() => dialog = 'modal'}>Show locale modal</button>
  <button type="button" onclick={() => dialog = 'popconfirm'}>Show locale popconfirm</button>
  <button type="button" onclick={() => dialog = ''}>Hide locale dialogs</button>
  <button type="button" onclick={() => locale = de_DE}>Load German locale</button>

  <ConfigProvider {locale} {direction} theme={{ token: { motion: false } }}>
    <div id="picker-fields">
      <DatePicker id="probe-date" defaultValue={seed} />
      <RangePicker id={{ start: 'probe-from', end: 'probe-to' }} />
      <DatePicker id="probe-week" picker="week" />
      <DatePicker id="probe-quarter" picker="quarter" />
      <TimePicker id="probe-time" defaultValue={seed} />
      <TimeRangePicker id={{ start: 'probe-after', end: 'probe-before' }} />
    </div>
    <div id="probe-calendar"><Calendar value={seed} fullscreen={false} /></div>
    <div id="probe-pagination">
      <Pagination total={250} defaultCurrent={5} showSizeChanger={false} showQuickJumper />
    </div>
    <ConfigProvider locale={{ pagination: { next: 'Next chapter' } }}>
      <div id="probe-pagination-override"><Pagination total={30} /></div>
    </ConfigProvider>
    <div id="probe-empty"><Empty /></div>
    <div id="probe-table"><Table dataSource={rows} {columns} pagination={false} /></div>
    <Modal title="Locale modal" open={dialog === 'modal'} getContainer={false} />
    <Popconfirm title="Locale popconfirm" open={dialog === 'popconfirm'}>
      <button type="button" id="probe-confirm">Prompt confirmation</button>
    </Popconfirm>
  </ConfigProvider>
</section>
