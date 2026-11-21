# Ant Design для Svelte 5

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-types-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#лицензия-и-источники)

Библиотека компонентов Ant Design для Svelte и TypeScript: элементы интерфейса,
модели форм, темы и локализация.

Поддержанные возможности и известные отличия собраны в [реестре покрытия](docs/reference/ant-design-porting/status.md).

[Примеры компонентов](https://woodger.org/ant-design) · [Документация](docs/README.md) · [Каталог компонентов](docs/reference/components/README.md)

## Подключение

Пакет `antd-svelte` пока имеет статус `private`. Для локальной разработки
соберите его и подключите к приложению, например через
`"antd-svelte": "file:../antd-svelte"`. Потребителю нужны Svelte 5, Day.js и
сборщик с поддержкой Svelte. Точные диапазоны зависимостей указаны в
[package.json](package.json).

```sh
npm ci
npm run build
```

Компоненты импортируются из `antd-svelte`. `ConfigProvider` подключает стили;
если компоненты используются без него, импортируйте `antd-svelte/styles.css`
один раз в корневом layout.

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

## Куда перейти дальше

- [Каталог компонентов](docs/reference/components/README.md) — список и подробное описание каждого компонента.
- [Формы и валидация](docs/reference/forms.md) — модели, поля, правила и отправка.
- [Темы и локализация](docs/reference/themes.md) — оформление, размеры и язык интерфейса.
- [Клавиатура и фокус](docs/reference/keyboard.md) — управление компонентами и доступность.
- [Покрытие Ant Design](docs/reference/ant-design-porting/status.md) — реализованные возможности и оставшиеся отличия.

Точные типы props, callbacks, snippets и refs находятся в исходных объявлениях
компонентов и экспортируются через [публичную точку входа](src/lib/index.ts).

## Разработка

Основные проверки выполняются из корня репозитория:

```sh
npm run lint
npm run check
npm test
npm run build
```

Команды проверки собранного пакета, браузерных сценариев и реестра описаны в
[руководстве разработчика](docs/development.md). Сайт с примерами — отдельный
потребитель и для работы над библиотекой не требуется.

## Лицензия и источники

Проект распространяется под MIT и не связан с командой Ant Design. Сведения о
стороннем коде, стилях и лицензиях приведены в [описании источников](docs/reference/vendor-sources.md).
