/* Visor de fotos (<dialog> nativo). Delegado en document: vale para los botones [data-visor] y para quien llame a
   window.abrirVisor(src, pie) (las polaroids de la mesa, js/mesa.js). La <img> se crea al abrir. */
(function(){
  'use strict';
  var visor = document.getElementById('visor');
  if (!visor || !visor.showModal) return;
  var caja = document.getElementById('visorFoto'), pie = document.getElementById('visorPie'), origen = null;
  window.abrirVisor = function(src, texto, desde){
    caja.textContent = '';
    var img = document.createElement('img');
    img.src = src; img.alt = texto; img.decoding = 'async';
    caja.appendChild(img);
    pie.textContent = texto;
    origen = desde || document.activeElement;
    visor.showModal();
  };
  document.addEventListener('click', function(e){
    var b = e.target.closest ? e.target.closest('[data-visor]') : null;
    if (b) window.abrirVisor(b.dataset.grande, b.dataset.pie, b);
  });
  visor.addEventListener('click', function(e){ if (e.target === visor || e.target.closest('.visor-cerrar')) visor.close(); });
  visor.addEventListener('close', function(){ if (origen && origen.focus) origen.focus(); });
})();
