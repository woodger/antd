# FloatButton, FloatButtonGroup и FloatButtonBackTop

FloatButton сохраняет native Button/href, type=default|primary, shape=circle|square,
icon и content. Текст, число,
boolean и Snippet заменяют ReactNode; число 0 не включает default icon. Без
renderable content/icon используется FileTextOutlined из закреплённого icons-svg.
Кнопка имеет размер 40px и fixed-положение: inline-end 24px, bottom 48px.
Размер стандартной иконки — fontSizeIcon × 1.5 = 18px. Shape группы имеет
приоритет над shape детей. Native htmlType/disabled/события сохраняют Button API.

Tooltip принимает scalar/Snippet либо props существующего Tooltip; 0 показывает
подсказку. Badge принимает props существующего Badge без status/text/title/children;
этот набор исключается и в runtime. Semantic classNames/styles root/icon/content
принимают объект или callback { props }, включая undefined result. Group context
сливается перед локальными slots, style кнопки имеет последний приоритет.

FloatButtonGroup принимает children Snippet либо items=[{ key, children: Snippet }].
Items создают отдельные Compact slots и имеют приоритет над children. Для opaque
Snippet геометрия квадратных краёв определяется CSS siblings, без точного
воспроизведения Compact edge classes. Circle использует Flex, square — Compact.
Trigger click/hover включает меню; без trigger показывается список без trigger.
FloatButton/Group/BackTop поддерживают local/shared prefixCls. У Group это базовый
prefix кнопки без суффикса -group. Дочерние кнопки наследуют owner prefix при
undefined; непустое локальное значение имеет приоритет, пустое выбирает общий
ConfigProvider. Button/Badge/Tooltip/Compact сохраняют собственные namespaces;
progress и параметры анимации используют общий prefix независимо от local class.
Смена prefix сохраняет DOM/ref, открытое меню, scroll/progress, draft/selection/focus.

В Ant Design Group не передаёт local prefix детям и trigger. Raw UMD замеры
сохранены отдельно от matched public child prefixes и trigger semantic aliases/
styles. В Svelte owner prefix наследуется. Shared local class в nested provider
также обнаружил Source cache defect: BackTop теряет progress background. Fresh
Inner measurement сохранён отдельно; Native изолирует class и global namespace.

Placement top/bottom/left/right остаётся физическим и при RTL. Open + onOpenChange
дают controlled mode: владелец может отклонить запрос; без open состояние внутреннее.
Disabled блокирует переключение меню, но сам по себе не отключает детей.
Клик вне группы закрывает меню, клик элемента сохраняет его открытым.
CloseIcon и semantic slots root/list/item/itemIcon/itemContent/trigger/triggerIcon/
triggerContent доступны локально и через ConfigProvider.floatButtonGroup.

FloatButtonBackTop принимает target={() => window|document|element|null},
visibilityHeight (400), duration (450ms), showProgress. На SSR виден только при
visibilityHeight=0, target не вызывается. После mount scroll обновляет видимость
и progress; resize обновляет только progress. Click запускает cubic scroll к 0
перед пользовательским callback. При reduced motion прокрутка мгновенная;
собственные RAF/listeners отменяются при unmount. NativeElement с bind доступен
у кнопки/FloatButtonBackTop, у Group указывает на div группы.

ConfigProvider.floatButton.backTopIcon задаёт иконку FloatButtonBackTop. Как в исходной 6.6.8,
FloatButton не потребляет объявленные в глобальном floatButton config class/style/
semantic slots; локальные props работают. Config вложенного provider наследуется
при undefined и заменяется целиком при заданном объекте.

`theme.components.FloatButton` применяет alias overrides и algorithms к кнопкам,
Group и FloatButtonBackTop. Собственных component tokens у закреплённого FloatButton нет:
размер задаёт controlHeightLG, иконку — fontSizeIcon, отступы — paddingXXS,
marginXXL/marginLG и padding группы. Button сохраняет свои component tokens;
его config style, semantic styles и локальный style имеют приоритет над темой.
Вложенные и соседние providers изолированы, поддержаны custom cssVar prefix,
реактивные изменения и возврат к legacy defaults.

Сохраняются прежние ограничения Button/Badge/Tooltip; произвольный prefixCls и
общий React z-index context ещё не перенесены. CSS-рецепт воспроизводит 42 правила;
глобальный fade адаптирован через WAAPI с исходными длительностями и reduced motion.
У FloatButtonBackTop fade меняет только opacity по linear-кривой; локальный
transform сохраняется во время появления и исчезновения. Промежуточные кадры
официального UMD сверяются в [browser](../../../tests/browser/float-button-motion.spec.ts).
Wave наследуется через общий Button, включая FloatButtonBackTop и trigger группы.

```svelte
<FloatButton tooltip="Помощь" aria-label="Помощь" onclick={showHelp} />
<FloatButtonGroup shape="square" trigger="click" aria-label="Действия">
  <FloatButton content="?" aria-label="Поддержка" />
  <FloatButtonBackTop visibilityHeight={0} aria-label="К началу" />
</FloatButtonGroup>
```

