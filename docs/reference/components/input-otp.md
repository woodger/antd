# InputOTP (Input.OTP)

InputOTP переносит OTP/index.tsx и OTPInput.tsx Ant Design. Каждая ячейка
использует Input; группа сохраняет role=group, классы ant-otp и исходные labels
«OTP Input 1», «OTP Input 2» и далее. Точные Props и настройки находятся в
[исходных типах](../../../src/lib/input-otp.types.ts).

```svelte
<script lang="ts">
  import { InputOTP } from 'antd-svelte';
  let code = $state('');
</script>

<InputOTP value={code} onChange={next => { code = next; }}
  formatter={text => text.replace(/\D/g, '')} autoComplete="one-time-code"
  aria-label="Код подтверждения" />
```

По умолчанию есть шесть ячеек, type=text и любое текстовое содержимое. Каждая
ячейка — одна UTF-16 code unit, как в source split(''); цифры не фильтруются
без formatter. Native size=1 задаёт ширину, maxlength=1 не устанавливается:
вставка нескольких символов распределяет их по ячейкам и заменяет оставшийся
хвост. Formatter получает всю строку с пробелами на пустых позициях до обрезки
до length. Пустые промежуточные позиции сохраняются, пустой хвост удаляется.

OnInput вызывается для каждого native input с массивом ячеек; onChange следует
за ним только для полностью заполненного изменившегося кода. Очистка, неполный
код и повторное событие с прежним полным кодом не вызывают onChange. Как в
upstream, composing input обрабатывается сразу, без отдельного IME-буфера.
Изменение props не вызывает onInput/onChange.

Value синхронизируется при изменении prop. Неизменённый value не отклоняет
локальный draft; снятие контроля сохраняет текущие ячейки. Bind:value не добавлен:
для полного значения используйте onChange, для частичного — onInput. DefaultValue
фиксируется при создании и проходит formatter; внешний value formatter не
проходит. Сохранено SSR-поведение upstream: сервер использует defaultValue,
а value применяется после mount. Для начального SSR-кода можно задать оба значения.

Фокус не пропускает предыдущие пустые ячейки. ArrowLeft/ArrowRight переходят
между физическими индексами, в том числе в RTL; Backspace из пустой ячейки
возвращает к предыдущей. Ctrl/Meta+z блокируется, как в исходнике. Фокус, мышь
и клавиатура восстанавливают выделение через animation frame; все отложенные
выделения отменяются при unmount. AutoFocus и focus() выбирают первую ячейку,
blur() снимает фокус. Bind:nativeElement возвращает div группы.

Mask=true рисует •, строка — собственный символ, включая emoji; реальное value
остаётся в input. По умолчанию mask выбирает type=password, явный type имеет
приоритет. Separator принимает scalar или factory(index); factory может вернуть
Snippet<[number]>, например через () => snippet. Numeric 0 сохраняется,
false/null/undefined/пустая строка не создают separator; true оставляет пустую
обёртку, как source isReactRenderable.

ConfigProvider.otp задаёт class/style, semantic root/input/separator и variant.
Вложенный объект заменяется целиком. Variant наследуется из otp, затем input;
общий Input config продолжает действовать на ячейки. Clear, унаследованный из
Input config, не меняет OTP: source слушает native input, а не onChange(click).
Size группы наследуется из componentSize; Compact продолжает действовать на
внутренние Input. FormItem id, label и описание ошибки относятся к группе,
а не дублируются на каждой ячейке. Статус и disabled передаются ячейкам; reset
учитывает Form.resetKey, в том числе для неполного кода без onChange.

Стили извлекаются рецептом otp в vendor/otp.css: 16 правил, без keyframes,
с проверкой SHA-256 исходного npm-архива. Fixture `?fixture=input-otp`, engine,
SSR и проверки публичного пакета покрывают эти сценарии. Общий аудит Input
остаётся unreviewed; React dev diagnostics, включая предупреждение о длинной
маске, пока не перенесены. Input component tokens применяются к ячейкам и группе,
включая gap и padding aliases; semantic styles и style сохраняют прежний приоритет.

PrefixCls меняет группу, size/RTL states, input, wrappers, mask и separators.
Непустой local prefix имеет приоритет; empty/undefined наследуют ConfigProvider.
Вложенные Input используют общий input namespace независимо от локального OTP.
Canonical token variables/markers сохраняются. Смена prefix не заменяет группу,
ячейки и wrappers; code, callbacks, refs, focused index и selection сохраняются.

В React 6.6.8 wrappers и mask ошибочно используют общий OTP prefix, игнорируя
локальный. Native передаёт prefix владельца всему OTP. Raw UMD results и public
counterpart с вложенным ConfigProvider, согласованным с локальным prefix, сохранены
раздельно в [эталоне](../../../tests/browser/fixtures/ant-design-input-otp-prefix-reference.json).
Native сохраняет независимый общий Input namespace. Проверки —
`?fixture=input-otp-prefix`, [browser](../../../tests/browser/input-otp-prefix.spec.ts),
[SSR](../../../tests/package/input-otp-prefix.ssr.test.ts); дополнительно сравниваются
стандартный и общий prefix в светлой/тёмной и compact Native theme.

