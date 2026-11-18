/** Add explicit transition observations to the unchanged frozen physical DOM reader. */
export function readDatePickerPresetTransitions() {
  const actual = window.readPresetTransitionsCore();
  const refs = raw.current.readRefs();
  raw.transitionRefProbe ??= { objects: new WeakMap(), next: 0, initial: {} };
  const probe = raw.transitionRefProbe;
  const identity = value => {
    if (value == null) return null;
    if (!probe.objects.has(value)) probe.objects.set(value, ++probe.next);
    return probe.objects.get(value);
  };
  for (const [name, value] of Object.entries({
    control: refs.control,
    focus: refs.control?.focus,
    blur: refs.control?.blur
  })) {
    if (value != null && !probe.initial[name]) probe.initial[name] = value;
  }
  const prefix = raw.sample.prefixCls ?? 'ant-picker';
  const form = document.querySelector('[data-preset-transition-form]');
  return {
    ...actual,
    publicRefDetails: {
      controlIdentity: identity(refs.control),
      focusIdentity: identity(refs.control?.focus),
      blurIdentity: identity(refs.control?.blur),
      sameControl: refs.control === probe.initial.control,
      sameFocus: refs.control?.focus === probe.initial.focus,
      sameBlur: refs.control?.blur === probe.initial.blur,
      controlOwnKeys: refs.control == null ? [] : Reflect.ownKeys(refs.control).map(String)
    },
    form: form == null ? null : {
      connected: form.isConnected,
      attributes: [...form.attributes].map(attribute => [attribute.name, attribute.value]),
      entries: [...new FormData(form).entries()]
    },
    calendarHeaders: [...document.querySelectorAll('.' + prefix + '-header-view')]
      .map(node => ({ text: node.textContent, html: node.outerHTML })),
    timeColumns: [...document.querySelectorAll('.' + prefix + '-time-panel-column')]
      .map(column => ({
        type: column.getAttribute('data-type'),
        scrollTop: column.scrollTop,
        scrollHeight: column.scrollHeight,
        clientHeight: column.clientHeight,
        cells: [...column.querySelectorAll('li')].map(cell => ({
          value: cell.getAttribute('data-value'),
          text: cell.textContent,
          attributes: [...cell.attributes].map(attribute => [attribute.name, attribute.value]),
          selected: cell.classList.contains(prefix + '-time-panel-cell-selected'),
          disabled: cell.classList.contains(prefix + '-time-panel-cell-disabled')
        }))
      }))
  };
}
