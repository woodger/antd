// Преобразует токены компонентов в CSS-переменные. Учитывает общий и локальный слои, namespace
// компонента, безразмерные значения и наследование vendor defaults.
import {
  prepareButtonTokens,
  prepareInputTokens,
  prepareInputNumberTokens,
  prepareRadioTokens,
  prepareSwitchTokens
} from './theme-control-tokens.engine';
import { prepareAvatarTokens, prepareBadgeTokens, prepareTagTokens }
  from './theme-display-tokens.engine';
import { prepareSelectTokens } from './theme-select-tokens.engine';
import { prepareTreeTokens, prepareTreeSelectTokens } from './theme-tree-tokens.engine';
import { preparePickerPanelTokens } from './theme-picker-panel-tokens.engine';
import { prepareCascaderTokens } from './theme-cascader-tokens.engine';
import { prepareMenuTokens } from './theme-menu-tokens.engine';
import { prepareTabsTokens } from './theme-tabs-tokens.engine';
import { prepareSliderTokens } from './theme-slider-tokens.engine';
import { prepareTableTokens } from './theme-table-tokens.engine';
import {
  prepareArrowOffsets,
  prepareArrowTokens,
  prepareTooltipTokens,
  preparePopoverTokens,
  preparePopconfirmTokens,
  prepareDropdownTokens
} from './theme-overlay-tokens.engine';
import { serializeThemeVariables, tokenToCSSVariable, unitlessTokens }
  from './theme-css-variables.engine';
import { FastColor } from './fast-color.engine';
import type {
  CardComponentToken, FormComponentToken, GlobalToken, SplitterComponentToken
} from './theme-component-token.types';

export type StyledComponent = 'Button' | 'Input' | 'InputNumber' | 'Addon'
  | 'Radio' | 'Checkbox' | 'Switch' | 'Avatar' | 'Badge' | 'Tooltip' | 'Popover' | 'Popconfirm'
  | 'Select' | 'TreeSelect' | 'Cascader' | 'Anchor' | 'Menu' | 'Dropdown' | 'Breadcrumb'
  | 'Steps' | 'Timeline' | 'Pagination' | 'Tabs' | 'Tag' | 'Slider' | 'Divider' | 'Flex' | 'Spin'
  | 'Progress' | 'Skeleton' | 'Empty' | 'Result' | 'Alert' | 'Collapse' | 'Card' | 'Carousel'
  | 'Descriptions' | 'Statistic' | 'Segmented' | 'Splitter' | 'Rate' | 'QRCode' | 'Image'
  | 'Layout' | 'Space' | 'Masonry' | 'BorderBeam' | 'Affix' | 'FloatButton' | 'Form' | 'Typography'
  | 'Listy' | 'Tree' | 'Transfer' | 'Calendar' | 'DatePicker' | 'ColorPicker'
  | 'Tour' | 'Mentions' | 'Upload' | 'Drawer' | 'Modal' | 'Message' | 'Notification' | 'Table' | 'Grid'
  | 'App';

