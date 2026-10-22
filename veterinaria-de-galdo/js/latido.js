/* Electrocardiograma con latido (M49, componentes/electro-latido.html). La línea se dibuja una vez al entrar en
   pantalla; el punto y el corazón laten en bucle y se pausan fuera de pantalla. El botón de llamar no depende de esto. */
(function(){
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-ecg]'), function(sec){
    var monitor = sec.querySelector('.ecg-monitor');
    new IntersectionObserver(function(ents){
      var e = ents[0];
      sec.classList.toggle('en-latido', e.isIntersecting);
      if (e.isIntersecting) sec.classList.add('dibujada');
    }, {threshold:.3}).observe(monitor);
  });
})();
