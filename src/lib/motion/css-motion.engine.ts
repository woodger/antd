// Resolves CSSMotion phase class names for entering and leaving surfaces.
export type CssMotionPhase = 'appear' | 'enter' | 'leave';
export type CssMotionStep = 'prepare' | 'start' | 'active';

export type CssMotionName = string | Partial<Record<
  CssMotionPhase | `${CssMotionPhase}${Capitalize<CssMotionStep>}`, string
>>;

/** A string name supplies a base class. A map supplies only its listed classes. */
export function getCssMotionClassName(
  name: CssMotionName | undefined,
  phase: CssMotionPhase,
  step: CssMotionStep
) {
  if (!name) {
    return undefined;
  }
  if (typeof name === 'string') {
    return `${name}-${phase} ${name}-${phase}-${step} ${name}`;
  }

  const suffix = `${step[0].toUpperCase()}${step.slice(1)}` as Capitalize<CssMotionStep>;
  return [name[phase], name[`${phase}${suffix}`]].filter(Boolean).join(' ') || undefined;
}
