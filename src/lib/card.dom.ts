// Initializes the grid presence flag and observes changes to direct children. Detects direct
// Card.Grid nodes in the body to select the Card layout. Observation is limited to the first level.
export function connectCardGrid(
  body: HTMLElement,
  update: (containsGrid: boolean) => void
): () => void {
  let active = true;
  // Supports the data marker and the upstream ant-card-grid class.
  const publish = () => {
    if (active) {
      update([...body.children].some(child => child.hasAttribute('data-ant-card-grid')
        || child.classList.contains('ant-card-grid')));
    }
  };
  const Observer = body.ownerDocument.defaultView!.MutationObserver;
  const observer = new Observer(publish);
  observer.observe(body, { childList: true });
  publish();
  // Stops observation and further updates on Card destruction.
  return () => {
    active = false;
    observer.disconnect();
  };
}
