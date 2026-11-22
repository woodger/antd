# Руководство разработчика

## Разработка библиотеки

- [Архитектура](architecture/overview.md) — устройство репозитория.
- [UI Architecture](architecture/ui.md) — направление зависимостей и владельцы контрактов.
- [Реестр и CSS-инструменты](reference/ant-design-porting/readme.md) — покрытие и извлечение стилей.
- [Локальный эталон Ant Design](reference/ant-design-porting/upstream.md) — исходники для сверки.
- [Политики разработки](policy/index.md) — правила проекта.
- [История изменений](../CHANGELOG.md).

## Локальная разработка

Установите зависимости и запустите проверки из корня репозитория:

```sh
npm ci
npm run lint
npm run check
npm run check:tests
npm test
npm run build
npm run test:package
```

Служебный CLI библиотеки запускается через `npm run cli -- ...`:

```sh
npm run cli -- --help
npm run cli -- registry check
npm run cli -- registry report
npm run cli -- registry show avatar
npm run cli -- css all --check
```

`npm run build` использует официальный `@sveltejs/package` и создаёт `dist`:
Svelte-компоненты, JavaScript-модули, декларации `.d.ts`, CSS и лицензии vendor.
`npm run dev` обновляет этот каталог в watch-режиме. Тесты исключены из npm-архива.

Браузерные проверки компонентов находятся в `tests/browser`, SSR-проверки
собранного публичного пакета — в `tests/package`. Они используют собственные
фикстуры. Для браузерных проверок установите Chromium:

```sh
npm exec -- playwright install chromium
npm run test:browser
```

Playwright собирает текущий пакет и запускает Vite-стенд на `127.0.0.1:4175`.
`npm run test:package` также начинает со сборки. `npm test` остаётся отдельной
проверкой исходников и инструментов; `check:tests` проверяет типы обоих стендов.

Для `check:tests` используется стандартный TypeScript-движок `svelte-check`.
Опциональный `--tsgo` в этой схеме неверно разрешает часть модулей self-reference
пакета; обычная проверка сохраняет строгие настройки и проверяет тот же набор файлов.

Упаковка собранного пакета для локальной проверки:

```sh
npm pack --ignore-scripts
```

`npm run cli -- registry check` проверяет локальные подтверждения;
`integration:` обозначает стабильный идентификатор проверки потребителя.
Метаданные доступны потребителю через `antd-svelte/porting/registry.json`.
Его исходные файлы и фикстуры проверяются его собственным инструментом; проверка
реестра не подтверждает выполнение тестов; их команды запускаются отдельно.
