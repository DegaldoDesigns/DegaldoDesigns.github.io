/* Mitto (Parla) · demo de Degaldo Designs (2026-10-24). Piezas de la librería adaptadas; cada bloque dice de dónde sale. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ================= Horario y estado de hoy (lógica de cartel-abierto-cerrado v3: tramos que cruzan la medianoche) =================
     CONFIRMAR CON EL CLIENTE: horario de Google Maps (24-10-2026). Minutos desde las 0:00 del día en que se ABRE (0 = domingo); el
     cierre de madrugada pasa de 1440 (1530 = la 1:30 del día siguiente). Los festivos no se calculan: nunca "hoy no hay servicio". */
  var HORARIO = {1:[[480, 1320]], 2:[[480, 1320]], 3:[[480, 1410]], 4:[[480, 1410]], 5:[[480, 1530]], 6:[[540, 1530]], 0:[[540, 1320]]};
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function hora(m){ if (m !== 1440) m = m % 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function alas(m){ return (m !== 1440 && Math.floor((m % 1440) / 60) === 1 ? 'la ' : 'las ') + hora(m); }          // "la 1:30", "las 22:00"
  function ahora(){
    try {
      var p = {}, n = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
      new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {d:n[p.weekday], m:(+p.hour % 24) * 60 + (+p.minute)};
    } catch (e){ var f = new Date(); return {d:f.getDay(), m:f.getHours() * 60 + f.getMinutes()}; }
  }
  function estado(t){
    var hoy = HORARIO[t.d] || [], i;
    for (i = 0; i < hoy.length; i++) if (t.m >= hoy[i][0] && t.m < hoy[i][1]) return {abierto:true, jornada:t.d, detalle:'hasta ' + alas(hoy[i][1])};
    var ayer = (t.d + 6) % 7, tra = HORARIO[ayer] || [];                       /* el tramo de AYER que pasa de la medianoche */
    for (i = 0; i < tra.length; i++) if (tra[i][1] > 1440 && t.m < tra[i][1] - 1440) return {abierto:true, jornada:ayer, detalle:'hasta ' + alas(tra[i][1])};
    for (var k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.m > 0)
        return {abierto:false, jornada:t.d, detalle:(k === 0 ? 'abrimos a ' : k === 1 ? 'abrimos mañana a ' : 'abrimos el ' + DIAS[dia] + ' a ') + alas(tr[i][0])};
    }
    return {abierto:false, jornada:t.d, detalle:'llámanos al 600 89 87 51'};
  }
  var estados = document.querySelectorAll('p.estado[data-estado]'), filas = document.querySelectorAll('#dias > div');
  function pintar(){
    var t = ahora(), e = estado(t);
    Array.prototype.forEach.call(estados, function(el){
      var pa = el.querySelector('.estado-palabra'), de = el.querySelector('.estado-detalle'), w = e.abierto ? 'Abierto' : 'Cerrado';
      el.setAttribute('data-estado', e.abierto ? 'abierto' : 'cerrado');
      if (pa.textContent !== w) pa.textContent = w;
      if (de.textContent !== e.detalle) de.textContent = e.detalle;
    });
    Array.prototype.forEach.call(filas, function(f){
      var es = +f.getAttribute('data-dia') === e.jornada, et = f.querySelector('.hoy-et');
      f.classList.toggle('hoy', es);
      if (es && !et){ et = document.createElement('span'); et.className = 'hoy-et'; f.querySelector('dt').appendChild(et); }
      if (es) et.textContent = t.d === e.jornada ? 'Hoy' : 'Esta noche';                 /* de madrugada, la fila de ayer */
      if (!es && et) et.remove();
    });
  }
  pintar(); setInterval(pintar, 30000);

  /* ================= Titular por palabras (M01 titulares-animados), en la llamada final ================= */
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

  /* ================= M10 al verse, por tiempo (nada ligado al scroll): fotos que se destapan y bloques que suben; flor de los h2 (M71) ================= */
  [['.desayunos-fotos > .revela', 90], ['.bento > .revela', 70], ['.mosaico > .revela', 80]].forEach(function(g){
    document.querySelectorAll(g[0]).forEach(function(el, i){ el.style.setProperty('--retraso', (i * g[1]) + 'ms'); });
  });
  var unaVez = document.querySelectorAll('.aparece, .revela, .tf');
  if (!('IntersectionObserver' in window) || reducido) unaVez.forEach(function(t){ t.classList.add('visto'); });
  else {
    var iov = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); iov.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
    unaVez.forEach(function(t){ iov.observe(t); });
  }

  /* ================= Pausa fuera de pantalla (la cinta es el único bucle) ================= */
  if ('IntersectionObserver' in window){
    var iop = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ iop.observe(el); });
  } else document.querySelectorAll('.mov').forEach(function(el){ el.classList.add('en-pantalla'); });

  /* ================= Parallax de las palabras (M15, data-px), de la flor y de la baldosa (data-py): SOLO desde 900 px (en móvil, quietas) ================= */
  if (!reducido){
    var capas = [].slice.call(document.querySelectorAll('[data-px],[data-py]')), pend = null, ancho = matchMedia('(min-width: 900px)');
    var mover = function(){ pend = null; var vh = innerHeight;
      if (!ancho.matches){ capas.forEach(function(el){ el.style.translate = ''; }); return; }
      capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        if (el.dataset.px) el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0';
        else el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; }); };
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
    ['inicio','desayunos','carta','reposteria','patio','opiniones','horario','ubicacion','preguntas','contacto'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
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
    document.querySelectorAll('.foto-iman').forEach(function(f){
      var img = f.querySelector('img');
      f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        f.style.translate = (x * 24).toFixed(1) + 'px ' + (y * 20).toFixed(1) + 'px';
        img.style.translate = (x * -14).toFixed(1) + 'px ' + (y * -12).toFixed(1) + 'px'; img.style.scale = '1.05'; });
      f.addEventListener('pointerleave', function(){ f.style.translate = ''; img.style.translate = ''; img.style.scale = ''; });
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
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Mitto, Calle Río Guadiana 9, 28981 Parla') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Mitto'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
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

/* ================= Galería con lightbox: adaptación de galeria-lightbox v4 (grupos, foto grande y pie + M51, la miniatura que crece hasta la foto grande) ================= */
(function(){
  var dlg = document.getElementById('lightbox'); if (!dlg) return;
  var todas = [].slice.call(document.querySelectorAll('.foto-btn')), lbImg = document.getElementById('lbImg'), lbPie = document.getElementById('lbPie');
  var puede = typeof document.startViewTransition === 'function' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  var grupo = [], indice = 0, disparador = null;
  function mini(b){ return b.querySelector('img'); }
  function mostrar(i){
    indice = (i + grupo.length) % grupo.length;
    var b = grupo[indice];
    lbImg.src = b.getAttribute('data-grande') || mini(b).currentSrc || mini(b).src;
    lbImg.alt = mini(b).alt;
    lbPie.textContent = (b.getAttribute('data-pie') || mini(b).alt) + ' (' + (indice + 1) + ' de ' + grupo.length + ')';
  }
  function precarga(src){ return new Promise(function(ok){ var i = new Image(); var t = setTimeout(ok, 400); i.onload = i.onerror = function(){ clearTimeout(t); ok(); }; i.src = src; }); }
  function abrir(b){
    disparador = b; var g = b.getAttribute('data-galeria');
    grupo = todas.filter(function(x){ return x.getAttribute('data-galeria') === g; });
    var i = grupo.indexOf(b), m = mini(b);
    if (!puede){ mostrar(i); dlg.showModal(); requestAnimationFrame(function(){ dlg.classList.add('is-open'); }); return; }
    precarga(b.getAttribute('data-grande') || m.src).then(function(){
      m.style.viewTransitionName = 'foto-grande'; dlg.classList.add('vt');
      var vt = document.startViewTransition(function(){
        m.style.viewTransitionName = ''; mostrar(i); lbImg.style.viewTransitionName = 'foto-grande'; dlg.showModal(); dlg.classList.add('is-open');
      });
      vt.finished.finally(function(){ lbImg.style.viewTransitionName = ''; dlg.classList.remove('vt'); });
    });
  }
  function cerrar(){
    var m = grupo[indice] ? mini(grupo[indice]) : null;
    if (!puede || !m){
      dlg.classList.remove('is-open');
      var fin = function(){ dlg.close(); dlg.removeEventListener('transitionend', fin); };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) fin(); else { dlg.addEventListener('transitionend', fin); setTimeout(fin, 320); }
      return;
    }
    lbImg.style.viewTransitionName = 'foto-grande'; dlg.classList.add('vt');
    var vt = document.startViewTransition(function(){ lbImg.style.viewTransitionName = ''; dlg.classList.remove('is-open'); dlg.close(); m.style.viewTransitionName = 'foto-grande'; });
    vt.finished.finally(function(){ m.style.viewTransitionName = ''; dlg.classList.remove('vt'); });
  }
  todas.forEach(function(b){ b.addEventListener('click', function(){ abrir(b); }); });
  document.getElementById('lbPrev').addEventListener('click', function(){ mostrar(indice - 1); });
  document.getElementById('lbNext').addEventListener('click', function(){ mostrar(indice + 1); });
  document.getElementById('lbClose').addEventListener('click', cerrar);
  dlg.addEventListener('click', function(e){ if (e.target === dlg) cerrar(); });
  dlg.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') mostrar(indice + 1); if (e.key === 'ArrowLeft') mostrar(indice - 1); });
  dlg.addEventListener('cancel', function(e){ e.preventDefault(); cerrar(); });
  dlg.addEventListener('close', function(){ var b = grupo[indice] || disparador; if (b) b.focus({preventScroll:true}); });
})();

