/* Restaurante Embocado · demo de Degaldo Designs (2026-10-22)
   Piezas de la librería adaptadas: luces-sobre-foto (M81, firma) con hero-zoom-scroll (M12), lista-fijada-foto (M27),
   cabecera-inteligente, resaltado-deslizante, menu-escalonado, titulares-animados, movimiento-marca (cifras),
   menu-tabs-categorias + transiciones-vista (carta), texto-revelado-scroll (M14), pila-deslizable (M54),
   decoracion-parallax, interacciones-cursor v3, ubicacion-mapa v3, acordeon-nativo y barra-pegajosa-movil.
   Nuevo en este proyecto: horario que cruza la medianoche y titular manuscrita + píldora (ver la librería). */
(function(){
  'use strict';
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;
  var conLinea = !!(window.CSS && CSS.supports('animation-timeline: view()')) && !reducido;
  var TEL = '911 26 27 31';

  /* ================= Horario que cruza la medianoche (hora de Madrid) =================
     Tramos en minutos desde las 0:00 del día en que se ABRE (0 = domingo). Un cierre de más de 1440 es de madrugada
     del día siguiente: el martes abre a las 8:00 (480) y cierra a la 1:00 del miércoles (1500).
     CONFIRMAR CON EL CLIENTE: es el horario de Google Maps. Los festivos no se calculan: nunca "hoy no hay servicio". */
  var TRAMOS = {0:[[570,1500]], 1:[], 2:[[480,1500]], 3:[[480,1500]], 4:[[480,1500]], 5:[[480,1560]], 6:[[570,1560]]};
  var DESAYUNOS = [[540,720],[960,1200]];   /* carta de abr. 2026; CONFIRMAR */
  var NOMBRES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var DIAS = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
  function hora(m){ m = m % 1440; var h = Math.floor(m / 60), mi = m % 60; return h + ':' + (mi < 10 ? '0' : '') + mi; }
  function aLas(m){ return (Math.floor((m % 1440) / 60) === 1 ? 'a la ' : 'a las ') + hora(m); }
  function hasta(m){ return (Math.floor((m % 1440) / 60) === 1 ? 'hasta la ' : 'hasta las ') + hora(m); }
  function ahora(){
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {dia: DIAS[p.weekday], min: (+p.hour % 24) * 60 + (+p.minute)};
    } catch(e){ var d = new Date(); return {dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes()}; }
  }
  /* Devuelve {abierto, jornada (día del tramo en curso o de hoy), cierra} o {abierto:false, k (días hasta abrir), dia, abre} */
  function estado(n){
    n = n || ahora();
    var hoy = TRAMOS[n.dia], ayer = (n.dia + 6) % 7, i, t;
    for (i = 0; i < hoy.length; i++){ t = hoy[i]; if (n.min >= t[0] && n.min < t[1]) return {abierto:true, n:n, jornada:n.dia, cierra:t[1], quedan:t[1] - n.min}; }
    for (i = 0; i < TRAMOS[ayer].length; i++){ t = TRAMOS[ayer][i]; if (t[1] > 1440 && n.min < t[1] - 1440) return {abierto:true, n:n, jornada:ayer, cierra:t[1], quedan:t[1] - 1440 - n.min}; }
    for (var k = 0; k < 8; k++){
      var d = (n.dia + k) % 7;
      for (i = 0; i < TRAMOS[d].length; i++){ t = TRAMOS[d][i]; if (k * 1440 + t[0] > n.min) return {abierto:false, n:n, jornada:n.dia, k:k, dia:d, abre:t[0]}; }
    }
    return {abierto:false, n:n, jornada:n.dia, k:0, dia:n.dia, abre:0};
  }
  /* "hoy", "mañana" o "el martes" (de madrugada, "mañana" confunde: se dice el día) */
  function cuando(e){ if (e.k === 0) return 'hoy'; if (e.k === 1 && e.n.min >= 360) return 'mañana'; return 'el ' + NOMBRES[e.dia]; }
  function enDesayunos(n){ return DESAYUNOS.some(function(t){ return n.min >= t[0] && n.min < t[1]; }); }
  window.EmbocadoHorario = {estado:estado, cuando:cuando};   /* para las pruebas con el reloj falseado */

  function pintarEstado(){
    var e = estado(), clave = e.abierto ? 'abierto' : 'cerrado';
    var titulo = e.abierto ? 'Abierto · ' + hasta(e.cierra) : 'Cerrado · abrimos ' + cuando(e) + ' ' + aLas(e.abre);
    var detalle = e.abierto && enDesayunos(e.n) && e.jornada === e.n.dia ? 'Desayunos hasta las ' + hora(DESAYUNOS[e.n.min < 720 ? 0 : 1][1]) : (e.abierto ? 'Reservas: ' + TEL : 'Llama para reservar: ' + TEL);
    $$('[data-viva]').forEach(function(v){
      v.dataset.estado = clave;
      var t = v.querySelector('[data-viva-titulo]'), d = v.querySelector('[data-viva-detalle]');
      if (t) t.textContent = titulo; if (d) d.textContent = detalle;
    });
    $$('.luz-mini').forEach(function(m){ if (m.dataset.estado !== clave) m.dataset.estado = clave; });
    var sec = document.getElementById('horario');
    if (sec){
      sec.dataset.estado = clave;
      var he = sec.querySelector('[data-horario-estado]');
      if (he) he.textContent = e.abierto ? 'Abierto ahora, ' + hasta(e.cierra) + '.' : 'Cerrado ahora. Abrimos ' + cuando(e) + ' ' + aLas(e.abre) + '.';
      ordenarDias(e);
    }
    var fh = document.querySelector('[data-final-hoy]');
    if (fh) fh.textContent = (e.abierto ? 'Abierto ' + hasta(e.cierra) : 'Abrimos ' + cuando(e) + ' ' + aLas(e.abre)) + ' · ' + TEL;
  }
  /* Lista de días: empieza por la jornada en curso (de madrugada, la de ayer) y la marca */
  function ordenarDias(e){
    var lista = document.getElementById('dias'); if (!lista) return;
    var filas = $$('.dia', lista), j = e.jornada;
    filas.sort(function(a, b){ return ((+a.dataset.dia - j + 7) % 7) - ((+b.dataset.dia - j + 7) % 7); });
    filas.forEach(function(f){
      var hoy = +f.dataset.dia === j, nom = f.querySelector('.dia-nombre'), et = nom.querySelector('small');
      f.classList.toggle('hoy', hoy);
      f.classList.toggle('dia-cerrado', !TRAMOS[+f.dataset.dia].length);
      if (hoy && !et){ et = document.createElement('small'); nom.insertBefore(et, nom.firstChild); }
      if (!hoy && et) et.remove();
      if (hoy) et.textContent = j === e.n.dia ? 'Hoy' : 'Esta noche';
      lista.appendChild(f);
    });
  }
  pintarEstado();
  setInterval(pintarEstado, 30000);

  /* ================= Titulares por palabras (titulares-animados) ================= */
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

  /* ================= Titular manuscrita + píldora: la frase se escribe y la píldora entra con su brillo ================= */
  function escribir(el, rehacer){
    if (reducido){ el.classList.add('escrito'); return; }
    if (rehacer){
      el.classList.add('sin-trans'); el.classList.remove('escrito'); void el.offsetWidth; el.classList.remove('sin-trans');
      requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('escrito'); }); });
    } else el.classList.add('escrito');
  }
  var portada = document.querySelector('.portada');
  var tmps = $$('[data-tmp]').filter(function(t){ return !portada || !portada.contains(t); });
  if (conIO && !reducido){
    var ioTmp = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ escribir(e.target); ioTmp.unobserve(e.target); } }); }, {rootMargin:'0px 0px -12% 0px'});
    tmps.forEach(function(t){ ioTmp.observe(t); });
  } else tmps.forEach(function(t){ t.classList.add('escrito'); });

  /* ================= Cifras que cuentan (movimiento-marca) ================= */
  function formato(el, v){ var dec = +el.getAttribute('data-dec') || 0; return v.toFixed(dec).replace('.', ','); }
  function contar(el, retraso){
    var fin = parseFloat(el.getAttribute('data-fin'));
    if (reducido || innerWidth <= 760){ el.textContent = formato(el, fin); return; }
    var desde = fin * .8;
    el.style.minWidth = el.offsetWidth + 'px'; el.textContent = formato(el, desde);
    setTimeout(function(){
      var t0 = null;
      (function paso(t){ if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 500);
        el.textContent = formato(el, k < 1 ? desde + (fin - desde) * (1 - Math.pow(1 - k, 3)) : fin); if (k < 1) requestAnimationFrame(paso); })(performance.now());
    }, retraso);
  }

  /* ================= luces-sobre-foto (M81) · copiado de la librería, v2 ================= */
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
      if (nuevas.length) el.classList.add('previa');   /* M81 v2: velo intermedio */
      if (luces.every(function(l){ return l.classList.contains('on'); }) && !el.classList.contains('encendidas')){
        el.style.setProperty('--velo-d', (nuevas.length ? (nuevas.length - 1) * paso + prende : 0) + 'ms');
        el.classList.add('encendidas');
      }
    }
    function alVer(el, fn){
      if (!conIO){ fn(); return; }
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          if (e.isIntersecting && (e.intersectionRatio >= .6 || (e.boundingClientRect.height > innerHeight && e.intersectionRect.height >= innerHeight * .6))){ io.disconnect(); fn(); }
        });
      }, { threshold:[0, .2, .4, .6, .8, 1] });
      io.observe(el);
    }
    function vigilar(el){ montar(el); alVer(el, function(){ encender(el); }); }
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
    $$('.luces').forEach(function(el){
      montar(el);
      if (rejilla){ encender(el); return; }
      if ((el.getAttribute('data-encender') || 'al-ver') === 'al-ver') vigilar(el);
    });
    $$('.luz-mini').forEach(function(m){ alVer(m, function(){ m.classList.add('on'); }); });
    return {montar:montar, encender:encender, vigilar:vigilar, rejilla:rejilla};
  })();

  /* ================= Portada: coreografía en 6 tiempos (0-1,4 s) y, con el scroll, la firma ================= */
  if (portada){
    var luces = portada.querySelector('.luces'), marca = portada.querySelector('.zoom-marca');
    var texto = portada.querySelector('.portada-texto'), fijo = portada.querySelector('.zoom-fijo');
    /* Móvil: la tarjeta de la foto empieza justo debajo del texto (lo mide aquí). Con offsetTop, que no cuenta el
       translate con el que el texto se va al bajar, y solo si cambia el ancho: en el móvil la barra del navegador
       lanza resize al aparecer y esconderse, y medir a mitad de animación hacía saltar la tarjeta durante el scroll */
    var medir = function(){ portada.style.setProperty('--txt', (texto.offsetTop + texto.offsetHeight) + 'px'); };
    var anchoMedido = innerWidth;
    medir(); addEventListener('resize', function(){ if (innerWidth !== anchoMedido){ anchoMedido = innerWidth; medir(); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    var h1 = portada.querySelector('.titular-palabras'), lema = portada.querySelector('[data-tmp]');
    requestAnimationFrame(function(){ requestAnimationFrame(function(){
      document.documentElement.classList.add('lista-portada');
      if (h1) h1.classList.add('visto');
      if (lema) escribir(lema);
    }); });
    $$('.cuenta', portada).forEach(function(el){ contar(el, 900); });
    if (!Luces.rejilla){
      /* La lámpara que se ve dentro de la tarjeta se enciende sola a los 1,2 s: en escritorio la de los ventanales (5), en móvil la grande (0) */
      /* Dos lámparas que se ven en la tarjeta: encendidas casi al cargar (la primera pantalla invita a entrar); la
         tercera, al final de la coreografía. Escritorio: las de los ventanales; móvil: la grande y la de detrás. */
      var esc = matchMedia('(min-width:900px)').matches;
      encenderLuces(luces, esc ? [5, 4] : [0, 1]);
      setTimeout(function(){ encenderLuces(luces, esc ? [3] : [6]); }, reducido ? 0 : 1200);
      if (!conLinea || !conIO) Luces.vigilar(luces);
      /* En móvil no hay zoom ligado al scroll (ver estilos.css): el resto de lámparas, solas al terminar la coreografía */
      else if (!esc) setTimeout(function(){ encenderLuces(luces); }, reducido ? 0 : 2400);
      else {
        var ioM = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ ioM.disconnect(); encenderLuces(luces); } }, {rootMargin:'0px 0px -50% 0px'});
        ioM.observe(marca);
      }
    }
  }

  /* ================= Entradas al bajar (M10) ================= */
  $$('.faq').forEach(function(g){ $$('.reveal', g).forEach(function(el, i){ el.style.setProperty('--retraso', Math.min(i, 6) * 50 + 'ms'); }); });
  if (conIO && !reducido){
    var ioRev = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); ioRev.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
    $$('.reveal, .fachada-foto').forEach(function(el){ ioRev.observe(el); });
  } else { $$('.reveal, .fachada-foto').forEach(function(el){ el.classList.add('visto'); }); }

  /* ================= M27 · lista fijada que cambia la foto (copiado de la librería, v2) ================= */
  (function(){
    var secciones = document.querySelectorAll('.lf');
    if (!secciones.length) return;
    var puede = conIO && window.CSS && CSS.supports('height', '100svh');
    Array.prototype.forEach.call(secciones, function(sec){
      /* v2: ancho mínimo para fijar (data-lf-desde, 768 por defecto) */
      var mq = matchMedia('(min-width: ' + (+sec.dataset.lfDesde || 768) + 'px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)');
      var items = $$('.lf-item', sec);
      sec.style.setProperty('--lf-n', items.length);
      if (!puede || items.length < 2) return;
      var lineas = items.map(function(it){ return it.querySelector('.lf-linea i'); });
      var texto = sec.querySelector('.lf-texto');
      var marcas = items.map(function(_, i){
        var m = document.createElement('span'); m.className = 'lf-marca'; m.setAttribute('aria-hidden', 'true'); m.style.setProperty('--i', i); sec.appendChild(m); return m;
      });
      var activo = 0, cerca = false, pedido = false;
      function fijada(){ return sec.classList.contains('lf-fijada'); }
      function marcar(i){ if (i < 0) return; activo = i; items.forEach(function(it, k){ it.classList.toggle('es-activo', k === i); }); pintar(); }
      function pintar(){
        pedido = false; if (!fijada()) return;
        var tramo = marcas[0].offsetHeight || 1, bajado = -sec.getBoundingClientRect().top;
        lineas.forEach(function(l, k){ if (!l) return; var p = k < activo ? 1 : k > activo ? 0 : Math.min(1, Math.max(0, (bajado - k * tramo) / tramo)); l.style.scale = p.toFixed(3) + ' 1'; });
      }
      function altoContenido(el){ var h = 0; Array.prototype.forEach.call(el.children, function(c){ var cs = getComputedStyle(c); h += c.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom); }); return h; }
      function pedir(){ if (cerca && !pedido){ pedido = true; requestAnimationFrame(pintar); } }
      function modo(){
        sec.classList.toggle('lf-fijada', mq.matches);
        if (fijada() && texto && altoContenido(texto) > texto.clientHeight + 2) sec.classList.remove('lf-fijada');
        if (!fijada()) lineas.forEach(function(l){ if (l) l.style.scale = ''; });
        pintar();
      }
      marcar(0); modo();
      if (mq.addEventListener) mq.addEventListener('change', modo); else mq.addListener(modo);
      var ioMarcas = new IntersectionObserver(function(en){ en.forEach(function(e){ if (e.isIntersecting) marcar(marcas.indexOf(e.target)); }); }, { rootMargin: '-49% 0px -49% 0px', threshold: 0 });
      marcas.forEach(function(m){ ioMarcas.observe(m); });
      new IntersectionObserver(function(en){ cerca = en[0].isIntersecting; if (cerca) pintar(); }, { rootMargin: '100px 0px' }).observe(sec);
      addEventListener('scroll', pedir, { passive: true });
      addEventListener('resize', function(){ modo(); pedir(); });
      sec.addEventListener('focusin', function(e){
        var k = items.indexOf(e.target.closest('.lf-item'));
        if (!fijada() || k < 0 || k === activo) return;
        scrollTo({ top: scrollY + sec.getBoundingClientRect().top + k * marcas[0].offsetHeight + 2, behavior: 'auto' });
      });
    });
  })();

  /* ================= Cabecera inteligente + sección activa ================= */
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

  /* ================= Resaltado deslizante (barra y pastillas de la carta) ================= */
  var resaltados = [];
  $$('.resalta').forEach(function(cont){
    var res = cont.querySelector('.resalte'), items = $$('.r-item', cont), actual = null;
    function reposo(){ return cont.querySelector('.r-item[aria-current="true"], .r-item[aria-selected="true"]'); }
    function ir(el, sin){
      if (actual) actual.classList.remove('sobre');
      if (!el || !el.offsetWidth){ res.classList.remove('listo'); actual = null; return; }
      var c = cont.getBoundingClientRect(), r = el.getBoundingClientRect();
      var saltar = sin || reducido || !res.classList.contains('listo');
      if (saltar) res.style.transition = 'none';
      res.style.clipPath = 'inset(' + (r.top - c.top) + 'px ' + (c.right - r.right) + 'px ' + (c.bottom - r.bottom) + 'px ' + (r.left - c.left) + 'px round 999px)';
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

  var nav = document.querySelector('.nav');
  if (nav && conIO){
    var enlaces = $$('.r-item', nav), visibles = {};
    var ioNav = new IntersectionObserver(function(es){
      es.forEach(function(e){ visibles[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var mejor = null, max = 0; Object.keys(visibles).forEach(function(id){ if (visibles[id] > max){ max = visibles[id]; mejor = id; } });
      enlaces.forEach(function(a){ if (a.getAttribute('href') === '#' + mejor) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      if (!nav.matches(':hover')) volverResaltado(nav);
    }, {rootMargin:'-30% 0px -50% 0px', threshold:[0, .1, .25, .5, .75, 1]});
    enlaces.forEach(function(a){ var s = document.querySelector(a.getAttribute('href')); if (s) ioNav.observe(s); });
  }

  /* ================= Menú móvil en círculo (menu-escalonado) ================= */
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb');
  if (menu && hamb && typeof menu.showPopover === 'function'){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){ var ab = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(ab)); hamb.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú'); if (!ab) hamb.focus(); });
    $$('a', menu).forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* ================= Carta: fichas de papel + pastillas, con View Transitions ================= */
  var puedeVT = typeof document.startViewTransition === 'function' && !reducido;
  function conTransicion(cambio, despues){
    if (puedeVT){ var vt = document.startViewTransition(cambio); vt.finished.then(despues, despues); }
    else { cambio(); if (despues) despues(); }
  }
  function entrar(panel){
    if (reducido) return;
    var filas = $$('.plato', panel); filas.forEach(function(f, i){ f.style.setProperty('--n', Math.min(i, 6)); });
    panel.classList.remove('entra'); void panel.offsetWidth; panel.classList.add('entra');
  }
  /* Pestañas accesibles genéricas (flechas, Inicio y Fin; roving tabindex) */
  function pestanas(lista, alCambiar){
    var tabs = $$('[role="tab"]', lista);
    function elegir(tab, foco, quieto){
      if (tab.getAttribute('aria-selected') === 'true'){ if (foco) tab.focus(); return; }
      alCambiar(tab, function(){
        tabs.forEach(function(t){ var si = t === tab; t.setAttribute('aria-selected', String(si)); t.tabIndex = si ? 0 : -1;
          var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !si; });
      }, quieto);
      if (foco) tab.focus();
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ elegir(t); });
      t.addEventListener('keydown', function(e){
        var d = null;
        if (e.key === 'ArrowRight') d = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') d = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') d = tabs[0]; else if (e.key === 'End') d = tabs[tabs.length - 1];
        if (d){ e.preventDefault(); elegir(d, true); }
      });
    });
    tabs.forEach(function(t){ var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = t.getAttribute('aria-selected') !== 'true'; });
    return {elegir:elegir, tabs:tabs};
  }
  var fichas = document.querySelector('.fichas');
  if (fichas){
    var subs = $$('.fichas-subs p');
    var marcarSub = function(){ subs.forEach(function(p){ p.classList.toggle('activa', document.getElementById(p.dataset.para).getAttribute('aria-selected') === 'true'); }); };
    var F = pestanas(fichas, function(tab, aplicar, quieto){
      if (quieto){ aplicar(); marcarSub(); return; }
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      conTransicion(function(){ aplicar(); marcarSub(); }, function(){
        var t = panel.querySelector('.seccion:not([hidden]) [data-tmp], [data-tmp]'); if (t) escribir(t, true);
        volverResaltado(document.querySelector('.pastillas'), true);
      });
      entrar(panel);
    });
    /* Las descripciones van debajo del texto del botón, dentro de su área: el clic pasa al botón (pointer-events:none) */
    /* Por defecto, la carta que se sirve ahora (hora de Madrid) */
    var n = ahora(), nota = document.querySelector('[data-ficha-nota]'), abierto = estado(n).abierto;
    if (abierto && enDesayunos(n)) F.elegir(document.getElementById('f-desayunos'), false, true);
    if (nota && abierto) nota.hidden = false;
    marcarSub();
    /* Enlaces de "Un día" que abren una carta concreta */
    $$('[data-ficha]').forEach(function(a){ a.addEventListener('click', function(){ F.elegir(document.getElementById('f-' + a.dataset.ficha)); }); });
  }
  var pastillas = document.querySelector('.pastillas');
  if (pastillas){
    pestanas(pastillas, function(tab, aplicar){
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      conTransicion(aplicar, function(){
        volverResaltado(pastillas);
        var hoja = document.getElementById('secciones'), top = hoja.getBoundingClientRect().top;
        if (top < 0) scrollTo({top: scrollY + top - 90, behavior: reducido ? 'auto' : 'smooth'});
      });
      var t = panel.querySelector('[data-tmp]'); if (t) escribir(t, true);
      entrar(panel);
      tab.scrollIntoView({block:'nearest', inline:'nearest'});
    });
  }
  $$('.pastillas-desliza').forEach(function(d){
    var mirar = function(){ d.classList.toggle('al-final', d.scrollLeft + d.clientWidth >= d.scrollWidth - 4); };
    d.addEventListener('scroll', mirar, {passive:true}); addEventListener('resize', mirar); mirar();
  });

  /* ================= Frase que se enciende con el scroll (texto-revelado-scroll v3) ================= */
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

  /* ================= Opiniones: pila que se tira con el dedo (pila-deslizable) ================= */
  (function(){
    var pila = document.getElementById('pila'); if (!pila) return;
    var cuenta = document.getElementById('pila-cuenta');
    var total = pila.children.length, actual = 0, ocupado = false;
    function marcar(){
      Array.prototype.forEach.call(pila.children, function(t, i){ if (i === 0){ t.removeAttribute('aria-hidden'); t.inert = false; } else { t.setAttribute('aria-hidden', 'true'); t.inert = true; } });
      cuenta.textContent = (actual + 1) + ' de ' + total;
    }
    function limpiar(t){ t.style.translate = ''; t.style.rotate = ''; t.style.opacity = ''; }
    function siguiente(dir){
      if (ocupado) return; ocupado = true;
      var t = pila.firstElementChild; t.classList.remove('arrastrando', 'vuelve');
      if (reducido) t.style.opacity = '0'; else { t.style.translate = (dir * 130) + '% 0'; t.style.rotate = (dir * 14) + 'deg'; }
      setTimeout(function(){ t.style.transition = 'none'; pila.appendChild(t); limpiar(t); void t.offsetWidth; t.style.transition = '';
        actual = (actual + 1) % total; marcar(); ocupado = false; }, reducido ? 200 : 320);
    }
    function anterior(){
      if (ocupado) return; ocupado = true;
      var t = pila.lastElementChild; t.style.transition = 'none';
      if (reducido) t.style.opacity = '0'; else { t.style.translate = '-130% 0'; t.style.rotate = '-14deg'; }
      pila.insertBefore(t, pila.firstElementChild); void t.offsetWidth; t.style.transition = ''; limpiar(t);
      actual = (actual - 1 + total) % total; marcar();
      setTimeout(function(){ ocupado = false; }, 320);
    }
    var x0 = 0, t0 = 0, dx = 0, activa = null;
    pila.addEventListener('pointerdown', function(e){
      var t = e.target.closest('.tar'); if (!t || t !== pila.firstElementChild || ocupado) return;
      activa = t; x0 = e.clientX; t0 = performance.now(); dx = 0;
      t.setPointerCapture(e.pointerId); t.classList.add('arrastrando'); t.classList.remove('vuelve');
    });
    pila.addEventListener('pointermove', function(e){ if (!activa) return; dx = e.clientX - x0; activa.style.translate = dx + 'px 0'; if (!reducido) activa.style.rotate = (dx / 22).toFixed(2) + 'deg'; });
    function soltar(){
      if (!activa) return;
      var t = activa; activa = null; t.classList.remove('arrastrando');
      var v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (Math.abs(dx) > t.offsetWidth / 3 || (v > 0.11 && Math.abs(dx) > 20)) siguiente(dx > 0 ? 1 : -1);
      else { t.classList.add('vuelve'); limpiar(t); }
    }
    pila.addEventListener('pointerup', soltar); pila.addEventListener('pointercancel', soltar);
    document.getElementById('pila-sig').addEventListener('click', function(){ siguiente(1); });
    document.getElementById('pila-ant').addEventListener('click', anterior);
    pila.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight'){ e.preventDefault(); siguiente(1); } if (e.key === 'ArrowLeft'){ e.preventDefault(); anterior(); } });
    marcar();
  })();

  /* ================= Fondo vivo (fondo-hojas-vivo, M82): el brillo solo respira con la portada en pantalla ================= */
  $$('.fondo-vivo').forEach(function(f){
    if (!conIO){ f.classList.add('en-pantalla'); return; }
    new IntersectionObserver(function(es){ f.classList.toggle('en-pantalla', es[0].isIntersecting); }).observe(f);
  });

  /* ================= Decoración con parallax (decoracion-parallax) ================= */
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

  /* ================= Interacciones con ratón (interacciones-cursor v3). Los botones de llamar no se mueven. ================= */
  if (raton && !reducido){
    $$('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    $$('.foto-iman').forEach(function(f){
      var img = f.querySelector('img');
      f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        f.style.translate = (x * 30).toFixed(1) + 'px ' + (y * 26).toFixed(1) + 'px';
        /* dentro de un marco de ventana la foto no se desplaza (dejaría un hueco junto al marco): solo crece un poco */
        if (!img.closest('.foto-ventana')) img.style.translate = (x * -12).toFixed(1) + 'px ' + (y * -10).toFixed(1) + 'px';
        img.style.scale = '1.04'; });
      f.addEventListener('pointerleave', function(){ f.style.translate = ''; img.style.translate = ''; img.style.scale = ''; });
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
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Restaurante Embocado, C. Juan Carlos I 14, 28971 Griñón, Madrid') + '&hl=es&z=17&output=embed';
      f.title = 'Mapa con la ubicación de Restaurante Embocado'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
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

  /* Barra fija móvil (barra-pegajosa-movil): siempre visible, sin animación; no necesita JS */
})();