const factories = {
  // Регистрирует App без дополнительных значений по умолчанию. Разрешение общих токенов остаётся
  // в текущей теме.
  App: () => ({}),
  // Оставляет Grid общие токены темы без отдельного набора компонентных defaults.
  Grid: () => ({}),
  Table: prepareTableTokens,
  // Задаёт слой, ширину и цвет прогресса. Статусные фоны остаются неопределёнными до
  // переопределения.
  Notification: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 1050,
    width: 384,
    progressBg: `linear-gradient(90deg, ${token.colorPrimaryBorderHover}, ${token.colorPrimary})`,
    colorSuccessBg: undefined,
    colorErrorBg: undefined,
    colorInfoBg: undefined,
    colorWarningBg: undefined
  }),
  // Выбирает фон приподнятого слоя и центрирует строку сообщения в высоте большого контрола.
  Message: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 1010,
    contentBg: token.colorBgElevated,
    contentPadding:
      `${(token.controlHeightLG - token.fontSize * token.lineHeight) / 2}px ${token.paddingSM}px`
  }),
  // Определяет размеры секций и отступы confirm. В wireframe возвращает границы header и footer.
  Modal: (token: GlobalToken) => ({
    footerBg: 'transparent',
    headerBg: 'transparent',
    titleLineHeight: token.lineHeightHeading5,
    titleFontSize: token.fontSizeHeading5,
    contentBg: token.colorBgElevated,
    titleColor: token.colorTextHeading,
    contentPadding: token.wireframe ? 0 : `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`,
    headerPadding: token.wireframe ? `${token.padding}px ${token.paddingLG}px` : 0,
    headerBorderBottom: token.wireframe
      ? `${token.lineWidth}px ${token.lineType} ${token.colorSplit}` : 'none',
    headerMarginBottom: token.wireframe ? 0 : token.marginXS,
    bodyPadding: token.wireframe ? token.paddingLG : 0,
    footerPadding: token.wireframe ? `${token.paddingXS}px ${token.padding}px` : 0,
    footerBorderTop: token.wireframe
      ? `${token.lineWidth}px ${token.lineType} ${token.colorSplit}` : 'none',
    footerBorderRadius: token.wireframe
      ? `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px` : 0,
    footerMarginTop: token.wireframe ? 0 : token.marginSM,
    confirmBodyPadding: token.wireframe
      ? `${token.padding * 2}px ${token.padding * 2}px ${token.paddingLG}px` : 0,
    confirmIconMarginInlineEnd: token.wireframe ? token.margin : token.marginSM,
    confirmBtnsMarginTop: token.wireframe ? token.marginLG : token.marginSM,
    mask: true
  }),
  // Передаёт базовый слой открывающейся панели и метрики footer и dragger.
  Drawer: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase,
    footerPaddingBlock: token.paddingXS,
    footerPaddingInline: token.padding,
    draggerSize: 4
  }),
  // Задаёт цвет действий и масштабирует карточку изображения от высоты большого контрола.
  Upload: (token: GlobalToken) => ({
    actionsColor: token.colorIcon,
    pictureCardSize: token.controlHeightLG * 2.55
  }),
  // Готовит метрики стрелки с цветами навигации поверх подложки и отдельным слоем popup.
  Tour: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 70,
    closeBtnSize: token.fontSize * token.lineHeight,
    primaryPrevBtnBg: new FastColor(token.colorTextLightSolid).setA(0.15).toRgbString(),
    primaryNextBtnHoverBg: new FastColor(token.colorBgTextHover)
      .onBackground(token.colorWhite).toRgbString(),
    ...prepareArrowOffsets(token.borderRadiusLG),
    ...prepareArrowTokens(token)
  }),
  // Берёт токены из Input и добавляет высоту списка и вертикальный отступ пункта.
  Mentions: (token: GlobalToken) => ({
    ...prepareInputTokens(token),
    dropdownHeight: 250,
    controlItemWidth: 100,
    zIndexPopup: token.zIndexPopupBase + 50,
    itemPaddingVertical: (token.controlHeight - token.fontHeight) / 2
  }),
  // Оставляет ColorPicker общие токены до применения переопределений экземпляра темы.
  ColorPicker: () => ({}),
  // Собирает общие токены поля, календарной панели и стрелки, дополняя их метриками presets.
  DatePicker: (token: GlobalToken) => ({
    ...prepareInputTokens(token),
    ...preparePickerPanelTokens(token),
    ...prepareArrowTokens(token),
    presetsWidth: 120,
    presetsMaxWidth: 200,
    zIndexPopup: token.zIndexPopupBase + 50
  }),
  // Переиспользует метрики календарной панели и задаёт размеры полноэкранных и мини-элементов.
  Calendar: (token: GlobalToken) => ({
    fullBg: token.colorBgContainer,
    fullPanelBg: token.colorBgContainer,
    itemActiveBg: token.controlItemBgActive,
    yearControlWidth: 80,
    monthControlWidth: 70,
    miniContentHeight: 256,
    ...preparePickerPanelTokens(token)
  }),
  // Считает вертикальные отступы строки и заголовка от общей высоты текста и контролов.
  Transfer: (token: GlobalToken) => {
    const fontHeight = Math.round(token.fontSize * token.lineHeight);

    return {
      listWidth: 180,
      listHeight: 200,
      listWidthLG: 250,
      headerHeight: token.controlHeightLG,
      itemHeight: token.controlHeight,
      itemPaddingBlock: (token.controlHeight - fontHeight) / 2,
      transferHeaderVerticalPadding:
        Math.ceil((token.controlHeightLG - token.lineWidth - fontHeight) / 2)
    };
  },
  Tree: prepareTreeTokens,
  // Передаёт логические отступы строки из общих размеров темы.
  Listy: (token: GlobalToken) => ({
    itemPaddingBlock: token.paddingSM,
    itemPaddingInline: token.padding
  }),
  // Возвращает отступы заголовка в em, чтобы они зависели от размера его шрифта.
  Typography: () => ({ titleMarginTop: '1.2em', titleMarginBottom: '0.5em' }),
  // Задаёт параметры подписи и промежутков. В вертикальном режиме высота зависит от явного
  // labelHeight.
  Form: (token: GlobalToken & Partial<FormComponentToken>) => ({
    labelRequiredMarkColor: token.colorError,
    labelColor: token.colorTextHeading,
    labelFontSize: token.fontSize,
    labelHeight: token.controlHeight,
    verticalLabelHeight: token.labelHeight ?? 'auto',
    labelColonMarginInlineStart: token.marginXXS / 2,
    labelColonMarginInlineEnd: token.marginXS,
    itemMarginBottom: token.marginLG,
    verticalLabelPadding: `0 0 ${token.paddingXS}px`,
    verticalLabelMargin: 0,
    inlineItemMarginBottom: 0
  }),
  // Оставляет общую тему для FloatButton без дополнительных локальных defaults.
  FloatButton: () => ({}),
  // Задаёт слой закреплённого элемента относительно zIndexBase.
  Affix: (token: GlobalToken) => ({ zIndexPopup: token.zIndexBase + 10 }),
  // Оставляет общие токены для BorderBeam, дополнительные параметры приходят из CSS и настроек
  // экземпляра.
  BorderBeam: () => ({}),
  // Регистрирует Masonry без собственных значений темы по умолчанию.
  Masonry: () => ({}),
  // Оставляет Space общую шкалу отступов темы без компонентных defaults.
  Space: () => ({}),
  // Определяет размеры секций, общие и отдельные цвета тёмного и светлого Sider.
  Layout: (token: GlobalToken) => {
    const paddingInline = token.controlHeightLG * 1.25;

    return {
      bodyBg: token.colorBgLayout,
      headerBg: '#001529',
      headerHeight: token.controlHeight * 2,
      headerPadding: `0 ${paddingInline}px`,
      headerColor: token.colorText,
      footerPadding: `${token.controlHeightSM}px ${paddingInline}px`,
      footerBg: token.colorBgLayout,
      siderBg: '#001529',
      triggerHeight: token.controlHeightLG + token.marginXXS * 2,
      triggerBg: '#002140',
      triggerColor: token.colorTextLightSolid,
      zeroTriggerWidth: token.controlHeightLG,
      zeroTriggerHeight: token.controlHeightLG,
      lightSiderBg: token.colorBgContainer,
      lightTriggerBg: token.colorBgContainer,
      lightTriggerColor: token.colorText
    };
  },
  // Задаёт слой preview и три уровня прозрачности иконок действий.
  Image: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 80,
    previewOperationColor: new FastColor(token.colorTextLightSolid).setA(0.65).toRgbString(),
    previewOperationHoverColor: new FastColor(token.colorTextLightSolid).setA(0.85).toRgbString(),
    previewOperationColorDisabled: new FastColor(token.colorTextLightSolid).setA(0.25).toRgbString(),
    previewOperationSize: token.fontSizeIcon * 1.5,
    progressAnimationDuration: '3s'
  }),
  // Использует фон контейнера с фиксированной прозрачностью для покрытия QRCode.
  QRCode: (token: GlobalToken) => ({
    QRCodeCoverBackgroundColor: new FastColor(token.colorBgContainer).setA(0.96).toRgbString()
  }),
  // Измеряет звёзды от высот контролов трёх размеров. Нулевая ширина focus остаётся нулевой.
  Rate: (token: GlobalToken) => ({
    lineWidthFocus: token.lineWidthFocus === 0 ? 0 : token.lineWidth,
    starColor: token.yellow6,
    starSize: token.controlHeight * 0.625,
    starSizeSM: token.controlHeightSM * 0.625,
    starSizeLG: token.controlHeightLG * 0.625,
    starHoverScale: 'scale(1.1)',
    starBg: token.colorFillContent
  }),
  // Задаёт размеры разделителя и области захвата. Для drag-области явно заданный ноль
  // сохраняется.
  Splitter: (token: GlobalToken & Partial<SplitterComponentToken>) => {
    return {
      splitBarSize: token.splitBarSize || 2,
      splitTriggerSize: token.splitTriggerSize || 6,
      splitBarDraggableSize: token.splitBarDraggableSize ?? 20
    };
  },
  // Определяет фон трека и цвета пунктов для обычного, hover, active и selected состояния.
  Segmented: (token: GlobalToken) => ({
    trackPadding: token.lineWidthBold,
    trackBg: token.colorBgLayout,
    itemColor: token.colorTextLabel,
    itemHoverColor: token.colorText,
    itemHoverBg: token.colorFillSecondary,
    itemSelectedBg: token.colorBgElevated,
    itemActiveBg: token.colorFill,
    itemSelectedColor: token.colorText
  }),
  // Разделяет размеры текста заголовка и числового содержимого.
  Statistic: (token: GlobalToken) => ({
    titleFontSize: token.fontSize,
    contentFontSize: token.fontSizeHeading3
  }),
  // Задаёт цвета подписи, заголовка и значения, а также отступы строк и двоеточия.
  Descriptions: (token: GlobalToken) => ({
    labelBg: token.colorFillAlter,
    labelColor: token.colorTextTertiary,
    titleColor: token.colorText,
    titleMarginBottom: token.fontSizeSM * token.lineHeightSM,
    itemPaddingBottom: token.padding,
    itemPaddingEnd: token.padding,
    colonMarginRight: token.marginXS,
    colonMarginLeft: token.marginXXS / 2,
    contentColor: token.colorText,
    extraColor: token.colorText
  }),
  // Определяет размеры стрелок, маркеров и активной точки. Тема задаёт расстояние до стрелки и
  // gap.
  Carousel: (token: GlobalToken) => ({
    arrowSize: 16,
    arrowOffset: token.marginXS,
    dotWidth: 16,
    dotHeight: 3,
    dotGap: token.marginXXS,
    dotOffset: 12,
    dotActiveWidth: 24
  }),
  // Считает высоту заголовка из текста и отступов и сохраняет явные bodyPadding и headerPadding.
  Card: (token: GlobalToken & Partial<CardComponentToken>) => ({
    headerBg: 'transparent',
    headerFontSize: token.fontSizeLG,
    headerFontSizeSM: token.fontSize,
    headerHeight: token.fontSizeLG * token.lineHeightLG + token.padding * 2,
    headerHeightSM: token.fontSize * token.lineHeight + token.paddingXS * 2,
    actionsBg: token.colorBgContainer,
    actionsLiMargin: `${token.paddingSM}px 0`,
    tabsMarginBottom: -token.padding - token.lineWidth,
    extraColor: token.colorText,
    bodyPaddingSM: 12,
    headerPaddingSM: 12,
    bodyPadding: token.bodyPadding ?? token.paddingLG,
    headerPadding: token.headerPadding ?? token.paddingLG
  }),
  // Разрешает размеры заголовка и тела для трёх размеров. Borderless использует отдельные фон и
  // отступ.
  Collapse: (token: GlobalToken) => ({
    headerPadding: `${token.paddingSM}px ${token.padding}px`,
    headerPaddingSM: `${token.paddingXS}px ${token.paddingSM}px ${token.paddingXS}px ${token.paddingXS}px`,
    headerPaddingLG: `${token.padding}px ${token.paddingLG}px ${token.padding}px ${token.padding}px`,
    headerBg: token.colorFillAlter,
    contentPadding: `${token.padding}px 16px`,
    contentPaddingSM: token.paddingSM,
    contentPaddingLG: token.paddingLG,
    contentBg: token.colorBgContainer,
    borderlessContentPadding: `${token.paddingXXS}px 16px ${token.padding}px`,
    borderlessContentBg: 'transparent'
  }),
  // Выбирает метрики для простого сообщения и варианта с описанием.
  Alert: (token: GlobalToken) => ({
    borderRadius: token.borderRadiusLG,
    withDescriptionIconSize: token.fontSizeHeading3,
    defaultPadding: `${token.paddingContentVerticalSM}px 12px`,
    withDescriptionPadding: `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`
  }),
  // Масштабирует иконку от размера заголовка, сохраняя CSS-выражение для строкового размера.
  Result: (token: GlobalToken) => ({
    titleFontSize: token.fontSizeHeading3,
    subtitleFontSize: token.fontSize,
    iconFontSize: typeof token.fontSizeHeading3 === 'number'
      ? token.fontSizeHeading3 * 3 : `calc(${token.fontSizeHeading3} * 3)`,
    extraMargin: `${token.paddingLG}px 0 0 0`
  }),
  // Оставляет Empty общие токены без дополнительных компонентных defaults.
  Empty: () => ({}),
  // Определяет цвета градиента и высоты заголовка и строк от размера контрола.
  Skeleton: (token: GlobalToken) => ({
    gradientFromColor: token.colorFillContent,
    gradientToColor: token.colorFill,
    titleHeight: token.controlHeight / 2,
    blockRadius: token.borderRadiusSM,
    paragraphMarginTop: token.marginLG + token.marginXXS,
    paragraphLiHeight: token.controlHeight / 2
  }),
  // Выбирает цвета линии, остатка и текста круга. Размер иконки выражает отношением шрифтов темы.
  Progress: (token: GlobalToken) => ({
    circleTextColor: token.colorText,
    defaultColor: token.colorInfo,
    remainingColor: token.colorFillSecondary,
    lineBorderRadius: 100,
    circleTextFontSize: '1em',
    circleIconFontSize: `${token.fontSize / token.fontSizeSM}em`
  }),
  // Задаёт высоту контейнера и три размера индикатора относительно высоты контролов.
  Spin: (token: GlobalToken) => ({
    contentHeight: 400,
    dotSize: token.controlHeightLG / 2,
    dotSizeSM: token.controlHeightLG * 0.35,
    dotSizeLG: token.controlHeight
  }),
  Tabs: prepareTabsTokens,
  Slider: prepareSliderTokens,
  // Регистрирует Flex без дополнительных значений темы по умолчанию.
  Flex: () => ({}),
  // Передаёт отступ текста в em и безразмерное положение подписи.
  Divider: (token: GlobalToken) => ({
    textPaddingInline: '1em',
    orientationMargin: 0.05,
    verticalMarginInline: token.marginXS
  }),
  Button: prepareButtonTokens,
  Input: prepareInputTokens,
  InputNumber: prepareInputNumberTokens,
  // Оставляет Addon общие токены до применения локальных значений темы.
  Addon: () => ({}),
  Radio: prepareRadioTokens,
  // Оставляет Checkbox общие токены контрола без отдельного набора defaults.
  Checkbox: () => ({}),
  Switch: prepareSwitchTokens,
  Avatar: prepareAvatarTokens,
  Badge: prepareBadgeTokens,
  Tag: prepareTagTokens,
  Tooltip: prepareTooltipTokens,
  Popover: preparePopoverTokens,
  Popconfirm: preparePopconfirmTokens,
  Select: prepareSelectTokens,
  TreeSelect: prepareTreeSelectTokens,
  Cascader: prepareCascaderTokens,
  // Считает логические отступы ссылки по шкале padding темы.
  Anchor: (token: GlobalToken) => ({
    linkPaddingBlock: token.paddingXXS,
    linkPaddingInlineStart: token.padding
  }),
  Menu: prepareMenuTokens,
  Dropdown: prepareDropdownTokens,
  // Разделяет цвета ссылки, последнего пункта и разделителя, учитывая отдельный hover.
  Breadcrumb: (token: GlobalToken) => ({
    itemColor: token.colorTextDescription,
    lastItemColor: token.colorText,
    iconFontSize: token.fontSize,
    linkColor: token.colorTextDescription,
    linkHoverColor: token.colorText,
    separatorColor: token.colorTextDescription,
    separatorMargin: token.marginXS
  }),
  // Готовит размеры точек и иконок и цвета ожидания и завершения с учётом wireframe.
  Steps: (token: GlobalToken) => ({
    customIconSize: token.controlHeight,
    customIconTop: 0,
    customIconFontSize: token.controlHeightSM,
    iconSize: token.controlHeight,
    iconTop: -0.5,
    iconFontSize: token.fontSize,
    iconSizeSM: token.fontSizeHeading3,
    dotSize: token.controlHeight / 4,
    dotCurrentSize: token.controlHeightLG / 4,
    navArrowColor: token.colorTextDisabled,
    navContentMaxWidth: 'unset',
    waitIconColor: token.wireframe ? token.colorTextDisabled : token.colorTextLabel,
    waitIconBgColor: token.wireframe ? token.colorBgContainer : token.colorFillContent,
    waitIconBorderColor: token.wireframe ? token.colorTextDisabled : 'transparent',
    finishIconBgColor: token.wireframe ? token.colorBgContainer : token.controlItemBgActive,
    finishIconBorderColor: token.wireframe ? token.colorPrimary : token.controlItemBgActive
  }),
  // Определяет цвет и толщину линии. Размер и фон точки могут наследоваться из остального стиля.
  Timeline: (token: GlobalToken) => ({
    tailColor: token.colorSplit,
    tailWidth: token.lineWidthBold,
    dotBorderWidth: token.lineWidthBold,
    dotBg: undefined,
    dotSize: undefined,
    itemPaddingBottom: token.padding * 1.25
  }),
  // Привязывает размеры пунктов к высотам контролов и добавляет токены поля размера страницы.
  Pagination: (token: GlobalToken) => ({
    itemBg: token.colorBgContainer,
    itemSize: token.controlHeight,
    itemSizeSM: token.controlHeightSM,
    itemSizeLG: token.controlHeightLG,
    itemActiveBg: token.colorBgContainer,
    itemActiveColor: token.colorPrimary,
    itemActiveColorHover: token.colorPrimaryHover,
    itemLinkBg: token.colorBgContainer,
    itemActiveColorDisabled: token.colorTextDisabled,
    itemActiveBgDisabled: token.controlItemBgActiveDisabled,
    itemInputBg: token.colorBgContainer,
    miniOptionsSizeChangerTop: 0,
    ...prepareInputTokens(token)
  })
};
const componentUnitless: Record<StyledComponent, readonly string[]> = {
  App: [],
  Grid: [],
  Table: ['expandIconScale'],
  Notification: [],
  Message: [],
  Modal: ['titleLineHeight'],
  Drawer: [],
  Upload: [],
  Tour: [],
  Mentions: [],
  ColorPicker: [],
  DatePicker: [],
  Calendar: [],
  Transfer: [],
  Tree: [],
  Listy: [],
  Typography: [],
  Form: [],
  FloatButton: [],
  Affix: [],
  BorderBeam: [],
  Masonry: [],
  Space: [],
  Layout: [],
  Image: [],
  Button: ['fontWeight'],
  Input: [],
  InputNumber: ['handleOpacity'],
  Addon: [],
  Radio: ['radioSize', 'dotSize'],
  Checkbox: [],
  Switch: [],
  Avatar: [],
  Badge: [],
  Tag: [],
  Tooltip: [],
  Popover: [],
  Popconfirm: [],
  Select: ['optionLineHeight', 'optionSelectedFontWeight'],
  TreeSelect: [],
  Cascader: ['optionSelectedFontWeight'],
  Anchor: [],
  Menu: ['groupTitleLineHeight'],
  Dropdown: [],
  Breadcrumb: [],
  Steps: [],
  Timeline: [],
  Pagination: [],
  Tabs: [],
  Slider: [],
  Divider: ['orientationMargin'],
  Flex: [],
  Spin: [],
  Progress: [],
  Skeleton: [],
  Empty: [],
  Result: [],
  Alert: [],
  Collapse: [],
  Card: [],
  Carousel: [],
  Descriptions: [],
  Statistic: [],
  Segmented: [],
  Splitter: [],
  Rate: [],
  QRCode: []
};
const inputMetrics = [
  'paddingBlock', 'paddingBlockSM', 'paddingBlockLG',
  'paddingInline', 'paddingInlineSM', 'paddingInlineLG',
  'inputFontSize', 'inputFontSizeSM', 'inputFontSizeLG'
];
const compactMetrics: Partial<Record<StyledComponent, readonly string[]>> = {
  Button: [
    'contentFontSize', 'contentFontSizeSM', 'contentFontSizeLG',
    'paddingInline', 'paddingInlineSM', 'paddingInlineLG'
  ],
  Input: inputMetrics,
  InputNumber: inputMetrics
};

