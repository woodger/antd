export interface DialogContainerCase {
  name: string;
  component: 'modal' | 'drawer';
  parent?: 'none' | 'shadow' | 'late-target';
  child?: 'child' | 'undefined';
  local?: 'local' | 'undefined' | 'inline' | 'element' | 'selector' | 'missing-selector'
    | 'shadow' | 'empty-result' | 'empty-selector' | 'late-target';
  resetTheme?: boolean;
  initial?: boolean;
  rtl?: boolean;
  force?: boolean;
  destroy?: boolean;
}
