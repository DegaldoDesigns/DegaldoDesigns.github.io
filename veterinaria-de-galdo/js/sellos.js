/* Sellos de la cartilla (M69, componentes/sellos-cartilla.html). Caen al entrar la cartilla en pantalla (90 ms entre
   casillas, muelle + temblor de 2 px); al pulsar una casilla, su sello se levanta y se vuelve a estampar.
   La casilla de la despedida (.cs-calma) no tiene sello. */
(function(){
  'use strict';
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('[data-sellos]'), function(sec){
    var casillas = [].slice.call(sec.querySelectorAll('.cs-casilla')).filter(function(c){ return c.querySelector('.cs-sello'); });
    var paso = 90;
    function temblor(c, retraso){
      if (!c.animate) return;
      c.animate([{translate:'0 0'},{translate:'0 2px'},{translate:'1px -1px'},{translate:'0 0'}],
        {duration:170, delay:retraso + 70, easing:'cubic-bezier(0.23,1,0.32,1)'});
    }
    function estampa(c, retraso){ c.style.setProperty('--retraso', retraso + 'ms'); c.classList.add('puesto'); temblor(c, retraso); }
    if (reducido || !('IntersectionObserver' in window)){ casillas.forEach(function(c){ c.classList.add('puesto'); }); return; }
    var io = new IntersectionObserver(function(ents){
      if (!ents[0].isIntersecting) return;
      io.disconnect();
      casillas.forEach(function(c, i){ estampa(c, i * paso); });
    }, {threshold:.2});
    io.observe(sec.querySelector('.cs-rejilla'));
    casillas.forEach(function(c){
      c.addEventListener('click', function(e){
        if (e.target.closest('a') || !c.classList.contains('puesto')) return;
        c.classList.add('levanta'); c.classList.remove('puesto');
        void c.offsetWidth;
        c.classList.remove('levanta'); estampa(c, 0);
      });
    });
  });
})();
