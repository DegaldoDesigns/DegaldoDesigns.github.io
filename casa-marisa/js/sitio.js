/* COPIA LITERAL de 01-Libreria-de-Codigo/componentes/plato-que-se-abre.html (M87) */
/* M87 plato-que-se-abre: fijado en escritorio (con línea de tiempo) o apertura automática y botón (sin ella) */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;                      // modo plano (CSS)
  var linea = CSS.supports('animation-timeline: view()'), trig = CSS.supports('width', 'calc(1px * cos(0deg))');
  document.querySelectorAll('.pa').forEach(function(fig){
    if (linea){
      var sec = fig.closest('[data-pa-recorrido]'), min = fig.getAttribute('data-pa-fijar');
      if (!sec || !min) return;
      var mq = matchMedia('(min-width:' + parseInt(min, 10) + 'px)'), tramo = document.createElement('div'), hueco = document.createElement('div');
      tramo.className = 'pa-tramo'; hueco.className = 'pa-hueco'; hueco.setAttribute('aria-hidden', 'true');
      sec.before(tramo); tramo.append(sec, hueco);
      if (sec.getAttribute('data-pa-recorrido')) tramo.style.setProperty('--pa-recorrido', sec.getAttribute('data-pa-recorrido'));
      var fija = function(){ tramo.classList.toggle('pa-fija', mq.matches); };
      mq.addEventListener('change', fija); fija();
      return;
    }
    if (!trig) return;                                                                      // navegador muy antiguo: plano
    fig.classList.add('pa-auto');
    var t = JSON.parse(fig.getAttribute('data-pa-textos') || '["Ver por dentro","Verlo entero"]'), tocado = false;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pa-boton'; fig.append(b);
    function pon(ab, aviso){
      fig.classList.toggle('pa-abierta', ab); b.setAttribute('aria-pressed', String(ab)); b.textContent = t[ab ? 1 : 0];
      if (aviso) fig.dispatchEvent(new CustomEvent('plato:abierto', {detail:{abierto:ab}}));
    }
    pon(false);
    b.addEventListener('click', function(){ tocado = true; pon(!fig.classList.contains('pa-abierta'), true); });
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(e){
        if (e[0].isIntersecting){ io.disconnect(); if (!tocado) pon(true, true); }
      }, {threshold:.6});
      io.observe(fig.querySelector('.pa-escena'));
    } else pon(true);
  });
})();

