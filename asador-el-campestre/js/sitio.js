/* Asador El Campestre · demo de Degaldo Designs (2026-10-22)
   Piezas de la librería adaptadas: neon-abierto-cerrado (firma), cabecera-inteligente, resaltado-deslizante,
   menu-escalonado, titulares-animados, movimiento-marca (cifras, brasas, pausa fuera de pantalla),
   decoracion-parallax, interacciones-cursor v3, transiciones-vista, lista-foto-hover, lista-categorias-marquee,
   horario-sendero v2, ubicacion-mapa v3, acordeon-nativo y barra-pegajosa-movil. */
(function(){
  'use strict';
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;

  /* ================= Horario y estado (hora de Madrid) =================
     Tramos en minutos por día de la semana (0 = domingo). Todos los días abren a mediodía.
     Los festivos y las vacaciones no se pueden calcular aquí: nunca se dice "hoy no hay servicio". */
  var TRAMOS = {0:[[630,960]], 1:[[630,930]], 2:[[630,930]], 3:[[630,930]], 4:[[630,930]], 5:[[630,930]], 6:[[630,960]]};
  var NOMBRES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var DIAS = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
  function hora(m){ var h = Math.floor(m / 60), mi = m % 60; return h + ':' + (mi < 10 ? '0' : '') + mi; }
  function dur(m){ if (m < 60) return m + ' min'; var d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    if (d) return d + ' d ' + h + ' h'; return h + ' h' + (mi ? ' ' + mi + ' min' : ''); }
  function ahora(){
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {dia: DIAS[p.weekday], min: (+p.hour % 24) * 60 + (+p.minute)};
    } catch(e){ var d = new Date(); return {dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes()}; }
  }
  function estado(){
    var n = ahora(), hoy = TRAMOS[n.dia];
    for (var i = 0; i < hoy.length; i++){ if (n.min >= hoy[i][0] && n.min < hoy[i][1]) return {abierto:true, n:n, tramo:hoy[i], quedan:hoy[i][1] - n.min}; }
    for (var k = 0; k < 8; k++){
      var d = (n.dia + k) % 7, tr = TRAMOS[d];
      for (var j = 0; j < tr.length; j++){
        if (k === 0 && tr[j][0] <= n.min) continue;
        return {abierto:false, n:n, k:k, dia:d, tramo:tr[j], faltan:k * 1440 + tr[j][0] - n.min};
      }
    }
    return {abierto:false, n:n, k:0, dia:n.dia, tramo:hoy[0], faltan:0};
  }
  function cuando(e){ return e.k === 0 ? 'hoy' : (e.k === 1 ? 'mañana' : 'el ' + NOMBRES[e.dia]); }
  function pintarEstado(){
    var e = estado(), clave = e.abierto ? 'abierto' : 'cerrado';
    $$('[data-neon]').forEach(function(nn){
      if (nn.dataset.estado !== clave) nn.dataset.estado = clave;
      var t = nn.querySelector('[data-neon-titulo]'), d = nn.querySelector('[data-neon-detalle]'), c = nn.querySelector('[data-neon-cuenta]'), p = nn.querySelector('[data-neon-pastilla]');
      if (p) p.textContent = e.abierto ? 'Abierto' : 'Cerrado';
      if (t) t.textContent = e.abierto ? 'Abierto ahora' : 'Cerrado ahora';
      if (d) d.textContent = e.abierto ? 'Hasta las ' + hora(e.tramo[1]) : 'Abrimos ' + cuando(e) + ' a las ' + hora(e.tramo[0]);
      if (c) c.textContent = e.abierto ? (e.quedan === 1 ? 'Queda 1 min' : 'Quedan ' + dur(e.quedan)) : (e.faltan === 1 ? 'Falta 1 min' : 'Faltan ' + dur(e.faltan));
    });
    var sec = document.getElementById('horario');
    if (sec){ sec.dataset.estado = clave;
      var he = sec.querySelector('[data-horario-estado]');
      if (he) he.textContent = e.abierto ? 'Abierto ahora, hasta las ' + hora(e.tramo[1]) + '.' : 'Cerrado ahora. Abrimos ' + cuando(e) + ' a las ' + hora(e.tramo[0]) + '.';
    }
    var fh = document.querySelector('[data-final-hoy]');
    if (fh){
      var hoyT = TRAMOS[e.n.dia][0], sigue = e.abierto || e.k === 0;
      var tr = sigue ? hoyT : e.tramo, dia = sigue ? 'Hoy' : (e.k === 1 ? 'Mañana' : 'El ' + NOMBRES[e.dia]);
      fh.textContent = dia + ', de ' + hora(tr[0]) + ' a ' + hora(tr[1]) + ' · 925 91 82 39';
    }
  }
  function construirSendero(){
    var cont = document.getElementById('sendero'); if (!cont) return;
    var hoy = ahora().dia, html = '';
    var CAP = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    for (var depth = 0; depth <= 6; depth++){
      var d = (hoy + depth) % 7, tr = TRAMOS[d];
      var horas = tr.map(function(f){ return hora(f[0]) + ' a ' + hora(f[1]); }).join(' · ');
      html += '<div class="dia-card' + (depth === 0 ? ' hoy' : '') + '" style="--depth:' + depth + '"><span class="dia-nombre">' +
        (depth === 0 ? '<small>Hoy</small>' + CAP[d] : CAP[d]) + '</span><span class="dia-horas">' + horas + '</span></div>';
    }
    cont.innerHTML = html;
  }
  construirSendero(); pintarEstado();
  setInterval(pintarEstado, 30000);

  /* ================= Portada: coreografía en 5 tiempos ================= */
  var portada = document.querySelector('.portada');

  /* Partir titulares en palabras (titulares-animados), sin perder el marcado */
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
            p.style.setProperty('--i', Math.min(n++, 12));
            v.appendChild(p); frag.appendChild(v);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1 && hijo.tagName !== 'BR'){ partir(hijo); }
      });
    })(h);
    if (reducido || !conIO){ h.classList.add('visto'); return; }
    var io = new IntersectionObserver(function(ents){
      ents.forEach(function(e){ if (e.isIntersecting){ h.classList.add('visto'); io.disconnect(); } });
    }, {rootMargin:'0px 0px -10% 0px'});
    io.observe(h);
  });

  /* Cifras que cuentan (movimiento-marca); data-mil = separador de miles */
  function formato(el, v){
    var dec = +el.getAttribute('data-dec') || 0;
    if (el.hasAttribute('data-mil')) return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return v.toFixed(dec).replace('.', ',');
  }
  function contar(el, retraso){
    var fin = parseFloat(el.getAttribute('data-fin'));
    /* En móvil y con movimiento reducido, la cifra real desde el primer fotograma; en escritorio cuenta desde el 80 % (nunca "0 reseñas") */
    if (reducido || innerWidth <= 760){ el.textContent = formato(el, fin); return; }
    var desde = fin * .8;
    el.style.minWidth = el.offsetWidth + 'px'; el.textContent = formato(el, desde);
    setTimeout(function(){
      var t0 = null;
      (function paso(t){ if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / 700);
        el.textContent = formato(el, k < 1 ? desde + (fin - desde) * (1 - Math.pow(1 - k, 3)) : fin); if (k < 1) requestAnimationFrame(paso); })(performance.now());
    }, retraso);
  }

  if (portada){
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ portada.classList.add('lista-portada'); }); });
    $$('.cuenta', portada).forEach(function(el){ contar(el, 900); });
  }

  /* Rueda de palabras: empieza a los 2 s, cada 2,6 s; se para fuera de pantalla */
  if (!reducido){
    $$('.rueda').forEach(function(r){
      var items = r.children, i = 0, t = null, visible = true, listo = false, ms = +r.dataset.intervalo || 2600;
      function paso(){
        var actual = items[i]; i = (i + 1) % items.length; var sig = items[i];
        Array.prototype.forEach.call(items, function(el){ if (el !== actual) el.classList.remove('sale'); });
        actual.classList.remove('activa'); actual.classList.add('sale'); sig.classList.remove('sale'); sig.classList.add('activa');
      }
      function arrancar(){ if (listo && !t && visible && !document.hidden) t = setInterval(paso, ms); }
      function parar(){ clearInterval(t); t = null; }
      setTimeout(function(){ listo = true; paso(); arrancar(); }, 2000);
      if (conIO) new IntersectionObserver(function(e){ visible = e[0].isIntersecting; visible ? arrancar() : parar(); }).observe(r);
      document.addEventListener('visibilitychange', function(){ document.hidden ? parar() : arrancar(); });
    });
  }

  /* ================= Entradas al bajar (M10) ================= */
  $$('.grupo, .pasos, .faq').forEach(function(g){ $$('.reveal', g).forEach(function(el, i){ el.style.setProperty('--retraso', Math.min(i, 6) * 60 + 'ms'); }); });
  if (conIO && !reducido){
    var ioRev = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); ioRev.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
    $$('.reveal').forEach(function(el){ ioRev.observe(el); });
  } else { $$('.reveal').forEach(function(el){ el.classList.add('visto'); }); }

  /* ================= Pausa fuera de pantalla ================= */
  if (conIO){
    var ioMov = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    $$('.mov').forEach(function(el){ ioMov.observe(el); });
  }

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

  /* ================= Resaltado deslizante (barra y filtros de la carta) ================= */
  var resaltados = [];
  $$('.resalta').forEach(function(cont){
    var res = cont.querySelector('.resalte'), items = $$('.r-item', cont), actual = null;
    function reposo(){ return cont.querySelector('.r-item[aria-current="true"], .r-item[aria-pressed="true"]'); }
    function ir(el, sin){
      if (actual) actual.classList.remove('sobre');
      if (!el){ res.classList.remove('listo'); actual = null; return; }
      var c = cont.getBoundingClientRect(), r = el.getBoundingClientRect();
      var saltar = sin || reducido || !res.classList.contains('listo');
      if (saltar) res.style.transition = 'none';
      res.style.clipPath = 'inset(' + (r.top - c.top) + 'px ' + (c.right - r.right) + 'px ' + (c.bottom - r.bottom) + 'px ' + (r.left - c.left) + 'px round 4px)';
      if (saltar){ res.offsetWidth; res.style.transition = ''; }
      res.classList.add('listo'); el.classList.add('sobre'); actual = el;
    }
    ir(reposo(), true);
    if (raton){
      items.forEach(function(el){ el.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') ir(el); }); });
      cont.addEventListener('pointerleave', function(){ ir(reposo()); });
    }
    cont.addEventListener('focusin', function(e){ var el = e.target.closest('.r-item'); if (el) ir(el); });
    cont.addEventListener('focusout', function(e){ if (!cont.contains(e.relatedTarget)) ir(reposo()); });
    if ('ResizeObserver' in window) new ResizeObserver(function(){ ir(actual || reposo(), true); }).observe(cont);
    resaltados.push({cont:cont, volver:function(){ ir(reposo()); }});
  });
  function volverResaltado(cont){ resaltados.forEach(function(r){ if (r.cont === cont) r.volver(); }); }

  var nav = document.querySelector('.nav');
  if (nav && conIO){
    var enlaces = $$('.r-item', nav), visibles = {};
    var ioNav = new IntersectionObserver(function(es){
      es.forEach(function(e){ visibles[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var mejor = null, max = 0; Object.keys(visibles).forEach(function(id){ if (visibles[id] > max){ max = visibles[id]; mejor = id; } });
      enlaces.forEach(function(a){ if (a.getAttribute('href') === '#' + mejor) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      if (!nav.matches(':hover')) volverResaltado(nav);
    }, {rootMargin:'-30% 0px -50% 0px', threshold:[0, .25, .5, .75, 1]});
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

  /* ================= Carta: filtro con View Transitions (M50) ================= */
  var hoja = document.getElementById('hoja');
  if (hoja){
    var puedeVT = typeof document.startViewTransition === 'function' && !reducido;
    var cats = $$('.cat', hoja), platos = $$('.plato', hoja), css = '';
    cats.forEach(function(c, i){ c.style.viewTransitionName = 'cat-' + i; });
    platos.forEach(function(p, i){ p.style.viewTransitionName = 'pl-' + i; });
    cats.forEach(function(c){ $$('.plato', c).forEach(function(p, i){ if (i) css += '::view-transition-group(' + p.style.viewTransitionName + '){animation-delay:' + Math.min(i, 5) * 20 + 'ms}'; }); });
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var filtros = $$('[data-filtro]'), contFiltros = document.querySelector('.filtros');
    filtros.forEach(function(b){
      b.addEventListener('click', function(){
        var f = b.dataset.filtro;
        if (b.getAttribute('aria-pressed') === 'true') return;
        var cambio = function(){
          filtros.forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
          cats.forEach(function(c){ c.hidden = !(f === 'todo' || c.dataset.cat === f); });
          hoja.classList.toggle('una', f !== 'todo');
        };
        var hecho = function(){
          volverResaltado(contFiltros);
          var top = hoja.getBoundingClientRect().top;
          if (top < 0) scrollTo({top: scrollY + top - 110, behavior: reducido ? 'auto' : 'smooth'});
        };
        if (puedeVT){ document.startViewTransition(cambio).finished.then(hecho, hecho); } else { cambio(); hecho(); }
        b.scrollIntoView({block:'nearest', inline:'nearest'});
      });
    });

    /* Miniatura que crece hasta la foto grande (M51) */
    var visor = document.getElementById('visor'), grande = visor.querySelector('img'), pie = visor.querySelector('figcaption'), origen = null;
    hoja.addEventListener('click', function(e){
      var btn = e.target.closest('button.mini'); if (!btn) return;
      var li = btn.closest('.plato'), mini = btn.querySelector('img'); origen = mini;
      var abrir = function(){ mini.style.viewTransitionName = ''; grande.src = li.dataset.grande; grande.alt = li.dataset.alt; pie.textContent = li.dataset.alt + ' (foto de un cliente en Google Maps)';
        grande.style.viewTransitionName = 'foto-grande'; visor.showModal(); };
      if (puedeVT){ li.style.viewTransitionName = ''; mini.style.viewTransitionName = 'foto-grande';
        var g = new Image(); g.src = li.dataset.grande;
        var ir = function(){ document.startViewTransition(abrir).finished.then(function(){ li.style.viewTransitionName = 'pl-' + platos.indexOf(li); }); };
        if (g.decode) g.decode().then(ir, ir); else ir();
      } else abrir();
    });
    var cerrarVisor = function(){
      var t = function(){ grande.style.viewTransitionName = ''; visor.close(); };
      if (puedeVT && origen){ var li = origen.closest('.plato'); li.style.viewTransitionName = '';
        var vt = document.startViewTransition(function(){ t(); origen.style.viewTransitionName = 'foto-grande'; });
        vt.finished.then(function(){ origen.style.viewTransitionName = ''; li.style.viewTransitionName = 'pl-' + platos.indexOf(li); });
      } else t();
    };
    visor.querySelector('.visor-cerrar').addEventListener('click', cerrarVisor);
    visor.addEventListener('cancel', function(e){ e.preventDefault(); cerrarVisor(); });
    visor.addEventListener('click', function(e){ if (e.target === visor) cerrarVisor(); });
    visor.addEventListener('close', function(){ if (origen) origen.parentNode.focus(); });

    /* Foto flotante junto al cursor en los platos con foto (M32, solo ratón) */
    if (raton){
      var fig = document.createElement('figure'); fig.className = 'flota'; fig.setAttribute('aria-hidden', 'true');
      var fimg = document.createElement('img'); fimg.alt = ''; fimg.width = 240; fimg.height = 300; fig.appendChild(fimg); document.body.appendChild(fig);
      var W = 240, H = 300, x = 0, y = 0, tx = 0, ty = 0, rot = 0, raf = null, visible = false;
      var limitar = function(){ tx = Math.max(12, Math.min(innerWidth - W - 12, tx)); ty = Math.max(12, Math.min(innerHeight - H - 12, ty)); };
      var bucle = function(){ var dx = tx - x; x += dx * .18; y += (ty - y) * .18; rot += (Math.max(-6, Math.min(6, dx * .08)) - rot) * .2;
        fig.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px'; fig.style.rotate = rot.toFixed(2) + 'deg';
        if (Math.abs(tx - x) < .3 && Math.abs(ty - y) < .3 && Math.abs(rot) < .05 && !visible){ raf = null; return; } raf = requestAnimationFrame(bucle); };
      var mover = function(e){ tx = e.clientX + 28; ty = e.clientY - H / 2; limitar();
        if (reducido){ x = tx; y = ty; fig.style.translate = x + 'px ' + y + 'px'; return; } if (!raf) raf = requestAnimationFrame(bucle); };
      platos.forEach(function(f){
        f.addEventListener('pointerenter', function(e){
          if (e.pointerType !== 'mouse') return;
          if (!f.dataset.foto){ fig.classList.remove('ve'); visible = false; return; }
          if (!visible){ tx = e.clientX + 28; ty = e.clientY - H / 2; limitar(); x = tx; y = ty + 16; }
          fimg.src = f.dataset.foto; visible = true; fig.classList.add('ve'); mover(e);
        });
        f.addEventListener('pointermove', function(e){ if (e.pointerType === 'mouse' && f.dataset.foto) mover(e); });
      });
      $$('.lista', hoja).forEach(function(l){ l.addEventListener('pointerleave', function(){ visible = false; fig.classList.remove('ve'); }); });
      addEventListener('scroll', function(){ if (visible){ visible = false; fig.classList.remove('ve'); } }, {passive:true});
    }

    /* Franja con la cinta de platos que entra por el borde del cursor (M34, solo ratón) */
    if (raton){
      var borde = function(el, yy){ var r = el.getBoundingClientRect(); return (yy - r.top) < r.height / 2 ? -1 : 1; };
      var colocar = function(f, s){ f.style.translate = '0 ' + (101 * s) + '%'; f.firstElementChild.style.translate = '0 ' + (-101 * s) + '%'; };
      $$('.cat-tit', hoja).forEach(function(t){
        var f = t.querySelector('.franja');
        t.addEventListener('pointerenter', function(e){ if (e.pointerType !== 'mouse') return;
          f.classList.remove('anima', 'dentro'); colocar(f, borde(t, e.clientY)); f.offsetWidth;
          f.classList.add('anima'); f.style.translate = ''; f.firstElementChild.style.translate = ''; f.classList.add('dentro'); });
        t.addEventListener('pointerleave', function(e){ if (e.pointerType !== 'mouse') return;
          f.classList.add('anima'); f.classList.remove('dentro'); colocar(f, borde(t, e.clientY)); });
      });
    }
  }

  /* Pista de que la barra de filtros se desliza (móvil): desvanecido a la derecha hasta llegar al final */
  $$('.filtros-desliza').forEach(function(d){
    var mirar = function(){ d.classList.toggle('al-final', d.scrollLeft + d.clientWidth >= d.scrollWidth - 4); };
    d.addEventListener('scroll', mirar, {passive:true}); addEventListener('resize', mirar); mirar();
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

  /* ================= Brasas de la llamada final (movimiento-marca) ================= */
  if (!reducido){
    $$('.brasas').forEach(function(c){
      var n = innerWidth < 760 ? (+c.dataset.nMovil || 8) : (+c.dataset.n || 14), semilla = n * 37 + 11;
      var r = function(){ semilla = (semilla * 9301 + 49297) % 233280; return semilla / 233280; };
      for (var i = 0; i < n; i++){
        var e = document.createElement('i');
        e.style.setProperty('--x', (r() * 98).toFixed(1) + '%'); e.style.setProperty('--s', (5 + Math.floor(r() * 6)) + 'px');
        e.style.setProperty('--t', (7 + r() * 7).toFixed(1) + 's'); e.style.setProperty('--d', (-r() * 12).toFixed(1) + 's');
        e.style.setProperty('--dx', Math.round((r() - .5) * 90) + 'px'); c.appendChild(e);
      }
    });
    var alturaBrasas = function(){ $$('.brasas').forEach(function(c){ c.style.setProperty('--h', c.parentNode.offsetHeight + 'px'); }); };
    alturaBrasas(); addEventListener('resize', alturaBrasas);
  }

  /* ================= Interacciones con ratón (interacciones-cursor v3) ================= */
  if (raton && !reducido){
    $$('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    $$('.foto-iman').forEach(function(f){
      var img = f.querySelector('img'), sello = f.querySelector('.sello');
      f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        f.style.translate = (x * 30).toFixed(1) + 'px ' + (y * 26).toFixed(1) + 'px';
        img.style.translate = (x * -12).toFixed(1) + 'px ' + (y * -10).toFixed(1) + 'px'; img.style.scale = '1.04';
        if (sello) sello.style.translate = (x * 24).toFixed(1) + 'px ' + (y * 18).toFixed(1) + 'px'; });
      f.addEventListener('pointerleave', function(){ f.style.translate = ''; img.style.translate = ''; img.style.scale = ''; if (sello) sello.style.translate = ''; });
    });
    var SEL = '.pollo-tarjeta, .faq details', pendR = null;
    document.addEventListener('mousemove', function(e){
      if (pendR) return;
      pendR = requestAnimationFrame(function(){ pendR = null; var el = e.target && e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
    });
    $$('.inclina').forEach(function(t){
      var raf = null;
      t.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function(){ var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          t.style.transform = 'perspective(900px) rotateX(' + (-y * 6).toFixed(2) + 'deg) rotateY(' + (x * 8).toFixed(2) + 'deg)'; }); });
      t.addEventListener('pointerleave', function(){ if (raf) cancelAnimationFrame(raf); t.style.transform = ''; });
    });
  }

  /* ================= Mapa real solo al pulsar (ubicacion-mapa v3) ================= */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa){
    btnMapa.addEventListener('click', function(){
      var caja = document.getElementById('mapa'), fachada = document.getElementById('mapaFachada'); if (!fachada) return;
      var f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Asador El Campestre, C. Donantes de Sangre 3, 45200 Illescas, Toledo') + '&hl=es&z=17&output=embed';
      f.title = 'Mapa con la ubicación de Asador El Campestre'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
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
        /* name="faq": cerrar a mano la que esté abierta, para que también se anime */
        $$('.faq details[open]').forEach(function(o){ if (o !== el) o.querySelector('summary').click(); });
        el.style.height = el.offsetHeight + 'px'; el.open = true;
        requestAnimationFrame(function(){ abriendo = true; animar(el.offsetHeight + 'px', (resumen.offsetHeight + contenido.offsetHeight) + 'px', true); });
      } else if (abriendo || el.open){ cerrando = true; animar(el.offsetHeight + 'px', resumen.offsetHeight + 'px', false); }
    });
  });

  /* ================= Barra fija móvil (barra-pegajosa-movil) ================= */
  var barra = document.getElementById('barraMovil');
  if (barra){
    var act = function(){ barra.classList.toggle('visible', scrollY > innerHeight * .7); };
    addEventListener('scroll', function(){ requestAnimationFrame(act); }, {passive:true}); act();
  }
})();
