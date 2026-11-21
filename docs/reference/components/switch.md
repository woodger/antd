# Switch

Switch переключает boolean-состояние через `bind:checked` и
`onCheckedChange(checked)`. Отдельному control можно задать defaultChecked;
он фиксируется при создании. С привязкой задавайте начальное значение у
владельца без defaultChecked. Внешние изменения checked не вызывают callback.

```svelte
<script lang="ts">
  import { Switch } from 'antd-svelte';

  let notifications = $state(false);
</script>

<Switch id="notifications" bind:checked={notifications} name="notifications">
  {#snippet checkedChildren()}Вкл{/snippet}
  {#snippet unCheckedChildren()}Выкл{/snippet}
</Switch>
<label for="notifications">Уведомления</label>
```

Компонент использует button с type=button, role=switch и aria-checked.
Space, Enter, нажатие control или связанной подписи меняют состояние один раз
и не отправляют форму. Нативный onclick доступен; preventDefault в этом
обработчике отменяет переключение. Доступное имя задаётся через label,
FormItem или aria-label/aria-labelledby. Snippets checkedChildren и
unCheckedChildren предназначены для коротких подписей и декоративных иконок.
Они скрыты от accessibility tree, поэтому имя control не меняется вместе
с текстом состояния.

Размеры — medium и small. По умолчанию наследуется componentSize;
small включает малый размер, medium/large провайдера используют обычный.
Явный size переопределяет наследование. Disabled наследуется из Form/FormItem
и ConfigProvider, disabled=false переопределяет его. Loading показывает
индикатор, выставляет aria-busy и блокирует действия даже с disabled=false.
Существующее checked-состояние при блокировке сохраняется. Стили поддерживают
светлую/тёмную тему, основные цвета, RTL и prefers-reduced-motion.

С name или FormItem.name включённый доступный Switch передаёт `name=on` в
нативную FormData, как Checkbox. `new FormData(form).get('notifications')`
возвращает 'on' либо null; false, disabled и loading исключают поле.
Модель Form при этом хранит boolean, включая false. Атрибут form связывает
control с внешней формой. Нативный reset восстанавливает defaultChecked
и обновляет привязку в следующей задаче после события, без callbacks.
Отменённый reset сохраняет текущее состояние. При удалении Switch ожидающий
reset отменяется.

Для Form передавайте `checked={form.values.notifications}` и
`onCheckedChange={(value) => form.setFieldValue('notifications', value)}`.
FormItem передаёт id, имя, required, ошибки и описание кнопке. Ошибка формы
переводит фокус на Switch; blur отмечает поле touched. Reset формы использует
resetFields модели. Правило required считает false заданным значением;
для обязательного включения задайте custom validator:
`validator: (value) => value === true ? undefined : 'Включите настройку.'`.
Проверкой значения управляют правила Form.

Сохранение и ошибки остаются у владельца: Switch сообщает новое состояние,
а владелец задаёт checked и loading. Галерея `/ant-design#switch` содержит
пример асинхронного сохранения с [моделью состояния](https://woodger.org/ant-design#switch):
ожидание блокирует повторные запросы, успех подтверждает значение, ошибка
возвращает последнее сохранённое состояние, следующая попытка очищает ошибку.
При удалении примера запрос отменяется, поздний результат игнорируется.
Флажок ошибки в примере влияет только на следующее сохранение. Ниже показан
малый Switch с проверкой и сбросом Form.

Value/defaultValue — aliases checked/defaultChecked. Определённый checked имеет
приоритет над value; defaultChecked, включая false, — над defaultValue. Defaults
фиксируются при создании. Value поддерживает bind:value; задавайте начальный boolean
у владельца и используйте один способ привязки на протяжении жизни control.
Checked/value сохраняют существующие Svelte state conventions: для отклонения
пользовательского изменения используйте getter/setter function binding.

OnChange(checked, event) и onClick(checked, event) получают native MouseEvent либо
KeyboardEvent с button в currentTarget. При click сначала работает прежний native
onclick, способный отменить переключение, затем onCheckedChange, onChange и onClick.
ArrowLeft задаёт false, ArrowRight — true, в том числе в RTL. Повторная стрелка
вызывает onChange даже при том же состоянии, как rc-switch; onClick не вызывается.
OnKeyDown и native onkeydown работают после обработки стрелок. Внешние обновления
и reset не вызывают source callbacks. OnFocus/onBlur дополняют lowercase handlers.
Синтетические keydown используют keyCode 37/39: это native эквивалент which,
который React нормализует для rc-switch; одного key без кода недостаточно.

CheckedChildren/unCheckedChildren принимают string, number или snippet; ноль
сохраняется. ConfigProvider.switch задаёт class/style и semantic root/content/indicator,
которые наследуются вложенным provider. ClassNames/styles принимают объекты или
функции от props с resolved size/disabled. Content относится к обеим внутренним
подписям, indicator — к handle. Приоритет root style: config.styles.root, config.style,
styles.root, style. PrefixCls меняет классы и подключает извлечённый CSS;
rootClassName относится к button.

Bind:ref и bind:nativeElement возвращают native button и очищаются при unmount;
focus(options?)/blur() доступны и через bind:this. AutoFocus вызывает focus при
mount, tabIndex — alias tabindex. Lowercase autofocus сохраняет HTML-поведение.
Native form/reset/hidden field, отменяемый onclick, скрытые от accessibility tree
подписи и span handle сохраняют прежний Svelte контракт. React использует div handle
и controlled state/event/ref conventions. Source Switch tokens и отдельные theme
algorithms применяются к обоим размерам; native-only темы сохраняют прежнее
оформление. Local/shared prefix CSS и Wave подключены; React diagnostics/statics пока не перенесены.

Switch поддерживает local/shared prefixCls для root, checked/loading/disabled/size/RTL,
ручки, подписей и loading icon. Empty/undefined наследуют ConfigProvider; непустой
local prefix имеет приоритет. Canonical token variables и внешний anticon
namespace сохраняются. Смена prefix сохраняет DOM/ref, checked, focus/selection
и native hidden form field. Сверка с UMD — `?fixture=switch-prefix` и
[browser](../../../tests/browser/switch-prefix.spec.ts).

