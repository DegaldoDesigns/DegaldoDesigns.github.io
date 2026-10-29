/* mascota.js · El Cardenal Gastrobar. Copia literal de la librería (01-Libreria-de-Codigo/componentes/mascota-paradas.html, M134 v1.1).
   Las paradas y las posturas del cardenal se configuran en el HTML (atributos data-mascota-* y data-mp-*). */
/* mascota-paradas (M134) · v1.1 */
(function(){
  var raiz = document.querySelector('.mp'), muneco = raiz && raiz.querySelector('.mp-muneco');
  if (!raiz || !muneco || !document.body.animate || !window.Range) return;
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var vuela = !reducido && !!(window.CSS && CSS.supports && CSS.supports('offset-path', 'path("M0 0")'));
  var mqMovil = matchMedia(raiz.getAttribute('data-mp-movil') || '(max-width: 699px)');
  var mqRaton = matchMedia('(hover: hover) and (pointer: fine)');
  function json(a){ try { return JSON.parse(raiz.getAttribute(a) || '{}'); } catch(e){ return {}; } }
  function nums(v, d){ var n = String(v || '').trim().split(/[\s,]+/).map(parseFloat); return n.length === d.length && n.every(isFinite) ? n : d; }
  var POSTURAS = json('data-mp-posturas'), ALETEO = json('data-mp-aleteo');
  var PIES = nums(raiz.getAttribute('data-mp-pies'), [50, 100]), SIL = nums(raiz.getAttribute('data-mp-silueta'), [0, 0, 100, 100]);
  var LINEA = parseFloat(raiz.getAttribute('data-mp-linea')) || .68;
  var BAJO = raiz.getAttribute('data-mp-ocultar-bajo') || '';
  var EVITAR = raiz.getAttribute('data-mp-evitar') || 'a,button,input,select,textarea,summary,[role="tab"]';
  var GRUPO = '[data-mascota-salta],[data-mascota-abre]';

  /* Capas: vuelo (offset-path o translate) > salto > escala > giro (espejo) > muñeco */
  document.body.appendChild(raiz);
  function div(c){ var d = document.createElement('div'); d.className = c; return d; }
  var vuelo = div('mp-vuelo'), salto = div('mp-salto'), escala = div('mp-escala'), giro = div('mp-giro');
  raiz.appendChild(vuelo); vuelo.appendChild(salto); salto.appendChild(escala); escala.appendChild(giro); giro.appendChild(muneco);
  muneco.style.setProperty('--mp-px', PIES[0]); muneco.style.setProperty('--mp-py', PIES[1]);
  var piezas = {}, sis = [].slice.call(muneco.querySelectorAll('[data-mp-si]')), aleteos = [];
  muneco.querySelectorAll('[data-mp-pieza]').forEach(function(p){ piezas[p.getAttribute('data-mp-pieza')] = p; if (p.getAttribute('data-mp-pivote')) p.style.transformOrigin = p.getAttribute('data-mp-pivote'); });
  function copiarVars(){ var cs = getComputedStyle(raiz); ['--mp-alto', '--mp-proporcion', '--mp-z'].forEach(function(v){ vuelo.style.setProperty(v, cs.getPropertyValue(v)); }); }
  function prop(v, d){ return getComputedStyle(raiz).getPropertyValue(v).trim() || d; }
  function base(){ return muneco.offsetHeight || 80; }
  function ancho(){ return muneco.offsetWidth || base(); }

  var E = {parada:null, sitio:null, volando:false, enLogo:null, host:null, espejo:false, postura:'posado'};

  function postura(nombre, espejo){
    var P = POSTURAS[nombre] || {};
    Object.keys(piezas).forEach(function(k){ var p = piezas[k], v = P[k];
      p.style.rotate = (typeof v === 'number' ? v : 0) + 'deg';
      if (p.hasAttribute('data-mp-oculta')) p.style.opacity = typeof v === 'number' ? 1 : 0; });
    sis.forEach(function(s){ var v = P[s.getAttribute('data-mp-si')]; s.style.opacity = typeof v === 'number' && v !== 0 ? 1 : 0; });
    giro.style.scale = espejo ? '-1 1' : '1 1';
    E.postura = nombre; E.espejo = espejo;
  }
  function aletear(si){
    aleteos.forEach(function(a){ a.cancel(); }); aleteos = [];
    if (!si || reducido) return;
    var t = parseFloat(prop('--mp-aleteo-t', '150')) || 150;
    Object.keys(ALETEO).forEach(function(k){ var p = piezas[k], v = ALETEO[k]; if (!p || !v) return;
      aleteos.push(p.animate([{rotate:v[0] + 'deg'}, {rotate:v[1] + 'deg'}], {duration:t, delay:120, iterations:Infinity, direction:'alternate', easing:'cubic-bezier(.45,0,.55,1)'})); });
  }
  function saltito(h){
    if (reducido) return;
    salto.animate([{translate:'0 0', easing:'cubic-bezier(.23,1,.32,1)'}, {translate:'0 ' + (-h) + 'px', offset:.4, easing:'cubic-bezier(.45,0,.55,1)'}, {translate:'0 0'}], {duration:420});
  }

  /* ---- Medidas (en coordenadas de pantalla) ---- */
  function cruza(a, b){ return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top; }
  function solape(a, b){ return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)); }
  function cajaTexto(el){
    var rg = document.createRange(); rg.selectNodeContents(el);
    var rs = [].filter.call(rg.getClientRects(), function(r){ return r.width > 1 && r.height > 1; });
    if (!rs.length) return el.getBoundingClientRect();
    var c = {left:1e9, top:1e9, right:-1e9, bottom:-1e9};
    rs.forEach(function(r){ c.left = Math.min(c.left, r.left); c.top = Math.min(c.top, r.top); c.right = Math.max(c.right, r.right); c.bottom = Math.max(c.bottom, r.bottom); });
    c.width = c.right - c.left; c.height = c.bottom - c.top; return c;
  }
  function visible(el){ return !!(el && el.getClientRects().length) && (!el.checkVisibility || el.checkVisibility({visibilityProperty:true})); }
  /* Lo que no se puede tapar entre y0 e y1: cada línea de texto visible y las cajas de los controles */
  function obstaculos(y0, y1){
    var z = {left:-1e5, right:1e5, top:y0, bottom:y1}, out = [], rg = document.createRange(), n;
    var tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {acceptNode:function(t){ return /\S/.test(t.data) ? 1 : 3; }});
    while ((n = tw.nextNode())){
      var p = n.parentElement; if (!p || raiz.contains(p) || vuelo.contains(p)) continue;
      var pr = p.getBoundingClientRect(); if (!pr.width || !cruza(pr, z)) continue;
      if (p.checkVisibility && !p.checkVisibility({opacityProperty:true, visibilityProperty:true})) continue;
      rg.selectNodeContents(n); [].forEach.call(rg.getClientRects(), function(r){ if (r.width > 1 && cruza(r, z)) out.push(r); });
    }
    document.querySelectorAll(EVITAR + (BAJO ? ',' + BAJO : '')).forEach(function(c){ var r = c.getBoundingClientRect(); if (r.width && cruza(r, z) && visible(c)) out.push(r); });
    return out;
  }
  /* Caja visible del muñeco con los pies en (x, y), a escala s */
  function silueta(x, y, s, esp, post){
    var S = (POSTURAS[post] || {}).silueta || SIL;   /* una postura puede traer su propia caja ("silueta":[izq, arriba, der, abajo]) */
    var w = ancho() * s, h = base() * s, l = (S[0] - PIES[0]) / 100 * w, r = (S[2] - PIES[0]) / 100 * w, t;
    if (esp){ t = l; l = -r; r = -t; }
    return {left:x + l, right:x + r, top:y + (S[1] - PIES[1]) / 100 * h, bottom:y + (S[3] - PIES[1]) / 100 * h};
  }
  function encoger(c, f){ var dx = (c.right - c.left) * f, dy = (c.bottom - c.top) * f; return {left:c.left + dx, right:c.right - dx, top:c.top + dy, bottom:c.bottom - dy}; }

  /* Atributos de una parada (o de su grupo) */
  function conf(el){ var g = el.hasAttribute('data-mascota-parada') ? null : el.closest(GRUPO); return function(n){ var v = el.getAttribute(n); return v != null ? v : (g && g !== el ? g.getAttribute(n) : null); }; }
  function cuando(el){ var a = conf(el); if (mqMovil.matches && a('data-mp-movil') === 'evento') return 'evento'; return a('data-mp-cuando') || (el.hasAttribute('data-mascota-parada') ? 'scroll' : 'evento'); }
  function vale(el){ var s = conf(el)('data-mp-solo'); return !(s === 'ancho' && mqMovil.matches) && !(s === 'movil' && !mqMovil.matches); }
  function postOf(a){ return a('data-mp-postura') || 'posado'; }
  function espejoDe(mira, lado, post){
    if (mira === 'izquierda') return true; if (mira === 'derecha') return false;
    var hacia = lado === 'derecha' ? true : lado === 'izquierda' ? false : null;
    if (hacia === null) return !!(POSTURAS[post] || {}).espejo;
    return mira === 'fuera' ? !hacia : hacia;
  }

  /* Dónde se posa en una parada: {x, y, s, esp, postura, logo}. Con "fija", sin volver a medir obstáculos */
  function sitio(el, fija){
    var a = conf(el), lg = a('data-mp-logo');
    if (lg){
      var img = el.tagName === 'IMG' ? el : el.querySelector('img'), r = img && img.getBoundingClientRect(), e = nums(lg, [0, 0, 100, 100]);
      if (!r || !r.width) return null;
      var w = r.width * e[2] / 100, h = r.height * e[3] / 100;
      return {x:r.left + r.width * e[0] / 100 + w * PIES[0] / 100, y:r.top + r.height * e[1] / 100 + h * PIES[1] / 100, s:h / base(), esp:false, postura:'posado', logo:img};
    }
    var ref = a('data-mp-ref') ? el.querySelector(a('data-mp-ref')) || el : el, modo = a('data-mp-caja') || 'borde';
    if (!visible(ref)) return null;
    var bx = ref.getBoundingClientRect(), tx = modo === 'borde' ? bx : cajaTexto(ref);
    var c = modo === 'texto' ? tx : modo === 'texto-x' ? {left:tx.left, width:tx.width, top:bx.top, height:bx.height} : bx;
    var pt = nums(a('data-mp-punto'), [50, 0]), d = nums(a('data-mp-desplaza'), [0, 0]), hueco = parseFloat(a('data-mp-hueco'));
    if (!isFinite(hueco)) hueco = 8;
    var lados = (a('data-mp-lado') || 'encima').split(/\s+/), alto = parseFloat(a('data-mp-alto')), s0 = alto ? alto / base() : 1;
    var post = postOf(a), mira = a('data-mp-mira') || 'hacia', vw = document.documentElement.clientWidth, apoyo = parseFloat(a('data-mp-apoyo')) || 0;
    var obs = null, intentos = [];
    lados.forEach(function(L, i){ [1, .85, .7].forEach(function(f){ intentos.push({L:L, i:i, f:f}); }); });
    if (fija) intentos = intentos.filter(function(t){ return t.i === fija.i && t.f === fija.f; });
    for (var k = 0; k < intentos.length; k++){
      var t = intentos[k], ex = t.i ? -1 : 1, px = c.left + c.width * (t.i ? 100 - pt[0] : pt[0]) / 100 + d[0] * ex, py = c.top + c.height * pt[1] / 100 + d[1];
      var s = s0 * t.f, esp = espejoDe(mira, t.L, post), cero = silueta(0, 0, s, esp, post), x = px;
      if (t.L === 'derecha') x = px + hueco - cero.left; else if (t.L === 'izquierda') x = px - hueco - cero.right;
      var sil = silueta(x, py, s, esp, post), dentro = encoger(sil, .06);
      dentro.bottom -= apoyo;   /* data-mp-apoyo: las patas pueden entrar esos px en lo de debajo (posado sobre las letras) */
      if (!fija){
        var w = ancho() * s, cl = x - (esp ? 100 - PIES[0] : PIES[0]) / 100 * w;
        if (sil.left < 0 || cl + w > vw) continue;   /* el lienzo entero dentro: por la derecha crearía scroll horizontal */
        if (!obs) obs = obstaculos(py - base() * 2, py + base());
        if (obs.some(function(o){ return cruza(o, dentro); })) continue;
      }
      return {x:x, y:py, s:s, esp:esp, postura:post, eleccion:{i:t.i, f:t.f}, saltito:a('data-mp-saltito') != null, ref:ref};
    }
    return null;
  }

  /* ---- Colocar ---- */
  function origen(){
    var h = E.host; if (h){ var r = h.getBoundingClientRect(); return {x:r.left + h.clientLeft, y:r.top + h.clientTop}; }
    var o = raiz.getBoundingClientRect(); return {x:o.left, y:o.top};
  }
  function poner(x, y, s){ var o = origen(); vuelo.style.translate = (x - o.x) + 'px ' + (y - o.y) + 'px'; escala.style.scale = s; }
  function pies(){ var r = vuelo.getBoundingClientRect(); return {x:r.left, y:r.top}; }
  function anfitrion(el){ for (var n = el.parentElement; n && n !== document.body; n = n.parentElement){ var p = getComputedStyle(n).position; if (p === 'sticky' || p === 'fixed') return n; } return null; }
  function aCapa(){ if (!E.host) return; var p = pies(); E.host = null; raiz.appendChild(vuelo); poner(p.x, p.y, parseFloat(escala.style.scale) || 1); }
  function aHost(el){ var h = anfitrion(el); if (!h) return; var p = pies(); E.host = h; h.appendChild(vuelo); poner(p.x, p.y, parseFloat(escala.style.scale) || 1); }

  /* Logos: la imagen completa o la que no lleva el muñeco */
  function logo(img, con){
    if (!img) return; var el = img.closest('[data-mp-logo]') || img, d = img._mp || (img._mp = {src:img.getAttribute('src'), srcset:img.getAttribute('srcset')});
    var sin = el.getAttribute('data-mp-sin'), sinSet = el.getAttribute('data-mp-sin-srcset');
    if (!sin) return;
    if (con){ if (d.srcset) img.setAttribute('srcset', d.srcset); else img.removeAttribute('srcset'); img.setAttribute('src', d.src); }
    else { if (sinSet) img.setAttribute('srcset', sinSet); else img.removeAttribute('srcset'); img.setAttribute('src', sin); }
  }
  function salirDeLogo(){ if (!E.enLogo) return; logo(E.enLogo, false); vuelo.classList.remove('mp-en-logo'); E.enLogo = null; }
  function posar(el, d, suave){
    E.parada = el; E.sitio = d; E.sinSitio = false;
    poner(d.x, d.y, d.s); aletear(false);
    if (d.logo){ postura('posado', false); logo(d.logo, true); vuelo.classList.add('mp-en-logo'); E.enLogo = d.logo; }
    else {
      if (d.saltito && suave) postura('posado', E.espejo); else postura(d.postura, d.esp);   /* con saltito: primero posado como llegó, luego se gira */
      aHost(d.ref || el);
      if (suave){
        saltito(Math.round(base() * d.s * .09));
        if (d.saltito) setTimeout(function(){ if (E.parada === el && !E.volando){ postura(d.postura, d.esp); saltito(Math.round(base() * d.s * .14)); } }, 260);
      }
    }
    tapado();
    document.dispatchEvent(new CustomEvent('mascota:llega', {detail:{parada:el}}));
  }

  /* ---- Vuelo ---- */
  function enPantalla(p, m){ return p.y > -m && p.y < innerHeight + m && p.x > -m && p.x < document.documentElement.clientWidth + m; }
  function bez(P, t){ var u = 1 - t; return {x:u*u*u*P[0] + 3*u*u*t*P[2] + 3*u*t*t*P[4] + t*t*t*P[6], y:u*u*u*P[1] + 3*u*u*t*P[3] + 3*u*t*t*P[5] + t*t*t*P[7]}; }
  function ruta(A, B, sA, sB, esp){
    var dx = B.x - A.x, dy = B.y - A.y, dist = Math.hypot(dx, dy), top = Math.min(A.y, B.y), cands = [], vw = document.documentElement.clientWidth;
    var hs = dist < 200 ? [Math.max(26, dist * .45), Math.max(14, dist * .2)] : [Math.min(240, 70 + dist * .16), Math.min(420, 140 + dist * .28), 30];
    hs.forEach(function(h){ cands.push([A.x, A.y, A.x + dx * .2, top - h, B.x - dx * .2, top - h, B.x, B.y]); });
    if (dist >= 200){ var m = ancho() * .7; [m, vw - m].forEach(function(g){ cands.push([A.x, A.y, g, A.y + dy * .15, g, B.y - dy * .15 - 40, B.x, B.y]); }); }
    var obs = obstaculos(0, innerHeight), mejor = null, mp = Infinity;
    cands.forEach(function(P){ var pen = 0;
      for (var i = 1; i < 28; i++){ var t = i / 28, q = bez(P, t), sil = encoger(silueta(q.x, q.y, sA + (sB - sA) * t, esp, 'volando'), .1);
        for (var j = 0; j < obs.length; j++) pen += solape(obs[j], sil); }
      if (pen < mp - 1){ mp = pen; mejor = P; } });
    var L = 0, q0 = A; for (var i = 1; i <= 20; i++){ var q = bez(mejor, i / 20); L += Math.hypot(q.x - q0.x, q.y - q0.y); q0 = q; }
    return {P:mejor, L:L};
  }
  function ir(el){
    var d = sitio(el);
    if (!d){ E.parada = el; E.sinSitio = true; E.intento = Date.now(); return; }   /* no cabe: se queda donde está y lo reintenta al moverse la página */
    var desde = E.sitio && E.parada ? pies() : {x:d.x, y:d.y}, sA = parseFloat(escala.style.scale) || d.s;
    var visto = !E.enLogo && !vuelo.classList.contains('mp-tapado') && enPantalla(desde, 40);
    if (E.enLogo) visto = enPantalla(desde, 40);
    cargarPiezas(); salirDeLogo(); aCapa(); vuelo.classList.remove('mp-tapado');   /* tapado() lo vuelve a mirar al posarse */
    var rapido = !vuela || document.hidden || !E.sitio && !visto || (!enPantalla(desde, 60) && !enPantalla(d, 60));
    if (rapido || !enPantalla(d, 60)){
      E.volando = true;
      var fin = function(){ E.volando = false; posar(el, d, false); vuelo.classList.remove('mp-esconde'); revisar(); };
      if (visto){ vuelo.classList.add('mp-esconde'); setTimeout(fin, 170); } else fin();
      return;
    }
    vuelo.classList.remove('mp-tapado', 'mp-esconde');
    if (!enPantalla(desde, 60)){   /* sale de fuera: entra por arriba o por abajo (por un lado crearía scroll horizontal) */
      var vw = document.documentElement.clientWidth, hh = base() * d.s;
      desde = {x:d.x + (d.x > vw / 2 ? -1 : 1) * ancho() * d.s * .8, y:desde.y < 0 ? -hh * .3 : Math.min(innerHeight + hh, document.documentElement.scrollHeight - scrollY - hh * .3)}; sA = d.s;
    }
    var o = origen(), A = {x:desde.x - o.x, y:desde.y - o.y}, B = {x:d.x - o.x, y:d.y - o.y};
    var esp = Math.abs(B.x - A.x) > 24 ? B.x < A.x : E.espejo, R = ruta(desde, d, sA, d.s, esp), P = R.P;
    var dur = Math.round(Math.max(420, Math.min(1150, 300 + R.L * .6))), f = function(n){ return Math.round(n * 10) / 10; };
    E.volando = true; E.parada = el; E.sitio = null;
    postura('volando', esp); aletear(true);
    vuelo.style.translate = '0px 0px';
    vuelo.style.offsetPath = 'path("M' + f(A.x) + ' ' + f(A.y) + 'C' + [P[2] - o.x, P[3] - o.y, P[4] - o.x, P[5] - o.y, B.x, B.y].map(f).join(' ') + '")';
    var curva = prop('--mp-curva', 'cubic-bezier(.37,0,.2,1)');
    var av = vuelo.animate([{offsetDistance:'0%'}, {offsetDistance:'100%'}], {duration:dur, easing:curva, fill:'forwards'});
    var ae = escala.animate([{scale:sA}, {scale:d.s}], {duration:dur, easing:curva, fill:'forwards'});
    av.onfinish = function(){
      var d2 = sitio(el, d.eleccion) || d;   /* por si la página se ha movido durante el vuelo */
      vuelo.style.offsetPath = 'none'; E.volando = false;
      posar(el, d2, true); av.cancel(); ae.cancel();
      revisar();
    };
  }

  /* ---- Qué parada toca ---- */
  var forzada = null, conScroll = null, hecho = {}, tEspera = null, pend = null, raf = false;
  function zona(el){ return el.closest('[data-mp-zona]') || el.closest('section, footer') || document.body; }
  function paradas(){ return [].filter.call(document.querySelectorAll('[data-mascota-parada]'), function(el){ return vale(el) && cuando(el) === 'scroll' && visible(el); }); }
  function porScroll(){
    var lista = paradas(), linea = innerHeight * LINEA, mejor = null, mt = -1e9;
    if (!lista.length) return null;
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) return lista[lista.length - 1];
    lista.forEach(function(el){ var t = el.getBoundingClientRect().top; if (t < linea && t > mt + .5){ mt = t; mejor = el; } });
    return mejor || lista[0];
  }
  function vigente(scroll){
    if (!forzada) return null;
    var z = zona(forzada).getBoundingClientRect(), l = innerHeight * LINEA;
    /* la quita una parada de scroll posterior que se active después de forzarla (no la que ya estaba activa) */
    var despues = scroll && scroll !== conScroll && scroll !== forzada && (forzada.compareDocumentPosition(scroll) & Node.DOCUMENT_POSITION_FOLLOWING) && !zona(scroll).contains(forzada);
    if (z.top < l && z.bottom > innerHeight * .2 && visible(forzada) && !despues) return forzada;
    forzada = null; return null;
  }
  function bloqueada(p){ var e = p && p.getAttribute('data-mp-espera'); return !!(e && !hecho[e]); }
  function objetivo(){ var s = porScroll(); return vigente(s) || s; }
  function revisar(){
    raf = false;
    if (E.volando) return;
    var o = objetivo();
    if (o && o !== E.parada && !bloqueada(E.parada)){
      if (o !== pend){ pend = o; clearTimeout(tEspera);
        tEspera = setTimeout(function(){ pend = null; if (!E.volando && objetivo() === o) ir(o); else pedir(); }, o === forzada ? 0 : 140); }
    } else { pend = null; clearTimeout(tEspera); if (o && o === E.parada && E.sinSitio && Date.now() - E.intento > 500) ir(o); }
    tapado();
  }
  function pedir(){ if (!raf){ raf = true; requestAnimationFrame(revisar); } }
  function forzar(el){ if (!el || !vale(el) || el === E.parada && !E.sinSitio) return; forzada = el; conScroll = porScroll(); pend = null; clearTimeout(tEspera); revisar(); }
  /* Se funde si le pasa por encima la cabecera, la barra fija o una tira sticky */
  function tapado(){
    if (!BAJO || E.volando || E.enLogo) return;
    var r = muneco.getBoundingClientRect(), tap = false;
    if (r.width) document.querySelectorAll(BAJO).forEach(function(b){ var c = b.getBoundingClientRect(); if (c.width && visible(b) && cruza(c, encoger(r, .12))) tap = true; });
    vuelo.classList.toggle('mp-tapado', tap);
  }
  function recolocar(){
    if (E.volando || !E.parada) return;
    if (E.sinSitio || !E.sitio){ if (E.sinSitio) { E.sinSitio = false; ir(E.parada); } return; }
    var d = sitio(E.parada, E.sitio.logo ? null : E.sitio.eleccion); if (!d) return;
    E.sitio = d; if (E.host && !anfitrion(d.ref || E.parada)) aCapa(); poner(d.x, d.y, d.s); tapado();
  }

  /* ---- Interacciones ---- */
  function item(n){ var g = n && n.closest && n.closest('[data-mascota-salta]'); if (!g) return null; var s = g.getAttribute('data-mascota-salta'), it = s ? n.closest(s) : g; return it && g.contains(it) ? it : null; }
  var tSalta = null, tipo = '';
  document.addEventListener('pointerover', function(e){
    if (e.pointerType !== 'mouse' || !mqRaton.matches) return;
    var it = item(e.target); clearTimeout(tSalta);
    if (it && it !== E.parada) tSalta = setTimeout(function(){ forzar(it); }, 160);
  }, {passive:true});
  document.addEventListener('pointerdown', function(e){ tipo = e.pointerType; }, {capture:true, passive:true});
  function cuandoSeVea(el, fn, n){ if (visible(el)) return fn(el); if ((n || 0) < 40) requestAnimationFrame(function(){ cuandoSeVea(el, fn, (n || 0) + 1); }); }
  document.addEventListener('click', function(e){
    if (!e.isTrusted || !e.target.closest) return;
    var t = e.target.closest('[data-mascota-lleva], [role="tab"][aria-controls]');
    if (t){ var dest = t.hasAttribute('data-mascota-lleva') ? document.querySelector(t.getAttribute('data-mascota-lleva')) : document.getElementById(t.getAttribute('aria-controls'));
      if (dest && dest.hasAttribute('data-mascota-parada')) cuandoSeVea(dest, function(x){ setTimeout(function(){ forzar(x); }, 60); }); return; }
    if (tipo === 'mouse') return;
    var it = item(e.target); if (it) forzar(it);
  });
  document.addEventListener('toggle', function(e){ var d = e.target; if (d.open && d.closest && d.closest('[data-mascota-abre]')) forzar(d); }, true);

  /* ---- Arranque ---- */
  copiarVars(); raiz.classList.add('mp-listo');
  document.querySelectorAll('[data-mascota-parada][data-mp-espera]').forEach(function(p){ var n = p.getAttribute('data-mp-espera'), h = p.getAttribute('data-mp-hecho');
    function ok(){ if (!hecho[n]){ hecho[n] = true; pedir(); } }
    if (h && document.querySelector(h)) return ok();   /* el evento ya pasó antes de cargar este script (con defer) */
    document.addEventListener(n, ok); setTimeout(ok, 4000); });
  var ini = objetivo(), logos = document.querySelectorAll('[data-mascota-parada][data-mp-logo]');
  logos.forEach(function(el){ var img = el.tagName === 'IMG' ? el : el.querySelector('img'), sin = el.getAttribute('data-mp-sin');
    if (el !== ini) logo(img, false);
    /* la imagen sin muñeco de la parada inicial se precarga al acabar la carga: antes competiría con la foto de portada (LCP) */
    else if (sin) addEventListener('load', function(){ var pre = new Image(); if (el.getAttribute('data-mp-sin-srcset')){ pre.sizes = img.sizes; pre.srcset = el.getAttribute('data-mp-sin-srcset'); } pre.src = sin; }); });
  /* Piezas con data-mp-src: si empieza escondido en un logo, se descargan al acabar la carga (no compiten con el LCP) */
  function cargarPiezas(){ muneco.querySelectorAll('img[data-mp-src]').forEach(function(i){ i.setAttribute('src', i.getAttribute('data-mp-src')); i.removeAttribute('data-mp-src'); }); }
  var inicialLogo = ini && conf(ini)('data-mp-logo');
  if (!inicialLogo || document.readyState === 'complete') cargarPiezas(); else addEventListener('load', cargarPiezas);
  E.parada = ini;
  var d0 = ini && sitio(ini);
  if (d0) posar(ini, d0, false); else { E.sinSitio = !!ini; vuelo.classList.add('mp-esconde'); }
  addEventListener('scroll', pedir, {passive:true});
  var ancho0 = innerWidth;
  addEventListener('resize', function(){ copiarVars(); if (innerWidth !== ancho0){ ancho0 = innerWidth; recolocar(); } pedir(); });
  if (mqMovil.addEventListener) mqMovil.addEventListener('change', function(){ copiarVars(); forzada = null; recolocar(); pedir(); });
  if ('ResizeObserver' in window) new ResizeObserver(function(){ requestAnimationFrame(recolocar); }).observe(document.body);
  document.addEventListener('transitionend', function(e){ if (E.parada && e.target.contains && e.target.contains(E.parada)) requestAnimationFrame(recolocar); }, true);
  addEventListener('load', function(){ recolocar(); pedir(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ recolocar(); });
  window.MascotaParadas = {ir:forzar, estado:function(){ return {parada:E.parada, postura:E.postura, volando:E.volando, enLogo:!!E.enLogo, oculto:vuelo.classList.contains('mp-tapado') || vuelo.classList.contains('mp-esconde')}; }};
})();
