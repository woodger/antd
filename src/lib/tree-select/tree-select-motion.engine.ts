/** Ant Design6.6.8 wrapper default followed by rc-select1.10.1 SelectTrigger precedence. */
export function treeSelectMotionName(
  animation: string | undefined,
  transitionName: string | undefined,
  selectPrefix: string,
  rootPrefix: string
) {
  return animation ? `${selectPrefix}-dropdown-${animation}`
    : transitionName === undefined ? `${rootPrefix}-slide-up` : transitionName;
}
