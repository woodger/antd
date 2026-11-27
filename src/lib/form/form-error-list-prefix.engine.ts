/** Only explain styles Form; prefix list does not change the design of the neighboring FormItem. */
export function getFormErrorListPrefixCss(prefix: string, scoped = false) {
  if (prefix === 'ant-form' && !scoped) {
    return undefined;
  }

  return (
    `
.${prefix}-item .${prefix}-item-explain{clear:both;`
    + `color:var(--ant-color-text-description);`
    + `font-size:var(--ant-font-size);`
    + `line-height:var(--ant-line-height);}
.${prefix}-item .${prefix}-item-explain-error{color:var(--ant-color-error);}
.${prefix}-item .${prefix}-item-explain-warning{color:var(--ant-color-warning);}
`
  ).replace(/<\/style/gi, '<\\/style');
}
