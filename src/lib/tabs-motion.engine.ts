import type { TabsAnimatedConfig } from './tabs-motion.types';
export { getCssMotionClassName as getTabsMotionClassName } from './css-motion.engine';

/** Два исходных useAnimateConfig: Ant Design wrapper, затем rc-tabs 1.13.0. */
export function getTabsAnimation(
  animated: boolean | TabsAnimatedConfig | undefined,
  prefixCls = 'ant-tabs'
) {
  let result: TabsAnimatedConfig;
  if (animated === false) {
    result = { inkBar: false, tabPane: false };
  }
  else if (animated === true) {
    result = { inkBar: true, tabPane: true };
  }
  else {
    result = { inkBar: true, ...(animated ?? { tabPane: false }) };
  }

  if (result.tabPane) {
    result.tabPaneMotion = {
      motionAppear: false,
      motionEnter: true,
      motionLeave: true,
      motionName: `${prefixCls}-switch`
    };
  }
  if (result.tabPaneMotion && result.tabPane === undefined)
    result.tabPane = true;
  if (!result.tabPaneMotion && result.tabPane)
    result.tabPane = false;

  return result;
}
