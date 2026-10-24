/* Manda Carallo (Getafe) · demo de Degaldo Designs (2026-10-24). Piezas de la librería adaptadas; cada bloque dice de dónde sale. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* ================= Horario y estado de hoy: UNA función para la tarjeta viva, el anillo grande (M86), la fila de hoy y la
     llamada final (lógica de cartel-abierto-cerrado v3 y anillo-horario v1).
     CONFIRMAR CON EL CLIENTE: horario de Google Maps. Minutos desde las 0:00 (0 = domingo). Horario partido = dos tramos.
     Los festivos y puentes no se calculan: nunca "hoy no hay servicio"; se dice cuándo se abre. ================= */
  var HORARIO = {3:[[780, 960], [1200, 1380]], 4:[[780, 960], [1200, 1380]], 5:[[780, 960], [1200, 1380]], 6:[[780, 960], [1200, 1380]], 0:[[810, 1020]]};
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function hora(m){ m = m % 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function alas(m){ return (Math.floor((m % 1440) / 60) === 1 ? 'la ' : 'las ') + hora(m); }
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
    for (var k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.m > 0)
        return {abierto:false, jornada:t.d, detalle:(k === 0 ? 'abrimos hoy a ' : k === 1 ? 'abrimos mañana a ' : 'abrimos el ' + DIAS[dia] + ' a ') + alas(tr[i][0])};
    }
    return {abierto:false, jornada:t.d, detalle:'llámanos al 654 07 88 23'};
  }
  /* M86 anillo-horario: arcos de la jornada (0 h arriba), punto de la hora y horas de los extremos en el grande */
  function punto(r, m){ var a = m / 1440 * 2 * Math.PI; return (50 + r * Math.sin(a)).toFixed(3) + ' ' + (50 - r * Math.cos(a)).toFixed(3); }
  function arco(r, a, b){ return 'M' + punto(r, a) + 'A' + r + ' ' + r + ' 0 ' + (b - a > 720 ? 1 : 0) + ' 1 ' + punto(r, b); }
  function nodo(tag, at){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  var anillos = [].map.call(document.querySelectorAll('.ah'), function(ah){
    var svg = ah.querySelector('.ah-anillo'), mini = ah.getAttribute('data-tam') === 'mini';
    var grupo = nodo('g', {'class':'ah-tramos'}), aguja = nodo('g', {'class':'ah-ahora'});
    aguja.appendChild(nodo('circle', {'class':'ah-halo', cx:50, cy:4, r:mini ? 9 : 6}));
    aguja.appendChild(nodo('circle', {'class':'ah-punto', cx:50, cy:4, r:mini ? 6 : 3.4}));
    svg.appendChild(grupo); svg.appendChild(aguja);
    if (!reducido) ah.classList.add('ah-dibuja');
    if ('IntersectionObserver' in window){
      var visto = false;
      new IntersectionObserver(function(es){ es.forEach(function(en){
        ah.classList.toggle('ah-fuera', !en.isIntersecting);
        if (en.isIntersecting && !visto){ visto = true; requestAnimationFrame(function(){ ah.classList.add('ah-visto'); }); }
      }); }, {threshold:.5}).observe(ah);
    } else ah.classList.add('ah-visto');
    return {ah:ah, grupo:grupo, aguja:aguja, mini:mini, firma:''};
  });
  var estados = document.querySelectorAll('[data-estado-hoy]'), dias = document.getElementById('dias'), filas = dias ? dias.querySelectorAll('[data-dia]') : [];
  function pintar(){
    var t = ahora(), e = estado(t), w = e.abierto ? 'Abierto' : 'Cerrado', tramos = HORARIO[e.jornada] || [];
    [].forEach.call(estados, function(el){
      var pa = el.querySelector('.estado-palabra'), de = el.querySelector('.estado-detalle');
      if (pa.textContent !== w) pa.textContent = w;
      if (de.textContent !== e.detalle) de.textContent = e.detalle;
      el.setAttribute('data-e', e.abierto ? 'abierto' : 'cerrado');
    });
    if (dias) dias.setAttribute('data-e', e.abierto ? 'abierto' : 'cerrado');
    [].forEach.call(filas, function(f){
      var es = +f.getAttribute('data-dia') === t.d, et = f.querySelector('.hoy-et');
      f.classList.toggle('hoy', es);
      if (es && !et){ et = document.createElement('span'); et.className = 'hoy-et'; et.textContent = 'Hoy'; f.querySelector('dt').appendChild(et); }
      if (!es && et) et.remove();
    });
    anillos.forEach(function(a){
      a.ah.setAttribute('data-estado', e.abierto ? 'abierto' : 'cerrado');
      a.aguja.style.rotate = (t.m / 1440 * 360).toFixed(2) + 'deg';
      var f = e.jornada + ':' + JSON.stringify(tramos);
      if (f !== a.firma){
        a.firma = f; a.grupo.textContent = '';
        [].forEach.call(a.ah.querySelectorAll('.ah-hora'), function(n){ n.remove(); });
        var usados = [];
        tramos.forEach(function(tr){
          a.grupo.appendChild(nodo('path', {'class':'ah-tramo', d:arco(46, tr[0], tr[1]), pathLength:1}));
          if (a.mini) return;
          [tr[0], tr[1]].forEach(function(m){
            var g = (m % 1440) / 4;
            if (usados.some(function(u){ var d = Math.abs(u - g) % 360; return Math.min(d, 360 - d) < 22; })) return;
            usados.push(g);
            var s = document.createElement('span'); s.className = 'ah-hora'; s.setAttribute('aria-hidden', 'true'); s.textContent = hora(m);
            s.style.setProperty('--sx', Math.sin(g * Math.PI / 180).toFixed(4)); s.style.setProperty('--cy', Math.cos(g * Math.PI / 180).toFixed(4));
            a.ah.appendChild(s);
          });
        });
      }
      a.ah.classList.add('ah-listo');
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

  /* ================= M10 al verse, por tiempo (nada ligado al scroll): fotos que se destapan, bloques que suben, fila de hoy ================= */
  document.querySelectorAll('.cab-sec, .plato-txt, .encargo, .datos, .faq, .reservar-texto, .horario-lista').forEach(function(el){ el.classList.add('aparece'); });
  document.querySelectorAll('.diptico .revela').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 80) + 'ms'); });
  document.querySelectorAll('.bento > .revela').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 70) + 'ms'); });
  var unaVez = document.querySelectorAll('.aparece, .revela, #dias');
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

  /* ================= Parallax de las palabras gigantes (M15, data-px): SOLO desde 900 px (en móvil, quietas) ================= */
  if (!reducido){
    var capas = [].slice.call(document.querySelectorAll('[data-px]')), pend = null, ancho = matchMedia('(min-width: 900px)');
    var mover = function(){ pend = null; var vh = innerHeight;
      if (!ancho.matches){ capas.forEach(function(el){ el.style.translate = ''; }); return; }
      capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0'; }); };
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
    ['inicio','lo-que-mas-se-pide','carta','en-la-mesa','opiniones','reservar','ubicacion','preguntas'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
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
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Restaurante Manda Carallo, Calle Carabanchel 12, 28903 Getafe') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Manda Carallo'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
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

  /* ================= Visor de fotos (galeria-lightbox v3: grupo, imagen grande y pie) con la miniatura que crece hasta la
     grande (M51, transiciones-vista). Sin View Transitions o con movimiento reducido, se abre sin transición. ================= */
  var visor = document.getElementById('visor');
  if (visor && visor.showModal){
    var grande = visor.querySelector('img'), pie = visor.querySelector('figcaption'), grupo = [], i = 0, origen = null;
    var vt = typeof document.startViewTransition === 'function' && !reducido;
    var fotos = [].slice.call(document.querySelectorAll('.foto-btn'));
    function mostrar(k){
      i = (k + grupo.length) % grupo.length; var b = grupo[i];
      grande.src = b.getAttribute('data-grande') || b.querySelector('img').src; grande.alt = b.querySelector('img').alt;
      pie.textContent = b.getAttribute('data-pie') + ' (' + (i + 1) + ' de ' + grupo.length + ')';
    }
    function abrir(b){
      origen = b; var g = b.getAttribute('data-galeria');
      grupo = fotos.filter(function(f){ return f.getAttribute('data-galeria') === g; });
      var mini = b.querySelector('img');
      var hacer = function(){ mini.style.viewTransitionName = ''; mostrar(grupo.indexOf(b)); grande.style.viewTransitionName = 'foto-grande'; visor.showModal(); };
      if (vt){ mini.style.viewTransitionName = 'foto-grande'; document.startViewTransition(hacer); } else hacer();
    }
    function cerrar(){
      var mini = origen && origen.querySelector('img');
      var hacer = function(){ grande.style.viewTransitionName = ''; visor.close(); if (mini && grupo[i] === origen) mini.style.viewTransitionName = 'foto-grande'; };
      if (vt){ var t = document.startViewTransition(hacer); t.finished.then(function(){ if (mini) mini.style.viewTransitionName = ''; }); } else hacer();
    }
    fotos.forEach(function(b){ b.addEventListener('click', function(){ abrir(b); }); });
    visor.querySelectorAll('[data-ir]').forEach(function(b){ b.addEventListener('click', function(){ mostrar(i + +b.getAttribute('data-ir')); }); });
    visor.querySelector('[data-cerrar]').addEventListener('click', cerrar);
    visor.addEventListener('cancel', function(e){ e.preventDefault(); cerrar(); });
    visor.addEventListener('click', function(e){ if (e.target === visor) cerrar(); });
    visor.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') mostrar(i + 1); if (e.key === 'ArrowLeft') mostrar(i - 1); });
    visor.addEventListener('close', function(){ if (origen) origen.focus({preventScroll:true}); });
  }
})();

/* COPIA LITERAL de 01-Libreria-de-Codigo/componentes/espolvoreado.html (M91 v1.1; el JS no cambia desde v1): no editar aquí, se cambia allí y se vuelve a copiar */
/* espolvoreado (M91) · v1 */
(function(){
  var D = document, H = D.documentElement; if (!H.classList.contains('js')) return;
  var red = matchMedia('(prefers-reduced-motion: reduce)').matches || H.classList.contains('esp-simula-reducido');
  function v(e, p, d){ var x = parseFloat(getComputedStyle(e).getPropertyValue(p)); return isNaN(x) ? d : x; }
  function az(e){ return (e._r = (e._r * 9301 + 49297) % 233280) / 233280; }
  function visto(e, p){ var k = 'esp:' + location.pathname + ':' + e._id;
    try { if (p) sessionStorage.setItem(k, 1); else return sessionStorage.getItem(k) == '1'; } catch(_){} }
  function lim(e, x){ var w = e.offsetWidth || 1; return Math.max(400 / w, Math.min(100 - 900 / w, x)).toFixed(1); }
  function alto(e){   /* cuánto pueden caer: --esp-alto, sin pasar por encima del bloque o de data-esp-evitar */
    var a = parseFloat(getComputedStyle(e._g).scrollMarginTop) || 0, s = e.getAttribute('data-esp-evitar'),
        b = e.getBoundingClientRect().top, m = -1e9;
    [].forEach.call(s ? D.querySelectorAll(s) : [e.parentNode], function(z){ var r = z.getBoundingClientRect();
      if (!s) m = r.top; else if (r.bottom <= b + 1) m = Math.max(m, r.bottom); });
    return Math.max(0, Math.min(a, b - m));
  }
  function grano(e, x, y, t, c, q, A){   /* x, y en % de la palabra; t retraso; c caída (ms); q se queda posado */
    var i = D.createElement('i'), s = e._s;
    i.style.cssText = 'left:' + x + '%;top:' + y + '%;--k:' + az(e).toFixed(2);
    e._g.appendChild(i);
    if (!c){ i.style.opacity = .85; return s.p.push(i); }
    var T = c + (q ? 0 : 220), a = i.animate([
      {opacity:0, translate:(az(e) * 8 - 4).toFixed(1) + 'px ' + (-A - y * e.offsetHeight / 100).toFixed(1) + 'px'},
      {opacity:1, offset:80 / T}, {opacity:1, translate:'0 0', offset:c / T}, {opacity:q ? .85 : 0, translate:'0 0'}],
      {duration:T, delay:t, fill:'both'});
    s.a.push(a);
    a.onfinish = function(){ s.a.splice(s.a.indexOf(a), 1); if (!q) return i.remove();
      i.style.opacity = .85; a.cancel(); s.p.push(i);
      if (s.p.length > 40){ var o = s.p.shift(); o.animate({opacity:[.85, 0]}, 220).onfinish = function(){ o.remove(); }; } };
  }
  function pizca(e, x){ var c0 = v(e, '--esp-caida-min', 420), c1 = v(e, '--esp-caida-max', 560), P = v(e, '--esp-posados', .3), A = alto(e);
    for (var k = 0; k < 10; k++) grano(e, lim(e, x * 100 + (az(e) - .5) * 24), 20 + az(e) * 55, az(e) * 200, c0 + az(e) * (c1 - c0), az(e) < P, A); }
  function para(e){ var s = e._s; s.t.forEach(clearTimeout); s.a.slice().forEach(function(a){ a.cancel(); }); s.t = []; s.a = []; removeEventListener('resize', s.rs); }
  function fin(e, g){   /* estado final; con g, salto: fuera lo que cae y 12 granos ya posados */
    var s = e._s; para(e);
    if (g){ e._g.textContent = ''; s.p = []; if (!red) for (var k = 0; k < 12; k++) grano(e, lim(e, az(e) * 100), 20 + az(e) * 55); }
    e.classList.add('esp-hecho'); s.ok = 1;
    if (!s.li){ s.li = 1; e.dispatchEvent(new CustomEvent('espolvoreado:listo', {bubbles:true})); }
  }
  function corre(e, o){
    o = o || {}; var s = e._s, tn = e.querySelector('.esp-tinte');
    if (o.pizca) return red || pizca(e, o.x == null ? .5 : o.x);
    if (s.on && !o.repetir) return;
    if (s.on){ para(e); e._g.textContent = ''; s.p = []; e.classList.remove('esp-hecho'); s.ok = s.li = 0; }
    s.on = 1; e._r = e._sem;
    if (!o.repetir && e.getAttribute('data-una-vez') == 'sesion' && visto(e)) return fin(e);
    visto(e, 1);
    if (!o.repetir && D.hidden) return fin(e, 1);
    if (red){ e.classList.add('esp-hecho'); if (tn) s.a.push(tn.animate({opacity:[0, 1]}, 300)); return s.t.push(setTimeout(function(){ fin(e); }, 300)); }
    var m = innerWidth < 641, n = Math.min(60, +e.getAttribute(m ? 'data-esp-n-movil' : 'data-esp-n') || (m ? 30 : 48)),
        B = v(e, '--esp-barrido', 900), r0 = v(e, '--esp-retraso', 250), c0 = v(e, '--esp-caida-min', 420), c1 = v(e, '--esp-caida-max', 560),
        P = v(e, '--esp-posados', .3), dr = v(e, '--esp-direccion', 1) < 0, A = alto(e), w = innerWidth, f = r0 + c0 + B;
    for (var k = 0; k < n; k++){
      var p = k / (n - 1 || 1), t = Math.max(0, r0 + p * B + (az(e) - .5) * 120), c = c0 + az(e) * (c1 - c0);
      grano(e, lim(e, (dr ? 1 - p : p) * 100 + (az(e) - .5) * 16), 20 + az(e) * 55, t, c, az(e) < P, A); f = Math.max(f, t + c);
    }
    if (tn) s.a.push(s.ta = tn.animate({clipPath:[dr ? 'inset(-20% -6% -20% 106%)' : 'inset(-20% 106% -20% -6%)', 'inset(-20% -6% -20% -6%)']},
      {duration:B, delay:r0 + c0, fill:'both'}));
    s.t.push(setTimeout(function(){ removeEventListener('resize', s.rs); e.classList.add('esp-hecho'); if (s.ta) s.ta.cancel();
      s.ok = s.li = 1; e.dispatchEvent(new CustomEvent('espolvoreado:listo', {bubbles:true})); }, f));
    s.rs = function(){ if (innerWidth != w) fin(e, 1); }; addEventListener('resize', s.rs);
  }
  window.espolvorear = function(e, o){ if (e && e._s) corre(e, o); };

  [].forEach.call(D.querySelectorAll('.esp'), function(e, k){
    e._id = e.id || k; e._sem = e._r = k * 977 + 7; e._s = {t:[], a:[], p:[]};
    if (!e.hasAttribute('data-esp-sin-tinte')){ var t = D.createElement('span'); t.className = 'esp-tinte'; t.setAttribute('aria-hidden', 'true'); t.innerHTML = e.innerHTML; e.appendChild(t); }
    var g = e._g = D.createElement('span'); g.className = 'esp-granos'; g.setAttribute('aria-hidden', 'true'); e.appendChild(g);
    var m = e.getAttribute('data-espolvorear') || 'carga';
    if (m == 'carga' || (e.getAttribute('data-una-vez') == 'sesion' && visto(e))) corre(e);
    else if (m == 'al-ver'){
      if (!window.IntersectionObserver) corre(e);
      else { var io = new IntersectionObserver(function(x){ if (x[0].isIntersecting){ io.disconnect(); corre(e); } }, {threshold:.6}); io.observe(e); }
    }
    if (e.hasAttribute('data-esp-hover') && !red && matchMedia('(hover:hover) and (pointer:fine)').matches)
      e.addEventListener('pointerenter', function(x){ var s = e._s, h = Date.now(), b;
        if (x.pointerType != 'mouse' || !s.ok || h - s.h < 1500) return;
        s.h = h; b = e.getBoundingClientRect(); pizca(e, (x.clientX - b.left) / b.width); });
  });
})();
