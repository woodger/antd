import type { AliasToken, MappingAlgorithm } from './theme-token.types';

/** CSS lengths and font metrics without dependence on React.CSSProperties. */
type ThemeCSSValue = string | number | undefined;

/** The original multi-value transform from CSSObject for Rate.starHoverScale. */
type ThemeTransform = string | readonly string[] | undefined | {
  _skip_check?: boolean;
  _multi_value?: boolean;
  value: string | readonly string[] | (string | readonly string[] | undefined)[] | undefined;
};

export interface AffixComponentToken {
  zIndexPopup: number;
}

export interface AddonComponentToken {
}

export interface AlertComponentToken {
  borderRadius: ThemeCSSValue;
  defaultPadding: ThemeCSSValue;
  withDescriptionPadding: ThemeCSSValue;
  withDescriptionIconSize: number | string;
}

export interface AnchorComponentToken {
  linkPaddingBlock: number;
  linkPaddingInlineStart: number;
}

export interface AvatarComponentToken {
  containerSize: number;
  containerSizeLG: number;
  containerSizeSM: number;
  textFontSize: number;
  textFontSizeLG: number;
  textFontSizeSM: number;
  iconFontSize: number;
  iconFontSizeLG: number | string;
  iconFontSizeSM: number;
  groupSpace: number;
  groupOverlapping: number;
  groupBorderColor: string;
}

export interface BadgeComponentToken {
  indicatorZIndex: number | string;
  indicatorHeight: number | string;
  indicatorHeightSM: number | string;
  dotSize: number;
  textFontSize: number;
  textFontSizeSM: number;
  textFontWeight: number | string;
  statusSize: number;
  paddingInline: number | string;
}

export type BorderBeamComponentToken = object;

export interface ButtonComponentToken {
  fontWeight: ThemeCSSValue;
  iconGap: ThemeCSSValue;
  defaultShadow: string;
  primaryShadow: string;
  dangerShadow: string;
  primaryColor: string;
  defaultColor: string;
  defaultBg: string;
  defaultBorderColor: string;
  dangerColor: string;
  defaultHoverBg: string;
  defaultHoverColor: string;
  defaultHoverBorderColor: string;
  defaultActiveBg: string;
  defaultActiveColor: string;
  defaultActiveBorderColor: string;
  defaultGhostColor: string;
  ghostBg: string;
  defaultGhostBorderColor: string;
  solidTextColor: string;
  textTextColor: string;
  textTextHoverColor: string;
  textTextActiveColor: string;
  paddingInline: ThemeCSSValue;
  paddingInlineLG: ThemeCSSValue;
  paddingInlineSM: ThemeCSSValue;
  onlyIconSize: number | string;
  onlyIconSizeLG: number | string;
  onlyIconSizeSM: number | string;
  linkHoverBg: string;
  textHoverBg: string;
  contentFontSize: number;
  contentFontSizeLG: number;
  contentFontSizeSM: number;
  defaultBgDisabled: string;
  dashedBgDisabled: string;
}

export interface BreadcrumbComponentToken {
  itemColor: string;
  iconFontSize: number;
  linkColor: string;
  linkHoverColor: string;
  lastItemColor: string;
  separatorMargin: number;
  separatorColor: string;
}

export interface CardComponentToken {
  headerBg: string;
  headerFontSize: number | string;
  headerFontSizeSM: number | string;
  headerHeight: number | string;
  headerHeightSM: number | string;
  bodyPaddingSM: number;
  headerPaddingSM: number;
  bodyPadding: number;
  headerPadding: number;
  actionsBg: string;
  actionsLiMargin: string;
  tabsMarginBottom: number;
  extraColor: string;
}

export interface CarouselComponentToken {
  dotWidth: number | string;
  dotHeight: number | string;
  dotGap: number;
  dotOffset: number;
  dotActiveWidth: number | string;
  arrowSize: number;
  arrowOffset: number;
}

