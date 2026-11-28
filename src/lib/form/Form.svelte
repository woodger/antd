<script lang="ts" generics="Values extends FormValues">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import { provideConfig, useConfig, type ConfigContext } from '../config-provider/config-context';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { useDesignTokenContext, useRuntimeStyles } from '../theme/theme-context.svelte';
  import { getFormPrefixCss, getFormPrefixScope } from './form-prefix.engine';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { provideForm } from './form-context';
  import { useFormProvider } from './form-provider-context';
  import { getFormHooks } from './form-internal';
  import { provideFormList } from './form-list-context';
  import { provideFormItemStatus, useFormItemStatusContext } from './form-item-status';
  import { provideFormFeedback, useFormFeedback } from './form-feedback-context';
  import type { FormComponentProps, FormProps, FormRootProps, FormSemanticSlots } from './form.types';
  import { copyFormValue, sameFormValue } from './form-store.engine';
  import { createFormRef } from './form-ref.engine';
  import {
    createForm, type FormFieldData, type FormFieldSnapshot, type FormInstance
  } from './form.model.svelte';
  import { resolveValidationRules, type FormValues } from './validation.engine';
  import { mergeComponentSemantics } from '../style/semantic-style.engine';
  import { mergeValidationMessages } from './validation-message.engine';

  let { ref = $bindable(), ...props }: FormComponentProps<Values> = $props();
  let {
    form: suppliedForm,
    initialValues,
    fields,
    prefixCls: customizePrefixCls,
    children = emptyContent,
    render,
    layout = 'vertical',
    colon,
    labelAlign,
    labelWrap,
    labelCol,
    wrapperCol,
    requiredMark,
    variant,
    size,
    tooltip,
    feedbackIcons,
    validateMessages,
    validateTrigger,
    preserve,
    clearOnDestroy,
    component = 'form',
    disabled,
    onValuesChange,
    onFieldsChange,
    onFinish,
    onFinishFailed,
    onreset,
    scrollToFirstError,
    onError,
    rootClassName,
    classNames,
    styles,
    class: className = '',
    style,
    ...attributes
  } = $derived(props);

  let ownedForm: FormInstance<Values> | undefined;
  const form = $derived(suppliedForm ?? getOwnedForm());
  let initializedForm: FormInstance<Values> | undefined;

  function getOwnedForm() {
    // The store can be empty before Form and its fields supply values for the schema.
    ownedForm ??= createForm<Values>({ initialValues: {} as Values });

    return ownedForm;
  }

  function applyInitialValues() {
    const model = form;
    const seed = initializedForm !== model;
    getFormHooks(model)?.setInitialValues(initialValues, seed);
    initializedForm = model;
  }

  // Children read initial values during setup, including SSR. Later default changes leave
  // the store and the attached owner's lifecycle intact.
  untrack(applyInitialValues);
  $effect.pre(applyInitialValues);
  $effect.pre(() => getFormHooks(form)?.attachForm(() => clearOnDestroy));

  let appliedFields: {
    model: FormInstance<Values>;
    entries: readonly FormFieldData[];
    snapshot: readonly FormFieldData[];
  } | undefined;

  // Apply external data after the UI bindings have registered, including on the first client pass.
  $effect(() => {
    if (!fields?.length) {
      appliedFields = undefined;
      return;
    }

    const model = form;
    const entries = fields.slice();
    const snapshot = copyFormValue(entries);
    const previous = appliedFields;
    if (previous?.model === model && previous.entries.length === entries.length
      && entries.every((entry, index) => entry === previous.entries[index])
      && sameFormValue(previous.snapshot, snapshot)) {
      return;
    }

    appliedFields = { model, entries, snapshot };
    // Empty slots affect the comparison but carry no field update.
    const patches = entries.filter(() => true);
    untrack(() => {
      const hooks = getFormHooks(model);
      if (hooks) {
        hooks.setControlledFields(patches);
      }
      else {
        model.setFields(patches);
      }
    });
  });

  const config = useConfig();
  const designTokens = useDesignTokenContext();
  let componentPrefix = $derived(config.getPrefixCls('form', customizePrefixCls));
  let prefixScope = $derived(getFormPrefixScope(
    componentPrefix, config.getPrefixCls(), designTokens.state.token
  ));
  const runtimeStyles = useRuntimeStyles();
  let prefixCss = $derived(runtimeStyles && getFormPrefixCss(
    componentPrefix, config.getPrefixCls(), designTokens.state.token
  ));
  const componentTheme = useComponentTheme('Form');
  $effect(() => getFormHooks(form)?.registerValidateMessages(() => ({
    ...mergeValidationMessages(
      config.locale.Form?.defaultValidateMessages,
      config.form?.validateMessages
    ),
    ...validateMessages
  })));
  let resolvedSize = $derived(size ?? config.explicitComponentSize);
  let resolvedRequiredMark = $derived(requiredMark ?? config.form?.requiredMark ?? true);
  let resolvedTooltip = $derived({ ...config.form?.tooltip, ...tooltip });
  let semanticProps: FormProps<Values> = $derived({
    ...props, children, classNames, styles, layout, size: resolvedSize,
    disabled: disabled ?? config.componentDisabled,
    colon: colon ?? config.form?.colon, labelAlign: labelAlign ?? config.form?.labelAlign,
    labelWrap: labelWrap ?? config.form?.labelWrap, requiredMark: resolvedRequiredMark
  });
  let semantic = $derived(mergeComponentSemantics<keyof FormSemanticSlots, FormProps<Values>>(
    config.form, semanticProps, ['root', 'label', 'content', 'help', 'helpItem', 'extra']
  ));
  let active = true;
  let nativeElement = $state<HTMLElement>();
  const provider = useFormProvider();
  const formHandle = createFormRef(
    () => form, () => active ? nativeElement : undefined, submitAttachedForm
  );
  let mountedRef = $state.raw<typeof formHandle>();

  onMount(() => {
    mountedRef = formHandle;
    ref = formHandle;
    return () => {
      mountedRef = undefined;
      ref = undefined;
    };
  });
  onDestroy(() => {
    active = false;
  });

  const formName = $derived(attributes.name ?? undefined);
  $effect(() => provider?.registerForm(formName, form, formHandle));

  $effect(() => {
    const boundForm = form;
    return getFormHooks(boundForm)?.registerCallbacks(() => {
      if (!active || form !== boundForm) {
        return;
      }

      return {
        onValuesChange,
        onFieldsChange: provider || onFieldsChange ? notifyFieldsChange : undefined,
        onProviderFinish: provider ? notifyProviderFinish : undefined,
        submit: submitAttachedForm
      };
    });
  });

  provideFormList(undefined);
  // Upstream NoFormStyle resets visual status and preserves metadata from the nearest outer Item.
  provideFormItemStatus(Object.create(useFormItemStatusContext(), {
    status: { get: () => undefined }
  }));
  provideFormFeedback(Object.create(useFormFeedback(), {
    hasFeedback: { value: false }, icon: { value: undefined }
  }));

  // Form passes down SizeContext and DisabledContext. Other reactive defaults stay with their owner.
  const fieldConfig: ConfigContext = Object.create(config, {
    componentSize: { get: () => size ?? config.componentSize },
    explicitComponentSize: { get: () => resolvedSize },
    configuredComponentDisabled: { get: () => disabled ?? config.configuredComponentDisabled },
    componentDisabled: { get: () => disabled ?? config.componentDisabled }
  });
  provideConfig(fieldConfig);

  provideForm({
    get model() {
      return form;
    },
    get ref() {
      return mountedRef;
    },
    get variant() {
      return variant;
    },
    get disabled() {
      return (disabled ?? config.componentDisabled) || form.isSubmitting;
    },
    get submitting() {
      return form.isSubmitting;
    },
    get layout() {
      return layout;
    },
    get colon() {
      return colon ?? config.form?.colon;
    },
    get labelAlign() {
      return labelAlign ?? config.form?.labelAlign;
    },
    get labelWrap() {
      return labelWrap ?? config.form?.labelWrap;
    },
    get labelCol() {
      return labelCol;
    },
    get wrapperCol() {
      return wrapperCol;
    },
    get requiredMark() {
      return resolvedRequiredMark;
    },
    get classNames() {
      return semantic.classes;
    },
    get styles() {
      return semantic.styles;
    },
    get tooltip() {
      return resolvedTooltip;
    },
    get feedbackIcons() {
      return feedbackIcons;
    },
    get validateTrigger() {
      return validateTrigger;
    },
    get preserve() {
      return preserve;
    },
    get resetKey() {
      return getFormHooks(form)?.resetKey ?? form.values;
    },
    getFieldError: (name) => form.getFieldError(name),
    getFieldWarning: (name) => form.getFieldWarning(name),
    getFieldMeta(name) {
      const hooks = getFormHooks(form);

      return hooks ? hooks.getFieldMeta(name) : {
        touched: form.isFieldTouched(name), validating: form.isFieldValidating(name)
      };
    },
    isFieldRequired: (name) => form.isFieldRequired(name),
    hasRequiredRules: rules => resolveValidationRules(rules, form)
      .some(rule => rule.required && !rule.warningOnly),
    handleFieldBlur(name) {
      const hooks = getFormHooks(form);
      if (hooks) {
        hooks.handleFieldBlur(name);
      }
      else {
        form.touchField(name);
      }
    },
    handleFieldEvent: (mountKey, event, args) => getFormHooks(form)?.handleFieldEvent(
      mountKey, event, args
    ) ?? false,
    registerField: (field) => getFormHooks(form)?.registerField(field),
    markFieldMounted: (mountKey) => getFormHooks(form)?.markFieldMounted(mountKey),
    getFieldValue: (name) => form.getFieldValue(name),
    initializeField: (name, initialValue) => getFormHooks(form)?.initializeField(name, initialValue),
    initializeList: (name, initialValue) => getFormHooks(form)?.initializeList(name, initialValue),
    changeList: (name, values) => {
      const hooks = getFormHooks(form);
      if (!hooks) {
        throw new Error('FormList requires a createForm model');
      }

      hooks.changeList(name, values);
    }
  });

  function notifyFieldsChange(changedFields: FormFieldSnapshot[], allFields: FormFieldSnapshot[]) {
    const listener = onFieldsChange;
    provider?.notifyChange(formName, changedFields);
    listener?.(changedFields, allFields);
  }

  function notifyProviderFinish(values: Values) {
    provider?.notifyFinish(formName, values);
  }

  function handleSubmit(event: SubmitEvent & { currentTarget: EventTarget & HTMLElement; }) {
    event.preventDefault();
    event.stopPropagation();
    if (!(disabled ?? config.componentDisabled)) {
      void submitForm(event.currentTarget);
    }
  }

  function submitAttachedForm() {
    void submitForm(nativeElement);
  }

  async function submitForm(element?: HTMLElement) {
    if (!active) return;

    const submittedForm = form;
    const hasModelHooks = Boolean(getFormHooks(submittedForm));
    const finish = onFinish;
    const result = await submittedForm.submit((values) => {
      if (active && form === submittedForm) {
        if (!hasModelHooks) {
          notifyProviderFinish(values);
        }
        return finish?.(values);
      }
    });

    if (!active || form !== submittedForm) {
      return;
    }

    if (result.status === 'invalid') {
      const scroll = scrollToFirstError !== undefined
        ? scrollToFirstError : config.form?.scrollToFirstError;
      onFinishFailed?.(result.error);

      if (!result.error.outOfDate) {
        await tick();
        if (!active || form !== submittedForm) {
          return;
        }

        if (scroll !== undefined) {
          const first = result.error.errorFields[0];
          if (scroll && first) {
            submittedForm.scrollToField(first.name, {
              block: 'nearest', ...(typeof scroll === 'object' ? scroll : {})
            });
          }
        }
        else {
          const root = element?.isConnected ? element : nativeElement;
          root?.querySelector<HTMLElement>(
            '[data-ant-form-invalid="true"], [aria-invalid="true"]'
          )?.focus();
        }
      }
    }
    else if (result.status === 'failed') {
      onError?.(result.error);
    }
  }

  function handleReset(event: Event & { currentTarget: EventTarget & HTMLElement; }) {
    event.preventDefault();
    form.resetFields();
    onreset?.(event);
  }

  const rootProps = $derived({
    id: formName,
    ...attributes,
    novalidate: true,
    'data-ant-form-prefix': prefixScope,
    class: [
      `${componentPrefix} ant-form-css-var ${componentPrefix}-${layout}`,
      resolvedRequiredMark === false && `${componentPrefix}-hide-required-mark`,
      resolvedSize === 'small' && `${componentPrefix}-small`,
      resolvedSize === 'large' && `${componentPrefix}-large`,
      config.direction === 'rtl' && `${componentPrefix}-rtl`, componentTheme.className,
      config.form?.class, className, rootClassName, semantic.classes.root
    ].filter(Boolean).join(' '),
    style: componentTheme.style || semantic.styles.root
      ? [componentTheme.style, semantic.styles.root].filter(Boolean).join(';') : style,
    'aria-busy': form.isSubmitting || undefined,
    onsubmit: handleSubmit,
    onreset: handleReset
  });
  // The non-form attributes of an intrinsic replacement are shared by all native tags.
  const tag = $derived<string | undefined>(typeof component === 'string' ? component : undefined);
  const Root = $derived(typeof component === 'function' ? component : undefined);
  // Custom hosts receive the same attributes as the native form. The optional ref is an
  // accessor so forwarding it requires a binding, while ordinary DOM spreads omit it.
  const customProps = $derived(Object.defineProperty({ ...rootProps, children: rootContent },
    'nativeElement', {
      get: () => nativeElement,
      set: (element: HTMLElement | undefined) => { nativeElement = element; },
      configurable: true
    }) as unknown as FormRootProps);
</script>

{#snippet emptyContent()}{/snippet}

{#snippet formContent()}
  {#if render}
    {@render render({
      values: form.getFieldsValue(true),
      form,
      get ref() { return mountedRef; }
    })}
  {:else}
    {@render children()}
  {/if}
{/snippet}

{#snippet rootContent()}
  {#if form.submissionError}
    <p role="alert" data-ant-form-prefix={prefixScope}
      class={`${componentPrefix}-item-explain-error`}>{config.locale.submitErrorText}</p>
  {/if}
  {@render formContent()}
{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`form-prefix:${prefixScope}`} />{/if}{#if component === false}
  {@render formContent()}
{:else if component === 'form'}
  <form {...rootProps} bind:this={nativeElement}>{@render rootContent()}</form>
{:else if tag}
  <svelte:element this={tag} {...rootProps} bind:this={nativeElement}>
    {@render rootContent()}
  </svelte:element>
{:else if Root}
  <Root {...customProps} />
{/if}
