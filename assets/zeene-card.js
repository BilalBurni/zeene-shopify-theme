/* Zeene product card behaviour — shared by product-grid & collection-grid.
   Handles image gallery arrows, colour swatch image-swap, and size -> add to cart. */
(function () {
  function refreshDrawerAndOpen() {
    var cart = document.querySelector('cart-drawer');
    return fetch('/?section_id=cart-drawer').then(function (r) { return r.text(); }).then(function (html) {
      var fresh = new DOMParser().parseFromString(html, 'text/html').querySelector('#CartDrawer');
      var cur = document.querySelector('#CartDrawer');
      if (fresh && cur) cur.innerHTML = fresh.innerHTML;
      if (cart) { cart.classList.remove('is-empty'); if (typeof cart.open === 'function') cart.open(); }
      fetch('/?section_id=cart-icon-bubble').then(function (r) { return r.text(); }).then(function (h) { var nb = new DOMParser().parseFromString(h, 'text/html').querySelector('#cart-icon-bubble'); var cb = document.querySelector('#cart-icon-bubble'); if (nb && cb) cb.innerHTML = nb.innerHTML; }).catch(function () {});
    });
  }
  function addToCart(id, btn) {
    if (btn) btn.classList.add('is-loading');
    fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: id, quantity: 1 }] }) })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (btn) btn.classList.remove('is-loading'); if (res && res.status) { return; } refreshDrawerAndOpen(); })
      .catch(function () { if (btn) btn.classList.remove('is-loading'); window.location = '/cart'; });
  }
  function initCard(card) {
    if (card.dataset.pcInit) return;
    card.dataset.pcInit = '1';
    var gallery = card.querySelector('.js-pc-gallery');
    var swatches = card.querySelectorAll('.pc__swatch');
    if (gallery) {
      var slides = gallery.querySelectorAll('.pc__slide');
      var media = card.querySelector('.pc__media');
      var segs = card.querySelectorAll('.pc__seg');
      var count = slides.length;
      var w = function () { return gallery.clientWidth || 1; };
      var setSeg = function (i) { for (var si = 0; si < segs.length; si++) segs[si].classList.toggle('is-active', si === i); };
      var jump = function (i) { i = Math.max(0, Math.min(count - 1, i)); gallery.scrollLeft = i * w(); setSeg(i); };
      var glide = function (i) { i = Math.max(0, Math.min(count - 1, i)); gallery.scrollTo({ left: i * w(), behavior: 'smooth' }); setSeg(i); };
      if (count > 1 && media && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        var curIdx = -1;
        media.addEventListener('mousemove', function (e) {
          var rect = gallery.getBoundingClientRect();
          var i = Math.floor((e.clientX - rect.left) / rect.width * count);
          i = Math.max(0, Math.min(count - 1, i));
          if (i !== curIdx) { curIdx = i; jump(i); }
        });
        media.addEventListener('mouseleave', function () { curIdx = 0; jump(0); });
      }
      gallery.addEventListener('scroll', function () { setSeg(Math.round(gallery.scrollLeft / w())); }, { passive: true });
      swatches.forEach(function (sw) {
        var img = sw.getAttribute('data-img');
        sw.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); swatches.forEach(function (s) { s.classList.remove('is-active'); }); sw.classList.add('is-active'); updateSizes(card); if (img) { for (var i = 0; i < slides.length; i++) { if (slides[i].getAttribute('data-src') === img) { glide(i); break; } } } });
      });
    } else {
      swatches.forEach(function (sw) { sw.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); swatches.forEach(function (s) { s.classList.remove('is-active'); }); sw.classList.add('is-active'); updateSizes(card); }); });
    }
    // "+N" toggle — chhupe swatches reveal/collapse; chip "+N" <-> "-N".
    var moreBtn = card.querySelector('.js-pc-swatch-more');
    if (moreBtn) {
      var moreWrap = card.querySelector('.js-pc-swatches');
      var moreCnt = moreBtn.getAttribute('data-count');
      moreBtn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var open = moreWrap.classList.toggle('is-expanded');
        moreBtn.textContent = (open ? '-' : '+') + moreCnt;
        moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
    var variantsEl = card.querySelector('.js-pc-variants');
    card.querySelectorAll('.js-pc-size').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        var size = btn.getAttribute('data-size');
        var sizesWrap = card.querySelector('.js-pc-sizes');
        var url = sizesWrap ? sizesWrap.getAttribute('data-url') : '/cart';
        if (!variantsEl) { window.location = url; return; }
        var variants; try { variants = JSON.parse(variantsEl.textContent); } catch (err) { window.location = url; return; }
        var activeSw = card.querySelector('.pc__swatch.is-active');
        var color = activeSw ? activeSw.getAttribute('title') : null;
        var variant = null;
        for (var i = 0; i < variants.length; i++) { var o = variants[i].options; if (o.indexOf(size) > -1 && (!color || o.indexOf(color) > -1)) { variant = variants[i]; break; } }
        if (!variant || !variant.available) { window.location = url; return; }
        addToCart(variant.id, btn);
      });
    });
    updateSizes(card);
  }
  function updateSizes(card) {
    var variantsEl = card.querySelector('.js-pc-variants');
    if (!variantsEl) return;
    var variants; try { variants = JSON.parse(variantsEl.textContent); } catch (e) { return; }
    var activeSw = card.querySelector('.pc__swatch.is-active');
    var color = activeSw ? activeSw.getAttribute('title') : null;
    card.querySelectorAll('.js-pc-size').forEach(function (btn) {
      var size = btn.getAttribute('data-size');
      var ok = false;
      for (var i = 0; i < variants.length; i++) { var o = variants[i].options; if (variants[i].available && o.indexOf(size) > -1 && (!color || o.indexOf(color) > -1)) { ok = true; break; } }
      btn.classList.toggle('is-unavailable', !ok);
      btn.disabled = !ok;
    });
  }
  function initAll(root) { (root || document).querySelectorAll('.js-pc').forEach(initCard); }
  window.zeeneInitCards = initAll;
  if (document.readyState !== 'loading') initAll(); else document.addEventListener('DOMContentLoaded', function () { initAll(); });
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });
})();
