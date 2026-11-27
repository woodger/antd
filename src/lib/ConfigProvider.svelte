<script lang="ts">
  import type { SelectConfig } from './select.types';
  import type { UploadConfig } from './upload/upload.types';
  import type { FormConfig } from './form/form.types';
  import type { AppConfig } from './app.types';
  import type { StatisticConfig } from './statistic.types';
  import type { TimelineConfig } from './timeline.types';
  import type { StepsConfig } from './steps.types';
  import type { LayoutConfig } from './layout.types';
  import type { TreeSelectConfig } from './tree-select.types';
  import type { TreeConfig } from './tree.types';
  import type { DatePickerConfig } from './date-picker.types';
  import type { CardConfig, CardMetaConfig } from './card.types';
  import type { MentionsComponentConfig } from './mentions/mentions.types';
  import type { DescriptionsConfig } from './descriptions.types';
  import type { AnchorConfig } from './anchor.types';
  import type { BreadcrumbConfig } from './breadcrumb.types';
  import type { DropdownConfig } from './dropdown.types';
  import type { MenuConfig } from './menu.types';
  import type { FloatButtonConfig, FloatButtonGroupConfig } from './float-button.types';
  import type { ButtonConfig } from './button/button.types';
  import type { TabsConfig } from './tabs.types';
  import type { BadgeRibbonConfig } from './badge-ribbon.types';
  import type { BadgeConfig } from './badge.types';
  import type { TagConfig } from './tag.types';
  import type { AvatarConfig } from './avatar.types';
  import type { TooltipConfig } from './tooltip.types';
  import type { PopoverConfig } from './popover.types';
  import type { PopconfirmConfig } from './popconfirm.types';
  import type { DrawerConfig } from './drawer.types';
  import type { ModalConfig } from './modal.types';
  import type { MessageAppearance } from './message.types';
  import type { NotificationProviderConfig } from './notification.types';
  import type { RateConfig } from './rate/rate.types';
  import type { WatermarkConfig } from './watermark.types';
  import type { AffixConfig } from './affix.types';
  import type { BorderBeamConfig } from './border-beam.types';
  import type { MasonryConfig } from './masonry.types';
  import type { SplitterConfig } from './splitter.types';
  import type { QRCodeConfig } from './qrcode.types';
  import type { CalendarConfig } from './calendar.types';
  import type { TimePickerConfig } from './time-picker.types';
  import type { CascaderConfig } from './cascader.types';
  import type { TransferConfig } from './transfer/transfer.types';
  import type { PaginationComponentConfig } from './pagination.types';
  import type { TableConfig } from './table.types';
  import type { ListyConfig } from './listy.types';
  import type { TypographyConfig } from './typography.types';
  import type { TourConfig } from './tour.types';
  import type { CarouselConfig } from './carousel.types';
  import type { SliderConfig } from './slider/slider-range.types';
  import type { DividerConfig } from './divider.types';
  import type { FlexConfig } from './flex.types';
  import type { SpinConfig } from './spin.types';
  import type { ProgressConfig } from './progress.types';
  import type { SkeletonConfig } from './skeleton.types';
  import type { EmptyConfig } from './empty.types';
  import type { ResultConfig } from './result.types';
  import type { AlertConfig } from './alert/alert.types';
  import type { CollapseConfig } from './collapse.types';
  import type { SegmentedConfig } from './segmented/segmented.types';
  import type { SpaceConfig } from './space.types';
  import type { ColorPickerConfig } from './color-picker/color-picker.types';
  import type { InputNumberConfig } from './input-number/input-number.types';
  import type { RadioConfig } from './radio/radio.types';
  import type { CheckboxConfig } from './checkbox/checkbox.types';
  import type { SwitchConfig } from './switch/switch.types';
  import type { WaveConfig } from './wave.types';
  import type { GetPopupContainer, GetTargetContainer, PopupOverflow, RenderEmptyHandler } from './types';
  import type { RangePickerConfig } from './range-picker.types';
  import type { InputConfig } from './input/input.types';
  import type { InputPasswordConfig } from './input/input-password.types';
  import type { InputSearchConfig } from './input/input-search.types';
  import type { InputOTPConfig } from './input/input-otp.types';
  import type { TextAreaConfig } from './input/textarea.types';
  import type { Snippet } from 'svelte';
  import { provideConfig, useConfig, type ConfigContext } from './config-context';
  import { provideDesignTokens, useDesignTokenContext } from './theme-context.svelte';
  import { getGridMediaCss, getGridMediaScope } from './grid-style.engine';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import type { ComponentSize, CSPConfig, Variant, Locale, ThemeConfig } from './types';
  import type { AntDesignLocale } from './locale.types';
  import { resolveProviderLocale } from './locale.engine';
  import { registerModalLocale } from './modal-locale.dom';
  import './styles.css';

  /** Provides inherited theme, locale, and component settings to the Svelte subtree. */
  export interface ConfigProviderProps {
    children: Snippet;
    /** Shared class prefix. See the README for the components that use it. */
    prefixCls?: string;
    /** Namespace for the default Modal confirmation icons. */
    iconPrefixCls?: string;
    /** Nonce for provider and component styles. An explicit object replaces the parent's CSP settings. */
    csp?: CSPConfig;
    /** Partially overrides the parent theme. Other fields are inherited. */
    theme?: ThemeConfig;
    /** Shared appearance for fields and Card. Local props, Form, and component configuration take precedence. */
    variant?: Variant;
    /** Form defaults. undefined inherits the record, while any object replaces it in full. */
    form?: FormConfig;
    /** Shared class and style for the App wrapper. Local props take precedence. */
    app?: AppConfig;
    /** Shared classes and styles for Statistic and Timer. An explicit record replaces the parent's record in full. */
    statistic?: StatisticConfig;
    /** Shared classes and semantic styles for Timeline. An explicit record replaces the parent's record. */
    timeline?: TimelineConfig;
    /** Shared classes and styles for Steps. An explicit record replaces the parent's record in full. */
    steps?: StepsConfig;
    /** Shared class and style for the Layout container. An explicit record replaces the parent's record. */
    layout?: LayoutConfig;
    select?: SelectConfig;
    treeSelect?: TreeSelectConfig;
    /** Slots for Tree and DirectoryTree. An explicit record replaces the parent's record in full. */
    tree?: TreeConfig;
    datePicker?: DatePickerConfig;
    card?: CardConfig;
    cardMeta?: CardMetaConfig;
    descriptions?: DescriptionsConfig;
    anchor?: AnchorConfig;
    breadcrumb?: BreadcrumbConfig;
    /** Dropdown classes and styles. undefined inherits the record, while an object replaces it in full. */
    dropdown?: DropdownConfig;
    /** Menu classes, styles, and expand icon. undefined inherits the parent's record. */
    menu?: MenuConfig;
    mentions?: MentionsComponentConfig;
    button?: ButtonConfig;
    tabs?: TabsConfig;
    ribbon?: BadgeRibbonConfig;
    badge?: BadgeConfig;
    tag?: TagConfig;
    avatar?: AvatarConfig;
    tooltip?: TooltipConfig;
    popover?: PopoverConfig;
    popconfirm?: PopconfirmConfig;
    drawer?: DrawerConfig;
    /** Mask and focus settings for Modal and contextual confirmations. */
    modal?: ModalConfig;
    /** Styles for MessageHolder and its entries. */
    message?: MessageAppearance;
    notification?: NotificationProviderConfig;
    rate?: RateConfig;
    watermark?: WatermarkConfig;
    affix?: AffixConfig;
    borderBeam?: BorderBeamConfig;
    masonry?: MasonryConfig;
    splitter?: SplitterConfig;
    qrcode?: QRCodeConfig;
    calendar?: CalendarConfig;
    timePicker?: TimePickerConfig;
    cascader?: CascaderConfig;
    transfer?: TransferConfig;
    pagination?: PaginationComponentConfig;
    /** Table expansion settings. An explicit record replaces the parent's record in full. */
    table?: TableConfig;
    listy?: ListyConfig;
    typography?: TypographyConfig;
    tour?: TourConfig;
    carousel?: CarouselConfig;
    slider?: SliderConfig;
    divider?: DividerConfig;
    flex?: FlexConfig;
    spin?: SpinConfig;
    progress?: ProgressConfig;
    upload?: UploadConfig;
    skeleton?: SkeletonConfig;
    empty?: EmptyConfig;
    result?: ResultConfig;
    alert?: AlertConfig;
    collapse?: CollapseConfig;
    segmented?: SegmentedConfig;
    space?: SpaceConfig;
    colorPicker?: ColorPickerConfig;
    inputNumber?: InputNumberConfig;
    radio?: RadioConfig;
    checkbox?: CheckboxConfig;
    switch?: SwitchConfig;
    wave?: WaveConfig;
    /** Inherited virtual setting for Tree, Listy, and TreeSelect. */
    virtual?: boolean;
    /** Inherited popup width for Select, AutoComplete, and TreeSelect. */
    popupMatchSelectWidth?: boolean | number;
    /** Inherited overflow area for Select, TreeSelect, Cascader, and AutoComplete.
     * @defaultValue 'viewport'
     */
    popupOverflow?: PopupOverflow;
    /** Callback that renders empty states for controls and Table. Inherits from the parent. */
    renderEmpty?: RenderEmptyHandler;
    /**
     * Inherited popup container. undefined retains the parent function. Tabs, ColorPicker, and the
     * shared Tooltip, Popover, and Dropdown components and their callers use it. Tour reads its
     * local setting as upstream does. Other component families are still being ported. The function
     * runs only in the browser. A ShadowRoot does not automatically receive styles from the
     * document.
     */
    getPopupContainer?: GetPopupContainer;
    /** Shared scroll target for Affix and Anchor. Local component settings take precedence. */
    getTargetContainer?: GetTargetContainer;
    rangePicker?: RangePickerConfig;
    textArea?: TextAreaConfig;
    input?: InputConfig;
    inputPassword?: InputPasswordConfig;
    inputSearch?: InputSearchConfig;
    otp?: InputOTPConfig;
    floatButton?: FloatButtonConfig;
    floatButtonGroup?: FloatButtonGroupConfig;
    /** Inherited control size. Local size and Compact take precedence. */
    componentSize?: ComponentSize;
    /** Inherited disabled state for controls. An explicit local value takes precedence. */
    componentDisabled?: boolean;
    direction?: 'ltr' | 'rtl';
    /** Ant Design locale dictionary or partial Svelte locale settings inherited from the provider. */
    locale?: Partial<Locale> | AntDesignLocale;
    class?: string;
    style?: string;
  }

  let {
    children,
    prefixCls,
    iconPrefixCls,
    csp,
    theme,
    variant,
    form,
    app,
    statistic,
    timeline,
    steps,
    layout,
    select,
    treeSelect,
    tree,
    datePicker,
    card,
    cardMeta,
    descriptions,
    anchor,
    breadcrumb,
    dropdown,
    menu,
    mentions,
    button,
    tabs,
    ribbon,
    badge,
    tag,
    avatar,
    tooltip,
    popover,
    popconfirm,
    drawer,
    modal,
    message,
    notification,
    rate,
    watermark,
    affix,
    borderBeam,
    masonry,
    splitter,
    qrcode,
    calendar,
    timePicker,
    cascader,
    transfer,
    pagination,
    table,
    listy,
    typography,
    tour,
    carousel,
    slider,
    divider,
    flex,
    spin,
    progress,
    upload,
    skeleton,
    empty,
    result,
    alert,
    collapse,
    segmented,
    space,
    colorPicker,
    inputNumber,
    radio,
    checkbox,
    switch: switchConfig,
    wave,
    virtual,
    popupMatchSelectWidth,
    popupOverflow,
    renderEmpty,
    getPopupContainer,
    getTargetContainer,
    rangePicker,
    textArea,
    input,
    inputPassword,
    inputSearch,
    otp,
    floatButton,
    floatButtonGroup,
    componentSize,
    componentDisabled,
    direction,
    locale,
    class: className = '',
    style
  }: ConfigProviderProps = $props();

  const parent = useConfig();
  const parentDesignTokens = useDesignTokenContext();
  const themeId = $props.id();
  let element = $state<HTMLDivElement>();
  function getPrefixCls(suffix?: string, custom?: string) {
    if (custom) {
      return custom;
    }
    const prefix = prefixCls || parent.getPrefixCls();
    return suffix ? `${prefix}-${suffix}` : prefix;
  }
  const designTokens = provideDesignTokens(
    () => theme,
    themeId,
    () => element,
    () => getPrefixCls()
  );
  let gridMediaScope = $derived(designTokens.enabled
    ? getGridMediaScope(designTokens.state.token) : undefined);
  let parentGridMediaScope = $derived(parentDesignTokens.enabled
    ? getGridMediaScope(parentDesignTokens.state.token) : undefined);
  let gridMediaCss = $derived(gridMediaScope && gridMediaScope !== parentGridMediaScope
    ? getGridMediaCss(designTokens.state.token) : undefined);
  let providerLocale = $derived(resolveProviderLocale(locale));
  $effect(() => {
    if (locale) {
      return registerModalLocale(locale);
    }
  });
  const config: ConfigContext = {
    getPrefixCls,
    get iconPrefixCls() {
      return iconPrefixCls || parent.iconPrefixCls;
    },
    get csp() {
      return csp ?? parent.csp;
    },
    get variant() {
      return variant ?? parent.variant;
    },
    get form() {
      return form ?? parent.form;
    },
    get app() {
      return app ?? parent.app;
    },
    get statistic() {
      return statistic ?? parent.statistic;
    },
    get timeline() {
      return timeline ?? parent.timeline;
    },
    get steps() {
      return steps ?? parent.steps;
    },
    get layout() {
      return layout ?? parent.layout;
    },
    get select() {
      return select ?? parent.select;
    },
    get treeSelect() {
      return treeSelect ?? parent.treeSelect;
    },
    get tree() {
      return tree ?? parent.tree;
    },
    get datePicker() {
      return datePicker ?? parent.datePicker;
    },
    get card() {
      return card ?? parent.card;
    },
    get cardMeta() {
      return cardMeta ?? parent.cardMeta;
    },
    get descriptions() {
      return descriptions ?? parent.descriptions;
    },
    get anchor() {
      return anchor ?? parent.anchor;
    },
    get breadcrumb() {
      return breadcrumb ?? parent.breadcrumb;
    },
    get dropdown() {
      return dropdown ?? parent.dropdown;
    },
    get menu() {
      return menu ?? parent.menu;
    },
    get mentions() {
      return mentions ?? parent.mentions;
    },
    get tabs() {
      return tabs ?? parent.tabs;
    },
    get ribbon() {
      return ribbon ?? parent.ribbon;
    },
    get badge() {
      return badge ?? parent.badge;
    },
    get tag() {
      return tag ?? parent.tag;
    },
    get avatar() {
      return avatar ?? parent.avatar;
    },
    get tooltip() {
      return tooltip ?? parent.tooltip;
    },
    get popover() {
      return popover ?? parent.popover;
    },
    get popconfirm() {
      return popconfirm ?? parent.popconfirm;
    },
    get drawer() {
      return drawer ?? parent.drawer;
    },
    get modal() {
      return modal ?? parent.modal;
    },
    get message() {
      return message ?? parent.message;
    },
    get notification() {
      return notification ?? parent.notification;
    },
    get button() {
      return button ?? parent.button;
    },
    get rate() {
      return rate ?? parent.rate;
    },
    get watermark() {
      return watermark ?? parent.watermark;
    },
    get affix() {
      return affix ?? parent.affix;
    },
    get borderBeam() {
      return borderBeam ?? parent.borderBeam;
    },
    get masonry() {
      return masonry ?? parent.masonry;
    },
    get splitter() {
      return splitter ?? parent.splitter;
    },
    get qrcode() {
      return qrcode ?? parent.qrcode;
    },
    get calendar() {
      return calendar ?? parent.calendar;
    },
    get timePicker() {
      return timePicker ?? parent.timePicker;
    },
    get cascader() {
      return cascader ?? parent.cascader;
    },
    get transfer() {
      return transfer ?? parent.transfer;
    },
    get pagination() {
      return pagination ?? parent.pagination;
    },
    get table() {
      return table ?? parent.table;
    },
    get listy() {
      return listy ?? parent.listy;
    },
    get typography() {
      return typography ?? parent.typography;
    },
    get tour() {
      return tour ?? parent.tour;
    },
    get carousel() {
      return carousel ?? parent.carousel;
    },
    get slider() {
      return slider ?? parent.slider;
    },
    get divider() {
      return divider ?? parent.divider;
    },
    get flex() {
      return flex ?? parent.flex;
    },
    get spin() {
      return spin ?? parent.spin;
    },
    get progress() {
      return progress ?? parent.progress;
    },
    get upload() {
      return upload ?? parent.upload;
    },
    get skeleton() {
      return skeleton ?? parent.skeleton;
    },
    get empty() {
      return empty ?? parent.empty;
    },
    get result() {
      return result ?? parent.result;
    },
    get collapse() {
      return collapse ?? parent.collapse;
    },
    get segmented() {
      return segmented ?? parent.segmented;
    },
    get space() {
      return space ?? parent.space;
    },
    get alert() {
      return alert ?? parent.alert;
    },
    get colorPicker() {
      return colorPicker ?? parent.colorPicker;
    },
    get inputNumber() {
      return inputNumber ?? parent.inputNumber;
    },
    get radio() {
      return radio ?? parent.radio;
    },
    get checkbox() {
      return checkbox ?? parent.checkbox;
    },
    get switch() {
      return switchConfig ?? parent.switch;
    },
    get wave() {
      return wave ?? parent.wave;
    },
    get virtual() {
      return virtual ?? parent.virtual;
    },
    get popupMatchSelectWidth() {
      return popupMatchSelectWidth ?? parent.popupMatchSelectWidth;
    },
    get popupOverflow() {
      return popupOverflow !== undefined ? popupOverflow : parent.popupOverflow;
    },
    get renderEmpty() {
      return renderEmpty ?? parent.renderEmpty;
    },
    get getPopupContainer() {
      return getPopupContainer || parent.getPopupContainer;
    },
    get getTargetContainer() {
      return getTargetContainer ?? parent.getTargetContainer;
    },
    get rangePicker() {
      return rangePicker ?? parent.rangePicker;
    },
    get input() {
      return input ?? parent.input;
    },
    get inputPassword() {
      return inputPassword ?? parent.inputPassword;
    },
    get inputSearch() {
      return inputSearch ?? parent.inputSearch;
    },
    get otp() {
      return otp ?? parent.otp;
    },
    get textArea() {
      return textArea ?? parent.textArea;
    },
    get floatButton() {
      return floatButton ?? parent.floatButton;
    },
    get floatButtonGroup() {
      return floatButtonGroup ?? parent.floatButtonGroup;
    },
    get componentSize() {
      return componentSize ?? parent.componentSize;
    },
    get explicitComponentSize() {
      return componentSize ?? parent.explicitComponentSize;
    },
    get componentDisabled() {
      return componentDisabled ?? parent.componentDisabled;
    },
    get direction() {
      return direction ?? parent.direction;
    },
    get theme() {
      return designTokens.config;
    },
    get themeStyle() {
      return designTokens.style;
    },
    get locale() {
      const inherited = parent.locale;
      const current = providerLocale;

      return {
        ...inherited,
        ...current,
        justOkText: current?.justOkText ?? current?.okText ?? inherited.justOkText,
        popconfirm: {
          okText: current?.popconfirm?.okText ?? current?.okText ?? inherited.popconfirm?.okText,
          cancelText: current?.popconfirm?.cancelText ?? current?.cancelText
            ?? inherited.popconfirm?.cancelText
        },
        typography: {
          ...inherited.typography,
          ...inherited.Text,
          ...current?.typography,
          ...current?.Text
        },
        Text: {
          ...inherited.typography,
          ...inherited.Text,
          ...current?.typography,
          ...current?.Text
        },
        global: { ...inherited.global, ...current?.global },
        colorPicker: {
          ...inherited.colorPicker, ...inherited.ColorPicker,
          ...current?.colorPicker, ...current?.ColorPicker
        },
        ColorPicker: {
          ...inherited.colorPicker, ...inherited.ColorPicker,
          ...current?.colorPicker, ...current?.ColorPicker
        },
        tour: { ...inherited.tour, ...inherited.Tour, ...current?.tour, ...current?.Tour },
        Tour: { ...inherited.tour, ...inherited.Tour, ...current?.tour, ...current?.Tour },
        carousel: {
          ...inherited.carousel,
          ...inherited.Carousel,
          ...current?.carousel,
          ...current?.Carousel
        },
        Carousel: {
          ...inherited.carousel,
          ...inherited.Carousel,
          ...current?.carousel,
          ...current?.Carousel
        },
        pagination: { ...inherited.pagination, ...current?.pagination },
        table: { ...inherited.table, ...current?.table },
        inputNumber: { ...inherited.inputNumber, ...current?.inputNumber },
        steps: { ...inherited.steps, ...current?.steps },
        badge: { ...inherited.badge, ...current?.badge },
        avatarGroup: { ...inherited.avatarGroup, ...current?.avatarGroup },
        layout: { ...inherited.layout, ...current?.layout },
        qrcode: { ...inherited.qrcode, ...current?.qrcode },
        transfer: { ...inherited.transfer, ...current?.transfer }
      };
    }
  };

  provideConfig(config);
</script>

{#if designTokens.enabled && theme}
  <ThemeScopeStyle css={designTokens.state.scopeCSS} scope={designTokens.state.key} />
{/if}{#if gridMediaCss && gridMediaScope}
  <ThemeScopeStyle css={gridMediaCss} scope={gridMediaScope} />
{/if}<div
  bind:this={element}
  class={[
    'ant-svelte-theme',
    designTokens.enabled && designTokens.state.key,
    designTokens.enabled && designTokens.state.hashId,
    className
  ]}
  data-ant-theme={config.theme.mode}
  data-ant-primary={config.theme.primary}
  data-ant-compact={config.theme.compact || undefined}
  dir={config.direction}
  style={[designTokens.style, style].filter(Boolean).join(';') || undefined}
>
  {@render children()}
</div>
