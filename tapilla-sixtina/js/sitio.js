/* Tapilla Sixtina (Valdemoro) · demo de Degaldo Designs (2026-10-23). Piezas de la librería adaptadas; cada bloque dice de dónde sale. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ================= Horario y estado de hoy (lógica de cartel-abierto-cerrado v3: tramos que cruzan la medianoche) =================
     CONFIRMAR CON EL CLIENTE: horario de Google Maps. Minutos desde las 0:00 del día en que se ABRE (0 = domingo); el cierre de
     madrugada pasa de 1440 (1530 = la 1:30 del día siguiente). Los festivos no se calculan: nunca "hoy no hay servicio". */
  var HORARIO = {1:[[1140, 1440]], 2:[[1140, 1440]], 3:[[1140, 1440]], 4:[[1140, 1440]], 5:[[750, 1530]], 6:[[750, 1530]], 0:[[750, 1500]]};
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function hora(m){ if (m !== 1440) m = m % 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }     // 1440 = "24:00"
  function alas(m){ return (m !== 1440 && Math.floor((m % 1440) / 60) === 1 ? 'la ' : 'las ') + hora(m); }          // "la 1:30", "las 24:00"
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
        return {abierto:false, jornada:t.d, detalle:(k === 0 ? 'abrimos hoy a ' : k === 1 && t.m >= 360 ? 'abrimos mañana a ' : 'abrimos el ' + DIAS[dia] + ' a ') + alas(tr[i][0])};
    }
    return {abierto:false, jornada:t.d, detalle:'llámanos al 647 14 38 61'};
  }
  var estados = document.querySelectorAll('p.estado[data-estado]'), filas = document.querySelectorAll('#dias > div'), plantillaMini = document.querySelector('.estado .estado-manos');
  function pintar(){
    var t = ahora(), e = estado(t);
    Array.prototype.forEach.call(estados, function(el){
      var pa = el.querySelector('.estado-palabra'), de = el.querySelector('.estado-detalle'), w = e.abierto ? 'Abierto' : 'Cerrado';
      if (pa.textContent !== w) pa.textContent = w;
      if (de.textContent !== e.detalle) de.textContent = e.detalle;
    });
    Array.prototype.forEach.call(filas, function(f){
      var es = +f.getAttribute('data-dia') === e.jornada, et = f.querySelector('.hoy-et'), mi = f.querySelector('.estado-manos');
      f.classList.toggle('hoy', es);
      if (es && !et){ et = document.createElement('span'); et.className = 'hoy-et'; f.querySelector('dt').appendChild(et); }
      if (es) et.textContent = t.d === e.jornada ? 'Hoy' : 'Esta noche';                 /* de madrugada, la fila de ayer */
      if (es && !mi && plantillaMini){ mi = plantillaMini.cloneNode(true); f.querySelector('dt').insertBefore(mi, f.querySelector('dt').firstChild); }
      if (!es && et) et.remove();
      if (!es && mi) mi.remove();
    });
    document.querySelectorAll('.estado-manos').forEach(function(m){ m.setAttribute('data-estado', e.abierto ? 'abierto' : 'cerrado'); });
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

  /* ================= M10 al verse, por tiempo (nada ligado al scroll): fotos que se destapan, bloques que suben, fila de hoy ================= */
  document.querySelectorAll('.cab-sec, .diptico > *, .navidad-pie, .datos, .faq, .opiniones-lado, .opiniones-pila').forEach(function(el){ el.classList.add('aparece'); });
  document.querySelectorAll('.diptico > *').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 70) + 'ms'); });
  document.querySelectorAll('.bento > .revela').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 70) + 'ms'); });
  var unaVez = document.querySelectorAll('.aparece, .revela, #dias');
  if (!('IntersectionObserver' in window) || reducido) unaVez.forEach(function(t){ t.classList.add('visto'); });
  else {
    var iov = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); iov.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
    unaVez.forEach(function(t){ iov.observe(t); });
  }

  /* ================= Pausa fuera de pantalla (cinta, latidos, pin del mapa) y brillo del fondo vivo (M82) ================= */
  if ('IntersectionObserver' in window){
    var iop = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov, .fondo-vivo').forEach(function(el){ iop.observe(el); });
  } else document.querySelectorAll('.mov, .fondo-vivo').forEach(function(el){ el.classList.add('en-pantalla'); });

  /* ================= Parallax de las palabras (M15, data-px) y de la baldosa (M82, data-py): SOLO desde 900 px (en móvil, quietas) ================= */
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
    ['inicio','navidad','carta','casa','opiniones','horario','ubicacion','preguntas','reservar'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
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
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Tapilla Sixtina, Calle Río Manzanares 23, 28342 Valdemoro') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Tapilla Sixtina'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
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

/* COPIA de 01-Libreria-de-Codigo/componentes/pila-deslizable.html (M54 v2), sin la demo: las reseñas van en el HTML */
(function(){
  var pila = document.getElementById('pila'), cuenta = document.getElementById('cuenta');
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var total = pila.children.length, actual = 0, ocupado = false;

  function marcar(){
    Array.prototype.forEach.call(pila.children, function(t, i){
      if (i === 0){ t.removeAttribute('aria-hidden'); t.inert = false; } else { t.setAttribute('aria-hidden', 'true'); t.inert = true; }
    });
    cuenta.textContent = (actual + 1) + ' de ' + total;
  }
  function limpiar(t){ t.style.translate = ''; t.style.rotate = ''; t.style.opacity = ''; }

  /* Saca la de arriba hacia un lado (dir = 1 derecha, -1 izquierda) y la manda al fondo */
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
  /* Trae la del fondo arriba */
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

  /* Arrastre */
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

/* COPIA LITERAL de 01-Libreria-de-Codigo/componentes/contacto-da-vida.html (M89 v1.2): no editar aquí, se cambia allí y se vuelve a copiar */
(function(){
  if (!document.documentElement.classList.contains('js')) return;
  var red = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('cv-simula-reducido');
  var circulo = !!(window.CSS && CSS.supports && CSS.supports('clip-path', 'circle(1px at 1px 1px)'));
  var EO = 'cubic-bezier(.23,1,.32,1)';
  function v(el, p){ return getComputedStyle(el).getPropertyValue(p).trim(); }
  function ms(el, p, d){ var s = v(el, p), n = parseFloat(s); return isNaN(n) ? d : (/[^m]s$/.test(s) ? n * 1000 : n); }
  function clave(el){ return 'cv:' + location.pathname + ':' + (el.id || ''); }
  function visto(el, poner){ try { if (poner) sessionStorage.setItem(clave(el), '1'); else return sessionStorage.getItem(clave(el)) === '1'; } catch(e){ return false; } }
  function avisa(el, n){ el.dispatchEvent(new CustomEvent('contacto:' + n, {bubbles:true})); }
  function an(s, n, k, o){ if (n && n.animate){ o.fill = 'both'; s.a.push(n.animate(k, o)); } }
  function punto(el){   /* centro de .cv-punto; coloca la chispa (v1.1: respecto a la caja donde está la chispa) */
    var c = el.querySelector('.cv-chispa'), r = ((c && c.offsetParent) || el).getBoundingClientRect(),
        p = el.querySelector('.cv-punto'), b = p ? p.getBoundingClientRect() : r;
    var x = b.left + b.width / 2 - r.left, y = b.top + b.height / 2 - r.top;
    el.style.setProperty('--cv-punto-x', x + 'px'); el.style.setProperty('--cv-punto-y', y + 'px');
    return {x:b.left + b.width / 2, y:b.top + b.height / 2};
  }
  function fin(el){
    var s = el._cv; s.t.forEach(clearTimeout); s.a.forEach(function(a){ a.cancel(); }); s.t = []; s.a = [];
    el.classList.add('cv-vivo'); removeEventListener('resize', s.rs);
    el.querySelectorAll('[data-cv-revela]').forEach(function(n){ n.classList.add('cv-revelado'); });
    if (!s.toco){ s.toco = 1; avisa(el, 'tocado'); }
    if (!s.vivo){ s.vivo = 1; avisa(el, 'vivo'); }
  }
  function luego(s, f, t){ s.t.push(setTimeout(f, t)); }

  function iniciar(el, op){
    var s = el._cv || (el._cv = {t:[], a:[]}), otra = op && op.repetir;
    if (s.on && !otra) return;
    if (s.on){ s.t.forEach(clearTimeout); s.a.forEach(function(a){ a.cancel(); }); s.t = []; s.a = []; removeEventListener('resize', s.rs);
      el.classList.remove('cv-vivo', 'cv-mira', 'cv-cerca');
      el.querySelectorAll('[data-cv-revela]').forEach(function(n){ n.classList.remove('cv-revelado'); }); }
    s.on = 1; s.toco = s.vivo = 0;
    var directo = !otra && ((el.getAttribute('data-una-vez') === 'sesion' && visto(el)) || document.hidden);
    visto(el, true);
    var P = punto(el), viva = el.querySelector('.cv-viva'), dormida = el.querySelector('.cv-dormida');
    if (directo) return fin(el);
    if (red){ an(s, viva, [{opacity:0}, {opacity:1}], {duration:300, easing:EO}); return luego(s, function(){ fin(el); }, 300); }
    var r0 = ms(el, '--cv-retraso', 250), rb = ms(el, '--cv-retraso-b', 60), D = ms(el, '--cv-duracion', 1100) - rb,
        mu = parseFloat(v(el, '--cv-muelle')) || 3, V = ms(el, '--cv-vida', 650), T = r0 + rb + D;
    ['.cv-a', '.cv-b'].forEach(function(sel, i){
      var p = el.querySelector('.cv-pieza' + sel); if (!p) return;
      var x = parseFloat(getComputedStyle(p).translate) || 0, sg = x < 0 ? 1 : -1;
      an(s, p, [{translate:x + 'px 0', easing:EO}, {translate:sg * mu + 'px 0', offset:(D - 120) / D, easing:EO}, {translate:'0px 0'}],
        {duration:D, delay:r0 + i * rb});
    });
    luego(s, function(){ s.toco = 1; avisa(el, 'tocado'); }, T);
    an(s, el.querySelector('.cv-rombo'), [{opacity:0, scale:.9}, {opacity:1, scale:1, offset:180 / 950}, {opacity:1, scale:1, offset:700 / 950}, {opacity:0, scale:1}],
      {duration:950, delay:T, easing:EO});
    an(s, el.querySelector('.cv-aro'), [{opacity:0, scale:.9}, {opacity:1, scale:.9, offset:.01}, {opacity:0, scale:1.8}], {duration:420, delay:T, easing:EO});   /* empieza en 0: durante el retraso se ve el primer fotograma */
    if (circulo){
      var b = viva.getBoundingClientRect(), x = P.x - b.left, y = P.y - b.top,
          R = Math.max(Math.hypot(x, y), Math.hypot(b.width - x, y), Math.hypot(x, b.height - y), Math.hypot(b.width - x, b.height - y)) * 1.02,
          at = ' at ' + x.toFixed(1) + 'px ' + y.toFixed(1) + 'px)';
      an(s, viva, [{clipPath:'circle(0px' + at}, {clipPath:'circle(' + R.toFixed(1) + 'px' + at}], {duration:V, delay:T + 50, easing:EO});
    } else an(s, viva, [{opacity:0}, {opacity:1}], {duration:400, delay:T + 50, easing:EO});
    an(s, dormida, [{opacity:1}, {opacity:0}], {duration:200, delay:T + 50 + V - 200, easing:EO});
    luego(s, function(){ el.querySelectorAll('[data-cv-revela]').forEach(function(n){ n.classList.add('cv-revelado'); });
      s.vivo = 1; avisa(el, 'vivo'); }, T + 50 + V);
    luego(s, function(){ fin(el); }, T + 50 + V + 260);
    var ancho = innerWidth; s.rs = function(){ if (innerWidth !== ancho) fin(el); }; addEventListener('resize', s.rs);
  }
  window.contactoDaVida = iniciar;

  var io = 'IntersectionObserver' in window;
  document.querySelectorAll('.cv').forEach(function(el){
    var m = el.getAttribute('data-contacto') || 'carga', ancho = innerWidth;
    if (m === 'auto') m = innerWidth >= (+el.getAttribute('data-cv-desde') || 1024) ? 'carga' : 'al-ver';
    if (m === 'al-ver' && el.getAttribute('data-una-vez') === 'sesion' && visto(el)) m = 'carga';
    if (m === 'carga') iniciar(el);
    else if (m === 'al-ver'){
      if (!io) iniciar(el);
      else {
        /* v1.2: umbral (data-cv-umbral, 0,5 por defecto; nunca más de lo que cabe en pantalla) y espera con el scroll parado
           (data-cv-espera en ms, 0 por defecto): quien baja deprisa no se encuentra la foto ya a medio destapar */
        var u = Math.min(+el.getAttribute('data-cv-umbral') || .5, innerHeight * .95 / Math.max(1, el.offsetHeight)),
            esp = +el.getAttribute('data-cv-espera') || 0, dentro = false, tm = null;
        var ya = function(){ o.disconnect(); removeEventListener('scroll', rearma); iniciar(el); };
        var rearma = function(){ if (dentro && esp){ clearTimeout(tm); tm = setTimeout(ya, esp); } };
        var o = new IntersectionObserver(function(e){
          dentro = e[0].intersectionRatio >= u - .001;
          if (dentro){ if (esp) rearma(); else ya(); } else clearTimeout(tm);
        }, {threshold:[0, u, 1]});
        o.observe(el); if (esp) addEventListener('scroll', rearma, {passive:true});
      }
    }
    if (!el._cv || !el._cv.on) punto(el);
    addEventListener('resize', function(){ if (innerWidth !== ancho){ ancho = innerWidth; punto(el); } });
    if (el.hasAttribute('data-cv-hover') && !red && matchMedia('(hover:hover) and (pointer:fine)').matches){
      el.addEventListener('pointerenter', function(e){
        if (e.pointerType !== 'mouse' || !el.classList.contains('cv-vivo')) return;
        el.classList.add('cv-mira', 'cv-cerca');
        var r = el.querySelector('.cv-rombo'); if (r && r.animate) r.animate([{opacity:0}, {opacity:1}, {opacity:0}], {duration:300, easing:EO});
      });
      el.addEventListener('pointerleave', function(){ el.classList.remove('cv-cerca'); });
    }
  });
  /* La chispa de la mini, en pausa fuera de pantalla */
  if (io && !red){ var om = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('cv-visible', e.isIntersecting); }); });
    document.querySelectorAll('.cv-mini').forEach(function(m){ om.observe(m); }); }
})();
