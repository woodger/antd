# Rate

Rate следует Ant Design и @rc-component/rate.
Изучены wrapper, style, demo, tests и делегированные Rate/Star/util.
[MIT-лицензия rc-rate](../../../src/lib/vendor/LICENSE.rc-rate) включена в пакет;
React runtime и новые npm dependencies не добавляются.

```svelte
<script lang="ts">
  import { Rate } from 'antd-svelte';
  let value = $state(2.5);
</script>
<Rate aria-label="Оценка" {value} allowHalf
  tooltips={['Очень плохо', 'Плохо', 'Нормально', 'Хорошо', 'Отлично']}
  onChange={next => { value = next; }} />
```

Value управляется владельцем через onChange; без value используется внутреннее
значение с defaultValue=0. Count=5 принимает целое неотрицательное число, как
new Array(count) в upstream. Значения и fractions владельца не округляются и
не ограничиваются count. Уменьшение count не меняет value. Native form reset
не сбрасывает внутренний выбор; собственное поле FormData не создаётся.

AllowHalf=false по умолчанию. При allowHalf половина определяется координатой
относительно исходного li, с обратной стороной в RTL; точный midpoint даёт полную
оценку. Hover показывает временный выбор без onChange. OnHoverChange получает
также undefined при выходе и перед публикацией клика. AllowClear=true очищает
повторный выбор до 0; этот же hover подавляется до другой позиции/выхода.
AllowClear=false повторно публикует то же value. Внешняя смена props не вызывает
callbacks. Смена controlled value на undefined очищает внутренний fallback,
как useControlledState зависимости; новое нажатие снова задаёт значение.

ArrowLeft/Right изменяют значение на 1 либо 0.5, направление обратное в RTL.
Фокус при этом не перемещается. Исходная арифметика сохраняется без clamp:
например, внешнее 4.8 при count=5 и allowHalf=true увеличивается до 5.3.
OnKeyDown вызывается после изменения; обработанная стрелка получает preventDefault.
Keyboard=false отключает стрелки; Enter на символе по-прежнему выбирает полное
значение и предотвращает дублирующий native click. Focus/blur callbacks следуют
всплывающему изменению фокуса.

Character — строка, число или Snippet<[RateCharacterInfo]>; snippet получает
index/count, временное отображаемое value, allowHalf/disabled/focused, prefixCls
и исходные onHover(event,index)/onClick(event,index). Он рендерится в двух слоях
звезды, как исходный character. CharacterRender —
Snippet<[Snippet,RateCharacterInfo]> с исходным star snippet; как rest override
Ant wrapper, он заменяет автоматическую Tooltip composition. Tooltips принимает
строки или поддерживаемые локальные TooltipProps без children. Tooltip использует
существующую обёртку с display:contents; отступы между stars сохранены.

Непустой prefixCls задаёт локальные классы Rate; empty/undefined наследуют
ConfigProvider.prefixCls. Состояния, слои звёзд и RateCharacterInfo.prefixCls
используют разрешённый prefix. Tooltip сохраняет самостоятельный общий namespace;
canonical component token marker/variables не переименовываются. Scoped CSS
использует те же 21 правило с native button adapter. Смена local/shared prefix
сохраняет оценку, DOM/ref, focus и соседний draft/selection/FormData.
Сверка с неизменённым UMD: [reference](../../../tests/browser/fixtures/ant-design-rate-prefix-reference.json),
[browser](../../../tests/browser/rate-prefix.spec.ts),
[SSR](../../../tests/package/rate-prefix.ssr.test.ts), `?fixture=rate-prefix`.

Size принимает small/medium/large, наследует componentSize.
Disabled наследует общий disabled-контекст, включая Form; явный false имеет
приоритет. ConfigProvider.rate принимает class/style, локальные class/rootClassName
добавляются, style накладывается после контекстного. Вложенный явно заданный rate
config заменяет родительский. Light/dark, compact, RTL и reduced motion реактивны;
CSS variables --ant-rate-star-color/size/size-sm/size-lg/bg/hover-scale и
--ant-rate-line-width-focus допускают явный inline override.

ConfigProvider.theme.components.Rate применяет все шесть компонентных токенов
со строковым starHoverScale. LineWidthFocus подготавливается по исходному правилу
из lineWidth/lineWidthFocus. Поддержаны нули, undefined, global/component aliases
и algorithms, cssVar.prefix, вложенные/reset/sibling providers, hover/focus и
disabled. Переменные темы идут перед ConfigProvider.rate.style и локальным style;
смена темы сохраняет оценку, radio DOM, фокус, refs и callbacks.
Сверка: [UMD](../../../tests/browser/fixtures/ant-design-rate-theme-reference.json),
[SSR](../../../tests/package/rate-theme.ssr.test.ts),
[browser](../../../tests/browser/rate-theme.spec.ts), `?fixture=rate-theme`.

Массивы и CSSObject в starHoverScale пока не исполняются. Ant Design 6.6.8
не регистрирует для них CSS variable, поэтому его hover transform становится none.
Это наблюдение записано в реестре; native сохраняет прежний scale(1.1).
Пользовательские CSS variables/styles перекрывают этот fallback. Полный CSSObject
API, включая исходные _multi_value_/_skip_check_ markers, остаётся отдельным пробелом.

Bind:this предоставляет focus()/blur(), которые игнорируются при disabled;
bind:nativeElement возвращает ul. AutoFocus применяется только после mount,
SSR не обращается к DOM и не вызывает callbacks. Нативные button type=button
заменяют исходные div role=radio: дополнительно доступна активация Space, корневая
ul получает radiogroup и видимый focus. Исходные cumulative aria-checked,
aria-posinset/setsize и отдельные tab stops сохранены. Декоративные копии символов
скрыты от accessibility tree; имя кнопки — её one-based номер.

[vendor/rate.css](../../../src/lib/vendor/rate.css) содержит все 21 правило из закреплённого
npm-архива с проверкой SHA-256; рецепт rate адаптирует >div к >button, declarations
сохранены. Rate.svelte дополняет native reset styles, focus и reduced motion.
StarFilled SVG взят из Ant Design Icons SVG 4.6.0 с существующей MIT-лицензией.
Галерея — `/ant-design#rate`, fixture — `?fixture=rate`; unit/SSR и browser
сценарии проверяют значения, callbacks, геометрию, контексты и cleanup.

Полный upstream Tooltip API ограничен текущим публичным
Svelte Tooltip. Эти части не считаются покрытыми переносом Rate.


