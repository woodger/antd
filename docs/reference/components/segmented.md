# Segmented

`Segmented` позволяет выбрать один вариант. Храните выбранное значение в состоянии компонента.

```svelte
<script lang="ts">
  import { Segmented } from '@woodger/antd';

  let period = $state('Неделя');
</script>

<Segmented options={['День', 'Неделя', 'Месяц']} bind:value={period} />
```

Options — строки/числа или объекты value/label/icon/title/tooltip/disabled/class.
Значения должны быть уникальными; число 0 и строка "0" различаются. Label —
строка, число или Snippet; icon — Snippet. Для icon-only задавайте title либо
aria-label option. Пустая строка рядом с icon не создаёт текстовый span и считается
icon-only; числовой 0 отображается. Интервал icon/label задаётся CSS margin.
Title по умолчанию берётся из scalar label без icon,
как в Ant Design. ClassNames/styles поддерживают root/item/label/icon, объект
либо callback ({ props }); styles — CSS-строки. Style перекрывает styles.root.

ConfigProvider.segmented задаёт class/style и classNames/styles всех четырёх slots.
Undefined наследует родительский record; явный record, включая {}, заменяет его
целиком. Slot classes объединяются context → local; root styles идут в порядке
context styles.root → context style → local styles.root → local style.
Callbacks могут возвращать undefined. Они сохраняют существующие native props:
generated name и defaults disabled/block/vertical; size остаётся локальным prop,
даже при наследуемом componentSize. Глобальный callback типизирован для разных
value/options и не меняет выбор значения.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-segmented-config-reference.json),
[SSR](../../../tests/package/segmented/segmented-config.ssr.test.ts),
[browser](../../../tests/browser/segmented/segmented-config.spec.ts), `?fixture=segmented-config`.

ConfigProvider.theme.components.Segmented применяет все восемь компонентных
токенов: padding/фон track, обычный/selected/hover текст и фоны selected/hover/active.
Поддержаны числовой 0, строковая CSS-длина trackPadding, alias tokens,
глобальные и компонентные algorithms, cssVar.prefix и вложенные providers.
Тема обновляет размеры и состояния без сброса selection, focus или radio DOM;
изменение геометрии завершает существующий thumb через ResizeObserver.
Переменные темы идут перед semantic/user styles; native light/dark/compact
сохраняют прежние цвета и размеры.
Сверка: [официальные CSS tokens](../../../tools/fixtures/ant-design-segmented-tokens-reference.json),
[размеры и pseudo states](../../../tests/browser/fixtures/ant-design-segmented-theme-reference.json),
[SSR](../../../tests/package/segmented/segmented-theme.ssr.test.ts) и
[browser](../../../tests/browser/segmented/segmented-theme.spec.ts), `?fixture=segmented-theme`.

Value поддерживает binding, defaultValue читается при создании; без него выбран
первый option, даже disabled. Внешняя смена value не вызывает onChange(value).
Удаление выбранного option не исправляет значение; восстановление option
возвращает checked. Size наследует ConfigProvider, orientation имеет приоритет
над vertical; block и shape=round повторяют оформление эталона. Disabled влияет
на все radio, option.disabled — на один. Как Ant Design 6.6.8, Segmented не
наследует ConfigProvider.componentDisabled; передавайте disabled явно.

Внутри radiogroup — нативные label/input[type=radio]/div label. Name общий
для inputs и уникален между экземплярами по умолчанию. Корень имеет tabindex=0,
если не disabled; native Tab также достигает выбранного radio. Стрелки циклически
выбирают enabled options в порядке массива независимо от RTL и направления.
Смена по стрелке подавляет второе нативное переключение и переводит фокус
на выбранный radio. Bind:nativeElement даёт корневой div.

Сохраняется upstream-контракт FormData: у radio нет value-атрибута, поэтому
выбранный enabled option отправляет "on" под name. Типизированное значение
получайте через binding/onChange. Native reset не меняет модель и не вызывает
onChange; checked после reset приводится к текущему value. Интеграция с FormItem
и сериализация option.value не добавляются скрыто.

При смене значения между существующими видимыми options создаётся штатный thumb.
Layout-геометрия labels (offset/client, без повторного применения CSS scale)
измеряется после обновления DOM; Web Animations API перемещает
индикатор с duration/easing токенов. Во время движения сохраняется selected-text,
а обычный selected фон возвращается после завершения. Повторная смена отменяет
предыдущий запуск. ResizeObserver, смена оси/RTL, изменения options и удаление
компонента очищают animation/observer; reduced motion пропускает либо завершает
движение. SSR не создаёт thumb, observers или animations.

Option.tooltip принимает строку либо props существующего Svelte Tooltip без
children. Поддержаны hover/focus/Escape, в том числе для disabled option.
Локальный Tooltip добавляет служебный span с display:contents и native popover;
label остаётся flex-item для block и измерений thumb. Пользовательский tooltip.style
может переопределить display; это меняет компоновку по явному выбору владельца.
Локальный prefixCls меняет классы корня, options, icon и thumb и подключает
извлечённый CSS для этого префикса. Пустая строка наследует ConfigProvider.prefixCls
(по умолчанию ant-segmented).
Имена CSS variables и общий marker сохраняются; defaults ограничены собственным
корнем. Смена префикса сохраняет radio, значение, фокус и ref, отменяя старый thumb;
при unmount удаляется локальный stylesheet. Поддержаны native и token themes,
размеры, block/round, vertical/RTL, disabled, semantic styles и option Tooltip.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-segmented-prefix-reference.json),
[SSR](../../../tests/package/segmented/segmented-prefix.ssr.test.ts),
[browser](../../../tests/browser/segmented/segmented-prefix.spec.ts), `?fixture=segmented-prefix`.
Segmented наследует ConfigProvider.prefixCls; непустой локальный prefix имеет приоритет.

