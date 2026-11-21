# Ant Design для Svelte 5

[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-types-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](#лицензия-и-источники)

Библиотека компонентов Ant Design для Svelte и TypeScript: элементы интерфейса,
модели форм, темы и локализация.

[Примеры компонентов](https://woodger.org/ant-design) · [Документация](docs/README.md) · [Каталог компонентов](docs/reference/components/README.md)

## Основные возможности

- Компоненты для ввода данных, навигации, таблиц, диалогов и уведомлений.
- Формы с валидацией, отправкой и сбросом значений.
- Светлая и тёмная темы, настройка цветов и размеров, локализация и RTL.
- Привязка значений через Svelte `bind:`, настройка содержимого через `snippets`.
- Серверный рендеринг, управление с клавиатуры и работа с фокусом.

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

## Лицензия и источники

Проект распространяется под MIT. Сведения о стороннем коде, стилях и лицензиях
приведены в [описании источников](docs/reference/vendor-sources.md).
