# Темы и локализация

ConfigProvider принимает `theme={{ mode, primary, compact }}`, где `mode` равен
`light` или `dark`, а `primary` — `blue`, `purple` или `green`.
`componentSize` равен `small`, `medium` или `large`. Обычный размер по умолчанию — `medium`;
устаревшие значения `middle` и `size="default"` удалены.
[Замеры исходника](current-size-observation.md) объясняют границы сравнения.
 Вложенный провайдер наследует
неуказанные настройки родителя. `componentDisabled` можно переопределить на
отдельном control.

ConfigProvider.variant и Form.variant задают общее оформление полей, Card и
внутренних controls Pagination. Локальные props сохраняют приоритет;
[общий справочник](control-variants.md) описывает fallback Input,
вложенные контексты и component config.

Тёмная тема и компактный режим реализованы локальными CSS-переопределениями.
Spacing использует size map 6.6.8: compact size/SM=8, XS/XXS=4, LG/MD=16,
MS=12, XL=32, XXL=48px с padding/margin/content aliases. Каждый provider
разрешает aliases в собственном scope; явный compact=false восстанавливает
обычные интервалы, inline CSS variables сохраняют приоритет. Проверки геометрии
Card/Flex/Divider и вложенных provider — `tests/browser/theme.spec.ts`, `?fixture=theme`.

`compact: true` согласует fontSize/lineHeight/fontHeight и высоты controls с
compactAlgorithm, а Button/Input/TextArea/InputNumber получают рассчитанные
font/padding metrics при SSR. Для Input, Select, InputNumber и Button medium=28px,
large=35px. В small первые три имеют минимум 22px из-за строки и рамок,
Button — 21px, как в React 6.6.8. Native цвета сохраняются; пустой `token: {}`
для корректной геометрии не требуется. Браузерная сверка —
[compact-theme](../../tests/browser/compact-theme.spec.ts), `?fixture=compact-theme`.

ConfigProvider также принимает source token/algorithm, наследование и настройки
hash/CSS variables. `theme.useToken()` возвращает реактивный объект с текущими
GlobalToken, Theme, hashId и transformed CSS-variable token. Глобальные переменные
передаются компонентам уже при SSR; native темы сохраняют прежние цвета,
а compact metrics описаны выше. Компонентные overrides подключены, в частности, к Button,
Input/TextArea (включая Password/Search/OTP), InputNumber, Space/SpaceAddon, Layout,
Radio/RadioButton/RadioGroup, Checkbox/CheckboxGroup, Switch, Avatar/AvatarGroup и Badge;
полное покрытие CSS-потребителей ещё переносится. Примеры и точная граница —
[в справочнике контекста темы](theme-context.md).

ConfigProvider.wave управляет эффектом Button, Checkbox, Radio/RadioButton,
Switch, интерактивного Tag и Steps. Доступны disabled, showEffect с полным
GlobalToken и пять типов trigger. Настройки наследуются; явный record заменяет
родительский целиком. Targets, timing и Svelte boundaries описаны
[в справочнике Wave](wave.md).

