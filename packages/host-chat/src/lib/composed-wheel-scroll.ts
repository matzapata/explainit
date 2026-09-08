/** True when a composedPath node can consume this vertical wheel delta. */
export function canConsumeWheel(node: EventTarget, deltaY: number): boolean {
  if (!(node instanceof HTMLElement)) {
    return false;
  }
  const overflowY = getComputedStyle(node).overflowY;
  if (overflowY !== 'auto' && overflowY !== 'scroll') {
    return false;
  }
  if (node.scrollHeight <= node.clientHeight) {
    return false;
  }
  if (deltaY < 0) {
    return node.scrollTop > 0;
  }
  if (deltaY > 0) {
    return node.scrollTop + node.clientHeight < node.scrollHeight - 1;
  }
  return true;
}

function scrollableFromComposedPath(
  event: WheelEvent,
): HTMLElement | undefined {
  const node = event
    .composedPath()
    .find((candidate) => canConsumeWheel(candidate, event.deltaY));
  return node instanceof HTMLElement ? node : undefined;
}

function scrollableFromShadowPoint(
  shadowRoot: ShadowRoot,
  event: WheelEvent,
): HTMLElement | undefined {
  const hitTest = shadowRoot.elementFromPoint?.bind(shadowRoot);
  if (!hitTest) {
    return undefined;
  }
  let node: Element | null = hitTest(event.clientX, event.clientY);
  while (node) {
    if (canConsumeWheel(node, event.deltaY)) {
      return node;
    }
    node = node.parentElement;
  }
  return undefined;
}

/**
 * Radix RemoveScroll listens on document (capture) and sees the Shadow host
 * as the target, so it preventDefaults wheel. Closed shadow roots also hide
 * internals from composedPath(); fall back to the ShadowRoot hit test.
 * Apply the delta ourselves after blocking RemoveScroll.
 */
export function allowWheelThroughScrollLock(
  event: WheelEvent,
  shadowRoot?: ShadowRoot,
): void {
  const scrollable =
    scrollableFromComposedPath(event) ??
    (shadowRoot ? scrollableFromShadowPoint(shadowRoot, event) : undefined);
  if (!scrollable) {
    return;
  }
  event.stopImmediatePropagation();
  if (event.cancelable) {
    event.preventDefault();
  }
  scrollable.scrollTop += event.deltaY;
}
