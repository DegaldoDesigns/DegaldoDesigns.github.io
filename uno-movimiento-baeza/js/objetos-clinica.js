/* objetos-clinica (M120) v1, copia de la librería (Clínica César Navarro / UNO movimiento, 2026-10-27). */
/* objetos-clinica (M120): .visto al verse (se observa el contenedor), banda que se tensa y nota que se mece con el ratón */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Índices para los retrasos escalonados (en la mampara, todas las reseñas de un paño comparten índice) */
  document.querySelectorAll('.oc-diplomas').forEach(function(l){ Array.prototype.forEach.call(l.children, function(h, i){ h.style.setProperty('--i', i); }); });
  document.querySelectorAll('.oc-panos').forEach(function(l){ Array.prototype.forEach.call(l.children, function(p, i){ p.querySelectorAll('.oc-resena').forEach(function(r){ r.style.setProperty('--i', i); }); }); });

  function observar(sel, opciones){
    var els = document.querySelectorAll(sel);
    if (!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('visto'); }); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); io.unobserve(e.target); } }); }, opciones);
    els.forEach(function(e){ io.observe(e); });
  }
  observar('.oc-esterillas', {threshold:.6});
  observar('.oc-nevera, .oc-diplomas, .oc-vidrio', {rootMargin:'0px 0px -12% 0px'});
  observar('.oc-escalera > li', {threshold:.6});

  if (!raton || reducido) return;
  /* Banda: se tensa hacia el cursor (hasta 1,05), estirando desde el lado contrario */
  document.querySelectorAll('.oc-esterilla').forEach(function(es){
    var b = es.querySelector('.oc-banda-in'); if (!b) return;
    var pend = null;
    es.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse' || pend) return;
      pend = requestAnimationFrame(function(){
        pend = null;
        var r = b.getBoundingClientRect(), c = r.left + r.width / 2, d = (e.clientX - c) / (r.width / 2);
        d = Math.max(-1, Math.min(1, d));
        b.style.setProperty('--oc-tira-desde', d < 0 ? '100%' : '0%');
        b.style.scale = (1 + Math.abs(d) * .05).toFixed(3) + ' 1';
      });
    });
    es.addEventListener('pointerleave', function(){ b.style.scale = '1 1'; });
  });
  /* Nota de la nevera: se mece ±1,5° hacia el lado del cursor */
  document.querySelectorAll('.oc-nevera').forEach(function(nv){
    var n = nv.querySelector('.oc-nota-sitio'); if (!n) return;
    nv.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = nv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5;
      n.style.setProperty('--oc-mece', (x * 3).toFixed(2) + 'deg');
    });
    nv.addEventListener('pointerleave', function(){ n.style.setProperty('--oc-mece', '0deg'); });
  });
})();
