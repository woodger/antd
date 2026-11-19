import {
  diffSelectStyle, resolveSelectStyleFrame, selectStyleName, selectStyleValue,
  type SelectStyleFrame, type SelectStyleProperties
} from './select-style.engine';

type SelectStyleTarget = Pick<CSSStyleDeclaration, 'setProperty' | 'getPropertyValue' | 'getPropertyPriority'>;
type SelectStyleSnapshot = SelectStyleTarget & Pick<CSSStyleDeclaration, 'removeProperty'> & Iterable<string>;

/** cssText склеивает shorthand и меняет порядок longhand; переносим принятые declarations напрямую. */
export function copySelectStyle(source: SelectStyleSnapshot, target: SelectStyleSnapshot,
  managed?: SelectStyleProperties) {
  const declarations = [...source].map(property => ({ property,
    value: source.getPropertyValue(property), priority: source.getPropertyPriority(property) }));
  const removed = managed
    ? new Set([...declarations.map(({ property }) => property), ...Object.keys(managed).map(selectStyleName)])
    : new Set(target);
  for (const property of removed) target.removeProperty(property);
  for (const { property, value, priority } of declarations) {
    target.setProperty(
      property,
      value,
      priority
    );
  }
}

/** История хранит logical props отдельно от принятого браузером CSSOM. */
export function createSelectStyleWriter(initialTarget: SelectStyleTarget, initial: SelectStyleFrame,
  createParser?: () => CSSStyleDeclaration) {
  let target = initialTarget;
  let parser: CSSStyleDeclaration | undefined;
  let stringFrame: SelectStyleFrame | undefined;
  function legacy(frame: SelectStyleFrame): SelectStyleFrame {
    if (!frame.string || !createParser) {
      return frame;
    }
    if (stringFrame && stringFrame.text === frame.text) {
      return stringFrame;
    }
    parser ??= createParser();
    parser.cssText = frame.text ?? '';
    // Прежний string API сохраняет parsing/canonicalization cssText; object keys
    // через parser не проходят, включая invalid setter и shorthand history.
    stringFrame = { ...resolveSelectStyleFrame(parser.cssText), text: frame.text };
    return stringFrame;
  }
  let previous = legacy(initial);

  function set(property: string, value: string, priority: '' | 'important') {
    if (property.startsWith('--') || priority) {
      target.setProperty(
        selectStyleName(property),
        value,
        priority
      );
    }
    else Reflect.set(target, property === 'float' ? 'cssFloat' : property, value);
  }

  return {
    target(style: SelectStyleTarget) { target = style; },
    initialize() {
      if (initial.string || !initial.authored.size) {
        return;
      }
      // Свежий CSR повторяет порядок CSS setters Source; parsed SSR остаётся как есть.
      // Одного одинакового cssText недостаточно: порядок longhand/shorthand в CSSOM иной.
      for (const property of Object.keys(initial.properties)) set(property, '', '');
      for (const [property, value] of Object.entries(initial.properties))
        set(property, selectStyleValue(property, value), initial.priorities[property] ?? '');
    },
    update(next: SelectStyleFrame, reconcileFramework = false) {
      next = legacy(next);
      const changed = new Set<string>();
      const reset = previous.string !== next.string || next.string && previous.text !== next.text;
      const patches = reset
        ? [...Object.keys(previous.properties).map(property => ({ property, value: undefined })),
          ...Object.entries(next.properties).map(([property, value]) => ({ property, value }))]
        : diffSelectStyle(previous.properties, next.properties);
      for (const { property, value } of patches) {
        set(property, selectStyleValue(property, value), next.priorities[property] ?? '');
        changed.add(property);
      }
      for (const [property, value] of Object.entries(next.properties)) {
        const priority = next.priorities[property] ?? '';
        const priorityChanged = (previous.priorities[property] ?? '') !== priority;
        if (changed.has(property)) continue;
        const formatted = selectStyleValue(property, value);
        // Align/controller может менять лишь framework layer. Не восстанавливаем
        // owner shorthand по сравнению с текущим CSSOM: это уничтожило бы историю.
        if (priorityChanged || reconcileFramework && !next.authored.has(property)
          && (target.getPropertyValue(selectStyleName(property)) !== formatted
            || target.getPropertyPriority(selectStyleName(property)) !== priority)) {
          set(property, formatted, priority);
        }
      }
      previous = next;
    }
  };
}
