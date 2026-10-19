(function(){
  'use strict';
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var anio = $('#anio'); if (anio) anio.textContent = new Date().getFullYear();
  var IO = 'IntersectionObserver' in window;
  function observaUnaVez(els, clase, margen){
    if (!IO || reducido){ els.forEach(function(e){ e.classList.add(clase); }); return; }
    var io = new IntersectionObserver(function(en){ en.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add(clase); io.unobserve(e.target); } }); }, { rootMargin: margen || '0px 0px -12% 0px' });
    els.forEach(function(e){ io.observe(e); });
  }

  // Tras arrastrar algo (fotos de la mesa, tira de bocadillos) no se abre el visor
  var bloqueaClick = false;
  document.addEventListener('click', function(e){ if (bloqueaClick){ e.preventDefault(); e.stopPropagation(); bloqueaClick = false; } }, true);
  function trasArrastre(){ bloqueaClick = true; setTimeout(function(){ bloqueaClick = false; }, 60); }

  /* ---------- Hora de Elche (Europe/Madrid) ---------- */
  function ahora(){
    try {
      var p = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var o = {}; p.forEach(function(x){ o[x.type] = x.value; });
      return { d: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(o.weekday), m: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
    } catch (e) { var n = new Date(); return { d: n.getDay(), m: n.getHours() * 60 + n.getMinutes() }; }
  }
  var sal = $('#saludo');
  function saludar(){ var m = ahora().m; sal.textContent = (m >= 300 && m < 840 ? 'Buenos días' : m >= 840 && m < 1230 ? 'Buenas tardes' : 'Buenas noches') + ', Carrús'; }
  saludar();

  /* ---------- Cabecera ---------- */
  var cab = $('#cabecera'), ultimo = 0, menu = $('#menuMovil');
  function cabecera(){
    var y = window.scrollY;
    cab.classList.toggle('pegada', y > 10);
    var abierto = false; try { abierto = menu.matches(':popover-open'); } catch (e) {}
    if (!abierto) cab.classList.toggle('oculta', y > 480 && y > ultimo + 4);
    if (y < ultimo - 4) cab.classList.remove('oculta');
    ultimo = y;
  }
  window.addEventListener('scroll', cabecera, { passive: true }); cabecera();
  cab.addEventListener('focusin', function(){ cab.classList.remove('oculta'); });
  var enlaces = $$('.nav a');
  if (IO){
    var io = new IntersectionObserver(function(en){
      en.forEach(function(e){ if (!e.isIntersecting) return; enlaces.forEach(function(a){ a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    enlaces.map(function(a){ return $(a.getAttribute('href')); }).filter(Boolean).forEach(function(s){ io.observe(s); });
  }

  /* ---------- Menú móvil ---------- */
  var btnMenu = $('.btn-menu');
  if (menu && btnMenu){
    btnMenu.addEventListener('click', function(){
      var r = btnMenu.getBoundingClientRect();
      menu.style.setProperty('--mx', (r.left + r.width / 2) + 'px');
      menu.style.setProperty('--my', (r.top + r.height / 2) + 'px');
    });
    menu.addEventListener('toggle', function(e){
      var abierto = e.newState === 'open';
      btnMenu.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      btnMenu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = abierto ? 'hidden' : '';
    });
    $$('nav a, .botones a', menu).forEach(function(a){ a.addEventListener('click', function(){ if (menu.hidePopover) menu.hidePopover(); }); });
  }

  /* ---------- Entradas, subrayados y dibujos que se trazan solos ---------- */
  observaUnaVez($$('.reveal'), 'visto', '0px 0px -8% 0px');
  observaUnaVez($$('.rev-cont'), 'pintado', '0px 0px -14% 0px');
  observaUnaVez($$('.anotada, .encargos, .van-in, .deco, .cafes-txt, .alm-cab'), 'dibujado', '0px 0px -18% 0px');
  if (IO){
    var ioM = new IntersectionObserver(function(en){ en.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); }, { rootMargin: '100px 0px' });
    $$('.mov').forEach(function(s){ ioM.observe(s); });
  }

  /* ---------- Parallax de la decoración (según la posición de su SECCIÓN) ---------- */
  var capas = $$('[data-px],[data-py]');
  if (!reducido && capas.length){
    var pend = false;
    var parallax = function(){
      pend = false;
      var vh = window.innerHeight;
      capas.forEach(function(el){
        var sec = el.closest('section'); if (!sec) return;
        var r = sec.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        var x = el.dataset.px ? parseFloat(el.dataset.px) * p * 160 : 0;
        var y = el.dataset.py ? parseFloat(el.dataset.py) * p : 0;
        el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
    };
    window.addEventListener('scroll', function(){ if (!pend){ pend = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* ---------- Imán en botones y fotos ---------- */
  if (raton && !reducido){
    $$('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){
        if (e.pointerType !== 'mouse') return;
        var r = b.getBoundingClientRect();
        b.style.translate = (((e.clientX - r.left) / r.width - .5) * 10).toFixed(1) + 'px ' + (((e.clientY - r.top) / r.height - .5) * 7).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    $$('.foto-iman').forEach(function(f){
      var img = f.querySelector('img');
      f.addEventListener('pointermove', function(e){
        if (e.pointerType !== 'mouse') return;
        var r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        f.style.translate = (x * 18).toFixed(1) + 'px ' + (y * 14).toFixed(1) + 'px';
        if (img){ img.style.translate = (x * -8).toFixed(1) + 'px ' + (y * -6).toFixed(1) + 'px'; img.style.scale = '1.04'; }
      });
      f.addEventListener('pointerleave', function(){ f.style.translate = ''; if (img){ img.style.translate = ''; img.style.scale = ''; } });
    });
  }

  /* ================= PORTADA: la mesa ================= */
  var hero = $('.hero'), zona = $('#zona'), fotos = $$('.polaroid', zona), pista = $('#pista');
  var estados = fotos.map(function(f){
    return { el: f, x: 0, y: 0, vx: 0, vy: 0, r: parseFloat(f.dataset.r || 0), base: parseFloat(f.dataset.r || 0), arr: false, tocada: false };
  });
  var cimaZ = 3;
  function limites(s){
    var hr = hero.getBoundingClientRect(), zr = zona.getBoundingClientRect(), w = s.el.offsetWidth, h = s.el.offsetHeight;
    return { x0: hr.left - zr.left + 4, x1: hr.right - zr.left - w - 4, y0: hr.top - zr.top + 4, y1: hr.bottom - zr.top - h - 4 };
  }
  function pinta(s){ s.el.style.translate = s.x.toFixed(1) + 'px ' + s.y.toFixed(1) + 'px'; s.el.style.rotate = s.r.toFixed(2) + 'deg'; }
  function coloca(){
    var W = zona.clientWidth, H = zona.clientHeight;
    estados.forEach(function(s){
      if (!s.tocada){ s.x = parseFloat(s.el.dataset.x) * (W - s.el.offsetWidth); s.y = parseFloat(s.el.dataset.y) * (H - s.el.offsetHeight); }
      else { var l = limites(s); s.x = Math.min(l.x1, Math.max(l.x0, s.x)); s.y = Math.min(l.y1, Math.max(l.y0, s.y)); }
      pinta(s);
    });
  }
  coloca();
  window.addEventListener('resize', coloca);
  window.addEventListener('load', coloca);

  var bucleActivo = false;
  function fisica(){
    var vivo = false;
    estados.forEach(function(s){
      if (s.arr){ vivo = true; s.r += ((s.base + Math.max(-14, Math.min(14, s.vx * .9))) - s.r) * .2; pinta(s); return; }
      if (Math.abs(s.vx) < .05 && Math.abs(s.vy) < .05 && Math.abs(s.r - s.base) < .05) return;
      vivo = true;
      s.x += s.vx; s.y += s.vy; s.vx *= .92; s.vy *= .92;
      var l = limites(s);
      if (s.x < l.x0){ s.x = l.x0; s.vx = Math.abs(s.vx) * .5; } if (s.x > l.x1){ s.x = l.x1; s.vx = -Math.abs(s.vx) * .5; }
      if (s.y < l.y0){ s.y = l.y0; s.vy = Math.abs(s.vy) * .5; } if (s.y > l.y1){ s.y = l.y1; s.vy = -Math.abs(s.vy) * .5; }
      s.r += ((s.base + Math.max(-10, Math.min(10, s.vx * .7))) - s.r) * .12;
      pinta(s);
    });
    if (vivo) requestAnimationFrame(fisica); else bucleActivo = false;
  }
  function arranca(){ if (!bucleActivo){ bucleActivo = true; requestAnimationFrame(fisica); } }

  estados.forEach(function(s){
    var f = s.el, ox = 0, oy = 0, sx = 0, sy = 0, lx = 0, ly = 0, lt = 0, movido = 0;
    var cap = f.querySelector('figcaption');
    f.tabIndex = 0; f.setAttribute('role', 'button');
    f.setAttribute('aria-label', 'Ampliar foto: ' + (cap ? cap.textContent : 'foto'));
    f.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); f.click(); } });
    f.addEventListener('pointerdown', function(e){
      if (e.button !== 0) return;
      f.setPointerCapture(e.pointerId);
      s.arr = true; s.tocada = true; s.vx = s.vy = 0; movido = 0;
      f.classList.add('agarrada'); f.style.zIndex = 20;
      var zr = zona.getBoundingClientRect();
      ox = e.clientX - zr.left - s.x; oy = e.clientY - zr.top - s.y;
      sx = lx = e.clientX; sy = ly = e.clientY; lt = performance.now();
      arranca();
    });
    f.addEventListener('pointermove', function(e){
      if (!s.arr) return;
      var zr = zona.getBoundingClientRect(), l = limites(s), t = performance.now(), dt = Math.max(8, t - lt);
      s.x = Math.min(l.x1, Math.max(l.x0, e.clientX - zr.left - ox));
      s.y = Math.min(l.y1, Math.max(l.y0, e.clientY - zr.top - oy));
      // Velocidad en px por fotograma (16 ms), suavizada
      s.vx = s.vx * .5 + ((e.clientX - lx) / dt * 16) * .5;
      s.vy = s.vy * .5 + ((e.clientY - ly) / dt * 16) * .5;
      lx = e.clientX; ly = e.clientY; lt = t;
      movido = Math.max(movido, Math.hypot(e.clientX - sx, e.clientY - sy));
    });
    function suelta(){
      if (!s.arr) return;
      s.arr = false; f.classList.remove('agarrada');
      // Al soltarla se queda por encima de las otras fotos pero debajo de la hoja del titular
      cimaZ = cimaZ >= 4 ? 3 : cimaZ + 1; estados.forEach(function(o){ if (o !== s && +o.el.style.zIndex > 2) o.el.style.zIndex = 2; });
      f.style.zIndex = 4;
      if (performance.now() - lt > 90){ s.vx = 0; s.vy = 0; }
      if (reducido){ s.vx = s.vy = 0; }
      if (movido > 5){ trasArrastre(); if (pista) pista.classList.add('fuera'); }
      arranca();
    }
    f.addEventListener('pointerup', suelta);
    f.addEventListener('pointercancel', suelta);
  });

  // Vapor de la taza que se inclina hacia el ratón y estela de destellos
  var vaporTaza = $('.vapor-taza'), taza = $('.taza-top');
  if (raton && !reducido && hero){
    var ultimaChispa = { x: -99, y: -99 }, vivas = 0;
    hero.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var tr = taza.getBoundingClientRect(), cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
      var ang = Math.atan2(e.clientX - cx, cy - e.clientY) * 180 / Math.PI;
      var d = Math.min(1, Math.hypot(e.clientX - cx, e.clientY - cy) / (tr.width * 1.4));
      vaporTaza.style.rotate = (Math.max(-50, Math.min(50, ang)) * (1 - d * .4)).toFixed(1) + 'deg';
      if (estados.some(function(s){ return s.arr; })) return;
      var hr = hero.getBoundingClientRect(), x = e.clientX - hr.left, y = e.clientY - hr.top;
      if (Math.hypot(x - ultimaChispa.x, y - ultimaChispa.y) < 28 || vivas >= 14) return;
      ultimaChispa = { x: x, y: y }; vivas++;
      var c = document.createElement('span'); c.className = 'estela'; c.setAttribute('aria-hidden', 'true');
      c.innerHTML = '<svg><use href="#chispa"/></svg>';
      c.style.left = x + 'px'; c.style.top = y + 'px';
      if (Math.random() < .35) c.style.color = '#fff3d6';
      hero.appendChild(c);
      var dx = (Math.random() - .5) * 30, dy = 14 + Math.random() * 26, s0 = .5 + Math.random() * .7;
      var a = c.animate([
        { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (dx * .3) + 'px,' + (dy * .2) + 'px) scale(' + s0 + ') rotate(40deg)', opacity: 1, offset: .25 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0) rotate(140deg)', opacity: 0 }
      ], { duration: 760, easing: 'cubic-bezier(0.23,1,0.32,1)' });
      a.onfinish = function(){ c.remove(); vivas--; };
    });
    hero.addEventListener('pointerleave', function(){ vaporTaza.style.rotate = ''; });
  }

  // Entrada orquestada: la hoja, la taza y las fotos caen sobre la mesa una a una
  if (!reducido && document.body.animate){
    var hoja = $('.hoja');
    hoja.animate([{ opacity: 0, transform: 'translateY(34px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards', delay: 80 });
    taza.animate([{ opacity: 0, transform: 'scale(.86) rotate(-25deg)' }, { opacity: 1, transform: 'none' }], { duration: 900, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards', delay: 260 });
    fotos.forEach(function(f, i){
      var pin = f.querySelector('.pol-in'), giro = (i % 2 ? 1 : -1) * (8 + i * 3);
      pin.animate([
        { opacity: 0, transform: 'translateY(-90px) scale(1.3) rotate(' + giro + 'deg)' },
        { opacity: 1, offset: .4 },
        { opacity: 1, transform: 'none' }
      ], { duration: 680, delay: 520 + i * 140, easing: 'cubic-bezier(0.34,1.28,0.64,1)', fill: 'backwards' });
    });
    if (pista) pista.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 1400, fill: 'backwards' });
  }

  /* ================= Guirnalda de bombillas ================= */
  var gSvg = $('#guirnalda');
  if (gSvg){
    var cable = gSvg.querySelector('.cable'), caja = gSvg.parentNode, L = cable.getTotalLength(), n = window.innerWidth < 700 ? 9 : 16;
    for (var i = 1; i < n; i++){
      var p = cable.getPointAtLength(L * i / n), b = document.createElement('span');
      b.className = 'bulbo'; b.style.left = (p.x / 1440 * 100).toFixed(2) + '%'; b.style.top = (p.y / 120 * 100).toFixed(2) + '%';
      b.style.setProperty('--t', (2 + Math.random() * 2.5).toFixed(2) + 's'); b.style.setProperty('--dl', (-Math.random() * 3).toFixed(2) + 's');
      caja.appendChild(b);
    }
  }

  /* ================= Comanda que se imprime ================= */
  var ticket = $('#ticket'), btnSonido = $('#btnSonido'), sonido = false, ctx = null;
  var fecha = $('#ticketFecha');
  function ponFecha(){
    try { var t = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date());
      fecha.textContent = t.charAt(0).toUpperCase() + t.slice(1); } catch (e) {}
  }
  function ruidoImpresora(ms, pasos){
    if (!sonido) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var len = Math.floor(ctx.sampleRate * ms / 1000), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var k = 0; k < len; k++) d[k] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var fil = ctx.createBiquadFilter(); fil.type = 'bandpass'; fil.frequency.value = 3200; fil.Q.value = .8;
      var gan = ctx.createGain(), t0 = ctx.currentTime, seg = ms / 1000 / pasos;
      gan.gain.setValueAtTime(0, t0);
      for (var j = 0; j < pasos; j++){ var a = t0 + j * seg; gan.gain.setValueAtTime(.0001, a); gan.gain.linearRampToValueAtTime(.09, a + .01); gan.gain.setValueAtTime(.09, a + seg * .55); gan.gain.linearRampToValueAtTime(.0001, a + seg * .62); }
      src.connect(fil); fil.connect(gan); gan.connect(ctx.destination); src.start(); src.stop(t0 + ms / 1000 + .05);
    } catch (e) {}
  }
  var imprimiendo = null;
  function imprime(){
    ponFecha();
    if (reducido || !ticket.animate){ ticket.style.translate = '0 0'; return; }
    if (imprimiendo) imprimiendo.cancel();
    var pasos = 16, dur = 2800, kf = [];
    for (var i = 0; i < pasos; i++){
      var a = -101 * (1 - i / pasos), b = -101 * (1 - (i + 1) / pasos), t = i / pasos;
      kf.push({ offset: t, translate: '0 ' + a.toFixed(2) + '%' });
      kf.push({ offset: t + .6 / pasos, translate: '0 ' + b.toFixed(2) + '%' });
    }
    kf.push({ offset: 1, translate: '0 0%' });
    ticket.style.translate = '';
    imprimiendo = ticket.animate(kf, { duration: dur, easing: 'linear', fill: 'forwards' });
    ruidoImpresora(dur, pasos);
    imprimiendo.onfinish = function(){ ticket.style.translate = '0 0'; imprimiendo.cancel(); imprimiendo = null; };
  }
  if (ticket){
    ponFecha();
    if (IO && !reducido){
      var ioT = new IntersectionObserver(function(en){ if (en[0].isIntersecting){ ioT.disconnect(); imprime(); } }, { rootMargin: '0px 0px -25% 0px' });
      ioT.observe($('.impresora'));
    } else ticket.style.translate = '0 0';
    $('#btnReimprimir').addEventListener('click', function(){
      if (reducido || !ticket.animate){ ponFecha(); return; }
      // Primero el ticket vuelve a la impresora y luego sale otra vez
      if (imprimiendo){ imprimiendo.cancel(); imprimiendo = null; }
      var vuelta = ticket.animate([{ translate: getComputedStyle(ticket).translate === 'none' ? '0 0' : getComputedStyle(ticket).translate }, { translate: '0 -101%' }], { duration: 380, easing: 'cubic-bezier(0.77,0,0.175,1)', fill: 'forwards' });
      vuelta.onfinish = function(){ ticket.style.translate = '0 -101%'; vuelta.cancel(); setTimeout(imprime, 150); };
    });
    btnSonido.addEventListener('click', function(){
      sonido = !sonido; btnSonido.setAttribute('aria-pressed', sonido ? 'true' : 'false');
      $('span', btnSonido).textContent = sonido ? 'Sonido de la impresora activado' : 'Con el sonido de la impresora';
      if (sonido){ try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume(); } catch (e) {} }
    });
  }

  /* ================= Tira de bocadillos: arrastrar con el ratón ================= */
  var tira = $('#tira');
  if (tira){
    var abajo = false, x0 = 0, s0 = 0, mov = 0;
    tira.addEventListener('pointerdown', function(e){ if (e.pointerType !== 'mouse' || e.button !== 0) return; abajo = true; x0 = e.clientX; s0 = tira.scrollLeft; mov = 0; });
    window.addEventListener('pointermove', function(e){
      if (!abajo) return;
      var dx = e.clientX - x0; mov = Math.max(mov, Math.abs(dx));
      if (mov > 4){ tira.classList.add('arrastrando'); tira.scrollLeft = s0 - dx; }
    });
    window.addEventListener('pointerup', function(){
      if (!abajo) return; abajo = false;
      if (mov > 4){
        trasArrastre();
        // Encaja en la foto más cercana al soltar
        var ancho = tira.querySelector('.bocata').getBoundingClientRect().width + 22;
        var destino = Math.round(tira.scrollLeft / ancho) * ancho;
        tira.scrollTo({ left: destino, behavior: reducido ? 'auto' : 'smooth' });
        setTimeout(function(){ tira.classList.remove('arrastrando'); }, 420);
      } else tira.classList.remove('arrastrando');
    });
  }

  /* ================= Cafés: foto que sigue al cursor ================= */
  $$('[data-lista-foto]').forEach(function(lista){
    var filas = $$('.fila', lista);
    if (!raton){
      filas.forEach(function(f){
        var m;
        if (f.dataset.foto){ m = document.createElement('img'); m.src = f.dataset.foto; m.alt = ''; m.loading = 'lazy'; m.width = 60; m.height = 60; }
        else { m = document.createElement('span'); m.className = 'marca-mini'; m.setAttribute('aria-hidden', 'true'); m.innerHTML = '<svg><use href="#taza"/></svg>'; }
        m.classList.add('mini'); f.insertBefore(m, f.firstChild);
      });
      return;
    }
    var fig = document.createElement('figure'); fig.className = 'flota'; fig.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img'); img.alt = ''; fig.appendChild(img); document.body.appendChild(fig);
    var W = 230, H = 300, x = 0, y = 0, tx = 0, ty = 0, rot = 0, raf = null, visible = false;
    function limitar(){ tx = Math.max(12, Math.min(innerWidth - W - 12, tx)); ty = Math.max(12, Math.min(innerHeight - H - 12, ty)); }
    function bucle(){
      var dx = tx - x; x += dx * .18; y += (ty - y) * .18;
      rot += (Math.max(-6, Math.min(6, dx * .08)) - rot) * .2;
      fig.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      fig.style.rotate = rot.toFixed(2) + 'deg';
      if (Math.abs(tx - x) < .3 && Math.abs(ty - y) < .3 && Math.abs(rot) < .05 && !visible){ raf = null; return; }
      raf = requestAnimationFrame(bucle);
    }
    function mover(e){
      tx = e.clientX + 28; ty = e.clientY - H / 2; limitar();
      if (reducido){ x = tx; y = ty; fig.style.translate = x + 'px ' + y + 'px'; return; }
      if (!raf) raf = requestAnimationFrame(bucle);
    }
    filas.forEach(function(f){
      f.addEventListener('pointerenter', function(e){
        if (e.pointerType !== 'mouse') return;
        if (!f.dataset.foto){ fig.classList.remove('ve'); visible = false; return; }
        if (!visible){ tx = e.clientX + 28; ty = e.clientY - H / 2; limitar(); x = tx; y = ty + 16; }
        img.src = f.dataset.foto; visible = true; fig.classList.add('ve'); mover(e);
      });
      f.addEventListener('pointermove', function(e){ if (e.pointerType === 'mouse' && f.dataset.foto) mover(e); });
    });
    lista.addEventListener('pointerleave', function(){ visible = false; fig.classList.remove('ve'); });
    window.addEventListener('scroll', function(){ if (visible){ visible = false; fig.classList.remove('ve'); } }, { passive: true });
  });

  /* ================= Visor de fotos ================= */
  var visor = $('#visor'), vImg = $('#visorImg'), vPie = $('#visorPie'), grupo = [], idx = 0, origen = null;
  function mostrar(i){
    idx = (i + grupo.length) % grupo.length;
    var b = grupo[idx], im = b.querySelector('img');
    vImg.src = b.dataset.grande; vImg.alt = im ? im.alt : 'Foto ampliada';
    vPie.textContent = b.dataset.pie || '';
    var s = document.createElement('small'); s.textContent = grupo.length > 1 ? (idx + 1) + ' de ' + grupo.length : ''; vPie.appendChild(s);
    var multi = grupo.length > 1; $('#visorAnt').hidden = !multi; $('#visorSig').hidden = !multi;
  }
  $$('[data-grande]').forEach(function(b){
    b.addEventListener('click', function(e){
      e.preventDefault(); origen = b;
      grupo = $$('[data-galeria="' + b.dataset.galeria + '"]').filter(function(x){ return x.offsetParent !== null; });
      if (!grupo.length) grupo = [b];
      mostrar(Math.max(0, grupo.indexOf(b)));
      if (visor.showModal) visor.showModal();
    });
  });
  $('#visorCerrar').addEventListener('click', function(){ visor.close(); });
  $('#visorAnt').addEventListener('click', function(){ mostrar(idx - 1); });
  $('#visorSig').addEventListener('click', function(){ mostrar(idx + 1); });
  visor.addEventListener('click', function(e){ if (e.target === visor) visor.close(); });
  visor.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') mostrar(idx + 1); if (e.key === 'ArrowLeft') mostrar(idx - 1); });
  visor.addEventListener('close', function(){ if (origen) origen.focus(); });

  /* ================= Horario en vivo y cartel de la puerta ================= */
  // Tramos en minutos por día (0 = domingo). Del cartel publicado el 26-9-2026.
  var HORARIO = { 0: [[480, 840]], 1: [[360, 1020]], 2: [[360, 1020]], 3: [[360, 1020]], 4: [[360, 1020]], 5: [[360, 1380]], 6: [[480, 840], [1020, 1380]] };
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  function hhmm(m){ m = m % 1440; return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function duracion(m){
    if (m < 60) return m + ' min';
    var d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60;
    if (d) return d + ' d' + (hh ? ' ' + hh + ' h' : '');
    return hh + ' h' + (mm ? ' ' + mm + ' min' : '');
  }
  function proxima(d, m){
    for (var k = 0; k < 8; k++){
      var dd = (d + k) % 7, tr = HORARIO[dd];
      for (var j = 0; j < tr.length; j++){ if (k > 0 || tr[j][0] > m) return { k: k, d: dd, ini: tr[j][0], falta: k * 1440 + tr[j][0] - m }; }
    }
    return null;
  }
  var secH = $('#horario'), det = $('#estadoDetalle'), cta = $('#estadoCuenta'), pild = $('#pildoraTxt');
  function actualizar(){
    var a = ahora(), ab = null;
    (HORARIO[a.d] || []).forEach(function(x){ if (a.m >= x[0] && a.m < x[1]) ab = { fin: x[1] - a.m }; });
    if (ab){
      var cierre = hhmm(a.m + ab.fin);
      secH.dataset.estado = hero.dataset.estado = 'abierto';
      det.textContent = 'Abierto ahora. Cerramos a las ' + cierre + '.';
      cta.textContent = (ab.fin === 1 ? 'Queda ' : 'Quedan ') + duracion(ab.fin) + '.';
      pild.textContent = 'Abierto ahora, hasta las ' + cierre;
    } else {
      secH.dataset.estado = hero.dataset.estado = 'cerrado';
      var p = proxima(a.d, a.m);
      if (p){
        var cuando = p.k === 0 ? 'Hoy abrimos' : p.k === 1 ? 'Mañana abrimos' : 'Abrimos el ' + DIAS[p.d];
        det.textContent = 'Ahora cerrado. ' + cuando + ' a las ' + hhmm(p.ini) + '.';
        cta.textContent = (p.falta === 1 ? 'Falta ' : 'Faltan ') + duracion(p.falta) + '.';
        pild.textContent = 'Cerrado. ' + cuando + ' a las ' + hhmm(p.ini);
      }
    }
    $$('#dias li').forEach(function(li){ li.classList.toggle('hoy', li.dataset.d.split(',').indexOf(String(a.d)) !== -1); });
    saludar();
  }
  actualizar(); setInterval(actualizar, 30000);

  /* ================= Mapa: solo se carga al pulsar ================= */
  var btnMapa = $('#btnMapa');
  if (btnMapa) btnMapa.addEventListener('click', function(){
    var caja = $('#mapa'), f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Cafetería by Vanessa, Carrer Alfredo Sánchez Torres 6, 03206 Elche') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Cafetería by Vanessa'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    caja.appendChild(f); $('#fachada').remove(); f.focus();
  });

  /* ================= Carta editable por Vanessa (Pages CMS: contenido/carta.json) ================= */
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function euros(p){ p = String(p || '').trim(); return p ? esc(p.replace('.', ',')) + (/€/.test(p) ? '' : ' €') : ''; }
  function limpia(l){ return (l || []).filter(function(x){ return x && String(x.nombre || x.texto || '').trim(); }); }
  var tijera = '<svg class="tijera" aria-hidden="true"><use href="#tijera"/></svg>';
  if (window.fetch){
    fetch('contenido/carta.json', { cache: 'no-cache' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(c){
      if (!c) return;
      var av = String(c.aviso || '').trim(), avEl = $('#avisoDia'); avEl.textContent = av; avEl.hidden = !av;
      if (c.nota_precios !== undefined){ var np = $('#notaPrecios'); np.textContent = String(c.nota_precios || '').trim(); np.hidden = !np.textContent; }
      var t = limpia(c.tostadas);
      if (t.length) $('#listaTostadas').innerHTML = t.map(function(x){ var pr = euros(x.precio); return '<li><div class="l"><b>' + esc(x.nombre) + '</b><i></i>' + (pr ? '<em>' + pr + '</em>' : '') + '</div>' + (String(x.descripcion || '').trim() ? '<p>' + esc(x.descripcion) + '</p>' : '') + '</li>'; }).join('');
      [['bocadillos_frios', '#listaFrios'], ['bocadillos_calientes', '#listaCalientes']].forEach(function(k){
        var l = limpia(c[k[0]]); if (l.length) $(k[1]).innerHTML = l.map(function(x){ var pr = euros(x.precio); return '<li>' + esc(x.nombre) + (pr ? '<span class="precio">' + pr + '</span>' : '') + '</li>'; }).join('');
      });
      var co = c.combos;
      if (co){
        $('#combos').hidden = !co.mostrar; $('#combosCab').hidden = !co.mostrar;
        if (co.titulo) $('#combosTitulo').textContent = co.titulo;
        if (co.horario !== undefined) $('#combosHorario').textContent = co.horario;
        var lc = limpia(co.lista); if (lc.length) $('#combos').innerHTML = lc.map(function(x){ var pr = euros(x.precio); return '<div class="cupon visto">' + tijera + (pr ? '<b>' + pr + '</b>' : '') + '<h4>' + esc(x.nombre) + '</h4><p>' + esc(x.incluye) + '</p></div>'; }).join('');
      }
      var pr = c.promos_finde;
      if (pr){
        $('#promos').hidden = !pr.mostrar;
        var lp = limpia(pr.lista); if (lp.length) $('#promos').innerHTML = lp.map(function(x){ var e = euros(x.precio); return '<div class="posavaso">' + (e ? '<b>' + e + '</b>' : '') + '<span>' + esc(x.texto) + '</span></div>'; }).join('');
      }
    }).catch(function(){});
  }

  /* ================= Aviso de cookies ================= */
  if (document.cookie.indexOf('aviso_byvanessa=1') === -1) $('#aviso').hidden = false;
  $('#avisoOk').addEventListener('click', function(){ document.cookie = 'aviso_byvanessa=1; max-age=31536000; path=/; SameSite=Lax'; $('#aviso').hidden = true; });
})();