/* COPIA de 01-Libreria-de-Codigo/componentes/pila-deslizable.html (M54 v2), sin la demo: las reseñas van en el HTML */
(function(){
  var pila = document.getElementById('pila'), cuenta = document.getElementById('cuenta');
  if (!pila) return;
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var total = pila.children.length, actual = 0, ocupado = false;

  function marcar(){
    Array.prototype.forEach.call(pila.children, function(t, i){
      if (i === 0){ t.removeAttribute('aria-hidden'); t.inert = false; } else { t.setAttribute('aria-hidden', 'true'); t.inert = true; }
    });
    cuenta.textContent = (actual + 1) + ' de ' + total;
  }
  function limpiar(t){ t.style.translate = ''; t.style.rotate = ''; t.style.opacity = ''; }

  function siguiente(dir){
    if (ocupado) return; ocupado = true;
    var t = pila.firstElementChild;
    t.classList.remove('arrastrando', 'vuelve');
    if (reducido){ t.style.opacity = '0'; }
    else { t.style.translate = (dir * 130) + '% 0'; t.style.rotate = (dir * 14) + 'deg'; }
    setTimeout(function(){
      t.style.transition = 'none'; pila.appendChild(t); limpiar(t); t.offsetWidth; t.style.transition = '';
      actual = (actual + 1) % total; marcar(); ocupado = false;
    }, reducido ? 200 : 320);
  }
  function anterior(){
    if (ocupado) return; ocupado = true;
    var t = pila.lastElementChild;
    t.style.transition = 'none';
    if (reducido) t.style.opacity = '0'; else { t.style.translate = '-130% 0'; t.style.rotate = '-14deg'; }
    pila.insertBefore(t, pila.firstElementChild); t.offsetWidth; t.style.transition = '';
    limpiar(t);
    actual = (actual - 1 + total) % total; marcar();
    setTimeout(function(){ ocupado = false; }, 320);
  }

  var x0 = 0, t0 = 0, dx = 0, activa = null;
  pila.addEventListener('pointerdown', function(e){
    var t = e.target.closest('.tar'); if (!t || t !== pila.firstElementChild || ocupado) return;
    activa = t; x0 = e.clientX; t0 = performance.now(); dx = 0;
    t.setPointerCapture(e.pointerId); t.classList.add('arrastrando'); t.classList.remove('vuelve');
  });
  pila.addEventListener('pointermove', function(e){
    if (!activa) return;
    dx = e.clientX - x0;
    activa.style.translate = dx + 'px 0';
    if (!reducido) activa.style.rotate = (dx / 22).toFixed(2) + 'deg';
  });
  function soltar(){
    if (!activa) return;
    var t = activa; activa = null; t.classList.remove('arrastrando');
    var v = Math.abs(dx) / Math.max(1, performance.now() - t0);
    if (Math.abs(dx) > t.offsetWidth / 3 || (v > 0.11 && Math.abs(dx) > 20)){ siguiente(dx > 0 ? 1 : -1); }
    else { t.classList.add('vuelve'); limpiar(t); }
  }
  pila.addEventListener('pointerup', soltar);
  pila.addEventListener('pointercancel', soltar);

  document.getElementById('sig').addEventListener('click', function(){ siguiente(1); });
  document.getElementById('ant').addEventListener('click', anterior);
  pila.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight'){ e.preventDefault(); siguiente(1); }
    if (e.key === 'ArrowLeft'){ e.preventDefault(); anterior(); }
  });
  marcar();
})();

