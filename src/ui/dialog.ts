// Keep keyboard navigation inside an active game dialog.
export function focusDialog(el: HTMLElement, initial?: HTMLElement | null, onEscape?: () => void) {
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.tabIndex = -1;
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
