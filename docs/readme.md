# Документация antd-svelte

## Я подключаю библиотеку к приложению

- Соберите пакет и откройте [пример кнопки на локальном стенде](reference/development.md#локальный-стенд).
  Для своего приложения используйте [пример подключения со стилями](reference/components/readme.md#подключение).
- Найдите компонент по имени, чтобы посмотреть примеры, поведение и ограничения.
  [Справочник компонентов](reference/components/readme.md#компоненты).
- Привязка полей, валидация и вывод ошибок описаны в [руководстве по формам](reference/components/forms.md).
  Сочетания клавиш и возврат фокуса — в [справочнике по клавиатуре](reference/components/keyboard-and-focus.md).
- Тема, локаль и общий префикс задаются через [ConfigProvider](reference/components/configuration.md).
  Отдельно разобраны [варианты оформления](reference/control-variants.md),
  [пустые состояния](reference/render-empty.md) и [эффект нажатия Wave](reference/wave.md).

## Я изменяю библиотеку

- Начните со [сборки и локальных проверок](reference/development.md). Найти владельца контракта
  помогут [обзор архитектуры](architecture/overview.md) и [границы зависимостей UI](architecture/ui.md).
- Если меняете тему, сверьте [расчёт токенов](reference/design-tokens.md)
  и [наследование контекста ConfigProvider](reference/theme-context.md).
- Правила для конкретного изменения собраны в [политиках разработки](policy/index.md).
  Заметные изменения публичного поведения перечислены в [истории изменений](../CHANGELOG.md).

## Я проверяю перенос с Ant Design

- Для ответа «что поддержано?» откройте [сводку по семействам](reference/ant-design-porting/status.md).
  Конкретную возможность, ревизию эталона и ссылки на подтверждения ищите в [исходном реестре](reference/ant-design-porting/registry.json).
- Чтобы воспроизвести сравнение, подготовьте [исходники эталона](reference/ant-design-porting/sources.md#локальные-исходники-ant-design)
  и откройте [инструкции по проверке реестра и CSS](reference/ant-design-porting/readme.md).
  Происхождение заимствованных материалов описано в [разделе о лицензиях](reference/ant-design-porting/sources.md#источник-и-лицензия).
- Примеры измерений на закреплённой версии приведены для [размеров компонентов](reference/current-size-observation.md)
  и [индикатора Anchor](reference/anchor-indicator-observation.md).
