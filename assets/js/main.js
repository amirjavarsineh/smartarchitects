/* معماران هوشمند فردا — اسکریپت مشترک همه صفحات */
(function(){
  'use strict';
  var root = document.documentElement;
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(motionQuery && motionQuery.matches);
  root.classList.remove('no-js');

  var faDigits = '۰۱۲۳۴۵۶۷۸۹';
  function fmt(n){ return String(n).replace(/\d/g, function(d){ return faDigits[d]; }); }

  /* ---------- Theme ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  var userChose = false;
  try{ userChose = !!localStorage.getItem('theme'); }catch(e){}
  function applyTheme(t, save){
    root.setAttribute('data-theme', t);
    if(save){ try{ localStorage.setItem('theme', t); }catch(e){} }
    if(themeBtn) themeBtn.setAttribute('aria-pressed', t === 'dark');
  }
  if(themeBtn){
    themeBtn.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark');
    themeBtn.addEventListener('click', function(){
      userChose = true;
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  }
  if(window.matchMedia){
    var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
    var onSys = function(e){ if(!userChose) applyTheme(e.matches ? 'dark' : 'light', false); };
    if(darkMq.addEventListener) darkMq.addEventListener('change', onSys);
  }

  /* ---------- Header / to-top ---------- */
  var header = document.querySelector('header');
  var toTop = document.querySelector('.to-top');
  function onScroll(){
    var y = window.scrollY;
    if(header) header.classList.toggle('scrolled', y > 40);
    if(toTop) toTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
  if(toTop) toTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior:reduced ? 'auto' : 'smooth'}); });

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if(burger && menu){
    var setMenu = function(open){
      menu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
    };
    burger.addEventListener('click', function(){ setMenu(!menu.classList.contains('open')); });
    menu.addEventListener('click', function(e){ if(e.target.tagName === 'A') setMenu(false); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.classList.contains('open')){ setMenu(false); burger.focus(); }
    });
    document.addEventListener('click', function(e){
      if(menu.classList.contains('open') && !menu.contains(e.target) && !burger.contains(e.target)) setMenu(false);
    });
  }

  /* ---------- Reveal + counters ---------- */
  function count(el){
    var target = +el.dataset.count, suffix = el.dataset.suffix || '', start = null;
    if(reduced){ el.textContent = fmt(target) + suffix; return; }
    function tick(t){
      if(!start) start = t;
      var p = Math.min((t - start) / 1600, 1);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3)))) + suffix;
      if(p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting) return;
        en.target.classList.add('in');
        en.target.querySelectorAll('[data-count]').forEach(count);
        io.unobserve(en.target);
      });
    }, {threshold:.12});
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  }else{
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
    document.querySelectorAll('[data-count]').forEach(count);
  }

  /* ---------- Hero network canvas ---------- */
  var canvas = document.querySelector('.net-map');
  if(canvas && canvas.getContext){
    var ctx = canvas.getContext('2d');
    var nodes = [], W = 0, H = 0, dpr = 1, running = false, visible = true, mouse = {x:-9999, y:-9999};
    var colors = ['#14b8a6', '#f5b942', '#5b9cf0'];
    var resize = function(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(90, Math.max(28, W * H / 16000)));
      nodes = [];
      for(var i = 0; i < n; i++){
        nodes.push({
          x:Math.random() * W, y:Math.random() * H,
          vx:(Math.random() - .5) * .35, vy:(Math.random() - .5) * .35,
          r:Math.random() < .12 ? 3.2 : 1.8,
          c:colors[i % 3], p:Math.random() * 6.28
        });
      }
    };
    var frame = function(){
      ctx.clearRect(0, 0, W, H);
      var max = 140, i, j, a, b, dx, dy, d;
      for(i = 0; i < nodes.length; i++){
        a = nodes[i];
        if(!reduced){
          a.x += a.vx; a.y += a.vy; a.p += .03;
          if(a.x < 0 || a.x > W) a.vx *= -1;
          if(a.y < 0 || a.y > H) a.vy *= -1;
          dx = a.x - mouse.x; dy = a.y - mouse.y; d = dx * dx + dy * dy;
          if(d < 14400){ a.x += dx * .012; a.y += dy * .012; }
        }
        for(j = i + 1; j < nodes.length; j++){
          b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = Math.sqrt(dx * dx + dy * dy);
          if(d < max){
            ctx.strokeStyle = 'rgba(148,197,255,' + (1 - d / max) * .35 + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for(i = 0; i < nodes.length; i++){
        a = nodes[i];
        ctx.fillStyle = a.c;
        ctx.globalAlpha = .65 + Math.sin(a.p) * .35;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if(running) requestAnimationFrame(frame);
    };
    var start = function(){ if(!running && visible && !document.hidden && !reduced){ running = true; requestAnimationFrame(frame); } };
    var stop = function(){ running = false; };
    resize(); frame();
    var rt;
    window.addEventListener('resize', function(){
      clearTimeout(rt);
      rt = setTimeout(function(){
        /* فقط وقتی عرض عوض شد بازسازی شود (جلوگیری از پرش در موبایل) */
        if(canvas.clientWidth !== W){ resize(); if(!running) frame(); }
      }, 150);
    });
    var host = canvas.parentElement;
    host.addEventListener('pointermove', function(e){ var r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    host.addEventListener('pointerleave', function(){ mouse.x = mouse.y = -9999; });
    document.addEventListener('visibilitychange', function(){ document.hidden ? stop() : start(); });
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    }
    start();
  }

  /* ---------- 3D BMS building (CSS 3D) ---------- */
  var bld = document.querySelector('.building');
  var stage = bld ? bld.closest('.demo-stage') : null;
  if(bld && stage){
    var rotY = -35, rotX = -18, dragging = false, lastX = 0, lastY = 0, moved = 0, idle = 0, inView = true;
    var tip = stage.querySelector('.floor-tip');
    var hideTip = function(){ if(tip) tip.hidden = true; };
    var apply = function(){ bld.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)'; };
    apply();

    if('IntersectionObserver' in window){
      new IntersectionObserver(function(en){ inView = en[0].isIntersecting; }).observe(stage);
    }
    var spin = function(){
      if(!reduced && inView && !document.hidden && !dragging && Date.now() - idle > 2500){ rotY += .18; apply(); }
      requestAnimationFrame(spin);
    };
    if(!reduced) requestAnimationFrame(spin);

    stage.addEventListener('pointerdown', function(e){
      dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY;
    });
    stage.addEventListener('pointermove', function(e){
      if(!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      /* فقط بعد از کشیدن واقعی، اشاره‌گر را قفل می‌کنیم تا کلیک روی طبقه‌ها کار کند */
      if(moved > 6){
        if(!stage.hasPointerCapture(e.pointerId)) stage.setPointerCapture(e.pointerId);
        hideTip();
        rotY += dx * .5;
        rotX = Math.max(-40, Math.min(5, rotX - dy * .3));
        apply();
      }
      lastX = e.clientX; lastY = e.clientY;
    });
    var end = function(e){
      dragging = false; idle = Date.now();
      if(e && e.pointerId !== undefined && stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    };
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ rotY -= 10; }
      else if(e.key === 'ArrowRight'){ rotY += 10; }
      else if(e.key === 'ArrowUp'){ rotX = Math.min(5, rotX + 5); }
      else if(e.key === 'ArrowDown'){ rotX = Math.max(-40, rotX - 5); }
      else return;
      e.preventDefault(); idle = Date.now(); apply();
    });

    bld.querySelectorAll('.floor').forEach(function(f){
      var label = f.dataset.label || 'اطلاعات طبقه';
      f.setAttribute('aria-label', label);
      var showTip = function(){ if(!dragging && tip){ tip.textContent = label; tip.hidden = false; } };
      f.addEventListener('pointerenter', showTip);
      f.addEventListener('pointerleave', hideTip);
      f.addEventListener('focus', showTip);
      f.addEventListener('blur', hideTip);
      f.addEventListener('click', function(){
        if(tip){ if(!tip.hidden && tip.textContent === label) hideTip(); else showTip(); }
      });
      f.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); showTip(); } });
    });

    var readouts = document.querySelectorAll('[data-readout]');
    document.querySelectorAll('.sys-btn').forEach(function(btn){
      btn.addEventListener('click', function(){
        var on = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', on);
        bld.classList.toggle('sys-' + btn.dataset.sys, on);
        readouts.forEach(function(r){
          if(r.dataset.readout === btn.dataset.sys) r.querySelector('b').textContent = on ? r.dataset.on : r.dataset.off;
        });
      });
    });
  }

  /* ---------- Contact form (صفحه اصلی) ---------- */
  var form = document.getElementById('form');
  if(form){
    var sel = form.querySelector('select[name="service"]');
    var status = document.getElementById('ok');
    var btn = document.getElementById('submitBtn');
    var pre = '';
    try{ pre = new URLSearchParams(location.search).get('service') || ''; }catch(e){}
    var preselect = function(){
      if(!sel || !pre) return;
      for(var i = 0; i < sel.options.length; i++){
        if(sel.options[i].value === pre){ sel.selectedIndex = i; break; }
      }
    };
    preselect();

    var show = function(text, isErr){
      status.className = 'success' + (isErr ? ' err' : '');
      status.textContent = text;
      status.style.display = 'block';
    };

    form.addEventListener('submit', function(e){
      e.preventDefault();
      if(!form.reportValidity()) return;
      var hp = form.querySelector('.hp input');
      if(hp && hp.value) return;
      var endpoint = form.getAttribute('data-endpoint') || '';
      if(!endpoint){
        show('ارسال آنلاین هنوز پیکربندی نشده است. لطفاً با ایمیل info@smartarchitects.ir تماس بگیرید.', true);
        return;
      }
      var oldText = btn.textContent;
      btn.disabled = true; btn.textContent = 'در حال ارسال…';
      show('در حال ارسال درخواست…', false);
      fetch(endpoint, {method:'POST', headers:{'Accept':'application/json'}, body:new FormData(form)})
        .then(function(r){
          if(!r.ok) throw new Error('Request failed');
          show('✓ درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.', false);
          form.reset(); preselect();
        })
        .catch(function(){
          show('ارسال انجام نشد. لطفاً دوباره تلاش کنید یا به info@smartarchitects.ir ایمیل بزنید.', true);
        })
        .then(function(){ btn.disabled = false; btn.textContent = oldText; });
    });
  }

  /* ---------- Footer year ---------- */
  var yr = document.getElementById('yr');
  if(yr){
    try{ yr.textContent = new Date().toLocaleDateString('fa-IR', {year:'numeric'}); }
    catch(e){ yr.textContent = new Date().getFullYear(); }
  }
})();
