// === app.js — loading screen controller ===
(function() {
  "use strict";

  // get references
  const loadingScreen = document.getElementById('loadingScreen');
  const hideBtn = document.getElementById('hideLoaderBtn');
  const showBtn = document.getElementById('showLoaderBtn');

  // toggle visibility (simulate loading complete / restart)
  if (hideBtn && showBtn && loadingScreen) {
    hideBtn.addEventListener('click', function() {
      loadingScreen.classList.add('hidden');
    });

    showBtn.addEventListener('click', function() {
      loadingScreen.classList.remove('hidden');
    });
  }

  // optional: log to console
  console.log('✨ Loading screen ready – use buttons to hide/show.');
})();