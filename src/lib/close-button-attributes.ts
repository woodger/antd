type CloseAttributeName = 'role' | `aria-${string}` | `data-${string}`;
type CloseButtonAttributes<Options> = {
  [Name in keyof Options as Name extends CloseAttributeName ? Name : never]?: Options[Name];
};

/** Forwards the close button's own enumerable role, ARIA and data attributes. */
export function pickCloseButtonAttributes<Options extends object>(
  options: Options | null | undefined
): CloseButtonAttributes<Options> {
  const entries: [string, unknown][] = Object.entries(options ?? {});
  const attributes = entries.filter(([name]) =>
    name === 'role' || name.startsWith('aria-') || name.startsWith('data-')
  );

  // The filter retains the original keys and values. Object.entries erases their types.
  return Object.fromEntries(attributes) as CloseButtonAttributes<Options>;
}
