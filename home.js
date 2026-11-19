// Home page only.
//
// The three "Which Product Do I Need?" cards are <details> boxes, so they
// open and close on their own with no script (like the FAQ questions).
// This file only makes that smooth: it slides each card's contents open
// and closed instead of letting them appear at once. Visitors whose
// device is set to reduce motion, and browsers without animation support,
// get the plain instant open and close.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !Element.prototype.animate) return;

  document.querySelectorAll('details.guide-card').forEach(function (card) {
    var summary = card.querySelector('summary');
    var body = card.querySelector('.guide-card-body');
    if (!summary || !body) return;
    var running = null;

    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (running) running.cancel();
      if (!card.open) {
        card.open = true;
        var full = body.scrollHeight;
        running = body.animate(
          [{ height: '0px', opacity: 0 }, { height: full + 'px', opacity: 1 }],
          { duration: 280, easing: 'ease-out' }
        );
        running.onfinish = running.oncancel = function () { running = null; };
      } else {
        var now = body.offsetHeight;
        running = body.animate(
          [{ height: now + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 220, easing: 'ease-in' }
        );
        running.onfinish = function () { card.open = false; running = null; };
        running.oncancel = function () { running = null; };
      }
    });
  });
})();
