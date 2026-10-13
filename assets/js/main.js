/* معماران هوشمند فردا — اسکریپت مشترک همه صفحات */
(function () {
  'use strict';

  var root = document.documentElement;
  var lang = root.lang === 'en' ? 'en' : 'fa';
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(motionQuery && motionQuery.matches);
  root.classList.remove('no-js');

  /* ---------- Config ---------- */
  var CONFIG = {
    FORM_ENDPOINT: 'https://formspree.io/f/xkjovqkn',
    FALLBACK_EMAIL: 'info@smartarchitects.ir',
    FETCH_TIMEOUT: 15000
  };

  /* ---------- Helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }
  var faDigits = '۰۱۲۳۴۵۶۷۸۹';
  function fmt(n) {
    var s = String(n);
    return lang === 'fa' ? s.replace(/\d/g, function (d) { return faDigits[d]; }) : s;
  }

  /* ---------- Theme ---------- */
  (function initTheme() {
    var btn = $('.theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    btn.addEventListener('click', function () {
      var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', t);
      try { localStorage.setItem('theme', t); } catch (e) {}
      btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    });
  })();

  /* ---------- Header / menu / to-top ---------- */
  (function initChrome() {
    var header = $('header');
    var toTop = $('.to-top');
    var burger = $('.burger');
    var menu = document.getElementById('menu');

    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      if (header) header.classList.toggle('scrolled', y > 40);
      if (toTop) toTop.classList.toggle('show', y > 600);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      });
    }

    function setMenu(open) {
      if (!menu || !burger) return;
      menu.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
    }

    if (burger && menu) {
      burger.addEventListener('click', function () {
        setMenu(!menu.classList.contains('open'));
      });
      menu.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') setMenu(false);
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
      });
    }
  })();

  /* ---------- Reveal + counters ---------- */
  (function initReveal() {
    function count(el) {
      var target = +el.dataset.count;
      var suffix = el.dataset.suffix || '';
      if (reduced) { el.textContent = fmt(target) + suffix; return; }
      var start = null;
      function tick(t) {
        if (!start) start = t;
        var p = Math.min((t - start) / 1600, 1);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    var revealEls = $$('.reveal');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          $$('[data-count]', en.target).forEach(count);
          io.unobserve(en.target);
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
      $$('[data-count]').forEach(count);
    }
  })();

  /* ---------- Hero network canvas ---------- */
  (function initNetMap() {
    var canvas = $('.net-map');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var nodes = [], W = 0, H = 0, dpr = 1, running = false, visible = true;
    var mouse = { x: -9999, y: -9999 };
    var colors = ['#14b8a6', '#f5b942', '#5b9cf0'];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, Math.max(28, W * H / 16000)));
      nodes = [];
      for (var i = 0; i < n; i++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() < 0.12 ? 3.2 : 1.8,
          c: colors[i % 3],
          p: Math.random() * 6.28
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, W, H);
      var max = 140, i, j, a, b, dx, dy, d;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        if (!reduced) {
          a.x += a.vx; a.y += a.vy; a.p += 0.03;
          if (a.x < 0 || a.x > W) a.vx *= -1;
          if (a.y < 0 || a.y > H) a.vy *= -1;
          dx = a.x - mouse.x; dy = a.y - mouse.y; d = dx * dx + dy * dy;
          if (d < 14400) { a.x += dx * 0.012; a.y += dy * 0.012; }
        }
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < max) {
            ctx.strokeStyle = 'rgba(148,197,255,' + (1 - d / max) * 0.35 + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        ctx.fillStyle = a.c;
        ctx.globalAlpha = 0.65 + Math.sin(a.p) * 0.35;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (running) requestAnimationFrame(frame);
    }

    function start() {
      if (!running && visible && !document.hidden && !reduced) {
        running = true;
        requestAnimationFrame(frame);
      }
    }
    function stop() { running = false; }

    resize();
    frame();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { resize(); if (!running) frame(); }, 150);
    });

    var host = canvas.parentElement;
    if (host) {
      host.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
      });
      host.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    }
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        visible ? start() : stop();
      }).observe(canvas);
    }
    start();
  })();

  /* ---------- 3D BMS building ---------- */
  (function initBuilding() {
    var bld = $('.building');
    if (!bld) return;
    var stage = bld.closest('.demo-stage');
    if (!stage) return;

    var rotY = -35, rotX = -18, dragging = false, lastX = 0, lastY = 0, idle = 0;
    var autoOn = !reduced;

    function apply() {
      bld.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
    }
    apply();

    function spin() {
      if (autoOn && !dragging && Date.now() - idle > 2500) {
        rotY += 0.18;
        apply();
      }
      requestAnimationFrame(spin);
    }
    if (!reduced) requestAnimationFrame(spin);

    stage.addEventListener('pointerdown', function (e) {
      dragging = true;
      lastX = e.clientX; lastY = e.clientY;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.5;
      rotX = Math.max(-40, Math.min(5, rotX - (e.clientY - lastY) * 0.3));
      lastX = e.clientX; lastY = e.clientY;
      apply();
    });
    function end() { dragging = false; idle = Date.now(); }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('pointerleave', function () { if (dragging) end(); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { rotY -= 10; }
      else if (e.key === 'ArrowRight') { rotY += 10; }
      else return;
      e.preventDefault();
      idle = Date.now();
      apply();
    });

    var tip = $('.floor-tip', stage);
    $$('.floor', bld).forEach(function (f) {
      var label = f.dataset.label || 'اطلاعات طبقه';
      f.setAttribute('aria-label', label);
      function showTip() { if (!dragging && tip) { tip.textContent = label; tip.hidden = false; } }
      function hideTip() { if (tip) tip.hidden = true; }
      f.addEventListener('pointerenter', showTip);
      f.addEventListener('pointerleave', hideTip);
      f.addEventListener('focus', showTip);
      f.addEventListener('blur', hideTip);
      f.addEventListener('click', function () {
        if (!tip) return;
        if (!tip.hidden && tip.textContent === label) hideTip();
        else showTip();
      });
      f.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showTip();
        }
      });
    });

    var readouts = $$('[data-readout]');
    $$('.sys-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        bld.classList.toggle('sys-' + btn.dataset.sys, on);
        readouts.forEach(function (r) {
          if (r.dataset.readout === btn.dataset.sys) {
            var b = r.querySelector('b');
            if (b) b.textContent = on ? r.dataset.on : r.dataset.off;
          }
        });
      });
    });
  })();

  /* ---------- Contact form ---------- */
  (function initForm() {
    var form = document.getElementById('form');
    if (!form) return;

    var status = document.getElementById('ok') || form.querySelector('.success');
    var btn = form.querySelector('button[type="submit"]');
    var sel = form.querySelector('select[name="service"]');
    var hp = form.querySelector('input[name="_gotcha"], .hp input');

    var pre = new URLSearchParams(location.search).get('service') || form.dataset.service;
    if (sel && pre && sel.querySelector('option[value="' + pre + '"]')) {
      sel.value = pre;
    }

    function show(text, isErr) {
      if (!status) return;
      status.textContent = text;
      status.classList.toggle('err', !!isErr);
      status.style.display = 'block';
      status.setAttribute('role', 'status');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (hp && hp.value) return; // honeypot

      var endpoint = form.getAttribute('data-endpoint') || CONFIG.FORM_ENDPOINT;
      var data = new FormData(form);
      var oldText = btn ? btn.textContent : '';

      if (btn) { btn.disabled = true; btn.textContent = 'در حال ارسال…'; }
      form.setAttribute('aria-busy', 'true');
      show('در حال ارسال درخواست…', false);

      if (!endpoint) {
        var body = [
          'نام: ' + (data.get('name') || '-'),
          'تلفن: ' + (data.get('phone') || '-'),
          'ایمیل: ' + (data.get('email') || '-'),
          'خدمت: ' + (sel ? sel.options[sel.selectedIndex].text : '-'),
          '',
          'توضیحات:',
          data.get('message') || '-'
        ].join('\n');
        location.href = 'mailto:' + CONFIG.FALLBACK_EMAIL +
          '?subject=' + encodeURIComponent('درخواست مشاوره') +
          '&body=' + encodeURIComponent(body);
        show('برنامه ایمیل شما باز شد؛ لطفاً پیام را ارسال کنید.', false);
        if (btn) { btn.disabled = false; btn.textContent = oldText; }
        form.removeAttribute('aria-busy');
        return;
      }

      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, CONFIG.FETCH_TIMEOUT);

      fetch(endpoint, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
        signal: controller ? controller.signal : undefined
      })
        .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        window.location.href = 'thanks.html';
        })
        .catch(function (err) {
          var msg = 'ارسال ناموفق بود. لطفاً دوباره تلاش کنید یا از راه‌های تماس درج‌شده در سایت استفاده کنید.';
          if (err && err.name === 'AbortError') {
            msg = 'زمان ارسال به پایان رسید. لطفاً اتصال اینترنت خود را بررسی کنید.';
          }
          show(msg, true);
        })
        .then(function () {
          clearTimeout(timer);
          if (btn) { btn.disabled = false; btn.textContent = oldText; }
          form.removeAttribute('aria-busy');
        });
    });
  })();

  /* ---------- Footer year ---------- */
  (function initYear() {
    var year = document.getElementById('yr');
    if (!year) return;
    try {
      year.textContent = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
    } catch (e) {
      year.textContent = new Date().getFullYear();
    }
  })();

})();