ConfigProvider.getPopupContainer задаёт `(trigger?: HTMLElement) => HTMLElement | ShadowRoot`.
Вложенный provider наследует функцию, когда его prop отсутствует или равен undefined;
theme.inherit=false не сбрасывает эту настройку. Она подключена к Tabs, ColorPicker,
Tooltip, Popover, Popconfirm, Dropdown, Slider, Tooltip внутри Typography,
Select, AutoComplete, TreeSelect, Cascader, Menu, Modal, Drawer, DatePicker, RangePicker, TimePicker
и TimeRangePicker;
остальные потребители исходного API ещё требуют переноса. Tour и Mentions используют
только собственный getPopupContainer, как Ant Design 6.6.8.
Функция вызывается только в браузере. Без выбранной функции сохраняется прежнее
native размещение компонента. Для ShadowRoot стили размещает потребитель;
стили document автоматически в него не переходят. Обновление функции с тем же
DOM-контейнером сохраняет popup, его state, фокус и выделение текста. Проверки —
[popup-container](../../tests/browser/popup-container.spec.ts) и `?fixture=popup-container`;
30 сценариев наследования и приоритетов сверены с официальным UMD.
Для общих overlay-компонентов добавлены ещё 52 эталона:
[overlay-container](../../tests/browser/overlay-container.spec.ts), `?fixture=overlay-container`.
В этой сверке default обозначает исходное native размещение без пользовательского
контейнера; DOM не переносится в body автоматически. ShadowRoot проверяется с
собственными стилями потребителя. При закрытии сохраняется прежний native lifecycle.
Select/AutoComplete добавляют 32 эталона в
[select-container](../../tests/browser/select-container.spec.ts), `?fixture=select-container`.
TreeSelect/Cascader добавляют 40 эталонов в
[choice-container](../../tests/browser/choice-container.spec.ts), `?fixture=choice-container`.

`ConfigProvider.popupOverflow` принимает `PopupOverflow = 'viewport' | 'scroll'`
для Select, TreeSelect, Cascader и AutoComplete, включая вложенные Select.
По умолчанию используется viewport; отсутствующий prop и `undefined` наследуют
родительское значение, явный viewport сбрасывает scroll. Режим scroll выбирает
область документа для расчёта переполнения; вертикальный shift по-прежнему учитывает
видимую область. Настройка не меняет собственные popup Tooltip, DatePicker,
Mentions или CascaderPanel. Смена режима обновляет карту для следующего исходного
выравнивания (открытие, resize или scroll), сохраняя текущие координаты до такого
события. Native сохраняет DOM parent, state и фокус; Select также использует
fixed top layer без обязательного `getPopupContainer`.
[Прямые сценарии](../../tests/browser/popup-overflow.spec.ts),
[strict hydration](../../tests/browser/popup-overflow-hydration.spec.ts) и
[SSR](../../tests/package/popup-overflow.ssr.test.ts) проверяют эту настройку.
[Пары вложенных компонентов](../../tests/browser/popup-overflow-smoke.spec.ts)
проверяют наследование и отсутствие влияния на другие popup; полное числовое
совпадение layout этих семейств они не подтверждают. Прежний Native контракт
Select сохраняется: закрытие не вызывает `onSearch`, controlled query очищает владелец.

`ConfigProvider.popupMatchSelectWidth` задаёт общий default для Select,
AutoComplete и TreeSelect. Вложенный provider наследует отсутствующее значение
и `undefined`; собственные `true`, `false` и число заменяют ближайшую настройку.
Cascader использует свой локальный prop. Pagination по умолчанию передаёт
локальный `false`, затем применяет props владельца `showSizeChanger`; Calendar
наследует общую ширину. ColorPicker задаёт внутреннему Select локальную ширину 68
и собственный контейнер. Calendar также сохраняет свои меню в header.
[Эталонные сценарии](../../tests/browser/popup-width.spec.ts),
[вложенные controls](../../tests/browser/popup-width-nested.spec.ts),
[пользовательские padding/border](../../tests/browser/popup-width-height.spec.ts),
[strict hydration](../../tests/browser/popup-width-hydration.spec.ts) и
[SSR](../../tests/package/popup-width.ssr.test.ts) проверяют эти правила.

Статические defaultSeed, default/dark/compact algorithms и getDesignToken
работают без context и DOM. Их source-округления, overrides и ограничения описаны
[в справочнике design tokens](design-tokens.md).

По умолчанию используется `ruRU`; `enUS` также экспортируется. `locale` принимает
частичное переопределение подписей кнопок и служебных сообщений. Вложенная группа
`locale.pagination`, `locale.table` и `locale.inputNumber` также объединяются с настройками родителя по отдельным
подписям. Тексты правил валидации задаются в `message` или возвращаются из validator.

