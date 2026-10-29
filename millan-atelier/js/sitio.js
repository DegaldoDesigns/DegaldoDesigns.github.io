/* Millán Diseño & Moda Atelier · demo v2 de Degaldo Designs (2026-10-26). Lo común de la página; cada bloque dice de qué pieza de la
   librería sale. Las mecánicas nuevas van cada una en su archivo (firma-bordada, probador, burro, cinta-metrica, etiquetas,
   hoja-medidas, caja-seda). */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hayIO = 'IntersectionObserver' in window;
  var $ = function(s){ return document.querySelector(s); };

  /* ================= M10 aparecer, una vez ================= */
  var unaVez = document.querySelectorAll('.aparece');
  if (!hayIO || reducido) unaVez.forEach(function(el){ el.classList.add('visto'); });
  else {
    var iov = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); iov.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
    unaVez.forEach(function(t){ iov.observe(t); });
  }

  /* ================= M94 proceso-linea: al verse el 40 %, se dibuja una vez ================= */
  document.querySelectorAll('.pl').forEach(function(ol){
    Array.prototype.forEach.call(ol.children, function(li, i){ li.style.setProperty('--p', i); });
    if (!hayIO){ ol.classList.add('pl-visto'); return; }
    var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ ol.classList.add('pl-visto'); io.disconnect(); } }, {threshold:.4});
    io.observe(ol);
  });

  /* ================= Pausa fuera de pantalla (.mov / .en-pantalla) ================= */
  if (hayIO){
    var iop = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ iop.observe(el); });
  } else document.querySelectorAll('.mov').forEach(function(el){ el.classList.add('en-pantalla'); });

  /* ================= Parallax de la decoración (M15, decoracion-parallax): solo desde 900 px. Posición de la SECCIÓN. ================= */
  if (!reducido){
    var capas = [].slice.call(document.querySelectorAll('[data-px], [data-py]')), pend = null, ancho = matchMedia('(min-width: 900px)');
    var mover = function(){ pend = null; var vh = innerHeight;
      if (!ancho.matches){ capas.forEach(function(el){ el.style.translate = ''; }); return; }
      capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        el.style.translate = el.dataset.px ? (p * +el.dataset.px * 2).toFixed(1) + 'px 0' : '0 ' + (p * +el.dataset.py).toFixed(1) + 'px'; }); };
    addEventListener('scroll', function(){ if (!pend && ancho.matches) pend = requestAnimationFrame(mover); }, {passive:true});
    if (ancho.addEventListener) ancho.addEventListener('change', mover);
    mover();
  }

  /* ================= Cabecera inteligente (M18) + sección activa (M61) ================= */
  var cab = $('#cabecera');
  if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && hayIO){
    new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe($('.centinela'));
  }
  var ultimo = scrollY, pendC = false;
  addEventListener('scroll', function(){
    if (pendC) return; pendC = true;
    requestAnimationFrame(function(){
      pendC = false;
      var y = scrollY, d = y - ultimo;
      if (Math.abs(d) < 8) return;
      if (y < 120 || d < 0) cab.classList.remove('oculta'); else cab.classList.add('oculta');
      ultimo = y;
    });
  }, {passive:true});
  var enlaces = document.querySelectorAll('.nav a');
  if (hayIO){
    var ioa = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting) return;
      var id = e.target.id === 'ubicacion' ? 'ubicacion' : e.target.id;
      enlaces.forEach(function(a){ if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }); },
      {rootMargin:'-45% 0px -50% 0px'});
    ['inicio','probador','taller','trayectoria','proceso','opiniones','horario','ubicacion'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
  }

  /* ================= Menú móvil en círculo (M52 menu-escalonado) ================= */
  var menu = $('#menu'), hamb = $('.hamb');
  if (menu && hamb){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){
      var abierto = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      if (!abierto) hamb.focus({preventScroll:true});
    });
    menu.querySelectorAll('a[href^="#"]').forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* ================= Barra fija del móvil (barra-pegajosa-movil v2): se esconde cuando ya se ven los botones de la página ================= */
  var barra = $('#barraMovil');
  if (barra){
    var verBarra = function(){ barra.classList.toggle('visible', scrollY > 420); };
    addEventListener('scroll', function(){ requestAnimationFrame(verBarra); }, {passive:true}); verBarra();
    if (hayIO){
      var vistos = new Set();
      var iob = new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); }); barra.classList.toggle('tapada', vistos.size > 0); });
      document.querySelectorAll('[data-tapa-barra]').forEach(function(el){ iob.observe(el); });
    }
  }

  /* ================= Imán en los botones importantes (M30 interacciones-cursor v3), solo con ratón ================= */
  if (raton && !reducido){
    document.querySelectorAll('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
  }

  /* ================= Mapa real solo al pulsar (ubicacion-mapa v3; la web no usa cookies) ================= */
  var btnMapa = $('#btnMapa');
  if (btnMapa) btnMapa.addEventListener('click', function(){
    var caja = $('#mapa'); if (!caja || caja.querySelector('iframe')) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Millán Diseño & Moda Atelier, C. Carrera 8, 23330 Villanueva del Arzobispo, Jaén') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Millán Diseño & Moda Atelier'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
    caja.hidden = false; caja.appendChild(f); btnMapa.textContent = 'Mapa cargado debajo'; btnMapa.setAttribute('aria-expanded', 'true');
    caja.scrollIntoView({block:'nearest', behavior: reducido ? 'auto' : 'smooth'}); f.focus();
  });
})();
