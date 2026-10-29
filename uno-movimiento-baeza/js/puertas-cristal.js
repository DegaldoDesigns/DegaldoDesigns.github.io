/* puertas-cristal (M119) v1.2, copia de la librería (Clínica César Navarro / UNO movimiento, 2026-10-27). */
/* puertas-cristal (M119) · v1.2 */
(function(){
  function elegir(pc, k, auto){
    var d = pc._pc; if (!d || k < 0 || k >= d.tabs.length) return;
    d.tabs.forEach(function(t, i){
      var si = i === k;
      t.setAttribute('aria-selected', si ? 'true' : 'false');
      t.tabIndex = si ? 0 : -1;
      t.parentNode.classList.toggle('pc-abierta', si);
      var p = d.paneles[i]; if (!p) return;
      p.classList.toggle('pc-sel', si);
      p.inert = !si;
    });
    pc.classList.add('pc-elegida');
    if (!auto) d.elegida = true;
    pc.dispatchEvent(new CustomEvent('pc:cambio', { bubbles:true, detail:{ indice:k, puerta:d.tabs[k], panel:d.paneles[k], auto:!!auto } }));
  }

  function montar(pc){
    var lista = pc.querySelector('.pc-puertas');
    var tabs = [].slice.call(lista.querySelectorAll(':scope > .pc-puerta > .pc-boton'));
    var paneles = tabs.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); });
    var d = pc._pc = { tabs:tabs, paneles:paneles, elegida:false };
    pc.style.setProperty('--pc-n', tabs.length);
    lista.setAttribute('role', 'tablist');
    var inicial = -1;
    tabs.forEach(function(t, k){
      t.disabled = false; t.setAttribute('role', 'tab'); t.parentNode.setAttribute('role', 'none');
      if (t.getAttribute('aria-selected') === 'true' && inicial < 0) inicial = k;
      t.setAttribute('aria-selected', 'false'); t.tabIndex = -1;
      t.addEventListener('click', function(){ elegir(pc, k); });
    });
    paneles.forEach(function(p, k){ if (!p) return; p.setAttribute('role', 'tabpanel'); p.tabIndex = 0; p.inert = true;
      if (!p.hasAttribute('aria-labelledby')) p.setAttribute('aria-labelledby', tabs[k].getAttribute('aria-labelledby') || tabs[k].id); });
    if (inicial >= 0){ elegir(pc, inicial); }
    else if (tabs[0]) tabs[0].tabIndex = 0;
    lista.addEventListener('keydown', function(e){
      var k = tabs.indexOf(document.activeElement); if (k < 0) return;
      var n = tabs.length, j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (k + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (k - 1 + n) % n;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j === null) return;
      e.preventDefault(); tabs[j].focus(); elegir(pc, j);
    });
    /* Transiciones solo después del primer pintado (si no, el estado inicial se animaría al cargar) */
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ pc.classList.add('pc-listo'); }); });
    /* Apertura automática, una vez */
    if (pc.hasAttribute('data-pc-auto') && inicial < 0 && 'IntersectionObserver' in window){
      var cual = parseInt(pc.getAttribute('data-pc-auto'), 10); if (isNaN(cual)) cual = 0;
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){
          var vista = e.isIntersecting && (e.intersectionRatio >= .6 || e.intersectionRect.height >= innerHeight * .6);
          if (!vista) return;
          io.disconnect();
          if (!d.elegida && !pc.classList.contains('pc-elegida')) elegir(pc, cual, true);
        });
      }, { threshold:[0, .3, .6, .8, 1] });
      io.observe(pc);
    }
  }

  function abrir(el, i){
    if (el._pc) return elegir(el, i);
    [].slice.call(el.querySelectorAll(':scope > .pc-puerta')).forEach(function(p, k){ p.classList.toggle('pc-abierta', k === i); });
  }

  document.querySelectorAll('.pc[data-pc]').forEach(montar);
  window.PuertasCristal = { abrir:abrir };
})();
