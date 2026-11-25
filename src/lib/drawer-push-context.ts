// Каждый Drawer хранит собственное смещение и регистрации вложенных открытых панелей.
import { getContext, setContext } from 'svelte';

interface DrawerPushContext {
  readonly distance: number;
  registerChild: () => () => void;
}

const key = Symbol('ant-drawer-push');

/** Возвращает ближайший Drawer, включая содержимое после переноса в портал. */
export function useDrawerPush() {
  return getContext<DrawerPushContext | undefined>(key);
}

/** Публикует смещение этой панели и регистрацию активного дочернего Drawer. */
export function provideDrawerPush(context: DrawerPushContext) {
  setContext(key, context);
}