export interface CascaderComponentToken {
  controlWidth: number | string;
  controlItemWidth: number | string;
  dropdownHeight: number | string;
  optionSelectedBg: string;
  optionSelectedColor: string;
  optionSelectedFontWeight: ThemeCSSValue;
  optionPadding: ThemeCSSValue;
  menuPadding: ThemeCSSValue;
}

export interface CheckboxComponentToken {
}

export interface ColorPickerComponentToken {
}

export interface CollapseComponentToken {
  headerPadding: ThemeCSSValue;
  headerPaddingSM: ThemeCSSValue;
  headerPaddingLG: ThemeCSSValue;
  headerBg: string;
  contentPadding: ThemeCSSValue;
  contentPaddingSM: ThemeCSSValue;
  contentPaddingLG: ThemeCSSValue;
  contentBg: string;
  borderlessContentPadding: ThemeCSSValue;
  borderlessContentBg: string;
}

/** Common theme DatePicker/RangePicker and both TimePicker: input, panels, presets and popup. */
export interface DatePickerComponentToken {
  paddingInline: number;
  paddingInlineSM: number;
  paddingInlineLG: number;
  paddingBlock: number;
  paddingBlockSM: number;
  paddingBlockLG: number;
  addonBg: string;
  hoverBorderColor: string;
  activeBorderColor: string;
  activeShadow: string;
  errorActiveShadow: string;
  warningActiveShadow: string;
  hoverBg: string;
  activeBg: string;
  inputFontSize: number;
  inputFontSizeLG: number;
  inputFontSizeSM: number;
  multipleItemBg: string;
  multipleItemBorderColor: string;
  multipleItemHeight: number;
  multipleItemHeightSM: number;
  multipleItemHeightLG: number;
  multipleSelectorBgDisabled: string;
  multipleItemColorDisabled: string;
  multipleItemBorderColorDisabled: string;
  cellHoverBg: string;
  cellActiveWithRangeBg: string;
  cellHoverWithRangeBg: string;
  cellBgDisabled: string;
  cellRangeBorderColor: string;
  timeColumnWidth: number;
  timeColumnHeight: number;
  timeCellHeight: number;
  cellHeight: number;
  cellWidth: number;
  textHeight: number;
  withoutTimeCellHeight: number;
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
  presetsWidth: number;
  presetsMaxWidth: number;
  zIndexPopup: number;
}

export interface DescriptionsComponentToken {
  labelBg: string;
  labelColor: string;
  titleColor: string;
  titleMarginBottom: number;
  itemPaddingBottom: number;
  itemPaddingEnd: number;
  colonMarginRight: number;
  colonMarginLeft: number;
  contentColor: string;
  extraColor: string;
}

export interface DividerComponentToken {
  textPaddingInline: ThemeCSSValue;
  orientationMargin?: number;
  verticalMarginInline: ThemeCSSValue;
}

export interface DrawerComponentToken {
  zIndexPopup: number;
  footerPaddingBlock: number;
  footerPaddingInline: number;
  draggerSize: number;
}

export interface DropdownComponentToken {
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  zIndexPopup: number;
  paddingBlock: ThemeCSSValue;
}

export interface EmptyComponentToken {
}

export interface FlexComponentToken {
}

export type FloatButtonComponentToken = object;

/** Form and FormItem tokens; defaults are calculated from alias tokens. */
export interface FormComponentToken {
  labelRequiredMarkColor: string;
  labelColor: string;
  labelFontSize: number;
  labelHeight: number | string;
  /** @internal Explicit labelHeight override, or auto when it is omitted. */
  verticalLabelHeight: number | string;
  labelColonMarginInlineStart: number;
  labelColonMarginInlineEnd: number;
  itemMarginBottom: number;
  inlineItemMarginBottom: number;
  verticalLabelPadding: ThemeCSSValue;
  verticalLabelMargin: ThemeCSSValue;
}

export interface GridComponentToken {
}

export interface MasonryComponentToken {
}

