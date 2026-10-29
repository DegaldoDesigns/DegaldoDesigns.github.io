/* sitio.js · El Cardenal Gastrobar. Bloques copiados de la librería (01-Libreria-de-Codigo/componentes) tal cual,
   marcados con su nombre; al final, lo propio del sitio (horario de hoy, pestaña de la carta, mapa, barra móvil). */

/* ===== cuatro-caminos (M133) v1.1 ===== */
/* cuatro-caminos (M133) · v1 */
(function(){
  var NS = 'http://www.w3.org/2000/svg';
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ESTRELLA = 'M50 0C55 33 67 45 100 50 67 55 55 67 50 100 45 67 33 55 0 50 33 45 45 33 50 0Z';
  function ms(el, p){ var v = getComputedStyle(el).getPropertyValue(p).trim(); return parseFloat(v) * (/[^m]s$/.test(v) ? 1000 : 1) || 0; }

  function colocar(el){
    var c = el._cc, compacto = el.offsetWidth > 0 && el.offsetWidth < (+el.getAttribute('data-cc-compacto') || 340);
    el.classList.toggle('cc-compacto', compacto);
    var giro = compacto ? -180 / c.n : 0;   /* con 4: el primero arriba a la izquierda */
    el.style.setProperty('--cc-giro', giro + 'deg');
    var tope = parseFloat(getComputedStyle(el).getPropertyValue('--cc-r2-compacto')) / parseFloat(getComputedStyle(el).getPropertyValue('--cc-r2')) || 1.3;
    c.rot.forEach(function(r, i){
      var ang = (c.ang[i] + giro) * Math.PI / 180, co = Math.cos(ang), si = Math.sin(ang);
      /* en compacto, cada brazo se alarga hasta el mismo margen del borde (más en diagonal), sin pasar del tope */
      var f = compacto ? Math.min(1 / Math.max(Math.abs(co), Math.abs(si)), tope) : 1;
      [r, c.eje[i]].forEach(function(x){ x.style.setProperty('--cc-rx', 'calc(var(--cc-r2) * ' + f.toFixed(3) + ')'); });
      r.classList.remove('cc-h-der', 'cc-h-izq', 'cc-v-arr');
      if (Math.abs(co) >= .3) r.classList.add(co > 0 ? 'cc-h-der' : 'cc-h-izq');
      if (si < -.3 || Math.abs(co) >= .3 && si <= .3) r.classList.add('cc-v-arr');
    });
  }

  function montar(el){
    if (el._cc) return;
    var img = el.querySelector('.cc-img'), fuente = [].slice.call(el.querySelectorAll(':scope > .cc-rotulo'));
    var n = Math.max(2, Math.min(6, fuente.length)), logo = document.createElement('span');
    logo.className = 'cc-logo';
    if (img){ el.appendChild(logo); logo.appendChild(img); }
    if (img && el.getAttribute('data-cc-luz') !== 'no'){
      var luz = document.createElement('span'); luz.className = 'cc-luz'; luz.appendChild(document.createElement('i'));
      luz.style.setProperty('--cc-mascara', 'url("' + img.src + '")');   /* URL absoluta (ver borde-animado v2.1) */
      logo.appendChild(luz);
    }
    var c = el._cc = {n:n, ang:[], rot:[], eje:[]}, punto = el.getAttribute('data-cc-punto') === 'punto';
    fuente.slice(0, n).forEach(function(f, i){
      var a = -90 + i * 360 / n; c.ang.push(a);
      var eje = document.createElement('span'), fil = document.createElement('span'), pt = document.createElement('span');
      eje.className = 'cc-eje'; eje.style.setProperty('--a', a + 'deg'); eje.style.setProperty('--i', i);
      fil.className = 'cc-filete'; pt.className = 'cc-punto';
      var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100');
      var p = document.createElementNS(NS, punto ? 'circle' : 'path');
      if (punto){ p.setAttribute('cx', 50); p.setAttribute('cy', 50); p.setAttribute('r', 22); } else p.setAttribute('d', ESTRELLA);
      svg.appendChild(p); pt.appendChild(svg); eje.appendChild(fil); eje.appendChild(pt);
      var r = document.createElement('span'); r.className = 'cc-rot'; r.textContent = f.textContent;
      r.style.setProperty('--a', a + 'deg'); r.style.setProperty('--i', i);
      el.appendChild(eje); el.appendChild(r); c.rot.push(r); c.eje.push(eje); f.remove();
    });
    c.fin = ms(el, '--cc-luz-t') + 700;
    colocar(el);
  }

  function clave(el){ return 'cc:' + location.pathname + ':' + (el.id || [].indexOf.call(document.querySelectorAll('.cc'), el)); }
  function visto(el, poner){ try { if (poner) sessionStorage.setItem(clave(el), '1'); else return sessionStorage.getItem(clave(el)) === '1'; } catch(e){ return false; } }
  function terminar(el){
    if (el.classList.contains('cc-hecho')) return;
    clearTimeout(el._cc.t); el.classList.add('cc-hecho');
    el.dispatchEvent(new CustomEvent('caminos:fin', {bubbles:true}));
  }
  /* Lo que falta, en 150 ms: se acelera cada animación en marcha */
  function acelerar(el){
    if (!el.classList.contains('cc-on') || el.classList.contains('cc-hecho')) return;
    var anis = el.getAnimations ? el.getAnimations({subtree:true}) : [];
    if (!anis.length){ el.classList.add('cc-final'); return terminar(el); }
    anis.forEach(function(a){ var t = a.effect.getComputedTiming(), quedan = t.endTime - (a.currentTime || 0);
      if (quedan > 0) a.playbackRate = Math.max(1, quedan / 150); });
    clearTimeout(el._cc.t); el._cc.t = setTimeout(function(){ terminar(el); }, 160);
  }
  function final(el){ el.classList.add('cc-on', 'cc-final'); clearTimeout(el._cc.t); el._cc.t = setTimeout(function(){ terminar(el); }, 0); }

  function iniciar(el){
    montar(el); if (el.classList.contains('cc-on')) return;
    if (document.hidden || (el.getAttribute('data-una-vez') === 'sesion' && visto(el))) return final(el), visto(el, true);
    visto(el, true);
    if (reducido) return final(el);
    el.classList.add('cc-on');
    el._cc.t = setTimeout(function(){ terminar(el); }, el._cc.fin);
  }
  function reiniciar(el){
    montar(el); clearTimeout(el._cc.t);
    el.classList.remove('cc-on', 'cc-final', 'cc-hecho');
    void el.offsetWidth; el.classList.add('cc-on');
    if (reducido) return final(el);
    el._cc.t = setTimeout(function(){ terminar(el); }, el._cc.fin);
  }
  window.CuatroCaminos = {iniciar:iniciar, reiniciar:reiniciar};

  var todos = [].slice.call(document.querySelectorAll('.cc'));
  todos.forEach(function(el){
    montar(el);
    var modo = el.getAttribute('data-caminos') || 'carga';
    if (modo === 'carga') iniciar(el);
    else if (modo === 'al-ver'){
      if (!('IntersectionObserver' in window)) return iniciar(el);
      var io = new IntersectionObserver(function(es){ if (es[0].intersectionRatio >= .5){ io.disconnect(); iniciar(el); } }, {threshold:[0, .5, 1]});
      io.observe(el);
    }
  });
  /* Primer gesto: acabar ya */
  /* v1.1: el scroll de un elemento (una tira de pestañas que se centra sola) no cuenta como gesto: solo el de la página */
  var gesto = function(e){ if (e && e.type === 'scroll' && e.target !== document) return; todos.forEach(acelerar); ['wheel', 'keydown', 'touchstart', 'pointerdown', 'scroll'].forEach(function(t){ removeEventListener(t, gesto, true); }); };
  ['wheel', 'keydown', 'touchstart', 'pointerdown', 'scroll'].forEach(function(t){ addEventListener(t, gesto, {capture:true, passive:true}); });
  /* Cambio de ancho: recolocar y, si estaba a medias, al estado final */
  var ancho = innerWidth;
  addEventListener('resize', function(){
    todos.forEach(colocar);
    if (innerWidth !== ancho){ ancho = innerWidth;
      todos.forEach(function(el){ if (el.classList.contains('cc-on') && !el.classList.contains('cc-hecho')){ el.classList.add('cc-final'); terminar(el); } }); }
  });
})();