/** Source getDefaultComponentToken/getComponentToken и CSS-variable registration. */
function resolveComponentVariables(
  component: StyledComponent,
  token: GlobalToken,
  prefix = 'ant',
  explicitKeys: readonly string[] = []
) {
  const custom = { ...token[component] } as Record<string, unknown>;
  const defaults = factories[component]({ ...token, ...custom });

  const merged: Record<string, unknown> = { ...defaults, ...custom };
  const global = token as unknown as Record<string, unknown>;
  for (const key of Object.keys(merged)) {
    // В 6.6.8 одинаковые alias values теряют явный Notification status background.
    const explicitComponentToken = Object.hasOwn(defaults, key) && explicitKeys.includes(key);
    if (merged[key] === global[key] && !explicitComponentToken) delete merged[key];
  }

  // Добавляет имя компонента к локальному ключу перед сериализацией CSS-имени.
  const qualify = (key: string) => `${component}${key[0].toUpperCase()}${key.slice(1)}`;
  for (const key of Object.keys(defaults)) {
    merged[qualify(key)] = merged[key];
    delete merged[key];
  }
  const unitless = new Set([
    ...Object.keys(unitlessTokens), qualify('zIndexPopup'),
    ...componentUnitless[component].map(qualify)
  ]);
  const variables: Record<string, string> = {};
  for (const [key, value] of Object.entries(merged)) {
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    variables[tokenToCSSVariable(key, prefix)] = typeof value === 'number' && !unitless.has(key)
      ? `${value}px` : String(value);
  }

  return { variables, defaultVariables: Object.keys(defaults)
    .map(key => tokenToCSSVariable(qualify(key), prefix)) };
}

