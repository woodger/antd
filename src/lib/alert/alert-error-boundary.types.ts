import type { AlertContent } from './alert.types';

/**
 * A child render or synchronous effect error replaces Alert content. Remounting or changing the key
 * resets it. SSR errors propagate.
 */
export interface AlertErrorBoundaryProps {
  /** Defaults to Error.toString(). null and undefined select the error text. */
  title?: AlertContent;
  /** Defaults to Svelte Error.stack in place of the React componentStack. Renders inside pre. */
  description?: AlertContent;
  children?: AlertContent;
  /** Applies only to the error Alert. Healthy children receive no wrapper or id. */
  id?: string;
}
