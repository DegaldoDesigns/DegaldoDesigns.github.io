/* luces-sobre-foto (M81) · v3 · .luces-sala: "se encienden las luces de la sala" */
(function(){
  var salas = [].slice.call(document.querySelectorAll('.luces-sala'));
  var raiz = document.documentElement;
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rejilla = /[?&]rejilla(=|&|$)/.test(location.search);
  var LIMITE = 2500;                                    // ms desde la carga: más tarde que esto, no se reproduce

  function tiempo(v, def){ v = String(v || '').trim(); var n = parseFloat(v); return isNaN(n) ? def : /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n; }
  function num(cs, p, def){ var n = parseFloat(cs.getPropertyValue(p)); return isNaN(n) ? def : n; }
  function eje(valor, libre){                           // un eje de object-position → px desde el borde
    if (valor === 'left' || valor === 'top') return 0;
    if (valor === 'right' || valor === 'bottom') return libre;
    if (!valor || valor === 'center') return libre / 2;
    return valor.slice(-1) === '%' ? libre * parseFloat(valor) / 100 : parseFloat(valor) || 0;
  }
  /* Rectángulo que ocupa la imagen pintada (object-fit y object-position ya aplicados), en px desde la caja */
  function rectImagen(s){
    var img = s._img, ci = getComputedStyle(img), W = img.clientWidth, H = img.clientHeight, nw = img.naturalWidth, nh = img.naturalHeight, dw = W, dh = H;
    if ((ci.objectFit === 'cover' || ci.objectFit === 'contain') && nw && nh){
      var k = ci.objectFit === 'cover' ? Math.max(W / nw, H / nh) : Math.min(W / nw, H / nh); dw = nw * k; dh = nh * k;
    }
    var op = ci.objectPosition.split(/\s+/), r = img.getBoundingClientRect(), c = s.getBoundingClientRect();
    return { x: r.left - c.left - s.clientLeft + eje(op[0], W - dw), y: r.top - c.top - s.clientTop + eje(op[1], H - dh), w: dw, h: dh };
  }
  function mascaraCono(cs){
    var cx = num(cs, '--l-cx', .5) * 100, cy = num(cs, '--l-cy', 0) * 100, bx = num(cs, '--l-bx', .5) * 100, by = num(cs, '--l-by', .8) * 100,
        a = num(cs, '--l-ab', .02) * 100, b = num(cs, '--l-bb', .25) * 100, d = num(cs, '--l-suave', 1.5);
    var p = [cx - a, cy, cx + a, cy, bx + b, by, bx - b, by].map(function(n){ return n.toFixed(2); });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><defs>' +
      '<linearGradient id="g" gradientUnits="userSpaceOnUse" x1="0" y1="' + cy + '" x2="0" y2="' + by + '">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<filter id="f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="' + d + '"/></filter></defs>' +
      '<polygon points="' + p[0] + ',' + p[1] + ' ' + p[2] + ',' + p[3] + ' ' + p[4] + ',' + p[5] + ' ' + p[6] + ',' + p[7] + '" fill="url(#g)" filter="url(#f)"/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }
  function colocar(s){
    if (!s._luces || !s._img.naturalWidth) return;
    var R = rectImagen(s), src = s._img.currentSrc || s._img.src;
    s._luces.forEach(function(l){
      l.style.left = R.x.toFixed(1) + 'px'; l.style.top = R.y.toFixed(1) + 'px';
      l.style.width = R.w.toFixed(1) + 'px'; l.style.height = R.h.toFixed(1) + 'px';
      var c = l.querySelector('.ls-copia'); if (c && c.getAttribute('src') !== src) c.src = src;   // el <picture> cambió de recorte
      if (l.classList.contains('ls-cono')) l.style.setProperty('--l-mascara', mascaraCono(getComputedStyle(l)));
    });
  }
  function montar(s){
    var src = s._img.currentSrc || s._img.src;
    s._luces = [].slice.call(s.querySelectorAll('.ls-luz'));
    s._luces.forEach(function(l){
      l.setAttribute('aria-hidden', 'true');
      var dentro = document.createElement('span'), c = document.createElement('img'), h = document.createElement('span');
      dentro.className = 'ls-in'; c.className = 'ls-copia'; h.className = 'ls-halo';
      c.alt = ''; c.decoding = 'async'; c.src = src;           // la misma URL que ya pintó la foto: sale de la caché
      dentro.appendChild(c); dentro.appendChild(h); l.appendChild(dentro);
    });
    colocar(s);
    s._alCambiar = function(){ colocar(s); };
    addEventListener('resize', s._alCambiar); s._img.addEventListener('load', s._alCambiar);
  }

  function fin(s, motivo){
    if (s._fin) return; s._fin = true;
    clearTimeout(s._t); quitarGestos(s);
    if (s._alCambiar){ removeEventListener('resize', s._alCambiar); s._img.removeEventListener('load', s._alCambiar); }
    s.classList.add('ls-hecho'); s.classList.remove('ls-on'); s.setAttribute('data-luces', 'fin');
    (s._luces || []).forEach(function(l){ var d = l.querySelector('.ls-in'); if (d) l.removeChild(d); });
    s.dispatchEvent(new CustomEvent('luces:fin', { bubbles:true, detail:{ motivo:motivo } }));
  }
  /* Al primer gesto: velo y luces a 0 desde donde estén, en --ls-salto */
  function saltar(s, motivo){
    if (s._fin || s._saltando) return; s._saltando = true;
    var piezas = [s.querySelector('.ls-velo')].concat(s._luces || []).filter(Boolean);
    piezas.forEach(function(p){ p.style.opacity = getComputedStyle(p).opacity; p.style.animation = 'none'; });
    s.classList.add('ls-salta'); void s.offsetWidth;
    piezas.forEach(function(p){ p.style.opacity = '0'; });
    setTimeout(function(){
      fin(s, motivo || 'gesto');
      piezas.forEach(function(p){ p.style.opacity = ''; p.style.animation = ''; }); s.classList.remove('ls-salta');
    }, tiempo(getComputedStyle(s).getPropertyValue('--ls-salto'), 150) + 20);
  }
  var GESTOS = ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart'];
  function ponerGestos(s){ s._gesto = function(){ saltar(s, 'gesto'); }; GESTOS.forEach(function(g){ addEventListener(g, s._gesto, { passive:true }); }); }
  function quitarGestos(s){ if (s._gesto) GESTOS.forEach(function(g){ removeEventListener(g, s._gesto, { passive:true }); }); }

  function cuandoLista(img, ms){                         // la foto ya pintada, o false si no llega a tiempo
    return new Promise(function(ok){
      if (img.complete && img.naturalWidth) return ok(true);
      var t = setTimeout(function(){ ok(false); }, Math.max(0, ms));
      img.addEventListener('load', function(){ clearTimeout(t); ok(true); }, { once:true });
      img.addEventListener('error', function(){ clearTimeout(t); ok(false); }, { once:true });
    });
  }
  function arrancar(s){
    if (s._fin || s._saltando) return;
    if (performance.now() > LIMITE + 400) return saltar(s, 'sin-foto');
    var cs = getComputedStyle(s);
    s.classList.add('ls-on');
    s._t = setTimeout(function(){ fin(s, 'completo'); }, tiempo(cs.getPropertyValue('--ls-velo-t'), 900) + tiempo(cs.getPropertyValue('--ls-velo-dur'), 500));
  }

  function ponerRejilla(s){
    s.classList.add('ls-rejilla');
    var dato = document.createElement('span');
    dato.style.cssText = 'position:absolute;z-index:9;padding:2px 6px;font:12px/1.4 ui-monospace,monospace;background:#000;color:#0ff;pointer-events:none;white-space:nowrap';
    dato.hidden = true; s.appendChild(dato);
    s.addEventListener('click', function(e){
      var R = rectImagen(s), c = s.getBoundingClientRect(), px = e.clientX - c.left - s.clientLeft, py = e.clientY - c.top - s.clientTop;
      var txt = '--l-cx:' + ((px - R.x) / R.w).toFixed(3) + '; --l-cy:' + ((py - R.y) / R.h).toFixed(3);
      console.info('[luces-sala] ' + txt + '  (' + (s._img.currentSrc || s._img.src).split('/').pop() + ')');
      dato.textContent = txt; dato.hidden = false; dato.style.left = (px + 8) + 'px'; dato.style.top = (py + 8) + 'px';
    });
  }

  salas.forEach(function(s){
    s._img = s.querySelector(':scope > img, :scope > picture > img');
    if (!s._img){ fin(s, 'sin-foto'); return; }
    if (rejilla){ raiz.classList.add('luces-vistas'); cuandoLista(s._img, 8000).then(function(){ montar(s); ponerRejilla(s); }); s.setAttribute('data-luces', 'fin'); return; }
    if (reducido) return fin(s, 'reducido');
    if (raiz.classList.contains('luces-vistas')) return fin(s, 'visto');
    if (document.hidden || !raiz.classList.contains('js')) return fin(s, 'oculta');
    try{ sessionStorage.setItem(s.getAttribute('data-ls-clave') || 'luces-sala', '1'); }catch(e){}
    ponerGestos(s);
    cuandoLista(s._img, LIMITE - performance.now()).then(function(ok){
      if (!ok) return saltar(s, 'sin-foto');
      /* Montar las luces DESPUÉS del fotograma en que se pinta la foto: si no, las máscaras y copias se calculan en ese
         mismo fotograma y retrasan el LCP (medido: +200 ms en móvil con la CPU a ×4). */
      requestAnimationFrame(function(){ setTimeout(function(){
        if (s._fin || s._saltando) return;
        montar(s);
        var copias = [].slice.call(s.querySelectorAll('.ls-copia')).map(function(c){ return c.decode ? c.decode().catch(function(){}) : null; });
        Promise.race([Promise.all(copias), new Promise(function(r){ setTimeout(r, 400); })]).then(function(){ arrancar(s); });
      }, 0); });
    });
  });

  window.LucesSala = {
    cuando: function(el, fn){ if (el.getAttribute('data-luces') === 'fin') fn(); else el.addEventListener('luces:fin', fn, { once:true }); },
    saltar: saltar
  };
})();