/* ===== anillo-horario (M86) v1 ===== */
/* M86 anillo-horario */
(function(){
  var NS = 'http://www.w3.org/2000/svg', DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ahora(zona){
    try{
      var o = {};
      new Intl.DateTimeFormat('en-US', {timeZone:zona, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour) * 60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours() * 60 + n.getMinutes()}; }
  }
  function hora(m){ if (m > 1440) m -= 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }   // 1440 = "24:00"
  function art(m){ var h = Math.floor((m > 1440 ? m - 1440 : m) / 60); return (h === 1 ? 'la ' : 'las ') + hora(m); }   // "la 1:00", "las 2:00"
  function estado(H, t){
    var hoy = H[t.d] || [], i, k;
    for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {abierto:true, jornada:t.d, cierra:hoy[i][1]};
    var ayer = (t.d + 6) % 7, tra = H[ayer] || [];
    for (i = 0; i < tra.length; i++) if (tra[i][1] > 1440 && t.min < tra[i][1] - 1440) return {abierto:true, jornada:ayer, cierra:tra[i][1]};
    for (k = 0; k < 8; k++){ var dia = (t.d + k) % 7, tr = H[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.min > 0) return {abierto:false, jornada:t.d, k:k, dia:dia, abre:tr[i][0]}; }
    return {abierto:false, jornada:t.d, k:-1};
  }
  function punto(r, m){ var a = m / 1440 * 2 * Math.PI; return (50 + r * Math.sin(a)).toFixed(3) + ' ' + (50 - r * Math.cos(a)).toFixed(3); }
  function arco(r, a, b){
    if (b - a >= 1440) return 'M50 ' + (50 - r) + 'A' + r + ' ' + r + ' 0 1 1 50 ' + (50 + r) + 'A' + r + ' ' + r + ' 0 1 1 50 ' + (50 - r);
    return 'M' + punto(r, a) + 'A' + r + ' ' + r + ' 0 ' + (b - a > 720 ? 1 : 0) + ' 1 ' + punto(r, b);
  }
  function el(tag, at){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }

  Array.prototype.forEach.call(document.querySelectorAll('.ah[data-horario]:not([data-ah-escala="semana"])'), function(ah){
    var cfg; try{ cfg = JSON.parse(ah.getAttribute('data-horario')); }catch(e){ return; }
    var zona = cfg.zona || 'Europe/Madrid', H = cfg.dias || {}, svg = ah.querySelector('.ah-anillo'), mini = ah.getAttribute('data-tam') === 'mini';
    var est = document.getElementById(ah.getAttribute('data-estado-en') || '') || (function(n){ while (n && !(n.classList && n.classList.contains('ah-estado'))) n = n.nextElementSibling; return n; })(ah.nextElementSibling);
    var grupo = el('g', {'class':'ah-tramos'}), aguja = el('g', {'class':'ah-ahora'}), firma = '';
    aguja.appendChild(el('circle', {'class':'ah-halo', cx:50, cy:4, r:mini ? 9 : 6}));
    aguja.appendChild(el('circle', {'class':'ah-punto', cx:50, cy:4, r:mini ? 6 : 3.4}));
    svg.appendChild(grupo); svg.appendChild(aguja);
    if (!reducido) ah.classList.add('ah-dibuja');
    function set(sel, v){ var n = est && est.querySelector(sel); if (n && n.textContent !== v) n.textContent = v; }
    function pintar(){
      var t = ahora(zona), e = estado(H, t), tramos = H[e.jornada] || [];
      ah.setAttribute('data-estado', e.abierto ? 'abierto' : 'cerrado');
      aguja.style.rotate = (t.min / 1440 * 360).toFixed(2) + 'deg';
      var f = e.jornada + ':' + JSON.stringify(tramos);
      if (f !== firma){                                   // solo se rehace si cambia la jornada
        firma = f; grupo.textContent = '';
        Array.prototype.forEach.call(ah.querySelectorAll('.ah-hora'), function(n){ n.remove(); });
        var usados = [];
        tramos.forEach(function(tr){
          grupo.appendChild(el('path', {'class':'ah-tramo', d:arco(46, tr[0], tr[1]), pathLength:1}));
          if (mini) return;
          [tr[0], tr[1]].forEach(function(m){
            var g = (m % 1440) / 4;
            if (usados.some(function(u){ var d = Math.abs(u - g) % 360; return Math.min(d, 360 - d) < 22; })) return;
            usados.push(g);
            var s = document.createElement('span'); s.className = 'ah-hora'; s.setAttribute('aria-hidden', 'true'); s.textContent = hora(m);
            s.style.setProperty('--sx', Math.sin(g * Math.PI / 180).toFixed(4)); s.style.setProperty('--cy', Math.cos(g * Math.PI / 180).toFixed(4));
            ah.appendChild(s);
          });
        });
      }
      set('.ah-palabra', e.abierto ? 'Abierto' : 'Cerrado');
      set('.ah-detalle', e.abierto ? 'hasta ' + art(e.cierra)
        : e.k < 0 ? 'consulta el horario'
        : (e.k === 0 ? 'abrimos hoy ' : e.k === 1 ? 'abrimos mañana ' : 'abrimos el ' + DIA[e.dia] + ' ') + 'a ' + art(e.abre));
      set('.ah-hoy', tramos.length ? (e.jornada === t.d ? 'Hoy' : DIA[e.jornada].charAt(0).toUpperCase() + DIA[e.jornada].slice(1)) + ', ' + tramos.map(function(tr){ return 'de ' + hora(tr[0]) + ' a ' + hora(tr[1]); }).join(' y ') : '');
      ah.classList.add('ah-listo');
    }
    pintar(); setInterval(pintar, 60000);
    if ('IntersectionObserver' in window){
      var visto = false;
      new IntersectionObserver(function(ents){ ents.forEach(function(en){
        ah.classList.toggle('ah-fuera', !en.isIntersecting);
        if (en.isIntersecting && !visto){ visto = true; requestAnimationFrame(function(){ ah.classList.add('ah-visto'); }); }
      }); }, {threshold:.5}).observe(ah);
    } else ah.classList.add('ah-visto');
  });
})();

