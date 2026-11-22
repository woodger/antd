# App

App объединяет MessageHolder, NotificationHolder и ModalHolder. Дочерний компонент
получает их API через `App.useApp()` либо отдельный `useApp()` при инициализации.
Вызов требует ближайшего App; глобальная очередь между SSR-запросами не создаётся.

```svelte
<!-- Application.svelte -->
<script lang="ts">
  import { App, ConfigProvider } from '@woodger/antd-svelte';
  import Actions from './Actions.svelte';
</script>

<ConfigProvider theme={{ cssVar: {} }}>
  <App message={{ maxCount: 3 }} notification={{ placement: 'bottomRight' }}>
    <Actions />
  </App>
</ConfigProvider>
```

```svelte
<!-- Actions.svelte -->
<script lang="ts">
  import { App, Button } from '@woodger/antd-svelte';
  const { message, notification, modal } = App.useApp();

  async function confirm() {
    if (await modal.confirm({ title: 'Продолжить?' })) {
      message.success('Готово');
      notification.info({ title: 'Операция завершена' });
    }
  }
</script>

<Button onclick={confirm}>Продолжить</Button>
```

Ближайший ConfigProvider задаёт тему, локаль и RTL holders. Настройки message и
notification объединяются по полям с ближайшим App; локальное undefined тоже
перекрывает родительское поле и возвращает default соответствующего holder.
Top/bottom меняют расположение поверхности; duration/pauseOnHover/maxCount и
notification.placement применяются к следующим вызовам. Изменение defaults не
перезапускает таймеры и не удаляет существующие записи. Новый maxCount применяется
при следующем добавлении; прежние placements уведомлений сохраняются.
Родительская, вложенная и соседняя очереди независимы. API остаются стабильными
на протяжении жизни App. В React notification API получает новый объект после
изменения config; это отличие механизма контекста записано в реестре.

По умолчанию root — div с исходной типографикой Ant Design. Component принимает
HTML-тег либо false; false оставляет children/holders без дополнительного root,
не применяет его class/style/attrs и не создаёт nativeElement. Смена тега или
fragment-режима пересоздаёт дочернее DOM-дерево и очищает holders; те же API
работают после повторного подключения. Bind:nativeElement даёт текущий HTML-root
и очищается при его удалении. Local prefixCls задаёт root-классы, иначе используется
ConfigProvider.prefixCls + app. ConfigProvider.app
наследует record class/style целиком; локальные class/rootClassName/style дополняют
его, style имеет приоритет. Обычные HTML attrs передаются корню.

В SSR App не открывает dialog/popover и не запускает таймеры. Удаление App
закрывает поверхности, снимает inert/scroll lock и завершает ожидающие Modal
handles с false. Поддерживаются текущие настройки Native Message/Notification;
их полные React semantic/render/stack/container options, React custom root
components остаются за пределами этого этапа.

Основа сверки — [исходные снимки App](../../../tests/browser/fixtures/ant-design-app-reference.json).
Все девять root-примеров, включая global-prefix, проверяются. Проверки:
[браузер](../../../tests/browser/app.spec.ts), [SSR и типы](../../../tests/package/app.ssr.test.ts),
[обновление defaults](../../../src/lib/notice-config.test.ts).

