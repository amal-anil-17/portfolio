/**
 * Toggles `.is-scrolled` on the nav once the page scrolls past a threshold,
 * triggering the shrink transition defined in nav-glass.css.
 */
(function () {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  const SCROLL_THRESHOLD = 60; // px scrolled before the nav shrinks
  let ticking = false;

  function updateNav() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add('is-scrolled');
    } else {
      nav.classList.remove('is-scrolled');
    }
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  });

  updateNav(); // set correct state on load (e.g. if page loads mid-scroll on refresh)
})();