/* ===== lista-fijada-foto (M27) v2.2 ===== */
(function(){
  var secciones = document.querySelectorAll('.lf');
  if (!secciones.length) return;
  var puede = 'IntersectionObserver' in window && window.CSS && CSS.supports('height', '100svh');

  Array.prototype.forEach.call(secciones, function(sec){
    /* v2: ancho mínimo para fijar, por sección (data-lf-desde="1000"; 768 por defecto) */
    var mq = window.matchMedia('(min-width: ' + (+sec.dataset.lfDesde || 768) + 'px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)');
    var items = Array.prototype.slice.call(sec.querySelectorAll('.lf-item'));
    sec.style.setProperty('--lf-n', items.length);
    if (!puede || items.length < 2) return;
    var lineas = items.map(function(it){ return it.querySelector('.lf-linea i'); });
    var texto = sec.querySelector('.lf-texto');
    var marcas = items.map(function(_, i){
      var m = document.createElement('span');
      m.className = 'lf-marca';
      m.setAttribute('aria-hidden', 'true');
      m.style.setProperty('--i', i);
      sec.appendChild(m);
      return m;
    });
    var activo = 0, cerca = false, pedido = false;

    function fijada(){ return sec.classList.contains('lf-fijada'); }

    function marcar(i){
      if (i < 0) return;
      activo = i;
      items.forEach(function(it, k){ it.classList.toggle('es-activo', k === i); });
      pintar();
    }

    function pintar(){
      pedido = false;
      if (!fijada()) return;
      var tramo = marcas[0].offsetHeight || 1;
      var bajado = -sec.getBoundingClientRect().top;
      lineas.forEach(function(l, k){
        if (!l) return;
        var p = k < activo ? 1 : k > activo ? 0 : Math.min(1, Math.max(0, (bajado - k * tramo) / tramo));
        l.style.scale = p.toFixed(3) + ' 1';
      });
    }

    function altoContenido(el){
      var h = 0;
      Array.prototype.forEach.call(el.children, function(c){
        var cs = getComputedStyle(c);
        h += c.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
      });
      return h;
    }

    function pedir(){ if (cerca && !pedido){ pedido = true; requestAnimationFrame(pintar); } }

    function modo(){
      sec.classList.toggle('lf-fijada', mq.matches);
      /* si el texto no cabe en la pantalla, mejor la lista normal que cortarlo */
      if (fijada() && texto && altoContenido(texto) > texto.clientHeight + 2) sec.classList.remove('lf-fijada');
      if (!fijada()) lineas.forEach(function(l){ if (l) l.style.scale = ''; });
      pintar();
    }

    marcar(0);
    modo();
    if (mq.addEventListener) mq.addEventListener('change', modo); else mq.addListener(modo);

    var ioMarcas = new IntersectionObserver(function(entradas){
      entradas.forEach(function(e){ if (e.isIntersecting) marcar(marcas.indexOf(e.target)); });
    }, { rootMargin: '-49% 0px -49% 0px', threshold: 0 });
    marcas.forEach(function(m){ ioMarcas.observe(m); });

    new IntersectionObserver(function(entradas){
      cerca = entradas[0].isIntersecting;
      if (cerca) pintar();
    }, { rootMargin: '100px 0px' }).observe(sec);

    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', function(){ modo(); pedir(); });

    /* teclado: si el foco entra en un punto que no es el activo, ir a su tramo para que la foto coincida */
    sec.addEventListener('focusin', function(e){
      var it = e.target.closest('.lf-item');
      var k = items.indexOf(it);
      if (!fijada() || k < 0 || k === activo) return;
      var y = window.scrollY + sec.getBoundingClientRect().top + k * marcas[0].offsetHeight + 2;
      window.scrollTo({ top: y, behavior: 'auto' });
    });
  });
})();

