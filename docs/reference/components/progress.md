# Progress

Компонент отображает переданный percent и не запускает работу самостоятельно:

```svelte
<script lang="ts">
  import { Progress } from '@woodger/antd-svelte';

  let percent = $state(42.5);
</script>

<Progress {percent} aria-label="Подготовка отчёта" />
<Progress type="circle" {percent} size={120} aria-label="Проверка файлов" />
```

Type по умолчанию line, также поддерживаются circle и dashboard. Percent по умолчанию 0;
конечные значения ограничиваются 0–100 без округления. Undefined, NaN и ±Infinity
заменяются на 0. Отображение, ширина/дуга и aria-valuenow используют одно
нормализованное значение. Percent не bindable; владелец операции передаёт
обновления через props. У Progress нет собственных таймеров и callbacks работы.

Status поддерживает normal/success/exception/active. Без явного
status значение 100 включает success, остальные значения — normal. Явный
normal/exception/success сохраняется при любом проценте. Active добавляет
декоративную анимацию line и не изменяет percent; circle/dashboard с active остаются
статичными. Success/exception показывают декоративную иконку вместо
подписи, если не задан format. Цвета статусов используют токены темы.

ShowInfo=true по умолчанию. Format получает нормализованный percent и может вернуть
строку, число или пассивный Snippet. При success либо format.length > 1 вторым аргументом
передаётся нормализованный success percent (по умолчанию 0). Прежний callback с
format.length <= 1 без success получает один аргумент, как раньше. Callback вычисляется
один раз; строка/число используются в aria-valuetext. Для Snippet доступное значение
сохраняет числовой percent; его можно уточнить через aria-valuetext. HTML в строке экранируется. При showInfo=false
подпись скрывается, доступные значения сохраняются. Длинная внешняя текстовая подпись
сокращается многоточием; полный текст остаётся в title и aria-valuetext. Это сохранённый
native contract: при size=24 подпись ограничена 12px, тогда как React допускает её выход
за body. В line статусные иконки используют исходную SVG-область и не получают текстовую обрезку.

Size по умолчанию medium. Для line medium/small задают высоту 8/6px; число
задаёт ширину и высоту в px. Пара [width, height] и объект { width?, height? }
настраивают line отдельно: ширина — число в px или CSS-строка, по умолчанию
100%, высота — положительное конечное число. Невалидные числовые размеры
заменяются defaults. Например, size={{ height: 4 }} сохраняет ширину 100%.
Доступная ширина контейнера ограничивает индикатор на узких экранах.

Для circle/dashboard size принимает medium=120px, small=60px или положительный конечный
диаметр в px. Совместимая пара использует первый размер. Невалидный диаметр заменяется
на 120px. SVG сохраняет пропорции и помещается в контейнер. При диаметре ≤20px подпись
показывается в Tooltip; доступные значения сохраняются, остановка Tab не добавляется.
Подпись Tooltip создаётся при первом открытии и сохраняется при закрытии.
Контейнер подсказки наследуется из ConfigProvider; по умолчанию это body либо
родительский native modal. Подпись сохраняет цвет Tooltip и доступное имя из содержимого.
У circle strokeWidth задаётся в процентах viewBox; default — не меньше 6% и 3px при заданном диаметре.
Невалидное значение использует default, чрезмерное ограничивается 99.9%, чтобы
радиус оставался положительным. Нулевой процент не рисует цветной дуги.
При сжатии контейнер круга сохраняет квадрат и центрирование подписи. Явный
styles.body.width сохраняет исходную высоту; styles.body.height задаёт её напрямую.
CSS-геометрия следует @rc-component/progress 1.0.3: круглые концы корректируют длину
сегмента, а быстрые обновления с интервалом менее 100ms отключают переход. Числовые
dash attributes сохраняют прежнюю геометрию для измеряющих её consumers; видимую дугу
определяют CSS declarations. Минимальная толщина вычисляется в исходном порядке операций.

StrokeColor/railColor принимают CSS-цвета и переопределяют цвет заполнения/фона,
включая при success/exception.
Для line strokeColor также принимает { from, to, direction? } или record процентных
stops: ключи сортируются по исходному parseFloat, direction по умолчанию to right/to left
в LTR/RTL. В обычном line массив strokeColor использует первый цвет; в steps цвета
применяются по индексу. Gradient object в line steps игнорируется, как upstream. StrokeLinecap поддерживает round/butt/square;
у line butt/square убирают скругления, у circle задают SVG stroke-linecap.
Круговой градиент использует record процентных stops, SVG mask и conic/linear background;
порядок ключей сохраняется, концы становятся butt. From/to не преобразуются в процентные
stops, как и в исходном круговом renderer.
Темы и compact используют существующие токены. RTL меняет начало заполнения
line на правое и направление active-анимации; circle сохраняет обход по часовой
стрелке. Reduced motion отключает active-анимацию и переходы значений/цвета.

