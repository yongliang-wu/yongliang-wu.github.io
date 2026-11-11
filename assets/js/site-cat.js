(function () {
  'use strict';

  var cat = document.querySelector('[data-site-cat]');
  if (!cat) return;

  var companion = cat.querySelector('[data-cat-companion]');
  var pet = cat.querySelector('[data-cat-pet]');
  var hide = cat.querySelector('[data-cat-hide]');
  var show = cat.querySelector('[data-cat-show]');
  var speech = cat.querySelector('[data-cat-speech]');
  var timer;
  var count = 0;
  var messages = ['Purr… ♡', 'Meow!', 'Hello, friend ♡'];
  var storageKey = 'homepage-cat-hidden';

  function setHidden(hidden, moveFocus) {
    clearTimeout(timer);
    cat.classList.remove('is-purring');
    speech.textContent = '';
    companion.hidden = hidden;
    show.hidden = !hidden;
    try {
      sessionStorage.setItem(storageKey, hidden ? '1' : '0');
    } catch (error) {
      // The companion still works when browser storage is unavailable.
    }
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
    speech.textContent = messages[count++ % messages.length];
    cat.classList.add('is-purring');
    timer = setTimeout(function () {
      cat.classList.remove('is-purring');
      speech.textContent = '';
    }, 1800);
  });

  hide.addEventListener('click', function () { setHidden(true, true); });
  show.addEventListener('click', function () { setHidden(false, true); });
}());
