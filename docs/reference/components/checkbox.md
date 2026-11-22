# Checkbox

```svelte
<script lang="ts">
  import { Checkbox } from '@woodger/antd-svelte';

  let checked = $state(false);
  let indeterminate = $state(true);
</script>

<Checkbox bind:checked bind:indeterminate name="notifications" value="enabled">
  Получать уведомления
</Checkbox>
```

`checked` поддерживает привязку и callback `onCheckedChange(checked)`.
Для отдельного control можно задать `defaultChecked`; с привязкой задавайте
начальное значение у владельца. Нативный reset формы возвращает `defaultChecked`
и обновляет привязку. Сброс и внешние обновления props не вызывают
`onCheckedChange`; нативный `onchange` также доступен.

`indeterminate` задаёт смешанное состояние, поддерживает привязку и сбрасывается
при пользовательском переключении. Оно не меняет `checked` и значение FormData.
Отмеченный checkbox передаёт `name=value` (по умолчанию value равен `on`),
неотмеченный или disabled checkbox не включается в FormData.

В FormItem передавайте `checked={form.values.accepted}` и
`onCheckedChange={(value) => form.setFieldValue('accepted', value)}`. Для модели
с boolean задайте тип явно: `createForm<{ accepted: boolean }>(...)`.
Чтобы требовать именно `true`, используйте
`validator: (value) => value === true ? undefined : 'Подтвердите согласие.'`.
Встроенное правило `required` проверяет наличие значения, и `false` считается
заданным значением. `form.resetFields()` возвращает значение из `initialValues`.

OnChange получает `{ target, nativeEvent, stopPropagation, preventDefault }` с
типизированными target.checked/value. Нативный onchange остаётся отдельным DOM
событием. Callback Checkbox вызывается до Group.onChange; прежний onCheckedChange
и сброс indeterminate при пользовательском переключении сохранены. NativeEvent —
DOM change, а не React MouseEvent. Label/input используют исходный click bubble
lock; наружу приходит один click на активацию подписи.

ConfigProvider.checkbox задаёт class/style и semantic root/icon/label, в том числе
для вариантов Group и вложенного provider. Локальные classNames/styles принимают
объекты или функции от фактических checked/indeterminate/disabled props. Приоритет
root style: config.styles.root, config.style, styles.root, style. Title относится
к внутреннему span, как в исходном Checkbox; class/rootClassName/style — к label.
PrefixCls меняет классы; CSS для произвольного префикса предоставляет потребитель.

Bind:inputElement и bind:nativeElement возвращают input и внутренний span;
bind:ref — `{ input, nativeElement, focus(options?), blur() }`. Ссылки очищаются при
unmount. Focus/blur есть и у bind:this. AutoFocus вызывает native focus один раз
при mount; lowercase autofocus сохраняет HTML-поведение. TabIndex — alias tabindex.
OnFocus/onBlur/onKeyDown/onKeyPress работают на input, onMouseEnter/onMouseLeave —
на label. Нативные lowercase handlers сохраняются.

