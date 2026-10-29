/* Pub La Isla · lo propio de la web: la tarjeta viva prudente, la pizarra que se escribe a tiza, el subrayado de ola
   y las cifras de Google. Las piezas de la librería están en librerias.js. */

/* La tarjeta viva PRUDENTE (portada, horario y cierre): componentes/estado-prudente.html v1.1, nacida aquí.
   El horario no está confirmado (Instagram y Maps no coinciden), pero las dos fuentes coinciden en algo: abren a las 16:00
   y ninguna cierra antes de las 3:00. Solo se dice eso, en hora de Madrid: de 16:00 a 3:00, «Abierto · desde las 16:00
   hasta de madrugada» (punto verde); de 3:00 a 16:00, «Abrimos a las 16:00». Nunca la hora de cierre ni «cerrado».
   Un "aviso" en contenido/planes.json (Pages CMS), con "aviso_hasta" opcional (AAAA-MM-DD, incluido), manda sobre el cálculo.
   v1.1 (revisión del 2026-10-28): (1) de 0:00 a 3:00 cuenta como el día anterior al compararlo con "aviso_hasta" (la madrugada
   del día de vuelta de unas vacaciones sigue siendo vacaciones); (2) hasta que el fetch del JSON responde o falla, se queda
   el texto neutro del HTML («A partir de las 16:00»), sin punto de color: así no salta de «Abierto» al aviso. */
(function(){
  var ZONA = 'Europe/Madrid', ABRE = 16 * 60, SIGUE_HASTA = 3 * 60, aviso = null;
  var nodos = [].slice.call(document.querySelectorAll('[data-estado-vivo]'));
  if (!nodos.length) return;
  function iso(y, m, d){ var f = new Date(Date.UTC(y, m - 1, d)); return f.toISOString().slice(0, 10); }
  function ahora(){
    var d = new Date(), o = {}, y, mo, dd, min;
    try {
      new Intl.DateTimeFormat('en-CA', {timeZone:ZONA, year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(d).forEach(function(x){ o[x.type] = x.value; });
      y = +o.year; mo = +o.month; dd = +o.day; min = (+o.hour % 24) * 60 + (+o.minute);
    } catch(e){ y = d.getFullYear(); mo = d.getMonth() + 1; dd = d.getDate(); min = d.getHours() * 60 + d.getMinutes(); }
    /* fecha "de negocio": la madrugada es del día anterior */
    return {negocio:min < SIGUE_HASTA ? iso(y, mo, dd - 1) : iso(y, mo, dd), min:min};
  }
  function pintar(){
    var t = ahora(), estado, frase;
    if (aviso && (!aviso.hasta || t.negocio <= aviso.hasta)){ estado = 'aviso'; frase = aviso.texto; }
    else if (t.min >= ABRE || t.min < SIGUE_HASTA){ estado = 'abierto'; frase = 'Abierto · desde las 16:00 hasta de madrugada'; }
    else { estado = 'antes'; frase = 'Abrimos a las 16:00'; }
    nodos.forEach(function(n){
      n.setAttribute('data-estado', estado);
      var f = n.querySelector('.viva-frase'); if (f && f.textContent !== frase) f.textContent = frase;
    });
  }
  function empezar(){ pintar(); setInterval(pintar, 60000); }
  if (!window.fetch) return empezar();
  fetch('contenido/planes.json', {cache:'no-cache'}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(j){
    var txt = j && typeof j.aviso === 'string' ? j.aviso.trim() : '';
    if (txt) aviso = {texto:txt, hasta:/^\d{4}-\d{2}-\d{2}$/.test(j.aviso_hasta || '') ? j.aviso_hasta : ''};
  }).catch(function(){}).then(empezar);
})();

/* La pizarra de caballete (M105, variante): al verse, se endereza (1,5°, 300 ms) y cada línea se escribe a tiza
   (clip-path, 420 ms, 120 ms entre líneas). Se observa el CONTENEDOR, nunca la línea recortada. */
(function(){
  var cb = document.querySelector('[data-pizarra]'); if (!cb) return;
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches){ cb.classList.add('escrita'); return; }
  var io = new IntersectionObserver(function(es){ if (es[0].isIntersecting){ cb.classList.add('escrita'); io.disconnect(); } }, {threshold:.35});
  io.observe(cb);
})();

/* Subrayado de ola con rizo (M04): se pinta al ver el titular (.rev-cont recibe .pintada) */
(function(){
  var els = document.querySelectorAll('.rev-cont'); if (!els.length) return;
  if (!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('pintada'); }); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('pintada'); io.unobserve(e.target); } });
  }, {rootMargin:'0px 0px -12% 0px'});
  els.forEach(function(e){ io.observe(e); });
})();

/* Cifras de Google (M05): «4,9» y «54» cuentan una vez al cargar, desde los 400 ms (para no coincidir con el hielo del vaso),
   en 1,1 s. El valor final está escrito en el HTML; se fija el ancho para que nada salte. */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.cuenta').forEach(function(el){
    var fin = parseFloat(el.dataset.fin), dec = +el.dataset.dec || 0, txt = el.textContent;
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    function fmt(v){ return v.toFixed(dec).replace('.', ','); }
    el.textContent = fmt(0);
    setTimeout(function(){
      var t0 = performance.now();
      (function paso(t){ var p = Math.min(1, (t - t0) / 1100), e = 1 - Math.pow(1 - p, 3);
        el.textContent = p < 1 ? fmt(fin * e) : txt; if (p < 1) requestAnimationFrame(paso); })(t0);
    }, 400);
  });
})();
