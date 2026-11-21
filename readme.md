# Ant Design для Svelte 5

`antd-svelte` — перенос компонентов Ant Design React на Svelte 5 и TypeScript.
Посмотреть компоненты в действии можно в [галерее](https://woodger.org/ant-design).

## Подключение

Пакет приватный. Соберите его из клона репозитория.

```sh
npm ci
npm run build
```

В соседнем приложении на Svelte 5 выполните `npm install ../antd-svelte` и добавьте кнопку в любой компонент.

```svelte
<script lang="ts">
  import { Button } from 'antd-svelte';
  import 'antd-svelte/styles.css';
</script>

<Button type="primary">Сохранить</Button>
```

## Документация

- [Настроить тему и локаль через ConfigProvider](docs/reference/components/configuration.md).
- [Найти компонент и примеры его использования](docs/reference/components/readme.md#компоненты).
- [Запустить локальный стенд](docs/reference/development.md#локальный-стенд).
- [Проверить покрытие переноса из Ant Design](docs/reference/ant-design-porting/status.md).

Руководства для разработчиков приложений и библиотеки собраны в [оглавлении](docs/readme.md).
Правила изменений описаны в [политиках проекта](docs/policy/index.md).

## Публичный API

- `antd-svelte` экспортирует компоненты, типы и утилиты. [Список экспортов](src/lib/index.ts) · [Объявления типов и компонентов](src/lib).
- `antd-svelte/styles.css` подключает общие стили. `ConfigProvider` импортирует их сам.
- `antd-svelte/porting/registry.json` содержит сведения о покрытии, известных расхождениях и ревизии React-эталона. [Реестр переноса](docs/reference/ant-design-porting/registry.json).

Пути импорта и требования к зависимостям задаёт [package.json](package.json).