export interface ImageComponentToken {
  zIndexPopup: number;
  previewOperationSize: number;
  previewOperationColor: string;
  previewOperationHoverColor: string;
  previewOperationColorDisabled: string;
  progressAnimationDuration: string;
}

export interface InputComponentToken {
  paddingInline: number;
  paddingInlineSM: number;
  paddingInlineLG: number;
  paddingBlock: number;
  paddingBlockSM: number;
  paddingBlockLG: number;
  addonBg: string;
  hoverBorderColor: string;
  activeBorderColor: string;
  activeShadow: string;
  errorActiveShadow: string;
  warningActiveShadow: string;
  hoverBg: string;
  activeBg: string;
  inputFontSize: number;
  inputFontSizeLG: number;
  inputFontSizeSM: number;
}

export interface InputNumberComponentToken {
  paddingInline: number;
  paddingInlineSM: number;
  paddingInlineLG: number;
  paddingBlock: number;
  paddingBlockSM: number;
  paddingBlockLG: number;
  addonBg: string;
  hoverBorderColor: string;
  activeBorderColor: string;
  activeShadow: string;
  errorActiveShadow: string;
  warningActiveShadow: string;
  hoverBg: string;
  activeBg: string;
  inputFontSize: number;
  inputFontSizeLG: number;
  inputFontSizeSM: number;
  controlWidth: number;
  handleWidth: number;
  handleFontSize: number;
  handleVisible: 'auto' | true;
  handleBg: string;
  handleActiveBg: string;
  handleHoverColor: string;
  handleBorderColor: string;
  filledHandleBg: string;
  handleOpacity: number;
  handleVisibleWidth: number;
}

export interface LayoutComponentToken {
  bodyBg: string;
  headerBg: string;
  headerHeight: number | string;
  headerPadding: ThemeCSSValue;
  headerColor: string;
  footerPadding: ThemeCSSValue;
  footerBg: string;
  siderBg: string;
  triggerHeight: number | string;
  triggerBg: string;
  triggerColor: string;
  zeroTriggerWidth: number;
  zeroTriggerHeight: number;
  lightSiderBg: string;
  lightTriggerBg: string;
  lightTriggerColor: string;
}

/** Listy indents; itemPaddingBlock is also involved in source estimate virtual strings. */
export interface ListyComponentToken {
  itemPaddingBlock: number;
  itemPaddingInline: number;
}

export interface MentionsComponentToken {
  paddingInline: number;
  paddingInlineSM: number;
  paddingInlineLG: number;
  paddingBlock: number;
  paddingBlockSM: number;
  paddingBlockLG: number;
  addonBg: string;
  hoverBorderColor: string;
  activeBorderColor: string;
  activeShadow: string;
  errorActiveShadow: string;
  warningActiveShadow: string;
  hoverBg: string;
  activeBg: string;
  inputFontSize: number;
  inputFontSizeLG: number;
  inputFontSizeSM: number;
  zIndexPopup: number;
  dropdownHeight: number | string;
  controlItemWidth: number | string;
}

export interface NotificationComponentToken {
  zIndexPopup: number;
  width: number | string;
  progressBg: string;
  colorSuccessBg?: string;
  colorErrorBg?: string;
  colorInfoBg?: string;
  colorWarningBg?: string;
}

export interface PaginationComponentToken {
  itemBg: string;
  itemSize: number;
  itemSizeSM: number;
  itemSizeLG: number;
  itemActiveBg: string;
  itemActiveColor: string;
  itemActiveColorHover: string;
  itemLinkBg: string;
  itemActiveBgDisabled: string;
  itemActiveColorDisabled: string;
  itemInputBg: string;
  miniOptionsSizeChangerTop: number;
}

export interface PopoverComponentToken {
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  titleMinWidth: number | string;
  zIndexPopup: number;
  innerPadding: number;
  titlePadding: number | string;
  titleMarginBottom: number;
  titleBorderBottom: string;
  innerContentPadding: number | string;
}

export interface PopconfirmComponentToken {
  zIndexPopup: number;
}

