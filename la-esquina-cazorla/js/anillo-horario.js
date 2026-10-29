/* La Esquina · COPIA LITERAL del script v1 de 01-Libreria-de-Codigo/componentes/anillo-horario.html (M86: tarjeta viva y anillo grande). No editar aquí: se cambia allí y se vuelve a copiar. */
/* M86 anillo-horario */
(function(){
  var NS = 'http://www.w3.org/2000/svg', DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ahora(zona){
    try{
      var o = {};
      new Intl.DateTimeFormat('en-US', {timeZone:zona, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour) * 60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours() * 60 + n.getMinutes()}; }
  }
  function hora(m){ if (m > 1440) m -= 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }   // 1440 = "24:00"
  function art(m){ var h = Math.floor((m > 1440 ? m - 1440 : m) / 60); return (h === 1 ? 'la ' : 'las ') + hora(m); }   // "la 1:00", "las 2:00"
  function estado(H, t){
    var hoy = H[t.d] || [], i, k;
    for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {abierto:true, jornada:t.d, cierra:hoy[i][1]};
    var ayer = (t.d + 6) % 7, tra = H[ayer] || [];
    for (i = 0; i < tra.length; i++) if (tra[i][1] > 1440 && t.min < tra[i][1] - 1440) return {abierto:true, jornada:ayer, cierra:tra[i][1]};
    for (k = 0; k < 8; k++){ var dia = (t.d + k) % 7, tr = H[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.min > 0) return {abierto:false, jornada:t.d, k:k, dia:dia, abre:tr[i][0]}; }
    return {abierto:false, jornada:t.d, k:-1};
  }
  function punto(r, m){ var a = m / 1440 * 2 * Math.PI; return (50 + r * Math.sin(a)).toFixed(3) + ' ' + (50 - r * Math.cos(a)).toFixed(3); }
  function arco(r, a, b){
    if (b - a >= 1440) return 'M50 ' + (50 - r) + 'A' + r + ' ' + r + ' 0 1 1 50 ' + (50 + r) + 'A' + r + ' ' + r + ' 0 1 1 50 ' + (50 - r);
    return 'M' + punto(r, a) + 'A' + r + ' ' + r + ' 0 ' + (b - a > 720 ? 1 : 0) + ' 1 ' + punto(r, b);
  }
  function el(tag, at){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }

  Array.prototype.forEach.call(document.querySelectorAll('.ah[data-horario]:not([data-ah-escala="semana"])'), function(ah){
    var cfg; try{ cfg = JSON.parse(ah.getAttribute('data-horario')); }catch(e){ return; }
    var zona = cfg.zona || 'Europe/Madrid', H = cfg.dias || {}, svg = ah.querySelector('.ah-anillo'), mini = ah.getAttribute('data-tam') === 'mini';
    var est = document.getElementById(ah.getAttribute('data-estado-en') || '') || (function(n){ while (n && !(n.classList && n.classList.contains('ah-estado'))) n = n.nextElementSibling; return n; })(ah.nextElementSibling);
    var grupo = el('g', {'class':'ah-tramos'}), aguja = el('g', {'class':'ah-ahora'}), firma = '';
    aguja.appendChild(el('circle', {'class':'ah-halo', cx:50, cy:4, r:mini ? 9 : 6}));
    aguja.appendChild(el('circle', {'class':'ah-punto', cx:50, cy:4, r:mini ? 6 : 3.4}));
    svg.appendChild(grupo); svg.appendChild(aguja);
    if (!reducido) ah.classList.add('ah-dibuja');
    function set(sel, v){ var n = est && est.querySelector(sel); if (n && n.textContent !== v) n.textContent = v; }
    function pintar(){
      var t = ahora(zona), e = estado(H, t), tramos = H[e.jornada] || [];
      ah.setAttribute('data-estado', e.abierto ? 'abierto' : 'cerrado');
      aguja.style.rotate = (t.min / 1440 * 360).toFixed(2) + 'deg';
      var f = e.jornada + ':' + JSON.stringify(tramos);
      if (f !== firma){                                   // solo se rehace si cambia la jornada
        firma = f; grupo.textContent = '';
        Array.prototype.forEach.call(ah.querySelectorAll('.ah-hora'), function(n){ n.remove(); });
        var usados = [];
        tramos.forEach(function(tr){
          grupo.appendChild(el('path', {'class':'ah-tramo', d:arco(46, tr[0], tr[1]), pathLength:1}));
          if (mini) return;
          [tr[0], tr[1]].forEach(function(m){
            var g = (m % 1440) / 4;
            if (usados.some(function(u){ var d = Math.abs(u - g) % 360; return Math.min(d, 360 - d) < 22; })) return;
            usados.push(g);
            var s = document.createElement('span'); s.className = 'ah-hora'; s.setAttribute('aria-hidden', 'true'); s.textContent = hora(m);
            s.style.setProperty('--sx', Math.sin(g * Math.PI / 180).toFixed(4)); s.style.setProperty('--cy', Math.cos(g * Math.PI / 180).toFixed(4));
            ah.appendChild(s);
          });
        });
      }
      set('.ah-palabra', e.abierto ? 'Abierto' : 'Cerrado');
      set('.ah-detalle', e.abierto ? 'hasta ' + art(e.cierra)
        : e.k < 0 ? 'consulta el horario'
        : (e.k === 0 ? 'abrimos hoy ' : e.k === 1 ? 'abrimos mañana ' : 'abrimos el ' + DIA[e.dia] + ' ') + 'a ' + art(e.abre));
      set('.ah-hoy', tramos.length ? (e.jornada === t.d ? 'Hoy' : DIA[e.jornada].charAt(0).toUpperCase() + DIA[e.jornada].slice(1)) + ', ' + tramos.map(function(tr){ return 'de ' + hora(tr[0]) + ' a ' + hora(tr[1]); }).join(' y ') : '');
      ah.classList.add('ah-listo');
    }
    pintar(); setInterval(pintar, 60000);
    if ('IntersectionObserver' in window){
      var visto = false;
      new IntersectionObserver(function(ents){ ents.forEach(function(en){
        ah.classList.toggle('ah-fuera', !en.isIntersecting);
        if (en.isIntersecting && !visto){ visto = true; requestAnimationFrame(function(){ ah.classList.add('ah-visto'); }); }
      }); }, {threshold:.5}).observe(ah);
    } else ah.classList.add('ah-visto');
  });
})();
