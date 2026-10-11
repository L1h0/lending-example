export function initClientRibbon() {
  const ribbon = document.querySelector('.clientsBand');
  const track = ribbon?.querySelector('.clientTrack');
  const group = track?.querySelector('.clientGroup');
  if (!ribbon || !track || !group) return;

  const duplicate = group.cloneNode(true);
  duplicate.setAttribute('aria-hidden', 'true');
  duplicate.inert = true;
  track.append(duplicate);
  ribbon.classList.add('is-moving');
}
