// Calculate layout FormItem. An indentation of an empty label arises when using the general
// labelCol and wrapperCol.
import type { ColProps, ColSize, GridBreakpoint } from './grid.types';
import { gridBreakpoints } from './grid.engine';
import type { RenderEmptyContent } from './types';

// Normalizes the numerical span into an object suitable for calculating offset.
function colSize(value: ColProps[GridBreakpoint]): ColSize {
  // Source loses numeric shorthand when you output an offset; save the usual Col semantics.
  if (typeof value === 'number') {
    return { span: value };
  }

  return typeof value === 'object' && value !== null ? value : {};
}

/** Null label aligns control to Form.labelCol; local col props disable offset. */
export function resolveFormWrapperCol({
  label, labelCol, wrapperCol, formLabelCol, formWrapperCol
}: {
  label?: RenderEmptyContent;
  labelCol?: ColProps;
  wrapperCol?: ColProps;
  formLabelCol?: ColProps;
  formWrapperCol?: ColProps;
}): ColProps | undefined {
  if (label !== null || labelCol || wrapperCol || !formLabelCol) {
    return wrapperCol ?? formWrapperCol;
  }

  const merged: ColProps = { ...formWrapperCol };
  const sizes = [undefined, ...[...gridBreakpoints].reverse()];
  for (const size of sizes) {
    const labelSize = size ? colSize(formLabelCol[size]) : formLabelCol;
    const wrapperSize = size ? colSize(merged[size]) : merged;
    if ('span' in labelSize && !('offset' in wrapperSize) && Number(labelSize.span) < 24) {
      if (size) {
        merged[size] = { ...wrapperSize, offset: labelSize.span };
      }
      else {
        merged.offset = labelSize.span;
      }
    }
  }

  return merged;
}
