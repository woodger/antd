import { defaultPresetColors } from './theme-seed';
import { presetPalettes, presetPrimaryColors } from './theme-palettes';
import { generatePalette } from './theme-palette.engine';
import {
  generateLightColorPalettes,
  generateLightNeutralColors,
  generateDarkColorPalettes,
  generateDarkNeutralColors,
  genColorMapToken
} from './theme-color.engine';
import {
  genCommonMapToken,
  genControlHeight,
  genFontMapToken,
  genSizeMapToken,
  genCompactSizeMapToken
} from './theme-metrics.engine';
import { presetColors } from './theme-token.types';
import type {
  ColorPalettes,
  MapToken,
  PresetColorKey,
  SeedToken
} from './theme-token.types';

function getPresetTokens(seed: SeedToken, dark = false): ColorPalettes {
  const palettes: Record<string, string> = {};

  for (const name of Object.keys(defaultPresetColors) as PresetColorKey[]) {
    const color = name === 'pink' ? defaultPresetColors.pink : seed[name];
    let colors: readonly string[];
    if (dark) {
      colors = generatePalette(color, { theme: 'dark' });
    }
    else if (color === presetPrimaryColors[name]) {
      colors = presetPalettes[name];
    }
    else {
      colors = generatePalette(color);
    }

    for (let index = 0; index < 10; index++) {
      palettes[`${name}${index + 1}`] = colors[index];
    }
  }

  // Preset pink remains the color of UI, but is no longer a customizable seed.
  return palettes as ColorPalettes;
}

/** Initial defaultAlgorithm: seed → MapToken, without alias overrides and UI effects side. */
export function defaultAlgorithm(seed: SeedToken): MapToken {
  return {
    ...seed,
    ...getPresetTokens(seed),
    ...genColorMapToken(seed, {
      generateColorPalettes: generateLightColorPalettes,
      generateNeutralColorPalettes: generateLightNeutralColors
    }),
    ...genFontMapToken(seed.fontSize),
    ...genSizeMapToken(seed),
    ...genControlHeight(seed),
    ...genCommonMapToken(seed)
  };
}

/** In the presence of mapToken continues the chain; otherwise first causes defaultAlgorithm. */
export function darkAlgorithm(seed: SeedToken, mapToken?: MapToken): MapToken {
  const colorPalettes = getPresetTokens(seed, true);
  const mergedMapToken = mapToken ?? defaultAlgorithm(seed);
  const colorMap = genColorMapToken(seed, {
    generateColorPalettes: generateDarkColorPalettes,
    generateNeutralColorPalettes: generateDarkNeutralColors
  });
  const states: Record<string, string> = {};

  for (const name of presetColors) {
    const color = name === 'pink' ? defaultPresetColors.pink : seed[name];
    if (!color) continue;

    const palette = generateDarkColorPalettes(color);
    states[`${name}Hover`] = palette[7];
    states[`${name}Active`] = palette[5];
  }

  return {
    ...mergedMapToken,
    ...colorPalettes,
    ...colorMap,
    ...states,
    colorPrimaryBg: colorMap.colorPrimaryBorder,
    colorPrimaryBgHover: colorMap.colorPrimaryBorderHover
  };
}

/** Retains the colors of the previous step and recalculates the original compact dimensions. */
export function compactAlgorithm(seed: SeedToken, mapToken?: MapToken): MapToken {
  const mergedMapToken = mapToken ?? defaultAlgorithm(seed);
  const fontSize = mergedMapToken.fontSizeSM;
  const controlHeight = mergedMapToken.controlHeight - 4;

  return {
    ...mergedMapToken,
    ...genCompactSizeMapToken(mapToken ?? seed),
    ...genFontMapToken(fontSize),
    controlHeight,
    ...genControlHeight({ ...mergedMapToken, controlHeight })
  };
}
