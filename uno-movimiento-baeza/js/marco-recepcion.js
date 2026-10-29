/* marco-recepcion (M118) v1, copia de la librería (Clínica César Navarro / UNO movimiento, 2026-10-27). */
/* marco-recepcion (M118) · v1 */
(function(){
  var raiz = document.documentElement;
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rejilla = /[?&]rejilla(=|&|$)/.test(location.search);
  var conViaje = !!(window.CSS && CSS.supports && CSS.supports('offset-path', 'path("M0 0L1 1")'));
  var SVG = 'http://www.w3.org/2000/svg';
  var LIMITE = 2500;                                     // ms desde la carga: si la foto no ha llegado, estado final
  var GESTOS = ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart'];
  var TRIANGULO = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3l12 7-12 7z"/></svg>';

  function tiempo(el, p, def){ var v = getComputedStyle(el).getPropertyValue(p).trim(), n = parseFloat(v); return isNaN(n) ? def : /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n; }
  function num(el, p, def){ var n = parseFloat(getComputedStyle(el).getPropertyValue(p)); return isNaN(n) ? def : n; }
  function curva(el, p, def){ var v = getComputedStyle(el).getPropertyValue(p).trim(); return v || def; }
  function f(n){ return Math.round(n * 10) / 10; }

  /* Centro de un elemento en px desde la esquina del marco */
  function centro(el, m){
    var r = el.getBoundingClientRect(), c = m.getBoundingClientRect();
    return { x: r.left + r.width / 2 - c.left - m.clientLeft, y: r.top + r.height / 2 - c.top - m.clientTop };
  }

  /* Modo marco: rectángulo redondeado por el medio del carril, en el sentido del reloj, empezando en el punto más cercano a P */
  function caminoRect(m, P){
    var cs = getComputedStyle(m), b = parseFloat(cs.paddingTop) || 0, R = parseFloat(cs.borderTopLeftRadius) || 0;
    var c = b * Math.min(1, Math.max(0, num(m, '--mr-carril', .5)));
    var x0 = c, y0 = c, x1 = m.clientWidth - c, y1 = m.clientHeight - c;
    var r = Math.max(0, Math.min(R - c, (x1 - x0) / 2, (y1 - y0) / 2));
    var lados = [   // inicio, fin, y el arco que va al lado siguiente
      { a:[x0 + r, y0], b:[x1 - r, y0] }, { a:[x1, y0 + r], b:[x1, y1 - r] },
      { a:[x1 - r, y1], b:[x0 + r, y1] }, { a:[x0, y1 - r], b:[x0, y0 + r] } ];
    var mejor = 0, dmin = Infinity, Q = null;
    lados.forEach(function(l, k){       // proyección de P sobre cada lado recto
      var qx = Math.min(Math.max(P.x, Math.min(l.a[0], l.b[0])), Math.max(l.a[0], l.b[0]));
      var qy = Math.min(Math.max(P.y, Math.min(l.a[1], l.b[1])), Math.max(l.a[1], l.b[1]));
      var d = Math.hypot(P.x - qx, P.y - qy); if (d < dmin){ dmin = d; mejor = k; Q = [qx, qy]; }
    });
    var arco = function(p){ return r > 0 ? 'A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(p[0]) + ' ' + f(p[1]) : 'L' + f(p[0]) + ' ' + f(p[1]); };
    var d = 'M' + f(Q[0]) + ' ' + f(Q[1]) + 'L' + f(lados[mejor].b[0]) + ' ' + f(lados[mejor].b[1]);
    for (var i = 1; i <= 4; i++){
      var l = lados[(mejor + i) % 4];
      d += arco(l.a);
      d += 'L' + f(i === 4 ? Q[0] : l.b[0]) + ' ' + f(i === 4 ? Q[1] : l.b[1]);
    }
    return d;
  }

  /* Modo camino: el trazado del autor (coordenadas de la foto) pasado a px del marco, muestreado */
  function caminoLibre(m, g){
    var L = g.getTotalLength(), M = g.getScreenCTM(), c = m.getBoundingClientRect();
    if (!L || !M) return '';
    var k = Math.hypot(M.a, M.b), n = Math.max(80, Math.min(600, Math.ceil(L * k / 4))), d = '';
    var pt = (g.ownerSVGElement.createSVGPoint) ? g.ownerSVGElement.createSVGPoint() : null;
    for (var i = 0; i <= n; i++){
      var p = g.getPointAtLength(L * i / n);
      var s = pt ? (pt.x = p.x, pt.y = p.y, pt.matrixTransform(M)) : new DOMPoint(p.x, p.y).matrixTransform(M);
      d += (i ? 'L' : 'M') + f(s.x - c.left - m.clientLeft) + ' ' + f(s.y - c.top - m.clientTop);
    }
    return d;
  }

  function geometria(m){ return m._libre ? caminoLibre(m, m._libre) : caminoRect(m, centro(m._icono || m, m)); }

  function fin(m, motivo){
    if (m._fin) return; m._fin = true;
    clearTimeout(m._t); clearTimeout(m._tv); quitarGestos(m);
    if (m._io) m._io.disconnect();
    if (m._ro) m._ro.disconnect();
    (m._anims || []).forEach(function(a){ try{ a.cancel(); }catch(e){} });
    [m._svg, m._viajero].forEach(function(p){ if (p && p.parentNode) p.parentNode.removeChild(p); });
    m.classList.add('mr-hecho'); m.classList.remove('mr-on'); m.setAttribute('data-mr', 'listo');
    m.dispatchEvent(new CustomEvent('marco:listo', { bubbles:true, detail:{ motivo:motivo } }));
  }

  /* Al primer gesto: lo que falte de la pasada ocurre en --mr-salto */
  function saltar(m, motivo){
    if (m._fin || m._saltando) return; m._saltando = true;
    var salto = tiempo(m, '--mr-salto', 150);
    if (!m._anims || !m._anims.length){                   // aún no había empezado: fundido directo al estado final
      m.classList.add('mr-salta'); fin(m, motivo || 'gesto');
      setTimeout(function(){ m.classList.remove('mr-salta'); }, salto + 40);
      return;
    }
    var queda = m._total - (performance.now() - m._t0);
    if (queda > salto){ var v = queda / salto; m._anims.forEach(function(a){ a.playbackRate = v; }); }
    clearTimeout(m._t);
    m._t = setTimeout(function(){ fin(m, motivo || 'gesto'); }, Math.min(queda, salto) + 30);
  }
  function ponerGestos(m){ if (m._gesto) return; m._gesto = function(){ saltar(m, 'gesto'); }; GESTOS.forEach(function(g){ addEventListener(g, m._gesto, { passive:true }); }); }
  function quitarGestos(m){ if (m._gesto) GESTOS.forEach(function(g){ removeEventListener(g, m._gesto, { passive:true }); }); m._gesto = null; }

  function cuandoLista(img, ms){
    return new Promise(function(ok){
      if (img.complete && img.naturalWidth) return ok(true);
      var t = setTimeout(function(){ ok(false); }, Math.max(0, ms));
      img.addEventListener('load', function(){ clearTimeout(t); ok(true); }, { once:true });
      img.addEventListener('error', function(){ clearTimeout(t); ok(false); }, { once:true });
    });
  }

  /* La pasada */
  function animar(m){
    if (m._fin || m._saltando) return;
    var d = geometria(m);
    if (!d) return fin(m, 'sin-foto');
    var T = function(p, def){ return tiempo(m, p, def); };
    var playT = T('--mr-play-t', 120), playD = T('--mr-play-dur', 180), viajeT = T('--mr-viaje-t', 300), viajeD = T('--mr-viaje-dur', 900),
        funde = T('--mr-funde', 120), luzT = T('--mr-luz-t', 1300), luzD = T('--mr-luz-dur', 300);
    var cv = curva(m, '--mr-curva', 'cubic-bezier(0.77,0,0.175,1)'), mu = curva(m, '--mr-muelle', 'cubic-bezier(0.23,1,0.32,1)');
    var ro = num(m.querySelector('.mr-resplandor') || m, '--mr-resplandor', .55);

    /* Línea: un SVG del tamaño del marco con tres trazos (dos halos y el núcleo) */
    var svg = document.createElementNS(SVG, 'svg'), W = m.clientWidth, H = m.clientHeight;
    svg.setAttribute('class', 'mr-luz'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var trazos = ['mr-h1', 'mr-h2', 'mr-nucleo'].map(function(cl){
      var p = document.createElementNS(SVG, 'path'); p.setAttribute('class', cl); p.setAttribute('d', d); p.setAttribute('pathLength', '1');
      svg.appendChild(p); return p;
    });
    m.appendChild(svg); m._svg = svg;

    var anims = [];
    var o = function(el, kf, op){ var a = el.animate(kf, Object.assign({ fill:'both' }, op)); anims.push(a); return a; };
    var dibujo = { delay:viajeT, duration:viajeD, easing:cv };
    trazos.forEach(function(p){ o(p, [{ strokeDashoffset:1 }, { strokeDashoffset:0 }], dibujo); });
    /* Los halos bajan al 60 % cuando la línea está entera */
    trazos.slice(0, 2).forEach(function(p){ var op = parseFloat(getComputedStyle(p).opacity) || .2;
      o(p, [{ opacity:op }, { opacity:op * .6 }], { delay:viajeT + viajeD, duration:300, easing:'cubic-bezier(0.23,1,0.32,1)' }); });

    /* "Da al play" */
    if (m._icono) o(m._icono, [{ translate:'0 0', scale:1 }, { translate:'6px 0', scale:.92, offset:.45 }, { translate:'0 0', scale:1 }], { delay:playT, duration:playD, easing:mu, fill:'none' });

    /* El icono que viaja */
    if (conViaje){
      var v = document.createElement('span'); v.className = 'mr-viajero'; v.setAttribute('aria-hidden', 'true');
      var origen = m._icono;
      if (origen){ var cl = origen.cloneNode(true); cl.removeAttribute('class'); cl.removeAttribute('style'); v.appendChild(cl); } else v.innerHTML = TRIANGULO;
      v.style.offsetPath = 'path("' + d + '")';
      m.appendChild(v); m._viajero = v;
      o(v, [{ offsetDistance:'0%' }, { offsetDistance:'100%' }], dibujo);
      o(v, [{ opacity:0 }, { opacity:1 }], { delay:viajeT, duration:80, easing:'linear' });
      o(v, [{ opacity:1 }, { opacity:0 }], { delay:viajeT + viajeD - 20, duration:funde, easing:'cubic-bezier(0.23,1,0.32,1)', fill:'forwards' });
    }

    /* Resplandor bajo el marco */
    var rs = m.querySelector('.mr-resplandor');
    if (rs) o(rs, [{ opacity:0 }, { opacity:ro }], { delay:luzT, duration:luzD, easing:'cubic-bezier(0.23,1,0.32,1)' });

    m._anims = anims; m._t0 = performance.now(); m._total = Math.max(luzT + luzD, viajeT + viajeD + Math.max(funde, 300));
    m.classList.add('mr-on');
    m._t = setTimeout(function(){ fin(m, 'completo'); }, m._total + 30);
    if ('ResizeObserver' in window){              // si cambia el tamaño a mitad, se salta al final (el final es CSS puro)
      var primero = true;
      m._ro = new ResizeObserver(function(){ if (primero){ primero = false; return; } saltar(m, 'tamano'); });
      m._ro.observe(m);
    }
  }

  function arrancar(m){
    if (m._fin || m._arrancado) return; m._arrancado = true;
    if (document.hidden) return fin(m, 'oculta');
    try{ sessionStorage.setItem(m.getAttribute('data-mr-clave') || 'marco-recepcion', '1'); }catch(e){}
    ponerGestos(m);
    var img = m._img;
    var limite = m._modoCarga ? LIMITE - performance.now() : 2000;
    cuandoLista(img, limite).then(function(ok){
      if (!ok) return saltar(m, 'sin-foto');
      /* Después del fotograma en que se pinta la foto (si no, retrasa el LCP; lección de M81 v3) */
      requestAnimationFrame(function(){ setTimeout(function(){
        if (m._fin || m._saltando) return;
        var dec = img.decode ? img.decode().catch(function(){}) : null;
        Promise.race([dec, new Promise(function(r){ setTimeout(r, 500); })]).then(function(){ animar(m); });
      }, 0); });
    });
  }

  /* Al verse al 50 % con el scroll parado 150 ms */
  function alVer(m){
    if (!('IntersectionObserver' in window)) return fin(m, 'visto');
    var visible = false;
    var mirar = function(){ clearTimeout(m._tv); if (visible) m._tv = setTimeout(function(){ if (visible){ quitar(); arrancar(m); } }, 150); };
    var quitar = function(){ removeEventListener('scroll', mirar); if (m._io) m._io.disconnect(); };
    m._io = new IntersectionObserver(function(es){
      es.forEach(function(e){ visible = e.isIntersecting && e.intersectionRatio >= .5; mirar(); });
    }, { threshold:[0, .5, 1] });
    m._io.observe(m);
    addEventListener('scroll', mirar, { passive:true });
  }

  function ponerRejilla(m){
    m.classList.add('mr-rejilla');
    var dato = document.createElement('span'); dato.className = 'mr-rejilla-dato'; dato.hidden = true; m.appendChild(dato);
    m.addEventListener('click', function(e){
      var img = m._img, r = img.getBoundingClientRect(), W = img.clientWidth, H = img.clientHeight, nw = img.naturalWidth, nh = img.naturalHeight;
      var k = Math.max(W / nw, H / nh), ox = (W - nw * k) / 2, oy = (H - nh * k) / 2;
      var x = (e.clientX - r.left - ox) / k, y = (e.clientY - r.top - oy) / k, c = m.getBoundingClientRect();
      var txt = 'x ' + Math.round(x) + '  y ' + Math.round(y) + '  (de ' + nw + '×' + nh + ')';
      console.info('[marco-recepcion] ' + txt);
      dato.textContent = txt; dato.hidden = false; dato.style.left = (e.clientX - c.left + 8) + 'px'; dato.style.top = (e.clientY - c.top + 8) + 'px';
    });
  }

  function iniciar(m){
    m._img = m.querySelector('.mr-foto') || m.querySelector('img');
    m._icono = m.querySelector('.mr-icono');
    m._libre = m.classList.contains('mr-libre') ? m.querySelector('.mr-camino > path, .mr-camino > rect, .mr-camino > polygon, .mr-camino > polyline, .mr-camino > ellipse, .mr-camino > circle') : null;
    if (rejilla){ ponerRejilla(m); return fin(m, 'visto'); }
    if (reducido) return fin(m, 'reducido');
    if (raiz.classList.contains('marco-visto')) return fin(m, 'visto');
    if (!m._img || (m.classList.contains('mr-libre') && !m._libre)) return fin(m, 'sin-foto');
    var modo = m.getAttribute('data-mr-modo') || 'auto';
    m.classList.add('mr-vigila');
    if (modo === 'manual') return;
    if (modo === 'auto'){
      var desde = parseFloat(m.getAttribute('data-mr-desde')) || 1024, r = m.getBoundingClientRect();
      var seVe = r.top < innerHeight && r.bottom > 0 && (Math.min(r.bottom, innerHeight) - Math.max(r.top, 0)) >= r.height * .5;
      if (innerWidth >= desde && seVe){ m._modoCarga = true; return arrancar(m); }
    }
    alVer(m);
  }

  var marcos = [].slice.call(document.querySelectorAll('.mr'));
  marcos.forEach(iniciar);

  window.MarcoRecepcion = {
    cuando: function(m, fn){ if (m.getAttribute('data-mr') === 'listo') fn(); else m.addEventListener('marco:listo', fn, { once:true }); },
    saltar: saltar,
    reproducir: function(m){
      if (reducido) return;
      m._fin = m._saltando = m._arrancado = false; m._anims = null;
      m.classList.remove('mr-hecho'); m.classList.add('mr-vigila'); m.removeAttribute('data-mr');
      raiz.classList.remove('marco-visto');
      arrancar(m);
    }
  };
})();
