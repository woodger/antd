// Scales Avatar text to fit its container. Measurement follows the window and lifecycle of the
// current DOM nodes.
import { getAvatarScale } from './avatar.engine';

// Subscribes to text and container size changes and sets the initial scale synchronously.
export function connectAvatarText(host: HTMLElement, text: HTMLElement, gap: number) {
  let active = true;
  // Updates transform only while the connection is active.
  const measure = () => {
    if (active)
      text.style.transform = `scale(${getAvatarScale(text.offsetWidth, host.offsetWidth, gap)})`;
  };
  const resize = new host.ownerDocument.defaultView!.ResizeObserver(measure);
  resize.observe(host);
  resize.observe(text);
  measure();
  // Disconnects observation and clears the transform owned by this connection.
  return () => {
    active = false;
    resize.disconnect();
    text.style.removeProperty('transform');
  };
}
