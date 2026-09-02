document.getElementById('year').textContent = new Date().getFullYear();

var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Scroll reveal ---------- */
var revealEls = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach(function (el) { el.classList.add('is-visible'); });
} else {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  revealEls.forEach(function (el) { observer.observe(el); });
}

/* ---------- Scrub bar: scroll progress as a timecode ---------- */
var scrubFill = document.getElementById('scrubFill');
var scrubTc = document.getElementById('scrubTc');

function frameToTimecode(fraction) {
  var totalFrames = Math.floor(fraction * 24 * 60); // pretend 60s reel at 24fps
  var frames = totalFrames % 24;
  var totalSeconds = Math.floor(totalFrames / 24);
  var seconds = totalSeconds % 60;
  var minutes = Math.floor(totalSeconds / 60);
  function pad(n) { return String(n).padStart(2, '0'); }
  return '00:' + pad(minutes) + ':' + pad(seconds) + ':' + pad(frames);
}

function updateScrub() {
  var doc = document.documentElement;
  var scrollTop = doc.scrollTop || document.body.scrollTop;
  var scrollHeight = doc.scrollHeight - doc.clientHeight;
  var fraction = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
  fraction = Math.min(1, Math.max(0, fraction));

  if (scrubFill) scrubFill.style.width = (fraction * 100).toFixed(2) + '%';
  if (scrubTc) scrubTc.textContent = frameToTimecode(fraction);
}

var ticking = false;
window.addEventListener('scroll', function () {
  if (!ticking) {
    window.requestAnimationFrame(function () {
      updateScrub();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

updateScrub();