export interface RateComponentToken {
  starColor: string;
  starSize: number;
  starSizeSM: number;
  starSizeLG: number;
  /** String transform; for CSSObject/arrays still saved native scale(1.1). */
  starHoverScale: ThemeTransform;
  starBg: string;
}

export interface RadioComponentToken {
  radioSize: number;
  dotSize: number;
  dotColorDisabled: string;
  buttonBg: string;
  buttonCheckedBg: string;
  buttonColor: string;
  buttonPaddingInline: number;
  buttonCheckedBgDisabled: string;
  buttonCheckedColorDisabled: string;
  buttonSolidCheckedColor: string;
  buttonSolidCheckedBg: string;
  buttonSolidCheckedHoverBg: string;
  buttonSolidCheckedActiveBg: string;
  wrapperMarginInlineEnd: number;
  radioColor: string;
  radioBgColor: string;
}

export interface ResultComponentToken {
  titleFontSize: number | string;
  subtitleFontSize: number;
  iconFontSize: number | string;
  extraMargin: ThemeCSSValue;
}

export interface SegmentedComponentToken {
  itemColor: string;
  itemHoverColor: string;
  itemHoverBg: string;
  itemActiveBg: string;
  itemSelectedBg: string;
  itemSelectedColor: string;
  trackPadding: string | number;
  trackBg: string;
}

export interface SelectComponentToken {
  multipleItemBg: string;
  multipleItemBorderColor: string;
  multipleItemHeight: number;
  multipleItemHeightSM: number;
  multipleItemHeightLG: number;
  multipleSelectorBgDisabled: string;
  multipleItemColorDisabled: string;
  multipleItemBorderColorDisabled: string;
  zIndexPopup: number;
  optionSelectedColor: string;
  optionSelectedFontWeight: ThemeCSSValue;
  optionSelectedBg: string;
  optionActiveBg: string;
  optionPadding: ThemeCSSValue;
  optionFontSize: number;
  optionLineHeight: ThemeCSSValue;
  optionHeight: number;
  selectorBg: string;
  clearBg: string;
  singleItemHeightLG: number;
  showArrowPaddingInlineEnd: number;
  hoverBorderColor: string;
  activeBorderColor: string;
  activeOutlineColor: string;
}

export interface SkeletonComponentToken {
  gradientFromColor: string;
  gradientToColor: string;
  titleHeight: number | string;
  blockRadius: number;
  paragraphMarginTop: number;
  paragraphLiHeight: number;
}

export interface SliderComponentToken {
  controlSize: number;
  railSize: number;
  handleSize: number;
  handleSizeHover: number;
  handleLineWidth: number | string;
  handleLineWidthHover: number | string;
  dotSize: number;
  railBg: string;
  railHoverBg: string;
  trackBg: string;
  trackHoverBg: string;
  handleColor: string;
  handleActiveColor: string;
  handleActiveOutlineColor: string;
  handleColorDisabled: string;
  dotBorderColor: string;
  dotActiveBorderColor: string;
  trackBgDisabled: string;
}

export interface SpinComponentToken {
  contentHeight: number | string;
  dotSize: number;
  dotSizeSM: number;
  dotSizeLG: number;
}

export interface StatisticComponentToken {
  titleFontSize: number;
  contentFontSize: number | string;
}

export interface SwitchComponentToken {
  trackHeight: number | string;
  trackHeightSM: number | string;
  trackMinWidth: number | string;
  trackMinWidthSM: number | string;
  trackPadding: number;
  handleBg: string;
  handleShadow: string;
  handleSize: number;
  handleSizeSM: number;
  innerMinMargin: number;
  innerMaxMargin: number;
  innerMinMarginSM: number;
  innerMaxMarginSM: number;
}

export interface SplitterComponentToken {
  splitBarDraggableSize: number;
  splitBarSize: number;
  splitTriggerSize: number;
}

export interface TagComponentToken {
  defaultBg: string;
  defaultColor: string;
  solidTextColor: string;
}

