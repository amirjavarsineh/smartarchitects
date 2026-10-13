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

  /* ---------- 3D BMS building (rotation + hover tooltip only) ---------- */
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
    });

    /* NOTE: sys-btn wiring lives in initBmsEnhanced below (single source of truth) */
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


/* ============================================
   Enhanced BMS Demo — v2
   ============================================ */
(function initBmsEnhanced() {
  'use strict';

  var bld = document.querySelector('.building');
  var stage = document.querySelector('.demo-stage');
  if (!bld || !stage) return;

  var root = document.documentElement;
  var lang = root.lang === 'en' ? 'en' : 'fa';
  var faDigits = '۰۱۲۳۴۵۶۷۸۹';
  function fmt(n, dec) {
    var s = (dec !== undefined ? Number(n).toFixed(dec) : String(n));
    return lang === 'fa' ? s.replace(/\d/g, function (d) { return faDigits[d]; }) : s;
  }

  /* -------- Element refs -------- */
  var floorInfo   = stage.querySelector('.floor-info');
  var alertPanel  = document.getElementById('alertPanel');   /* FIXED: outside stage */
  var chartCanvas = document.getElementById('bmsChart');
  var powerEl     = document.getElementById('powerValue');
  var statPeople  = document.getElementById('statPeople');
  var statTemp    = document.getElementById('statTemp');
  var statSys     = document.getElementById('statSystems');
  var dnBtn       = document.getElementById('dayNightBtn');
  var alertBtn    = document.getElementById('alertBtn');

  /* -------- Floor data -------- */
  var floorData = {
    0: { name: 'همکف — لابی و کنترل دسترسی', people: 8,  temp: 23.0, lights: 6 },
    1: { name: 'طبقه ۱ — اداری',              people: 12, temp: 22.5, lights: 8 },
    2: { name: 'طبقه ۲ — اداری',              people: 10, temp: 22.0, lights: 7 },
    3: { name: 'طبقه ۳ — اتاق سرور',          people: 0,  temp: 19.0, lights: 2 },
    4: { name: 'طبقه ۴ — جلسات',              people: 5,  temp: 21.0, lights: 4 },
    5: { name: 'پشت‌بام — چیلر و تأسیسات',    people: 0,  temp: 30.0, lights: 1 }
  };

  /* -------- Current state -------- */
  var state = {
    light: false,
    hvac: false,
    security: false,
    day: false,
    scenario: null,
    people: 25,
    temp: 22,
    power: 5.5,
    alert: null
  };

  /* -------- Scenario definitions -------- */
  var scenarios = {
    morning:  { name: 'صبح',      light: true,  hvac: false, security: false, people: 8,  temp: 21 },
    work:     { name: 'روز کاری', light: true,  hvac: true,  security: false, people: 35, temp: 22 },
    night:    { name: 'شب',       light: false, hvac: false, security: true,  people: 2,  temp: 19 },
    vacation: { name: 'تعطیل',    light: false, hvac: false, security: true,  people: 0,  temp: 17 }
  };

  /* ================================================================
     Apply system states to building & UI
     ================================================================ */
  function applySystems() {
    bld.classList.toggle('sys-light', state.light);
    bld.classList.toggle('sys-hvac', state.hvac);
    bld.classList.toggle('sys-security', state.security);

    document.querySelectorAll('.sys-btn').forEach(function (btn) {
      var sys = btn.dataset.sys;
      var on = (sys === 'light' && state.light)
            || (sys === 'hvac' && state.hvac)
            || (sys === 'security' && state.security);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    document.querySelectorAll('[data-readout]').forEach(function (r) {
      var key = r.dataset.readout;
      var b = r.querySelector('b');
      if (!b) return;
      if (key === 'light')    b.textContent = state.light ? r.dataset.on : r.dataset.off;
      if (key === 'hvac')     b.textContent = state.hvac ? fmt(state.temp, 0) + '°C' : '—';
      if (key === 'security') b.textContent = state.security ? r.dataset.on : r.dataset.off;
    });

    var active = 0;
    if (state.light)    active++;
    if (state.hvac)     active++;
    if (state.security) active++;
    if (statSys) statSys.textContent = fmt(active);
  }

  /* ================================================================
     Recompute power from current state + noise
     ================================================================ */
  function computePower() {
    var base = 0.6;
    if (state.light)    base += 3.2;
    if (state.hvac)     base += 4.8;
    if (state.security) base += 0.9;
    base += state.people * 0.03;
    base += (Math.random() - 0.5) * 0.4;
    return Math.max(0.1, base);
  }

  /* ================================================================
     Live chart
     ================================================================ */
  var powerHistory = [];
  var HISTORY = 40;
  for (var i = 0; i < HISTORY; i++) powerHistory.push(0.6);

  function drawChart() {
    if (!chartCanvas || !chartCanvas.getContext) return;
    var ctx = chartCanvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = chartCanvas.clientWidth;
    var h = chartCanvas.clientHeight;
    if (!w || !h) return;
    chartCanvas.width  = w * dpr;
    chartCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var data = powerHistory;
    var maxV = Math.max.apply(null, data.concat([10])) * 1.1;

    var pad = 4;
    var step = (w - pad * 2) / (data.length - 1);

    /* area */
    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(20,184,166,.42)');
    grad.addColorStop(1, 'rgba(20,184,166,0)');
    ctx.beginPath();
    ctx.moveTo(pad, h);
    data.forEach(function (v, i) {
      var x = pad + i * step;
      var y = h - (v / maxV) * (h - 10) - 4;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad + (data.length - 1) * step, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* line */
    ctx.beginPath();
    data.forEach(function (v, i) {
      var x = pad + i * step;
      var y = h - (v / maxV) * (h - 10) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    /* last dot */
    var lastV = data[data.length - 1];
    var lx = pad + (data.length - 1) * step;
    var ly = h - (lastV / maxV) * (h - 10) - 4;
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, 6.283);
    ctx.fillStyle = '#f5b942';
    ctx.fill();
  }

  function pushPower() {
    var p = computePower();
    state.power = p;
    powerHistory.push(p);
    if (powerHistory.length > HISTORY) powerHistory.shift();
    if (powerEl) {
      powerEl.innerHTML = fmt(p, 1) + ' <span>kW</span>';
    }
    drawChart();
  }

  /* ================================================================
     Stats update
     ================================================================ */
  function updateStats() {
    if (statPeople) statPeople.textContent = fmt(Math.round(state.people));
    if (statTemp)   statTemp.textContent   = fmt(state.temp, 1) + '°C';
    if (statSys) {
      var a = 0;
      if (state.light) a++;
      if (state.hvac) a++;
      if (state.security) a++;
      statSys.textContent = fmt(a);
    }
  }

  /* ================================================================
     Scenarios
     ================================================================ */
  function applyScenario(key) {
    var s = scenarios[key];
    if (!s) return;
    state.scenario = key;
    state.light    = s.light;
    state.hvac     = s.hvac;
    state.security = s.security;
    state.people   = s.people;
    state.temp     = s.temp;

    document.querySelectorAll('.scenario-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.scenario === key ? 'true' : 'false');
    });

    applySystems();
    updateStats();
    pushPower();
  }

  /* ================================================================
     Floor info card
     ================================================================ */
  function showFloorInfo(index) {
    if (!floorInfo) return;
    var d = floorData[index];
    if (!d) return;

    var people = d.people;
    var temp   = d.temp;
    var lights = d.lights;
    if (!state.light) lights = 0;
    if (state.hvac) {
      temp = state.temp + (d.temp - 22) * 0.3;
    }
    if (state.scenario === 'vacation') people = 0;

    floorInfo.innerHTML =
      '<button class="close" type="button" aria-label="بستن">✕</button>' +
      '<h4>' + d.name + '</h4>' +
      '<div class="row"><span>🌡️ دما</span><b>' + fmt(temp, 1) + '°C</b></div>' +
      '<div class="row"><span>💡 چراغ روشن</span><b>' + fmt(lights) + '</b></div>' +
      '<div class="row"><span>👥 افراد حاضر</span><b>' + fmt(people) + '</b></div>' +
      '<div class="row"><span>⚡ مصرف لحظه‌ای</span><b>' + fmt(d.lights * 0.15 + d.people * 0.05, 1) + ' kW</b></div>';

    floorInfo.hidden = false;

    var closeBtn = floorInfo.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        floorInfo.hidden = true;
      });
    }
  }

  /* ================================================================
     Wire scenario buttons
     ================================================================ */
  document.querySelectorAll('.scenario-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      applyScenario(btn.dataset.scenario);
    });
  });

  /* ================================================================
     Wire manual sys buttons — SINGLE source of truth
     ================================================================ */
  document.querySelectorAll('.sys-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sys = btn.dataset.sys;
      state[sys] = !state[sys];
      state.scenario = null;
      document.querySelectorAll('.scenario-btn').forEach(function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
      applySystems();
      updateStats();
      pushPower();
    });
  });

  /* ================================================================
     Wire floor click → info
     ================================================================ */
  document.querySelectorAll('.floor').forEach(function (f) {
    f.addEventListener('click', function () {
      var idx = parseInt(f.style.getPropertyValue('--i'), 10);
      if (!isNaN(idx)) showFloorInfo(idx);
    });
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        var idx = parseInt(f.style.getPropertyValue('--i'), 10);
        if (!isNaN(idx)) showFloorInfo(idx);
      }
    });
  });

  /* ================================================================
     Day / Night toggle
     ================================================================ */
  if (dnBtn) {
    dnBtn.addEventListener('click', function () {
      state.day = !state.day;
      stage.classList.toggle('day-bg', state.day);
      dnBtn.textContent = state.day
        ? '☀️ حالت روز — کلیک برای شب'
        : '🌙 حالت شب — کلیک برای روز';
    });
    dnBtn.textContent = '🌙 حالت شب — کلیک برای روز';
  }

  /* ================================================================
     Alert simulation
     ================================================================ */
  var alertTimer = null;
  function showAlert() {
    if (!alertPanel) return;
    state.alert = 'server-temp';
    alertPanel.innerHTML =
      '<div class="a-head">' +
        '<span class="a-icon">⚠️</span>' +
        '<h4>هشدار: دمای اتاق سرور بالا رفت</h4>' +
      '</div>' +
      '<p>دمای اتاق سرور به ۳۲°C رسیده است — بالاتر از حد مجاز (۲۷°C).</p>' +
      '<div class="actions">' +
        '<button class="primary" data-action="fan">روشن کردن فن</button>' +
        '<button class="ghost" data-action="ignore">نادیده بگیر</button>' +
        '<button class="ghost" data-action="close" aria-label="بستن">✕</button>' +
      '</div>';
    alertPanel.hidden = false;

    alertPanel.querySelectorAll('[data-action]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.dataset.action === 'fan') {
          state.hvac = true;
          applySystems();
          updateStats();
          pushPower();
        }
        state.alert = null;
        alertPanel.hidden = true;
        clearTimeout(alertTimer);
      });
    });

    clearTimeout(alertTimer);
    alertTimer = setTimeout(function () {
      if (state.alert === 'server-temp') {
        state.alert = null;
        alertPanel.hidden = true;
      }
    }, 12000);
  }

  if (alertBtn) {
    alertBtn.addEventListener('click', showAlert);
  }

  /* ================================================================
     Auto-update loop (every 2.5s)
     ================================================================ */
  if (!reduced) {
    setInterval(function () {
      if (state.people > 0) {
        state.people = Math.max(0, state.people + (Math.random() - 0.5) * 2);
      }
      if (state.hvac) {
        state.temp += (Math.random() - 0.5) * 0.3;
      }
      updateStats();
      pushPower();
    }, 2500);
  }

  /* ================================================================
     Resize handler
     ================================================================ */
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(drawChart, 150);
  });

  /* ================================================================
     Init
     ================================================================ */
  applySystems();
  updateStats();
  for (var k = 0; k < HISTORY; k++) {
    powerHistory[k] = computePower() * 0.5;
  }
  pushPower();
})();