/* M109 cinta-metrica v1 (Millán Atelier v2, 2026-10-26; versión genérica en 01-Libreria-de-Codigo/componentes/cinta-metrica.html).
   La cinta se desenrolla al bajar: --p (0 a 1) recorta la cinta con clip-path y el rollo viaja hasta el borde (translate). Cada hito
   aparece cuando la cinta llega a su columna (--c). En escritorio la cinta es horizontal; por debajo de 900 px, vertical.
   Sin JS o con movimiento reducido: la cinta entera y todos los hitos. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches, vertical = matchMedia('(max-width: 899px)');
  if (reducido) return;
  document.querySelectorAll('[data-cm]').forEach(function(cm){
    var cinta = cm.querySelector('.cm-cinta'), hitos = [].slice.call(cm.querySelectorAll('.cm-hitos li'));
    var cols = +(getComputedStyle(cm).getPropertyValue('--cm-cols') || 13) || 13, pend = 0, cerca = false;
    cm.classList.add('cm-listo');
    function pintar(){
      pend = 0;
      var r = cm.getBoundingClientRect(), vh = innerHeight, p;
      if (vertical.matches) p = (vh * .78 - r.top) / Math.max(1, r.height);
      else p = (vh * .9 - r.top) / (vh * .6);
      p = Math.max(0, Math.min(1, p));
      cm.style.setProperty('--p', p.toFixed(4)); cm.classList.toggle('cm-fin', p > .96);
      var c = cinta.getBoundingClientRect();
      if (vertical.matches) cm.style.setProperty('--rollo-y', (p * c.height).toFixed(1) + 'px');
      else cm.style.setProperty('--rollo-x', (p * c.width).toFixed(1) + 'px');
      hitos.forEach(function(li){ var col = +getComputedStyle(li).getPropertyValue('--c'); li.classList.toggle('visto', p >= (col - .4) / cols); });
    }
    function pedir(){ if (cerca && !pend) pend = requestAnimationFrame(pintar); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ cerca = es[0].isIntersecting; pedir(); }, {rootMargin:'200px 0px'}).observe(cm);
    else cerca = true;
    addEventListener('scroll', pedir, {passive:true});
    addEventListener('resize', pedir);
    pintar();
  });
})();
