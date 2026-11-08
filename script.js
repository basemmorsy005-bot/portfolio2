(function () {
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var root = document.documentElement, app = document.getElementById('app');
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function save(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById('themeBtn');
  var T = { ar: { toLight: 'الوضع الفاتح', toDark: 'الوضع الليلي' }, en: { toLight: 'Light mode', toDark: 'Dark mode' } };
  var lang = 'ar';
  function curTheme() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
  function paintTheme() { themeBtn.setAttribute('aria-label', curTheme() === 'dark' ? T[lang].toLight : T[lang].toDark); }
  var savedTheme = load('bm-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);
  themeBtn.addEventListener('click', function () {
    var n = curTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', n); save('bm-theme', n); paintTheme();
  });

  /* ---------- language ---------- */
  var langBtn = document.getElementById('langBtn'), langTxt = document.getElementById('langTxt');
  var tr = [].slice.call(document.querySelectorAll('[data-en]'));
  tr.forEach(function (e) { e.setAttribute('data-ar', e.innerHTML); });
  var copyLbl = { ar: 'اتنسخ', en: 'Copied' };
  function setLang(l, silent) {
    lang = l;
    app.setAttribute('dir', l === 'en' ? 'ltr' : 'rtl'); app.setAttribute('lang', l); root.setAttribute('lang', l);
    tr.forEach(function (e) { e.innerHTML = e.getAttribute(l === 'en' ? 'data-en' : 'data-ar'); });
    [].slice.call(document.querySelectorAll('[data-ph-en]')).forEach(function (e) { e.setAttribute('placeholder', e.getAttribute(l === 'en' ? 'data-ph-en' : 'data-ph-ar')); });
    langTxt.textContent = l === 'en' ? 'ع' : 'EN';
    langBtn.setAttribute('aria-label', l === 'en' ? 'العربية' : 'English');
    paintTheme();
    if (!silent) save('bm-lang', l);
    requestAnimationFrame(function () {
      [].slice.call(document.querySelectorAll('.track')).forEach(function (t) { if (t._go) t._go(0, true); });
      window.dispatchEvent(new Event('resize'));
    });
  }
  langBtn.addEventListener('click', function () { setLang(lang === 'ar' ? 'en' : 'ar'); });

  /* ---------- nav: highlight the section in view ---------- */
  var nav = document.getElementById('nav');
  var links = [].slice.call(nav.querySelectorAll('a'));
  var secs = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function setActive(id) {
    root.setAttribute('data-sec', id);
    links.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', on);
      if (on) {
        var nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
        var d = (ar.left + ar.width / 2) - (nr.left + nr.width / 2);
        try { nav.scrollBy({ left: d, behavior: reduce ? 'auto' : 'smooth' }); } catch (e) { nav.scrollLeft += d; }
      }
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) setActive(x.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(function (s) { if (s) io.observe(s); });
  }

  /* ---------- hero: cycling word ---------- */
  var words = [].slice.call(document.querySelectorAll('.swap b'));
  if (words.length > 1 && !reduce) {
    var wi = 0;
    setInterval(function () {
      var prev = words[wi];
      wi = (wi + 1) % words.length;
      words.forEach(function (w) { if (w !== prev) w.className = ''; });
      prev.className = 'past';
      words[wi].className = 'on';
    }, 2400);
  }

  /* ---------- hero: head tilt, and eyes that follow the pointer ---------- */
  (function () {
    var head = document.getElementById('avatar');
    var iL = document.getElementById('irisL'), iR = document.getElementById('irisR');
    if (!head || reduce) return;
    var tx = 0, ty = 0, cx = 0, cy = 0, etx = 0, ety = 0, ex = 0, ey = 0, last = -1e9, vis = true;
    function clamp(v) { return Math.max(-1, Math.min(1, v)); }
    function aim(e) {
      last = performance.now();
      tx = clamp((e.clientX / window.innerWidth - 0.5) * 2);
      ty = clamp((e.clientY / window.innerHeight - 0.5) * 2);
      var r = head.getBoundingClientRect(), hx = r.left + r.width / 2, hy = r.top + r.height * 0.42;
      etx = clamp((e.clientX - hx) / Math.max(window.innerWidth * 0.42, 240));
      ety = clamp((e.clientY - hy) / Math.max(window.innerHeight * 0.34, 240));
    }
    window.addEventListener('pointermove', aim, { passive: true });
    window.addEventListener('pointerdown', aim, { passive: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; }).observe(head);
    (function tick(now) {
      requestAnimationFrame(tick);
      if (!vis || document.hidden) return;
      if (now - last > 2500) {
        tx = Math.sin(now / 1700) * 0.55; ty = Math.sin(now / 2400) * 0.25;
        etx = Math.sin(now / 1300) * 0.8; ety = Math.sin(now / 1900) * 0.3;
      }
      cx += (tx - cx) * 0.07; cy += (ty - cy) * 0.07;
      ex += (etx - ex) * 0.16; ey += (ety - ey) * 0.16;
      head.style.transform = 'rotateY(' + (cx * 15).toFixed(2) + 'deg) rotateX(' + (-cy * 11).toFixed(2) + 'deg)';
      var t = 'translate(' + (ex * 17).toFixed(2) + '%,' + (ey * 5.5).toFixed(2) + '%)';
      if (iL) iL.style.transform = t;
      if (iR) iR.style.transform = t;
    })(performance.now());
  })();

  /* ---------- carousels: coverflow tilt, arrows, progress ---------- */
  function carousel(rootEl) {
    var track = rootEl.querySelector('.track');
    var slides = [].slice.call(track.children);
    var n = slides.length, cur = 0, raf = 0;
    var ind = rootEl.querySelector('.ind'), mode = rootEl.getAttribute('data-ind');
    var strength = parseFloat(rootEl.getAttribute('data-tilt') || '18');
    var thumb = null, dots = [];
    function go(i, instant) {
      i = Math.max(0, Math.min(n - 1, i));
      var tr0 = track.getBoundingClientRect(), sr = slides[i].getBoundingClientRect();
      var delta = (sr.left + sr.width / 2) - (tr0.left + tr0.width / 2);
      try { track.scrollTo({ left: track.scrollLeft + delta, behavior: (reduce || instant) ? 'auto' : 'smooth' }); } catch (e) { track.scrollLeft += delta; }
    }
    track._go = go;
    if (mode === 'bar') {
      ind.innerHTML = '<i></i>'; thumb = ind.firstChild; thumb.style.width = (100 / n) + '%';
    } else {
      slides.forEach(function (_, i) {
        var d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', String(i + 1));
        d.addEventListener('click', function () { go(i); }); ind.appendChild(d); dots.push(d);
      });
    }
    function update() {
      raf = 0;
      var tr1 = track.getBoundingClientRect(), c = tr1.left + tr1.width / 2, best = 1e9, bi = 0;
      slides.forEach(function (s, i) {
        var b = s.getBoundingClientRect();
        var off = ((b.left + b.width / 2) - c) / b.width, a = Math.min(Math.abs(off), 1.4);
        var inner = s.firstElementChild;
        inner.style.transform = 'perspective(900px) rotateY(' + (-off * strength).toFixed(2) + 'deg) scale(' + (1 - a * 0.09).toFixed(3) + ')';
        inner.style.opacity = (1 - a * 0.3).toFixed(2);
        if (Math.abs(off) < best) { best = Math.abs(off); bi = i; }
      });
      cur = bi;
      if (thumb) thumb.style.insetInlineStart = (cur * 100 / n) + '%';
      dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); });
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(update); }
    track.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    rootEl.querySelector('[data-prev]').addEventListener('click', function () { go(cur - 1); });
    rootEl.querySelector('[data-next]').addEventListener('click', function () { go(cur + 1); });
    track.addEventListener('keydown', function (e) {
      var rtl = app.getAttribute('dir') === 'rtl';
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(rtl ? cur + 1 : cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(rtl ? cur - 1 : cur + 1); }
    });
    slides.forEach(function (s, i) { s.addEventListener('click', function () { if (i !== cur) go(i); }); });
    update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
    window.addEventListener('load', schedule);
  }
  [].slice.call(document.querySelectorAll('.car')).forEach(carousel);

  /* ---------- about: id card tilt ---------- */
  (function () {
    var card = document.getElementById('idcard');
    if (!card || reduce) return;
    var canHover = false;
    try { canHover = window.matchMedia('(hover: hover)').matches; } catch (e) {}
    if (!canHover) return;
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(800px) rotateY(' + (x * 16).toFixed(2) + 'deg) rotateX(' + (-y * 16).toFixed(2) + 'deg)';
      card.style.setProperty('--gx', ((x + 0.5) * 100) + '%'); card.style.setProperty('--gy', ((y + 0.5) * 100) + '%');
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  })();

  /* ---------- stats: count up once in view ---------- */
  var nums = [].slice.call(document.querySelectorAll('[data-n]'));
  function count(el) {
    var end = parseFloat(el.getAttribute('data-n')), suf = el.getAttribute('data-s') || '', t0 = null, dur = 1300;
    function f(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(f);
    }
    el.textContent = '0' + suf; requestAnimationFrame(f);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (en, o) {
      en.forEach(function (x) { if (x.isIntersecting) { count(x.target); o.unobserve(x.target); } });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { sio.observe(n); });
  }

  /* ---------- copy buttons ---------- */
  [].slice.call(document.querySelectorAll('.copy')).forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-v'), label = b.querySelector('small'), old = label.innerHTML;
      function ok() { b.classList.add('done'); label.textContent = copyLbl[lang]; setTimeout(function () { b.classList.remove('done'); label.innerHTML = label.getAttribute(lang === 'en' ? 'data-en' : 'data-ar'); }, 1600); }
      function fallback() {
        try { var r = document.createRange(); r.selectNodeContents(b.querySelector('span')); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
      }
      try { navigator.clipboard.writeText(v).then(ok, fallback); } catch (e) { fallback(); }
    });
  });

  /* ---------- start ---------- */
  paintTheme();
  if (load('bm-lang') === 'en') setLang('en', true);
  /* ---------- stagger floating tiles ---------- */
  [].slice.call(document.querySelectorAll('.tiles')).forEach(function (g, gi) {
    [].slice.call(g.children).forEach(function (t, i) { t.style.setProperty('--k', String(i + gi * 2)); });
  });

  /* ---------- CV viewer ---------- */
  (function () {
    var m = document.getElementById('cvModal'), o = document.getElementById('cvOpen'), c = document.getElementById('cvClose');
    if (!m || !o) return;
    function open() { m.hidden = false; root.style.overflow = 'hidden'; document.getElementById('cvScroll').scrollTop = 0; c.focus(); }
    function close() { m.hidden = true; root.style.overflow = ''; o.focus(); }
    o.addEventListener('click', open); c.addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) close(); });
  })();

  /* ---------- background follows scroll ---------- */
  (function () {
    var bg = document.querySelector('.bgfx');
    if (!bg || reduce) return;
    var cur = 0, tgt = 0, run = false;
    function read() { var h = document.documentElement.scrollHeight - window.innerHeight; tgt = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0; if (!run) { run = true; requestAnimationFrame(step); } }
    function step() { cur += (tgt - cur) * 0.1; bg.style.setProperty('--sp', cur.toFixed(4)); if (Math.abs(tgt - cur) > 0.0005) requestAnimationFrame(step); else run = false; }
    window.addEventListener('scroll', read, { passive: true }); window.addEventListener('resize', read); read();
  })();

  /* ---------- scroll progress fallback ---------- */
  (function () {
    var bar = document.querySelector('.progress');
    var ok = false;
    try { ok = window.CSS && CSS.supports('animation-timeline: scroll()'); } catch (e) {}
    if (!bar || ok) return;
    function upd() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
    }
    window.addEventListener('scroll', upd, { passive: true }); upd();
  })();

  /* ---------- quick message form ---------- */
  (function () {
    var form = document.getElementById('qform');
    if (!form) return;
    /* Web3Forms access keys, one per inbox. Each key is created for one email address on web3forms.com.
       Put the key for basemmorsy005@gmail.com first and the key for marsebasem@gmail.com second; the message is sent to every key listed. */
    var FORM_KEYS = ['d29acdfa-5913-43c2-aaa1-f63d27f64dae', '6ab75a38-7296-4a4c-be5a-b5ca81b69cf8'];
    var WA = '201091549086';
    var btn = document.getElementById('fsend'), msgEl = document.getElementById('fmsg');
    var fb = document.getElementById('ffall'), wa = document.getElementById('fwa'), cp = document.getElementById('fcopy');
    var M = {
      ar: { need: 'اكتب اسمك ورسالتك، ومعاهم إيميل أو رقم موبايل.', sending: 'جاري الإرسال…', ok: 'وصلتني رسالتك، هرد عليك في أقرب وقت.', fail: 'الإرسال المباشر مش مفعّل هنا. اضغط واتساب وهتوصلني رسالتك جاهزة.', copied: 'اتنسخت', hello: 'أهلاً باسم، أنا ', mail: 'الإيميل: ', tel: 'الموبايل: ' },
      en: { need: 'Add your name, your message, and an email or phone number.', sending: 'Sending…', ok: 'Got your message. I will reply soon.', fail: 'Direct sending is not enabled here. Tap WhatsApp and your message goes over ready to send.', copied: 'Copied', hello: 'Hi Basem, I am ', mail: 'Email: ', tel: 'Phone: ' }
    };
    function say(key, cls) { msgEl.textContent = M[lang][key]; msgEl.className = 'fmsg ' + (cls || ''); }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements;
      var v = { name: f['name'].value.trim(), email: f['email'].value.trim(), phone: f['phone'].value.trim(), message: f['message'].value.trim() };
      if (f['botcheck'].checked) return;
      if (!v.name || !v.message || (!v.email && !v.phone)) { say('need', 'err'); fb.hidden = true; return; }
      var text = M[lang].hello + v.name + '\n' + v.message + (v.email ? '\n' + M[lang].mail + v.email : '') + (v.phone ? '\n' + M[lang].tel + v.phone : '');
      wa.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
      cp.onclick = function () {
        var lab = cp.innerHTML;
        function done() { cp.textContent = M[lang].copied; setTimeout(function () { cp.innerHTML = cp.getAttribute(lang === 'en' ? 'data-en' : 'data-ar'); }, 1500); }
        try { navigator.clipboard.writeText(text).then(done, function () {}); } catch (x) {}
      };
      fb.hidden = true;
      if (!FORM_KEYS.length) { say('fail', 'err'); fb.hidden = false; return; }
      btn.disabled = true; say('sending');
      Promise.all(FORM_KEYS.map(function (k) {
        return fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ access_key: k, subject: 'New message from your portfolio', from_name: v.name, name: v.name, email: v.email, phone: v.phone, message: v.message })
        }).then(function (r) { return r.json(); }).then(function (j) { return !!(j && j.success); }).catch(function () { return false; });
      })).then(function (res) {
        btn.disabled = false;
        if (res.some(Boolean)) { say('ok', 'ok'); form.reset(); } else { say('fail', 'err'); fb.hidden = false; }
      });
    });
  })();

  /* ---------- intro ---------- */
  (function () {
    var sp = document.getElementById('splash');
    if (!sp) return;
    var code = document.getElementById('spCode'), bar = document.getElementById('spBar'), pct = document.getElementById('spPct'), msg = document.getElementById('spMsg');
    var mods = [].slice.call(sp.querySelectorAll('.sp-mods span'));
    var done = false, timers = [];
    root.classList.add('splashing');
    function T(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function finish() {
      if (done) return; done = true; timers.forEach(clearTimeout);
      msg.textContent = 'ready'; pct.textContent = '100%'; bar.style.transform = 'scaleX(1)';
      sp.classList.add('out');
      setTimeout(function () {
        root.classList.remove('splashing');
        if (sp.parentNode) sp.parentNode.removeChild(sp);
        window.dispatchEvent(new Event('resize'));
      }, reduce ? 50 : 950);
    }
    document.getElementById('spSkip').addEventListener('click', finish);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });
    var lines = [
      ['<span class="p">$</span> odoo-bin -d portfolio --dev=all', -1],
      ['<span class="i">INFO</span> loading <span class="w">base</span> <span class="ok">&#10003;</span>', -1],
      ['<span class="i">INFO</span> loading <span class="w">sale</span> <span class="ok">&#10003;</span>', 0],
      ['<span class="i">INFO</span> loading <span class="w">account</span> <span class="ok">&#10003;</span>', 1],
      ['<span class="i">INFO</span> loading <span class="w">mrp</span> <span class="ok">&#10003;</span>', 2],
      ['<span class="i">INFO</span> loading <span class="w">stock</span> <span class="ok">&#10003;</span>', 3],
      ['<span class="p">$</span> npm run build <span class="i"># vue + three.js</span>', 4],
      ['<span class="ok">&#10003;</span> 3D scene compiled &nbsp;<span class="ok">&#10003;</span> built in 1.2s', 5],
      ['<span class="w">&gt; Basem Ashraf &middot; Full-Stack &amp; Odoo ERP</span><span class="cur"></span>', -1]
    ];
    var N = lines.length;
    function prog(i) {
      var p = Math.round((i + 1) / N * 100);
      pct.textContent = p + '%'; bar.style.transform = 'scaleX(' + (p / 100) + ')';
      msg.textContent = i < 6 ? 'loading modules…' : (i < N - 1 ? 'building assets…' : 'ready');
    }
    function show(i) {
      var d = document.createElement('div'); d.innerHTML = lines[i][0]; code.appendChild(d);
      if (lines[i][1] >= 0 && mods[lines[i][1]]) mods[lines[i][1]].classList.add('on');
      prog(i);
    }
    if (reduce) { for (var k = 0; k < N; k++) show(k); mods.forEach(function (m) { m.classList.add('on'); }); T(finish, 500); return; }
    var first = document.createElement('div'); code.appendChild(first);
    var cmd = 'odoo-bin -d portfolio --dev=all', ci = 0;
    function rest(i) { if (i >= N) { T(finish, 560); return; } show(i); T(function () { rest(i + 1); }, 210); }
    (function type() {
      ci++;
      first.innerHTML = '<span class="p">$</span> ' + cmd.slice(0, ci) + (ci < cmd.length ? '<span class="cur"></span>' : '');
      if (ci < cmd.length) T(type, 18); else { prog(0); T(function () { rest(1); }, 240); }
    })();
  })();


})();
