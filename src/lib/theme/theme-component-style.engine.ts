// Converts component tokens into CSS variables. Takes into account the general and local layers,
// namespace of the component, dimensionless values and inheritance vendor defaults.
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
import { FastColor } from '../color/fast-color.engine';
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
  // Registers App without additional default values. The resolution of common tokens remains in the
  // current theme.
  App: () => ({}),
  // Leaves Grid common theme tokens without a separate set of component defaults.
  Grid: () => ({}),
  Table: prepareTableTokens,
  // Sets the layer, width and color of progress. The status backgrounds remain uncertain until
  // redefined.
  Notification: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 1050,
    width: 384,
    progressBg: `linear-gradient(90deg, ${token.colorPrimaryBorderHover}, ${token.colorPrimary})`,
    colorSuccessBg: undefined,
    colorErrorBg: undefined,
    colorInfoBg: undefined,
    colorWarningBg: undefined
  }),
  // Chooses an elevated background and vertically centers the message at the large control height.
  Message: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 1010,
    contentBg: token.colorBgElevated,
    contentPadding:
      `${(token.controlHeightLG - token.fontSize * token.lineHeight) / 2}px ${token.paddingSM}px`
  }),
  // Determines the size of the sections and indents confirm. In the wireframe returns the boundaries of the header and footer.
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
  // Provides the base layer of the opening panel and the footer and dragger metrics.
  Drawer: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase,
    footerPaddingBlock: token.paddingXS,
    footerPaddingInline: token.padding,
    draggerSize: 4
  }),
  // Specifies the color of the actions and scales the image card from the height of a large control.
  Upload: (token: GlobalToken) => ({
    actionsColor: token.colorIcon,
    pictureCardSize: token.controlHeightLG * 2.55
  }),
  // Prepares arrow metrics with navigation colors on top of the substrate and a separate popup layer.
  Tour: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 70,
    closeBtnSize: token.fontSize * token.lineHeight,
    primaryPrevBtnBg: new FastColor(token.colorTextLightSolid).setA(0.15).toRgbString(),
    primaryNextBtnHoverBg: new FastColor(token.colorBgTextHover)
      .onBackground(token.colorWhite).toRgbString(),
    ...prepareArrowOffsets(token.borderRadiusLG),
    ...prepareArrowTokens(token)
  }),
  // Takes tokens from Input and adds list height and vertical indentation.
  Mentions: (token: GlobalToken) => ({
    ...prepareInputTokens(token),
    dropdownHeight: 250,
    controlItemWidth: 100,
    zIndexPopup: token.zIndexPopupBase + 50,
    itemPaddingVertical: (token.controlHeight - token.fontHeight) / 2
  }),
  // Requires ColorPicker common tokens prior to the application of the subject instance overrides.
  ColorPicker: () => ({}),
  // Collects common field tokens, calendar panel and arrows, complementing them with presets metrics.
  DatePicker: (token: GlobalToken) => ({
    ...prepareInputTokens(token),
    ...preparePickerPanelTokens(token),
    ...prepareArrowTokens(token),
    presetsWidth: 120,
    presetsMaxWidth: 200,
    zIndexPopup: token.zIndexPopupBase + 50
  }),
  // Reuses the metrics of the calendar panel and sets the sizes of full-screen and mini-elements.
  Calendar: (token: GlobalToken) => ({
    fullBg: token.colorBgContainer,
    fullPanelBg: token.colorBgContainer,
    itemActiveBg: token.controlItemBgActive,
    yearControlWidth: 80,
    monthControlWidth: 70,
    miniContentHeight: 256,
    ...preparePickerPanelTokens(token)
  }),
  // Considers the vertical indentations of the line and the title from the total height of the text and controls.
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
  // Derives logical row spacing from the shared theme dimensions.
  Listy: (token: GlobalToken) => ({
    itemPaddingBlock: token.paddingSM,
    itemPaddingInline: token.padding
  }),
  // Returns the indents of the title to em so that they depend on the size of its font.
  Typography: () => ({ titleMarginTop: '1.2em', titleMarginBottom: '0.5em' }),
  // Specifies label parameters and intervals. In the vertical mode the height depends on the
  // obvious labelHeight.
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
  // Leaves a common theme for FloatButton without additional local defaults.
  FloatButton: () => ({}),
  // Sets a layer of fixed element relative to zIndexBase.
  Affix: (token: GlobalToken) => ({ zIndexPopup: token.zIndexBase + 10 }),
  // Requires general tokens for BorderBeam, additional parameters come from CSS and instance
  // settings.
  BorderBeam: () => ({}),
  // Registers Masonry without the eligibility values of the default theme.
  Masonry: () => ({}),
  // Provides Space with a common theme indentation scale without component defaults.
  Space: () => ({}),
  // Determines the dimensions of the sections, the general and individual colors of the dark and light Sider.
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
  // Sets a preview layer and three levels of transparency of action icons.
  Image: (token: GlobalToken) => ({
    zIndexPopup: token.zIndexPopupBase + 80,
    previewOperationColor: new FastColor(token.colorTextLightSolid).setA(0.65).toRgbString(),
    previewOperationHoverColor: new FastColor(token.colorTextLightSolid).setA(0.85).toRgbString(),
    previewOperationColorDisabled: new FastColor(token.colorTextLightSolid).setA(0.25).toRgbString(),
    previewOperationSize: token.fontSizeIcon * 1.5,
    progressAnimationDuration: '3s'
  }),
  // Uses the background of a container with fixed transparency to cover QRCode.
  QRCode: (token: GlobalToken) => ({
    QRCodeCoverBackgroundColor: new FastColor(token.colorBgContainer).setA(0.96).toRgbString()
  }),
  // Measures the stars from the heights of three-size controls. Zero track width remains zero.
  Rate: (token: GlobalToken) => ({
    lineWidthFocus: token.lineWidthFocus === 0 ? 0 : token.lineWidth,
    starColor: token.yellow6,
    starSize: token.controlHeight * 0.625,
    starSizeSM: token.controlHeightSM * 0.625,
    starSizeLG: token.controlHeightLG * 0.625,
    starHoverScale: 'scale(1.1)',
    starBg: token.colorFillContent
  }),
  // Sets the dimensions of the separator and the capture area. For the drag-area the clearly set
  // zero is preserved.
  Splitter: (token: GlobalToken & Partial<SplitterComponentToken>) => {
    return {
      splitBarSize: token.splitBarSize || 2,
      splitTriggerSize: token.splitTriggerSize || 6,
      splitBarDraggableSize: token.splitBarDraggableSize ?? 20
    };
  },
  // Defines the background of the track and the colors of the items for the usual, hover, active and selected states.
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
  // Separates the text sizes of the title and numerical content.
  Statistic: (token: GlobalToken) => ({
    titleFontSize: token.fontSize,
    contentFontSize: token.fontSizeHeading3
  }),
  // Sets the colors of the label, title and values, as well as indentations of strings and colons.
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
  // Determines the size of the arrows, markers and the active point. The theme sets the distance to
  // the arrow and gap.
  Carousel: (token: GlobalToken) => ({
    arrowSize: 16,
    arrowOffset: token.marginXS,
    dotWidth: 16,
    dotHeight: 3,
    dotGap: token.marginXXS,
    dotOffset: 12,
    dotActiveWidth: 24
  }),
  // Considers the height of the title from the text and indents and preserves the obvious bodyPadding and headerPadding.
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
  // Allows the size of the header and body for three sizes. Borderless uses separate background and
  // indentation.
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
  // Select metrics for a simple message and an option with a description.
  Alert: (token: GlobalToken) => ({
    borderRadius: token.borderRadiusLG,
    withDescriptionIconSize: token.fontSizeHeading3,
    defaultPadding: `${token.paddingContentVerticalSM}px 12px`,
    withDescriptionPadding: `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`
  }),
  // Scales the icon from the size of the header, saving CSS-expression for string size.
  Result: (token: GlobalToken) => ({
    titleFontSize: token.fontSizeHeading3,
    subtitleFontSize: token.fontSize,
    iconFontSize: typeof token.fontSizeHeading3 === 'number'
      ? token.fontSizeHeading3 * 3 : `calc(${token.fontSizeHeading3} * 3)`,
    extraMargin: `${token.paddingLG}px 0 0 0`
  }),
  // Leaves Empty common tokens without additional component defaults.
  Empty: () => ({}),
  // Determines the colors of the gradient and the height of the header and lines from the size of the control.
  Skeleton: (token: GlobalToken) => ({
    gradientFromColor: token.colorFillContent,
    gradientToColor: token.colorFill,
    titleHeight: token.controlHeight / 2,
    blockRadius: token.borderRadiusSM,
    paragraphMarginTop: token.marginLG + token.marginXXS,
    paragraphLiHeight: token.controlHeight / 2
  }),
  // Choose the colors of the line, residue and text of the circle. The size of the icon expresses the ratio of fonts of the theme.
  Progress: (token: GlobalToken) => ({
    circleTextColor: token.colorText,
    defaultColor: token.colorInfo,
    remainingColor: token.colorFillSecondary,
    lineBorderRadius: 100,
    circleTextFontSize: '1em',
    circleIconFontSize: `${token.fontSize / token.fontSizeSM}em`
  }),
  // Sets the height of the container and the three sizes of the indicator relative to the height of the controls.
  Spin: (token: GlobalToken) => ({
    contentHeight: 400,
    dotSize: token.controlHeightLG / 2,
    dotSizeSM: token.controlHeightLG * 0.35,
    dotSizeLG: token.controlHeight
  }),
  Tabs: prepareTabsTokens,
  Slider: prepareSliderTokens,
  // Registers Flex with no additional default theme values.
  Flex: () => ({}),
  // Provides text indentation in em and a unitless label position.
  Divider: (token: GlobalToken) => ({
    textPaddingInline: '1em',
    orientationMargin: 0.05,
    verticalMarginInline: token.marginXS
  }),
  Button: prepareButtonTokens,
  Input: prepareInputTokens,
  InputNumber: prepareInputNumberTokens,
  // Requires Addon common tokens prior to the application of the theme's local meanings.
  Addon: () => ({}),
  Radio: prepareRadioTokens,
  // Leaves Checkbox common control tokens without a separate set of defaults.
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
  // Considers the logical indents of the link on the padding scale of the theme.
  Anchor: (token: GlobalToken) => ({
    linkPaddingBlock: token.paddingXXS,
    linkPaddingInlineStart: token.padding
  }),
  Menu: prepareMenuTokens,
  Dropdown: prepareDropdownTokens,
  // Separates the colors of the link, the last paragraph and the separator, taking into account a separate hover.
  Breadcrumb: (token: GlobalToken) => ({
    itemColor: token.colorTextDescription,
    lastItemColor: token.colorText,
    iconFontSize: token.fontSize,
    linkColor: token.colorTextDescription,
    linkHoverColor: token.colorText,
    separatorColor: token.colorTextDescription,
    separatorMargin: token.marginXS
  }),
  // Prepares the sizes of points and icons and the colors of waiting and completion, taking into account the wireframe.
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
  // Determines the color and thickness of the line. The size and background of the dot can be inherited from the rest of the style.
  Timeline: (token: GlobalToken) => ({
    tailColor: token.colorSplit,
    tailWidth: token.lineWidthBold,
    dotBorderWidth: token.lineWidthBold,
    dotBg: undefined,
    dotSize: undefined,
    itemPaddingBottom: token.padding * 1.25
  }),
  // Ties point sizes to control heights and adds tokens of page size fields.
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

/** source getDefaultComponentToken/getComponentToken and CSS-variable registration. */
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
    // In 6.6.8, the same alias values lose a clear Notification status background.
    const explicitComponentToken = Object.hasOwn(defaults, key) && explicitKeys.includes(key);
    if (merged[key] === global[key] && !explicitComponentToken) delete merged[key];
  }

  // Adds a component name to a local key before serializing the CSS name.
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

// Returns only calculated values without adding inherit for missing defaults.
export function componentThemeVariables(
  component: StyledComponent,
  token: GlobalToken,
  prefix = 'ant',
  explicitKeys: readonly string[] = []
): Record<string, string> {
  return resolveComponentVariables(component, token, prefix, explicitKeys).variables;
}

// Fills the missing defaults variables with the value of inherit before serialization CSS.
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
    // In upstream, the lack of a declaration is inherited; vendor defaults must not return it.
    if (!(name in variables)) variables[name] = 'inherit';
  }

  return serializeThemeVariables(variables, prefix);
}

/** The nested CSS-root resets default vendors and inherits the variables of its control. */
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

/** Native compact uses the original metrics of the controls, preserving the previous colors and other styles. */
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
