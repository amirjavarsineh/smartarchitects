/* معماران هوشمند فردا — اسکریپت مشترک همه صفحات */
(function(){
  'use strict';
  var root = document.documentElement;
  var lang = root.lang === 'en' ? 'en' : 'fa';
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = !!(motionQuery && motionQuery.matches);
  root.classList.remove('no-js');

  /* ---------- Theme ---------- */
  var themeBtn = document.querySelector('.theme-toggle');
  function setTheme(t){
    root.setAttribute('data-theme', t);
    try{ localStorage.setItem('theme', t); }catch(e){}
    if(themeBtn) themeBtn.setAttribute('aria-pressed', t === 'dark');
  }
  if(themeBtn){
    themeBtn.setAttribute('aria-pressed', root.getAttribute('data-theme') === 'dark');
    themeBtn.addEventListener('click', function(){
      setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------- Header / menu / to-top ---------- */
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

  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if(burger && menu){
    burger.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    menu.addEventListener('click', function(e){
      if(e.target.tagName === 'A'){ menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  /* ---------- Reveal + counters ---------- */
  var faDigits = '۰۱۲۳۴۵۶۷۸۹';
  function fmt(n){
    var s = String(n);
    return lang === 'fa' ? s.replace(/\d/g, function(d){ return faDigits[d]; }) : s;
  }
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
    function resize(){
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
    }
    function frame(){
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
    }
    function start(){ if(!running && visible && !document.hidden && !reduced){ running = true; requestAnimationFrame(frame); } }
    function stop(){ running = false; }
    resize(); frame();
    var rt;
    window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ resize(); if(!running) frame(); }, 150); });
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
  if(bld){
    var stage = bld.closest('.demo-stage');
    var rotY = -35, rotX = -18, dragging = false, lastX = 0, lastY = 0, idle = 0, autoOn = !reduced;
    function apply(){ bld.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)'; }
    apply();
    function spin(){
      if(autoOn && !dragging && Date.now() - idle > 2500) { rotY += .18; apply(); }
      requestAnimationFrame(spin);
    }
    if(!reduced) requestAnimationFrame(spin);
    stage.addEventListener('pointerdown', function(e){ dragging = true; lastX = e.clientX; lastY = e.clientY; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', function(e){
      if(!dragging) return;
      rotY += (e.clientX - lastX) * .5;
      rotX = Math.max(-40, Math.min(5, rotX - (e.clientY - lastY) * .3));
      lastX = e.clientX; lastY = e.clientY; apply();
    });
    function end(){ dragging = false; idle = Date.now(); }
    stage.addEventListener('pointerup', end);
    stage.addEventListener('pointercancel', end);
    stage.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft'){ rotY -= 10; } else if(e.key === 'ArrowRight'){ rotY += 10; } else return;
      e.preventDefault(); idle = Date.now(); apply();
    });

    if(!stage) return;
    var tip = stage.querySelector('.floor-tip');
    var floors = bld.querySelectorAll('.floor');
    floors.forEach(function(f){
      var label = f.dataset.label || 'اطلاعات طبقه';
      f.setAttribute('aria-label', label);
      function showTip(){ if(!dragging && tip){ tip.textContent = label; tip.hidden = false; } }
      function hideTip(){ if(tip) tip.hidden = true; }
      f.addEventListener('pointerenter', showTip);
      f.addEventListener('pointerleave', hideTip);
      f.addEventListener('focus', showTip);
      f.addEventListener('blur', hideTip);
      f.addEventListener('click', function(){ if(tip){ if(!tip.hidden && tip.textContent === label) hideTip(); else showTip(); } });
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

  /* ---------- Contact form ---------- */
  var FORM_ENDPOINT = 'https://formspree.io/f/xkjovqkn';
  var FALLBACK_EMAIL = 'info@smartfuture.ir';
  var T = {
    fa:{sending:'در حال ارسال...', ok:'✓ درخواست شما ثبت شد. کارشناسان ما به‌زودی با شما تماس می‌گیرند.', err:'ارسال ناموفق بود. لطفاً دوباره تلاش کنید یا مستقیم تماس بگیرید.', mail:'برنامه ایمیل شما باز شد؛ لطفاً پیام را ارسال کنید.', subject:'درخواست مشاوره', name:'نام', phone:'تلفن', email:'ایمیل', service:'خدمت', msg:'توضیحات'},
    en:{sending:'Sending...', ok:'✓ Request received. Our team will contact you shortly.', err:'Sending failed. Please try again or contact us directly.', mail:'Your email app has opened; please send the message.', subject:'Consultation request', name:'Name', phone:'Phone', email:'Email', service:'Service', msg:'Details'}
  }[lang];

  var form = document.getElementById('contactForm');
  if(form){
    var sel = form.querySelector('select[name="service"]');
    var pre = new URLSearchParams(location.search).get('service') || form.dataset.service;
    if(sel && pre && sel.querySelector('option[value="' + pre + '"]')) sel.value = pre;

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var msg = form.querySelector('.success'), btn = form.querySelector('button[type="submit"]');
      if(form.querySelector('.hp input').value) return;
      var data = new FormData(form);
      var label = btn.textContent;
      function show(text, isErr){ msg.textContent = text; msg.classList.toggle('err', !!isErr); msg.style.display = 'block'; }

      if(!FORM_ENDPOINT){
        var body = [T.name + ': ' + data.get('name'), T.phone + ': ' + data.get('phone'), T.email + ': ' + (data.get('email') || '-'), T.service + ': ' + (sel ? sel.options[sel.selectedIndex].text : ''), '', T.msg + ':', data.get('message') || '-'].join('\n');
        location.href = 'mailto:' + FALLBACK_EMAIL + '?subject=' + encodeURIComponent(T.subject) + '&body=' + encodeURIComponent(body);
        show(T.mail);
        return;
      }
      btn.disabled = true; btn.textContent = T.sending;
      fetch(FORM_ENDPOINT, {method:'POST', body:data, headers:{Accept:'application/json'}})
        .then(function(r){ if(!r.ok) throw 0; show(T.ok); form.reset(); if(sel && pre) sel.value = pre; })
        .catch(function(){ show(T.err, true); })
        .then(function(){ btn.disabled = false; btn.textContent = label; });
    });
  }

  /* ---------- Footer year ---------- */
  var yr = document.getElementById('year');
  if(yr){
    var y = new Date().getFullYear();
    yr.textContent = lang === 'fa' ? fmt(new Intl.DateTimeFormat('fa-IR-u-nu-latn', {year:'numeric'}).format(new Date()).replace(/\D/g, '')) : y;
  }
})();


  /* ---------- Homepage-only form and footer ---------- */
  var year = document.getElementById('yr');
  if(year) year.textContent = new Date().toLocaleDateString('fa-IR', {year:'numeric'});
  var form = document.getElementById('form');
  if(form){
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      if(!form.reportValidity()) return;
      var btn = document.getElementById('submitBtn');
      var status = document.getElementById('ok');
      var endpoint = form.getAttribute('data-endpoint') || '';
      var data = Object.fromEntries(new FormData(form).entries());
      if(!endpoint){
        status.className = 'success err';
        status.textContent = 'ارسال آنلاین هنوز پیکربندی نشده است. لطفاً از راه‌های تماس درج‌شده در سایت استفاده کنید.';
        status.style.display = 'block';
        return;
      }
      btn.disabled = true;
      var oldText = btn.textContent;
      btn.textContent = 'در حال ارسال…';
      status.style.display = 'block'; status.className = 'success'; status.textContent = 'در حال ارسال درخواست…';
      try{
        var response = await fetch(endpoint, {method:'POST', headers:{'Accept':'application/json'}, body:new FormData(form)});
        if(!response.ok) throw new Error('Request failed');
        status.textContent = 'درخواست شما ثبت شد. به‌زودی با شما تماس می‌گیریم.';
        form.reset();
      }catch(err){
        status.className = 'success err';
        status.textContent = 'ارسال انجام نشد. لطفاً بعداً دوباره تلاش کنید یا از راه‌های تماس درج‌شده در سایت استفاده کنید.';
      }finally{btn.disabled = false; btn.textContent = oldText;}
    });
  }
