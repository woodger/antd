import template from './vendor/avatar-prefix.css.js';

/** Changes only Avatar componentCls. CSS variables, the marker, Image, and anticon remain shared. */
export function getAvatarPrefixCss(prefix: string) {
  if (prefix === 'ant-avatar') {
    return undefined;
  }

  return template
    // The shared marker must not reset font-size or aliases on adjacent default Avatars.
    .replace(
      /(^|[\n,])\.ant-avatar-css-var(?=[\s{:.#>+~[]|$)/g,
      (_, separator: string) =>
        `${separator}:is(.ant-avatar,.ant-avatar-group):where(.ant-avatar-css-var)`
    )
    .replace(/\.ant-avatar(?!-css-var\b)/g, () => `.${prefix}`)
    .replace(/"ant-avatar"/g, () => `"${prefix}"`)
    .replace(/" ant-avatar"/g, () => `" ${prefix}"`)
    .replace(/<\/style/gi, '<\\/style');
}
