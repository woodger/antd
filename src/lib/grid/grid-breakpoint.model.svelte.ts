import { gridMediaQueries } from './grid.engine';
import type { GridBreakpoint, GridScreenMap } from './grid.types';

/**
 * Creates a SSR-safe card breakpoints without access to the window. The connect(view) browser
 * subscribes to matchMedia and returns the mandatory cleanup; the reconnection removes previous
 * subscriptions. The optional mediaQueries specifies a full query card; without it, standard Grid
 * thresholds are saved.
 */
export function createBreakpoint() {
  let screens = $state<GridScreenMap>({});
  let connected = $state(false);
  let dispose: (() => void) | undefined;
  let generation = 0;
  return {
    get screens() {
      return screens;
    },
    get connected() {
      return connected;
    },
    connect(
      view: Pick<Window, 'matchMedia'>,
      mediaQueries: Readonly<Record<GridBreakpoint, string>> = gridMediaQueries
    ) {
      dispose?.();
      const version = ++generation;
      const queries = Object.entries(mediaQueries).map(
        ([key, query]) => [key as GridBreakpoint, view.matchMedia(query)] as const
      );
      function publish() {
        if (version !== generation) {
          return;
        }

        screens = Object.fromEntries(queries.map(([key, media]) => [key, media.matches]));
        connected = true;
      }
      for (const [, media] of queries)
        media.addEventListener('change', publish);
      publish();
      let active = true;
      dispose = () => {
        if (!active) {
          return;
        }

        active = false;
        for (const [, media] of queries)
          media.removeEventListener('change', publish);
        if (version === generation) {
          generation++;
          connected = false;
        }
      };
      return dispose;
    }
  };
}
