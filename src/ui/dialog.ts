// Keep keyboard navigation inside an active game dialog.
export function focusDialog(el: HTMLElement, initial?: HTMLElement | null, onEscape?: () => void) {
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.tabIndex = -1;
  // A modal must hide its background from pointer and assistive navigation,
  // not merely wrap Tab. Restore each sibling's original state on dismissal.
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const parent = el.parentElement;
  const background = parent ? [...parent.children].filter(node => node !== el).map(node => [node as HTMLElement, (node as HTMLElement).inert] as const) : [];
  background.forEach(([node]) => { node.inert = true; });
  if (parent) {
    const observer = new MutationObserver(() => {
      if (el.parentElement === parent) return;
      background.forEach(([node, wasInert]) => { node.inert = wasInert; });
      observer.disconnect();
      if (document.activeElement === document.body && previousFocus?.isConnected) previousFocus.focus();
    });
    observer.observe(parent, { childList: true });
  }

  const focusables = () => [...el.querySelectorAll<HTMLElement>('button:not([disabled]),[tabindex="0"],a[href]')];
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && onEscape) { e.preventDefault(); onEscape(); return; }
    if (e.key !== 'Tab') return;
    const list = focusables();
    if (!list.length) { e.preventDefault(); el.focus(); return; }
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  (initial ?? focusables()[0] ?? el).focus();
}