/** Tree metrics and states. DirectoryTree-only tokens do not add a separate API yet. */
export interface TreeComponentToken {
  titleHeight: number;
  switcherSize?: number;
  indentSize?: number;
  nodeHoverBg: string;
  nodeHoverColor: string;
  nodeSelectedBg: string;
  nodeSelectedColor: string;
  directoryNodeSelectedColor: string;
  directoryNodeSelectedBg: string;
}

export interface TreeSelectComponentToken {
  titleHeight: number;
  switcherSize?: number;
  indentSize?: number;
  nodeHoverBg: string;
  nodeHoverColor: string;
  nodeSelectedBg: string;
  nodeSelectedColor: string;
}

/** Typography Header Indentations; font/color aliases are configured by common theme API. */
export interface TypographyComponentToken {
  /** Indentation of the header after the previous element; by default 1.2em. */
  titleMarginTop: number | string;
  /** Bottom indentation of the title; by default 0.5em. */
  titleMarginBottom: number | string;
}

export interface TimelineComponentToken {
  tailColor?: string;
  tailWidth?: number | string;
  dotBorderWidth?: number | string;
  dotSize?: number | string;
  dotBg?: string;
  itemPaddingBottom?: number;
}

/** The sizes of lists, rows, and the Transfer header; the numbers are converted to px, CSS strings are saved. */
export interface TransferComponentToken {
  listWidth: number | string;
  listWidthLG: number | string;
  listHeight: number | string;
  itemHeight: number | string;
  itemPaddingBlock: number | string;
  headerHeight: number | string;
}

export interface TabsComponentToken {
  zIndexPopup: number;
  cardBg: string;
  cardHeight: number;
  cardHeightSM: number;
  cardHeightLG: number;
  cardPadding: string;
  cardPaddingSM: string;
  cardPaddingLG: string;
  titleFontSize: number;
  titleFontSizeLG: number;
  titleFontSizeSM: number;
  inkBarColor: string;
  horizontalMargin: string;
  horizontalItemGutter: number;
  horizontalItemMargin: string;
  horizontalItemMarginRTL: string;
  horizontalItemPadding: string;
  horizontalItemPaddingLG: string;
  horizontalItemPaddingSM: string;
  verticalItemPadding: string;
  verticalItemMargin: string;
  itemColor: string;
  itemActiveColor: string;
  itemHoverColor: string;
  itemSelectedColor: string;
  cardGutter: number;
}

/** The minimum width of the hats, the height of the mini and the colors of Calendar; the default panels are internal. */
export interface CalendarComponentToken {
  yearControlWidth: number | string;
  monthControlWidth: number | string;
  miniContentHeight: number | string;
  fullBg: string;
  fullPanelBg: string;
  itemActiveBg: string;
}

export interface StepsComponentToken {
  customIconSize: number;
  customIconTop: number;
  customIconFontSize: number;
  iconSize: number;
  iconTop: number;
  iconFontSize: number;
  dotSize: number;
  dotCurrentSize: number;
  navArrowColor: string;
  navContentMaxWidth: ThemeCSSValue;
  iconSizeSM: number | string;

}

