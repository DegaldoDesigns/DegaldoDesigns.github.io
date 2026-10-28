/* objetos-gimnasio (M117): .visto al verse (se observa el contenedor), carnets que giran y luz del espejo con el ratón */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Índices para los retrasos escalonados */
  document.querySelectorAll('.og-fotos-lista, .og-tics, .og-carnets, .og-notas').forEach(function(l){
    Array.prototype.forEach.call(l.children, function(h, i){ h.style.setProperty('--i', i); });
  });

  /* Entradas: una vez, al verse el contenedor */
  var els = document.querySelectorAll('.og-fotos, .og-circular, .og-carnets, .og-espejo, .og-anotado');
  if (!('IntersectionObserver' in window) || reducido){ els.forEach(function(e){ e.classList.add('visto'); }); }
  else {
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); io.unobserve(e.target); } }); }, {rootMargin:'0px 0px -12% 0px'});
    els.forEach(function(e){ io.observe(e); });
  }

  /* Carnets: el botón (fuera del carnet) gira; la cara oculta, inert y aria-hidden */
  document.querySelectorAll('.og-carnet-pieza').forEach(function(p){
    var carnet = p.querySelector('.og-carnet'), btn = p.querySelector('.og-girar');
    var delante = p.querySelector('.og-delante'), detras = p.querySelector('.og-detras');
    if (!carnet || !btn || !delante || !detras) return;
    function poner(girado){
      carnet.classList.toggle('og-girado', girado);
      btn.textContent = girado ? btn.dataset.tDetras : btn.dataset.tDelante;
      btn.setAttribute('aria-controls', girado ? delante.id : detras.id);
      btn.setAttribute('aria-pressed', String(girado));
      [[delante, girado], [detras, !girado]].forEach(function(c){
        c[0].inert = c[1]; if (c[1]) c[0].setAttribute('aria-hidden', 'true'); else c[0].removeAttribute('aria-hidden');
      });
    }
    poner(false);
    btn.addEventListener('click', function(){ poner(!carnet.classList.contains('og-girado')); });
    carnet.addEventListener('click', function(){ poner(!carnet.classList.contains('og-girado')); });

    /* Inclinación leve hacia el cursor (máx. 5°), solo ratón */
    if (!raton || reducido) return;
    var pend = null;
    carnet.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = carnet.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      if (pend) return;
      pend = requestAnimationFrame(function(){ pend = null; carnet.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg'); carnet.style.setProperty('--rx', (y * -10).toFixed(2) + 'deg'); });
    });
    carnet.addEventListener('pointerleave', function(){ carnet.style.setProperty('--rx', '0deg'); carnet.style.setProperty('--ry', '0deg'); });
  });

  /* v1.4 Flechas para la fila de carnets (Gimnasio Energy, 2026-10-28: en un iPhone 18 no dejaba deslizar con el dedo).
     Se crean solas debajo de .og-carnets-region y solo se ven cuando la fila no cabe; mueven la fila por código (scrollTo),
     así funcionan aunque el gesto falle. Contador "2 / 4" y extremos desactivados. */
  document.querySelectorAll('.og-carnets-region').forEach(function(reg){
    var piezas = [].slice.call(reg.querySelectorAll('.og-carnet-pieza')); if (piezas.length < 2) return;
    var caja = document.createElement('div'); caja.className = 'og-flechas'; caja.hidden = true;
    caja.innerHTML = '<button class="og-paso" type="button" aria-label="Cuota anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<span class="og-cuenta" aria-live="polite"></span>' +
      '<button class="og-paso" type="button" aria-label="Cuota siguiente"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>';
    reg.parentNode.insertBefore(caja, reg.nextSibling);
    var ant = caja.children[0], cuenta = caja.children[1], sig = caja.children[2], actual = 0, pend = null;
    function cual(){ var r = reg.getBoundingClientRect(), mitad = r.left + r.width / 2, mejor = 0, d = Infinity;
      piezas.forEach(function(p, i){ var b = p.getBoundingClientRect(), x = Math.abs(b.left + b.width / 2 - mitad); if (x < d){ d = x; mejor = i; } }); return mejor; }
    function pintar(){ pend = null; caja.hidden = reg.scrollWidth <= reg.clientWidth + 4; actual = cual();
      cuenta.textContent = (actual + 1) + ' / ' + piezas.length; ant.disabled = actual === 0; sig.disabled = actual === piezas.length - 1; }
    function ir(i){ i = Math.max(0, Math.min(piezas.length - 1, i));
      var r = reg.getBoundingClientRect(), b = piezas[i].getBoundingClientRect();
      var desde = reg.scrollLeft, hasta = desde + (b.left - r.left) - (r.width - b.width) / 2;
      /* Safari ignora scrollTo({behavior:'smooth'}) con scroll-snap: se quita el imán, se anima a mano y se vuelve a poner */
      reg.style.scrollSnapType = 'none';
      if (reducido){ reg.scrollLeft = hasta; reg.style.scrollSnapType = ''; return; }
      var t0 = performance.now();
      (function paso(t){ var k = Math.min(1, (t - t0) / 300), e = 1 - Math.pow(1 - k, 3);
        reg.scrollLeft = desde + (hasta - desde) * e;
        if (k < 1) requestAnimationFrame(paso); else { reg.style.scrollSnapType = ''; pintar(); } })(t0); }
    ant.addEventListener('click', function(){ ir(actual - 1); });
    sig.addEventListener('click', function(){ ir(actual + 1); });
    reg.addEventListener('scroll', function(){ if (!pend) pend = requestAnimationFrame(pintar); }, {passive:true});
    addEventListener('resize', function(){ if (!pend) pend = requestAnimationFrame(pintar); });
    pintar();
  });

  /* Espejo: la luz se desliza al contrario que el ratón (solo ratón) */
  if (raton && !reducido) document.querySelectorAll('.og-espejo').forEach(function(es){
    var luz = es.querySelector('.og-luz'); if (!luz) return;
    var pend = null;
    es.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse' || pend) return;
      var r = es.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5;
      pend = requestAnimationFrame(function(){ pend = null; luz.style.translate = (x * -18).toFixed(2) + '% 0'; });
    });
    es.addEventListener('pointerleave', function(){ luz.style.translate = '0 0'; });
  });
})();
