import type { AliasToken } from './theme-token.types';
import { AggregationColor } from '../color/color';
import { FastColor } from '../color/fast-color.engine';
import { isBrightColor } from '../color-picker/color-picker.engine';

export function prepareTagTokens(token: AliasToken) {
  const fill = new FastColor(token.colorFillTertiary);
  const defaultBg = fill.onBackground(token.colorBgContainer).toHexString();
  const defaultColor = token.colorText;
  const solidBackground = new AggregationColor(token.colorBgSolid);

  return {
    defaultBg,
    defaultColor,
    solidTextColor: isBrightColor(solidBackground, '#fff') ? '#000' : '#fff'
  };
}

export function prepareAvatarTokens(token: AliasToken) {
  return {
    containerSize: token.controlHeight,
    containerSizeLG: token.controlHeightLG,
    containerSizeSM: token.controlHeightSM,
    textFontSize: token.fontSize,
    textFontSizeLG: token.fontSize,
    textFontSizeSM: token.fontSize,
    iconFontSize: Math.round((token.fontSizeLG + token.fontSizeXL) / 2),
    iconFontSizeLG: token.fontSizeHeading3,
    iconFontSizeSM: token.fontSize,
    groupSpace: token.marginXXS,
    groupOverlapping: -token.marginXS,
    groupBorderColor: token.colorBorderBg
  };
}

export function prepareBadgeTokens(token: AliasToken) {
  return {
    indicatorZIndex: 'auto',
    indicatorHeight: Math.round(token.fontSize * token.lineHeight) - 2 * token.lineWidth,
    indicatorHeightSM: token.fontSize,
    dotSize: token.fontSizeSM / 2,
    textFontSize: token.fontSizeSM,
    textFontSizeSM: token.fontSizeSM,
    textFontWeight: 'normal',
    statusSize: token.fontSizeSM / 2,
    paddingInline: token.paddingXS
  };
}