/* Casa Marisa (Carabanchel) · demo de Degaldo Designs (2026-10-23). Piezas de la librería adaptadas; cada bloque dice de dónde sale. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ================= Horario y estado de hoy (una sola función: tarjeta viva, sección Horario y llamada final) =================
     CONFIRMAR CON EL CLIENTE: horario de Google Maps. Minutos desde las 0:00 por día (0 = domingo); 24:00 = 1440.
     Los festivos no se pueden calcular: nunca se dice "hoy no hay servicio", solo cuándo se abre. */
  var HORARIO = {0:[[540,1080]], 1:[[480,1080]], 2:[[480,1290]], 3:[[480,1290]], 4:[[480,1290]], 5:[[480,1440]], 6:[[480,1440]]};
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function hora(m){ var h = Math.floor(m / 60), mi = m % 60; return h + ':' + (mi < 10 ? '0' : '') + mi; }
  function ahora(){
    try {
      var p = {}, n = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
      new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {d:n[p.weekday], m:(+p.hour % 24) * 60 + (+p.minute)};
    } catch (e){ var f = new Date(); return {d:f.getDay(), m:f.getHours() * 60 + f.getMinutes()}; }
  }
  function estado(d, m){
    var hoy = HORARIO[d] || [];
    for (var i = 0; i < hoy.length; i++) if (m >= hoy[i][0] && m < hoy[i][1]) return {abierto:true, palabra:'Abierto', detalle:hoy[i][1] >= 1440 ? 'hasta medianoche' : 'hasta las ' + hora(hoy[i][1])};
    for (i = 0; i < hoy.length; i++) if (hoy[i][0] > m) return {abierto:false, palabra:'Cerrado', detalle:'abrimos a las ' + hora(hoy[i][0])};
    for (var k = 1; k <= 7; k++){
      var t = HORARIO[(d + k) % 7];
      if (t && t.length) return {abierto:false, palabra:'Cerrado', detalle:(k === 1 ? 'abrimos mañana a las ' : 'abrimos el ' + DIAS[(d + k) % 7] + ' a las ') + hora(t[0][0])};
    }
    return {abierto:false, palabra:'Cerrado', detalle:'llámanos al 917 64 73 66'};
  }
  var estados = document.querySelectorAll('[data-estado]'), filas = document.querySelectorAll('#dias > div');
  function pintar(){
    var a = ahora(), e = estado(a.d, a.m);
    Array.prototype.forEach.call(estados, function(el){
      el.classList.toggle('abierto', e.abierto); el.classList.toggle('cerrado', !e.abierto);
      var pa = el.querySelector('.estado-palabra'), de = el.querySelector('.estado-detalle');
      if (pa.textContent !== e.palabra) pa.textContent = e.palabra;
      if (de.textContent !== e.detalle) de.textContent = e.detalle;
    });
    Array.prototype.forEach.call(filas, function(f){
      var es = +f.getAttribute('data-dia') === a.d, et = f.querySelector('.hoy-et');
      f.classList.toggle('hoy', es);
      if (es && !et){ et = document.createElement('span'); et.className = 'hoy-et'; et.textContent = 'Hoy'; f.querySelector('dt').appendChild(et); }
      if (!es && et) et.remove();
    });
  }
  pintar(); setInterval(pintar, 30000);
  var viva = document.querySelector('.viva');
  if (viva) requestAnimationFrame(function(){ viva.classList.add('lista'); });

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
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ h.classList.add('visto'); io.disconnect(); } }); }, {rootMargin:'0px 0px -12% 0px'});
    io.observe(h.parentNode);                                                           /* el contenedor (regla de Della Grotta) */
  });

  /* ================= Una vez al verse: la cruz de los titulares (M71 v2) y la fila de hoy del horario ================= */
  var unaVez = document.querySelectorAll('.tf, #dias');
  if (!('IntersectionObserver' in window) || reducido) unaVez.forEach(function(t){ t.classList.add('visto'); });
  else {
    var iov = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); iov.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
    unaVez.forEach(function(t){ iov.observe(t); });
  }

  /* ================= Muro de reseñas (M46 v2): dos tiras iguales por columna, cada una con la lista dos veces ================= */
  document.querySelectorAll('.muro .col').forEach(function(col){
    var ul = col.querySelector('ul'); if (!ul) return;
    var tira = document.createElement('div'); tira.className = 'tira';
    var copia = ul.cloneNode(true); copia.setAttribute('aria-hidden', 'true');
    col.insertBefore(tira, ul); tira.append(ul, copia);
    var tira2 = tira.cloneNode(true); tira2.setAttribute('aria-hidden', 'true');
    tira2.querySelectorAll('ul').forEach(function(u){ u.removeAttribute('aria-hidden'); });
    col.appendChild(tira2);
  });
  document.querySelectorAll('.muro').forEach(function(m){ m.classList.add('lleno'); });

  /* ================= Pausa fuera de pantalla (bucles: cinta, muro, pin del mapa) y brillo del fondo vivo (M82) ================= */
  if ('IntersectionObserver' in window){
    var iop = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov, .fondo-vivo').forEach(function(el){ iop.observe(el); });
  } else document.querySelectorAll('.mov, .fondo-vivo').forEach(function(el){ el.classList.add('en-pantalla'); });

  /* ================= Parallax: palabras gigantes (M15, data-px) y mantel o cruces (M82, data-py), con la posición de la SECCIÓN ================= */
  if (!reducido){
    var capas = [].slice.call(document.querySelectorAll('[data-px],[data-py]')), pend = null;
    var mover = function(){ pend = null; var vh = innerHeight;
      capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        if (el.dataset.px) el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0';
        else el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; }); };
    addEventListener('scroll', function(){ if (!pend) pend = requestAnimationFrame(mover); }, {passive:true});
    addEventListener('resize', mover); mover();
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
    ['carta','encargo','casa','opiniones','horario','ubicacion','preguntas','inicio','reservar'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
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
    var verBarra = function(){ barra.classList.toggle('visible', scrollY > innerHeight * .5); };
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
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Restaurante Casa Marisa, Calle Alzina 11, 28044 Madrid') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Casa Marisa'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
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
        /* name="faq": cierra la que estuviera abierta (el navegador no lo hace al abrir por código) */
        document.querySelectorAll('.faq details[open]').forEach(function(o){ if (o !== el) o.open = false; });
        el.style.height = el.offsetHeight + 'px'; el.open = true;
        requestAnimationFrame(function(){ abriendo = true; animar(el.offsetHeight + 'px', (resumen.offsetHeight + contenido.offsetHeight) + 'px', true); });
      } else if (abriendo || el.open){ cerrando = true; animar(el.offsetHeight + 'px', resumen.offsetHeight + 'px', false); }
    });
  });
})();
