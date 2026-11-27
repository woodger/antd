// Rewrites Calendar's bundled selectors while retaining its theme marker and token names.
import template from '../vendor/calendar-prefix.css.js';

const pickerPrefixPattern = /\.ant-picker([-\w]*)|"ant-picker"|" ant-picker"/g;
const calendarRootSuffixes = new Set(['-calendar', '-calendar-full', '-calendar-mini', '-calendar-rtl']);

/** Ends a hexadecimal CSS escape before the next character. */
function escapeCssCharacter(character: string): string {
  const code = character.charCodeAt(0);
  return code === 0 ? '\ufffd' : `\\${code.toString(16)} `;
}

/** Serializes a class identifier, including prefixes that start with a digit. */
function escapeCssIdentifier(value: string): string {
  const specialCharacter = /(^-?)([0-9])|^-$|[^\w\u0080-\u{10ffff}-]/gu;
  return value.replace(specialCharacter, (match, sign?: string, digit?: string) => {
    const character = digit ?? match;
    return (sign ?? '') + escapeCssCharacter(character);
  });
}

/** Protects quoted selector values embedded in an HTML style element. */
function quoteCssString(value: string): string {
  const escaped = value.replace(/["\\<&\p{Cc}]/gu, escapeCssCharacter);
  return `"${escaped}"`;
}

/** The bundled stylesheet already covers the default picker prefix. */
export function getCalendarPrefixCss(prefix: string) {
  if (prefix === 'ant-picker') {
    return undefined;
  }

  const classPrefix = escapeCssIdentifier(prefix);
  const quotedPrefix = quoteCssString(prefix);
  const quotedPrefixAfterSpace = quoteCssString(` ${prefix}`);
  const scopeSelector = `:where([data-ant-calendar-prefix=${quotedPrefix}])`;

  /** Scopes Calendar roots and keeps the marker shared across picker prefixes. */
  function replacePickerPrefix(match: string, suffix: string | undefined): string {
    if (suffix === undefined) {
      return match === '"ant-picker"' ? quotedPrefix : quotedPrefixAfterSpace;
    }
    if (suffix === '-calendar-css-var') {
      return `.ant-picker-calendar-css-var${scopeSelector}`;
    }

    const selector = `.${classPrefix}${suffix}`;
    return calendarRootSuffixes.has(suffix) ? `${selector}${scopeSelector}` : selector;
  }

  const css = template.replace(pickerPrefixPattern, replacePickerPrefix);
  return css.replace(/<\/style/gi, '<\\/style');
}
