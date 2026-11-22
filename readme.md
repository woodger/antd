# Ant Design для Svelte 5

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-types-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#лицензия)

Библиотека компонентов Ant Design для Svelte и TypeScript: элементы интерфейса,
модели форм, темы и локализация.

[Примеры компонентов](https://woodger.org/ant-design) · [Документация](docs/README.md) · [Каталог компонентов](docs/reference/components/README.md)

## Подключение

Компоненты импортируются из `antd-svelte`. `ConfigProvider` подключает стили;
если компоненты используются без него, импортируйте стили один раз в точке входа
приложения или в корневом компоненте. В SvelteKit это можно сделать в `<script>`
корневого layout `src/routes/+layout.svelte`:

```ts
import 'antd-svelte/styles.css';
```

## Быстрый старт

```svelte
<script lang="ts">
  import { Button, ConfigProvider, Input, Select } from 'antd-svelte';

  let name = $state('');
  let role = $state<string | undefined>('developer');
</script>

<ConfigProvider theme={{ mode: 'light', primary: 'blue' }}>
  <label for="name">Имя</label>
  <Input id="name" bind:value={name} />

  <label for="role">Роль</label>
  <Select
    id="role"
    bind:value={role}
    options={[
      { value: 'developer', label: 'Разработчик' },
      { value: 'designer', label: 'Дизайнер' }
    ]}
    showSearch
    allowClear
  />

  <Button type="primary" onclick={() => console.log(name, role)}>Сохранить</Button>
</ConfigProvider>
```

## Основные возможности

### Ввод и выбор данных

`Input`, `InputNumber`, `Select`, `Checkbox`, `Radio` и другие поля принимают
значения и сообщают об изменениях через `callbacks` или поддерживаемые привязки
Svelte. `AutoComplete` позволяет вводить произвольный текст с подсказками,
а `Cascader` — выбирать путь в иерархическом списке. Содержимое компонентов
можно настраивать через `snippets`.

### Формы и валидация

`createForm()` создаёт модель значений и ошибок. `Form` и `FormItem` связывают
её с полями, выполняют проверку и передают данные при отправке, а `FormList`
управляет массивами полей. Поддерживаются синхронные и асинхронные правила,
сброс и сообщения об ошибках. [Подробнее о формах](docs/reference/forms.md).

### Таблицы и пагинация

`Table` показывает типизированные строки и колонки, поддерживает сортировку,
фильтры, выбор и раскрытие строк. В клиентском режиме обработка данных и
пагинация выполняются в таблице; в серверном приложение само загружает нужную
страницу. `getTableData()` фильтрует и сортирует данные, а
`getPaginationState()` вычисляет текущую страницу и диапазон записей.
[Подробнее о таблице](docs/reference/components/table.md).

### Деревья и списки

`Tree` отображает иерархию с раскрытием, выбором, флажками, отложенной загрузкой
и перетаскиванием узлов. `TreeSelect` добавляет поиск и выбор узлов из раскрывающегося
списка. `createTree()` создаёт модель для получения пути к узлу через `getPath()`.
`Listy` поддерживает группировку и виртуальную прокрутку.
[Подробнее о дереве](docs/reference/components/tree.md).

### Даты и время

`DatePicker`, `TimePicker` и их варианты для диапазонов позволяют вводить
значения вручную или выбирать их в панели. Доступны форматы, локализация и
ограничения выбора; значения дат и времени используют Day.js.
[Подробнее о выборе даты](docs/reference/components/date-picker.md).

### Загрузка файлов

`Upload` и `UploadDragger` выбирают файлы, показывают состояние загрузки и
позволяют проверять файлы перед отправкой. Можно использовать встроенный запрос,
собственный транспорт или управлять отправкой вручную.
[Подробнее о загрузке](docs/reference/components/upload.md).

### Диалоги и уведомления

`Modal`, `Drawer`, `Popover` и `Popconfirm` показывают содержимое и действия
поверх страницы. `App.useApp()` предоставляет доступ к сообщениям, уведомлениям
и диалогам внутри `App`. Для отдельных очередей доступны `createMessage()` и
`createNotification()` вместе с соответствующими `MessageHolder` и
`NotificationHolder`. [Подробнее об App](docs/reference/components/app.md).

### Тема, язык и доступность

`ConfigProvider` задаёт светлую или тёмную тему, цвета, размеры, локаль и
направление интерфейса; вложенные настройки наследуются. Компоненты поддерживают
серверный рендеринг, а интерактивные элементы — управление с клавиатуры и работу
с фокусом. Подробности: [темы и локализация](docs/reference/themes.md),
[клавиатура и фокус](docs/reference/keyboard.md).

## Куда перейти дальше

- [Каталог компонентов](docs/reference/components/README.md) — список и подробное описание каждого компонента.
- [Формы и валидация](docs/reference/forms.md) — модели, поля, правила и отправка.
- [Темы и локализация](docs/reference/themes.md) — оформление, размеры и язык интерфейса.
- [Клавиатура и фокус](docs/reference/keyboard.md) — управление компонентами и доступность.
- [Покрытие Ant Design](docs/reference/ant-design-porting/status.md) — реализованные возможности и оставшиеся отличия.

Точные типы `props`, `callbacks`, `snippets` и `refs` находятся в исходных объявлениях
компонентов и экспортируются через [публичную точку входа](src/lib/index.ts).

## Разработка

Установка зависимостей, проверки и сборка выполняются из корня репозитория:

```sh
npm ci
npm run lint
npm run check
npm test
npm run build
```

Команды проверки собранного пакета, браузерных сценариев и реестра описаны в
[руководстве разработчика](docs/development.md).

## Лицензия

Проект распространяется под MIT.
