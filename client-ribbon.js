export function initClientRibbon() {
  const ribbon = document.querySelector('.clientsBand');
  const track = ribbon?.querySelector('.clientTrack');
  const group = track?.querySelector('.clientGroup');
  const toggle = document.querySelector('#ribbon-toggle');
  if (!ribbon || !track || !group || !toggle) return;

  const duplicate = group.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.inert = true;
  track.append(duplicate);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;

  function update() {
    ribbon.classList.toggle('is-moving', !motion.matches);
    ribbon.dataset.paused = String(paused);
    toggle.hidden = motion.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Продолжить движение' : 'Приостановить ленту';
  }
  toggle.addEventListener('click', () => {paused = !paused; update();});
  motion.addEventListener('change', update);
  document.addEventListener('visibilitychange', () => ribbon.classList.toggle('is-tab-hidden', document.hidden));
  ribbon.classList.toggle('is-tab-hidden', document.hidden);
  if (window.IntersectionObserver) {
    const observer = new window.IntersectionObserver(entries => {
      ribbon.classList.toggle('is-outside', !entries[0].isIntersecting);
    }, {rootMargin: '100px'});
    observer.observe(ribbon);
  }
  update();
}
