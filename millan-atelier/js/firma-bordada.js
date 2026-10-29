/* M106 firma-bordada v1 (Millán Atelier v2, 2026-10-26; la versión genérica está en 01-Libreria-de-Codigo/componentes/firma-bordada.html).
   Una aguja borda la firma puntada a puntada: la forma real del logo (relleno de raso, <use href="#fb-forma">) se descubre con una
   máscara de trazos que siguen su línea central (sacada con 03-assets/trabajo/firma-bordada/trazar-firma.py). El avance va a saltos de
   una puntada (PUNTADA unidades del viewBox) y la aguja se hunde en cada una. Al terminar, el forro se abre (transform) y la firma
   baja a su sitio, junto a la foto. Una vez por visita (sessionStorage; el <head> pone html.fb-vista para que no parpadee).
   Con movimiento reducido o sin JS: firma y foto directamente. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raices = document.querySelectorAll('[data-fb]');
  var DURACION = 2800, SALTO = 90, PUNTADA = 16, PAUSA = 320;
  raices.forEach(function(raiz){
    var CLAVE = 'firma-bordada:' + (raiz.id || location.pathname);
    var ya = document.documentElement.classList.contains('fb-vista');
    try { if (sessionStorage.getItem(CLAVE)) ya = true; } catch (e) {}
    if (reducido || ya){ raiz.classList.add('fb-abierta', 'fb-sin-anim'); return; }

    var svg = raiz.querySelector('.fb-firma'), escena = raiz.querySelector('.fb-escena'), aguja = raiz.querySelector('.fb-aguja');
    var vb = svg.viewBox.baseVal, trazos = [].slice.call(raiz.querySelectorAll('.fb-trazos path'));
    var largos = trazos.map(function(p){ var l = p.getTotalLength(); p.style.strokeDasharray = l + ' ' + (l + 1); p.style.strokeDashoffset = l; return l; });
    var total = largos.reduce(function(a, b){ return a + b; }, 0);
    var t0 = 0, ultimaPuntada = -1, hundida = 0, empezado = false;

    function aPantalla(pt){
      var f = svg.getBoundingClientRect(), e = escena.getBoundingClientRect();
      return {x:f.left - e.left + (pt.x - vb.x) / vb.width * f.width, y:f.top - e.top + (pt.y - vb.y) / vb.height * f.height};
    }
    function paso(ahora){
      var t = ahora - t0, saltos = 0, i, hecho = 0;
      // tiempo repartido por largo; cada cambio de trazo es un salto de aguja sin bordar
      var tiempoLargo = Math.max(0, t), resto = tiempoLargo, actual = -1, local = 0;
      for (i = 0; i < trazos.length; i++){
        var dur = largos[i] / total * DURACION;
        if (resto <= dur){ actual = i; local = largos[i] * resto / dur; break; }
        resto -= dur + SALTO; saltos++;
        if (resto < 0){ actual = i + 1; local = 0; break; }
      }
      if (actual === -1 || actual >= trazos.length){ terminar(); return; }
      var q = Math.floor(local / PUNTADA) * PUNTADA;
      for (i = 0; i < trazos.length; i++) trazos[i].style.strokeDashoffset = i < actual ? 0 : i > actual ? largos[i] : largos[i] - q;
      var n = actual * 1000 + q;
      if (n !== ultimaPuntada){ ultimaPuntada = n; hundida = ahora; }
      var pt = aPantalla(trazos[actual].getPointAtLength(q)), d = Math.max(0, 1 - (ahora - hundida) / 130) * 7;
      aguja.style.translate = (pt.x - 1.5 - d * .53).toFixed(1) + 'px ' + (pt.y - 15 + d * .85).toFixed(1) + 'px';
      requestAnimationFrame(paso);
    }
    function terminar(){
      trazos.forEach(function(p){ p.style.strokeDashoffset = 0; });
      raiz.classList.remove('fb-cosiendo');
      setTimeout(function(){ raiz.classList.add('fb-abierta'); try { sessionStorage.setItem(CLAVE, '1'); } catch (e) {} }, PAUSA);
    }
    function empezar(){
      if (empezado) return; empezado = true;
      var pt = aPantalla(trazos[0].getPointAtLength(0));
      aguja.style.translate = (pt.x - 1.5) + 'px ' + (pt.y - 15) + 'px';
      raiz.classList.add('fb-cosiendo');
      setTimeout(function(){ t0 = performance.now(); requestAnimationFrame(paso); }, 250);
    }
    if ('IntersectionObserver' in window){
      var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); setTimeout(empezar, 300); } }, {threshold:.35});
      io.observe(escena);
    } else empezar();
  });
})();
