/* M110 etiquetas-cosidas v1 (Millán Atelier v2, 2026-10-26; versión genérica en 01-Libreria-de-Codigo/componentes/etiquetas-cosidas.html).
   1. [data-ec] Etiqueta de forro: el JS cambia la costura discontinua (un <rect> con pathLength) por puntadas sueltas (<line>) repartidas
      por el contorno, y al verse se cosen una a una (opacity con retraso --k * 14 ms); luego aparece el texto. Sin JS o con
      movimiento reducido: la costura y el texto, quietos.
   2. [data-ec-hilo] Etiquetas de cartón colgadas de un hilo: al verse se balancean una vez (CSS); con ratón, las que quedan cerca
      del puntero se mueven un poco según su velocidad (muelle amortiguado en --m, solo rotate). Nada en táctil ni con reducido. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NS = 'http://www.w3.org/2000/svg', hayIO = 'IntersectionObserver' in window;
  function alVer(el, fn, umbral){
    if (!hayIO){ fn(); return; }
    var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); fn(); } }, {threshold:umbral || .4}); io.observe(el);
  }

  /* 1. etiqueta de forro que se cose */
  document.querySelectorAll('[data-ec]').forEach(function(ec){
    if (reducido) return;
    var et = ec.querySelector('.ec-etiqueta'), viejo = ec.querySelector('.ec-costura');
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'ec-puntadas'); svg.setAttribute('aria-hidden', 'true');
    function coser(){
      var w = et.clientWidth, h = et.clientHeight, m = 12, largo = 9, hueco = 6, k = 0;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.textContent = '';
      var lados = [[m + 10, m, w - m - 10, m], [w - m - 10, m, w - m - 10, h - m], [w - m - 10, h - m, m + 10, h - m], [m + 10, h - m, m + 10, m]];
      lados.forEach(function(l){
        var dx = l[2] - l[0], dy = l[3] - l[1], d = Math.hypot(dx, dy), n = Math.floor(d / (largo + hueco));
        for (var i = 0; i < n; i++){
          var a = i * (largo + hueco) / d, b = (i * (largo + hueco) + largo) / d, ln = document.createElementNS(NS, 'line');
          ln.setAttribute('x1', (l[0] + dx * a).toFixed(1)); ln.setAttribute('y1', (l[1] + dy * a).toFixed(1));
          ln.setAttribute('x2', (l[0] + dx * b).toFixed(1)); ln.setAttribute('y2', (l[1] + dy * b).toFixed(1));
          ln.style.setProperty('--k', k++); svg.appendChild(ln);
        }
      });
    }
    coser(); viejo.replaceWith(svg); ec.classList.add('ec-con-puntadas');
    var ancho = et.clientWidth;
    addEventListener('resize', function(){ if (et.clientWidth !== ancho){ ancho = et.clientWidth; coser(); } });
    alVer(ec, function(){ ec.classList.add('ec-cosida'); });
  });

  /* 2. etiquetas de cartón colgadas de un hilo */
  document.querySelectorAll('[data-ec-hilo]').forEach(function(hilo){
    if (reducido) return;
    var tarjetas = [].slice.call(hilo.querySelectorAll('.ec-carton'));
    tarjetas.forEach(function(t, k){ t.style.setProperty('--k', k); });
    alVer(hilo, function(){ hilo.classList.add('ec-vivo'); setTimeout(function(){ hilo.classList.remove('ec-vivo'); }, 1900); }, .3);
    if (!raton) return;
    var ang = tarjetas.map(function(){ return 0; }), vel = ang.slice(), raf = 0, px = null;
    function bucle(){
      raf = 0; var vivo = false;
      tarjetas.forEach(function(t, i){
        vel[i] += -ang[i] * .07; vel[i] *= .9; ang[i] = Math.max(-6, Math.min(6, ang[i] + vel[i]));
        if (Math.abs(ang[i]) > .02 || Math.abs(vel[i]) > .02) vivo = true; else { ang[i] = 0; vel[i] = 0; }
        t.style.setProperty('--m', ang[i].toFixed(2) + 'deg');
      });
      if (vivo) raf = requestAnimationFrame(bucle);
    }
    hilo.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      if (px === null){ px = e.clientX; return; }
      var dx = e.clientX - px; px = e.clientX;
      tarjetas.forEach(function(t, i){
        var r = t.getBoundingClientRect(), cx = r.left + r.width / 2, d = Math.abs(e.clientX - cx);
        if (d < r.width * .9 && e.clientY > r.top - 80 && e.clientY < r.bottom + 20) vel[i] += Math.max(-.6, Math.min(.6, dx * .025)) * (1 - d / (r.width * .9));
      });
      if (!raf) raf = requestAnimationFrame(bucle);
    });
    hilo.addEventListener('pointerleave', function(){ px = null; });
  });
})();
