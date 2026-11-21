# TextArea (Input.TextArea)

Отдельный экспорт TextArea соответствует React Input.TextArea. Базовый объём
включает bind:value/string, defaultValue, name, rows, cols, maxlength, minlength,
required, disabled, readonly, placeholder, autocomplete и остальные native
атрибуты textarea. Значение не обрезается программно до maxlength: как upstream,
ограничение применяется браузером при пользовательском вводе, но управляемое
значение может превышать его. DefaultValue фиксируется при создании, value имеет
приоритет; после редактирования value=undefined очищает поле, как у местного Input.

OnValueChange получает строку на каждом input, затем вызывается native oninput.
Onchange остаётся native change (при завершении редактирования), onselect,
onbeforeinput, composition и keyboard events передаются textarea. OnPressEnter
вызывается перед onkeydown, кроме Enter с isComposing=true; стандартная вставка
переноса строки сохраняется, если callback не вызвал preventDefault().
Bind:nativeElement даёт HTMLTextAreaElement для focus/blur/select/setSelectionRange
и чтения selectionStart/selectionEnd/selectionDirection.

Size и status=error|warning, Compact, RTL, темы, Form/FormItem disabled, name/id,
required, aria-invalid и описания ошибок наследуются из существующих контекстов.
Явные props имеют приоритет. Form.resetFields восстанавливает привязанное поле
через модель формы. Без allowClear/showCount/count.show поле остаётся одним native
textarea; autoSize сам по себе wrapper не добавляет. Счётчик и clear используют
исходные ant-input-affix-wrapper/ant-input-textarea-affix-wrapper.

```svelte
<script lang="ts">
  import { TextArea } from 'antd-svelte';
  let description = $state('');
</script>
<label for="description">Описание</label>
<TextArea id="description" name="description" rows={4} maxlength={2000} required bind:value={description} />
```

Расширенный объём следует Ant Design 6.6.8 / @rc-component/input 1.3.1 (~1.3.1):
изучены TextArea/BaseInput/ResizableTextArea, calculateNodeHeight, useCount,
useCountDisplay/useCountExceed, resolveOnChange, Ant wrapper/style/tests и
@rc-component/resize-observer 1.1.2. Используются существующие CSS Input/TextArea
из [vendor/antd.css](../../../src/lib/vendor/antd.css) и [лицензия rc-input](../../../src/lib/vendor/LICENSE.rc-input).
Новые npm dependencies не добавляются.

AutoSize=true измеряет значение либо placeholder; {minRows,maxRows} ограничивает
высоту. Измерение учитывает box-sizing, padding/border, шрифты, ширину и wrap.
При maxRows появляется vertical scroll; без превышения maxRows overflowY=hidden.
AutoSize устанавливает resize:none; при отключении возвращаются authored styles.
Один скрытый textarea на document повторяет исходное измерение; в Svelte он имеет
native tabIndex=-1 и удаляется после последнего потребителя. ResizeObserver
дедуплицирует floor/offset размеры, вызывает onResize({width,height}) и переносит
измерение в RAF. Frames/observer/mouseup listener и ref bindings очищаются.
Ручной resize:both при mousedown отмечает dirty wrapper; onResize также сохраняет
исходное правило height:auto для непустого wrapper после задания textarea.height.

ShowCount=true выводит UTF-16 length, включая две units на surrogate pair.
Native maxLength (либо прежний maxlength) остаётся ограничением браузера. Count.max
переопределяет отображаемый максимум, но сам по себе не обрезает value;
превышение добавляет ant-input-out-of-range без подмены Form validation.
Count.max=0 отключает soft range/clip. Count.strategy меняет подсчёт. Обрезание
включается только через count.exceedFormatter(value,{max}) и только при заданном
count.max, после завершения composition. Внешние значения не обрезаются;
selection сохраняется с native clamping. Count.show перекрывает showCount,
включая явно переданный show:undefined. ShowCount.formatter и count.show formatter
получают {value,count,maxLength}, возвращают string/number либо Snippet<[info]>;
для rich content используйте formatter:()=>snippet. Счётчик не добавляет live region.

AllowClear принимает boolean или {disabled,clearIcon}; icon — scalar/Snippet.
Непереданные icon/disabled наследуют ConfigProvider.textArea.allowClear. Явный
false отключает clear, а объект disabled=false перекрывает context disabled.
Как source, кнопка остаётся смонтированной с hidden class для пустого/disabled/
readonly значения. Pointerdown сохраняет focus. Очистка фокусирует textarea,
вызывает onValueChange(''), onChange с type=click, затем onClear; native oninput
искусственно не отправляется. Falsy explicit clearIcon использует исходный '✖';
для текстового icon задайте его размеры/line-height, поскольку Source button
использует line-height:0, рассчитанный на SVG.

Новый onChange получает объект с клонированным textarea target/currentTarget и
стабильным value, как resolveOnChange. При input его type=change, nativeEvent
содержит исходный DOM event; compositionend и clear сохраняют соответствующие
типы событий. Target.setSelectionRange делегирует настоящему textarea. Это native
Event proxy с делегированными DOM methods, а не React SyntheticEvent runtime.
Прежний порядок onValueChange → native oninput сохранён; onChange находится между
ними. Compositionend вызывает onChange, не дублируя legacy input callback, кроме
изменённого exceedFormatter значения. Camel callbacks onFocus/onBlur/onKeyDown/
onMouseDown/onCompositionStart/End дополняют прежние native handlers.

Variant поддерживает outlined/filled/borderless/underlined. Explicit variant имеет
приоритет над Form.variant, component config и общим variant; fallback — outlined.
ClassNames/styles принимают root/textarea/clear/
count либо callback({props}); props отражает текущий Svelte value. Context и local
semantic styles объединяются, root style идёт после соответствующих semantic root
styles. Root resize переносится в textarea; styles.textarea имеет приоритет над
этим resize. Без wrapper root styles, как source, идут после textarea styles.
ConfigProvider.textArea поддерживает allowClear/autoComplete/variant/class/style/
classNames/styles; явно заданный nested config заменяет родительский.

Bind:nativeElement по прежнему возвращает HTMLTextAreaElement. Новый rootElement
даёт textarea либо span-wrapper; bind:this предоставляет focus({cursor:'start'|
'end'|'all',preventScroll})/blur(). Native autocomplete/readonly и aliases
maxLength/readOnly/autoComplete/autoFocus сохранены на реальном control. SSR не
создаёт ResizeObserver/shadow и не вызывает resize/change callbacks.

Галерея `/ant-design#textarea` сохраняет старый пример и добавляет расширенный.
Fixture `?fixture=textarea-features` дополняет `?fixture=textarea`. Unit/SSR и browser
проверяют count/clear/IME, размер и cleanup, native refs/events/Form, темы и RTL.

Сохраняется согласованный строковый bind:value: он не заменяется React controlled
rejection. React broad value types и исходный ref shape resizableTextArea
не добавлены; refs представлены именованными Svelte bindings. Local/shared
prefixCls и component token engine Input подключены, как у обычного Input. Полный аудит всего
семейства Input, включая прочие subcomponents, остаётся незавершённым.

