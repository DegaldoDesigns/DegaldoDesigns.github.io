/* Majús Restaurante (Parla) · demo de Degaldo Designs (2026-10-22)
   Piezas de la librería adaptadas: trazo-neon (M83, firma) dentro de luces-sobre-foto (M81), titulares-animados (M01),
   contador-cifras (M05), cabecera-inteligente (M18), enlaces-hover (M61), menu-escalonado (M52), lista-foto-hover (M32),
   hoja-sobre-foto (M22, en CSS), menu-tabs-categorias + resaltado-deslizante (M53) + transiciones-vista (carta),
   sello-circular (M16, en CSS), texto-revelado-scroll (M14), decoracion-parallax (M15), interacciones-cursor v3 (M30),
   ubicacion-mapa v3, acordeon-nativo y barra-pegajosa-movil.
   Nuevo en este proyecto (sacado a la librería): titular-entre-filetes (M71), marco-dibujado (M70) y reserva-cita v2
   (WhatsApp con el mensaje de reserva ya escrito). */
(function(){
  'use strict';
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;
  var TEL = '624 04 13 03';

  /* ================= Horario (hora de Madrid) =================
     Tramos en minutos desde las 0:00 (0 = domingo). Cierre a las 00:00 = minuto 1440 del mismo día (no cruza la medianoche).
     CONFIRMAR CON EL CLIENTE: es el horario de Google Maps (miércoles cerrado). Los festivos no se calculan: nunca "hoy no hay servicio".
     Si cambia, cambiarlo también en el HTML: lista de días, pie, JSON-LD, textos de horario y FAQ. */
  var TRAMOS = {0:[[540,1440]], 1:[[480,1440]], 2:[[480,1440]], 3:[], 4:[[480,1440]], 5:[[480,1440]], 6:[[540,1440]]};
  var DESAYUNOS = [510, 720];   /* 8:30 a 12:00, carta de Instagram (17-09-2026); CONFIRMAR */
  var NOMBRES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var DIAS = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
  function hora(m){ if (m >= 1440) return '00:00'; var h = Math.floor(m / 60), mi = m % 60; return h + ':' + (mi < 10 ? '0' : '') + mi; }
  function ahora(){
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {dia: DIAS[p.weekday], min: (+p.hour % 24) * 60 + (+p.minute)};
    } catch(e){ var d = new Date(); return {dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes()}; }
  }
  function estado(n){
    n = n || ahora();
    var hoy = TRAMOS[n.dia], i, t;
    for (i = 0; i < hoy.length; i++){ t = hoy[i]; if (n.min >= t[0] && n.min < t[1]) return {abierto:true, n:n, cierra:t[1]}; }
    for (var k = 0; k < 8; k++){
      var d = (n.dia + k) % 7;
      for (i = 0; i < TRAMOS[d].length; i++){ t = TRAMOS[d][i]; if (k * 1440 + t[0] > n.min) return {abierto:false, n:n, k:k, dia:d, abre:t[0]}; }
    }
    return {abierto:false, n:n, k:0, dia:n.dia, abre:0};
  }
  /* "hoy", "mañana" o "el jueves" (de madrugada, "mañana" confunde: se dice el día) */
  function cuando(e){ if (e.k === 0) return 'hoy'; if (e.k === 1 && e.n.min >= 360) return 'mañana'; return 'el ' + NOMBRES[e.dia]; }
  function enDesayunos(n){ return n.min >= DESAYUNOS[0] && n.min < DESAYUNOS[1]; }
  window.MajusHorario = {estado:estado, cuando:cuando};   /* para las pruebas con el reloj falseado */

  function pintarEstado(){
    var e = estado(), clave = e.abierto ? 'abierto' : 'cerrado';
    var titulo = e.abierto ? 'Abierto · hasta las ' + hora(e.cierra) : 'Cerrado · abrimos ' + cuando(e) + ' a las ' + hora(e.abre);
    var detalle = e.abierto && enDesayunos(e.n) ? 'Desayunos hasta las 12:00' : 'Reservas: ' + TEL;
    $$('[data-viva]').forEach(function(v){
      v.dataset.estado = clave;
      var t = v.querySelector('[data-viva-titulo]'), d = v.querySelector('[data-viva-detalle]');
      if (t) t.textContent = titulo; if (d) d.textContent = detalle;
    });
    $$('.nm').forEach(function(m){ if (m.getAttribute('data-estado') !== clave) m.setAttribute('data-estado', clave); });
    var sec = document.getElementById('horario');
    if (sec){
      sec.dataset.estado = clave;
      var he = sec.querySelector('[data-horario-estado]');
      if (he) he.textContent = e.abierto ? 'Abierto ahora, hasta las ' + hora(e.cierra) + '.' : 'Cerrado ahora. Abrimos ' + cuando(e) + ' a las ' + hora(e.abre) + '.';
      ordenarDias(e);
    }
    var fh = document.querySelector('[data-final-hoy]');
    if (fh) fh.textContent = (e.abierto ? 'Abierto hasta las ' + hora(e.cierra) : 'Abrimos ' + cuando(e) + ' a las ' + hora(e.abre)) + ' · ' + TEL;
  }
  function ordenarDias(e){
    var lista = document.getElementById('dias'); if (!lista) return;
    var filas = $$('.dia', lista), j = e.n.dia;
    filas.sort(function(a, b){ return ((+a.dataset.dia - j + 7) % 7) - ((+b.dataset.dia - j + 7) % 7); });
    filas.forEach(function(f){
      var hoy = +f.dataset.dia === j, nom = f.querySelector('.dia-nombre'), et = nom.querySelector('small');
      f.classList.toggle('hoy', hoy);
      if (hoy && !et){ et = document.createElement('small'); et.textContent = 'Hoy'; nom.insertBefore(et, nom.firstChild); }
      if (!hoy && et) et.remove();
      lista.appendChild(f);
    });
  }
  pintarEstado();
  setInterval(pintarEstado, 30000);

  /* Mini neón: prende con un parpadeo la primera vez que se ve (el estado lo pone pintarEstado) */
  function alVerUnaVez(els, fn, opciones){
    if (!conIO || reducido){ els.forEach(fn); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(x){ if (x.isIntersecting){ fn(x.target); io.unobserve(x.target); } }); }, opciones || {rootMargin:'0px 0px -10% 0px'});
    els.forEach(function(el){ io.observe(el); });
  }
  alVerUnaVez($$('.nm'), function(m){ m.classList.add('on'); });

  /* ================= Titulares por palabras (titulares-animados, M01) ================= */
  $$('.titular-palabras').forEach(function(h){
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
            p.style.setProperty('--i', Math.min(n++, 12)); v.appendChild(p); frag.appendChild(v);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1){ partir(hijo); }
      });
    })(h);
  });

  /* Las cifras de Google (4,7 · 503) se enseñan quietas: contar desde otro valor enseñaba datos falsos medio segundo. */

  /* ================= luces-sobre-foto (M81 v2) · copiado de la librería ================= */
  var Luces = (function(){
    var rejilla = /[?&]rejilla(=|&|$)/.test(location.search);
    function pieza(clase){ var s = document.createElement('span'); s.className = clase; return s; }
    function orden(l, k){ var v = parseFloat(l.style.getPropertyValue('--i')); return isNaN(v) ? k : v; }
    function ms(el, prop, def){ var v = parseFloat(getComputedStyle(el).getPropertyValue(prop)); return isNaN(v) ? def : v; }
    function montar(el){
      if (el._luces) return el._luces;
      var img = el.querySelector('.luces-caja > img');
      var luces = $$('.luz', el).map(function(l, k){
        l.setAttribute('aria-hidden', 'true');
        var t = pieza('luz-tulipa'), c = document.createElement('img');
        ['src', 'srcset', 'sizes', 'width', 'height', 'loading'].forEach(function(a){ if (img.hasAttribute(a)) c.setAttribute(a, img.getAttribute(a)); });
        c.alt = ''; c.decoding = 'async'; t.appendChild(c);
        if (l.hasAttribute('data-cono')) l.appendChild(pieza('luz-cono'));
        l.appendChild(t); l.appendChild(pieza('luz-halo'));
        l.setAttribute('data-n', orden(l, k));
        return l;
      });
      luces.sort(function(a, b){ return orden(a, 0) - orden(b, 0); });
      el._luces = luces;
      if (rejilla) ponerRejilla(el);
      return luces;
    }
    function encender(el, cuales){
      var luces = montar(el);
      var paso = reducido ? 0 : ms(el, '--paso', 170), prende = reducido ? 0 : ms(el, '--prende', 260);
      var nuevas = luces.filter(function(l){ return !l.classList.contains('on') && (!cuales || cuales.indexOf(orden(l, 0)) > -1); });
      nuevas.forEach(function(l, k){ l.style.setProperty('--d', (k * paso) + 'ms'); l.classList.add('on'); });
      if (nuevas.length) el.classList.add('previa');
      if (luces.every(function(l){ return l.classList.contains('on'); }) && !el.classList.contains('encendidas')){
        el.style.setProperty('--velo-d', (nuevas.length ? (nuevas.length - 1) * paso + prende : 0) + 'ms');
        el.classList.add('encendidas');
      }
    }
    function ponerRejilla(el){
      el.classList.add('luces-rejilla');
      var caja = el.querySelector('.luces-caja');
      var capa = pieza('luces-rejilla-capa'); capa.style.cssText = 'position:absolute;inset:0;z-index:5;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(255,255,255,.55) 0 1px,transparent 1px 10%),repeating-linear-gradient(0deg,rgba(255,255,255,.55) 0 1px,transparent 1px 10%)';
      caja.appendChild(capa);
      $$('.luz', el).forEach(function(l){ l.style.outline = '1px dashed #0ff'; l.style.zIndex = 6; });
      caja.addEventListener('click', function(e){
        var r = caja.getBoundingClientRect();
        console.info('[luces-sobre-foto] --x:' + ((e.clientX - r.left) / r.width * 100).toFixed(1) + '; --y:' + ((e.clientY - r.top) / r.height * 100).toFixed(1));
      });
    }
    window.encenderLuces = encender;
    $$('.luces').forEach(function(el){ montar(el); if (rejilla) encender(el); });
    return {montar:montar, encender:encender, rejilla:rejilla};
  })();

  /* ================= Portada: preparar la coreografía (antes de que trazo-neon arranque) ================= */
  var portada = document.querySelector('.portada'), firma = document.getElementById('firma');
  if (portada){
    var lucesP = portada.querySelector('.luces'), fotoP = portada.querySelector('.luces-caja > img');
    if (Luces.rejilla){ portada.classList.add('foto-ve'); if (firma) firma.style.display = 'none'; }
    /* Cuando el neón dibujado se enciende: la foto real aparece por debajo (si ya está decodificada; si no, se espera
       como mucho 1,5 s; y si sigue sin estar, el neón dibujado se queda encendido: nunca un hueco). */
    if (firma && !Luces.rejilla){
      firma.addEventListener('trazo:encendido', function(){
        var hecho = false;
        function revelar(){
          if (hecho) return; hecho = true;
          portada.classList.add('foto-ve'); encenderLuces(lucesP);
          setTimeout(function(){ firma.classList.add('tn-entregado'); }, reducido ? 0 : 600);
        }
        if (fotoP.complete && fotoP.naturalWidth) revelar();
        else {
          var listo = function(){ if (fotoP.naturalWidth) revelar(); };
          if (fotoP.decode) fotoP.decode().then(listo, function(){});
          fotoP.addEventListener('load', listo);
          setTimeout(function(){ if (!hecho) fotoP.removeEventListener('load', listo); if (!hecho) hecho = true; }, 1500);
        }
      });
    }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      $$('.titular-palabras', portada).forEach(function(h){ h.classList.add('visto'); });
    }); });
  }

  /* ================= trazo-neon (M83 v1) · copiado de la librería ================= */
  (function(){
    var NS = 'http://www.w3.org/2000/svg', n = 0;
    function ms(el, p){ var v = getComputedStyle(el).getPropertyValue(p).trim(); return parseFloat(v) * (/[^m]s$/.test(v) ? 1000 : 1) || 0; }
    function nodo(tag, at, padre){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); if (padre) padre.appendChild(e); return e; }
    function inv(f){ var lo = 0, hi = 1, s, b = function(t, p1, p2){ var u = 1 - t; return 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t; };
      for (var i = 0; i < 24; i++){ s = (lo + hi) / 2; if (b(s, 0, 1) < f) lo = s; else hi = s; } return b(s, .77, .175); }
    function montar(el){
      if (el._tn) return;
      var svg = el.querySelector('svg'), id = 'tn' + (++n), defs = nodo('defs', {}, null), g = nodo('g', {'class':'tn-apagado'}, null);
      var gr = ms(el, '--tn-grosor') || 6;
      nodo('feGaussianBlur', {stdDeviation: gr * .9}, nodo('filter', {id:id + '-f', x:'-20%', y:'-40%', width:'140%', height:'180%'}, defs));
      var luz = {u: nodo('g', {'class':'tn-luz tn-luz-u'}, null), ab: nodo('g', {'class':'tn-luz tn-luz-ab'}, null)};
      var tramos = {};
      ['a', 'b', 'union'].forEach(function(k){
        var p = svg.querySelector('path[data-tn="' + k + '"]'); if (!p) return;
        var c = k === 'union' ? 'u' : k, gk = nodo('g', {'class':'tn-' + c}, g), subs = [];
        p.id = id + '-' + c; p.removeAttribute('data-tn'); defs.appendChild(p);
        (p.getAttribute('d').match(/[Mm][^Mm]*/g) || []).forEach(function(d){ subs.push(nodo('path', {d:d, pathLength:1}, gk)); });
        tramos[k] = subs;
        var lg = nodo('g', {'class':'tn-' + c}, k === 'union' ? luz.u : luz.ab);
        [['tn-halo', 1], ['tn-tubo'], ['tn-nucleo']].forEach(function(cap){
          var u = nodo('use', {href:'#' + p.id, 'class':cap[0]}, lg); if (cap[1]) u.setAttribute('filter', 'url(#' + id + '-f)'); });
      });
      svg.appendChild(defs); svg.appendChild(g); svg.appendChild(luz.ab); svg.appendChild(luz.u);
      (el.getAttribute('data-contacto') || '').split(/\s+/).forEach(function(pt){
        var xy = pt.split(','); if (xy.length === 2) nodo('circle', {cx:xy[0], cy:xy[1], r:gr * 2.2, 'class':'tn-contacto', filter:'url(#' + id + '-f)'}, svg); });
      var ini = ms(el, '--tn-retraso'), dib = ms(el, '--tn-dibujo'), uni = ms(el, '--tn-union-t');
      Object.keys(tramos).forEach(function(k){
        var subs = tramos[k], L = subs.map(function(s){ return s.getTotalLength ? s.getTotalLength() : 1; });
        var tot = L.reduce(function(a, b){ return a + b; }, 0) || 1, acc = 0;
        var t0 = k === 'union' ? ini + dib : ini, dur = k === 'union' ? uni : dib;
        subs.forEach(function(s, i){
          var a = inv(acc / tot) * dur; acc += L[i]; var b = inv(acc / tot) * dur;
          s.style.setProperty('--d', Math.round(t0 + a) + 'ms'); s.style.setProperty('--t', Math.max(1, Math.round(b - a)) + 'ms');
        });
      });
      el._tn = {fin: ini + dib + uni + (el.classList.contains('tn-dia') ? 0 : ms(el, '--tn-encendido'))};
    }
    function clave(el){ return 'tn:' + location.pathname + ':' + (el.id || [].indexOf.call(document.querySelectorAll('.tn'), el)); }
    function visto(el, poner){ try { if (poner) sessionStorage.setItem(clave(el), '1'); else return sessionStorage.getItem(clave(el)) === '1'; } catch(e){ return false; } }
    function avisar(el){ el.classList.add('tn-encendido'); el.dispatchEvent(new CustomEvent('trazo:encendido', {bubbles:true})); }
    function iniciar(el){
      montar(el); if (el.classList.contains('tn-on')) return;
      var directo = el.getAttribute('data-una-vez') === 'sesion' && visto(el);
      if (directo) el.classList.add('tn-final');
      el.classList.add('tn-on'); visto(el, true);
      if (directo || reducido) el._tn.t = setTimeout(function(){ avisar(el); }, 0);
      else el._tn.t = setTimeout(function(){ avisar(el); }, el._tn.fin);
    }
    window.TrazoNeon = {iniciar:iniciar};
    if (Luces.rejilla) return;
    $$('.tn').forEach(function(el){
      montar(el);
      var modo = el.getAttribute('data-trazo') || 'carga';
      if (modo === 'carga') iniciar(el);
      else if (modo === 'al-ver'){
        if (!conIO) return iniciar(el);
        var io = new IntersectionObserver(function(es){ if (es[0].intersectionRatio >= .4){ io.disconnect(); iniciar(el); } }, {threshold:[0, .4, .8]});
        io.observe(el);
      }
    });
  })();

  /* ================= Entradas al bajar (M10), filetes de los titulares, marco de la carta, manos del final ================= */
  $$('.faq').forEach(function(g){ $$('.reveal', g).forEach(function(el, i){ el.style.setProperty('--retraso', Math.min(i, 6) * 50 + 'ms'); }); });
  alVerUnaVez($$('.reveal, .tf, .final-manos'), function(el){ el.classList.add('visto'); }, {rootMargin:'0px 0px -8% 0px'});
  alVerUnaVez($$('[data-mg]'), function(el){ el.classList.add('on'); }, {rootMargin:'0px 0px -25% 0px'});

  /* ================= marco-dibujado (M70): dos medios marcos desde el centro de arriba hasta el de abajo ================= */
  (function(){
    var NS = 'http://www.w3.org/2000/svg';
    $$('[data-marco]').forEach(function(el){
      var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'md-svg'); svg.setAttribute('aria-hidden', 'true');
      var der = document.createElementNS(NS, 'path'), izq = document.createElementNS(NS, 'path');
      [der, izq].forEach(function(p){ p.setAttribute('pathLength', '1'); svg.appendChild(p); });
      el.insertBefore(svg, el.firstChild);
      function trazar(){
        var cs = getComputedStyle(el), i = parseFloat(cs.getPropertyValue('--md-inset')) || 0, r = parseFloat(cs.getPropertyValue('--md-radio')) || 0;
        var w = el.offsetWidth, h = el.offsetHeight, x0 = i, y0 = i, x1 = w - i, y1 = h - i, cx = w / 2;
        r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        der.setAttribute('d', 'M' + cx + ' ' + y0 + 'H' + (x1 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x1 + ' ' + (y0 + r) + 'V' + (y1 - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x1 - r) + ' ' + y1 + 'H' + cx);
        izq.setAttribute('d', 'M' + cx + ' ' + y0 + 'H' + (x0 + r) + 'A' + r + ' ' + r + ' 0 0 0 ' + x0 + ' ' + (y0 + r) + 'V' + (y1 - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + (x0 + r) + ' ' + y1 + 'H' + cx);
      }
      trazar();
      if ('ResizeObserver' in window) new ResizeObserver(trazar).observe(el); else addEventListener('resize', trazar);
      alVerUnaVez([el], function(){ el.classList.add('visto'); }, {threshold:0, rootMargin:'0px 0px -20% 0px'});
    });
  })();

  /* ================= Pausa fuera de pantalla de los bucles (respiración del neón de la portada) ================= */
  $$('.mov').forEach(function(m){
    if (!conIO){ m.classList.add('en-pantalla'); return; }
    new IntersectionObserver(function(es){ m.classList.toggle('en-pantalla', es[0].isIntersecting); }).observe(m);
  });

  /* ================= Fondo vivo (M82 v3): el brillo solo respira con su sección en pantalla ================= */
  $$('.fondo-vivo').forEach(function(f){
    if (!conIO){ f.classList.add('en-pantalla'); return; }
    new IntersectionObserver(function(es){ f.classList.toggle('en-pantalla', es[0].isIntersecting); }).observe(f);
  });

  /* ================= Barra fija del móvil: no se enseña mientras se ven los botones de la portada (sin animación) ================= */
  var barraM = document.getElementById('barraMovil'), accP = document.querySelector('.portada-acciones');
  if (barraM && accP && conIO){
    new IntersectionObserver(function(es){ barraM.classList.toggle('con-portada', es[0].isIntersecting); }).observe(accP);
  }

  /* ================= Cabecera inteligente (M18) + sección activa con el subrayado (M61) ================= */
  var cab = document.getElementById('cabecera');
  if (cab){
    if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && conIO){
      new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(document.querySelector('.centinela'));
    }
    var ultimo = scrollY, pendC = false;
    addEventListener('scroll', function(){
      if (pendC) return; pendC = true;
      requestAnimationFrame(function(){ pendC = false; var y = scrollY, d = y - ultimo; if (Math.abs(d) < 8) return;
        if (y < 120 || d < 0) cab.classList.remove('oculta'); else cab.classList.add('oculta'); ultimo = y; });
    }, {passive:true});
  }
  if (conIO){
    var enlaces = $$('.nav .enl'), visibles = {};
    var ioNav = new IntersectionObserver(function(es){
      es.forEach(function(e){ visibles[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var mejor = null, max = 0; Object.keys(visibles).forEach(function(id){ if (visibles[id] > max){ max = visibles[id]; mejor = id; } });
      enlaces.forEach(function(a){ if (a.getAttribute('href') === '#' + mejor) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }, {rootMargin:'-30% 0px -50% 0px', threshold:[0, .1, .25, .5, .75, 1]});
    enlaces.forEach(function(a){ var s = document.querySelector(a.getAttribute('href')); if (s) ioNav.observe(s); });
  }

  /* ================= Menú móvil en círculo (menu-escalonado, M52) ================= */
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb');
  if (menu && hamb && typeof menu.showPopover === 'function'){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){ var ab = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(ab)); hamb.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú'); if (!ab) hamb.focus(); });
    $$('a', menu).forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* ================= De lo que más se habla: foto que sigue al cursor (lista-foto-hover, M32) ================= */
  $$('[data-lista-foto]').forEach(function(lista){
    var filas = $$('.tema', lista);
    if (!raton){
      lista.classList.add('tiene-mini');
      filas.forEach(function(f){
        var m;
        if (f.dataset.foto){ m = document.createElement('img'); m.src = f.dataset.foto; m.alt = ''; m.loading = 'lazy'; m.width = 56; m.height = 56; }
        else { m = document.createElement('span'); m.className = 'marca'; m.setAttribute('aria-hidden', 'true');
          m.innerHTML = '<svg viewBox="0 0 100 100"><use href="#anillo"/></svg>'; }
        m.classList.add('mini'); f.insertBefore(m, f.firstChild);
      });
      return;
    }
    var fig = document.createElement('figure'); fig.className = 'flota'; fig.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img'); img.alt = ''; img.width = 240; img.height = 300; fig.appendChild(img); document.body.appendChild(fig);
    var W = 240, H = 300, x = 0, y = 0, tx = 0, ty = 0, rot = 0, raf = null, visible = false;
    function limitar(){ tx = Math.max(12, Math.min(innerWidth - W - 12, tx)); ty = Math.max(12, Math.min(innerHeight - H - 12, ty)); }
    function bucle(){
      var dx = tx - x; x += dx * .18; y += (ty - y) * .18;
      rot += (Math.max(-6, Math.min(6, dx * .08)) - rot) * .2;
      fig.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px'; fig.style.rotate = rot.toFixed(2) + 'deg';
      if (Math.abs(tx - x) < .3 && Math.abs(ty - y) < .3 && Math.abs(rot) < .05 && !visible){ raf = null; return; }
      raf = requestAnimationFrame(bucle);
    }
    function mover(e){
      tx = e.clientX + 28; ty = e.clientY - 40; limitar();
      if (reducido){ x = tx; y = ty; fig.style.translate = x + 'px ' + y + 'px'; return; }
      if (!raf) raf = requestAnimationFrame(bucle);
    }
    filas.forEach(function(f){
      f.addEventListener('pointerenter', function(e){
        if (e.pointerType !== 'mouse') return;
        if (!f.dataset.foto){ fig.classList.remove('ve'); visible = false; return; }
        if (!visible){ tx = e.clientX + 28; ty = e.clientY - 40; limitar(); x = tx; y = ty + 16; }
        img.src = f.dataset.foto; visible = true; fig.classList.add('ve'); mover(e);
      });
      f.addEventListener('pointermove', function(e){ if (e.pointerType === 'mouse' && f.dataset.foto) mover(e); });
    });
    lista.addEventListener('pointerleave', function(){ visible = false; fig.classList.remove('ve'); });
    addEventListener('scroll', function(){ if (visible){ visible = false; fig.classList.remove('ve'); } }, {passive:true});
  });

  /* ================= Resaltado deslizante (M53) en las pestañas de la carta ================= */
  var resaltados = [];
  $$('.resalta').forEach(function(cont){
    var res = cont.querySelector('.resalte'), items = $$('.r-item', cont), actual = null;
    function reposo(){ return cont.querySelector('.r-item[aria-selected="true"]'); }
    function ir(el, sin){
      if (actual) actual.classList.remove('sobre');
      if (!el || !el.offsetWidth){ res.classList.remove('listo'); actual = null; return; }
      var c = cont.getBoundingClientRect(), r = el.getBoundingClientRect();
      var saltar = sin || reducido || !res.classList.contains('listo');
      if (saltar) res.style.transition = 'none';
      res.style.clipPath = 'inset(' + (r.top - c.top) + 'px ' + (c.right - r.right) + 'px ' + (c.bottom - r.bottom) + 'px ' + (r.left - c.left) + 'px round 8px)';
      if (saltar){ void res.offsetWidth; res.style.transition = ''; }
      res.classList.add('listo'); el.classList.add('sobre'); actual = el;
    }
    ir(reposo(), true);
    if (raton){
      items.forEach(function(el){ el.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') ir(el); }); });
      cont.addEventListener('pointerleave', function(){ ir(reposo()); });
    }
    cont.addEventListener('focusin', function(e){ var el = e.target.closest('.r-item'); if (el) ir(el); });
    cont.addEventListener('focusout', function(e){ if (!cont.contains(e.relatedTarget)) ir(reposo()); });
    if ('ResizeObserver' in window) new ResizeObserver(function(){ ir(reposo(), true); }).observe(cont);
    resaltados.push({cont:cont, volver:function(sin){ ir(reposo(), sin); }});
  });
  function volverResaltado(cont, sin){ resaltados.forEach(function(r){ if (r.cont === cont) r.volver(sin); }); }

  /* ================= Carta: pestañas accesibles (menu-tabs-categorias) con View Transition (transiciones-vista) ================= */
  var puedeVT = typeof document.startViewTransition === 'function' && !reducido;
  function conTransicion(cambio, despues){
    if (puedeVT){ var vt = document.startViewTransition(cambio); vt.finished.then(despues, despues); }
    else { cambio(); if (despues) despues(); }
  }
  function entrar(panel){
    if (reducido) return;
    $$('.plato', panel).forEach(function(f, i){ f.style.setProperty('--n', Math.min(i, 16)); });
    panel.classList.remove('entra'); void panel.offsetWidth; panel.classList.add('entra');
  }
  var pestanas = document.querySelector('.pestanas');
  if (pestanas){
    var tabs = $$('[role="tab"]', pestanas);
    var elegir = function(tab, foco, quieto){
      if (tab.getAttribute('aria-selected') === 'true'){ if (foco) tab.focus(); return; }
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      var aplicar = function(){ tabs.forEach(function(t){ var si = t === tab; t.setAttribute('aria-selected', String(si)); t.tabIndex = si ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !si; }); };
      var nota = document.querySelector('[data-pestana-nota]'); if (nota && !quieto) nota.hidden = true;
      if (quieto){ aplicar(); volverResaltado(pestanas, true); }
      else { conTransicion(aplicar, function(){ volverResaltado(pestanas); }); volverResaltado(pestanas); entrar(panel);
        var hoja = document.querySelector('.carta-hoja'), top = panel.getBoundingClientRect().top;
        if (top < 0 && hoja) scrollTo({top: scrollY + top - 140, behavior: reducido ? 'auto' : 'smooth'}); }
      if (foco) tab.focus();
    };
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ elegir(t); });
      t.addEventListener('keydown', function(e){
        var d = null;
        if (e.key === 'ArrowRight') d = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') d = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') d = tabs[0]; else if (e.key === 'End') d = tabs[tabs.length - 1];
        if (d){ e.preventDefault(); elegir(d, true); }
      });
    });
    /* Por defecto, la carta que se sirve ahora (hora de Madrid): antes de las 12:00, los desayunos */
    var ya = ahora(), nota = document.querySelector('[data-pestana-nota]');
    if (estado(ya).abierto && enDesayunos(ya)){ elegir(document.getElementById('p-desayunos-tab'), false, true); if (nota) nota.hidden = false; }
  }

  /* ================= Frase que se enciende con el scroll (texto-revelado-scroll v5, M14) ================= */
  $$('.lee-texto').forEach(function(p){
    var n = 0;
    (function partir(nodo){
      Array.prototype.slice.call(nodo.childNodes).forEach(function(h){
        if (h.nodeType === 3){
          var frag = document.createDocumentFragment();
          h.textContent.split(/(\s+)/).forEach(function(t){
            if (!t) return;
            if (/^\s+$/.test(t)){ frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'pal'; s.textContent = t; s.style.setProperty('--i', n++); frag.appendChild(s);
          });
          nodo.replaceChild(frag, h);
        } else if (h.nodeType === 1){ partir(h); }
      });
    })(p);
    p.style.setProperty('--n', n);
  });

  /* ================= Decoración con parallax (decoracion-parallax, M15) ================= */
  if (!reducido){
    var capas = $$('[data-px],[data-py]'), pendP = null;
    var parallax = function(){ pendP = null; var vh = innerHeight;
      capas.forEach(function(el){ var s = el.closest('section'); if (!s) return; var r = s.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        if (el.dataset.px) el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0';
        else el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; });
    };
    addEventListener('scroll', function(){ if (!pendP) pendP = requestAnimationFrame(parallax); }, {passive:true});
    addEventListener('resize', parallax); parallax();
  }

  /* ================= Interacciones con ratón (interacciones-cursor v3, M30). Los botones de llamar no se mueven. ================= */
  if (raton && !reducido){
    $$('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    var pendR = null;
    document.addEventListener('mousemove', function(e){
      if (pendR) return;
      pendR = requestAnimationFrame(function(){ pendR = null; var el = e.target && e.target.closest ? e.target.closest('.faq details') : null; if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ================= Mapa real solo al pulsar (ubicacion-mapa v3) ================= */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa){
    btnMapa.addEventListener('click', function(){
      var caja = document.getElementById('mapa'), fachada = document.getElementById('mapaFachada'); if (!fachada) return;
      var f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Majús Restaurante, C. Alfonso X el Sabio 38, 28982 Parla, Madrid') + '&hl=es&z=17&output=embed';
      f.title = 'Mapa con la ubicación de Majús Restaurante'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
      caja.appendChild(f); fachada.remove(); f.focus();
    });
  }

  /* ================= Preguntas: acordeón nativo con altura animada (acordeon-nativo) ================= */
  $$('.faq details').forEach(function(el){
    var resumen = el.querySelector('summary'), contenido = el.querySelector('.contenido'), anim = null, cerrando = false, abriendo = false;
    function terminar(abierto){ el.open = abierto; anim = null; cerrando = abriendo = false; el.style.height = el.style.overflow = ''; }
    function animar(desde, hasta, abierto){
      if (anim) anim.cancel();
      if (reducido){ terminar(abierto); return; }
      anim = el.animate({height:[desde, hasta]}, {duration:250, easing:'cubic-bezier(0.23,1,0.32,1)'});
      anim.onfinish = function(){ terminar(abierto); }; anim.oncancel = function(){ cerrando = abriendo = false; };
    }
    resumen.addEventListener('click', function(e){
      e.preventDefault(); el.style.overflow = 'hidden';
      if (cerrando || !el.open){
        $$('.faq details[open]').forEach(function(o){ if (o !== el) o.querySelector('summary').click(); });
        el.style.height = el.offsetHeight + 'px'; el.open = true;
        requestAnimationFrame(function(){ abriendo = true; animar(el.offsetHeight + 'px', (resumen.offsetHeight + contenido.offsetHeight) + 'px', true); });
      } else if (abriendo || el.open){ cerrando = true; animar(el.offsetHeight + 'px', resumen.offsetHeight + 'px', false); }
    });
  });

  /* ================= Reserva por WhatsApp con el mensaje ya escrito (reserva-cita v2) =================
     El enlace del HTML ya funciona sin JS ("Hola, quiero reservar mesa."); los desplegables solo añaden lo elegido.
     Los días salen del horario: no se ofrecen los días sin servicio. */
  $$('[data-reserva-wa]').forEach(function(caja){
    var enlace = caja.querySelector('[data-rw-enlace]'), base = enlace.getAttribute('href').split('?')[0];
    var sel = {personas: caja.querySelector('[data-rw="personas"]'), dia: caja.querySelector('[data-rw="dia"]'), hora: caja.querySelector('[data-rw="hora"]')};
    var hoy = ahora();
    for (var k = 0, puestos = 0; k < 7 && puestos < 6; k++){
      var d = (hoy.dia + k) % 7; if (!TRAMOS[d].length) continue;
      var txt = k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + NOMBRES[d];
      var o = document.createElement('option'); o.value = txt; var et = k < 2 ? txt : NOMBRES[d]; o.textContent = et.charAt(0).toUpperCase() + et.slice(1); sel.dia.appendChild(o); puestos++;
    }
    function escribir(){
      var p = sel.personas.value, di = sel.dia.value, h = sel.hora.value;
      var partes = [];
      if (p) partes.push('para ' + (p === '1' ? '1 persona' : p + ' personas'));
      if (di) partes.push(di);
      if (h) partes.push('a las ' + h);
      var msg = 'Hola, quiero reservar mesa' + (partes.length ? ' ' + partes.join(', ') : '') + '.';
      enlace.href = base + '?text=' + encodeURIComponent(msg);
    }
    Object.keys(sel).forEach(function(k){ sel[k].addEventListener('change', escribir); });
    escribir();
  });
})();
