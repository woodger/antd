export interface SelectValueOpacityView {
  contentOpacity: string;
  contentVisibility: string;
  styledValue: { opacity: string; visibility: string } | null;
  text: Array<{ text: string; effectiveOpacity: number }>;
}
export function readSelectValueOpacity(): {
  view: SelectValueOpacityView;
  raw: { inaccessibleSheets: unknown[]; [key: string]: unknown };
};
