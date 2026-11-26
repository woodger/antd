<script lang="ts" generics="OkHref extends string | undefined = undefined, CancelHref extends string | undefined = undefined">
  // Передаёт показ Popover и управляет действиями текущего подтверждения.
  import { onDestroy, untrack } from 'svelte';
  import type { MouseEventHandler } from 'svelte/elements';
  import { useConfig } from './config-context';
  import { useForm } from './form-context';
  import { providePopconfirmTheme } from './popover-theme-context';
  import { ruRU } from './types';
  import { createPopconfirmAction } from './popconfirm.model.svelte.js';
  import { getPopupActiveElement } from './popup.dom';
  import { getOverlaySemantics } from './overlay-semantic.engine';
  import { getOverlayPrefixCss } from './overlay-prefix.engine';
  import prefixTemplate from './vendor/popconfirm-prefix.css.js';
  import ThemeScopeStyle from './ThemeScopeStyle.svelte';
  import type { PopconfirmActionOptions, PopconfirmProps, PopconfirmSemanticProps } from './popconfirm.types';
  import type { PopoverRef } from './popover.types';
  import Popover from './Popover.svelte';
  import Button from './Button.svelte';
  import Icon from './Icon.svelte';

  type ActionElement = HTMLButtonElement | HTMLAnchorElement;
  type ActionClick<Target extends ActionElement = ActionElement> =
    MouseEvent & { currentTarget: Target };

  let {
    ref = $bindable<PopoverRef | undefined>(),
    open = $bindable<boolean | undefined>(),
    open: providedOpen,
    ...props
  }: PopconfirmProps<OkHref, CancelHref> & { ref?: PopoverRef } = $props();
  let {
    children,
    title,
    description,
    color,
    prefixCls,
    openClassName,
    icon,
    defaultOpen = false,
    destroyOnHidden,
    disabled,
    showCancel = true,
    okText,
    cancelText,
    okType = 'primary',
    okButtonProps,
    cancelButtonProps,
    placement = 'top',
    arrow,
    trigger,
    mouseEnterDelay,
    mouseLeaveDelay,
    autoAdjustOverflow = true,
    getPopupContainer,
    onOpenChange,
    onConfirm,
    onCancel,
    onError,
    rootClassName,
    classNames,
    styles,
    class: className = '',
    style
  } = $derived(props);

  const config = useConfig();
  let prefix = $derived(config.getPrefixCls('popconfirm', prefixCls));
  let prefixCss = $derived(getOverlayPrefixCss('popconfirm', prefix, prefixTemplate));
  let resolvedTrigger = $derived(trigger || config.popconfirm?.trigger || 'click');
  let enterDelay = $derived(mouseEnterDelay ?? config.popconfirm?.mouseEnterDelay ?? 0.1);
  let leaveDelay = $derived(mouseLeaveDelay ?? config.popconfirm?.mouseLeaveDelay ?? 0.1);
  let callbackProps = $derived<PopconfirmSemanticProps<OkHref, CancelHref>>({
    ...props,
    open: providedOpen,
    placement,
    trigger: resolvedTrigger,
    mouseEnterDelay: enterDelay,
    mouseLeaveDelay: leaveDelay,
    okType
  });
  let semantics = $derived(getOverlaySemantics<PopconfirmSemanticProps<OkHref, CancelHref>>(
    config.popconfirm,
    classNames,
    styles,
    callbackProps
  ));
  providePopconfirmTheme({
    get onPopupClick() { return props.onPopupClick; }
  });
  const form = useForm();
  const generatedId = $props.id();
  const titleId = `ant-popconfirm-${generatedId}-title`;
  const descriptionId = `ant-popconfirm-${generatedId}-description`;
  const initialDefault = untrack(() => defaultOpen);
  // Raw open переживает обновление spread props без входного open.
  let uncontrolledOpen = $state(initialDefault);
  let rawOpen = $derived(providedOpen === undefined ? uncontrolledOpen : open ?? initialDefault);
  let overlay = $state<HTMLDivElement>();
  let errorSession = $state.raw<object>();
  let active = true;
  let resolvedDisabled = $derived(disabled ?? form?.disabled ?? config.componentDisabled);
  let hasTitle = $derived(typeof title === 'function' || Boolean(String(title ?? '').trim()));
  let visible = $derived(!resolvedDisabled && hasTitle && rawOpen);
  let session = $derived(visible ? { owner: rawOpen } : null);
  const action = createPopconfirmAction(() => session, {
    onSuccess: () => {
      uncontrolledOpen = false;
      open = false;
      onOpenChange?.(false);
    },
    onError: (error) => {
      errorSession = session ?? undefined;
      onError?.(error);
    }
  });
  let errorVisible = $derived(session !== null && session === errorSession);
  let destroy = $derived(destroyOnHidden ?? false);
  let force = $derived(props.forceRender ?? false);
  let refresh = $derived(props.fresh ?? false);
  let payload = $derived({
    title,
    description,
    icon,
    prefix,
    semantics,
    showCancel,
    okText,
    cancelText,
    okType,
    okButtonProps: okButtonProps ? { ...okButtonProps } : undefined,
    cancelButtonProps: cancelButtonProps ? { ...cancelButtonProps } : undefined
  });
  let cached = $state.raw(untrack(() => payload));
  let rendered = $derived(visible || refresh ? payload : cached);
  let renderedDescription = $derived(typeof rendered.description === 'function'
    || Boolean(String(rendered.description ?? '').trim()));
  let showIcon = $derived(
    rendered.icon !== null && rendered.icon !== false && rendered.icon !== ''
  );
  let danger = $derived(rendered.okType === 'danger');
  let confirmType = $derived(
    rendered.okButtonProps?.type ?? (rendered.okType === 'danger' ? undefined : rendered.okType)
  );
  let initialized = false;

  $effect.pre(() => {
    // Содержимое принадлежит этому Snippet; внешний Popover не может заморозить его props.
    if (visible || refresh || force && !initialized) cached = payload;
    if (visible || force) {
      initialized = true;
    }
    else if (destroy) initialized = false;
  });

  $effect.pre(() => {
    const element = overlay;

    // Сохраняем фокус в карточке до отключения кнопок на время Promise.
    if (action.loading && element?.contains(getPopupActiveElement(element)))
      element.focus({ preventScroll: true });
  });

  onDestroy(() => {
    active = false;
    action.dispose();
  });

  function request(next: boolean) {
    if (!active || resolvedDisabled || action.loading || next === rawOpen) {
      return;
    }

    uncontrolledOpen = next;
    open = next;
    onOpenChange?.(next);
  }

  /** Учитывает фактический тег Button, если href обновляется между кликами. */
  function matchesClick<Tag extends 'a' | 'button'>(
    event: ActionClick, tag: Tag
  ): event is ActionClick<HTMLElementTagNameMap[Tag]> {
    return event.currentTarget.localName === tag;
  }

  /** Вызывает нативный обработчик до действия либо возвращает совместимый вызов для конца. */
  function applyClick<Target extends ActionElement>(
    event: ActionClick<Target>,
    options: { onclick?: MouseEventHandler<Target> | null; onClick?: MouseEventHandler<Target> }
  ) {
    const nativeClick = options.onclick;
    if (nativeClick != null) {
      nativeClick.call(options, event);
      return;
    }

    const compatibleClick = options.onClick;
    return compatibleClick && (() => compatibleClick.call(options, event));
  }

  /** Передаёт опциям событие именно той разновидности Button, которую показал DOM. */
  function prepareClick(event: ActionClick, options: PopconfirmActionOptions | undefined) {
    if (!options) {
      return;
    }

    if (options.href !== undefined) {
      return matchesClick(event, 'a') ? applyClick(event, options) : undefined;
    }
    return matchesClick(event, 'button') ? applyClick(event, options) : undefined;
  }

  function confirm(event: ActionClick) {
    if (!visible || action.loading || okButtonProps?.disabled) {
      return;
    }

    const afterAction = prepareClick(event, okButtonProps);
    if (event.defaultPrevented) {
      return;
    }

    errorSession = undefined;
    void action.run(() => onConfirm?.(event), afterAction);
  }

  function cancel(event: ActionClick) {
    if (!visible || action.loading || cancelButtonProps?.disabled) {
      return;
    }

    const afterAction = prepareClick(event, cancelButtonProps);
    if (event.defaultPrevented) {
      return;
    }

    request(false);
    onCancel?.(event);
    afterAction?.();
  }
