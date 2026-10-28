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
