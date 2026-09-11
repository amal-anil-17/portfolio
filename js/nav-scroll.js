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
/* Mobile menu: native modal handles focus trapping and background interaction. */
(function () {
  const header = document.querySelector('.site-nav');
  const navigation = header && header.querySelector('nav');
  if (!navigation || header.querySelector('.mobile-menu-toggle')) return;
  const mobile = window.matchMedia('(max-width: 640px)');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'mobile-menu-toggle';
  toggle.setAttribute('aria-label', 'Open navigation menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'mobile-navigation');
  toggle.innerHTML = '<span></span><span></span>';
  header.appendChild(toggle);
  const dialog = document.createElement('dialog');
  dialog.id = 'mobile-navigation';
  dialog.className = 'mobile-menu-dialog';
  dialog.setAttribute('aria-label', 'Navigation');
  const top = document.createElement('div');
  top.className = 'mobile-menu-top';
  const title = document.createElement('span');
  title.textContent = header.querySelector('.mark').textContent;
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'mobile-menu-close';
  close.setAttribute('aria-label', 'Close navigation menu');
  close.innerHTML = '<span></span><span></span>';
  top.append(title, close);
  const links = document.createElement('nav');
  links.className = 'mobile-menu-links';
  links.setAttribute('aria-label', 'Mobile navigation');
  navigation.querySelectorAll('a').forEach(link => {
    const copy = link.cloneNode(true);
    copy.querySelectorAll('span').forEach(span => span.remove());
    copy.textContent = copy.textContent.trim();
    copy.removeAttribute('class');
    links.appendChild(copy);
  });
  const footer = document.createElement('div');
  footer.className = 'mobile-menu-footer';
  const location = document.createElement('p');
  location.textContent = 'KOCHI, KERALA, INDIA';
  const email = document.createElement('a');
  email.href = 'mailto:amalanil170899@gmail.com';
  email.textContent = 'EMAIL ME';
  footer.append(location, email);
  dialog.append(top, links, footer);
  document.body.appendChild(dialog);
  let previousOverflow = '';
  function alignCloseButton() {
    const rect = toggle.getBoundingClientRect();
    close.style.left = rect.left + 'px';
    close.style.top = rect.top + 'px';
    close.style.width = rect.width + 'px';
    close.style.height = rect.height + 'px';
  }
  window.addEventListener('resize', () => { if (dialog.open) alignCloseButton(); });
  function openMenu() {
    if (!mobile.matches || dialog.open) return;
    previousOverflow = document.documentElement.style.overflow;
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing', 'is-menu-open');
    alignCloseButton();
    dialog.showModal();
    // Paint two lines first, then rotate those same lines into an X.
    void close.offsetWidth;
    requestAnimationFrame(() => {
      if (dialog.open && !dialog.classList.contains('is-closing')) dialog.classList.add('is-menu-open');
    });
    document.documentElement.style.overflow = 'hidden';
    toggle.setAttribute('aria-expanded', 'true');
    close.focus();
  }
  let closeTimer;
  function closeMenu() {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.remove('is-menu-open');
    dialog.classList.add('is-closing');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    closeTimer = setTimeout(() => dialog.close(), reduced ? 0 : 240);
  }
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  toggle.addEventListener('click', openMenu);
  close.addEventListener('click', closeMenu);
  dialog.addEventListener('close', () => {
    clearTimeout(closeTimer);
    dialog.classList.remove('is-closing', 'is-menu-open');
    document.documentElement.style.overflow = previousOverflow;
    toggle.setAttribute('aria-expanded', 'false');
  });
  links.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    // Selecting a section closes immediately so navigation is not delayed.
    dialog.close();
    // Unlock before scrolling to the requested section.
    document.documentElement.style.overflow = previousOverflow;
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    });
  });
  mobile.addEventListener('change', () => { if (!mobile.matches) closeMenu(); });
  // Track input method: a programmatic focus after tapping should not draw a ring.
  document.addEventListener('pointerdown', () => {
    dialog.classList.remove('keyboard-navigation');
    header.classList.remove('keyboard-navigation');
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' || event.key.startsWith('Arrow')) {
      dialog.classList.add('keyboard-navigation');
      header.classList.add('keyboard-navigation');
    }
  }, true);
  header.classList.add('has-mobile-menu');
})();