Корень имеет role=progressbar и aria-valuemin=0/aria-valuemax=100. Доступное имя
по умолчанию берётся из locale.progress.label; задавайте aria-label либо
aria-labelledby для конкретной операции. Aria-describedby связывает пояснение.
Без format aria-valuetext содержит процент и локализованный success/exception;
явный aria-valuetext имеет приоритет. Locale.progress поддерживает label,
successText и exceptionText, включая частичные переопределения; отсутствующие
поля используют ruRU. Иконки, подпись и SVG декоративные.

Progress не создаёт live region, остановку Tab и обработчики клавиатуры, не
захватывает фокус и не блокирует Escape содержащего Modal/Drawer.
ConfigProvider.disabled не скрывает обратную связь. Id/class/style относятся
к корню. SSR сразу выводит корректные значения и SVG-геометрию без таймеров
и DOM-измерений; независимые экземпляры не разделяют состояние.

Галерея `/ant-design#progress` связывает line/circle со Slider и InputNumber,
показывает статусы, размеры и форматирование. `/ant-design#notification`
использует Progress для экспорта: модель notification-export.model.svelte.ts
владеет процентом и этапами, отменяет ожидающие callbacks при отмене/сбросе/
unmount и защищает повтор от результата предыдущей попытки. Скачиваемый CSV
и успешное завершение через 700ms сохранены.

Line поддерживает success={{ percent, strokeColor? }} как отдельный track поверх основного.
Наличие success.percent определяет автоматический status вместо общего percent, в том числе
при success.percent=0. Длины обоих tracks ограничиваются отдельно; success может выходить
за основной track, как в upstream. Высота line задаётся через size.

Steps задаёт число отдельных элементов line. Math.round определяет активное количество;
rounding получает steps*percent/100. Size задаёт размер одного элемента, а не общей полосы.
По умолчанию ширина 14px (2px при small), высота 8px. Object steps использует
count; gap в этой ветке не меняет интервалы. PercentPosition выбирает start/center/end и
inner/outer. Внутренняя подпись всегда текстовая, в том числе при success/exception;
яркость первого заданного цвета выбирает контраст подписи по исходному FastColor.

ConfigProvider.progress задаёт class/style и object/function classNames/styles для
root/body/rail/track/indicator. Undefined наследует record, явный объект заменяет его.
Callbacks получают props с defaults для type/percent/size/showInfo/percentPosition.
Provider styles.root → provider style → local styles.root → local style сохраняют приоритет;
styles отдельных частей применяются после вычисленных размеров/цветов.
PrefixCls меняет BEM classes; undefined/пустая строка наследуют ConfigProvider.prefixCls
(по умолчанию ant-progress).
Bind:nativeElement возвращает текущий root после mount и очищается при unmount.
Тема Progress подключает шесть исходных component tokens, aliases/algorithm и CSS-variable
prefix/key/hash; переменные идут перед semantic/user styles.

Dashboard использует gapDegree=75, circle — 0. GapPlacement принимает top/bottom/start/end;
start/end учитывают RTL. Для circle с положительным gapDegree задавайте placement:
без него исходный renderer не применяет rotation. Success у круга рисуется отдельным
сегментом перед остатком percent-success, с исходным порядком наложения.

Круговые steps используют Math.round независимо от rounding. Object steps задаёт count/gap,
по умолчанию промежуток 2 единицы viewBox; отдельная непрерывная rail не рисуется.
Success вычитается из процента перед расчётом активных steps. Сохранены особенности
6.6.8: без railColor неактивные steps наследуют основной stroke, а градиентные steps
ссылаются на отсутствующее gradient definition. Эти случаи входят в source-проверки.

[Эталоны line/steps](../../../tests/browser/fixtures/ant-design-progress-line-reference.json)
сняты из официального UMD в стандартном режиме браузера для 65 сценариев.
Для узкого size=24 отдельно сохранён
[эталон native clipping](../../../tests/browser/fixtures/progress-native-clipping-reference.json)
из свежей сборки прежнего коммита библиотеки. Для circle/dashboard есть
[69 UMD-сценариев и transition trace](../../../tests/browser/fixtures/ant-design-progress-circle-reference.json).
Сохранены native finite bounds, clipping длинной подписи и числовые SVG attributes;
Tooltip использует существующую Svelte-обёртку. Общий ConfigProvider prefix поддержан;
React development warnings остаются следующим этапом. Исходная лицензия
[@rc-component/progress](../../../src/lib/vendor/LICENSE.rc-progress) включена в пакет.

