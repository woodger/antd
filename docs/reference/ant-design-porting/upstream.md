# Локальные исходники Ant Design

[Реестр покрытия и инструменты переноса](readme.md)
содержат сводку возможностей, рецепты CSS и отдельные маршруты браузерных фикстур.

Официальный React-репозиторий используется как эталон при переносе:
`.upstream/ant-design` от корня проекта. Это отдельный Git-клон, исключённый
из Git проекта через корневой `.gitignore`. Рабочая копия закреплена на
[Ant Design 6.6.8](https://github.com/ant-design/ant-design/tree/984592267de88fbf9cdaecc96a56629e721c709d),
commit `984592267de88fbf9cdaecc96a56629e721c709d`.

Для восстановления копии из корня проекта:

```sh
mkdir -p .upstream
git clone --depth 1 --single-branch --branch 6.6.8 https://github.com/ant-design/ant-design.git .upstream/ant-design
git -C .upstream/ant-design rev-parse HEAD
```

Клон содержит файлы релиза с сокращённой Git-историей. Для чтения исходников
установка зависимостей не требуется. Новую целевую версию выбираем отдельно
от переноса очередного компонента.

В `components/<component>/` доступны реализация и типы, `style/`, `demo/`,
`__tests__/` и документация `index.en-US.md`. Например, у Button основной файл —
`components/button/Button.tsx`, у Avatar — `components/avatar/Avatar.tsx`.
Общие механизмы находятся в `components/_util/`, токены и алгоритмы тем —
в `components/theme/`, переводы — в `components/locale/`.

Поиск в исключённой рабочей копии выполняется явно:

```sh
rg --files --hidden --no-ignore .upstream/ant-design/components/avatar
```

Перед переносом сверяем исходник, props, демо и граничные случаи в тестах;
затем реализуем Svelte API, документируем поддержанный объём и проверяем его
в наших unit/SSR/Chromium-тестах. Часть логики Ant Design делегирует пакетам
`@rc-component/*`; для неё также нужны исходники соответствующей версии пакета.
Стили в `vendor/` происходят из опубликованного npm-архива; checkout дополняет
его исходниками и тестами.