// Возвращает только вычисленные значения без добавления inherit для отсутствующих defaults.
export function componentThemeVariables(
  component: StyledComponent,
  token: GlobalToken,
  prefix = 'ant',
  explicitKeys: readonly string[] = []
): Record<string, string> {
  return resolveComponentVariables(component, token, prefix, explicitKeys).variables;
}

// Заполняет отсутствующие переменные defaults значением inherit до сериализации CSS.
export function componentThemeStyle(
  component: StyledComponent,
  token: GlobalToken,
  prefix = 'ant',
  explicitKeys: readonly string[] = []
) {
  const { variables, defaultVariables } = resolveComponentVariables(
    component, token, prefix, explicitKeys
  );
  for (const name of defaultVariables) {
    // В upstream отсутствие декларации наследуется; vendor defaults не должны возвращать её.
    if (!(name in variables)) variables[name] = 'inherit';
  }

  return serializeThemeVariables(variables, prefix);
}

/** Вложенный CSS-корень сбрасывает vendor defaults и наследует переменные своего control. */
export function inheritedComponentThemeStyle(
  component: StyledComponent,
  token: GlobalToken,
  prefix = 'ant'
) {
  const { defaultVariables } = resolveComponentVariables(component, token, prefix);
  return serializeThemeVariables(
    Object.fromEntries(defaultVariables.map(name => [name, 'inherit'])),
    prefix
  );
}

/** Native compact использует исходные метрики controls, сохраняя прежние цвета и остальные стили. */
export function compactComponentThemeStyle(component: StyledComponent, token: GlobalToken) {
  const metrics = compactMetrics[component];
  if (!metrics) {
    return undefined;
  }

  const variables = componentThemeVariables(component, token);
  const selected = Object.fromEntries(metrics.map(key => {
    const qualified = `${component}${key[0].toUpperCase()}${key.slice(1)}`;
    const name = tokenToCSSVariable(qualified, 'ant');
    return [name, variables[name]];
  }));

  return serializeThemeVariables(selected);
}
