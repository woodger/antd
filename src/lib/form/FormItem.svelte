<script lang="ts">
  // Registers the field and gathers its metadata, label, and help text. Descendant signals belong
  // to the current registration.
  import { onDestroy, onMount, tick, untrack, type Snippet } from 'svelte';
  import type { FormFieldRegistration } from './form-internal';
  import type { FormFieldMeta } from './form.model.svelte';
  import { useForm, type FormFieldContext } from './form-context';
  import { useConfig } from '../config-provider/config-context';
  import { useDesignTokenContext } from '../theme/theme-context.svelte';
  import { getFormPrefixCss, getFormPrefixScope } from './form-prefix.engine';
  import ThemeScopeStyle from '../theme/ThemeScopeStyle.svelte';
  import { provideFormPrefix, useFormPrefix } from './form-prefix-context';
  import { useComponentTheme } from '../theme/theme-component.svelte';
  import { formNamePath, type NamePath } from './form-store.engine';
  import type { FormRule } from './validation.engine';
  import { useFormList } from './form-list-context';
  import { captureFormControlResetFocus, captureFormResetFocus } from './form-reset.dom';
  import { getFormFieldElement } from './form-field.dom';
  import { enUS, type RenderEmptyContent } from '../types';
  import RenderContent from '../RenderContent.svelte';
  import Row from '../grid/Row.svelte';
  import Col from '../grid/Col.svelte';
  import NoFormItemColumns from './NoFormItemColumns.svelte';
  import type { ColProps } from '../grid/grid.types';
  import { resolveFormWrapperCol } from './form-columns.engine';
  import type { FormFeedbackIcons, FormItemTooltip as FormItemTooltipContent } from './form.types';
  import type { FormValidateStatus } from './form-error-list.types';
  import { resolveFormStatus } from './form-status.engine';
  import { resolveFormTooltip } from './form-tooltip.engine';
  import FormItemTooltip from './FormItemTooltip.svelte';
  import NoFormItemBinding from './NoFormItemBinding.svelte';
  import FormItemBinding from './FormItemBinding.svelte';
  import FormItemStatusProvider from './FormItemStatusProvider.svelte';
  import { useFormItemStatusContext, type FormItemStatus } from './form-item-status';
  import { useFormFeedback, type FormFeedbackContext, type FormFeedbackIcon } from './form-feedback-context';
  import { useFormItemMeta, type FormItemMetaContext } from './form-item-meta-context';
  import { mergeFormItemMessages, type FormItemMessages } from './form-no-style.engine';

  /** Connects a Form model field to its label, validation status, and accessible error description. */
  export interface FormItemProps {
    /** CSS prefix for Item and its parts. Empty and undefined values inherit from ConfigProvider independently of Form. */
    prefixCls?: string;
    /** Key or path from FormList. Without name, this is layout only, with no model binding, rules, or native name. */
    name?: NamePath;
    /** Fills an undefined value before the control renders, including during SSR. Changes to the prop apply on a future reset. */
    initialValue?: unknown;
    /** Text, number, array, or Snippet. false, null, undefined, and '' hide the label. null still preserves the offset. */
    label?: RenderEmptyContent;
    /** Help content or Tooltip options. Defaults are inherited from Form. */
    tooltip?: FormItemTooltipContent;
    children: Snippet;
    /** Help text for fields without errors or warnings. Supports rich content and resets with the field. */
    help?: RenderEmptyContent;
    /** Help text next to errors or warnings. Reset recreates the content. false, null, undefined, and '' hide it. */
    extra?: RenderEmptyContent;
    required?: boolean;
    /** Hides the block while retaining the control, its value, and its validation registration. @defaultValue false */
    hidden?: boolean;
    /** Removes layout. Errors go to the nearest styled Item unless help=false. */
    noStyle?: boolean;
    /** Local field layout. Otherwise it inherits the nearest Form's layout, with vertical layout when standalone. */
    layout?: 'horizontal' | 'vertical';
    /** Local label alignment overrides the nearest Form. */
    labelAlign?: 'left' | 'right';
    /** Label columns replace all of Form.labelCol, including when explicitly set to {}. */
    labelCol?: ColProps;
    /** Control columns replace Form.wrapperCol. Nested Items do not inherit them. */
    wrapperCol?: ColProps;
    /** Controls the added colon. true takes precedence even when Form.colon=false. */
    colon?: boolean;
    /** Local field rules. When omitted, uses the rules from the top-level model. */
    rules?: readonly FormRule[];
    /** Overrides label, name, and other ${variables} in messages for this field. */
    messageVariables?: Readonly<Record<string, string>>;
    /**
     * The default false collects all messages in parallel. true runs rules in order and stops at
     * the first error. 'parallel' uses the first error to finish. Warnings cannot bypass pending
     * blocking rules.
     */
    validateFirst?: boolean | 'parallel';
    /** Automatic validation delay in ms. validateFields and submit run immediately. */
    validateDebounce?: number;
    /** Visual status override for the metadata. '' disables automatic status and preserves errors and ARIA. */
    validateStatus?: FormValidateStatus;
    hasFeedback?: boolean | { icons?: FormFeedbackIcons; };
    htmlFor?: string;
    /**
     * A native element, bind:this, or an object exposing focus or nativeElement for a custom
     * control. Overrides built-in registration and is returned as-is by getFieldInstance.
     */
    controlRef?: unknown;
    /** Additional class for the field root. It is kept out of FormContext. */
    rootClassName?: string;
    /** Inline CSS for the root, applied after the computed component tokens. */
    style?: string;
    class?: string;
  }

  let {
    name,
    initialValue,
    label,
    tooltip,
    children,
    help,
    extra,
    required,
    hidden = false,
    noStyle = false,
    layout,
    labelAlign,
    prefixCls: customizePrefixCls,
    labelCol,
    wrapperCol,
    colon,
    rules,
    messageVariables,
    validateFirst,
    validateDebounce,
    validateStatus,
    hasFeedback,
    htmlFor,
    controlRef,
    rootClassName,
    style,
    class: className = ''
  }: FormItemProps = $props();

  const form = useForm();
  const config = useConfig();
  const designTokens = useDesignTokenContext();
  let componentPrefix = $derived(config.getPrefixCls('form', customizePrefixCls));
  let prefixScope = $derived(getFormPrefixScope(
    componentPrefix, config.getPrefixCls(), designTokens.state.token
  ));
  let prefixCss = $derived(getFormPrefixCss(
    componentPrefix, config.getPrefixCls(), designTokens.state.token
  ));
  let prefixAttributes = $derived({ 'data-ant-form-prefix': prefixScope });
  let gridDisplayStyle = $derived(config.getPrefixCls() === 'ant' ? undefined
    : `--${config.getPrefixCls().replace(/\./g, '')}-grid-display:var(--ant-grid-display,flex)`);
  const list = useFormList();
  const parentStatus = useFormItemStatusContext();
  const parentFeedback = useFormFeedback();
  const parentMeta = useFormItemMeta();
  const componentTheme = useComponentTheme('Form');
  const generatedId = $props.id();
  let hasName = $derived(name !== undefined && name !== null);
  let hasLayout = $derived(!noStyle || hidden);
  const parentPrefix = useFormPrefix();
  provideFormPrefix({
    get prefixCls() {
      return hasLayout ? componentPrefix : parentPrefix?.prefixCls;
    }
  });
  let id = $derived(htmlFor ?? `ant-field-${generatedId}`);
  let path = $derived([...(list?.prefixName ?? []), ...formNamePath(name ?? [])]);
  let resolvedLayout = $derived(layout ?? form?.layout ?? 'vertical');
  let resolvedLabelAlign = $derived(labelAlign ?? form?.labelAlign ?? 'right');
  let resolvedLabelCol = $derived(labelCol ?? form?.labelCol);
  let resolvedWrapperCol = $derived(resolveFormWrapperCol({
    label, labelCol, wrapperCol, formLabelCol: form?.labelCol, formWrapperCol: form?.wrapperCol
  }));
  let computedColon = $derived(colon === true || form?.colon !== false && colon !== false);
  let haveColon = $derived(resolvedLayout !== 'vertical' && computedColon);
  let hasLabel = $derived(label !== undefined && label !== null && label !== false && label !== '');
  let labelContent = $derived(typeof label === 'string' && haveColon && label.trim()
    ? label.replace(/[:：]\s*$/, '') : label);
  let labelledBy = $derived(hasLayout && hasName && hasLabel
    && typeof label !== 'string' && typeof label !== 'number'
    ? `${id}_label` : undefined);
  let requiredMark = $derived(form?.requiredMark ?? true);
  let tooltipOptions = $derived(resolveFormTooltip(tooltip, form?.tooltip));
  let optionalText = $derived(config.locale.Form?.optional || enUS.Form.optional);
  let errors = $derived(hasName ? form?.getFieldError(path) ?? [] : []);
  let warnings = $derived(hasName ? form?.getFieldWarning(path) ?? [] : []);
  let meta = $derived(hasName ? form?.getFieldMeta(path) : undefined);
  let ownStatus = $derived(resolveFormStatus({
    validateStatus, errors, warnings, touched: meta?.touched, validating: meta?.validating,
    hasFeedback: Boolean(hasFeedback), validated: meta?.validated
  }));
  let status = $derived(ownStatus ?? (!hasLayout ? parentStatus.status : undefined));
  let ownFeedback = $derived.by<{ hasFeedback: boolean; icon?: FormFeedbackIcon; }>(() => {
    const enabled = Boolean(hasFeedback);
    if (!enabled || !ownStatus) {
      return { hasFeedback: enabled };
    }
    const icons = typeof hasFeedback === 'object' && hasFeedback.icons || form?.feedbackIcons;
    const icon = icons?.({ status: ownStatus, errors, warnings })?.[ownStatus];
    return { hasFeedback: enabled, icon: icon === false ? undefined
      : { status: ownStatus, prefixCls: componentPrefix, prefixScope, content: icon || undefined } };
  });
  const feedbackContext: FormFeedbackContext = {
    get isFormItemInput() { return hasLayout ? true : parentFeedback.isFormItemInput; },
    get hasFeedback() { return !hasLayout && hasFeedback === undefined
      ? parentFeedback.hasFeedback : ownFeedback.hasFeedback; },
    get icon() {
      return !hasLayout && hasFeedback === undefined ? parentFeedback.icon : ownFeedback.icon;
    }
  };
  let isRequired = $derived(required
    ?? (hasName && (rules
      ? form?.hasRequiredRules(rules) ?? rules.some((rule) =>
        typeof rule !== 'function' && rule.required && !rule.warningOnly)
      : form?.isFieldRequired(path)))
    ?? false);
  let hasHelp = $derived(help !== undefined && help !== null && help !== false && help !== '');
  const reportedFields = new Set<FormItemMessages>();
  let reportVersion = $state.raw<object>({});
  let reports = $derived.by(() => {
    void reportVersion;
    return [...reportedFields];
  });
  let messages = $derived(mergeFormItemMessages(errors, warnings, reports));
  let hasReportedMessages = $derived(reports.some(field => field.errors.length || field.warnings.length));
  let descriptionId = $derived(hasLayout && (hasName || hasReportedMessages)
    && (messages.errors.length || messages.warnings.length || hasHelp)
    ? `${id}-help` : undefined);
  let hasExtra = $derived(extra !== undefined && extra !== null && extra !== false && extra !== '');
  let extraId = $derived(hasLayout && hasName && hasExtra ? `${id}_extra` : undefined);
  let resetKey = $state.raw<object>({});
  let content: HTMLDivElement | undefined = $state();
  const controls = new Set<() => unknown>();
  let registration: FormFieldRegistration | undefined;
  let hasMetaEvent = false;
  let removeReport: (() => void) | undefined;
  const report: FormItemMessages = {
    get name() { return path; },
    get errors() { return errors; },
    get warnings() { return warnings; }
  };
  const collector: FormItemMetaContext = {
    get describedBy() { return descriptionId; },
    register(field) {
      reportedFields.add(field);
      reportVersion = {};

      return () => {
        // The canonical Set avoids reading old $state values while siblings tear down.
        if (reportedFields.delete(field)) reportVersion = {};
      };
    }
  };

  function releaseReport() {
    removeReport?.();
    removeReport = undefined;
  }

  function syncReport() {
    if (!noStyle || !hasName || help === false || !hasMetaEvent || !parentMeta) {
      releaseReport();
      return;
    }
    removeReport ??= parentMeta.register(report);
  }

  function handleFieldMeta(value: FormFieldMeta | undefined) {
    hasMetaEvent = value !== undefined;
    syncReport();
  }

  function getControlInstance() {
    if (controlRef != null) {
      return controlRef;
    }
    for (const getInstance of controls) {
      const instance = getInstance();
      if (instance != null) {
        return instance;
      }
    }
  }

  function getControlElement() {
    const root = getFormFieldElement(getControlInstance());
    if (!root || root.id === id) {
      return root;
    }

    return [...root.querySelectorAll<HTMLElement>('[id]')].find(node => node.id === id) ?? root;
  }

  untrack(() => {
    if (hasName) form?.initializeField(path, initialValue);
    // SSR and late mounts can read model-owned metadata before UI registration.
    hasMetaEvent = !!(errors.length || warnings.length || meta?.touched || meta?.validating);
    syncReport();
  });

  onDestroy(releaseReport);

  $effect.pre(() => {
    const active = noStyle && hasName && help !== false;
    untrack(() => {
      if (active && (errors.length || warnings.length || meta?.touched || meta?.validating)) {
        hasMetaEvent = true;
      }
      syncReport();
    });
  });

  $effect.pre(() => {
    if (!hasName) {
      registration = undefined;
      return;
    }

    // List metadata follows the row key. A regular field stores it under its model name.
    const registeredName = list ? undefined : path;

    registration = {
      mountKey: Symbol('ant-design-field-mount'),
      get name() {
        return registeredName ?? path;
      },
      get rules() {
        return rules;
      },
      get validateFirst() {
        return validateFirst;
      },
      get validateDebounce() {
        return validateDebounce;
      },
      get initialValue() {
        return initialValue;
      },
      get messageVariables() {
        return {
          label: typeof label === 'string' ? label : String(name),
          ...messageVariables
        };
      },
      get onMetaChange() {
        return noStyle ? handleFieldMeta : undefined;
      },
      isListField: Boolean(list),
      getInstance: getControlInstance,
      getElement() {
        const host = content;
        if (!host?.isConnected) {
          return getControlElement();
        }

        // Use the local binding first so a matching htmlFor in an adjacent form cannot select its control.
        return [...host.querySelectorAll<HTMLElement>('[id]')].find((node) => node.id === id)
          ?? host.ownerDocument.getElementById(id) ?? undefined;
      },
      onReset() {
        const restoreFocus = hasLayout ? captureFormResetFocus(content, id)
          : captureFormControlResetFocus(getControlElement);
        resetKey = {};
        if (restoreFocus) void tick().then(restoreFocus);
      }
    };

    return form?.registerField?.(registration);
  });

  onMount(() => {
    if (registration?.mountKey) form?.markFieldMounted(registration.mountKey);
  });

  const itemStatus: FormItemStatus = {
    get status() { return status ?? ''; },
    get errors() { return errors; },
    get warnings() { return warnings; }
  };

  const fieldContext: FormFieldContext = {
    get id() {
      return hasName ? id : undefined;
    },
    get name() {
      return hasName ? path.map(String).join('_') : undefined;
    },
    get label() {
      return hasLayout && hasName && (typeof label === 'string' || typeof label === 'number')
        ? String(label) : undefined;
    },
    get labelledBy() {
      return labelledBy;
    },
    get disabled() {
      return form?.disabled;
    },
    get required() {
      return hasName && isRequired;
    },
    get status() {
      return status;
    },
    get invalid() {
      return hasName && (hasLayout ? messages.errors.length > 0 : errors.length > 0);
    },
    get describedBy() {
      if (!hasName) {
        return;
      }

      const controlDescription = hasLayout ? descriptionId
        : help !== false && (errors.length || warnings.length) ? parentMeta?.describedBy : undefined;

      return [controlDescription, extraId].filter(Boolean).join(' ') || undefined;
    },
    registerControl(getInstance) {
      controls.add(getInstance);
      return () => { controls.delete(getInstance); };
    },
    onBlur() {
      if (hasName) form?.touchField(path);
    }
  };

  function focusGroupLabel(label: HTMLLabelElement) {
    function handleClick(event: MouseEvent) {
      if (!event.defaultPrevented && !label.control) {
        label.ownerDocument.getElementById(label.htmlFor)?.focus();
      }
    }

    label.addEventListener('click', handleClick);

    return {
      destroy() {
        label.removeEventListener('click', handleClick);
      }
    };
  }
