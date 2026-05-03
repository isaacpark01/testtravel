(function () {
  function applyTheme(mode) {
    if (mode === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('dropped_theme', mode);
  }

  window.toggleTheme = function () {
    applyTheme(document.body.classList.contains('light-mode') ? 'dark' : 'light');
  };

  const saved = localStorage.getItem('dropped_theme');
  if (saved) {
    applyTheme(saved);
  } else {
    const h = new Date().getHours();
    applyTheme(h >= 6 && h < 19 ? 'light' : 'dark');
  }
})();
