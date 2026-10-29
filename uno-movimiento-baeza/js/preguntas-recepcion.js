/* Preguntas como recepción (M123) v1. Código propio. */
(function(){
  var reducido = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:false};

  function iniciar(raiz){
    if (!raiz || raiz.pq) return;
    var btns = [].slice.call(raiz.querySelectorAll('.pq-btn'));
    var resps = btns.map(function(b){ return document.getElementById(b.getAttribute('aria-controls')); });
    var abierta = -1, visto = false, tLlega = 0, tLuz = 0;

    function luz(){
      if (reducido.matches) return;
      clearTimeout(tLuz); raiz.classList.add('pq-luz');
      tLuz = setTimeout(function(){ raiz.classList.remove('pq-luz'); }, 240);
    }
    function llegar(i, espera){
      var r = resps[i]; clearTimeout(tLlega);
      if (reducido.matches){ r.classList.add('pq-llegada'); return; }
      void r.offsetWidth;                                   // fija el punto de partida (en móvil acaba de dejar de ser display:none)
      tLlega = setTimeout(function(){ requestAnimationFrame(function(){
        if (abierta === i){ r.classList.add('pq-llegada'); luz(); }
      }); }, espera);
    }
    function abrir(i, inicio){
      var antes = abierta, b = inicio ? null : btns[i], arriba = b ? b.getBoundingClientRect().top : 0;
      if (i < 0 || i >= btns.length) i = -1;
      btns.forEach(function(x, k){
        var on = k === i;
        x.setAttribute('aria-expanded', on ? 'true' : 'false');
        resps[k].classList.toggle('pq-abierta', on);
        if (!on) resps[k].classList.remove('pq-llegada');
      });
      abierta = i; raiz.classList.toggle('pq-vacio', i < 0);
      if (b){ var d = b.getBoundingClientRect().top - arriba; if (Math.abs(d) > 1) window.scrollBy(0, d); }   // la pregunta no se mueve bajo el dedo
      if (i >= 0 && visto) llegar(i, antes >= 0 && !reducido.matches ? 140 : 0);
      raiz.dispatchEvent(new CustomEvent('pq:cambio', {detail:{indice:i}}));
    }

    raiz.style.setProperty('--pq-n', btns.length);
    raiz.classList.add('pq-listo');
    btns.forEach(function(b, k){
      b.addEventListener('click', function(){ var cerrar = abierta === k; abrir(cerrar ? -1 : k); });
      b.addEventListener('keydown', function(e){
        var n = btns.length, j = {ArrowDown:(k + 1) % n, ArrowUp:(k - 1 + n) % n, Home:0, End:n - 1}[e.key];
        if (j === undefined) return; e.preventDefault(); btns[j].focus();
      });
    });
    raiz.pq = {abrir:abrir};

    var inicial = parseInt(raiz.getAttribute('data-pq-abierta') || '0', 10);
    if ('IntersectionObserver' in window && !reducido.matches){
      abrir(isNaN(inicial) ? 0 : inicial, true);
      var io = new IntersectionObserver(function(es){
        if (!es[0].isIntersecting) return;
        visto = true; io.disconnect();
        if (abierta >= 0) llegar(abierta, 0);
      }, {threshold:.35});
      io.observe(raiz);
    } else {
      visto = true; abrir(isNaN(inicial) ? 0 : inicial, true);
    }
  }

  window.PreguntasRecepcion = {
    iniciar:iniciar,
    abrir:function(el, i){ iniciar(el); el.pq.abrir(i); }
  };
  function todo(){ [].forEach.call(document.querySelectorAll('[data-pq]'), iniciar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todo); else todo();
})();