/* ===== resaltado-deslizante v3.1 (.rd-punto) ===== */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches, raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('.rd-punto').forEach(function(nav){
    var punto = nav.querySelector('.rd-pto'), enlaces = [].slice.call(nav.querySelectorAll('a')), activo = null;
    function ir(a, sin){
      if (!a || !a.offsetWidth){ punto.classList.remove('listo'); return; }
      var saltar = sin || reducido || !punto.classList.contains('listo');
      if (saltar) punto.style.transition = 'none';
      punto.style.translate = (a.offsetLeft + a.offsetWidth / 2 - punto.offsetWidth / 2).toFixed(1) + 'px ' + (a.offsetTop + a.offsetHeight + 4 - punto.offsetTop).toFixed(1) + 'px';
      if (saltar){ void punto.offsetWidth; punto.style.transition = ''; }
      punto.classList.add('listo');
    }
    function marcar(id){
      enlaces.forEach(function(a){ var si = a.getAttribute('href') === '#' + id; a.classList.toggle('activo', si); if (si) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      activo = nav.querySelector('a.activo'); ir(activo);
    }
    if ('IntersectionObserver' in window){
      var visibles = {};
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ visibles[e.target.id] = e.isIntersecting; });
        var id = null; enlaces.forEach(function(a){ var k = a.getAttribute('href').slice(1); if (visibles[k] && !id) id = k; });
        marcar(id);
      }, {rootMargin:'-45% 0px -50% 0px'});
      enlaces.forEach(function(a){ var sec = document.getElementById(a.getAttribute('href').slice(1)); if (sec) io.observe(sec); });
    }
    if (raton){
      enlaces.forEach(function(a){ a.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') ir(a); }); });
      nav.addEventListener('pointerleave', function(){ ir(activo); });
    }
    nav.addEventListener('focusin', function(e){ if (e.target.matches('a')) ir(e.target); });
    nav.addEventListener('focusout', function(){ ir(activo); });
    new ResizeObserver(function(){ ir(activo, true); }).observe(nav);
  });
})();

