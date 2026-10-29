/* Pub La Isla · JS de la librería (01-Libreria-de-Codigo/componentes), copiado tal cual salvo los datos del negocio:
   vaso-capas (M127) v1, lista-fijada-foto (M27) v2.2, pila-deslizable (M54) v3, resaltado-deslizante (M53) v3,
   cabecera-inteligente (M18), menu-escalonado (M52), decoracion-parallax (M15), interacciones-cursor (M30) v3,
   barra-pegajosa-movil v2 y ubicacion-mapa v3. Lo propio de la web va en sitio.js. */

/* vaso-capas (M127) · v1 */
(function(){
  var D = document, H = D.documentElement; if (!H.classList.contains('js')) return;
  var red = matchMedia('(prefers-reduced-motion: reduce)').matches || H.classList.contains('vc-simula-reducido');
  var EO = 'cubic-bezier(.23,1,.32,1)',
      EM = 'linear(0, .009, .035 2.1%, .141, .281 6.7%, .723 12.9%, .938 16.7%, 1.017, 1.077, 1.121, 1.149 24.3%, 1.159, 1.163, 1.161, 1.154 29.9%, 1.129 32.8%, 1.051 39.6%, 1.017 43.1%, .991, .977 51%, .974 53.8%, .975 57.1%, .997 69.8%, 1.003 76.9%, 1)';
  if (!(window.CSS && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)'))) EM = EO;
  function ms(e, p, d){ var s = getComputedStyle(e).getPropertyValue(p).trim(), x = parseFloat(s); return isNaN(x) ? d : /[^m]s$/.test(s) ? x * 1e3 : x; }
  function visto(e, p){ var k = 'vc:' + location.pathname + ':' + e.id;
    try { if (p) sessionStorage.setItem(k, 1); else return sessionStorage.getItem(k) == '1'; } catch(_){} }
  function an(s, e, f, o){ if (e && e.animate){ o.fill = 'both'; o.easing = o.easing || EO; var a = e.animate(f, o); s.a.push(a); if (!s.vis) a.pause(); } }
  function para(s){ s.t.forEach(clearTimeout); s.a.forEach(function(a){ a.cancel(); }); s.t = []; s.a = []; if (s.rs) removeEventListener('resize', s.rs); }
  function fin(e){ var s = e._s; para(s); e.classList.add('vc-listo'); if (!s.ll){ s.ll = 1; e.dispatchEvent(new CustomEvent('vaso:lleno', {bubbles:true})); } }

  function iniciar(e, o){
    var s = e._s, otra = o && o.repetir, Q = function(c){ return [].slice.call(e.querySelectorAll(c)); };
    if (s.on && !otra) return;
    if (s.on){ para(s); e.classList.remove('vc-listo', 'vc-vuelve'); Q('.vc-vaso, .vc-liquido').forEach(function(x){ x.style.rotate = ''; }); }
    s.on = 1; s.ll = 0;
    var directo = red || (!otra && ((e.getAttribute('data-vc-una-vez') == 'sesion' && visto(e)) || D.hidden));
    visto(e, 1);
    if (directo) return fin(e);
    var r0 = ms(e, '--vc-retraso', 150), hp = ms(e, '--vc-hielo-paso', 90), l0 = ms(e, '--vc-liquido-desde', 300),
        ld = ms(e, '--vc-liquido-dura', 900), cp = ms(e, '--vc-capa-paso', 140), p0 = ms(e, '--vc-pajita-desde', 1050),
        capas = Q('.vc-capa').reverse(), fondo = +(e.getAttribute('data-vc-fondo') || 318), fin0 = 0;
    Q('.vc-cubo').forEach(function(c, i){ var r = getComputedStyle(c).getPropertyValue('--r').trim() || '0deg';
      an(s, c, [{translate:'0 -120px', rotate:'calc(' + r + ' + 30deg)', opacity:0}, {opacity:1, offset:.25}, {translate:'0 0', rotate:r, opacity:1}],
        {duration:260, delay:r0 + i * hp, easing:EM}); });
    capas.forEach(function(c, i){ var y = c.getBBox().y, d = Math.max(0, fondo + 6 - y);
      an(s, c, {translate:['0 ' + d + 'px', '0 0']}, {duration:ld, delay:l0 + i * cp});
      if (c.classList.contains('vc-arriba')) Q('.vc-rizo').forEach(function(z){   /* el rizo va delante de todas: solo se ve al final, cuando su capa ya asoma */
        an(s, z, [{translate:'0 ' + d + 'px', opacity:0}, {opacity:0, offset:.6}, {translate:'0 0', opacity:1}], {duration:ld, delay:l0 + i * cp}); });
      fin0 = Math.max(fin0, l0 + i * cp + ld); });
    Q('.vc-pajita').forEach(function(p){ an(s, p, {translate:['40px -70px', '0 0'], opacity:[0, 1]}, {duration:360, delay:p0, easing:EM}); fin0 = Math.max(fin0, p0 + 360); });
    Q('.vc-adorno').forEach(function(p){ an(s, p, {translate:['0 -26px', '0 0'], opacity:[0, 1]}, {duration:300, delay:p0 + 100, easing:EM}); fin0 = Math.max(fin0, p0 + 400); });
    s.fin = fin0; s.t0 = performance.now(); s.trans = 0;
    reloj(e);
    var aw = innerWidth; s.rs = function(){ if (innerWidth != aw) fin(e); }; addEventListener('resize', s.rs);
  }
  function reloj(e){   /* el final se calcula con el tiempo que ha corrido de verdad (las pausas fuera de pantalla no cuentan) */
    var s = e._s; clearTimeout(s.tf); if (!s.a.length) return;
    var t = s.a.reduce(function(m, a){ return Math.max(m, a.currentTime || 0); }, 0);
    s.tf = setTimeout(function(){ if (!s.vis || !s.a.length) return;   /* fuera de pantalla: el observador lo vuelve a llamar */
      var u = s.a.reduce(function(m, a){ return Math.max(m, a.currentTime || 0); }, 0); if (u >= s.fin) fin(e); else reloj(e); },
      Math.max(30, s.fin - t + 20)); s.t.push(s.tf);
  }
  window.vasoCapas = function(e, o){ if (e && e._s) iniciar(e, o); };

  var io = 'IntersectionObserver' in window;
  D.querySelectorAll('.vc').forEach(function(e){
    var s = e._s = {t:[], a:[], vis:!io}, A = function(x){ return e.getAttribute('data-vc-' + x); }, m = A('modo') || 'carga';
    if (m == 'auto') m = innerWidth >= (+A('desde') || 1024) ? 'carga' : 'al-ver';
    if (m == 'al-ver' && (A('una-vez') == 'sesion' && visto(e) || red)) m = 'carga';
    if (!io){ if (m == 'carga' || m == 'al-ver') iniciar(e); }
    else {
      var u = Math.min(+A('umbral') || .5, innerHeight * .95 / Math.max(1, e.offsetHeight)), es = A('espera') ? +A('espera') : 150, den = 0, tm;
      var ya = function(){ if (m == 'al-ver'){ m = ''; removeEventListener('scroll', re); iniciar(e); } },
          re = function(){ if (den){ clearTimeout(tm); tm = setTimeout(ya, es); } };
      new IntersectionObserver(function(x){ x = x[0]; s.vis = x.isIntersecting;
        s.a.forEach(function(a){ if (s.vis){ if (a.playState == 'paused') a.play(); } else if (a.playState == 'running') a.pause(); });
        if (s.vis && s.a.length) reloj(e);
        den = x.intersectionRatio >= u - .001; if (den) re(); else clearTimeout(tm);
        if (m == 'carga' && s.vis){ m = ''; iniciar(e); } }, {threshold:[0, u, 1]}).observe(e);
      if (m == 'al-ver') addEventListener('scroll', re, {passive:true});
    }
    if (A('hover') !== null && !red && matchMedia('(hover:hover) and (pointer:fine)').matches){
      var vs = e.querySelector('.vc-vaso'), lq = e.querySelector('.vc-liquido'), cur = 0, obj = 0, raf = 0, mx = parseFloat(getComputedStyle(e).getPropertyValue('--vc-hover-max')) || 3;
      var pon = function(g){ vs.style.rotate = g.toFixed(2) + 'deg'; if (lq) lq.style.rotate = (-g).toFixed(2) + 'deg'; };
      var paso = function(){ cur += (obj - cur) * .15; pon(cur); raf = Math.abs(obj - cur) > .02 ? requestAnimationFrame(paso) : 0; };
      e.addEventListener('pointermove', function(ev){
        if (ev.pointerType != 'mouse' || !e.classList.contains('vc-listo')) return;
        if (e.classList.contains('vc-vuelve')){ cur = parseFloat(getComputedStyle(vs).rotate) || 0; e.classList.remove('vc-vuelve'); }
        var b = e.getBoundingClientRect(); obj = Math.max(-1, Math.min(1, (ev.clientX - b.left - b.width / 2) / (b.width / 2))) * mx;
        if (!raf) raf = requestAnimationFrame(paso);
      });
      e.addEventListener('pointerleave', function(){ cancelAnimationFrame(raf); raf = 0; cur = obj = 0;
        if (e.classList.contains('vc-listo')){ e.classList.add('vc-vuelve'); pon(0); } });
    }
  });
})();

/* M27 · lista fijada que cambia la foto. Sin dependencias. Lee el comentario de arriba. */
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

/* pila-deslizable v3: datos opcionales en JSON + etiqueta honrada del mes + arrastre por velocidad */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function mesHoy(zona){
    try{
      var p = {};
      new Intl.DateTimeFormat('en-US', {timeZone:zona, year:'numeric', month:'2-digit'}).formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return p.year + '-' + p.month;
    }catch(e){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  }
  function nombreMes(m){ var a = /^(\d{4})-(\d{2})$/.exec(m || ''); if (!a) return ''; var n = MESES[+a[2] - 1]; return n ? n.charAt(0).toUpperCase() + n.slice(1) + ' de ' + a[1] : ''; }
  function crear(tag, clase, texto){ var e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; }

  /* Una tarjeta desde un dato del JSON (solo textContent) */
  function tarjeta(d){
    var a = crear('article', 'tar');
    if (d.mes) a.setAttribute('data-mes', String(d.mes));
    if (d.foto){
      var f = crear('figure', 'tar-foto'), i = document.createElement('img');
      i.src = String(d.foto); i.alt = d.alt ? String(d.alt) : ''; i.width = 500; i.height = 400; i.loading = 'lazy'; i.decoding = 'async';
      f.appendChild(i); a.appendChild(f);
    } else {
      var m = crear('div', 'tar-marca'); m.setAttribute('aria-hidden', 'true'); m.appendChild(crear('span', 'tar-marca-nombre', String(d.nombre || ''))); a.appendChild(m);
    }
    var c = crear('div', 'tar-cuerpo');
    c.appendChild(crear('p', 'tar-tag', ''));
    c.appendChild(crear('h3', '', String(d.nombre || '')));
    if (d.texto) c.appendChild(crear('p', 'tar-texto', String(d.texto)));
    if (d.fuente) c.appendChild(crear('p', 'tar-fuente', String(d.fuente)));
    a.appendChild(c);
    return a;
  }

  /* La etiqueta honrada: se calcula sobre el orden ORIGINAL (la primera es la más reciente) */
  function etiquetar(pila){
    var et = {este:'Este mes', ultima:'La última que hemos anunciado', antes:'De antes'};
    try{ var x = JSON.parse(pila.getAttribute('data-pila-etiquetas') || '{}'); for (var k in x) et[k] = x[k]; }catch(e){}
    var hoy = mesHoy(pila.getAttribute('data-pila-zona') || 'Europe/Madrid');
    [].forEach.call(pila.children, function(t, i){
      var mes = t.getAttribute('data-mes') || '', txt;
      if (i === 0) txt = mes === hoy ? et.este : (mes > hoy ? 'Para ' + nombreMes(mes).toLowerCase() : et.ultima);
      else txt = mes > hoy ? 'Para ' + nombreMes(mes).toLowerCase() : (nombreMes(mes) || et.antes);
      var tag = t.querySelector('.tar-tag'); if (tag) tag.textContent = txt;
      if (i === 0){
        var est = document.getElementById(pila.getAttribute('data-pila-estado-en') || '') || (pila.closest('.pila-zona') || document).querySelector('[data-pila-estado]') || document.querySelector('[data-pila-estado]');
        var h = t.querySelector('h3');
        if (est && h) est.textContent = txt + ': ' + h.textContent;
      }
    });
  }

  function iniciar(pila){
    var zona = pila.closest('.pila-zona') || pila.parentNode;
    var cuenta = zona.querySelector('.pila-cuenta'), bAnt = zona.querySelector('.pila-ant'), bSig = zona.querySelector('.pila-sig');
    var total = pila.children.length, actual = 0, ocupado = false;
    etiquetar(pila);
    pila.classList.add('pila-lista');

    function marcar(){
      Array.prototype.forEach.call(pila.children, function(t, i){
        if (i === 0){ t.removeAttribute('aria-hidden'); t.inert = false; } else { t.setAttribute('aria-hidden', 'true'); t.inert = true; }
      });
      if (cuenta) cuenta.textContent = (actual + 1) + ' de ' + total;
    }
    function limpiar(t){ t.style.translate = ''; t.style.rotate = ''; t.style.opacity = ''; }

    /* Saca la de arriba hacia un lado (dir = 1 derecha, -1 izquierda) y la manda al fondo */
    function siguiente(dir){
      if (ocupado || total < 2) return; ocupado = true;
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
      if (ocupado || total < 2) return; ocupado = true;
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

    if (bSig) bSig.addEventListener('click', function(){ siguiente(1); });
    if (bAnt) bAnt.addEventListener('click', anterior);
    pila.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); siguiente(1); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); anterior(); }
    });
    marcar();
  }

  document.querySelectorAll('.pila').forEach(function(pila){
    var url = pila.getAttribute('data-pila-datos');
    if (!url || !window.fetch){ iniciar(pila); return; }
    fetch(url, {cache:'no-cache'}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(j){
      var lista = j && Array.isArray(j.lista) ? j.lista.filter(function(d){ return d && d.nombre; }) : [];
      if (lista.length){
        var frag = document.createDocumentFragment();
        lista.forEach(function(d){ frag.appendChild(tarjeta(d)); });
        pila.textContent = ''; pila.appendChild(frag);
      }
    }).catch(function(){ /* sin JSON: se queda la pila del HTML */ }).then(function(){ iniciar(pila); });
  });
})();

