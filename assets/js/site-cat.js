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
  var boxTimer;
  var boxEntryTimer;
  var boxExitTimer;
  var reachTimer;
  var toyLeaveTimer;
  var pointerFrame = 0;
  var pointerX = 0;
  var pointerY = 0;
  var lastReach = -3000;
  var lastToyActivity = 0;
  var sleepDelay = 30000;
  var boxStay = 7000;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var count = 0;
  var messages = ['Purr… ♡', 'Meow!', 'Hello, friend ♡'];
  var storageKey = 'homepage-cat-hidden';

  function updatePetLabel() {
    var label = cat.classList.contains('is-sleeping') ? 'Wake the cat' :
      (cat.classList.contains('is-in-box') || cat.classList.contains('is-entering-box')) ?
        'Bring the cat out of the box' : 'Pet the cat';
    pet.setAttribute('aria-label', label);
    pet.title = label;
  }

  function stopTracking() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    clearTimeout(reachTimer);
    clearTimeout(toyLeaveTimer);
    cat.classList.remove('is-tracking', 'is-reaching');
    ['--cat-look-x', '--cat-look-y', '--cat-look-angle', '--cat-eye-x', '--cat-eye-y',
      '--cat-paw-side', '--cat-toy-x', '--cat-toy-y'].forEach(function (property) {
      cat.style.removeProperty(property);
    });
  }

  function leaveBox() {
    clearTimeout(boxEntryTimer);
    clearTimeout(boxExitTimer);
    cat.classList.remove('is-in-box', 'is-entering-box');
    updatePetLabel();
  }

  function enterBox() {
    if (companion.hidden || document.hidden || cat.classList.contains('is-sleeping') ||
        cat.classList.contains('is-purring') || cat.classList.contains('is-tracking') ||
        pet.matches(':focus-visible')) return;
    stopTracking();
    cat.classList.add('is-entering-box');
    updatePetLabel();
    boxEntryTimer = setTimeout(function () {
      cat.classList.remove('is-entering-box');
      cat.classList.add('is-in-box');
      updatePetLabel();
      boxExitTimer = setTimeout(leaveBox, boxStay);
    }, reduceMotion.matches ? 0 : 240);
  }

  function wakeCat() {
    cat.classList.remove('is-sleeping');
    leaveBox();
  }

  function clearIdleTimers() {
    clearTimeout(sleepTimer);
    clearTimeout(boxTimer);
  }

  function scheduleNap() {
    clearIdleTimers();
    if (companion.hidden || document.hidden || cat.classList.contains('is-sleeping')) return;
    if (!cat.classList.contains('is-in-box') && !cat.classList.contains('is-entering-box')) {
      boxTimer = setTimeout(enterBox, 14000 + Math.random() * 4000);
    }
    sleepTimer = setTimeout(function () {
      clearTimeout(timer);
      clearTimeout(boxTimer);
      stopTracking();
      leaveBox();
      speech.textContent = '';
      cat.classList.remove('is-purring');
      cat.classList.add('is-sleeping');
      updatePetLabel();
    }, sleepDelay);
  }

  function setHidden(hidden, moveFocus) {
    clearTimeout(timer);
    clearIdleTimers();
    stopTracking();
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
    stopTracking();
    (narrowScreen.matches && home ? home : document.body).appendChild(cat);
  }
  placeCat();
  narrowScreen.addEventListener('change', placeCat);

  pet.addEventListener('click', function () {
    clearTimeout(timer);
    var wasSleeping = cat.classList.contains('is-sleeping');
    var wasInBox = cat.classList.contains('is-in-box') || cat.classList.contains('is-entering-box');
    stopTracking();
    wakeCat();
    speech.textContent = wasSleeping ? 'Mrrp… hello ♡' :
      wasInBox ? 'You found me ♡' : messages[count++ % messages.length];
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
  document.addEventListener('visibilitychange', function () {
    clearIdleTimers();
    clearTimeout(timer);
    stopTracking();
    leaveBox();
    cat.classList.remove('is-purring');
    speech.textContent = '';
    if (!document.hidden) scheduleNap();
  });
  hide.addEventListener('click', function () { setHidden(true, true); });
  show.addEventListener('click', function () { setHidden(false, true); });

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(value, maximum));
  }

  function followToy() {
    pointerFrame = 0;
    if (companion.hidden || document.hidden || reduceMotion.matches || !finePointer.matches ||
        cat.classList.contains('is-sleeping') || cat.classList.contains('is-in-box') ||
        cat.classList.contains('is-entering-box') || cat.classList.contains('is-purring')) {
      stopTracking();
      return;
    }
    var rect = pet.getBoundingClientRect();
    var dx = pointerX - (rect.left + rect.width / 2);
    var dy = pointerY - (rect.top + rect.height * .45);
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 145 || rect.bottom < 0 || rect.top > window.innerHeight) {
      stopTracking();
      return;
    }

    cat.classList.add('is-tracking');
    cat.style.setProperty('--cat-look-x', clamp(dx / 35, -3, 3) + 'px');
    cat.style.setProperty('--cat-look-y', clamp(dy / 45, -2, 2) + 'px');
    cat.style.setProperty('--cat-look-angle', clamp(dx / 15, -7, 7) + 'deg');
    cat.style.setProperty('--cat-eye-x', clamp(dx / 50, -1.5, 1.5) + 'px');
    cat.style.setProperty('--cat-eye-y', clamp(dy / 60, -1, 1) + 'px');
    cat.style.setProperty('--cat-paw-side', dx < 0 ? '-1' : '1');
    cat.style.setProperty('--cat-toy-x', clamp(pointerX - rect.left - 18,
      Math.max(-80, 8 - rect.left), Math.min(rect.width + 28, window.innerWidth - rect.left - 44)) + 'px');
    cat.style.setProperty('--cat-toy-y', clamp(pointerY - rect.top - 20,
      Math.max(-60, 8 - rect.top), Math.min(rect.height - 48, window.innerHeight - rect.top - 56)) + 'px');

    var now = Date.now();
    if (now - lastToyActivity > 1000) {
      lastToyActivity = now;
      scheduleNap();
    }
    if (distance < 105 && now - lastReach > 2800) {
      lastReach = now;
      cat.classList.add('is-reaching');
      reachTimer = setTimeout(function () { cat.classList.remove('is-reaching'); }, 650);
    }
    clearTimeout(toyLeaveTimer);
    toyLeaveTimer = setTimeout(stopTracking, 1800);
  }

  document.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'mouse' || !finePointer.matches || reduceMotion.matches) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(followToy);
  }, { passive: true });
  window.addEventListener('scroll', stopTracking, { passive: true });
  finePointer.addEventListener('change', stopTracking);
  reduceMotion.addEventListener('change', stopTracking);

  if (backToTop) {
    function updateBackToTop() {
      backToTop.hidden = window.scrollY < 400;
    }
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    updateBackToTop();
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'instant' : 'smooth' });
      var heading = document.querySelector('header h1');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    });
  }
}());
