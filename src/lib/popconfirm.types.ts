import type { Snippet } from 'svelte';
import type { ButtonContent, ButtonElementProps, ButtonLinkProps, ButtonType } from './button.types';
import type {
  PopoverContent,
  PopoverPlacement,
  PopoverSlots,
  PopoverTrigger
} from './popover.types';
import type { AdjustOverflow, TooltipArrow, TooltipColor, TooltipProps } from './tooltip.types';

export interface PopconfirmSlots extends PopoverSlots {
  icon?: string;
}

type Semantic<Props> = PopconfirmSlots | ((info: { props: Props }) => PopconfirmSlots);

/** Title/content относятся к тексту подтверждения и описанию, icon — к wrapper иконки. */
export type PopconfirmSemantic<
  OkHref extends string | undefined = undefined,
  CancelHref extends string | undefined = undefined
> = Semantic<PopconfirmSemanticProps<OkHref, CancelHref>>;

export interface PopconfirmSemanticProps<
  OkHref extends string | undefined = undefined,
  CancelHref extends string | undefined = undefined
> extends PopconfirmProps<OkHref, CancelHref> {
  /** Входной prop владельца; внутреннее uncontrolled open не подменяет его. */
  open?: boolean;
  placement: PopoverPlacement;
  trigger: PopoverTrigger | readonly PopoverTrigger[];
  mouseEnterDelay: number;
  mouseLeaveDelay: number;
  okType: NonNullable<PopconfirmProps['okType']>;
}

interface PopconfirmContextProps extends Omit<
  PopconfirmSemanticProps, 'okButtonProps' | 'cancelButtonProps' | 'classNames' | 'styles'
> {
  okButtonProps?: PopconfirmActionOptions;
  cancelButtonProps?: PopconfirmActionOptions;
  /** Локальные callbacks рассчитаны на конкретные props экземпляра. */
  classNames?: Semantic<never>;
  styles?: Semantic<never>;
}

/** Собственные defaults Popconfirm; локальные props приоритетнее контекста. */
export interface PopconfirmConfig {
  class?: string;
  style?: string;
  classNames?: Semantic<PopconfirmContextProps>;
  styles?: Semantic<PopconfirmContextProps>;
  arrow?: TooltipArrow;
  trigger?: PopoverTrigger | readonly PopoverTrigger[];
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
}

type ManagedButtonProp = 'children' | 'htmlType' | 'loading';
type NativeButtonProps = Omit<ButtonElementProps, ManagedButtonProp>;
type LinkButtonProps = Omit<ButtonLinkProps, ManagedButtonProp>;
type DynamicButtonProps = Omit<ButtonElementProps<string | undefined>, ManagedButtonProp>;
export type PopconfirmActionOptions = NativeButtonProps | LinkButtonProps | DynamicButtonProps;

type ButtonVariantProps<Href extends string | undefined> = [Href] extends [undefined]
  ? NativeButtonProps
  : undefined extends Href ? DynamicButtonProps : LinkButtonProps;

/** Явный href выводит тип ссылки. Условный href передаёт обработчику оба типа DOM. */
type PopconfirmButtonProps<Href extends string | undefined> =
  | ({ href: Href } & ButtonVariantProps<Href>)
  | ([Href] extends [undefined] ? NativeButtonProps : never);

/** Подтверждение действия с Promise, состоянием ожидания и защитой от позднего результата. */
export interface PopconfirmProps<
  OkHref extends string | undefined = undefined,
  CancelHref extends string | undefined = undefined
