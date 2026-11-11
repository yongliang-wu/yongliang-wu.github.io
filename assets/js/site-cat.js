(function () {
  'use strict';

  var cat = document.querySelector('[data-site-cat]');
  if (!cat) return;

  var companion = cat.querySelector('[data-cat-companion]');
  var pet = cat.querySelector('[data-cat-pet]');
  var hide = cat.querySelector('[data-cat-hide]');
  var show = cat.querySelector('[data-cat-show]');
  var speech = cat.querySelector('[data-cat-speech]');
  var backToTop = document.querySelector('[data-cat-top]');
  var timer;
  var sleepTimer;
  var sleepDelay = 30000;
  var count = 0;
  var messages = ['Purr… ♡', 'Meow!', 'Hello, friend ♡'];
  var storageKey = 'homepage-cat-hidden';

  function wakeCat() {
    cat.classList.remove('is-sleeping');
    pet.setAttribute('aria-label', 'Pet the cat');
    pet.title = 'Pet the cat';
  }

  function scheduleNap() {
    clearTimeout(sleepTimer);
    if (companion.hidden || document.hidden || cat.classList.contains('is-sleeping')) return;
    sleepTimer = setTimeout(function () {
      clearTimeout(timer);
      speech.textContent = '';
      cat.classList.remove('is-purring');
      cat.classList.add('is-sleeping');
      pet.setAttribute('aria-label', 'Wake the cat');
      pet.title = 'Wake the cat';
    }, sleepDelay);
  }

  function setHidden(hidden, moveFocus) {
    clearTimeout(timer);
    clearTimeout(sleepTimer);
    wakeCat();
    cat.classList.remove('is-purring');
    speech.textContent = '';
    companion.hidden = hidden;
    show.hidden = !hidden;
    try {
      sessionStorage.setItem(storageKey, hidden ? '1' : '0');
    } catch (error) {
      // The companion still works when browser storage is unavailable.
    }
    if (!hidden) scheduleNap();
    if (moveFocus) (hidden ? show : pet).focus({ preventScroll: true });
  }

  var hidden = false;
  try {
    hidden = sessionStorage.getItem(storageKey) === '1';
  } catch (error) {
    // Default to showing the cat when browser storage is unavailable.
  }
  setHidden(hidden, false);
  cat.hidden = false;

  var home = document.querySelector('[data-cat-home]');
  var narrowScreen = window.matchMedia('(max-width: 1279px)');
  function placeCat() {
    (narrowScreen.matches && home ? home : document.body).appendChild(cat);
  }
  placeCat();
  narrowScreen.addEventListener('change', placeCat);

  pet.addEventListener('click', function () {
    clearTimeout(timer);
    var wasSleeping = cat.classList.contains('is-sleeping');
    wakeCat();
    speech.textContent = wasSleeping ? 'Mrrp… hello ♡' : messages[count++ % messages.length];
    cat.classList.add('is-purring');
    timer = setTimeout(function () {
      cat.classList.remove('is-purring');
      speech.textContent = '';
    }, 1800);
    scheduleNap();
  });

  pet.addEventListener('pointerenter', scheduleNap);
  pet.addEventListener('pointerleave', scheduleNap);
  pet.addEventListener('focus', scheduleNap);
  document.addEventListener('visibilitychange', scheduleNap);
  hide.addEventListener('click', function () { setHidden(true, true); });
  show.addEventListener('click', function () { setHidden(false, true); });

  if (backToTop) {
    function updateBackToTop() {
      backToTop.hidden = window.scrollY < 400;
    }
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
    backToTop.addEventListener('click', function () {
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' });
      var heading = document.querySelector('header h1');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }
}());