/* ===== cabecera-inteligente v1 ===== */
(function(){
  var cab = document.getElementById('cabecera');
  if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && 'IntersectionObserver' in window){
    new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(document.querySelector('.centinela'));
  }
  var ultimo = scrollY, pend = false;
  addEventListener('scroll', function(){
    if (pend) return; pend = true;
    requestAnimationFrame(function(){
      pend = false;
      var y = scrollY, d = y - ultimo;
      if (Math.abs(d) < 8) return;
      if (y < 120 || d < 0 || document.documentElement.matches(':has(#menu:popover-open)')) cab.classList.remove('oculta'); else cab.classList.add('oculta');
      ultimo = y;
    });
  }, {passive:true});
})();

/* ===== menu-escalonado v1 (M52) ===== */
(function(){
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb');
  if (!menu || !hamb || !menu.showPopover) return;
  function centrar(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); }
  hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar); centrar();
  menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
  menu.addEventListener('toggle', function(e){
    var abierto = e.newState === 'open';
    hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    if (!abierto) hamb.focus();
  });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
})();

/* ===== texto-revelado-scroll v5 (M14): trocear la frase ===== */
(function(){
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
})();

/* ===== titular-entre-filetes (M71): .visto al verse, una vez ===== */
(function(){
  var tits = document.querySelectorAll('.tf');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){ tits.forEach(function(t){ t.classList.add('visto'); }); return; }
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -8% 0px'});
  tits.forEach(function(t){ io.observe(t); });
})();

