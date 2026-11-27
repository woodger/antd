# Input

Input — текстовое поле с поддержкой привязки значения, префикса, суффикса
и очистки.

```svelte
<script lang="ts">
  import { Input } from '@woodger/antd';
  let value = $state('example');
</script>
<Input bind:value prefix="https://" suffix=".org" allowClear
  count={{ show: true, max: 24 }} variant="filled" aria-label="Адрес" />
```

Существующие string bind:value/defaultValue, onValueChange, native oninput/
onchange/onblur, атрибуты и FormItem associations сохраняются. Внешние изменения
не вызывают change callbacks; defaultValue фиксируется при создании. Native
name/required/maxlength/readonly остаются на реальном input, а class/style/hidden
относятся к самому внешнему элементу. ReadOnly/maxLength/autoComplete/autoFocus —
добавочные camel aliases; lowercase native attrs сохраняются. Size принимает
medium, htmlSize задаёт native size отдельно.

Prefix/suffix принимают scalar/Snippet. Без affixes и clear/count остаётся
один input. Prefix/suffix/clear/count добавляют ant-input-affix-wrapper.
Порядок suffix: clear → count → suffix content. Счётчик и очистка следуют
исходным useCount/resolveOnChange правилам; их логика находится в
input-count.engine.ts и input-event.dom.ts. Root class/semantic root styles не
попадают на вложенное поле. Click внутри affix wrapper фокусирует input.
Для внешней композиции используйте SpaceCompact/SpaceAddon.

AllowClear — boolean/{disabled,clearIcon}; непереданные поля наследуют
ConfigProvider.input.allowClear, explicit false выключает control. Default icon —
close-circle SVG, scalar/Snippet меняет его; explicit falsy icon использует '✖'.
Source line-height:0 рассчитан на SVG; текстовому icon задайте размеры/line-height.
Clear button остаётся смонтированной с hidden class при пустом/readonly/disabled
value. Mousedown предотвращает blur; clear фокусирует поле, вызывает
onValueChange(''), onChange(click), onClear, без искусственного native input.

ShowCount/count используют UTF-16 length по умолчанию и custom strategy;
count.show перекрывает showCount. MaxLength — native hard limit, count.max — soft
max/out-of-range; 0 отключает soft limit. Только count.exceedFormatter обрезает
пользовательское значение после завершения IME, сохраняя selection; внешнее value
не обрезается. Formatter получает {value,count,maxLength} и возвращает scalar либо
Snippet<[info]> через ()=>snippet. Счётчик не добавляет live region.

Новый onChange получает native Event proxy со стабильным клонированным input
в target/currentTarget и nativeEvent. Input event имеет type=change, очистка —
click. Selection setters делегируются настоящему input; email/type без selection
не вызывают неподдерживаемые setters. Существующий порядок onValueChange → oninput
сохранён, новый onChange находится между ними; native onchange по-прежнему
срабатывает при native commit. Неизменённый compositionend не вызывает повторный
onChange. Если exceedFormatter изменил результат, change
получает type=compositionend. OnCompositionStart/End и прежние native callbacks
доступны одновременно.

OnPressEnter срабатывает один раз до keyup, блокируется isComposing, сбрасывается
при blur/disabled. OnKeyDown/Up дополняют native handlers. Для type=password,
как upstream, value attribute удаляется отложенно при mount/change/focus/blur;
property value сохраняется, timers очищаются при unmount.

Variant: outlined/filled/borderless/underlined; explicit variant → Form.variant → ConfigProvider.input.variant → ConfigProvider.variant → outlined.
ClassNames/styles поддерживают
root/input/prefix/suffix/clear/count как object или callback({props}), где size и
disabled уже разрешены из контекстов. Root priority: context styles.root → context
style → local styles.root → local style. Без wrapper эти root styles идут после
styles.input. ConfigProvider.input задаёт allowClear/autoComplete/variant/class/
style/classNames/styles; nested config наследуется целиком либо явно заменяется.
Form/FormItem disabled, errors/reset, Compact, темы/compact density, RTL, locale
и reduced motion сохраняются.

Bind:inputElement даёт HTMLInputElement, bind:nativeElement — внешний input/span,
как upstream nativeElement. Bind:this предоставляет focus({cursor:'start'|'end'|
'all',preventScroll}), blur(), select(), setSelectionRange(start,end,direction).
Refs очищаются при unmount. SSR не вызывает callbacks или password timers.
Как в полном CSS эталона 6.6.8, native hidden остаётся на root, но authored
inline-block/inline-flex перекрывает его UA display:none; компонент не добавляет
отдельный скрывающий CSS override.

Fixture `?fixture=input-features` дополняет прежний Input/Select integration.
Unit/SSR и browser проверяют count/IME, focus/Enter, clear/event order, refs,
FormData/FormItem/Compact, variants/semantic styles, темы и RTL.

Input и TextArea поддерживают общий базовый prefixCls: непустой local prefix имеет
приоритет, empty/undefined наследуют ConfigProvider. Корень, affix, размеры,
варианты, clear/count и Compact используют выбранный prefix; canonical token
variables и markers сохраняются. Смена prefix не заменяет leaf/wrapper, сохраняет
value, refs, selection/focus и FormData. Сверка с официальным UMD —
`?fixture=input-prefix`, [browser](../../../tests/browser/input-prefix.spec.ts) и
[SSR](../../../tests/package/input/input-prefix.ssr.test.ts). TextArea сохраняет vertical resize,
autoSize и прежний приоритет semantic styles.

Input.Password, Input.Search и Input.OTP доступны как
InputPassword, InputSearch и InputOTP. Local/shared prefixCls и компонентные
tokens подключены ко всем пяти экспортам. Deprecated internal
classes/structures исключены из переноса. Согласованный string bind:value
сохраняется вместо React controlled rejection/broad value types; native DOM events
и именованные Svelte bindings заменяют SyntheticEvent/ref object. Общий аудит
семейства Input остаётся unreviewed.

