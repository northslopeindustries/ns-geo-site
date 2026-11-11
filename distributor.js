// Become a Distributor page only.
//
// Counts "40%+" and "$2,000" up from zero the first time each scrolls into
// view, with the same speed and easing as the home page counters in
// script.js. Those cannot show a "$" or a comma, so this page has its own.
//
// Each number plays once. Visitors whose device is set to reduce motion see
// the final numbers straight away, and if this file ever fails to load the
// numbers simply show as written in the page.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  function show(el, n) {
    el.textContent = (el.dataset.countPrefix || '') + n.toLocaleString('en-US') + (el.dataset.countSuffix || '');
  }

  function run(el) {
    var target = parseInt(el.dataset.countTo, 10);
    var duration = 1600;
    var start = performance.now();
    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      show(el, Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        observer.unobserve(e.target);
        run(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count-to]').forEach(function (el) {
    show(el, 0);
    observer.observe(el);
  });
})();
