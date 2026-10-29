/* Portada v4 (Ángel recortado): con ratón, el nombre del rótulo y la figura se desplazan un poco en sentidos
   contrarios (data-por = recorrido máximo en px) para dar profundidad. Solo con ratón, sin movimiento reducido
   y mientras la portada está en pantalla. La entrada al cargar es CSS (estilos.css, "PORTADA v4"). */
(function(){
  var portada = document.querySelector('.portada');
  if (!portada) return;
  if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var capas = Array.prototype.slice.call(portada.querySelectorAll('[data-por]'));
  var dx = 0, dy = 0, pendiente = false, visible = true;

  function pinta(){
    pendiente = false;
    capas.forEach(function(c){
      var f = parseFloat(c.dataset.por) || 0;
      c.style.translate = (dx * f).toFixed(1) + 'px ' + (dy * f * .6).toFixed(1) + 'px';
    });
  }

  portada.addEventListener('pointermove', function(e){
    if (e.pointerType !== 'mouse' || !visible) return;
    var r = portada.getBoundingClientRect();
    dx = ((e.clientX - r.left) / r.width - .5) * 2;
    dy = ((e.clientY - r.top) / r.height - .5) * 2;
    if (!pendiente){ pendiente = true; requestAnimationFrame(pinta); }
  });
  portada.addEventListener('pointerleave', function(){ dx = 0; dy = 0; requestAnimationFrame(pinta); });

  if ('IntersectionObserver' in window){
    new IntersectionObserver(function(e){ visible = e[0].isIntersecting; }).observe(portada);
  }
})();
