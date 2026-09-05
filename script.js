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
      updateAvatarGaze();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

updateScrub();

/* ---------- Hero avatar: icons highlight/drift based on scroll position ---------- */
/* through the hero. Eye-tracking (pupilLeft/pupilRight) will be re-added once  */
/* the real avatar art with a separate pupil layer replaces this static photo. */
var heroEl = document.getElementById('top');
var avatarStage = document.getElementById('avatarStage');
var avatarIcons = avatarStage ? Array.prototype.slice.call(avatarStage.querySelectorAll('.avatar-icon')) : [];

function updateAvatarGaze() {
  if (reduceMotion || !heroEl || !avatarStage || !avatarIcons.length) return;
  if (getComputedStyle(avatarStage.parentElement).display === 'none') return;

  var heroRect = heroEl.getBoundingClientRect();
  var progress = Math.min(1, Math.max(0, -heroRect.top / heroRect.height));
  var activeIndex = Math.min(avatarIcons.length - 1, Math.floor(progress * avatarIcons.length));

  avatarIcons.forEach(function (icon, i) {
    icon.classList.toggle('is-active', i === activeIndex);
    var drift = (progress - 0.5) * (16 + i * 5) * (i % 2 === 0 ? 1 : -1);
    icon.style.setProperty('--drift', drift.toFixed(1) + 'px');
  });
}

updateAvatarGaze();
window.addEventListener('resize', updateAvatarGaze);

/* ---------- Nav scrollspy: highlight the section in view ---------- */
var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav nav a[href^="#"]'));
var navSections = navLinks
  .map(function (link) { return document.querySelector(link.getAttribute('href')); })
  .filter(Boolean);

if (navLinks.length && 'IntersectionObserver' in window) {
  var navObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = document.querySelector('.site-nav nav a[href="#' + entry.target.id + '"]');
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  navSections.forEach(function (section) { navObserver.observe(section); });
}

/* ---------- Contact form: no backend on a static site, so this opens ---------- */
/* the visitor's email client with the message pre-filled via mailto:       */
var contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = contactForm.firstName.value.trim();
    var last = contactForm.lastName.value.trim();
    var service = contactForm.service.value;
    var email = contactForm.email.value.trim();
    var message = contactForm.message.value.trim();

    var subject = 'Project inquiry' + (service ? ' — ' + service : '');
    var bodyLines = [
      'Name: ' + (first + ' ' + last).trim(),
      'Email: ' + email,
      service ? 'Service: ' + service : null,
      '',
      message
    ].filter(function (line) { return line !== null; });

    var mailto = 'mailto:amalanil170899@gmail.com'
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(bodyLines.join('\n'));

    window.location.href = mailto;
  });
}