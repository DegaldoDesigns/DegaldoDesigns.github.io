/* Bar Sophie Ella (Parla) · demo de Degaldo Designs (2026-10-24). Piezas de la librería adaptadas; cada bloque dice de dónde sale. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ================= Horario y estado de hoy: UNA función para la tarjeta viva, la fila de hoy, la línea del horario y la
     llamada final (lógica de cartel-abierto-cerrado v3). En agosto (hora de Madrid), el aviso de vacaciones en su lugar.
     CONFIRMAR CON EL CLIENTE: horario de Google Maps (24-10-2026) y cierre de agosto. Minutos desde las 0:00 (0 = domingo).
     Los festivos no se calculan: nunca "hoy no hay servicio"; se dice cuándo se abre. ================= */
  var HORARIO = {1:[[540, 1320]], 2:[[540, 1320]], 3:[[540, 1320]], 4:[[540, 1380]], 5:[[540, 1410]], 6:[[600, 1410]], 0:[]};
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function hora(m){ m = m % 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function alas(m){ return (Math.floor((m % 1440) / 60) === 1 ? 'la ' : 'las ') + hora(m); }
  function ahora(){
    try {
      var p = {}, n = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
      new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', year:'numeric', month:'numeric', day:'numeric', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {d:n[p.weekday], m:(+p.hour % 24) * 60 + (+p.minute), mes:+p.month, dm:+p.day, anio:+p.year};
    } catch (e){ var f = new Date(); return {d:f.getDay(), m:f.getHours() * 60 + f.getMinutes(), mes:f.getMonth() + 1, dm:f.getDate(), anio:f.getFullYear()}; }
  }
  /* mes (1-12) del día que cae k días después de hoy, contado con el calendario de Madrid (t.dm = día del mes) */
  function mesDentro(t, k){ var f = new Date(Date.UTC(t.anio, t.mes - 1, t.dm + k)); return f.getUTCMonth() + 1; }
  function estado(t){
    if (t.mes === 8) return {agosto:true, palabra:'En agosto cerramos por vacaciones', detalle:'llama antes de venir'};
    var hoy = HORARIO[t.d] || [], i;
    for (i = 0; i < hoy.length; i++) if (t.m >= hoy[i][0] && t.m < hoy[i][1]) return {abierto:true, palabra:'Abierto', detalle:'hasta ' + alas(hoy[i][1])};
    for (var k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.m > 0){
        /* si el día en que abriríamos cae ya en agosto (del 25 al 31 de julio), el aviso de vacaciones en vez de "abrimos…" */
        if (mesDentro(t, k) === 8) return {abierto:false, palabra:'Cerrado', detalle:'en agosto cerramos por vacaciones, llama para las fechas'};
        return {abierto:false, palabra:'Cerrado', detalle:(k === 0 ? 'abrimos hoy a ' : k === 1 ? 'abrimos mañana a ' : 'abrimos el ' + DIAS[dia] + ' a ') + alas(tr[i][0])};
      }
    }
    return {abierto:false, palabra:'Cerrado', detalle:'llámanos al 642 92 12 74'};
  }
  var estados = document.querySelectorAll('[data-estado-hoy]'), dias = document.getElementById('dias'), filas = dias ? dias.querySelectorAll('[data-dia]') : [];
  var secHorario = document.getElementById('horario');
  function pintar(){
    var t = ahora(), e = estado(t), cl = e.agosto ? 'agosto' : e.abierto ? 'abierto' : 'cerrado';
    [].forEach.call(estados, function(el){
      var pa = el.querySelector('.estado-palabra'), de = el.querySelector('.estado-detalle');
      if (pa.textContent !== e.palabra) pa.textContent = e.palabra;
      if (de.textContent !== e.detalle) de.textContent = e.detalle;
      el.setAttribute('data-e', cl);
    });
    if (dias) dias.setAttribute('data-e', cl);
    if (secHorario) secHorario.classList.toggle('es-agosto', !!e.agosto);
    [].forEach.call(filas, function(f){
      var es = +f.getAttribute('data-dia') === t.d && !e.agosto, et = f.querySelector('.hoy-et');
      f.classList.toggle('hoy', es);
      if (es && !et){ et = document.createElement('span'); et.className = 'hoy-et'; et.textContent = 'Hoy'; f.querySelector('dt').appendChild(et); }
      if (!es && et) et.remove();
    });
  }
  pintar(); setInterval(pintar, 30000);

  /* ================= M09 titular-manuscrita-pildora: "como en casa" se escribe (una vez al verse; aquí, en la portada) ================= */
  (function(){
    var tits = document.querySelectorAll('[data-tmp]');
    if (!('IntersectionObserver' in window) || reducido){ tits.forEach(function(t){ t.classList.add('escrito'); }); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('escrito'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -12% 0px'});
    tits.forEach(function(t){ io.observe(t); });
  })();

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

  /* ================= M14 texto-revelado-scroll: parte la frase en palabras (el CSS hace el resto, si hay animation-timeline) ================= */
  document.querySelectorAll('.lee-texto').forEach(function(p){
    if (p.querySelector('.pal')) return;
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

  /* ================= M10 al verse, por tiempo (nada ligado al scroll): fotos que se destapan, bloques que suben, la flor de
     los h2 (M71), la nota de agosto que se endereza (M63) ================= */
  document.querySelectorAll('.cab-sec, .plato-txt, .encargo-panel, .datos, .faq, .casa-txt, .mas-tartas, .citas-pide').forEach(function(el){ el.classList.add('aparece'); });
  document.querySelectorAll('.bento .revela').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 70) + 'ms'); });
  document.querySelectorAll('.tarta-fotos .revela').forEach(function(el, i){ el.style.setProperty('--retraso', (i * 70) + 'ms'); });
  var unaVez = document.querySelectorAll('.aparece, .revela, .tf, .nota');
  if (!('IntersectionObserver' in window) || reducido) unaVez.forEach(function(t){ t.classList.add('visto'); });
  else {
    var iov = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); iov.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
    unaVez.forEach(function(t){ iov.observe(t); });
  }

  /* ================= Pausa fuera de pantalla (cinta, punto de estado, flor de la portada, pin del mapa) ================= */
  if ('IntersectionObserver' in window){
    var iop = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ iop.observe(el); });
  } else document.querySelectorAll('.mov').forEach(function(el){ el.classList.add('en-pantalla'); });

  /* ================= Parallax (decoracion-parallax): palabras gigantes en horizontal (data-px) y la flor pequeña en vertical
     (data-py), con la posición de su SECCIÓN. SOLO desde 900 px (en móvil, quietas) ================= */
  if (!reducido){
    var capas = [].slice.call(document.querySelectorAll('[data-px], [data-py]')), pend = null, ancho = matchMedia('(min-width: 900px)');
    var mover = function(){ pend = null; var vh = innerHeight;
      if (!ancho.matches){ capas.forEach(function(el){ el.style.translate = ''; }); return; }
      capas.forEach(function(el){ var r = (el.closest('section') || el.parentNode).getBoundingClientRect();
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
    ['inicio','tarta','lo-mas-nombrado','carta','encargos','casa','horario','opiniones','ubicacion','preguntas'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
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

  /* ================= Pila de reseñas (M54 pila-deslizable v2): a dedo (velocidad 0,11 px/ms), botones y flechas ================= */
  var pila = document.getElementById('pila'), cuenta = document.getElementById('pilaCuenta');
  if (pila){
    var total = pila.children.length, actual = 0, ocupado = false;
    var marcar = function(){
      Array.prototype.forEach.call(pila.children, function(t, i){
        if (i === 0){ t.removeAttribute('aria-hidden'); t.inert = false; } else { t.setAttribute('aria-hidden', 'true'); t.inert = true; }
      });
      cuenta.textContent = (actual + 1) + ' de ' + total;
    };
    var limpiar = function(t){ t.style.translate = ''; t.style.rotate = ''; t.style.opacity = ''; };
    var siguiente = function(dir){
      if (ocupado) return; ocupado = true;
      var t = pila.firstElementChild;
      t.classList.remove('arrastrando', 'vuelve');
      if (reducido){ t.style.opacity = '0'; }
      else { t.style.translate = (dir * 130) + '% 0'; t.style.rotate = (dir * 14) + 'deg'; }
      setTimeout(function(){
        t.style.transition = 'none'; pila.appendChild(t); limpiar(t); t.offsetWidth; t.style.transition = '';
        actual = (actual + 1) % total; marcar(); ocupado = false;
      }, reducido ? 200 : 320);
    };
    var anterior = function(){
      if (ocupado) return; ocupado = true;
      var t = pila.lastElementChild;
      t.style.transition = 'none';
      if (reducido) t.style.opacity = '0'; else { t.style.translate = '-130% 0'; t.style.rotate = '-14deg'; }
      pila.insertBefore(t, pila.firstElementChild); t.offsetWidth; t.style.transition = '';
      limpiar(t);
      actual = (actual - 1 + total) % total; marcar();
      setTimeout(function(){ ocupado = false; }, 320);
    };
    var x0 = 0, t0 = 0, dx = 0, activa = null;
    pila.addEventListener('pointerdown', function(e){
      var t = e.target.closest('.res'); if (!t || t !== pila.firstElementChild || ocupado) return;
      activa = t; x0 = e.clientX; t0 = performance.now(); dx = 0;
      t.setPointerCapture(e.pointerId); t.classList.add('arrastrando'); t.classList.remove('vuelve');
    });
    pila.addEventListener('pointermove', function(e){
      if (!activa) return;
      dx = e.clientX - x0;
      activa.style.translate = dx + 'px 0';
      if (!reducido) activa.style.rotate = (dx / 22).toFixed(2) + 'deg';
    });
    var soltar = function(){
      if (!activa) return;
      var t = activa; activa = null; t.classList.remove('arrastrando');
      var v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (Math.abs(dx) > t.offsetWidth / 3 || (v > 0.11 && Math.abs(dx) > 20)){ siguiente(dx > 0 ? 1 : -1); }
      else { t.classList.add('vuelve'); limpiar(t); }
    };
    pila.addEventListener('pointerup', soltar);
    pila.addEventListener('pointercancel', soltar);
    document.getElementById('pilaSig').addEventListener('click', function(){ siguiente(1); });
    document.getElementById('pilaAnt').addEventListener('click', anterior);
    pila.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); siguiente(1); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); anterior(); }
    });
    marcar();
  }

  /* ================= Mapa real solo al pulsar (ubicacion-mapa v3, sin aviso de cookies: la web no usa cookies propias) ================= */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa) btnMapa.addEventListener('click', function(){
    var caja = document.getElementById('mapa'), fachada = document.getElementById('mapaFachada'); if (!fachada) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Bar Sophie Ella, Parla') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Bar Sophie Ella'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
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
    var mostrar = function(k){
      i = (k + grupo.length) % grupo.length; var b = grupo[i];
      grande.src = b.getAttribute('data-grande') || b.querySelector('img').src; grande.alt = b.querySelector('img').alt;
      pie.textContent = b.getAttribute('data-pie') + ' (' + (i + 1) + ' de ' + grupo.length + ')';
    };
    var abrir = function(b){
      origen = b; var g = b.getAttribute('data-galeria');
      grupo = fotos.filter(function(f){ return f.getAttribute('data-galeria') === g; });
      var mini = b.querySelector('img');
      var hacer = function(){ mini.style.viewTransitionName = ''; mostrar(grupo.indexOf(b)); grande.style.viewTransitionName = 'foto-grande'; visor.showModal(); };
      if (vt){ mini.style.viewTransitionName = 'foto-grande'; document.startViewTransition(hacer); } else hacer();
    };
    var cerrar = function(){
      var mini = origen && origen.querySelector('img');
      var hacer = function(){ grande.style.viewTransitionName = ''; visor.close(); if (mini && grupo[i] === origen) mini.style.viewTransitionName = 'foto-grande'; };
      if (vt){ var t = document.startViewTransition(hacer); t.finished.then(function(){ if (mini) mini.style.viewTransitionName = ''; }); } else hacer();
    };
    fotos.forEach(function(b){ b.addEventListener('click', function(){ abrir(b); }); });
    visor.querySelectorAll('[data-ir]').forEach(function(b){ b.addEventListener('click', function(){ mostrar(i + +b.getAttribute('data-ir')); }); });
    visor.querySelector('[data-cerrar]').addEventListener('click', cerrar);
    visor.addEventListener('cancel', function(e){ e.preventDefault(); cerrar(); });
    visor.addEventListener('click', function(e){ if (e.target === visor) cerrar(); });
    visor.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') mostrar(i + 1); if (e.key === 'ArrowLeft') mostrar(i - 1); });
    visor.addEventListener('close', function(){ if (origen) origen.focus({preventScroll:true}); });
  }
})();