/* v3: .rd-punto, un punto que viaja bajo el enlace de la sección visible, del ratón o del foco */
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

/* cabecera-inteligente (M18): respaldo del estado "pegada" y esconder al bajar */
(function(){
  var cab = document.getElementById('cabecera'); if (!cab) return;
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
      if (y < 120 || d < 0) cab.classList.remove('oculta'); else cab.classList.add('oculta');
      ultimo = y;
    });
  }, {passive:true});
})();

/* menu-escalonado (M52): círculo desde el botón y aria-expanded con el evento toggle */
(function(){
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb'); if (!menu || !hamb || !menu.showPopover) return;
  function centrar(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); }
  hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
  menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
  menu.addEventListener('toggle', function(e){
    var abierto = e.newState === 'open';
    hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    if (!abierto) hamb.focus();
  });
  menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
})();

/* decoracion-parallax (M15): pausa fuera de pantalla (.mov) y parallax con la posición de la SECCIÓN */
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
    capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
      if (el.dataset.px) el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0';
      else el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; });
  }
  addEventListener('scroll', function(){ if (!pend) pend = requestAnimationFrame(parallax); }, {passive:true});
  addEventListener('resize', parallax); parallax();
})();

/* interacciones-cursor (M30) v3: imán en botones importantes (translate) y resplandor delegado en la FAQ */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches, raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!raton || reducido) return;
  document.querySelectorAll('.iman').forEach(function(b){
    b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
      b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
    b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
  });
  var SEL = 'details.faq', pend = null;
  document.addEventListener('mousemove', function(e){
    if (pend) return;
    pend = requestAnimationFrame(function(){ pend = null;
      var el = e.target && e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
      var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
  });
})();

/* barra-pegajosa-movil v2: aparece pasada la portada y nunca a la vez que otro "Llamar" visible */
(function(){
  var barra = document.getElementById('barraMovil'); if (!barra) return;
  function actualizar(){ barra.classList.toggle('visible', scrollY > innerHeight * .7); }
  addEventListener('scroll', function(){ requestAnimationFrame(actualizar); }, {passive:true}); actualizar();
  if (!('IntersectionObserver' in window)) return;
  var vistos = new Set();
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) vistos.add(e.target); else vistos.delete(e.target); }); barra.classList.toggle('tapada', vistos.size > 0); });
  document.querySelectorAll('[data-tapa-barra]').forEach(function(el){ io.observe(el); });
})();

/* ubicacion-mapa v3: el mapa real de Google solo se crea al pulsar */
(function(){
  var btn = document.getElementById('btnMapa'); if (!btn) return;
  btn.addEventListener('click', function(){
    var caja = document.getElementById('mapa'), fachada = document.getElementById('fachadaMapa'); if (!fachada) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Pub La Isla, Calle de San Pelayo 12, 33550 Cangas de Onís') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Pub La Isla'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
    caja.appendChild(f); fachada.remove();
  });
})();
