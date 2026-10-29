/* cartel-abierto-cerrado v6 (.rollup, «roll-up de cita previa»), adaptado de la librería (Clínica César Navarro / UNO movimiento,
   2026-10-27). La lógica del horario es la misma (HORARIO y estado() viven en js/sitio.js como window.HorarioCN, porque también los
   usan la tarjeta viva de la portada y «Pide tu cita»). Aquí: pintar el roll-up y desplegarlo al verse, una vez. */
(function(){
  var ru = document.getElementById('rollup'); if (!ru || !window.HorarioCN) return;
  function set(el, v){ if (el && el.textContent !== v) el.textContent = v; }
  var pal = ru.querySelector('.ru-palabra'), det = ru.querySelector('.ru-det');
  function pintar(){
    var x = HorarioCN.texto();
    ru.setAttribute('data-estado', x.estado);
    set(pal, x.palabra); set(det, x.detalle);
    var jr = x.e.abierto ? x.e.jornada : x.t.d;
    Array.prototype.forEach.call(ru.querySelectorAll('tr[data-dow]'), function(tr){
      var si = +tr.getAttribute('data-dow') === jr; tr.classList.toggle('hoy', si);
      var o = tr.querySelector('th .ru-oculto'); if (o) o.textContent = si ? ', hoy' : '';
    });
  }
  pintar(); setInterval(pintar, 30000);
  /* Se despliega al verse al 50 %, una vez; la barra sube la altura medida de la banderola */
  function medir(){ ru.style.setProperty('--ru-alto', ru.querySelector('.ru-tela').offsetHeight + 'px'); }
  medir();
  if (!('IntersectionObserver' in window)){ ru.classList.add('visto'); return; }
  var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ medir(); ru.classList.add('visto'); io.disconnect(); } }, {threshold:.5});
  io.observe(ru);
})();