/* COPIA LITERAL de 01-Libreria-de-Codigo/componentes/plato-que-se-abre.html v2 (M87 v2 .pa-puerta): la puerta de dos hojas, por tiempo
   (element.animate), una vez por sesión. No editar aquí: se cambia allí y se vuelve a copiar. */
(function(){
  var D = document, H = D.documentElement; if (!H.classList.contains('js')) return;          // sin JS: abierta (CSS)
  var red = matchMedia('(prefers-reduced-motion: reduce)').matches || H.classList.contains('pa-simula-reducido');
  var EIO = 'cubic-bezier(.77,0,.175,1)', EO = 'cubic-bezier(.23,1,.32,1)';
  function num(e, p, d){ var x = parseFloat(getComputedStyle(e).getPropertyValue(p)); return isNaN(x) ? d : x; }   // tiempos en ms; % como número
  function visto(f, poner){ var k = 'pa:' + location.pathname + ':' + f._id;
    try { if (poner) sessionStorage.setItem(k, '1'); else return sessionStorage.getItem(k) == '1'; } catch(_){} }
  [].forEach.call(D.querySelectorAll('.pa-puerta'), function(f, k){
    var esc = f.querySelector('.pa-escena'), iz = f.querySelector('.pa-izq'), de = f.querySelector('.pa-der'),
        im = f.querySelector('.pa-dentro img'), so = [].slice.call(f.querySelectorAll('.pa-sombra')),
        mov = [iz, de, im].concat(so), s = {a:[], t:[], ab:false, on:false},
        tx = JSON.parse(f.getAttribute('data-pa-textos') || '["Abrir la puerta","Cerrar la puerta"]');
    f._id = f.id || k;
    if (red) f.classList.add('pa-quieta');
    var b = D.createElement('button'); b.type = 'button'; b.className = 'pa-boton'; f.append(b);
    function marca(ab){ s.ab = ab; b.setAttribute('aria-pressed', String(ab)); b.textContent = tx[ab ? 1 : 0]; }
    function aviso(ab){ f.dispatchEvent(new CustomEvent('plato:abierto', {bubbles:true, detail:{abierto:ab}})); }
    function para(){ s.t.forEach(clearTimeout); s.t = []; s.a.forEach(function(a){ a.cancel(); }); s.a = []; s.on = false;
      if (s.rs){ removeEventListener('resize', s.rs); s.rs = null; } }
    function fin(){ para(); f.classList.remove('pa-trans'); f.classList.add('pa-abierta'); marca(true); aviso(true); }   // salto al final
    function congela(){   // a mitad de la apertura: fija lo que se ve y deja que la transición siga desde ahí
      var v = mov.map(function(e){ var c = getComputedStyle(e); return [c.translate, c.scale, c.opacity]; });
      para(); mov.forEach(function(e, i){ e.style.translate = v[i][0]; e.style.scale = v[i][1]; e.style.opacity = v[i][2]; });
      f.classList.add('pa-trans'); f.offsetWidth;
      mov.forEach(function(e){ e.style.translate = e.style.scale = e.style.opacity = ''; });
    }
    function abre(repetir){
      if (s.on) return;
      if (!repetir){ if (s.hecho) return; s.hecho = true; visto(f, true); }
      para(); f.classList.remove('pa-trans', 'pa-abierta'); f.offsetWidth; marca(true);
      if (D.hidden) return fin();
      if (red){   // fundido de las hojas en su sitio, 300 ms
        f.classList.add('pa-trans'); f.classList.add('pa-abierta');
        return s.t.push(setTimeout(function(){ aviso(true); }, 300));
      }
      var W = esc.getBoundingClientRect().width, x = num(f, '--pa-x', 50) / 100, r = num(f, '--pa-rendija', 4) / 200,
          sal = num(f, '--pa-salida', 4) / 100, R = num(f, '--pa-retraso', 200), T = num(f, '--pa-t-puerta', 750),
          dd = num(f, '--pa-desfase', 40), TA = num(f, '--pa-t-asienta', 900), V = num(f, '--pa-velo', .35), S = num(f, '--pa-sombra', .38);
      function hoja(e, a, z, d){
        s.a.push(e.animate([{translate:a + 'px 0'}, {translate:z + 'px 0'}], {duration:T, delay:d, easing:EIO, fill:'both'}));
        var h = e.querySelector('.pa-sombra');
        if (h) s.a.push(h.animate([{opacity:0}, {opacity:S, offset:Math.min(1, 200 / T)}, {opacity:S}], {duration:T, delay:d, fill:'both'}));
      }
      hoja(iz, -r * W, -(x + sal) * W, R);
      hoja(de, r * W, (1 - x + sal) * W, R + dd);
      s.a.push(im.animate([{scale:1.06, opacity:1 - V}, {scale:1, opacity:1}], {duration:TA, delay:R + 50, easing:EO, fill:'both'}));
      s.on = true;
      s.t.push(setTimeout(function(){ f.classList.add('pa-abierta'); aviso(true); }, R + T));   // los pies se cruzan
      s.t.push(setTimeout(para, Math.max(R + dd + T, R + 50 + TA) + 30));                        // reposo: manda el CSS
      var w = innerWidth; s.rs = function(){ if (innerWidth != w) fin(); }; addEventListener('resize', s.rs);   // solo el ancho
    }
    b.addEventListener('click', function(){
      var ab = !s.ab; s.hecho = true;
      if (s.on) congela(); else { para(); f.classList.add('pa-trans'); }
      f.classList.toggle('pa-abierta', ab); marca(ab); aviso(ab);
    });
    f._abre = abre;
    marca(false);
    var modo = f.getAttribute('data-pa-abrir') || 'carga';
    if (modo == 'auto') modo = matchMedia('(min-width:1024px)').matches ? 'carga' : 'al-ver';
    if (f.getAttribute('data-una-vez') == 'sesion' && visto(f)){ s.hecho = true; f.classList.add('pa-abierta'); marca(true); }
    else if (modo == 'carga') abre();
    else if (modo == 'al-ver'){
      if (!('IntersectionObserver' in window)) return abre();
      var um = parseFloat(f.getAttribute('data-pa-umbral')) || .5, es = parseInt(f.getAttribute('data-pa-espera'), 10),
          dentro = false, tm;
      if (isNaN(es)) es = 150;
      um = Math.min(um, .95 * innerHeight / Math.max(1, esc.getBoundingClientRect().height));   // si no cabe, lo que quepa
      function espera(){ clearTimeout(tm); if (dentro) tm = setTimeout(function(){
        if (!dentro) return; io.disconnect(); removeEventListener('scroll', espera); abre(); }, es); }
      var io = new IntersectionObserver(function(e){ dentro = e[e.length - 1].intersectionRatio >= um - .01; espera(); }, {threshold:[0, um]});
      io.observe(esc); addEventListener('scroll', espera, {passive:true});
    }
  });
  window.platoQueSeAbre = function(f, o){ if (f && f._abre && o && (o.abrir || o.repetir)) f._abre(!!o.repetir); };
})();
