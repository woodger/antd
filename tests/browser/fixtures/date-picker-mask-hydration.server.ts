import { render } from 'svelte/server';
import Case from './DatePickerMaskCase.svelte';
import type { MaskOwner, MaskFormatProfile } from '../date-picker-mask-cases.mjs';
import type { MaskCapture } from '../date-picker-mask-native-types';

export function renderMaskHydration(owner: MaskOwner, initialFormatProfile: MaskFormatProfile) {
  if (typeof window !== 'undefined' || typeof document !== 'undefined') {
    throw Error('Mask SSR requires a DOM-free process');
  }
  const capture: MaskCapture = {};
  const { head, body } = render(Case, { props: { owner, initialFormatProfile, capture } });
  return { head, body, domFree: true };
}
