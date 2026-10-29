/* M112 caja-papel-seda v1 (Millán Atelier v2, 2026-10-26; versión genérica en 01-Libreria-de-Codigo/componentes/caja-papel-seda.html).
   Al llegar abajo (la caja visible al 55 %), la tapa sube y el papel de seda se aparta a los lados; dentro esperan la firma y los
   botones, que están en el HTML desde el principio. Con teclado, la caja se abre en cuanto algo de dentro recibe el foco.
   Sin JS o con movimiento reducido: la caja abierta (sin tapa ni papel). */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-cs]').forEach(function(cs){
    function abrir(){ cs.classList.add('cs-abierta'); }
    cs.addEventListener('focusin', abrir);
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); setTimeout(abrir, 200); } }, {threshold:.55});
      io.observe(cs);
    } else abrir();
  });
})();
