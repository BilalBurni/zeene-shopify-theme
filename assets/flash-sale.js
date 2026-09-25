/* Flash sale card countdowns — shared by the flash sale page and the homepage slider.
   Every .js-fs-timer on the page is handled by one ticker, so several sections cost one interval. */
(function () {
  var DAY = 86400000;
  var items = [];
  var ticking = false;

  // "2026-09-01T23:59" is parsed by hand: Date() string parsing differs between browsers,
  // and the time must be read in the visitor's LOCAL timezone.
  function parseTarget(str) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(String(str || '').trim());
    if (!m) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 23, m[5] ? +m[5] : 59, 0, 0);
  }

  // Daily mode: resets at this time every day, so the timer never sits at zero.
  function parseDaily(str) {
    var m = /^(\d{1,2}):(\d{2})$/.exec(String(str || '').trim());
    if (!m) return null;
    var h = +m[1], mi = +m[2];
    if (h > 23 || mi > 59) return null;
    return { h: h, m: mi };
  }

  function dailyTarget(t) {
    var now = new Date();
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t.h, t.m, 0, 0);
    if (now >= d) d.setDate(d.getDate() + 1);
    return d;
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    var now = Date.now();
    var alive = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it.el.isConnected) continue;
      if (it.daily && (!it.target || it.target.getTime() <= now)) it.target = dailyTarget(it.daily);
      var diff = it.target.getTime() - now;
      if (diff <= 0) {
        if (!it.el.classList.contains('is-ended')) {
          it.el.classList.add('is-ended');
          if (it.label) it.label.textContent = it.ended;
        }
        continue;
      }
      alive++;
      it.d.textContent = pad(Math.floor(diff / DAY));
      it.h.textContent = pad(Math.floor((diff / 3600000) % 24));
      it.m.textContent = pad(Math.floor((diff / 60000) % 60));
      it.s.textContent = pad(Math.floor((diff / 1000) % 60));
    }
    return alive;
  }

  function collect(root) {
    var found = (root || document).querySelectorAll('.js-fs-timer:not([data-fs-ready])');
    for (var i = 0; i < found.length; i++) {
      var el = found[i];
      el.setAttribute('data-fs-ready', '1');
      var daily = parseDaily(el.getAttribute('data-daily'));
      var target = parseTarget(el.getAttribute('data-target'));
      if (!target && !daily) { el.remove(); continue; }
      items.push({
        el: el,
        target: target,
        daily: daily,
        ended: el.getAttribute('data-ended') || 'Sale ended',
        label: el.querySelector('.fs-card__timer-label'),
        d: el.querySelector('[data-u="d"]'),
        h: el.querySelector('[data-u="h"]'),
        m: el.querySelector('[data-u="m"]'),
        s: el.querySelector('[data-u="s"]')
      });
    }
    if (items.length && !ticking) {
      ticking = true;
      tick();
      setInterval(tick, 1000);
    } else if (items.length) {
      tick();
    }
  }

  window.zeeneFlashSaleInit = collect;

  if (document.readyState === 'complete' || document.readyState === 'interactive') collect();
  else document.addEventListener('DOMContentLoaded', function () { collect(); }, { once: true });

  // Theme editor: a re-rendered section brings new timers with it.
  document.addEventListener('shopify:section:load', function (e) { collect(e.target); });
})();