export interface MenuComponentToken {
  dropdownWidth: number | string;
  zIndexPopup: number;
  groupTitleColor: string;
  groupTitleLineHeight: string | number;
  groupTitleFontSize: number;
  itemBorderRadius: number;
  subMenuItemBorderRadius: number;
  itemColor: string;
  itemHoverColor: string;
  horizontalItemHoverColor: string;
  itemSelectedColor: string;
  subMenuItemSelectedColor: string;
  horizontalItemSelectedColor: string;
  itemDisabledColor: string;
  dangerItemColor: string;
  dangerItemHoverColor: string;
  dangerItemSelectedColor: string;
  dangerItemActiveBg: string;
  dangerItemSelectedBg: string;
  itemBg: string;
  itemHoverBg: string;
  subMenuItemBg: string;
  itemActiveBg: string;
  itemSelectedBg: string;
  horizontalItemSelectedBg: string;
  activeBarWidth: number | string;
  activeBarHeight: number;
  activeBarBorderWidth: number | string;
  itemMarginInline: number;
  horizontalItemHoverBg: string;
  horizontalItemBorderRadius: number;
  itemHeight: number | string;
  collapsedWidth: number | string;
  popupBg: string;
  itemMarginBlock: ThemeCSSValue;
  itemPaddingInline: ThemeCSSValue;
  horizontalLineHeight: ThemeCSSValue;
  iconMarginInlineEnd: ThemeCSSValue;
  iconSize: number;
  collapsedIconSize: number;
  darkPopupBg: string;
  darkItemColor: string;
  darkDangerItemColor: string;
  darkItemBg: string;
  darkSubMenuItemBg: string;
  darkItemSelectedColor: string;
  darkItemSelectedBg: string;
  darkItemHoverBg: string;
  darkGroupTitleColor: string;
  darkItemHoverColor: string;
  darkItemDisabledColor: string;
  darkDangerItemSelectedBg: string;
  darkDangerItemHoverColor: string;
  darkDangerItemSelectedColor: string;
  darkDangerItemActiveBg: string;
  itemWidth: number | string;
}

export interface ModalComponentToken {
  headerBg: string;
  titleLineHeight: number | string;
  titleFontSize: number | string;
  titleColor: string;
  contentBg: string;
  footerBg: string;
  contentPadding: number | string;
  headerPadding: string | number;
  headerBorderBottom: string;
  headerMarginBottom: number;
  bodyPadding: number;
  footerPadding: string | number;
  footerBorderTop: string;
  footerBorderRadius: string | number;
  footerMarginTop: string | number;
  confirmBodyPadding: string | number;
  confirmIconMarginInlineEnd: string | number;
  confirmBtnsMarginTop: string | number;
}

export interface MessageComponentToken {
  zIndexPopup: number;
  contentBg: string;
  contentPadding: ThemeCSSValue;
}

export interface UploadComponentToken {
  actionsColor: string;
  pictureCardSize: number;
}

export interface TooltipComponentToken {
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
  maxWidth: number;
  zIndexPopup: number;
}

export interface TableComponentToken {
  headerBg: string;
  headerColor: string;
  headerSortActiveBg: string;
  headerSortHoverBg: string;
  bodySortBg: string;
  rowHoverBg: string;
  rowSelectedBg: string;
  rowSelectedHoverBg: string;
  rowExpandedBg: string;
  cellPaddingBlock: number;
  cellPaddingInline: number;
  cellPaddingBlockMD: number;
  cellPaddingInlineMD: number;
  cellPaddingBlockSM: number;
  cellPaddingInlineSM: number;
  borderColor: string;
  headerBorderRadius: number;
  footerBg: string;
  footerColor: string;
  cellFontSize: number;
  cellFontSizeMD: number;
  cellFontSizeSM: number;
  headerSplitColor: string;
  fixedHeaderSortActiveBg: string;
  headerFilterHoverBg: string;
  filterDropdownMenuBg: string;
  filterDropdownBg: string;
  expandIconBg: string;
  selectionColumnWidth: number | string;
  stickyScrollBarBg: string;
  stickyScrollBarBorderRadius: number;
  expandIconMarginTop: number;
  expandIconHalfInner: number;
  expandIconSize: number;
  expandIconScale: number;
  headerIconColor: string;
  headerIconHoverColor: string;
}

export interface SpaceComponentToken {
}

export interface ProgressComponentToken {
  defaultColor: string;
  remainingColor: string;
  circleTextColor: string;
  lineBorderRadius: number;
  circleTextFontSize: string;
  circleIconFontSize: string;
}

export interface TourComponentToken {
  arrowOffsetHorizontal: number;
  arrowOffsetVertical: number;
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
  zIndexPopup: number;
  closeBtnSize: number;
  primaryPrevBtnBg: string;
  primaryNextBtnHoverBg: string;
}

