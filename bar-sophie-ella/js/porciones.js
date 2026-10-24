/* COPIA LITERAL de 01-Libreria-de-Codigo/componentes/porciones-marcadas.html (M92 v1.0.1): no editar aquí, se cambia allí y se vuelve a copiar */
/* porciones-marcadas (M92) · v1.0.1 */
(function(){
  var D = document, H = D.documentElement; if (!H.classList.contains('js')) return;
  var RED = matchMedia('(prefers-reduced-motion: reduce)').matches || H.classList.contains('pm-simula-reducido'),
      RATON = matchMedia('(hover:hover) and (pointer:fine)').matches,
      REJ = /[?&]rejilla/.test(location.search) && /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname),   /* v1.0.1: solo en desarrollo */
      EO = 'cubic-bezier(.23,1,.32,1)', PI = Math.PI;
  function num(e, a, d){ var x = parseFloat(e.getAttribute(a)); return isNaN(x) ? d : x; }
  function lon(v, W, d){ v = (v || '').trim(); var x = parseFloat(v); return isNaN(x) ? W * d / 100 : /%$/.test(v) ? W * x / 100 : x; }
  function f2(p){ return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
  function hacia(p, q, d){ var x = q[0] - p[0], y = q[1] - p[1], l = Math.hypot(x, y) || 1; return [p[0] + x / l * d, p[1] + y / l * d]; }
  function visto(e, p){ var k = 'pm:' + location.pathname + ':' + e._id;
    try { if (p) sessionStorage.setItem(k, 1); else return sessionStorage.getItem(k) == '1'; } catch(_){} }

  function geo(e){   /* la elipse en píxeles de la foto y los ángulos de cortes y porción */
    var im = e.querySelector('img'), a = (e.getAttribute('data-pm-elipse') || '').split(',').map(Number),
        W = +im.getAttribute('width') || im.naturalWidth, Hh = +im.getAttribute('height') || im.naturalHeight,
        n = Math.max(2, Math.round(num(e, 'data-porciones', 12))), cs = getComputedStyle(e),
        g = {W:W, H:Hh, cx:a[0], cy:a[1], rx:a[2], ry:a[3], fg:a[4] || 0, n:n, st:2 * PI / n, t0:num(e, 'data-pm-inicio', 90) * PI / 180};
    g.f = g.fg * PI / 180;
    g.pt = function(t, k){ k = k == null ? 1 : k; var c = Math.cos(t) * g.rx * k, s = Math.sin(t) * g.ry * k;
      return [g.cx + c * Math.cos(g.f) - s * Math.sin(g.f), g.cy + c * Math.sin(g.f) + s * Math.cos(g.f)]; };
    g.arco = function(t){ return 'A' + g.rx + ' ' + g.ry + ' ' + g.fg + ' 0 1 ' + f2(g.pt(t)); };
    g.g = lon(cs.getPropertyValue('--pm-grosor'), W, .55); g.h = lon(cs.getPropertyValue('--pm-hendidura'), W, .3);
    g.ta = g.t0 + num(e, 'data-pm-porcion', n - 1) * g.st; g.tm = g.ta + g.st / 2;
    return g;
  }
  function cortes(g){   /* N/2 diámetros (N par) o N radios (N impar), recortados medio grosor para que el remate no salga */
    var C = [g.cx, g.cy], r = [], par = g.n % 2 == 0;
    for (var k = 0; k < (par ? g.n / 2 : g.n); k++){
      var t = g.t0 + k * g.st, A = hacia(g.pt(t), C, g.g / 2);
      r.push(par ? 'M' + f2(A) + 'L' + f2(hacia(g.pt(t + PI), C, g.g / 2)) : 'M' + f2(C) + 'L' + f2(A));
    }
    return r;
  }
  function cuna(g, t){ return 'M' + f2([g.cx, g.cy]) + 'L' + f2(g.pt(t)) + g.arco(t + g.st) + 'Z'; }
  function dibujo(e){   /* el SVG del estado final (también sirve para pegarlo en el HTML como respaldo sin JS) */
    var g = e._g, c = cortes(g), L = e._L, s = '', o = ' pathLength="1"', borde = 'M' + f2(g.pt(g.t0)) + g.arco(g.t0 + PI) + g.arco(g.t0) + 'Z';
    s += '<path class="pm-cuna" d=""/>';
    if (L) s += '<path class="pm-borde-relleno" d="' + borde + '"/><path class="pm-porcion-relleno" d="' + cuna(g, g.ta) + '"/>';
    s += '<g transform="translate(0 ' + g.h.toFixed(1) + ')" stroke-width="' + g.g.toFixed(1) + '">' + c.map(function(d){ return '<path class="pm-sombra" d="' + d + '"' + o + '/>'; }).join('') + '</g>';
    s += '<g stroke-width="' + g.g.toFixed(1) + '">' + c.map(function(d){ return '<path class="pm-corte" d="' + d + '"' + o + '/>'; }).join('') + '</g>';
    if (L) s += '<path class="pm-borde" d="' + borde + '"' + o + ' stroke-width="' + g.g.toFixed(1) + '"/><path class="pm-porcion" d="' + cuna(g, g.ta) + '"' + o + ' stroke-width="' + g.g.toFixed(1) + '"/>';
    s += '<circle class="pm-centro" cx="' + g.cx + '" cy="' + g.cy + '" r="' + (g.W * .0045).toFixed(1) + '"/>';
    if (L) s += '<path class="pm-flecha" d="' + (e._fd || '') + '"' + o + ' stroke-width="' + (g.g * .55).toFixed(1) + '"/>';
    return s;
  }
  function rejilla(e){
    var g = e._g, s = '<g class="pm-rejilla"><path d="M' + f2(g.pt(0)) + g.arco(PI) + g.arco(0) + 'Z"/><path d="' + cortes(g).join('') + '"/>' +
      '<circle cx="' + g.cx + '" cy="' + g.cy + '" r="' + (g.W * .006) + '"/></g>', p = e.querySelector('.pm-rejilla-datos');
    e._svg.insertAdjacentHTML('beforeend', s);
    if (!p){ p = D.createElement('pre'); p.className = 'pm-rejilla-datos'; p.setAttribute('aria-hidden', 'true'); e.appendChild(p); }
    p.textContent = 'data-pm-elipse="' + [g.cx, g.cy, g.rx, g.ry, g.fg].join(',') + '"  ' + g.W + '×' + g.H;
  }
  function monta(e){
    e._g = geo(e); var g = e._g;
    e._svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H); e._svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    e._svg.innerHTML = dibujo(e);
    e._cortes = e._svg.querySelectorAll('.pm-corte'); e._sombras = e._svg.querySelectorAll('.pm-sombra');
    if (REJ || e.hasAttribute('data-pm-rejilla')) rejilla(e);
    coloca(e);
  }
  function coloca(e){   /* etiqueta dentro de la foto, debajo a la derecha del borde de la porción, y su flecha */
    var L = e._L, g = e._g; if (!L) return;
    var w = e.clientWidth, h = e.clientHeight; if (!w) return;
    var k = w / g.W, E = g.pt(g.tm), q = (e.getAttribute('data-pm-etiqueta') || '').split(',').map(Number),
        ax = q.length == 2 ? q[0] : E[0] + g.W * .05, ay = q.length == 2 ? q[1] : E[1] + g.H * .06,
        lw = L.offsetWidth, lh = L.offsetHeight,
        x = Math.max(6, Math.min(w - lw - 6, ax * k)), y = Math.max(6, Math.min(h - lh - 6, ay * k));
    L.style.left = (x / w * 100).toFixed(2) + '%'; L.style.top = (y / h * 100).toFixed(2) + '%';
    var S = [(x + Math.min(18, lw * .2)) / k, y / k - g.g * 1.2],
        T = e.classList.contains('pm-entera') ? g.pt(g.tm - 60 * PI / 180) : [g.cx + (E[0] - g.cx) * .55, g.cy + (E[1] - g.cy) * .55],
        dx = T[0] - S[0], dy = T[1] - S[1], l = Math.hypot(dx, dy) || 1,
        Cq = [S[0] + dx / 2 - dy * .22, S[1] + dy / 2 + dx * .22];
    T = hacia(T, Cq, g.g * 1.6);
    var tx = T[0] - Cq[0], ty = T[1] - Cq[1], tl = Math.hypot(tx, ty) || 1, cab = Math.max(g.g * 3.2, l * .09), a = .5;
    function lado(s){ var c = Math.cos(s * a), si = Math.sin(s * a), ux = -tx / tl, uy = -ty / tl;
      return [T[0] + (ux * c - uy * si) * cab, T[1] + (ux * si + uy * c) * cab]; }
    e._fd = 'M' + f2(S) + 'Q' + f2(Cq) + ' ' + f2(T) + 'M' + f2(lado(1)) + 'L' + f2(T) + 'L' + f2(lado(-1));
    var fl = e._svg.querySelector('.pm-flecha'); if (fl) fl.setAttribute('d', e._fd);
  }
  function contador(e, v){ if (e._cnt) e._cnt.textContent = v; }
  function para(e){ var s = e._s; s.t.forEach(clearTimeout); s.a.forEach(function(a){ a.cancel(); }); s.t = []; s.a = []; }
  function aviso(e){ if (!e._s.li){ e._s.li = 1; e.dispatchEvent(new CustomEvent('porciones:marcadas', {bubbles:true})); } }
  function fin(e, fundido){   /* estado final sin dibujo (sesión, pestaña oculta, cambio de ancho, reducido) */
    var s = e._s; para(e); e.classList.add('pm-sin-trans', 'pm-cortado', 'pm-lista'); contador(e, e._g.n);
    e.getBoundingClientRect(); requestAnimationFrame(function(){ e.classList.remove('pm-sin-trans'); });
    if (fundido) [e._svg, e._L].forEach(function(x){ if (x) s.a.push(x.animate({opacity:[0, 1]}, {duration:300, easing:EO})); });
    s.ok = 1; s.on = 1; aviso(e);
  }
  function corre(e, o){
    o = o || {}; var s = e._s;
    if (o.opcion) return opcion(e, o.opcion);
    if (s.on && !o.repetir) return;
    para(e); s.on = 1; s.ok = s.li = 0;
    if (o.repetir){ e.classList.remove('pm-entera'); monta(e); marca(e, 'porcion'); }
    e.classList.add('pm-sin-trans'); e.classList.remove('pm-cortado', 'pm-lista', 'pm-cuna-on');
    if (!o.repetir && e.getAttribute('data-una-vez') == 'sesion' && visto(e)) return fin(e);
    visto(e, 1);
    if (!o.repetir && D.hidden) return fin(e);
    if (RED) return fin(e, 1);
    contador(e, 0); e.getBoundingClientRect(); e.classList.remove('pm-sin-trans');
    var g = e._g, df = num(e, 'data-pm-desfase', 128), n = e._cortes.length, T1 = 120 + (n - 1) * df + 260, w = innerWidth,
        ct = e._svg.querySelector('.pm-centro');
    s.a.push(ct.animate([{opacity:0, scale:.6}, {opacity:1, scale:1}], {duration:120, easing:EO, fill:'both'}));
    [].forEach.call(e._cortes, function(p, k){
      [p, e._sombras[k]].forEach(function(x){ s.a.push(x.animate([{strokeDashoffset:'1'}, {strokeDashoffset:'0'}], {duration:260, delay:120 + k * df, easing:EO, fill:'both'})); });
      s.t.push(setTimeout(function(){ contador(e, Math.round((k + 1) / n * g.n)); }, 120 + k * df + 260));
    });
    s.t.push(setTimeout(function(){ e.classList.add('pm-cortado'); s.a.forEach(function(a){ a.cancel(); }); s.a = []; e.classList.add('pm-lista'); }, T1));
    s.t.push(setTimeout(function(){ s.ok = 1; removeEventListener('resize', s.rs); aviso(e); }, T1 + (e._L ? 280 : 0)));
    removeEventListener('resize', s.rs);
    s.rs = function(){ if (innerWidth != w) fin(e); }; addEventListener('resize', s.rs);
  }
  function marca(e, v){ var b = e._b; if (!b) return;
    var r = b.querySelector('[data-pm-selector] input[value="' + v + '"]'); if (r) r.checked = true; }
  function opcion(e, v, desdeRadio){   /* porción ↔ entera: transiciones interrumpibles */
    var s = e._s, b = e._b; v = v == 'entera' ? 'entera' : 'porcion';
    if (!s.ok) fin(e);
    if (!desdeRadio) marca(e, v);
    e.classList.toggle('pm-entera', v == 'entera');
    clearTimeout(s.ft);
    if (RED) coloca(e);
    else { e.classList.add('pm-flecha-fuera'); s.ft = setTimeout(function(){ coloca(e); e.classList.remove('pm-flecha-fuera'); }, 160); }
    if (b){
      var r = b.querySelector('[data-pm-selector] input[value="' + v + '"]'), out = b.querySelector('[data-pm-resultado]');
      if (out && r) out.textContent = r.getAttribute('data-pm-texto') || '';
      [].forEach.call(b.querySelectorAll('[data-pm-solo]'), function(x){ x.hidden = x.getAttribute('data-pm-solo') != v; });
    }
    e.dispatchEvent(new CustomEvent('porciones:opcion', {bubbles:true, detail:{opcion:v}}));
  }
  function arranca(e){   /* al verse el umbral de la foto con el scroll parado unos ms */
    var m = e.getAttribute('data-pm-modo') || 'al-ver';
    if (m == 'carga' || (e.getAttribute('data-una-vez') == 'sesion' && visto(e))) return corre(e);
    if (m != 'al-ver') return;
    if (!window.IntersectionObserver) return corre(e);
    var u = num(e, 'data-pm-umbral', .5), es = num(e, 'data-pm-espera', 150), t = 0, dentro = 0;
    function espera(){ clearTimeout(t); if (dentro) t = setTimeout(function(){ io.disconnect(); removeEventListener('scroll', espera); corre(e); }, es); }
    var io = new IntersectionObserver(function(x){ dentro = x[0].isIntersecting; espera(); },
      {threshold:Math.min(u, Math.max(.05, innerHeight / Math.max(1, e.offsetHeight) * .9))});
    io.observe(e); addEventListener('scroll', espera, {passive:true});
  }

  window.porcionesMarcadas = function(e, o){ if (e && e._s) corre(e, o); };
  window.porcionesMarcadas.dibujo = function(e){ return e && e._g ? dibujo(e) : ''; };

  [].forEach.call(D.querySelectorAll('.pm'), function(e, i){
    var b = e.closest('[data-pm-bloque]') || e.parentNode, sel = b.querySelector('[data-pm-selector]'), res = b.querySelector('[data-pm-resultado]');
    e._id = e.id || i; e._b = b; e._s = {t:[], a:[]}; e._L = e.querySelector('.pm-etiqueta'); e._cnt = b.querySelector('[data-pm-contador]');
    e._svg = e.querySelector('.pm-capa');
    if (!e._svg){ e._svg = D.createElementNS('http://www.w3.org/2000/svg', 'svg'); e._svg.setAttribute('class', 'pm-capa'); e._svg.setAttribute('aria-hidden', 'true'); e.insertBefore(e._svg, e._L); }
    if (RED) e.classList.add('pm-red');
    e.classList.add('pm-sin-trans'); monta(e);
    if (e._cnt){ e._cnt.textContent = e._g.n; e._cnt.style.minWidth = e._cnt.offsetWidth + 'px'; }
    requestAnimationFrame(function(){ e.classList.remove('pm-sin-trans'); });
    if (sel){ sel.hidden = false; sel.addEventListener('change', function(x){ if (x.target.name) opcion(e, x.target.value, 1); }); }
    if (res) res.hidden = false;
    [].forEach.call(b.querySelectorAll('[data-pm-solo]'), function(x){ x.hidden = x.getAttribute('data-pm-solo') != 'porcion'; });
    if (res && sel){ var r = sel.querySelector('input:checked'); if (r) res.textContent = r.getAttribute('data-pm-texto') || ''; }
    var w = innerWidth;
    addEventListener('resize', function(){ if (innerWidth == w) return; w = innerWidth; requestAnimationFrame(function(){ coloca(e); }); });
    D.addEventListener('visibilitychange', function(){ if (D.hidden && e._s.on && !e._s.ok) fin(e); });
    if (e.hasAttribute('data-pm-hover') && RATON){
      var cu = e._svg.querySelector('.pm-cuna'), ult = -1, pend = 0, ev;
      e.addEventListener('pointermove', function(x){ if (x.pointerType != 'mouse' || !e._s.ok) return; ev = x;
        if (!pend) pend = requestAnimationFrame(function(){ pend = 0; var g = e._g, r = e.getBoundingClientRect(), k = g.W / r.width,
          px = (ev.clientX - r.left) * k - g.cx, py = (ev.clientY - r.top) * k - g.cy,
          u = (px * Math.cos(g.f) + py * Math.sin(g.f)) / g.rx, v = (-px * Math.sin(g.f) + py * Math.cos(g.f)) / g.ry;
          if (u * u + v * v > 1){ e.classList.remove('pm-cuna-on'); ult = -1; return; }
          var j = Math.floor((((Math.atan2(v, u) - g.t0) % (2 * PI)) + 2 * PI) % (2 * PI) / g.st);
          cu = e._svg.querySelector('.pm-cuna');
          if (j != ult){ ult = j; cu.setAttribute('d', cuna(g, g.t0 + j * g.st)); }
          e.classList.add('pm-cuna-on'); }); });
      e.addEventListener('pointerleave', function(){ e.classList.remove('pm-cuna-on'); ult = -1; });
    }
    arranca(e);
  });
})();
