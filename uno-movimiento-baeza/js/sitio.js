/* Clínica César Navarro / UNO movimiento · demo de Degaldo Designs (2026-10-27). Parte CRÍTICA: cabecera, menú, el ▶ de la barra,
   el horario (lógica de cartel-abierto-cerrado v6, compartida con el roll-up y «Pide tu cita») y la tarjeta viva de la portada.
   Lo demás lo carga js/carga.js (plantilla carga-tras-portada) cuando la foto de portada ya está pintada. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;

  /* ---- Horario (cartel-abierto-cerrado v3/v6): de lunes a viernes de 8:00 a 21:00 (Google Maps e Instagram, 2024-12).
     CAMBIAR AQUÍ y en el JSON-LD, el roll-up, la tarjeta viva (HTML), «Pide tu cita», la nevera, Ubicación, el pie y las preguntas.
     Los festivos no se calculan: nunca se dice "hoy no hay servicio". ---- */
  var ZONA = 'Europe/Madrid';
  var HORARIO = { 1:[[480, 1260]], 2:[[480, 1260]], 3:[[480, 1260]], 4:[[480, 1260]], 5:[[480, 1260]] };
  var NOMBRE_DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function ahora(){
    try{
      var o = {};
      new Intl.DateTimeFormat('en-US',{timeZone:ZONA,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour)*60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours()*60 + n.getMinutes()}; }
  }
  function estado(t){
    var hoy = HORARIO[t.d] || [], i;
    for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {abierto:true, jornada:t.d, cierra:hoy[i][1], falta:hoy[i][1] - t.min};
    for (var k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++){ var f = k*1440 + tr[i][0] - t.min; if (f > 0) return {abierto:false, k:k, dia:dia, abre:tr[i][0], falta:f}; }
    }
    return {abierto:false, k:-1};
  }
  function hc(m){ m = m % 1440; return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }       /* horas sin cero delante: 8:00 */
  function ac(m){ return (Math.floor((m % 1440) / 60) === 1 ? 'la ' : 'las ') + hc(m); }
  /* {palabra, detalle}: «Abierto · hasta las 21:00», «Cerrado · abrimos mañana a las 8:00», «Cerrado · abrimos el lunes a las 8:00» */
  function texto(t){
    t = t || ahora(); var e = estado(t);
    return {estado: e.abierto ? 'abierto' : 'cerrado', e:e, t:t, palabra: e.abierto ? 'Abierto' : 'Cerrado',
      detalle: e.abierto ? 'hasta ' + ac(e.cierra) : e.k >= 0 ? 'abrimos ' + (e.k === 0 ? 'hoy' : e.k === 1 && t.min >= 360 ? 'mañana' : 'el ' + NOMBRE_DIA[e.dia]) + ' a ' + ac(e.abre) : 'consulta el horario'};
  }
  window.HorarioCN = {ahora:ahora, estado:estado, texto:texto, nombreDia:NOMBRE_DIA};

  /* ---- Tarjeta viva de la portada: escribe el estado cuando el ▶ termina su vuelta (marco:listo), o a los 1,6 s ---- */
  var tv = document.getElementById('tarjetaViva');
  if (tv){
    var pal = tv.querySelector('.tv-palabra'), det = tv.querySelector('.tv-det'), puesta = false;
    var pintarTv = function(){
      var x = texto(); tv.setAttribute('data-estado', x.estado);
      if (pal.textContent !== x.palabra) pal.textContent = x.palabra;
      if (det.textContent !== x.detalle) det.textContent = x.detalle;
    };
    var arrancarTv = function(){ if (puesta) return; puesta = true; pintarTv(); setInterval(pintarTv, 30000); };
    var marco = document.querySelector('.portada .mr');
    if (marco) marco.addEventListener('marco:listo', arrancarTv, {once:true});
    setTimeout(arrancarTv, 1600);
  }

  /* ---- cabecera-inteligente (M18): pegada + se esconde al bajar ---- */
  var cab = document.getElementById('cabecera');
  if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && conIO){
    new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(document.querySelector('.centinela'));
  }
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

  /* ---- resaltado-deslizante v3.1 (.rd-punto .rd-play): el ▶ del logo viaja bajo el enlace de la sección que se ve ---- */
  var nav = document.querySelector('.nav'), punto = nav && nav.querySelector('.rd-pto');
  if (nav && punto){
    var enlaces = [].slice.call(nav.querySelectorAll('a')), activo = null;
    var ir = function(a, sin){
      if (!a || !a.offsetWidth){ punto.classList.remove('listo'); return; }
      var saltar = sin || reducido || !punto.classList.contains('listo');
      if (saltar) punto.style.transition = 'none';
      punto.style.translate = (a.offsetLeft + a.offsetWidth / 2 - punto.offsetWidth / 2).toFixed(1) + 'px ' + (a.offsetTop + a.offsetHeight + 4 - punto.offsetTop).toFixed(1) + 'px';
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
})();
