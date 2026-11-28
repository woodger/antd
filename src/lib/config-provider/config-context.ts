import type { SelectConfig } from '../select/select.types';
import type { UploadConfig } from '../upload/upload.types';
import type { FormConfig } from '../form/form.types';
import type { AppConfig } from '../app/app.types';
import type { StatisticConfig } from '../statistic/statistic.types';
import type { TimelineConfig } from '../timeline/timeline.types';
import type { StepsConfig } from '../steps/steps.types';
import type { LayoutConfig } from '../layout/layout.types';
import type { TreeSelectConfig } from '../tree-select/tree-select.types';
import type { TreeConfig } from '../tree/tree.types';
import type { DatePickerConfig } from '../picker/date-picker.types';
import type { CardConfig, CardMetaConfig } from '../card/card.types';
import type { MentionsComponentConfig } from '../mentions/mentions.types';
import type { DescriptionsConfig } from '../descriptions/descriptions.types';
import type { AnchorConfig } from '../anchor/anchor.types';
import type { BreadcrumbConfig } from '../breadcrumb/breadcrumb.types';
import type { DropdownConfig } from '../dropdown/dropdown.types';
import type { MenuConfig } from '../menu/menu.types';
import type { FloatButtonConfig, FloatButtonGroupConfig } from '../float-button/float-button.types';
import type { ButtonConfig } from '../button/button.types';
import type { TabsConfig } from '../tabs/tabs.types';
import type { BadgeRibbonConfig } from '../badge/badge-ribbon.types';
import type { BadgeConfig } from '../badge/badge.types';
import type { TagConfig } from '../tag/tag.types';
import type { AvatarConfig } from '../avatar/avatar.types';
import type { ImageConfig } from '../image/image.types';
import type { TooltipConfig } from '../tooltip/tooltip.types';
import type { PopoverConfig } from '../popover/popover.types';
import type { PopconfirmConfig } from '../popconfirm/popconfirm.types';
import type { RateConfig } from '../rate/rate.types';
import type { WatermarkConfig } from '../watermark/watermark.types';
import type { AffixConfig } from '../affix/affix.types';
import type { BorderBeamConfig } from '../border-beam/border-beam.types';
import type { MasonryConfig } from '../masonry/masonry.types';
import type { SplitterConfig } from '../splitter/splitter.types';
import type { QRCodeConfig } from '../qr-code/qrcode.types';
import type { CalendarConfig } from '../calendar/calendar.types';
import type { TimePickerConfig } from '../picker/time-picker.types';
import type { CascaderConfig } from '../cascader/cascader.types';
import type { TransferConfig } from '../transfer/transfer.types';
import type { PaginationComponentConfig } from '../pagination/pagination.types';
import type { TableConfig } from '../table/table.types';
import type { ListyConfig } from '../listy/listy.types';
import type { TypographyConfig } from '../typography/typography.types';
import type { TourConfig } from '../tour/tour.types';
import type { CarouselConfig } from '../carousel/carousel.types';
import type { SliderConfig } from '../slider/slider-range.types';
import type { DividerConfig } from '../divider/divider.types';
import type { FlexConfig } from '../flex/flex.types';
import type { SpinConfig } from '../spin/spin.types';
import type { ProgressConfig } from '../progress/progress.types';
import type { SkeletonConfig } from '../skeleton/skeleton.types';
import type { EmptyConfig } from '../empty/empty.types';
import type { ResultConfig } from '../result/result.types';
import type { AlertConfig } from '../alert/alert.types';
import type { CollapseConfig } from '../collapse/collapse.types';
import type { DrawerConfig } from '../drawer/drawer.types';
import type { ModalConfig } from '../modal/modal.types';
import type { MessageAppearance } from '../message/message.types';
import type { NotificationProviderConfig } from '../notification/notification.types';
import type { SegmentedConfig } from '../segmented/segmented.types';
import type { SpaceConfig } from '../space/space.types';
import type { ColorPickerConfig } from '../color-picker/color-picker.types';
import type { InputNumberConfig } from '../input-number/input-number.types';
import type { RadioConfig } from '../radio/radio.types';
import type { CheckboxConfig } from '../checkbox/checkbox.types';
import type { SwitchConfig } from '../switch/switch.types';
import type { WaveConfig } from '../wave/wave.types';
import type {
  CSPConfig, GetPopupContainer, GetTargetContainer, PopupOverflow, RenderEmptyHandler
} from '../types';
import type { RangePickerConfig } from '../picker/range-picker.types';
import type { InputConfig } from '../input/input.types';
import type { InputPasswordConfig } from '../input/input-password.types';
import type { InputSearchConfig } from '../input/input-search.types';
import type { InputOTPConfig } from '../input/input-otp.types';
import type { TextAreaConfig } from '../input/textarea.types';
import { getContext, setContext } from 'svelte';
import { ruRU, type ComponentSize, type Variant, type Locale, type ResolvedThemeConfig } from '../types';