> {
  children: Snippet;
  /** Передаётся наружному Popover; скрытый ID следует fresh. */
  id?: string;
  /** Передаётся наружному Popover; semantic цвета текста подтверждения приоритетнее. */
  color?: TooltipColor;
  /** Локальный prefix подтверждения; иначе ConfigProvider. Prefix Popover независим. */
  prefixCls?: string;
  /** Передаётся наружному Popover; default — его prefix + -open. */
  openClassName?: string;
  title: Exclude<PopoverContent, boolean>;
  description?: Exclude<PopoverContent, boolean> | null;
  /** Декоративное содержимое. undefined оставляет стандартную иконку. */
  icon?: ButtonContent;
  /** Поддерживает bind:open. */
  open?: boolean | undefined;
  /** @defaultValue false */
  defaultOpen?: boolean;
  /** Удаляет содержимое подтверждения при закрытии. @defaultValue false */
  destroyOnHidden?: boolean;
  /** Монтирует скрытое подтверждение и portal после hydration, включая destroyOnHidden. */
  forceRender?: boolean;
  /** Обновляет скрытое содержимое и semantic styles; по умолчанию false. */
  fresh?: boolean;
  /** Передаётся Popover перед semantic root styles. */
  zIndex?: number;
  disabled?: boolean;
  /** @defaultValue true */
  showCancel?: boolean;
  /** Подпись Button. null и undefined используют словарь. */
  okText?: ButtonContent;
  /** Подпись Button. null и undefined используют словарь. */
  cancelText?: ButtonContent;
  /** danger задаёт палитру без обязательного варианта. @defaultValue 'primary' */
  okType?: ButtonType | 'danger';
  okButtonProps?: PopconfirmButtonProps<OkHref>;
  cancelButtonProps?: PopconfirmButtonProps<CancelHref>;
  /** @defaultValue 'top' */
  placement?: PopoverPlacement;
  /** Передаётся Popover поверх выбранной записи placements. */
  align?: TooltipProps['align'];
  /** Заменяет всю карту placements Popover, включая пустой объект. */
  builtinPlacements?: TooltipProps['builtinPlacements'];
  /** Получает наружный Popover DOM и итоговый align до применения новых координат. */
  onPopupAlign?: TooltipProps['onPopupAlign'];
  /** @defaultValue true */
  arrow?: TooltipArrow;
  /** Локальный trigger → ConfigProvider.popconfirm → click; [] оставляет программное управление. */
  trigger?: PopoverTrigger | readonly PopoverTrigger[];
  /** Заменяет только события открытия; undefined использует trigger, [] отключает их. */
  showAction?: readonly PopoverTrigger[];
  /** Заменяет trigger/outside-закрытие; [] сохраняет Escape и кнопки подтверждения. */
  hideAction?: readonly PopoverTrigger[];
  /** Задержка focus в секундах; default 0 независимо от hover delays. */
  focusDelay?: number;
  /** Задержка blur в секундах; default 0 независимо от hover delays. */
  blurDelay?: number;
  /** Задержки hover в секундах, по умолчанию 0.1. */
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  /** @defaultValue true */
  autoAdjustOverflow?: boolean | AdjustOverflow;
  /** Передаётся Popover: локальная функция → ConfigProvider. */
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement;
  onOpenChange?: (open: boolean) => void;
  /** Вызывается после завершения изменения видимости наружного Popover. */
  afterOpenChange?: TooltipProps['afterOpenChange'];
  /** Имя CSSMotion наружного Popover. */
  motion?: TooltipProps['motion'];
  /** Явное true включает подтверждение в ближайшую группу Tooltip.UniqueProvider. @defaultValue false */
  unique?: TooltipProps['unique'];
  /** Promise удерживает loading; rejection сохраняет возможность повтора. */
  onConfirm?: (event: MouseEvent) => void | PromiseLike<unknown>;
  onCancel?: (event: MouseEvent) => void;
  /** Вызывается при всплытии click до корня панели после обработчиков её содержимого. */
  onPopupClick?: (event: MouseEvent) => void;
  onError?: (error: unknown) => void;
  class?: string;
  style?: string;
  rootClassName?: string;
  classNames?: PopconfirmSemantic<OkHref, CancelHref>;
  styles?: PopconfirmSemantic<OkHref, CancelHref>;
}
