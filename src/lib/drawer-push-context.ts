// Each Drawer keeps its own displacement and registration of nested open panels.
import { getContext, setContext } from 'svelte';

interface DrawerPushContext {
  readonly distance: number;
  registerChild: () => () => void;
}

const key = Symbol('ant-drawer-push');

/** Return the nearest Drawer, including the contents after being transferred to the portal. */
export function useDrawerPush() {
  return getContext<DrawerPushContext | undefined>(key);
}

/** Publishes the offset of this panel and the registration of an active child Drawer. */
export function provideDrawerPush(context: DrawerPushContext) {
  setContext(key, context);
}
