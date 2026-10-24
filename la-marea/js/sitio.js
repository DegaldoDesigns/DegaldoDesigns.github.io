/* La Marea (Valdemoro) · demo de Degaldo Designs (2026-10-24). Piezas de la librería adaptadas; cada bloque dice de dónde sale.
   El reloj de la firma y la tarjeta viva van en js/anillo-horario.js (copia literal de M86 v2); la carta, en js/carta.js. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ================= Estado de hoy para la sección Horario y la llamada final (misma lógica que anillo-horario v1: tramos en
     minutos, cierre de madrugada > 1440, el tramo de ayer que pasa de la medianoche cuenta como abierto).
     CONFIRMAR CON EL CLIENTE: horario de Google Maps (0 = domingo). Los festivos no se calculan: nunca "hoy no hay servicio". ================= */
  var HORARIO = {3:[[720, 1500]], 4:[[720, 1500]], 5:[[720, 1500]], 6:[[720, 1500]], 0:[[720, 1500]]};
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function hora(m){ if (m > 1440) m -= 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function art(m){ var h = Math.floor((m > 1440 ? m - 1440 : m) / 60); return (h === 1 ? 'la ' : 'las ') + hora(m); }
  function ahora(){
    try {
      var p = {}, n = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
      new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {d:n[p.weekday], m:(+p.hour % 24) * 60 + (+p.minute)};
    } catch (e){ var f = new Date(); return {d:f.getDay(), m:f.getHours() * 60 + f.getMinutes()}; }
  }
  function estado(t){
    var hoy = HORARIO[t.d] || [], i, k;
    for (i = 0; i < hoy.length; i++) if (t.m >= hoy[i][0] && t.m < hoy[i][1]) return {abierto:true, jornada:t.d, detalle:'hasta ' + art(hoy[i][1])};
    var ayer = (t.d + 6) % 7, tra = HORARIO[ayer] || [];
    for (i = 0; i < tra.length; i++) if (tra[i][1] > 1440 && t.m < tra[i][1] - 1440) return {abierto:true, jornada:ayer, detalle:'hasta ' + art(tra[i][1])};
    for (k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.m > 0)
        return {abierto:false, jornada:t.d, detalle:(k === 0 ? 'abrimos hoy a ' : k === 1 ? 'abrimos mañana a ' : 'abrimos el ' + DIAS[dia] + ' a ') + art(tr[i][0])};
    }
    return {abierto:false, jornada:t.d, detalle:'llámanos al 616 02 98 05'};
  }
  var estados = document.querySelectorAll('[data-estado-hoy]'), dias = document.getElementById('dias'), filas = dias ? dias.querySelectorAll('[data-dia]') : [];
  function pintar(){
    var t = ahora(), e = estado(t), w = e.abierto ? 'Abierto' : 'Cerrado';
    [].forEach.call(estados, function(el){
      var pa = el.querySelector('.estado-palabra'), de = el.querySelector('.estado-detalle');
      if (pa.textContent !== w) pa.textContent = w;
      if (de.textContent !== e.detalle) de.textContent = e.detalle;
      el.setAttribute('data-e', e.abierto ? 'abierto' : 'cerrado');
    });
    if (dias) dias.setAttribute('data-e', e.abierto ? 'abierto' : 'cerrado');
    /* la fila marcada es la de la jornada en curso (de madrugada, la de ayer, que sigue abierta: "Ahora") */
    [].forEach.call(filas, function(f){
      var es = +f.getAttribute('data-dia') === e.jornada, et = f.querySelector('.hoy-et'), txt = e.jornada === t.d ? 'Hoy' : 'Ahora';
      f.classList.toggle('hoy', es);
      if (es && !et){ et = document.createElement('span'); et.className = 'hoy-et'; f.querySelector('dt').appendChild(et); }
      if (es && et.textContent !== txt) et.textContent = txt;
      if (!es && et) et.remove();
    });
  }
  pintar(); setInterval(pintar, 30000);

  /* ================= Titular por palabras (M01 titulares-animados) ================= */
  document.querySelectorAll('.titular-palabras').forEach(function(h){
    var n = 0;
    (function partir(nodo){
      Array.prototype.slice.call(nodo.childNodes).forEach(function(hijo){
        if (hijo.nodeType === 3){
          var frag = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach(function(trozo){
            if (!trozo) return;
            if (/^\s+$/.test(trozo)){ frag.appendChild(document.createTextNode(' ')); return; }
            var v = document.createElement('span'); v.className = 'ventana';
            var p = document.createElement('span'); p.className = 'palabra'; p.textContent = trozo;
            p.style.setProperty('--i', Math.min(n++, 12));
            v.appendChild(p); frag.appendChild(v);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1 && hijo.tagName !== 'BR'){ partir(hijo); }
      });
    })(h);
    if (reducido || !('IntersectionObserver' in window)){ h.classList.add('visto'); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ h.classList.add('visto'); io.disconnect(); } }); }, {rootMargin:'0px 0px -8% 0px'});
    io.observe(h.parentNode);                                                           /* el contenedor (regla de Della Grotta) */
  });

  /* ================= M10 al verse, por tiempo (nada ligado al scroll): fotos que se destapan, bloques que suben, la escama
     de los titulares (M71), la ficha del menú del día que se endereza (M63) ================= */
  document.querySelectorAll('.cab-sec, .arroces-lista, .mar-pie > *, .terraza-texto, .datos-lista, .faq, .horario-texto, .dias').forEach(function(el){ el.classList.add('aparece'); });
  document.querySelectorAll('.bento > .revela').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 70) + 'ms'); });
  document.querySelectorAll('.mosaico > .revela').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 80) + 'ms'); });
  var unaVez = document.querySelectorAll('.aparece, .revela, .tf, .menu-dia');
  if (!('IntersectionObserver' in window) || reducido) unaVez.forEach(function(t){ t.classList.add('visto'); });
  else {
    var iov = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); iov.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
    unaVez.forEach(function(t){ iov.observe(t); });
  }

  /* ================= Pausa fuera de pantalla (cinta, muro, pin del mapa) ================= */
  if ('IntersectionObserver' in window){
    var iop = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ iop.observe(el); });
  } else document.querySelectorAll('.mov').forEach(function(el){ el.classList.add('en-pantalla'); });

  /* ================= Parallax de las palabras gigantes (M15, data-px) y de la escama (decoracion-parallax, data-py):
     SOLO desde 900 px (en móvil, quietas; lección de Embocado) ================= */
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
  var cab = document.getElementById('cabecera');
  if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && 'IntersectionObserver' in window){
    new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(document.querySelector('.centinela'));
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
  if ('IntersectionObserver' in window){
    var ioa = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting) return;
      enlaces.forEach(function(a){ if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }); },
      {rootMargin:'-45% 0px -50% 0px'});
    ['inicio','arroces','marisco','carta','terraza','opiniones','horario','ubicacion','preguntas'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
  }

  /* ================= Menú móvil en círculo (M52 menu-escalonado) ================= */
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb');
  if (menu && hamb){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){
      var abierto = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      if (!abierto) hamb.focus({preventScroll:true});
    });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* ================= Barra fija del móvil (barra-pegajosa-movil v2): nunca dos "Llamar" a la vez ================= */
  var barra = document.getElementById('barraMovil');
  if (barra){
    var verBarra = function(){ barra.classList.toggle('visible', scrollY > 420); };
    addEventListener('scroll', function(){ requestAnimationFrame(verBarra); }, {passive:true}); verBarra();
    if ('IntersectionObserver' in window){
      var vistos = new Set();
      var iob = new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); }); barra.classList.toggle('tapada', vistos.size > 0); });
      document.querySelectorAll('[data-tapa-barra]').forEach(function(el){ iob.observe(el); });
    }
  }

  /* ================= Interacciones con ratón (M30 interacciones-cursor v3). Los botones de llamar no se mueven. ================= */
  if (raton && !reducido){
    document.querySelectorAll('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    var pendG = null;
    document.addEventListener('mousemove', function(e){
      if (pendG) return;
      pendG = requestAnimationFrame(function(){ pendG = null;
        var el = e.target && e.target.closest ? e.target.closest('.faq details') : null; if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ================= Mapa real solo al pulsar (ubicacion-mapa v3, sin aviso de cookies: la web no usa cookies propias) ================= */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa) btnMapa.addEventListener('click', function(){
    var caja = document.getElementById('mapa'), fachada = document.getElementById('mapaFachada'); if (!fachada) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('La Marea, Calle María Moliner 27, 28342 Valdemoro') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de La Marea'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
    caja.appendChild(f); fachada.remove(); f.focus();
  });

  /* ================= Preguntas: acordeón nativo con altura animada (acordeon-nativo) ================= */
  document.querySelectorAll('.faq details').forEach(function(el){
    var resumen = el.querySelector('summary'), contenido = el.querySelector('.contenido'), anim = null, cerrando = false, abriendo = false;
    function terminar(abierto){ el.open = abierto; anim = null; cerrando = abriendo = false; el.style.height = el.style.overflow = ''; }
    function animar(desde, hasta, abierto){
      if (anim) anim.cancel();
      if (reducido){ terminar(abierto); return; }
      anim = el.animate({height:[desde, hasta]}, {duration:250, easing:'cubic-bezier(0.23,1,0.32,1)'});
      anim.onfinish = function(){ terminar(abierto); };
      anim.oncancel = function(){ cerrando = abriendo = false; };
    }
    resumen.addEventListener('click', function(e){
      e.preventDefault(); el.style.overflow = 'hidden';
      if (cerrando || !el.open){
        document.querySelectorAll('.faq details[open]').forEach(function(o){ if (o !== el) o.open = false; });
        el.style.height = el.offsetHeight + 'px'; el.open = true;
        requestAnimationFrame(function(){ abriendo = true; animar(el.offsetHeight + 'px', (resumen.offsetHeight + contenido.offsetHeight) + 'px', true); });
      } else if (abriendo || el.open){ cerrando = true; animar(el.offsetHeight + 'px', resumen.offsetHeight + 'px', false); }
    });
  });
})();

/* COPIA LITERAL del script de 01-Libreria-de-Codigo/componentes/galeria-lightbox.html (v4, Mitto): no editar aquí */
/* galeria-lightbox v4: grupos, foto grande y pie (v3) + la miniatura que crece hasta la foto grande (M51, View Transitions) */
(function(){
  var dlg = document.getElementById('lightbox4'); if (!dlg) return;
  var todas = [].slice.call(document.querySelectorAll('.lb4-foto')), img = document.getElementById('lb4Img'), pie = document.getElementById('lb4Pie');
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var puede = typeof document.startViewTransition === 'function' && !reducido;
  var grupo = [], indice = 0, disparador = null;
  function mini(b){ return b.querySelector('img'); }
  function mostrar(i){
    indice = (i + grupo.length) % grupo.length;
    var b = grupo[indice];
    img.src = b.getAttribute('data-grande') || mini(b).currentSrc || mini(b).src; img.alt = mini(b).alt;
    pie.textContent = (b.getAttribute('data-pie') || mini(b).alt) + ' (' + (indice + 1) + ' de ' + grupo.length + ')';
  }
  function precarga(src){ return new Promise(function(ok){ var i = new Image(), t = setTimeout(ok, 400); i.onload = i.onerror = function(){ clearTimeout(t); ok(); }; i.src = src; }); }
  function abrir(b){
    disparador = b; var g = b.getAttribute('data-galeria');
    grupo = todas.filter(function(x){ return x.getAttribute('data-galeria') === g; });
    var i = grupo.indexOf(b), m = mini(b);
    if (!puede){ mostrar(i); dlg.showModal(); requestAnimationFrame(function(){ dlg.classList.add('is-open'); }); return; }
    precarga(b.getAttribute('data-grande') || m.src).then(function(){
      m.style.viewTransitionName = 'foto-grande'; dlg.classList.add('vt');
      var vt = document.startViewTransition(function(){ m.style.viewTransitionName = ''; mostrar(i); img.style.viewTransitionName = 'foto-grande'; dlg.showModal(); dlg.classList.add('is-open'); });
      vt.finished.finally(function(){ img.style.viewTransitionName = ''; dlg.classList.remove('vt'); });
    });
  }
  function cerrar(){
    var m = grupo[indice] ? mini(grupo[indice]) : null;
    if (!puede || !m){
      dlg.classList.remove('is-open');
      var fin = function(){ dlg.removeEventListener('transitionend', fin); if (dlg.open) dlg.close(); };
      if (reducido) fin(); else { dlg.addEventListener('transitionend', fin); setTimeout(fin, 320); }
      return;
    }
    img.style.viewTransitionName = 'foto-grande'; dlg.classList.add('vt');
    var vt = document.startViewTransition(function(){ img.style.viewTransitionName = ''; dlg.classList.remove('is-open'); dlg.close(); m.style.viewTransitionName = 'foto-grande'; });
    vt.finished.finally(function(){ m.style.viewTransitionName = ''; dlg.classList.remove('vt'); });
  }
  todas.forEach(function(b){ b.addEventListener('click', function(){ abrir(b); }); });
  document.getElementById('lb4Prev').addEventListener('click', function(){ mostrar(indice - 1); });
  document.getElementById('lb4Next').addEventListener('click', function(){ mostrar(indice + 1); });
  document.getElementById('lb4Close').addEventListener('click', cerrar);
  dlg.addEventListener('click', function(e){ if (e.target === dlg) cerrar(); });
  dlg.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') mostrar(indice + 1); if (e.key === 'ArrowLeft') mostrar(indice - 1); });
  dlg.addEventListener('cancel', function(e){ e.preventDefault(); cerrar(); });
  dlg.addEventListener('close', function(){ var b = grupo[indice] || disparador; if (b) b.focus({preventScroll:true}); });
})();
