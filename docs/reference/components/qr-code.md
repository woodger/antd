# QRCode

QRCode показывает код на canvas или в SVG и поддерживает состояния загрузки
и ошибки. Props, status snippet и semantic/config описаны в
[исходных объявлениях](../../../src/lib/qrcode.types.ts).

```svelte
<script lang="ts">
  import { QRCode } from '@woodger/antd';
</script>

<QRCode
  value="https://ant.design"
  type="svg"
  size={180}
  marginSize={4}
  aria-label="Ссылка на Ant Design"
/>
```

Массив value задаёт отдельные сегменты, а не склеенную строку. Numeric,
alphanumeric и UTF-8 выбираются с исходными правилами; доступны версии 1–40 и
уровни L/M/Q/H. BoostLevel по умолчанию повышает коррекцию, если размер символа
не увеличивается. Пустая строка не создаёт DOM, пустой массив создаёт символ
без payload. Слишком длинное значение сохраняет RangeError `Data too long`,
незавершённая Unicode surrogate pair — URIError, без подмены данных.

Type по умолчанию canvas. SSR создаёт canvas shell размером size; отрисовка после
mount учитывает devicePixelRatio. SVG целиком готов при SSR. MarginSize задаётся
в модулях, округляется вниз и ограничивается снизу нулём; default 0 сохраняет
поведение Ant Design. Size управляет bitmap и fallback root width/height.
Только width/height обычного style передаются также рисунку; semantic root
dimensions не передаются ему. CSS-растяжение не увеличивает разрешение bitmap.

Icon принимает URL, iconSize — квадрат либо width/height, по умолчанию 40×40.
Размер 0 сохраняет fallback rc-qrcode к 10% от size. Изображение центрируется,
загружается с crossOrigin=anonymous и растягивается в указанный прямоугольник.
Canvas вырезает перекрытые модули только после успешной загрузки; SVG делает это
сразу. При отсутствии Path2D используется исходный fallback с отдельными rect:
он сохраняет модули под иконкой, как в закреплённом rc-qrcode. При отсутствии
2D context остаётся canvas shell. При ошибке загрузки canvas сохраняет все QR-модули.
PNG можно получить через nativeElement.querySelector('canvas').toDataURL();
чужой сервер изображения должен разрешать CORS, как в эталоне.

Status active оставляет рисунок без cover; expired показывает текст и refresh,
loading использует Spin, scanned — текст подтверждения. OnRefresh не меняет
status автоматически. Кнопка использует текущие Button/config/disabled правила
и сохраняет native type=button; её click всплывает до root. StatusRender —
snippet с status/locale/onRefresh, который целиком заменяет содержимое cover,
включая пустой результат. Locale.qrcode объединяется по полям; RU/EN подписи
взяты из закреплённых словарей Ant Design.

Role=img и aria-* относятся к canvas/SVG. Native id/title/data-* и обработчики
относятся к root; title не создаёт SVG title, children не выводится. Передавайте
aria-label или aria-labelledby для имени рисунка. Bind:nativeElement заменяет
React ref и очищается при пустом value или unmount; поздний load отсоединённого
изображения не перерисовывает старый canvas.

ConfigProvider.qrcode задаёт class/style/classNames/styles для root/cover;
nested config заменяет объект целиком. Semantic callbacks получают разрешённые
type/size/status/bordered/errorLevel/bgColor. Root style идёт после semantic
styles, затем записываются size или plain width/height. Color по умолчанию берётся
из глобального colorText token theme; component QRCode.colorText и style.color
не меняют модули. Явный color приоритетнее; при undefined global colorText действует
исходный fallback #000000. Native light/dark defaults сохранены. Bordered=false
оставляет прозрачную границу, убирает padding и radius. RTL наследуется.

В upstream QRCode не объявляет публичных собственных component tokens.
ConfigProvider.theme.components.QRCode поддерживает alias tokens и algorithms:
padding, border, radius, текст cover и прочие глобальные значения. Внутренний
background cover готовится из colorBgContainer с абсолютной alpha 0.96, включая
полупрозрачный исходный цвет. Theme variables идут перед semantic/user styles.
Global/component algorithms, cssVar.prefix и nested/reset/sibling scopes
сверяются с [UMD](../../../tests/browser/fixtures/ant-design-qrcode-theme-reference.json),
[SSR](../../../tests/package/qrcode-theme.ssr.test.ts) и
[browser](../../../tests/browser/qrcode-theme.spec.ts), `?fixture=qrcode-theme`.
Реактивная смена global colorText перерисовывает прежний canvas и обновляет
прежний SVG; cover/padding не сбрасывают фокус status snippet или refs.

CSS-рецепт qrcode воспроизводит все 11 правил с проверкой SHA-256. Fixture —
`?fixture=qrcode`; unit/SSR/package/browser проверяют матрицы, pixel centers,
quiet zone, иконку/CORS, statuses, refs, темы, стили и fallback. Матрицы сверяются
с [фиксированными результатами npm-пакета](../../../tests/package/qrcode-vectors.json),
включая все 40 версий, четыре уровня коррекции и восемь масок.

Локальный prefixCls меняет root/cover/expired/scanned/borderless classes; пустая
строка наследует ConfigProvider.prefixCls (по умолчанию ant-qrcode). CSS module
ограничен marker своего корня, namespace
токенов и классы Button/Spin сохраняются. Соседние QRCode не меняются, включая
совпадения prefix с cover/css-var/borderless. При смене prefix сохраняются root,
canvas/SVG, encoding, status, refs и доступная с клавиатуры кнопка refresh.
Fallback-переменная module не перекрывает адаптивный cover прежней light/dark темы.
Native RTL наследуется, исходное LTR-направление корня хранится в raw reference.
Сверка: [44 исходных случая и 4 обновления](../../../tests/browser/fixtures/ant-design-qrcode-prefix-reference.json),
[CSS boundary](../../../src/lib/qrcode-prefix.test.ts),
[браузер](../../../tests/browser/qrcode-prefix.spec.ts),
[публичный пакет и SSR](../../../tests/package/qrcode-prefix.ssr.test.ts), `?fixture=qrcode-prefix`.
Рецепт qrcode-prefix воспроизводит те же 11 правил CSS data module с проверкой SHA-256.
Общий ConfigProvider.prefixCls применяется к QRCode, локальный prefix имеет приоритет.
React development warnings для пустого value и icon с уровнем L
пока не воспроизводятся; production-поведение этих случаев сохранено.