/* ===== aparecer al bajar (.reveal, base M10 con IntersectionObserver) ===== */
(function(){
  var els = document.querySelectorAll('.reveal, .destapa');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){ els.forEach(function(e){ e.classList.add('visto'); }); return; }
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
  els.forEach(function(e){ io.observe(e); });
})();

/* ===== decoracion-parallax (M15) + pausa fuera de pantalla ===== */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ io.observe(el); });
  }
  var capas = [].slice.call(document.querySelectorAll('[data-px],[data-py]'));
  if (!capas.length || reducido) return;
  var pend = null;
  function parallax(){ pend = null; var vh = innerHeight;
    capas.forEach(function(el){ var r = (el.closest('section, footer') || el.parentNode).getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
      if (el.dataset.px) el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0';
      else el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; });
  }
  addEventListener('scroll', function(){ if (!pend) pend = requestAnimationFrame(parallax); }, {passive:true});
  addEventListener('resize', parallax); parallax();
})();

/* ===== interacciones-cursor v3 (M30): imán y resplandor delegado ===== */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!raton || reducido) return;
  document.querySelectorAll('.iman').forEach(function(b){
    b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
      b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
    b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
  });
  var SEL = '.resena, details', pend = null;
  document.addEventListener('mousemove', function(e){
    if (pend) return;
    pend = requestAnimationFrame(function(){ pend = null;
      var el = e.target && e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
      var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
  });
})();


/* ===== acordeon-nativo (altura animada con Web Animations) ===== */
(function(){
  function Acordeon(el){
    var resumen = el.querySelector('summary'), contenido = el.querySelector('.contenido'), anim = null, cerrando = false, abriendo = false;
    function terminar(abierto){ el.open = abierto; anim = null; cerrando = abriendo = false; el.style.height = ''; el.style.overflow = ''; }
    function animar(desde, hasta, abierto){
      if (anim) anim.cancel();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return terminar(abierto);
      anim = el.animate({height:[desde, hasta]}, {duration:250, easing:'cubic-bezier(0.23,1,0.32,1)'});
      anim.onfinish = function(){ terminar(abierto); };
      anim.oncancel = function(){ cerrando = abriendo = false; };
    }
    function cerrar(){ cerrando = true; el.style.overflow = 'hidden'; animar(el.offsetHeight + 'px', resumen.offsetHeight + 'px', false); }
    resumen.addEventListener('click', function(e){
      e.preventDefault(); el.style.overflow = 'hidden';
      if (cerrando || !el.open){
        /* name="faq": la que estaba abierta se cierra con su animación */
        document.querySelectorAll('.faq details[open]').forEach(function(o){ if (o !== el && o._cerrar) o._cerrar(); });
        el.style.height = el.offsetHeight + 'px'; el.open = true;
        requestAnimationFrame(function(){ abriendo = true; animar(el.offsetHeight + 'px', (resumen.offsetHeight + contenido.offsetHeight) + 'px', true); });
      } else { cerrar(); }
    });
    el._cerrar = cerrar;
  }
  document.querySelectorAll('.faq details').forEach(Acordeon);
})();

