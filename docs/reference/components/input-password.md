# InputPassword (Input.Password)

InputPassword добавляет к Input переключение видимости пароля. Он поддерживает
bind:value, defaultValue, нативные атрибуты и события, clear/count, affixes,
FormItem, Compact и методы refs. Настройки описаны в
[исходных типах](../../../src/lib/input/input-password.types.ts).

```svelte
<script lang="ts">
  import { InputPassword } from '@woodger/antd';
  let password = $state('');
  let visible = $state(false);
</script>

<InputPassword bind:value={password} autoComplete="new-password"
  visibilityToggle={{ visible, onVisibleChange: next => { visible = next; } }}
  aria-label="Пароль" />
```

Без visibilityToggle.visible компонент хранит видимость сам. В controlled-режиме
callback запрашивает новое состояние, а внешний visible определяет результат;
обновление prop не вызывает callback. При снятии контроля сохраняется последнее
состояние. VisibilityToggle=false скрывает кнопку, сохраняя текущую видимость и
suffix wrapper. Type всегда определяется видимостью.

Как в upstream, action=hover переключает состояние на mouseover; mouseleave
ничего не меняет. Обрабатываются и всплывающие события от иконки: смена SVG под
указателем может вызвать дополнительные переключения. Это поведение подтверждено
в React-версии 6.6.8 и сохранено. Enter и Space переключают один раз, повторные keydown
игнорируются. Disabled блокирует переключение и исключает его из Tab-порядка;
readonly оставляет показ доступным. Mousedown/mouseup не уводят фокус и не меняют
каретку. Вместо React span с role=button используется native button type=button
с тем же поведением и видимым keyboard focus. Переключатель стоит перед suffix,
после Input clear/count. Иконки Eye/EyeInvisible взяты из @ant-design/icons-svg
4.6.0; MIT-лицензия сохранена в vendor. IconRender возвращает scalar либо Snippet;
пустой результат оставляет доступную кнопку.

ConfigProvider.inputPassword задаёт собственные iconRender, variant и semantic
оформление поверх ConfigProvider.input. Вложенный inputPassword заменяет объект
целиком. Подписи переключателя используют locale.global.show/hide; частичный
global наследует остальные поля. Explicit size добавляет класс ant-input-password
с суффиксом размера, а унаследованный размер меняет только Input, как в эталоне.

Скрытый пароль удаляет value attribute после mount/input/focus/blur и запроса
скрытия, не меняя property value. При показе attribute восстанавливается; timers
очищаются при unmount. Bind:inputElement/nativeElement и bind:this методы
focus/blur/select/setSelectionRange делегируются Input. SSR не запускает timers
или callbacks. Фикстура `?fixture=input-password`, source SSR и проверки публичного
пакета покрывают эти сценарии, темы, RTL, локаль и FormItem. Component token engine
Input и variant inheritance подключены; согласованные value/ref conventions сохраняются.

PrefixCls задаёт классы Password и toggle icon, inputPrefixCls — независимые классы
вложенного Input. Empty/undefined наследуют соответствующие ConfigProvider prefixes.
Canonical token variables и native toggle button сохраняются. Смена любого prefix
не заменяет DOM/ref и сохраняет visibility, value, selection/focus и FormData.

В React 6.6.8 CSS иконки ошибочно предполагает связь этих имён: при независимых
prefixes исчезают color/cursor. Здесь четыре исходных правила адресуют оба prefix.
Исходные UMD measurements и public paired-prefix counterpart хранятся раздельно в
[эталоне](../../../tests/browser/fixtures/ant-design-input-password-prefix-reference.json).
Проверки — `?fixture=input-password-prefix`,
[browser](../../../tests/browser/input-password-prefix.spec.ts) и
[SSR](../../../tests/package/input/input-password-prefix.ssr.test.ts).