export interface ConfigContext {
  readonly getPrefixCls: (suffix?: string, custom?: string) => string;
  readonly iconPrefixCls: string;
  readonly csp?: CSPConfig;
  readonly variant?: Variant;
  readonly form?: FormConfig;
  readonly app?: AppConfig;
  readonly statistic?: StatisticConfig;
  readonly timeline?: TimelineConfig;
  readonly steps?: StepsConfig;
  readonly layout?: LayoutConfig;
  readonly select?: SelectConfig;
  readonly treeSelect?: TreeSelectConfig;
  readonly tree?: TreeConfig;
  readonly datePicker?: DatePickerConfig;
  readonly card?: CardConfig;
  readonly cardMeta?: CardMetaConfig;
  readonly descriptions?: DescriptionsConfig;
  readonly anchor?: AnchorConfig;
  readonly breadcrumb?: BreadcrumbConfig;
  readonly dropdown?: DropdownConfig;
  readonly menu?: MenuConfig;
  readonly mentions?: MentionsComponentConfig;
  readonly tabs?: TabsConfig;
  readonly ribbon?: BadgeRibbonConfig;
  readonly badge?: BadgeConfig;
  readonly tag?: TagConfig;
  readonly avatar?: AvatarConfig;
  readonly image?: ImageConfig;
  readonly tooltip?: TooltipConfig;
  readonly popover?: PopoverConfig;
  readonly popconfirm?: PopconfirmConfig;
  readonly drawer?: DrawerConfig;
  readonly modal?: ModalConfig;
  readonly message?: MessageAppearance;
  readonly notification?: NotificationProviderConfig;
  readonly button?: ButtonConfig;
  readonly rate?: RateConfig;
  readonly watermark?: WatermarkConfig;
  readonly affix?: AffixConfig;
  readonly borderBeam?: BorderBeamConfig;
  readonly masonry?: MasonryConfig;
  readonly splitter?: SplitterConfig;
  readonly qrcode?: QRCodeConfig;
  readonly calendar?: CalendarConfig;
  readonly timePicker?: TimePickerConfig;
  readonly cascader?: CascaderConfig;
  readonly transfer?: TransferConfig;
  readonly pagination?: PaginationComponentConfig;
  readonly table?: TableConfig;
  readonly listy?: ListyConfig;
  readonly typography?: TypographyConfig;
  readonly tour?: TourConfig;
  readonly carousel?: CarouselConfig;
  readonly slider?: SliderConfig;
  readonly divider?: DividerConfig;
  readonly flex?: FlexConfig;
  readonly spin?: SpinConfig;
  readonly progress?: ProgressConfig;
  readonly upload?: UploadConfig;
  readonly skeleton?: SkeletonConfig;
  readonly empty?: EmptyConfig;
  readonly result?: ResultConfig;
  readonly alert?: AlertConfig;
  readonly collapse?: CollapseConfig;
  readonly segmented?: SegmentedConfig;
  readonly space?: SpaceConfig;
  readonly colorPicker?: ColorPickerConfig;
  readonly inputNumber?: InputNumberConfig;
  readonly radio?: RadioConfig;
  readonly checkbox?: CheckboxConfig;
  readonly switch?: SwitchConfig;
  readonly wave?: WaveConfig;
  readonly virtual?: boolean;
  readonly popupMatchSelectWidth?: boolean | number;
  readonly popupOverflow?: PopupOverflow;
  readonly renderEmpty?: RenderEmptyHandler;
  readonly getPopupContainer?: GetPopupContainer;
  readonly getTargetContainer?: GetTargetContainer;
  readonly rangePicker?: RangePickerConfig;
  readonly textArea?: TextAreaConfig;
  readonly input?: InputConfig;
  readonly inputPassword?: InputPasswordConfig;
  readonly inputSearch?: InputSearchConfig;
  readonly otp?: InputOTPConfig;
  readonly floatButton?: FloatButtonConfig;
  readonly floatButtonGroup?: FloatButtonGroupConfig;
  readonly componentSize: ComponentSize;
  /** Size configured in the current scope, before controls apply their own defaults. */
  readonly explicitComponentSize?: ComponentSize;
  /** The setting exposed by useConfig, independent of temporary submission blocking. */
  readonly configuredComponentDisabled: boolean;
  readonly componentDisabled: boolean;
  readonly direction: 'ltr' | 'rtl';
  readonly theme: ResolvedThemeConfig;
  /** Upstream token CSS for additional theme boundaries and portals. */
  readonly themeStyle?: string;
  readonly locale: Locale;
}

const configKey = Symbol('ant-design-config');
const defaultConfig: ConfigContext = {
  getPrefixCls: (suffix, custom) => custom || (suffix ? `ant-${suffix}` : 'ant'),
  iconPrefixCls: 'anticon',
  componentSize: 'medium',
  configuredComponentDisabled: false,
  componentDisabled: false,
  direction: 'ltr',
  theme: { mode: 'light', primary: 'blue', compact: false },
  locale: ruRU
};

export function useConfig(): ConfigContext {
  return getContext<ConfigContext | undefined>(configKey) ?? defaultConfig;
}

export function provideConfig(config: ConfigContext) {
  setContext(configKey, config);
}
