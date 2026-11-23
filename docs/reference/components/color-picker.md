# ColorPicker

ColorPicker выбирает цвет или градиент. Props и snippets описаны в
[color-picker.types.ts](../../../src/lib/color-picker.types.ts), методы Color —
в [color.ts](../../../src/lib/color.ts).

```svelte
<script lang="ts">
  import { ColorPicker, type ColorPickerProps } from '@woodger/antd';
  let color = $state<ColorPickerProps['value']>('#1677ff');
</script>

<ColorPicker value={color} onChange={next => { color = next; }}
  mode={['single', 'gradient']} showText allowClear />
```

Value принимает строку, объект Color из callback, null или массив `{ color, percent }`.
Color сохраняет точность HSV и alpha; повторный разбор строки может её потерять.
Пустое начальное значение очищено. Cleared отличается от прозрачного цвета;
clear сохраняет оттенок и насыщенность, а повторный clear не вызывает callbacks.
`onChange(color, css)` возвращает RGB/linear-gradient CSS независимо от format.
Заданные value/open/format управляются владельцем. Для обновления только после
drag передайте обработчик onChangeComplete; локальный preview до завершения
не меняет текст trigger. DefaultValue/defaultFormat читаются при создании.

Есть HEX sanitization, RGB/HSB inputs, Hue/Alpha и двумерный palette. Native handler
добавляет стрелки клавиатуры для saturation/brightness. Gradient mode поддерживает
добавление interpolated points, crossing, active color, drag deletion и исходный
keyboard Delete, включая удаление последних точек. Переход gradient → single →
gradient восстанавливает кеш, пока single color не изменён. DisabledAlpha сохраняет
исходное условие: текущий alpha учитывается при следующем изменении.

Presets принимают цвета/градиенты, ключи, label/snippet и initial defaultOpen.
ShowText может быть snippet с Color; children заменяет trigger. PanelRender получает
исходный panel snippet и `extra.components.Picker/Presets`, которые можно разместить
в своей композиции. ConfigProvider.colorPicker задаёт class/style, semantic slots
и arrow; локальный style имеет приоритет. Поддерживаются en/ru, alias locale.ColorPicker,
унаследованный размер, Compact, темы и RTL; внутренние цветовые дорожки всегда LTR.

Trigger, clear и presets — native buttons; popup использует native popover,
12 placement, click/hover, arrow/pointAtCenter и getPopupContainer. По умолчанию portal
находится в body; внутри native modal остаётся в dialog. CSS-переменные темы
переносятся общим механизмом с Tour. Локальная функция getPopupContainer имеет
приоритет над ConfigProvider.getPopupContainer; undefined использует provider.
Getter не вызывается до первого открытия. Escape возвращает фокус; outside закрывает
popup. DestroyOnHidden управляет сохранением черновиков;
portal, listeners и timers очищаются. Panel изолирует FormItem и Compact. Как upstream,
ColorPicker не добавляет скрытое поле в FormData; значение передаётся callbacks.
Размещение учитывает прокручиваемую область документа через `visibleFirst`.
Как в React 6.6.8, высокая панель может выходить за границу окна; нижняя группа
палитры в таком случае становится доступной после прокрутки страницы. Открытая
панель расширяет прокручиваемую область даже у короткой страницы и остаётся
открытой, когда trigger уходит за край окна. Tab прокручивает страницу к кнопкам
пресетов, чтобы сфокусированный цвет оставался виден. [Измерения React](../../../tests/browser/fixtures/ant-design-color-picker-short-page-source-reference.json)
содержат короткие окна 1280×360/720 и контроль на длинной странице.

`ConfigProvider.theme.components.ColorPicker` поддерживает alias overrides и
component algorithms, dark/compact, cssVar prefix и вложенные темы. Собственных
public component tokens у ColorPicker 6.6.8 нет. Trigger и popup получают общую
тему; Popover, Collapse пресетов и поля сохраняют независимые темы и исходные
приоритеты CSS. Bright-state пресетов использует глобальный colorBgElevated.

Обновление темы сохраняет popup DOM/position, цвет, незавершённый HEX input,
caret/focus и раскрытие пресетов. Локальные и semantic styles сохраняют приоритет;
popup.root.color меняет внешний popup, содержимое сохраняет исходный colorText
reset. Проверки и 15 UMD-тем — [color-picker-theme](../../../tests/browser/color-picker-theme.spec.ts),
`?fixture=color-picker-theme`.

`prefixCls` локально меняет owner ColorPicker и перекрывает общий префикс
ConfigProvider. Popover, Select/Input/InputNumber, Slider, Divider, Segmented и Collapse
сохраняют свои общие namespaces; CSS variables и theme markers остаются canonical.
Обновление префикса сохраняет открытый popup, цвет, незавершённый HEX, caret/focus,
раскрытие пресетов и custom trigger/container. Возврат к оформлению по умолчанию
также сохраняет эти состояния. Сверка с UMD —
[color-picker-prefix](../../../tests/browser/color-picker-prefix.spec.ts),
`?fixture=color-picker-prefix`.

В Source кеш style hook при одинаковом локальном owner/theme и изменённом общем
префиксе сохраняет selectors дочерних controls от первого provider. Native разрешает
их независимо. Raw замеры вложенного случая хранятся отдельно от public counterpart
с уникальным локальным prefixCls; разные классы не выдаются за одинаковый DOM.

Остаются полный rc-trigger overflow/motion API и React
development/PurePanel API. Native DOM и Svelte snippets заменяют React nodes/refs.
Извлечённый [CSS](../../../src/lib/vendor/color-picker.css) воспроизводится рецептом из 94 правил.
Логика сопровождается MIT [FastColor](../../../src/lib/vendor/LICENSE.fast-color) и
[rc-color-picker](../../../src/lib/vendor/LICENSE.rc-color-picker). Formatter/parser опираются
на [rc-input-number 1.6.2](../../../src/lib/vendor/LICENSE.rc-input-number).
Проверки: [engine](../../../src/lib/color-picker.engine.test.ts),
[package SSR](../../../tests/package/color-picker.ssr.test.ts),
[browser](../../../tests/browser/color-picker.spec.ts); fixture: `?fixture=color-picker`.

