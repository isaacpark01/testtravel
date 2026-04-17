/* ── Scroll-reveal + stat counter ─────────────────────────────── */
(function () {
  'use strict';

  /* ── Scroll reveal ── */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    /* Fallback: no IntersectionObserver — just show everything */
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ── Animated stat counters ── */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCounter(el) {
    var target  = parseInt(el.dataset.count, 10);
    var suffix  = el.dataset.suffix || '';
    var dur     = 1200; /* ms */
    var start   = null;

    function step(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      var progress = Math.min(elapsed / dur, 1);
      el.textContent = Math.round(easeOut(progress) * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counterEls = document.querySelectorAll('.stat-num[data-count]');
  if (!counterEls.length) return;

  if ('IntersectionObserver' in window) {
    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counterEls.forEach(function (el) { counterIO.observe(el); });
  } else {
    counterEls.forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || '');
    });
  }
})();