</script>

{#snippet captionWithTooltip()}
  <RenderContent value={labelContent} />{#if tooltipOptions}<FormItemTooltip options={tooltipOptions} formPrefix={componentPrefix} formScope={prefixScope} />{/if}
{/snippet}

{#snippet itemLayout()}
  <div {...prefixAttributes} data-ant-form-item class={[
      `${componentPrefix}-item`,
      componentTheme.className && `ant-form-css-var ${componentTheme.className}`,
      `${componentPrefix}-item-${resolvedLayout}`,
      hidden && `${componentPrefix}-item-hidden`,
      status === 'error' && `${componentPrefix}-item-has-error`,
      status === 'warning' && `${componentPrefix}-item-has-warning`,
      status === 'success' && `${componentPrefix}-item-has-success`,
      status === 'validating' && `${componentPrefix}-item-is-validating`,
      ownStatus && ownFeedback.hasFeedback && `${componentPrefix}-item-has-feedback`,
      className,
      rootClassName
    ]} style={[componentTheme.style, style].filter(Boolean).join(';') || undefined}>
    <Row {...prefixAttributes} class={[`${componentPrefix}-item-row`, componentTheme.className].filter(Boolean).join(' ')}>
      {#if hasLabel}
        <Col {...prefixAttributes} {...resolvedLabelCol} class={[
          `${componentPrefix}-item-label`,
          resolvedLabelAlign === 'left' && `${componentPrefix}-item-label-left`,
          form?.labelWrap === true && `${componentPrefix}-item-label-wrap`,
          resolvedLabelCol?.class
        ].filter(Boolean).join(' ')}>
          <NoFormItemBinding><label {...prefixAttributes} for={hasName ? id : htmlFor} id={labelledBy}
            class={[
              form?.classNames?.label,
              isRequired && `${componentPrefix}-item-required`,
              requiredMark === false && `${componentPrefix}-item-required-mark-hidden`,
              (requiredMark === 'optional' || typeof requiredMark === 'function')
                && `${componentPrefix}-item-required-mark-optional`,
              !computedColon && `${componentPrefix}-item-no-colon`
            ]} style={form?.styles?.label}
            title={typeof label === 'string' ? label : undefined} use:focusGroupLabel>
            {#key resetKey}
              {#if typeof requiredMark === 'function'}
                {@render requiredMark(tooltipOptions ? captionWithTooltip : labelContent,
                  { required: isRequired })}
              {:else}
                {@render captionWithTooltip()}{#if requiredMark === 'optional' && !isRequired}<span {...prefixAttributes} class={`${componentPrefix}-item-optional`}>{optionalText}</span>{/if}
              {/if}
            {/key}
          </label></NoFormItemBinding>
        </Col>
      {/if}
      <NoFormItemColumns>
        <Col {...prefixAttributes} {...resolvedWrapperCol}
          style={[gridDisplayStyle, resolvedWrapperCol?.style].filter(Boolean).join(';') || undefined}
          class={[`${componentPrefix}-item-control`, resolvedWrapperCol?.class].filter(Boolean).join(' ')}>
          <div {...prefixAttributes} class={`${componentPrefix}-item-control-input`}>
            <div {...prefixAttributes} bind:this={content}
              class={[`${componentPrefix}-item-control-input-content`, form?.classNames?.content]}
              style={form?.styles?.content}>{#key resetKey}<FormItemStatusProvider value={itemStatus} meta={collector} feedback={feedbackContext}>{@render children()}</FormItemStatusProvider>{/key}</div>
          </div>
          {#if messages.errors.length || messages.warnings.length}
            <div {...prefixAttributes} id={descriptionId} class={[`${componentPrefix}-item-explain`, form?.classNames?.help]}
              style={form?.styles?.help} role={messages.errors.length ? 'alert' : 'status'}>
              {#each messages.errors as error}
                <div {...prefixAttributes} class={[`${componentPrefix}-item-explain-error`, form?.classNames?.helpItem]}
                  style={form?.styles?.helpItem}>{error}</div>
              {/each}
              {#each messages.warnings as warning}
                <div {...prefixAttributes} class={[`${componentPrefix}-item-explain-warning`, form?.classNames?.helpItem]}
                  style={form?.styles?.helpItem}>{warning}</div>
              {/each}
            </div>
          {:else if hasHelp}
            <div {...prefixAttributes} id={descriptionId} class={[`${componentPrefix}-item-extra`, form?.classNames?.help]}
              style={form?.styles?.help}>
              {#key resetKey}<NoFormItemBinding>{#if form?.classNames?.helpItem || form?.styles?.helpItem}
                <div {...prefixAttributes} class={form?.classNames?.helpItem} style={form?.styles?.helpItem}><RenderContent value={help} /></div>
              {:else}<RenderContent value={help} />{/if}</NoFormItemBinding>{/key}
            </div>
          {/if}
          {#if hasExtra}
            <div {...prefixAttributes} id={extraId} class={[`${componentPrefix}-item-extra`, form?.classNames?.extra]}
              style={form?.styles?.extra}>{#key resetKey}<NoFormItemBinding><RenderContent value={extra} /></NoFormItemBinding>{/key}</div>
          {/if}
        </Col>
      </NoFormItemColumns>
    </Row>
  </div>
{/snippet}

{#snippet itemBody()}
  {#if hasLayout}{@render itemLayout()}
  {:else}{#key resetKey}<FormItemStatusProvider value={itemStatus} feedback={feedbackContext}>{@render children()}</FormItemStatusProvider>{/key}{/if}
{/snippet}

{#if prefixCss}<ThemeScopeStyle css={prefixCss} scope={`form-prefix:${prefixScope}`} />{/if}{#if hasName}
  <FormItemBinding field={fieldContext}>{@render itemBody()}</FormItemBinding>
{:else}
  <NoFormItemBinding><FormItemBinding field={fieldContext}>
    {@render itemBody()}
  </FormItemBinding></NoFormItemBinding>
{/if}