/* ===== ubicacion-mapa v3.1: el mapa real solo al pulsar ===== */
(function(){
  var btn = document.getElementById('btn-mapa');
  if (!btn) return;
  btn.addEventListener('click', function(){
    var caja = document.getElementById('mapa'), fachada = document.getElementById('fachada-mapa');
    if (!fachada) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('El Cardenal Gastrobar, C. Cardenal Mendoza 8, 19250 Sigüenza') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de El Cardenal Gastrobar'; f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
    caja.appendChild(f); fachada.remove();
  });
})();

/* ===== barra-pegajosa-movil v2: nunca dos «Llamar» a la vez ===== */
(function(){
  var barra = document.getElementById('barra-fija');
  if (!barra) return;
  function actualizar(){ barra.classList.toggle('visible', scrollY > innerHeight * .5); }
  addEventListener('scroll', function(){ requestAnimationFrame(actualizar); }, {passive:true});
  actualizar();
  if (!('IntersectionObserver' in window)) return;
  var vistos = new Set();
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) vistos.add(e.target); else vistos.delete(e.target); }); barra.classList.toggle('tapada', vistos.size > 0); });
  document.querySelectorAll('[data-tapa-barra]').forEach(function(el){ io.observe(el); });
})();

/* ===== Propio del sitio: el horario de hoy (misma tabla que los anillos; CONFIRMAR con el negocio) ===== */
(function(){
  var H = {0:[[480,900],[1200,1380]], 1:[[480,900]], 2:[], 3:[[480,900],[1200,1380]], 4:[[480,900],[1200,1380]], 5:[[480,900],[1200,1380]], 6:[[480,900],[1200,1380]]};
  function ahora(){
    try{ var o = {};
      new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour % 24) * 60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours() * 60 + n.getMinutes()}; }
  }
  function hora(m){ return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  var t = ahora();
  /* la fila de hoy en la lista de la semana */
  document.querySelectorAll('#semana li').forEach(function(li){ var hoy = +li.getAttribute('data-dia') === t.d; li.classList.toggle('hoy', hoy); if (hoy) li.setAttribute('aria-current', 'date'); });
  /* la línea del cierre: el horario de hoy, o cuándo se abre (nunca «hoy no abrimos») */
  var linea = document.getElementById('hoy-linea');
  if (linea){
    var tr = H[t.d] || [];
    if (tr.length) linea.textContent = 'Hoy, de ' + tr.map(function(x){ return hora(x[0]) + ' a ' + hora(x[1]); }).join(' y de ') + '. Calle Cardenal Mendoza, 8, Sigüenza.';
    else { var m = (t.d + 1) % 7; linea.textContent = 'Mañana abrimos a las ' + hora(H[m][0][0]) + '. Calle Cardenal Mendoza, 8, Sigüenza.'; }
  }
  /* la carta en el móvil: antes de las 12:00, la hoja de desayunos (si no se ha llegado por un ancla) */
  /* se hace al acercarse a la carta, no al cargar: centrar la tira de pestañas es un scroll y, al cargar, Chromium deja de medir el LCP */
  var carta = document.getElementById('carta');
  if (t.min < 720 && !location.hash && carta && 'IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){
      if (!es[0].isIntersecting) return; io.disconnect();
      var tab = document.querySelector('.clf-pestana[aria-controls="carta-desayunos"]');
      if (tab && tab.offsetParent && tab.getAttribute('aria-selected') !== 'true'){ tab.click(); var nota = document.getElementById('nota-hora'); if (nota) nota.hidden = false; }
    }, {rootMargin:'100% 0px'});
    io.observe(carta);
  }
})();