export interface QRCodeComponentToken {
}

export interface AppComponentToken {
}

export interface WaveComponentToken {
}

/** Fields ComponentToken from fixed Ant Design 6.6.8; defaults compute component styles. */
export interface ComponentTokenMap {
  Affix?: AffixComponentToken;
  Addon?: AddonComponentToken;
  Alert?: AlertComponentToken;
  Anchor?: AnchorComponentToken;
  Avatar?: AvatarComponentToken;
  Badge?: BadgeComponentToken;
  BorderBeam?: BorderBeamComponentToken;
  Button?: ButtonComponentToken;
  Breadcrumb?: BreadcrumbComponentToken;
  Card?: CardComponentToken;
  Carousel?: CarouselComponentToken;
  Cascader?: CascaderComponentToken;
  Checkbox?: CheckboxComponentToken;
  ColorPicker?: ColorPickerComponentToken;
  Collapse?: CollapseComponentToken;
  DatePicker?: DatePickerComponentToken;
  Descriptions?: DescriptionsComponentToken;
  Divider?: DividerComponentToken;
  Drawer?: DrawerComponentToken;
  Dropdown?: DropdownComponentToken;
  Empty?: EmptyComponentToken;
  Flex?: FlexComponentToken;
  FloatButton?: FloatButtonComponentToken;
  Form?: FormComponentToken;
  Grid?: GridComponentToken;
  Masonry?: MasonryComponentToken;
  Image?: ImageComponentToken;
  Input?: InputComponentToken;
  InputNumber?: InputNumberComponentToken;
  Layout?: LayoutComponentToken;
  Listy?: ListyComponentToken;
  Mentions?: MentionsComponentToken;
  Notification?: NotificationComponentToken;
  Pagination?: PaginationComponentToken;
  Popover?: PopoverComponentToken;
  Popconfirm?: PopconfirmComponentToken;
  Rate?: RateComponentToken;
  Radio?: RadioComponentToken;
  Result?: ResultComponentToken;
  Segmented?: SegmentedComponentToken;
  Select?: SelectComponentToken;
  Skeleton?: SkeletonComponentToken;
  Slider?: SliderComponentToken;
  Spin?: SpinComponentToken;
  Statistic?: StatisticComponentToken;
  Switch?: SwitchComponentToken;
  Splitter?: SplitterComponentToken;
  Tag?: TagComponentToken;
  Tree?: TreeComponentToken;
  TreeSelect?: TreeSelectComponentToken;
  Typography?: TypographyComponentToken;
  Timeline?: TimelineComponentToken;
  Transfer?: TransferComponentToken;
  Tabs?: TabsComponentToken;
  Calendar?: CalendarComponentToken;
  Steps?: StepsComponentToken;
  Menu?: MenuComponentToken;
  Modal?: ModalComponentToken;
  Message?: MessageComponentToken;
  Upload?: UploadComponentToken;
  Tooltip?: TooltipComponentToken;
  Table?: TableComponentToken;
  Space?: SpaceComponentToken;
  Progress?: ProgressComponentToken;
  Tour?: TourComponentToken;
  QRCode?: QRCodeComponentToken;
  App?: AppComponentToken;
  /** @private Internal Wave entry, matching the upstream ComponentTokenMap. */
  Wave?: WaveComponentToken;
}

/** AliasToken with ConfigProvider component overrides transferred. */
export type GlobalToken = AliasToken & ComponentTokenMap;

export type OverrideToken = {
  [Key in keyof ComponentTokenMap]: Partial<ComponentTokenMap[Key]> & Partial<AliasToken>;
};

/** the algorithm=true uses an overall algorithm; false leaves component overrides without calculation. */
export type ComponentsConfig = {
  [Key in keyof OverrideToken]?: OverrideToken[Key] & {
    algorithm?: boolean | MappingAlgorithm | readonly MappingAlgorithm[];
  };
};
