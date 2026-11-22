# CheckboxGroup

CheckboxGroup переносит выбор нескольких флажков в одно поле с массивом.
`CheckboxGroupProps<Value>` и `CheckboxGroupOption<Value>` поддерживают
string, number и boolean. Options принимает примитивы или объекты
`{ value, label, disabled?, id?, title?, className?, style?, required?, onChange? }`;
подпись примитива получается через String. Label принимает строку, число или
snippet; style — CSS-строка. Nullish entries/values пропускаются.

```svelte
<script lang="ts">
  import { Checkbox, CheckboxGroup } from '@woodger/antd-svelte';

  const options = [
    { value: 'read', label: 'Просмотр' },
    { value: 'edit', label: 'Редактирование' },
    { value: 'archive', label: 'Архив', disabled: true }
  ];
  let permissions = $state<string[]>(['read']);
</script>

<CheckboxGroup {options} bind:value={permissions} name="permissions" aria-label="Права доступа" />
```

При options каждое пользовательское переключение обновляет bind:value и вызывает
`onValueChange(values)` с новым массивом в порядке options. Массив callback
не разделяется с привязкой. Повторяющиеся options показываются один раз;
первая подпись и disabled-состояние сохраняются. Числовой 0 и строковый "0",
boolean false и строковый "false" остаются разными значениями.

Внешние обновления value/options не переписывают массив владельца и не вызывают
callback. Временно отсутствующие варианты скрываются, а возвращённые снова
отображают выбранное состояние. При следующем пользовательском переключении
массив содержит только текущие options, без повторов, в их текущем порядке.

Группа наследует disabled из Form/FormItem и ConfigProvider; явный
`disabled={false}` переопределяет наследование. Disabled группы блокирует все
варианты, disabled option блокирует только соответствующий checkbox.
Уже выбранный disabled-вариант сохраняется в массиве.

Для отдельной группы defaultValue принимает readonly-массив и копируется один
раз. С bind:value задавайте начальное значение у владельца без defaultValue.
Нативный reset формы восстанавливает defaultValue или пустой массив, включая
привязку, без callbacks. Массив обновляется в следующей задаче после события
reset, чтобы учесть отмену события; отменённый reset сохраняет текущий выбор.
Внешняя форма через атрибут form поддерживается. В Form сбросом управляет
модель через resetFields.

Группа содержит нативные checkbox: Tab перемещает фокус, Space и нажатие подписи
переключают вариант. С name или FormItem.name отмеченные доступные варианты
попадают в FormData под одним именем. Читайте их через
`new FormData(form).getAll('permissions')`. Результат содержит строки в порядке
options; disabled, отсутствующие и невыбранные варианты исключаются.
Например, выбранные числовой 0 и boolean false передаются как `['0', 'false']`.

В Form используйте `value={form.values.permissions}` и
`onValueChange={(value) => form.setFieldValue('permissions', value)}`.
Правила required/min/max проверяют массив целиком. Required не назначается
каждому input, поэтому выбор всех вариантов не становится обязательным.
Имя поля, описание и ошибки передаются из FormItem; группа использует fieldset
и получает доступное имя из label FormItem либо aria-label/aria-labelledby.
При ошибке или нажатии подписи FormItem фокус переходит к первому доступному
варианту; пустая группа может получить фокус сама, без дополнительного шага Tab.

Галерея `/ant-design#checkbox` показывает форму выбора прав с общим флажком
«Все права», промежуточным состоянием, проверкой количества, отправкой и сбросом.
Общий выбор управляется владельцем через массив, как и в примере Ant Design.
Непустые нормализованные options имеют приоритет над children; пустые оставляют
snippet с вложенными Checkbox, включая Row/Col и другие контейнеры:

```svelte
<CheckboxGroup bind:value={permissions} name="permissions" aria-label="Права доступа">
  <Checkbox value="read">Просмотр</Checkbox>
  <Checkbox value="edit">Редактирование</Checkbox>
</CheckboxGroup>
```

Children регистрируют текущие значения и отменяют регистрацию при удалении или
смене value. Как upstream, их внутренний массив сохраняет порядок выбора и
временно отсутствующие значения. Bind:value отражает этот raw state; callbacks
получают только зарегистрированные значения. Поэтому вернувшийся child снова
показывает сохранённый выбор. OnChange(values) вызывается перед onValueChange,
массивы callbacks не разделяются с state. У options сохраняются описанные выше
сортировка и нормализация прежнего API. Getter/setter function binding позволяет
владельцу отклонять изменения; native checked восстанавливается по типизированным
значениям, не смешивая 0 и '0'.

SkipGroup оставляет Checkbox самостоятельным: его checked/name и callbacks не
входят в группу. Disabled внешнего native fieldset продолжает действовать.
Вложенные CheckboxGroup изолируют context; флажки выбора строк Table используют
skipGroup, как в upstream. Group.nativeElement — bindable fieldset; rootClassName,
prefixCls и явный role относятся к корню. PrefixCls передаётся в generated options,
а children задают собственный prefixCls.

Checkbox/CheckboxGroup подключают CSS для local/shared prefixCls. Непустой
локальный prefix имеет приоритет; empty/undefined наследуют ConfigProvider.
Row использует общий namespace независимо от local Checkbox class; canonical
token markers и Wave target сохраняются. Смена prefix сохраняет group/input DOM,
refs, checked/mixed, выбранный массив, focus/selection и FormData.
В Source shared local class может сохранить Row selector первого provider:
nested Inner Row получает flex-grow:0, а fresh Inner с теми же props/theme — 1.
Оба замера сохранены; Native изолирует CSS по local class и global namespace.

Сохранены native fieldset/form/reset/required, принудительный disabled группы,
primitive values и deduplication options, bind:indeterminate и defaults. Они
отличаются от React state/ref conventions, child disabled override и controlled
indeterminate. Source Checkbox aliases и отдельные theme algorithms применяются
к Checkbox/CheckboxGroup; native-only темы сохраняют прежнее оформление.
Local/shared prefix CSS и Wave подключены; React diagnostics/statics остаются
неперенесёнными. Сверка с официальным UMD — `?fixture=checkbox-prefix` и
[browser](../../../tests/browser/checkbox-prefix.spec.ts). Типы —
[checkbox.types.ts](../../../src/lib/checkbox.types.ts) и
[checkbox-group.types.ts](../../../src/lib/checkbox-group.types.ts); проверки —
[browser](../../../tests/browser/checkbox-features.spec.ts),
[package SSR](../../../tests/package/checkbox-features.ssr.test.ts) и
[engine](../../../src/lib/checkbox-group.engine.test.ts).

