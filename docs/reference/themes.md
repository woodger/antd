# Темы и локализация

`ConfigProvider` задаёт оформление и язык компонентов внутри него. Поместите его
в корневой компонент, чтобы применить настройки ко всему приложению, или оберните
им отдельную часть страницы.

## Выбор темы

По умолчанию компоненты используют светлую тему (`light`) и синий основной цвет.
Чтобы включить тёмную тему с фиолетовым акцентом, задайте `mode` и `primary`.
Кнопка с `type="primary"` использует выбранный цвет.

```svelte
<script lang="ts">
  import { Button, ConfigProvider } from '@woodger/antd';
</script>

<ConfigProvider theme={{ mode: 'dark', primary: 'purple' }}>
  <Button type="primary">Сохранить</Button>
</ConfigProvider>
```

Для `primary` доступны `blue`, `purple` и `green`. Для собственного цвета задайте,
например, `theme={{ mode: 'dark', token: { colorPrimary: '#0f766e' } }}`.
Значение `token.colorPrimary` имеет приоритет над `primary`.
Настройки отдельных компонентов и чтение текущих цветов через `theme.useToken()`
описаны в [справочнике контекста темы](theme-context.md).

## Размер и плотность

`componentSize` задаёт размер вложенных компонентов, например кнопок и полей ввода.
Доступны `small`, `medium` и `large`, по умолчанию используется `medium`.
Если нужно изменить размер одной кнопки, задайте ей собственный `size`.

`theme.compact` меняет плотность оформления, в том числе интервалы между
элементами, высоту полей и метрики текста. В примере кнопка «Создать» использует
обычный размер. Вложенный провайдер уменьшает кнопки панели и расстояние между
ними, сохраняя тёмную тему родителя.

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Flex } from '@woodger/antd';
</script>

<ConfigProvider theme={{ mode: 'dark' }}>
  <Button type="primary">Создать</Button>

  <ConfigProvider componentSize="small" theme={{ compact: true }}>
    <Flex gap="small">
      <Button>Изменить</Button>
      <Button>Удалить</Button>
    </Flex>
  </ConfigProvider>
</ConfigProvider>
```

## Язык интерфейса

По умолчанию библиотека использует русскую локаль `ruRU`. Передайте `enUS`
в `locale`, чтобы переключить встроенные подписи на английский. Например,
у кнопок пагинации появятся подсказки «Previous page» и «Next page».

```svelte
<script lang="ts">
  import { ConfigProvider, Pagination, enUS } from '@woodger/antd';
</script>

<ConfigProvider locale={enUS}>
  <Pagination total={30} />
</ConfigProvider>
```

Чтобы изменить одну подпись, укажите её во вложенном провайдере.
В этом примере подсказка кнопки перехода вперёд станет «Next chapter»,
а подпись «Previous page» и остальные строки пагинации останутся английскими.

```svelte
<script lang="ts">
  import { ConfigProvider, Pagination, enUS } from '@woodger/antd';
</script>

<ConfigProvider locale={enUS}>
  <ConfigProvider locale={{ pagination: { next: 'Next chapter' } }}>
    <Pagination total={30} />
  </ConfigProvider>
</ConfigProvider>
```

Общие тексты ошибок формы задаются через `validateMessages`, а текст отдельного
правила — через `message`. Примеры приведены в разделе
[«Шаблоны сообщений»](forms.md#шаблоны-сообщений).
