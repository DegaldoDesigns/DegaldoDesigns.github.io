/* Gimnasio Energy · demo de Degaldo Designs, v2 (2026-10-27). Parte CRÍTICA (cabecera, menú, electrón de la barra, letra de rotulador,
   rueda tras el encendido, brillo del logo y la carga del resto). Lo demás, en sitio-resto.js. Piezas de la librería adaptadas (cada bloque dice de cuál).
   Aparte, copias de la librería: luces-sala.js (M81 v3), rueda-scroll.js (M114, se carga aquí tras el encendido), atomo-orbitas.js (M113),
   anillo-horario.js (M86), tablon.js (tablon-recepcion v1.1), consola-estado.js (M116), objetos-gimnasio.js (M117). */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;

  /* ---- cabecera-inteligente (M18): pegada + se esconde al bajar ---- */
  var cab = document.getElementById('cabecera');
  if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && conIO){
    new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(document.querySelector('.centinela'));
  }
  /* (Energy) el logo de la cabecera se oculta mientras se ve el grande de la portada: nunca dos logos a la vez */
  var logoP = document.querySelector('.logo-portada');
  if (logoP && conIO) new IntersectionObserver(function(e){ cab.classList.toggle('logo-en-portada', e[0].isIntersecting); }, {rootMargin:'-68px 0px 0px 0px'}).observe(logoP);
  var ultimo = scrollY, pend = false, menu = document.getElementById('menu');
  addEventListener('scroll', function(){
    if (pend) return; pend = true;
    requestAnimationFrame(function(){
      pend = false;
      var y = scrollY, d = y - ultimo;
      if (Math.abs(d) < 8) return;
      if (y < 120 || d < 0 || (menu && menu.matches(':popover-open'))) cab.classList.remove('oculta'); else cab.classList.add('oculta');
      ultimo = y;
    });
  }, {passive:true});

  /* ---- menu-escalonado (M52): menú móvil en círculo desde el botón ---- */
  var hamb = document.querySelector('.hamb');
  if (menu && hamb && menu.showPopover){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){
      var abierto = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      if (!abierto) hamb.focus();
    });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* ---- resaltado-deslizante v3 (.rd-punto): un electrón bajo el enlace de la sección activa ---- */
  var nav = document.querySelector('.nav'), punto = nav && nav.querySelector('.nav-electron');
  if (nav && punto){
    var enlaces = [].slice.call(nav.querySelectorAll('a')), activo = null;
    var ir = function(a, sin){
      if (!a || !a.offsetWidth){ punto.classList.remove('listo'); return; }
      var saltar = sin || reducido || !punto.classList.contains('listo');
      if (saltar) punto.style.transition = 'none';
      punto.style.translate = (a.offsetLeft + a.offsetWidth / 2 - punto.offsetWidth / 2).toFixed(1) + 'px 0';
      if (saltar){ void punto.offsetWidth; punto.style.transition = ''; }
      punto.classList.add('listo');
    };
    var marcar = function(id){
      enlaces.forEach(function(a){ var si = a.getAttribute('href') === '#' + id; a.classList.toggle('activo', si); if (si) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      activo = nav.querySelector('a.activo'); ir(activo);
    };
    if (conIO){
      var visibles = {};
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ visibles[e.target.id] = e.isIntersecting; });
        var id = null; enlaces.forEach(function(a){ var k = a.getAttribute('href').slice(1); if (visibles[k] && !id) id = k; });
        marcar(id);
      }, {rootMargin:'-45% 0px -50% 0px'});
      enlaces.forEach(function(a){ var s = document.getElementById(a.getAttribute('href').slice(1)); if (s) io.observe(s); });
    }
    if (raton){
      enlaces.forEach(function(a){ a.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') ir(a); }); });
      nav.addEventListener('pointerleave', function(){ ir(activo); });
    }
    nav.addEventListener('focusin', function(e){ if (e.target.matches('a')) ir(e.target); });
    nav.addEventListener('focusout', function(){ ir(activo); });
    new ResizeObserver(function(){ ir(activo, true); }).observe(nav);
  }

  /* ---- Letra de rotulador (Sedgwick Ave): solo se usa de la portada para abajo; se pide junto con el resto (tras pintar la portada) para no quitarle
     ancho de banda a la foto de portada (LCP). Sin JS se queda la letra a mano del sistema. ---- */
  function mano(){ document.documentElement.classList.add('mano'); }

  /* ---- Portada: la rueda de la bici (M114) empieza cuando termina el encendido (M81 v3, evento luces:fin) ---- */
  (function(){
    var sala = document.querySelector('.luces-sala');
    function cargar(){ if (document.querySelector('script[data-rueda]')) return; var sc = document.createElement('script'); sc.src = 'js/rueda-scroll.js'; sc.setAttribute('data-rueda', ''); document.body.appendChild(sc); }
    if (sala && window.LucesSala) LucesSala.cuando(sala, cargar); else cargar();
  })();

  /* ---- borde-animado v2.2 (.brillo-rasante): luz rasante una vez por visita sobre el logo cromado; data-br-retraso ---- */
  if (!reducido) document.querySelectorAll('.brillo-rasante').forEach(function(el, i){
    var clave = 'brillo:' + (el.id || location.pathname + ':' + i), una = el.getAttribute('data-una-vez') === 'sesion';
    if (una){ try{ if (sessionStorage.getItem(clave)) return; }catch(e){} }
    var img = el.querySelector('img'), luz = document.createElement('span'), haz = document.createElement('i');
    luz.className = 'br-luz'; luz.setAttribute('aria-hidden', 'true'); luz.appendChild(haz);
    if (!getComputedStyle(el).getPropertyValue('--br-mascara').trim() && img) luz.style.setProperty('--br-mascara', 'url("' + img.src + '")');
    el.appendChild(luz);
    function medir(){ var w = el.offsetWidth, h = el.offsetHeight, a = (parseFloat(getComputedStyle(el).getPropertyValue('--br-angulo')) || 20) * Math.PI / 180;
      if (w){ var hx = .25 * w * Math.cos(a) + 1.1 * h * Math.sin(a);
        el.style.setProperty('--br-desde', Math.round(-.25 * w - hx) + 'px'); el.style.setProperty('--br-hasta', Math.round(.75 * w + hx) + 'px'); } }
    haz.addEventListener('transitionend', function(){ el.classList.add('br-hecho'); });
    var retraso = +el.getAttribute('data-br-retraso') || 0;
    function pasa(){
      setTimeout(function(){ medir(); requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('br-pasa'); }); }); }, retraso);
      if (una){ try{ sessionStorage.setItem(clave, '1'); }catch(e){} }
    }
    if (el.getAttribute('data-brillo') === 'carga'){ if (!img || img.complete) pasa(); else img.addEventListener('load', pasa, {once:true}); }
    else if (conIO){ var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ io.disconnect(); pasa(); } }, {threshold:.6}); io.observe(el); }
    else pasa();
  });

  /* ---- Lo que no hace falta para la primera pantalla se carga después del evento load, cuando el navegador está libre:
     así no le quita ancho de banda ni CPU a la foto de portada (LCP). async=false: se ejecutan en este orden (tablon.js el último,
     para que sitio-resto.js ya escuche tablon:listo). ---- */
  function cargarResto(){
    ['js/atomo-orbitas.js', 'js/objetos-gimnasio.js', 'js/consola-estado.js', 'js/sitio-resto.js', 'js/tablon.js', 'js/hilo-luz.js'].forEach(function(src){
      var sc = document.createElement('script'); sc.src = src; sc.async = false; document.body.appendChild(sc);
    });
  }
  /* Esperar a que la foto de portada esté pintada (entrada largest-contentful-paint) y a la carga; con un tope de 2,5 s */
  var hecho = false;
  function ya(){ if (hecho) return; hecho = true; mano(); if ('requestIdleCallback' in window) requestIdleCallback(cargarResto, {timeout:800}); else setTimeout(cargarResto, 100); }
  /* El resto de estilos, en cuanto la portada está pintada (sin esperar a la carga): la primera pantalla solo necesita critico.css */
  var conEstilos = false;
  function listos(){
    var h = document.documentElement; if (h.classList.contains('estilos')) return; h.classList.add('estilos');
    var id = decodeURIComponent(location.hash.slice(1)), dest = id && document.getElementById(id);   // si se entró con #karate, ir allí ahora que existe
    if (dest && dest.id !== 'inicio'){
      var tocado = false, marca = function(){ tocado = true; };
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function(g){ addEventListener(g, marca, {once:true, passive:true}); });
      var ir = function(){ if (!tocado) dest.scrollIntoView({behavior:'instant'}); };
      ir(); setTimeout(ir, 900); setTimeout(ir, 2200);   // otra vez cuando el átomo y las fotos ya tienen su alto
    }
  }
  function estilos(){ if (conEstilos) return; conEstilos = true; var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/estilos.css';
    l.onload = l.onerror = listos; setTimeout(listos, 4000); document.head.appendChild(l); }
  var pintada = false, cargada = document.readyState === 'complete';
  function mirar(){ if (pintada) estilos(); if (pintada && cargada) setTimeout(ya, 250); }
  try{ new PerformanceObserver(function(){ if (!pintada){ pintada = true; mirar(); } }).observe({type:'largest-contentful-paint', buffered:true}); }catch(e){ pintada = true; }
  if (!cargada) addEventListener('load', function(){ cargada = true; mirar(); });
  mirar();
  setTimeout(function(){ estilos(); ya(); }, 2500);
  addEventListener('scroll', estilos, {once:true, passive:true});
})();
