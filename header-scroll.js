// Scroll position, rather than scroll direction, controls the first-screen header.
export function initHeaderScroll(closeMenu) {
  const header = document.querySelector('.siteHeader');
  const boundary = document.querySelector('#pick');
  const hero = document.querySelector('.heroStage');
  if (!header || !boundary) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let headerHeight = 0;
  let hideAt = 1;
  let frame = 0;
  let measureNeeded = true;
  let previousScroll = window.scrollY;

  function render() {
    frame = 0;
    if (measureNeeded) {
      headerHeight = header.getBoundingClientRect().height;
      // Section anchors land 24px below the viewport edge.
      hideAt = Math.max(1, boundary.getBoundingClientRect().top + window.scrollY - 24);
      measureNeeded = false;
    }
    const progress = Math.min(1, Math.max(0, window.scrollY / hideAt));
    const movement = reducedMotion.matches ? Number(progress === 1) : progress;
    header.style.setProperty('--header-shift', `${-headerHeight * movement}px`);
    const hidden = progress === 1;
    header.inert = hidden;
    if (hidden) header.setAttribute('aria-hidden', 'true');
    else header.removeAttribute('aria-hidden');
    if (hidden || window.scrollY !== previousScroll) closeMenu();
    previousScroll = window.scrollY;
  }

  function schedule(remeasure = false) {
    measureNeeded ||= remeasure;
    if (!frame) frame = window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', () => schedule(), {passive: true});
  window.addEventListener('resize', () => schedule(true), {passive: true});
  window.addEventListener('pageshow', () => schedule(true));
  reducedMotion.addEventListener('change', () => schedule());
  if (window.ResizeObserver) {
    const observer = new window.ResizeObserver(() => schedule(true));
    observer.observe(header);
    if (hero) observer.observe(hero);
  }
  document.fonts?.ready.then(() => schedule(true));
  render();
}