</script>

<style>
  [data-ant-popconfirm-content] { min-width: min(200px, calc(100vw - 40px)); overflow-wrap: anywhere; }
  [data-ant-popconfirm-content]:focus-visible { outline: 2px solid var(--ant-color-primary); outline-offset: 2px; }
  [data-ant-popconfirm-message-text] { min-width: 0; }
  [data-ant-popconfirm-content] [data-ant-popconfirm-buttons] { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--ant-margin-xs); white-space: normal; }
  [data-ant-popconfirm-buttons] :global(.ant-btn) { max-width: 100%; min-height: var(--ant-control-height-sm); height: auto; margin-inline-start: 0; white-space: normal; }
  .anticon { display: inline-flex; }
  [data-ant-popconfirm-error] { margin: 8px 0 0; color: var(--ant-color-error); }
</style>

{#snippet content()}
  <div bind:this={overlay} data-ant-popconfirm-content="" class={`${rendered.prefix}-inner-content`} tabindex="-1">
    <div class={`${rendered.prefix}-message`}>
      {#if showIcon}<span class={[`${rendered.prefix}-message-icon`, rendered.semantics.classNames.icon]}
        style={rendered.semantics.styles.icon} aria-hidden="true"><span class="anticon">{#if rendered.icon === undefined}<Icon name="warning" />
        {:else if typeof rendered.icon === 'function'}{@render rendered.icon()}
        {:else if typeof rendered.icon !== 'boolean'}{rendered.icon}{/if}</span></span>{/if}
      <div data-ant-popconfirm-message-text="" class={`${rendered.prefix}-message-text`}>
        <div id={titleId} class={[`${rendered.prefix}-title`, rendered.semantics.classNames.title]}
          style={rendered.semantics.styles.title}>{#if typeof rendered.title === 'function'}{@render rendered.title()}{:else}{rendered.title}{/if}</div>
        {#if renderedDescription}<div id={descriptionId} class={[`${rendered.prefix}-description`, rendered.semantics.classNames.content]}
          style={rendered.semantics.styles.content}>{#if typeof rendered.description === 'function'}{@render rendered.description()}{:else}{rendered.description}{/if}</div>{/if}
      </div>
    </div>
    <div data-ant-popconfirm-buttons="" class={`${rendered.prefix}-buttons`}>
      {#if rendered.showCancel}<Button {...rendered.cancelButtonProps} size={rendered.cancelButtonProps?.size ?? 'small'} disabled={Boolean(
          action.loading || resolvedDisabled || rendered.cancelButtonProps?.disabled
        )} htmlType="button" onclick={cancel} onClick={undefined}
          children={rendered.cancelText ?? config.locale.popconfirm?.cancelText
            ?? config.locale.cancelText} />{/if}
      <Button {danger} {...rendered.okButtonProps} type={confirmType} size={rendered.okButtonProps?.size ?? 'small'} disabled={Boolean(
          action.loading || resolvedDisabled || rendered.okButtonProps?.disabled
        )} loading={action.loading} htmlType="button" onclick={confirm} onClick={undefined}
          children={rendered.okText ?? config.locale.popconfirm?.okText ?? config.locale.okText} />
    </div>
    {#if errorVisible}<p role="alert" data-ant-popconfirm-error="" class={`${rendered.prefix}-error`}>{config.locale.confirmErrorText ?? ruRU.confirmErrorText}</p>{/if}
  </div>
{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`popconfirm-prefix:${prefix}`} />{/if}<Popover content={hasTitle ? content : undefined} bind:ref bind:open={() => visible, request}
  trigger={resolvedDisabled ? [] : resolvedTrigger} mouseEnterDelay={enterDelay} mouseLeaveDelay={leaveDelay}
  showAction={props.showAction} hideAction={props.hideAction}
  motion={props.motion} afterOpenChange={props.afterOpenChange}
  focusDelay={props.focusDelay} blurDelay={props.blurDelay}
  align={props.align} builtinPlacements={props.builtinPlacements} onPopupAlign={props.onPopupAlign}
  id={props.id} forceRender={props.forceRender} fresh={props.fresh} zIndex={props.zIndex}
  {destroyOnHidden}
  unique={props.unique}
  {placement} {arrow} {color} {openClassName} {autoAdjustOverflow} {getPopupContainer}
  {rootClassName} classNames={{
    root: [config.popconfirm?.class, semantics.classNames.root].filter(Boolean).join(' '),
    container: semantics.classNames.container,
    arrow: semantics.classNames.arrow
  }} styles={{ root: semantics.styles.root, container: semantics.styles.container,
    arrow: semantics.styles.arrow }}
  popupClass={prefix} aria-labelledby={titleId} aria-describedby={renderedDescription ? descriptionId : undefined} aria-busy={action.loading || undefined} class={className} {style}>
  {@render children()}
</Popover>
