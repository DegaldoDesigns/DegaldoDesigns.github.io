/* M107 probador-ocasion v1 (Millán Atelier v2, 2026-10-26; versión genérica en 01-Libreria-de-Codigo/componentes/probador-ocasion.html).
   Botones con aria-pressed (uno por ocasión) que visten el maniquí: la silueta que sale se borra (stroke-dashoffset a 1) y la que entra
   se dibuja trazo a trazo (pathLength="1", --k escalonado); al lado se muestra el panel de piezas de esa ocasión. Sin JS: todas las
   listas visibles y el maniquí con la primera silueta. Flechas izquierda/derecha para moverse entre botones. */
(function(){
  document.querySelectorAll('[data-po]').forEach(function(po){
    var botones = [].slice.call(po.querySelectorAll('.po-btn')), siluetas = po.querySelectorAll('.po-silueta'), paneles = po.querySelectorAll('.po-panel');
    siluetas.forEach(function(g){ [].forEach.call(g.querySelectorAll('path'), function(p, k){ p.style.setProperty('--k', k); }); });
    var visto = !('IntersectionObserver' in window), actual = '';
    function elegir(nombre, conFoco){
      actual = nombre;
      botones.forEach(function(b){ var si = b.getAttribute('data-ocasion') === nombre; b.setAttribute('aria-pressed', String(si)); if (si && conFoco) b.focus(); });
      if (visto) siluetas.forEach(function(g){ g.classList.toggle('activa', g.getAttribute('data-ocasion') === nombre); });
      paneles.forEach(function(p){ var si = p.getAttribute('data-ocasion') === nombre; p.hidden = !si; p.classList.toggle('entra', si); });
    }
    po.classList.add('po-listo');
    var inicial = (botones.filter(function(b){ return b.getAttribute('aria-pressed') === 'true'; })[0] || botones[0]).getAttribute('data-ocasion');
    elegir(inicial);
    if (!visto){ var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); visto = true; elegir(actual); } }, {threshold:.3}); io.observe(po.querySelector('.po-maniqui')); }
    botones.forEach(function(b, i){
      b.addEventListener('click', function(){ if (b.getAttribute('aria-pressed') !== 'true') elegir(b.getAttribute('data-ocasion')); });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!d) return; e.preventDefault();
        elegir(botones[(i + d + botones.length) % botones.length].getAttribute('data-ocasion'), true);
      });
    });
  });
})();
