(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var sheet = $('link[rel="stylesheet"][href*="assets/css/"]');
  var siteRoot = sheet ? sheet.href.slice(0, sheet.href.indexOf('assets/css/')) : '/';
  var fromRoot = function (u) { return u && u.charAt(0) === '/' ? siteRoot + u.slice(1) : u; };
  var header = $('[data-header]');
  if (header) {
    var ticking = false;
    var onScroll = function () {
      ticking = false;
      var y = window.scrollY;
      header.classList.toggle('is-stuck', y > 8);
      header.classList.toggle('is-compact', y > 220);
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }
  var toggles = $$('.menu__toggle');
  var closePanels = function (except) {
    toggles.forEach(function (t) {
      if (t === except) return;
      t.setAttribute('aria-expanded', 'false');
      var p = doc.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = true;
    });
  };
  toggles.forEach(function (t) {
    var panel = doc.getElementById(t.getAttribute('aria-controls'));
    if (!panel) return;
    t.addEventListener('click', function () {
      var open = t.getAttribute('aria-expanded') === 'true';
      closePanels(t);
      t.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  });
  doc.addEventListener('click', function (e) { if (!e.target.closest('.menu__item--panel')) closePanels(); });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = toggles.filter(function (t) { return t.getAttribute('aria-expanded') === 'true'; })[0];
    if (open) { closePanels(); open.focus(); }
  });
  $$('.menu__item--panel').forEach(function (li) {
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) { var t = $('.menu__toggle', li); if (t && t.getAttribute('aria-expanded') === 'true') closePanels(); } });
  });
  var drawer = $('[data-drawer]');
  var opener = $('[data-drawer-open]');
  if (drawer && opener) {
    var lastFocus = null;
    var focusables = function () { return $$('a[href], button, summary, input', drawer).filter(function (el) { return el.offsetParent !== null; }); };
    var close = function () {
      drawer.hidden = true;
      opener.setAttribute('aria-expanded', 'false');
      doc.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    var open = function () {
      lastFocus = doc.activeElement;
      drawer.hidden = false;
      opener.setAttribute('aria-expanded', 'true');
      doc.body.style.overflow = 'hidden';
      var f = focusables();
      if (f.length) f[0].focus();
    };
    opener.setAttribute('role', 'button');
    opener.addEventListener('click', function (e) { e.preventDefault(); open(); });
    opener.addEventListener('keydown', function (e) { if (e.key === ' ') { e.preventDefault(); open(); } });
    $$('[data-drawer-close]', drawer).forEach(function (b) { b.addEventListener('click', close); });
    drawer.addEventListener('click', function (e) { if (e.target === drawer) close(); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    window.matchMedia('(min-width: 80em)').addEventListener('change', function (m) { if (m.matches && !drawer.hidden) close(); });
  }
  var chapters = $$('details.chapter');
  if (chapters.length) {
    var phone = window.matchMedia('(max-width: 47.99em)');
    var openFor = function (hash) {
      if (!hash || hash.length < 2) return;
      var t = doc.getElementById(decodeURIComponent(hash.slice(1)));
      var d = t && t.closest('details.chapter');
      if (d) d.open = true;
    };
    var apply = function () {
      chapters.forEach(function (d) { d.open = phone.matches ? !d.hasAttribute('data-fold') : true; });
      openFor(location.hash);
    };
    apply();
    phone.addEventListener('change', apply);
    window.addEventListener('hashchange', function () { openFor(location.hash); });
    doc.addEventListener('click', function (e) { var a = e.target.closest('a[href^="#"]'); if (a) openFor(a.getAttribute('href')); });
    chapters.forEach(function (d) {
      var s = $('summary', d);
      if (!s) return;
      s.addEventListener('click', function (e) { if (!phone.matches) e.preventDefault(); });
      var sync = function () { if (phone.matches) s.removeAttribute('tabindex'); else s.setAttribute('tabindex', '-1'); };
      sync(); phone.addEventListener('change', sync);
    });
  }
  var tocLinks = $$('.toc__list a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        tocLinks.forEach(function (a) { a.classList.remove('is-current'); });
        var a = byId[en.target.id];
        if (a) a.classList.add('is-current');
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    Object.keys(byId).forEach(function (id) { var el = doc.getElementById(id); if (el) seen.observe(el); });
  }
  var day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  $$('.hours tr[data-day="' + day + '"]').forEach(function (tr) { tr.classList.add('is-today'); });
  var todayBox = $('[data-today]');
  var todayRow = $('.hours tr[data-day="' + day + '"] td');
  if (todayBox && todayRow) {
    var slot = $('[data-today-hours]', todayBox);
    slot.textContent = todayRow.innerHTML.split(/<br\s*\/?>/i).map(function (x) { var d = doc.createElement('span'); d.innerHTML = x; return d.textContent.trim(); }).filter(Boolean).join(', ');
    todayBox.hidden = false;
  }
  $$('.review--long').forEach(function (li) {
    var text = $('.review__text', li);
    if (!text) return;
    var b = doc.createElement('button'), asked = false, t;
    b.type = 'button'; b.className = 'review__toggle'; b.textContent = 'Read more'; b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () { asked = true; var open = li.classList.toggle('is-open'); b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'Show less' : 'Read more'; });
    text.insertAdjacentElement('afterend', b);
    function fit() {
      if (asked) return;
      li.classList.remove('is-open');
      var fits = text.scrollHeight <= text.clientHeight + 4;
      li.classList.toggle('is-open', fits);
      b.style.display = fits ? 'none' : '';
    }
    fit();
    window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(fit, 150); });
  });
  $$('.video[data-video]').forEach(function (box) {
    var link = $('.video__link', box);
    if (!link) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var f = doc.createElement('iframe');
      f.setAttribute('referrerpolicy', 'strict-origin'); f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(box.getAttribute('data-video')) + '?autoplay=1&rel=0';
      f.title = ($('.video__label', box) || link).textContent.trim();
      f.allow = 'autoplay; encrypted-media; picture-in-picture';
      f.allowFullscreen = true;
      f.referrerPolicy = 'strict-origin';
      box.innerHTML = '';
      box.appendChild(f);
      f.focus();
    });
  });
  $$('.marquee__row').forEach(function (row) {
    if (reduce.matches) { row.parentNode.classList.add('is-static'); return; }
    $$('li', row).forEach(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); row.appendChild(c); });
    if (!('IntersectionObserver' in window)) return;
    var near = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; $$('img[loading="lazy"]', row).forEach(function (i) { i.loading = 'eager'; }); near.disconnect(); });
    }, { rootMargin: '900px 0px' });
    near.observe(row);
  });
  if (!reduce.matches && 'IntersectionObserver' in window) {
    var targets = $$('.band__head, .cards > .card, .posts > .post-card, .links > .link-card, .reviews > .review, .doctors > .doctor, .split__copy, .logos > .logo, .quick > li, .faq > .faq__item, .products__list > .product, .equipment > li, .visit__info, .rail-card, .toc, .rail > li, .brands > .brand-tile, .why > .why__item, .welcome__copy, .testimony__quote, .cta__copy, .cta__hours, .plans > .plan, .figures__list > li');
    var zooms = $$('.split__media, .welcome__frame, .visit__map, .strip__item, .cta__map, .film, .video');
    var lines = $$('.sweep');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        if (en.target.rvInner) Array.prototype.forEach.call(en.target.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]'), function (im) { im.loading = 'eager'; });
        (en.target.rvInner || en.target).classList.add('is-in'); io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    var vh = window.innerHeight;
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.9) return;
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--i', String(Math.min(i, 5)));
      el.classList.add('rv');
      io.observe(el);
    });
    zooms.forEach(function (el) { if (el.getBoundingClientRect().top < vh * 0.9) return; el.rvInner = el.firstElementChild || el; if (el.rvInner === el) return; el.rvInner.classList.add('rv-iris'); io.observe(el); });
    lines.forEach(function (el) { if (el.closest('.hero--front') || el.getBoundingClientRect().top < vh * 0.9) return; el.classList.add('rv-line'); io.observe(el); });
  }
  var loops = $$('.loop[data-loop]');
  if (loops.length) {
    var saver = navigator.connection && navigator.connection.saveData;
    var started = new WeakMap();
    var start = function (box) {
      if (started.has(box) || reduce.matches || saver) return;
      var v = doc.createElement('video');
      v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.setAttribute('tabindex', '-1');
      v.disablePictureInPicture = true; v.disableRemotePlayback = true;
      v.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
      var small = window.matchMedia('(max-width: 48em)').matches && box.getAttribute('data-loop-small');
      v.src = fromRoot(small || box.getAttribute('data-loop'));
      v.addEventListener('playing', function () { box.classList.add('is-playing'); });
      v.addEventListener('pause', function () { if (box.getAttribute('data-visible') === '1' && !reduce.matches) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
      box.appendChild(v);
      started.set(box, v);
      var p = v.play();
      if (p && p.catch) p.catch(function () { v.removeAttribute('src'); v.load(); box.classList.remove('is-playing'); });
    };
    var vis = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var box = en.target;
        box.setAttribute('data-visible', en.isIntersecting ? '1' : '0');
        if (en.isIntersecting) { start(box); var v = started.get(box); if (v && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else { var w = started.get(box); if (w && !w.paused) w.pause(); }
      });
    }, { rootMargin: '200px 0px' });
    loops.forEach(function (b) { vis.observe(b); });
    reduce.addEventListener('change', function () {
      loops.forEach(function (box) { var v = started.get(box); if (!v) return; if (reduce.matches) { v.pause(); box.classList.remove('is-playing'); } else { var p = v.play(); if (p && p.catch) p.catch(function () {}); } });
    });
  }
})();
(function () {
  'use strict';
  var forms = Array.prototype.slice.call(document.querySelectorAll('form[data-form]'));
  if (!forms.length) return;
  var CONTROLS = 'input, select, textarea, button';
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var NUMERIC = /^-?[0-9]{1,3}(?:,?[0-9]{3})*(?:\.[0-9]+)?$/;
  function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
  function cleanNumber(text) {
    text = String(text == null ? '' : text);
    var digits = '', negative = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text.charAt(i);
      if ((c >= '0' && c <= '9') || c === '.') digits += c;
      else if (c === '-') negative = true;
    }
    if (negative) digits = '-' + digits;
    return isNumber(digits) ? parseFloat(digits) : false;
  }
  function tryFloat(text) { return NUMERIC.test(text) ? cleanNumber(text) : text; }
  function compare(a, b, op) {
    a = String(a == null ? '' : a).toLowerCase();
    b = String(b == null ? '' : b).toLowerCase();
    if (op === 'is') return a === b;
    if (op === 'isnot') return a !== b;
    if (op === '>' || op === '<') {
      a = tryFloat(a); b = tryFloat(b);
      if (!isNumber(a) || !isNumber(b)) return false;
      return op === '>' ? a > b : a < b;
    }
    if (op === 'contains') return a.indexOf(b) >= 0;
    if (op === 'starts_with') return a.indexOf(b) === 0;
    if (op === 'ends_with') return b.length <= a.length && a.slice(a.length - b.length) === b;
    return false;
  }
  function named(form, name) {
    var out = [], i;
    if (!name) return out;
    for (i = 0; i < form.elements.length; i++) if (form.elements[i].name === name) out.push(form.elements[i]);
    return out;
  }
  function valueOf(el) { return !el || el.disabled || el.value == null ? '' : String(el.value); }
  function isMatch(form, r) {
    var els = named(form, r.field), first = els[0], i, el, v;
    if (first && (first.type === 'radio' || first.type === 'checkbox')) {
      var open = r.op === '<' || r.op === '>' || r.op === 'contains' || r.op === 'starts_with' || r.op === 'ends_with';
      for (i = 0; i < els.length; i++) {
        el = els[i]; v = el.value;
        if (v !== r.value && !open) continue;
        if (!el.checked || el.disabled) v = '';
        if (compare(v, r.value, r.op)) return true;
      }
      return false;
    }
    return compare(valueOf(first), r.value, r.op);
  }
  function actionOf(form, rule) {
    var met = 0;
    each(rule.rules || [], function (r) { if (isMatch(form, r)) met++; });
    var all = (rule.rules || []).length;
    var hit = (rule.match === 'all' && met === all) || (rule.match === 'any' && met > 0);
    return hit ? rule.action : (rule.action === 'show' ? 'hide' : 'show');
  }
  var parsed = new WeakMap();
  function ruleOf(el) {
    if (!parsed.has(el)) {
      var rule = null;
      try { rule = JSON.parse(el.getAttribute('data-rule')); } catch (e) { rule = null; }
      parsed.set(el, rule);
    }
    return parsed.get(el);
  }
  function setOff(el, off) {
    el.hidden = off;
    if (el.matches(CONTROLS)) el.disabled = off;
    each(el.querySelectorAll(CONTROLS), function (c) { c.disabled = off; });
  }
  function applyRules(form) {
    var targets = form.querySelectorAll('[data-rule]'), pass, changed;
    for (pass = 0; pass < 5; pass++) {
      changed = false;
      each(targets, function (t) {
        var rule = ruleOf(t);
        if (!rule) return;
        var off = actionOf(form, rule) === 'hide';
        if (t.hidden !== off || !t.hasAttribute('data-ruled')) { setOff(t, off); t.setAttribute('data-ruled', ''); changed = true; }
      });
      if (!changed) break;
    }
  }
  function reveal(el) {
    if (!el || !el.scrollIntoView) return;
    try { el.scrollIntoView({ block: 'nearest', behavior: 'instant' }); } catch (e) { el.scrollIntoView(false); }
  }
  function showNotice(form) {
    var status = form.querySelector('[data-form-status]'), tpl = form.querySelector('template[data-form-notice]');
    if (!status || !tpl) return;
    status.textContent = '';
    status.appendChild(tpl.content.cloneNode(true));
    reveal(status);
    if (!status.querySelector('a[href^="tel:"]')) {
      var tel = document.querySelector('a[href^="tel:"]');
      if (tel) {
        var a = document.createElement('a');
        a.setAttribute('href', tel.getAttribute('href'));
        a.textContent = tel.getAttribute('href').replace(/^tel:\s*/, '');
        status.appendChild(document.createTextNode(' '));
        status.appendChild(a);
      }
    }
  }
  function maskDigits(el) {
    var mask = el.getAttribute('data-mask') || '', phone = /[^9]/.test(mask);
    var digits = el.value.replace(/[^0-9]/g, ''), slots = (mask.match(/9/g) || []).length;
    if (phone && digits.length === slots + 1 && digits.charAt(0) === '1') digits = digits.slice(1);
    return digits.length === slots ? digits : '';
  }
  function shapeMasked(el) {
    var digits = maskDigits(el), k = 0;
    if (digits) el.value = el.getAttribute('data-mask').replace(/9/g, function () { return digits.charAt(k++); });
  }
  function dateParts(el) {
    var order = el.getAttribute('data-date') || 'mdy', v = el.value.trim(), m;
    if (/^[0-9]{8}$/.test(v)) v = order === 'ymd' ? v.slice(0, 4) + '/' + v.slice(4, 6) + '/' + v.slice(6) : v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
    m = (order === 'ymd' ? /^([0-9]{4})[\/.\- ]([0-9]{1,2})[\/.\- ]([0-9]{1,2})$/ : /^([0-9]{1,2})[\/.\- ]([0-9]{1,2})[\/.\- ]([0-9]{4})$/).exec(v);
    if (!m) return null;
    var y = Number(order === 'ymd' ? m[1] : m[3]), mo = Number(order === 'mdy' ? m[1] : m[2]), d = Number(order === 'mdy' ? m[2] : order === 'dmy' ? m[1] : m[3]);
    if (y < 1 || mo < 1 || mo > 12 || d < 1) return null;
    var leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (d > [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1]) return null;
    return { y: y, m: mo, d: d };
  }
  function two(n) { return n < 10 ? '0' + n : String(n); }
  function shapeDate(el) {
    var p = dateParts(el), order = el.getAttribute('data-date') || 'mdy';
    if (!p) return;
    el.value = order === 'ymd' ? p.y + '/' + two(p.m) + '/' + two(p.d) : order === 'dmy' ? two(p.d) + '/' + two(p.m) + '/' + p.y : two(p.m) + '/' + two(p.d) + '/' + p.y;
  }
  function strokeDate(el, ev) {
    if (ev && ev.inputType && ev.inputType.indexOf('delete') === 0) return;
    if (el.selectionStart !== el.value.length) return;
    var order = el.getAttribute('data-date') || 'mdy';
    if (order === 'ymd' ? /^(?:[0-9]{4}|[0-9]{4}\/[0-9]{2})$/.test(el.value) : /^(?:[0-9]{2}|[0-9]{2}\/[0-9]{2})$/.test(el.value)) el.value += '/';
  }
  function shapeProblem(el) {
    var v = String(el.value).trim();
    if (!v) return '';
    if (el.getAttribute('data-format') === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return el.getAttribute('data-msg') || '';
    if (el.hasAttribute('data-mask') && !maskDigits(el)) return el.getAttribute('data-msg') || '';
    if (el.hasAttribute('data-date') && !dateParts(el)) return el.getAttribute('data-msg') || '';
    if (el.hasAttribute('data-range')) {
      var n = Number(v), lo = el.getAttribute('min'), hi = el.getAttribute('max');
      if (!isFinite(n) || (lo !== null && lo !== '' && n < Number(lo)) || (hi !== null && hi !== '' && n > Number(hi))) return el.getAttribute('data-msg') || '';
    }
    return '';
  }
  function problems(form) {
    var out = [], seen = {}, required = form.getAttribute('data-msg-required') || '';
    each(form.querySelectorAll('input, select, textarea'), function (el) {
      var group, box, wrong;
      if (el.disabled || el.type === 'hidden') return;
      box = el.closest('[data-field]');
      if (!box) return;
      if (el.type === 'checkbox') {
        var set = el.closest('fieldset[data-field]');
        if (!set || !set.hasAttribute('data-required') || seen['box:' + el.name]) return;
        seen['box:' + el.name] = true;
        group = named(form, el.name).filter(function (c) { return !c.disabled; });
        if (!group.some(function (c) { return c.checked; })) out.push({ el: group[0], box: box, group: set, text: required, shape: false });
        return;
      }
      if (el.type === 'radio') {
        if (!el.required || seen[el.name]) return;
        seen[el.name] = true;
        group = named(form, el.name).filter(function (c) { return !c.disabled; });
        if (!group.some(function (c) { return c.checked; })) out.push({ el: group[0], box: box, group: el.closest('fieldset'), text: required, shape: false });
        return;
      }
      if (!String(el.value).trim()) { if (el.required) out.push({ el: el, box: box, group: null, text: required, shape: false }); return; }
      wrong = shapeProblem(el);
      if (wrong) out.push({ el: el, box: box, group: null, text: wrong, shape: true });
    });
    return out;
  }
  function describe(el, id, on) {
    if (!el) return;
    var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== id; });
    if (on) ids.push(id);
    if (ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
  }
  function clearBox(form, box) {
    var msg = box.querySelector('[data-form-error]');
    if (!msg) return;
    each(box.querySelectorAll('[aria-describedby]'), function (el) { describe(el, msg.id, false); });
    describe(box, msg.id, false);
    each(box.querySelectorAll('[aria-invalid]'), function (el) { el.removeAttribute('aria-invalid'); });
    box.classList.remove('is-invalid');
    var summary = form.querySelector('[data-form-summary]');
    var item = summary && summary.querySelector('[data-for-error="' + msg.id + '"]');
    if (item) item.parentNode.removeChild(item);
    msg.parentNode.removeChild(msg);
    if (summary && !summary.querySelector('li')) { summary.hidden = true; summary.textContent = ''; }
  }
  function lineOf(p) {
    var label = p.box.getAttribute('data-label') || '';
    return p.shape ? label + ': ' + p.text : label;
  }
  function showProblems(form, list) {
    each(form.querySelectorAll('.is-invalid'), function (box) { clearBox(form, box); });
    var summary = form.querySelector('[data-form-summary]');
    var alert = document.createElement('div'), title = document.createElement('p'), ul = document.createElement('ul');
    alert.setAttribute('role', 'alert');
    title.className = 'form__summary-title';
    title.textContent = form.getAttribute(list.some(function (p) { return p.shape; }) ? 'data-msg-check' : 'data-msg-summary') || '';
    list.forEach(function (p) {
      var id = p.el.id + '-error';
      var msg = document.createElement('p');
      msg.className = 'field__error';
      msg.id = id;
      msg.setAttribute('data-form-error', '');
      msg.textContent = p.text;
      p.box.appendChild(msg);
      p.box.classList.add('is-invalid');
      describe(p.el, id, true);
      if (p.group) describe(p.group, id, true); else p.el.setAttribute('aria-invalid', 'true');
      var li = document.createElement('li'), a = document.createElement('a');
      li.setAttribute('data-for-error', id);
      a.setAttribute('href', '#' + p.el.id);
      a.textContent = lineOf(p);
      li.appendChild(a);
      ul.appendChild(li);
    });
    alert.appendChild(title);
    alert.appendChild(ul);
    if (!summary) return;
    summary.textContent = '';
    summary.appendChild(alert);
    summary.hidden = false;
    summary.focus();
    reveal(summary);
  }
  function refresh(form) {
    if (!form.querySelector('.is-invalid')) return;
    var now = problems(form);
    each(form.querySelectorAll('.is-invalid'), function (box) {
      var p = now.filter(function (x) { return x.box === box; })[0], msg = box.querySelector('[data-form-error]');
      if (!p) { clearBox(form, box); return; }
      if (!msg || msg.textContent === p.text) return;
      msg.textContent = p.text;
      var link = form.querySelector('[data-form-summary] [data-for-error="' + msg.id + '"] a');
      if (link) link.textContent = lineOf(p);
    });
  }
  function init(form) {
    each(form.querySelectorAll('[data-form-wake]'), function (b) { b.disabled = false; b.removeAttribute('aria-describedby'); });
    each(form.querySelectorAll('[data-form-offline]'), function (p) { p.hidden = true; });
    applyRules(form);
    function changed(ev) {
      var el = ev.target;
      if (ev.type === 'input' && el && el.hasAttribute && el.hasAttribute('data-date')) strokeDate(el, ev);
      applyRules(form);
      refresh(form);
    }
    form.addEventListener('input', changed);
    form.addEventListener('change', changed);
    form.addEventListener('change', function (ev) {
      var el = ev.target;
      if (!el || !el.hasAttribute) return;
      if (el.hasAttribute('data-mask')) shapeMasked(el);
      if (el.hasAttribute('data-date')) shapeDate(el);
    });
    form.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('[data-form-summary] a') : null;
      if (!a) return;
      var target = document.getElementById((a.getAttribute('href') || '').slice(1));
      if (!target) return;
      ev.preventDefault();
      target.focus();
    });
    form.addEventListener('submit', function (ev) {
      applyRules(form);
      var button = form.querySelector('button[type=submit]');
      if (!button || button.hidden || button.disabled) { ev.preventDefault(); return; }
      each(form.querySelectorAll('[data-mask]'), function (el) { if (!el.disabled) shapeMasked(el); });
      each(form.querySelectorAll('[data-date]'), function (el) { if (!el.disabled) shapeDate(el); });
      var list = problems(form);
      if (list.length) { ev.preventDefault(); showProblems(form, list); return; }
      each(form.querySelectorAll('.is-invalid'), function (box) { clearBox(form, box); });
      if (form.hasAttribute('data-connected')) return;
      ev.preventDefault();
      showNotice(form);
    });
  }
  forms.forEach(init);
  window.addEventListener('pageshow', function (ev) { if (ev.persisted) forms.forEach(applyRules); });
})();
(function () {
  'use strict';
  var region = document.querySelector('[data-search-results]');
  if (!region) return;
  var statusEl = region.querySelector('[data-search-status]');
  var listEl = region.querySelector('[data-search-list]');
  if (!statusEl || !listEl) return;
  var helpEl = region.querySelector('[data-search-help]');
  var moreEl = region.querySelector('[data-search-more]');
  var form = document.querySelector('[data-search-form]');
  var field = form ? form.querySelector('input[name="q"]') : null;
  var PAGE = 30;
  var MAX_QUERY = 120;
  var MAX_WORDS = 10;
  var TITLE = 4, NAME = 3, HEAD = 2, BODY = 1;
  var chr = String.fromCharCode;
  var APOS_CHARS = chr(0x27) + chr(0x60) + chr(0xb4) + chr(0x2bc) + chr(0x2018) + chr(0x2019) + chr(0x201b) + chr(0x2032);
  var APOS = new RegExp('[' + APOS_CHARS + ']', 'g');
  var MARKS = new RegExp('[' + chr(0x300) + '-' + chr(0x36f) + ']', 'g');
  var NONWORD, CHUNK;
  try {
    NONWORD = new RegExp('[^\\p{L}\\p{N}]+', 'gu');
    CHUNK = new RegExp('[\\p{L}\\p{N}' + APOS_CHARS + ']+', 'gu');
  } catch (e) {
    NONWORD = /[^a-z0-9]+/g;
    CHUNK = new RegExp('[A-Za-z0-9' + APOS_CHARS + ']+', 'g');
  }
  function fold(s) {
    s = String(s == null ? '' : s);
    if (s.normalize) s = s.normalize('NFD');
    s = s.toLowerCase();
    s = s.replace(APOS, '');
    s = s.replace(MARKS, '');
    return s.replace(NONWORD, ' ').replace(/ +/g, ' ').replace(/^ | $/g, '');
  }
  function singular(w) {
    var n = w.length;
    if (n < 4 || w.charAt(n - 1) !== 's') return w;
    if (/(ss|us|is)$/.test(w)) return w;
    if (/ies$/.test(w) && n > 4) return w.slice(0, n - 3) + 'y';
    if (/(ses|xes|zes|ches|shes)$/.test(w)) return w.slice(0, n - 2);
    return w.slice(0, n - 1);
  }
  function singularAll(s) { return s.split(' ').map(singular).join(' '); }
  function plural(w) { return w.length >= 4 && /[^aeiou]y$/.test(w) ? w.slice(0, w.length - 1) + 'ies' : ''; }
  var entries = null;
  var loading = null;
  var siteBase = (function () {
    var m = /^(.*\/)search(?:\/(?:index\.html)?)?$/.exec(location.pathname);
    return m ? m[1] : '/';
  })();
  function withBase(path) {
    path = String(path || '');
    if (path.charAt(0) !== '/' || siteBase === '/' || path.indexOf(siteBase) === 0) return path;
    return siteBase + path.slice(1);
  }
  function prepare(list) {
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e || typeof e.u !== 'string' || typeof e.t !== 'string') continue;
      var names = [], heads = [], j;
      var k = e.k instanceof Array ? e.k : [], h = e.h instanceof Array ? e.h : [];
      for (j = 0; j < k.length; j++) names.push(fold(k[j]));
      for (j = 0; j < h.length; j++) heads.push(fold(h[j]));
      var t = fold(e.t);
      var own = names.slice(0, e.o > 0 ? e.o : 0);
      out.push({
        e: e, t: t, names: names, heads: heads, own: own,
        T: ' ' + t + ' ',
        K: ' ' + names.join(' | ') + ' ',
        O: ' ' + own.join(' | ') + ' ',
        H: ' ' + heads.join(' | ') + ' ',
        X: ' ' + fold(e.x) + ' | ' + fold(e.d) + ' ',
        tSing: singularAll(t), ownSing: own.map(singularAll),
        depth: e.u.split('/').length - 2,
        n: e.n === 2 ? 2 : e.n ? 1 : 0
      });
    }
    return out;
  }
  function load() {
    if (entries) return Promise.resolve(entries);
    if (loading) return loading;
    var url = withBase(region.getAttribute('data-index') || '');
    if (!url || typeof fetch !== 'function') return Promise.reject(new Error('no index'));
    loading = fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('index: HTTP ' + r.status);
      return r.json();
    }).then(function (list) {
      if (!(list instanceof Array)) throw new Error('index: not a list');
      entries = prepare(list);
      return entries;
    });
    loading.catch(function () { loading = null; });
    return loading;
  }
  function starts(F, w) { return F.indexOf(' ' + w) !== -1; }
  function whole(F, w) { return F.indexOf(' ' + w + ' ') !== -1; }
  function joined(str, w) {
    if (str.indexOf(' ') === -1) return false;
    var words = str.split(' ');
    for (var i = 0; i < words.length - 1; i++) {
      if (words[i] === '|' || words[i].length >= w.length || w.indexOf(words[i]) !== 0) continue;
      var acc = words[i], j = i + 1;
      while (j < words.length && words[j] !== '|' && acc.length < w.length) acc += words[j++];
      if (acc.indexOf(w) === 0) return true;
    }
    return false;
  }
  function closes(F, w) { return w.length >= 4 && F.indexOf(w + ' ') !== -1; }
  function findWord(p, w) {
    var best = { tier: 0, how: 0, whole: false };
    function take(tier, how, isWhole) {
      if (tier > best.tier || (tier === best.tier && how > best.how)) { best.tier = tier; best.how = how; best.whole = !!isWhole; }
    }
    function direct(word, how) {
      if (starts(p.T, word)) take(TITLE, how, whole(p.T, word));
      else if (starts(p.K, word)) take(NAME, starts(p.O, word) ? how : how - 0.5, whole(p.K, word));
      else if (starts(p.H, word)) take(HEAD, how, whole(p.H, word));
      else if (starts(p.X, word)) take(BODY, how, whole(p.X, word));
    }
    if (w.length < 3) {
      if (whole(p.T, w)) take(TITLE, 0, true);
      else if (whole(p.K, w)) take(NAME, 0, true);
      else if (whole(p.H, w)) take(HEAD, 0, true);
      else if (whole(p.X, w)) take(BODY, 0, true);
      return best;
    }
    direct(w, 0);
    if (best.tier === TITLE) return best;
    var typed = best.tier > 0;
    var s = singular(w);
    if (s !== w) direct(s, typed ? 0 : -1);
    else if (plural(w)) direct(plural(w), typed ? 0 : -1);
    if (best.tier >= NAME) return best;
    if (joined(p.t, w)) take(TITLE, -2);
    else if (joined(p.K.slice(1, -1), w)) take(NAME, -2);
    else if (joined(p.H.slice(1, -1), w)) take(HEAD, -2);
    if (closes(p.T, w) || (s !== w && closes(p.T, s))) take(NAME, -3);
    else if (closes(p.K, w) || (s !== w && closes(p.K, s))) take(HEAD, -3);
    return best;
  }
  function count(F, w, cap) {
    var n = 0, i = -1, needle = ' ' + w;
    while (n < cap && (i = F.indexOf(needle, i + 1)) !== -1) n++;
    return n;
  }
  function parse(raw) {
    var f = fold(String(raw == null ? '' : raw).slice(0, MAX_QUERY));
    var all = f ? f.split(' ').slice(0, MAX_WORDS) : [];
    var words = [], seen = {};
    for (var i = 0; i < all.length; i++) {
      if (all[i].length < 2 || seen['$' + all[i]]) continue;
      seen['$' + all[i]] = 1;
      words.push({ w: all[i], i: i });
    }
    return { folded: f, all: all, words: words, phrase: words.map(function (x) { return x.w; }).join(' ') };
  }
  function search(raw) {
    var q = parse(raw);
    if (!q.words.length || !entries) return { q: q, results: [] };
    var asked = q.phrase;
    var typedSing = singularAll(q.folded), askedSing = singularAll(asked), results = [];
    for (var n = 0; n < entries.length; n++) {
      var p = entries[n], tier = 0, fine = 0, how = 0, byName = true, ok = true, inTitle = 0;
      for (var i = 0; i < q.words.length; i++) {
        var w = q.words[i].w, at = q.words[i].i;
        var m = findWord(p, w);
        if (!m.tier) {
          var pair = at + 1 < q.all.length ? w + q.all[at + 1] : '', before = at > 0 ? q.all[at - 1] + w : '';
          var m2 = pair ? findWord(p, pair) : null;
          if (!m2 || !m2.tier || m2.how < -1) m2 = before ? findWord(p, before) : null;
          if (m2 && m2.tier && m2.how >= -1) m = { tier: m2.tier, how: -2, whole: false };
        }
        if (!m.tier) { ok = false; break; }
        tier += m.tier;
        if (m.tier < NAME) byName = false;
        if (m.tier === TITLE) inTitle += w.length;
        how += m.how;
        fine += (m.whole ? 2 : 0) + Math.min(4, count(p.X, w, 4));
      }
      if (!ok) continue;
      if (q.words.length > 1) {
        var ph = ' ' + q.phrase;
        var where = p.T.indexOf(ph) !== -1 ? 30 : p.K.indexOf(ph) !== -1 ? 24 : p.H.indexOf(ph) !== -1 ? 12 : p.X.indexOf(ph) !== -1 ? 6 : 0;
        if (where >= 12) tier += 4 * (q.words.length - 1);
        fine += where;
      }
      if (inTitle) fine += Math.round(20 * Math.min(1, inTitle / Math.max(1, p.t.replace(/ /g, '').length)));
      if (p.T.indexOf(' ' + q.words[0].w) === 0) fine += 4;
      fine -= p.depth;
      var exact = 0;
      if (p.n < 2) {
        if (named(p.t, p.own, q.folded, asked)) exact = 2;
        else if (named(p.tSing, p.ownSing, typedSing, askedSing)) exact = 1;
      }
      results.push({ p: p, e: p.e, exact: exact, tier: tier, how: how, fine: fine, byName: byName, n: p.n });
    }
    results.sort(byRank);
    return { q: q, results: liftHubs(results) };
  }
  function named(title, own, typed, asked) {
    return title === typed || title === asked || own.indexOf(typed) !== -1 || own.indexOf(asked) !== -1;
  }
  function byRank(a, b) {
    return (b.exact - a.exact) || ((a.n === 2) - (b.n === 2)) || (b.tier - a.tier) || (a.n - b.n) || (b.how - a.how) || (b.fine - a.fine)
      || (a.e.t.length - b.e.t.length) || (a.e.u < b.e.u ? -1 : a.e.u > b.e.u ? 1 : 0);
  }
  function liftHubs(sorted) {
    var out = [], placed = {};
    function isHubOf(a, r) {
      return a !== r && a.byName && r.byName && a.e.u !== '/' && a.e.u.length < r.e.u.length && r.e.u.indexOf(a.e.u) === 0
        && a.exact >= r.exact && a.n <= r.n;
    }
    for (var i = 0; i < sorted.length; i++) {
      var r = sorted[i];
      if (placed[r.e.u]) continue;
      if (r.byName) {
        var hubs = [];
        for (var j = i + 1; j < sorted.length; j++) if (!placed[sorted[j].e.u] && isHubOf(sorted[j], r)) hubs.push(sorted[j]);
        hubs.sort(function (a, b) { return a.e.u.length - b.e.u.length; });
        for (var h = 0; h < hubs.length; h++) { placed[hubs[h].e.u] = 1; out.push(hubs[h]); }
      }
      placed[r.e.u] = 1;
      out.push(r);
    }
    return out;
  }
  function spelled(chunks, i, q) {
    var first = fold(chunks[i].text);
    if (!first) return 0;
    for (var n = 0; n < q.words.length; n++) {
      var w = q.words[n].w;
      if (w.length < 4 || first.length >= w.length || w.indexOf(first) !== 0) continue;
      var acc = first;
      for (var j = i + 1; j < chunks.length && j <= i + 3; j++) {
        if (chunks[j].at - (chunks[j - 1].at + chunks[j - 1].text.length) > 1) break;
        var next = fold(chunks[j].text);
        if (!next) break;
        acc += next;
        if (acc.indexOf(w) === 0) return j - i + 1;
        if (w.indexOf(acc) !== 0) break;
      }
    }
    return 0;
  }
  function matches(text, q) {
    var chunks = [], out = [], m;
    CHUNK.lastIndex = 0;
    while ((m = CHUNK.exec(text))) {
      if (!m[0]) { CHUNK.lastIndex++; continue; }
      chunks.push({ text: m[0], at: m.index });
    }
    for (var i = 0; i < chunks.length; i++) {
      if (hit(chunks[i].text, q)) { out.push({ from: chunks[i].at, to: chunks[i].at + chunks[i].text.length }); continue; }
      var n = spelled(chunks, i, q);
      if (n) { var last = chunks[i + n - 1]; out.push({ from: chunks[i].at, to: last.at + last.text.length }); i += n - 1; }
    }
    return out;
  }
  function hit(chunk, q) {
    var f = fold(chunk);
    if (!f) return false;
    for (var i = 0; i < q.words.length; i++) {
      var w = q.words[i].w, s = singular(w), pl = plural(w);
      if (w.length < 3) { if (f === w) return true; continue; }
      if (f.indexOf(w) === 0 || f.indexOf(s) === 0 || (pl && f.indexOf(pl) === 0)) return true;
      if (w.length >= 4 && f.length > w.length && f.lastIndexOf(w) === f.length - w.length) return true;
    }
    return false;
  }
  function mark(parent, text, q) {
    text = String(text == null ? '' : text);
    var found = matches(text, q), last = 0;
    for (var i = 0; i < found.length; i++) {
      if (found[i].from > last) parent.appendChild(document.createTextNode(text.slice(last, found[i].from)));
      var el = document.createElement('mark');
      el.textContent = text.slice(found[i].from, found[i].to);
      parent.appendChild(el);
      last = found[i].to;
    }
    if (last < text.length) parent.appendChild(document.createTextNode(text.slice(last)));
    return found.length;
  }
  function excerpt(text, q) {
    text = String(text == null ? '' : text);
    var found = matches(text, q);
    if (!found.length) return '';
    var at = found[0].from, from = Math.max(0, at - 70), to = Math.min(text.length, at + 150);
    if (from > 0) { var sp = text.indexOf(' ', from); from = sp !== -1 && sp < at ? sp + 1 : from; }
    if (to < text.length) { var ep = text.lastIndexOf(' ', to); to = ep > at ? ep : to; }
    return (from > 0 ? '… ' : '') + text.slice(from, to) + (to < text.length ? ' …' : '');
  }
  function has(text, q) { return matches(String(text == null ? '' : text), q).length > 0; }
  function item(r, q) {
    var e = r.e;
    var li = document.createElement('li');
    li.className = 'search-result';
    if (e.s) {
      var sec = document.createElement('p');
      sec.className = 'search-result__section';
      sec.textContent = e.s;
      li.appendChild(sec);
    }
    var h = document.createElement('h2');
    h.className = 'search-result__title';
    var a = document.createElement('a');
    a.className = 'search-result__link';
    a.setAttribute('href', withBase(e.u));
    mark(a, e.t, q);
    h.appendChild(a);
    li.appendChild(h);
    var line = e.d || '';
    if (!has(line, q)) line = excerpt(e.x, q) || line;
    if (line) {
      var sum = document.createElement('p');
      sum.className = 'search-result__summary';
      mark(sum, line, q);
      li.appendChild(sum);
    }
    return li;
  }
  var shown = { q: null, results: [], drawn: 0 };
  function drawMore(focus) {
    var from = shown.drawn, to = Math.min(shown.results.length, from + PAGE), first = null;
    for (var i = from; i < to; i++) {
      var li = item(shown.results[i], shown.q);
      if (!first) first = li.querySelector('a');
      listEl.appendChild(li);
    }
    shown.drawn = to;
    if (moreEl) moreEl.hidden = shown.drawn >= shown.results.length;
    if (focus && first) first.focus();
  }
  function msg(name) { return region.getAttribute('data-msg-' + name) || ''; }
  function say(text) { if (statusEl.textContent !== text) statusEl.textContent = text; }
  function show(state, raw, found) {
    var label = String(raw == null ? '' : raw).replace(/\s+/g, ' ').replace(/^ | $/g, '');
    if (label.length > 80) label = label.slice(0, 80) + '…';
    var results = (found && found.results) || [];
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
    shown = { q: found ? found.q : null, results: results, drawn: 0 };
    if (state === 'results') {
      say(msg(results.length === 1 ? 'one' : 'many').replace('{n}', String(results.length)).replace('{q}', function () { return label; }));
      listEl.hidden = false;
      drawMore(false);
    } else {
      listEl.hidden = true;
      if (moreEl) moreEl.hidden = true;
      say(state === 'none' ? msg('none').replace('{q}', function () { return label; }) : msg(state === 'error' ? 'failed' : state));
    }
    if (helpEl) helpEl.hidden = !(state === 'empty' || state === 'none' || state === 'error');
    region.setAttribute('data-state', state);
    region.setAttribute('data-query', label);
    region.setAttribute('data-count', String(results.length));
  }
  var current = null;
  function readQuery() {
    try {
      var sp = new URLSearchParams(location.search);
      return sp.get('q') || sp.get('s') || '';
    } catch (e) { return ''; }
  }
  function writeQuery(raw) {
    try {
      var url = location.pathname + (raw ? '?q=' + encodeURIComponent(raw).replace(/%20/g, '+') : '') + location.hash;
      if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', url);
    } catch (e) {   }
  }
  function run(raw, opts) {
    raw = String(raw == null ? '' : raw).slice(0, MAX_QUERY);
    var trimmed = raw.replace(/\s+/g, ' ').replace(/^ | $/g, '');
    current = trimmed;
    if (!opts || opts.write !== false) writeQuery(trimmed);
    if (!trimmed) { show('empty', ''); return; }
    if (!entries) {
      show('loading', trimmed);
      load().then(function () { if (current === trimmed) run(trimmed, { write: false }); }, function () { if (current === trimmed) show('error', trimmed); });
      return;
    }
    var found;
    try { found = search(trimmed); } catch (e) { show('error', trimmed); return; }
    show(found.results.length ? 'results' : 'none', trimmed, found);
  }
  var timer = null;
  if (form && field) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearTimeout(timer);
      run(field.value);
    });
    field.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { run(field.value); }, 220);
    });
    field.addEventListener('focus', function () { load().catch(function () {}); }, { once: true });
  }
  if (moreEl) moreEl.addEventListener('click', function (ev) { if (ev.target && ev.target.closest && ev.target.closest('button')) drawMore(true); });
  window.addEventListener('popstate', function () {
    var q = readQuery();
    if (field) field.value = q;
    run(q, { write: false });
  });
  var first = readQuery().slice(0, MAX_QUERY);
  if (field && first) field.value = first;
  run(first, { write: false });
})();
