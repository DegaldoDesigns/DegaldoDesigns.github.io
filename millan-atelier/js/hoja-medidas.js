/* M111 hoja-medidas v1 (Millán Atelier v2, 2026-10-26; la versión genérica está en 01-Libreria-de-Codigo/componentes/hoja-medidas.html).
   El horario escrito como la hoja de medidas de un sastre: marca la fila de hoy (un círculo a lápiz que se dibuja), escribe el estado
   en vivo en cada [data-hm-estado] y pone data-estado="abierto|cerrado" en ellos y en la .hm. Hora de la zona del negocio (Intl).
   Los festivos no se calculan: fuera de horario se dice cuándo se abre, nunca "hoy no hay servicio".
   El horario va en data-hm-horario de la hoja: {"zona":"Europe/Madrid","dias":{"1":[[600,810],[1080,1200]],...}} (0 = domingo;
   tramos [apertura, cierre] en minutos; el mismo formato que anillo-horario). */
(function(){
  var fuente = document.querySelector('[data-hm-horario]'), cfg = {};
  try { cfg = JSON.parse(fuente.getAttribute('data-hm-horario')); } catch (e) { return; }
  var HORARIO = cfg.dias || {}, ZONA = cfg.zona || 'Europe/Madrid', DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  function ahora(){
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', {timeZone:ZONA, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[p.weekday], min:(+p.hour % 24) * 60 + (+p.minute)};
    } catch (e){ var f = new Date(); return {d:f.getDay(), min:f.getHours() * 60 + f.getMinutes()}; }
  }
  function hora(m){ return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function art(m){ return (Math.floor(m / 60) === 1 ? 'la ' : 'las ') + hora(m); }
  function estado(t){
    var hoy = HORARIO[t.d] || [], i, k;
    for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {abierto:true, cierra:hoy[i][1]};
    for (k = 0; k < 8; k++){ var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.min > 0) return {abierto:false, k:k, dia:dia, abre:tr[i][0]}; }
    return {abierto:false, k:-1};
  }
  function poner(el, sel, v){ var n = el.querySelector(sel); if (n && n.textContent !== v) n.textContent = v; }

  var hojas = document.querySelectorAll('[data-hm]'), lineas = document.querySelectorAll('[data-hm-estado]');
  function pintar(){
    var t = ahora(), e = estado(t), clave = e.abierto ? 'abierto' : 'cerrado';
    var detalle = e.abierto ? 'hasta ' + art(e.cierra)
      : e.k < 0 ? 'consulta el horario'
      : (e.k === 0 ? 'abrimos hoy ' : e.k === 1 ? 'abrimos mañana ' : 'abrimos el ' + DIA[e.dia] + ' ') + 'a ' + art(e.abre);
    lineas.forEach(function(l){ l.setAttribute('data-estado', clave); poner(l, '.hm-palabra', e.abierto ? 'Abierto,' : 'Cerrado,'); poner(l, '.hm-detalle', detalle); });
    hojas.forEach(function(h){
      h.setAttribute('data-estado', clave);
      h.querySelectorAll('[data-dia]').forEach(function(f){
        var es = +f.getAttribute('data-dia') === t.d, et = f.querySelector('.hm-hoy-et');
        f.classList.toggle('hoy', es);
        if (es && !et){ et = document.createElement('span'); et.className = 'hm-hoy-et'; et.setAttribute('aria-hidden', 'true'); et.textContent = 'hoy'; f.appendChild(et);
          var s = f.querySelector('dt'); if (s && !s.querySelector('.sr')){ var r = document.createElement('span'); r.className = 'sr'; r.textContent = ' (hoy)'; s.appendChild(r); } }
        if (!es){ if (et) et.remove(); var sr = f.querySelector('dt .sr'); if (sr) sr.remove(); }
      });
    });
  }
  pintar(); setInterval(pintar, 30000);

  /* el círculo a lápiz de "hoy" se dibuja al verse la hoja */
  if ('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('visto'); io.unobserve(en.target); } }); }, {threshold:.35});
    hojas.forEach(function(h){ io.observe(h); });
  } else hojas.forEach(function(h){ h.classList.add('visto'); });
})();
