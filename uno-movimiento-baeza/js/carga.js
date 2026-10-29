/* Copia de plantillas/carga-tras-portada.js (Clínica César Navarro / UNO movimiento, 2026-10-27): solo cambian ESTILOS, RESTO y MANO.
   tablon.js, el último: emite tablon:listo cuando ya escucha todo lo demás. */
/* PLANTILLA: carga tras la portada (Gimnasio Energy v2, 2026-10-27). Para webs con muchas piezas por debajo de la portada.
   En Energy, Lighthouse móvil pasó de 81-82 (LCP 4,5 s) a 96 (LCP 2,7 s, CLS 0), igual que la v1 más sencilla, con la misma medida.

   REGLA: la primera pantalla solo pide lo que pinta la primera pantalla. Todo lo demás (estilos de las secciones de abajo, scripts
   de piezas, la letra de notas) se pide cuando la foto de portada YA está pintada. Lighthouse cuenta como parte del LCP todo lo que
   empieza antes de que se pinte el LCP en su traza; pedirlo "tras el evento load" no basta (load puede llegar antes del pintado).

   CÓMO SE MONTA
   1. Parte la hoja en css/critico.css (fuentes, variables, base, botones, cabecera y menú, portada y sus efectos) y css/estilos.css
      (todo lo demás, en el mismo orden relativo). En el <head>:
        <link rel="stylesheet" href="css/critico.css">
        <noscript><link rel="stylesheet" href="css/estilos.css"></noscript>
   2. En critico.css, que lo de debajo no entre en la maqueta hasta que llegue estilos.css (sin esto, las piezas sin estilo se
      dibujan con su tamaño por defecto y al llegar la hoja se mueven: CLS 0,087 en Energy):
        .js:not(.estilos) main > :not(.portada), .js:not(.estilos) .pie, .js:not(.estilos) .barra-fija{display:none}
      (la clase .js se pone en <html> con un <script> en el <head>, como en todas nuestras webs). Y dale width/height a cada <svg>
      en línea: sin hoja, una <svg> sin tamaño ocupa 300 × 150.
   3. Este script, con defer, junto a los críticos (los que actúan en la portada). Cambia ESTILOS, RESTO y MANO.
   4. Los scripts de RESTO se ejecutan en orden (async = false): el que emite un evento va el último, para que los demás ya lo escuchen.
   Sin JS: la hoja va por <noscript> y no hay .js, así que nada se oculta.
   Un enlace que llega con #seccion: cuando aparece el contenido se va allí (y otra vez cuando las fotos y piezas ya tienen su alto),
   salvo que la persona ya haya tocado la pantalla. */
(function(){
  var ESTILOS = 'css/estilos.css';
  var RESTO = ['js/puertas-cristal.js', 'js/objetos-clinica.js', 'js/recomendador-preguntas.js', 'js/ponle-nombre.js', 'js/preguntas-recepcion.js', 'js/rollup.js', 'js/sitio-resto.js', 'js/figura-ejercicio.js', 'js/hilo-luz.js', 'js/tablon.js'];
  var MANO = 'mano';                                    // clase en <html> que activa la letra de notas (o '' si no hay)
  var raiz = document.documentElement;

  function listos(){
    if (raiz.classList.contains('estilos')) return; raiz.classList.add('estilos');
    var id = decodeURIComponent(location.hash.slice(1)), dest = id && document.getElementById(id);
    if (dest){
      var tocado = false, marca = function(){ tocado = true; };
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function(g){ addEventListener(g, marca, {once:true, passive:true}); });
      var ir = function(){ if (!tocado) dest.scrollIntoView({behavior:'instant'}); };
      ir(); setTimeout(ir, 900); setTimeout(ir, 2200);
    }
  }
  var conEstilos = false;
  function estilos(){
    if (conEstilos) return; conEstilos = true;
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = ESTILOS;
    l.onload = l.onerror = listos; setTimeout(listos, 4000);   // nunca se queda nada oculto
    document.head.appendChild(l);
  }
  function cargarResto(){
    RESTO.forEach(function(src){ var sc = document.createElement('script'); sc.src = src; sc.async = false; document.body.appendChild(sc); });
  }
  var hecho = false;
  function ya(){
    if (hecho) return; hecho = true;
    if (MANO) raiz.classList.add(MANO);
    if ('requestIdleCallback' in window) requestIdleCallback(cargarResto, {timeout:800}); else setTimeout(cargarResto, 100);
  }
  var pintada = false, cargada = document.readyState === 'complete';
  function mirar(){ if (pintada) estilos(); if (pintada && cargada) setTimeout(ya, 250); }
  try{ new PerformanceObserver(function(){ if (!pintada){ pintada = true; mirar(); } }).observe({type:'largest-contentful-paint', buffered:true}); }catch(e){ pintada = true; }
  if (!cargada) addEventListener('load', function(){ cargada = true; mirar(); });
  mirar();
  setTimeout(function(){ estilos(); ya(); }, 2500);                // tope: navegadores sin largest-contentful-paint
  addEventListener('scroll', estilos, {once:true, passive:true});  // si alguien baja enseguida, la hoja llega ya
})();
