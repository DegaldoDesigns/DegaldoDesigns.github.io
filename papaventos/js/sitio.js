/* Papaventos (Valdemoro) · demo de Degaldo Designs (2026-10-22)
   Piezas de la librería adaptadas: vuelo-al-logo (M84, firma, copiado tal cual), titular-entre-filetes v2 (M71 .tf-rizos),
   titulares-animados (M01), hoja-sobre-foto (M22, en CSS), fondo-hojas-vivo v3 (M82, baldosas propias), decoracion-parallax (M15),
   cabecera-inteligente (M18), enlaces-hover (M61, en CSS), menu-escalonado (M52), menu-tabs-categorias + resaltado-deslizante
   (M53, piel nueva de cuerda con lazos) + transiciones-vista (carta), alergenos-popover, marquee (M40, en CSS),
   texto-revelado-scroll v5 (M14), interacciones-cursor v3 (M30), cartel-abierto-cerrado v3 (lógica de horario que cruza la
   medianoche), ubicacion-mapa v3, acordeon-nativo y barra-pegajosa-movil. */
(function(){
  'use strict';
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;
  var TEL = '646 39 25 33';

  /* ================= Horario (hora de Madrid) · lógica de cartel-abierto-cerrado v3 =================
     Tramos por día de la semana (0 = domingo) en minutos desde las 0:00 del día en que SE ABRE. Un cierre de madrugada pasa de 1440:
     viernes y sábado cierran a la 1:00 = 1500, así el sábado a las 0:30 está abierto por el tramo del viernes.
     CONFIRMAR CON EL CLIENTE: horario de INVIERNO (Google Maps y su cartel de Instagram del 06-09-2026). En verano cambia
     (2026: jueves 19-24, viernes y sábado 19-1, domingo 12-24) y en agosto cierran: cambiar TRAMOS y el HTML (lista de días,
     pie, JSON-LD y la pregunta "¿Qué días abrís?"). Los festivos no se calculan: nunca "hoy no hay servicio". */
  var TRAMOS = {5:[[720, 1500]], 6:[[720, 1500]], 0:[[720, 1440]]};
  var NOMBRES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var DIAS = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
  function hora(m){ if (m === 1440) return '24:00'; m = m % 1440; var h = Math.floor(m / 60), mi = m % 60; return h + ':' + (mi < 10 ? '0' : '') + mi; }
  function alas(m){ return (Math.floor((m % 1440) / 60) === 1 && m !== 1440 ? 'la ' : 'las ') + hora(m); }
  function ahora(){
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {dia: DIAS[p.weekday], min: (+p.hour % 24) * 60 + (+p.minute)};
    } catch(e){ var d = new Date(); return {dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes()}; }
  }
  function estado(n){
    n = n || ahora();
    var hoy = TRAMOS[n.dia] || [], i, t;
    for (i = 0; i < hoy.length; i++){ t = hoy[i]; if (n.min >= t[0] && n.min < t[1]) return {abierto:true, n:n, jornada:n.dia, cierra:t[1]}; }
    var ayer = (n.dia + 6) % 7, tra = TRAMOS[ayer] || [];   /* el tramo de ayer que pasa de la medianoche sigue abierto de madrugada */
    for (i = 0; i < tra.length; i++){ t = tra[i]; if (t[1] > 1440 && n.min < t[1] - 1440) return {abierto:true, n:n, jornada:ayer, cierra:t[1]}; }
    for (var k = 0; k < 8; k++){
      var d = (n.dia + k) % 7, tr = TRAMOS[d] || [];
      for (i = 0; i < tr.length; i++){ t = tr[i]; if (k * 1440 + t[0] > n.min) return {abierto:false, n:n, k:k, dia:d, abre:t[0]}; }
    }
    return {abierto:false, n:n, k:0, dia:n.dia, abre:720};
  }
  /* "hoy" o "el viernes" (de madrugada o la víspera, "mañana" confunde: se dice el día) */
  function cuando(e){ return e.k === 0 ? 'hoy' : 'el ' + NOMBRES[e.dia]; }
  window.PapaventosHorario = {estado:estado, cuando:cuando, hora:hora};   /* para las pruebas con el reloj falseado */

  function pintarEstado(){
    var e = estado(), clave = e.abierto ? 'abierto' : 'cerrado', mini = e.abierto ? 'arriba' : 'posado';
    var titulo = e.abierto ? 'Abierto' : 'Cerrado';
    var detalle = e.abierto ? 'hasta ' + alas(e.cierra) : 'abrimos ' + cuando(e) + ' a las ' + hora(e.abre);
    $$('[data-viva]').forEach(function(v){
      v.dataset.estado = clave;
      var t = v.querySelector('[data-viva-titulo]'), d = v.querySelector('[data-viva-detalle]'), m = v.querySelector('.va-mini');
      if (t && t.textContent !== titulo) t.textContent = titulo; if (d && d.textContent !== detalle) d.textContent = detalle;
      if (m) m.setAttribute('data-estado', mini);
    });
    var sec = document.getElementById('horario');
    if (sec){
      sec.dataset.estado = clave;
      var he = sec.querySelector('[data-horario-estado]'), hm = sec.querySelector('[data-estado-mini]');
      var resto = e.abierto ? ', hasta ' + alas(e.cierra) + '.' : '. Abrimos ' + cuando(e) + ' a las ' + hora(e.abre) + '.', fuerte = e.abierto ? 'Abierto ahora' : 'Cerrado ahora';
      if (he && he.textContent !== fuerte + resto){ he.textContent = ''; var b = document.createElement('b'); b.textContent = fuerte; he.appendChild(b); he.appendChild(document.createTextNode(resto)); }
      if (hm) hm.setAttribute('data-estado', mini);
      var jornada = e.abierto ? e.jornada : e.n.dia;   /* de madrugada, la fila marcada es la de la noche anterior */
      $$('.dia', sec).forEach(function(f){
        var hoy = f.getAttribute('data-dias').split(' ').indexOf(String(jornada)) > -1, nom = f.querySelector('.dia-nombre'), et = nom.querySelector('small');
        f.classList.toggle('hoy', hoy);
        var m = f.querySelector('.va-mini'); if (m) m.setAttribute('data-estado', hoy ? mini : (f.classList.contains('dia-cerrado') ? 'posado' : 'arriba'));
        var rotulo = jornada !== e.n.dia ? 'Esta noche' : 'Hoy';
        if (hoy && !et){ et = document.createElement('small'); nom.appendChild(et); }
        if (hoy) et.textContent = rotulo;
        if (!hoy && et) et.remove();
      });
    }
    var fh = document.querySelector('[data-final-hoy]');
    if (fh) fh.textContent = (e.abierto ? 'Abierto ahora, hasta ' + alas(e.cierra) : 'Abrimos ' + cuando(e) + ' a las ' + hora(e.abre)) + ' · C. Rosalía de Castro, 10';
  }
  pintarEstado();
  setInterval(pintarEstado, 30000);

  function alVerUnaVez(els, fn, opciones){
    if (!conIO || reducido){ els.forEach(fn); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(x){ if (x.isIntersecting){ fn(x.target); io.unobserve(x.target); } }); }, opciones || {rootMargin:'0px 0px -10% 0px'});
    els.forEach(function(el){ io.observe(el); });
  }

  /* ================= Titular por palabras (titulares-animados, M01) ================= */
  $$('.titular-palabras').forEach(function(h){
    var n = 0;
    (function partir(nodo){
      Array.prototype.slice.call(nodo.childNodes).forEach(function(hijo){
        if (hijo.nodeType === 3){
          var frag = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach(function(trozo){
            if (!trozo) return;
            if (/^\s+$/.test(trozo)){ frag.appendChild(document.createTextNode(' ')); return; }
            var v = document.createElement('span'); v.className = 'ventana';
            var p = document.createElement('span'); p.className = 'palabra'; p.textContent = trozo;
            p.style.setProperty('--i', Math.min(n++, 12)); v.appendChild(p); frag.appendChild(v);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1 && hijo.tagName !== 'BR'){ partir(hijo); }
      });
    })(h);
  });
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ $$('.portada .titular-palabras').forEach(function(h){ h.classList.add('visto'); }); }); });

  /* Mientras vuela la cometa, la cabecera enseña el logotipo sin la V; vuelve al posarse (vuelo:aterrizado) */
  (function(){
    var v = document.getElementById('vuelo'), img = document.querySelector('.marca img'); if (!v || !img) return;
    var visto = false; try { visto = sessionStorage.getItem('va:' + location.pathname + ':vuelo') === '1'; } catch(e){}
    var vuela = !reducido && !visto && !document.hidden && window.CSS && CSS.supports('offset-path', 'path("M0 0")');
    if (!vuela) return;
    var orig = img.getAttribute('src'); img.setAttribute('src', 'img/logo-papaventos-corto-sin-v.svg');
    v.addEventListener('vuelo:aterrizado', function(){ img.setAttribute('src', orig); }, {once:true});
  })();
  /* ================= vuelo-al-logo (M84) v1 · copiado de la librería (sin el bloque "Solo demo") ================= */
  (function(){
    var soporta = !!(window.CSS && CSS.supports && CSS.supports('offset-path', 'path("M0 0")'));
    var NS = 'http://www.w3.org/2000/svg';
    function css(el, p){ return getComputedStyle(el).getPropertyValue(p).trim(); }
    function ms(el, p, d){ var v = css(el, p), n = parseFloat(v); return isNaN(n) ? d : (/[^m]s$/.test(v) ? n * 1000 : n); }
    function num(el, p, d){ var n = parseFloat(css(el, p)); return isNaN(n) ? d : n; }
    function caja(el, base){ var r = el.getBoundingClientRect(); return {l:r.left - base.left, t:r.top - base.top, r:r.right - base.left, b:r.bottom - base.top, w:r.width, h:r.height}; }
    function f(n){ return Math.round(n * 10) / 10; }
    function curva(txt, inv){
      var c = (txt.match(/[\d.]+/g) || [.37, 0, .2, 1]).map(Number), a = inv ? 1 : 0;
      function b(s, p1, p2){ var u = 1 - s; return 3*u*u*s*p1 + 3*u*s*s*p2 + s*s*s; }
      return function(v){ var lo = 0, hi = 1, s = 0; for (var i = 0; i < 26; i++){ s = (lo + hi) / 2; if (b(s, c[a], c[a + 2]) < v) lo = s; else hi = s; } return b(s, c[1 - a], c[3 - a]); };
    }
    function anima(st, el, kf, op){ if (!el || !el.animate) return; op.fill = op.fill || 'both'; st.anims.push(el.animate(kf, op)); }
    function luego(st, fn, t){ st.timers.push(setTimeout(fn, t)); }
    function montar(el){
      if (el._va) return el._va;
      var destino = document.querySelector(el.getAttribute('data-destino'));
      if (!destino) return null;
      var logo = destino.closest('svg') || destino.parentNode;
      var st = el._va = {destino:destino, pieza:destino.querySelector('.va-pieza') || destino, fantasma:destino.querySelector('.va-fantasma'),
        revela:[].slice.call(logo.querySelectorAll('[data-va-revela]')), anims:[], timers:[],
        objeto:el.querySelector('.va-objeto'), estela:el.querySelector('.va-estela')};
      var o = st.objeto;
      if (o){
        var g = document.createElement('div'), e = document.createElement('div'); g.className = 'va-giro'; e.className = 'va-escala';
        while (o.firstChild) e.appendChild(o.firstChild); g.appendChild(e); o.appendChild(g); st.escala = e; st.giro = g;
        if (!e.querySelector('svg:not(.va-cola-tira)')){
          var bb = st.pieza.getBBox(), s = document.createElementNS(NS, 'svg'), cl = st.pieza.cloneNode(true);
          s.setAttribute('viewBox', [bb.x, bb.y, bb.width, bb.height].join(' ')); s.setAttribute('fill', 'currentColor');
          cl.removeAttribute('id'); cl.removeAttribute('class'); s.appendChild(cl); e.insertBefore(s, e.firstChild);
        }
      }
      if (el.getAttribute('data-desde') === 'izquierda') el.classList.add('va-izq');
      return st;
    }
    function recorrido(el, st, A, R, prueba, fc){
      var base = el.getBoundingClientRect(), W = base.width, d = caja(st.pieza, base), esc = num(el, '--va-escala', 1.5);
      var hw = d.w * esc * .55, hh = d.h * esc * .55, dx = d.l + d.w / 2, dy = d.t + d.h / 2, dir = el.classList.contains('va-izq') ? -1 : 1;
      var bs = (el.getAttribute('data-banda') || '').split(/\s+/), arriba = bs[0] && document.querySelector(bs[0]), abajo = bs[1] && document.querySelector(bs[1]);
      var y0 = Math.max(0, arriba ? caja(arriba, base).b : 0) + hh, y1 = (abajo ? caja(abajo, base).t : dy) - hh;
      var techo = Math.min(y1, dy - hh * .5); if (techo < y0) techo = y0;
      var r = Math.min(R, (techo - y0) / 2); if (r < 6) r = 0;
      var sx = dir > 0 ? W + hw : -hw, px = dx + (sx - dx) * .5, py = y0 + 2 * r + (techo - y0 - 2 * r) * .35, sy = y0 + (py - y0) * .5;
      var n = Math.round(num(el, '--va-rachas', 2)), amp = A * Math.max(0, y1 - y0), pts = [[sx, sy]], i, x, y;
      for (i = 1; i <= n; i++){ x = sx + (px - sx) * i / (n + 1); y = sy + (py - sy) * i / (n + 1) + (i % 2 ? -amp : amp);
        pts.push([x, Math.max(y0, Math.min(y1, y))]); }
      pts.push([px, py]);
      var dd = 'M' + f(sx) + ' ' + f(sy);
      for (i = 1; i < pts.length; i++){ var a = pts[i - 1], b = pts[i], m = (b[0] - a[0]) / 2; dd += 'C' + f(a[0] + m) + ' ' + f(a[1]) + ' ' + f(b[0] - m) + ' ' + f(b[1]) + ' ' + f(b[0]) + ' ' + f(b[1]); }
      var antes = dd, sw = dir > 0 ? 1 : 0, arco = 'A' + f(r) + ' ' + f(r) + ' 0 0 ' + sw + ' ';
      if (r) dd += arco + f(px - dir * r) + ' ' + f(py - r) + arco + f(px) + ' ' + f(py - 2 * r) + arco + f(px + dir * r) + ' ' + f(py - r) + arco + f(px) + ' ' + f(py);
      dd += 'C' + f(px - (px - dx) * .55) + ' ' + f(py) + ' ' + f(dx) + ' ' + f(dy - Math.max(30, (dy - py) * .7)) + ' ' + f(dx) + ' ' + f(dy);
      var p = document.createElementNS(NS, 'path'); prueba.appendChild(p); p.setAttribute('d', antes); var lp = p.getTotalLength();
      p.setAttribute('d', dd); var L = p.getTotalLength();
      var sel = el.getAttribute('data-evitar') || 'h1,h2,h3,p,a,button,.va-evitar', cajas = [], cola = el.querySelector('.va-cola');
      var hb = hh + (cola ? d.w * esc * num(cola, '--va-cola-largo', 2.4) * Math.sin((parseFloat(css(cola, '--va-cola-giro')) || 30) * Math.PI / 180) : 0);
      el.parentNode.querySelectorAll(sel).forEach(function(c){ if (el.contains(c)) return; var k = caja(c, base);
        if (k.w && !(dx > k.l && dx < k.r && dy > k.t && dy < k.b)) cajas.push(k); });
      for (var s = 0; s <= L; s += 6){ var q = p.getPointAtLength(s), hc = s < fc * L ? hb : hh;
        for (var j = 0; j < cajas.length; j++){ var k = cajas[j]; if (q.x + hw > k.l && q.x - hw < k.r && q.y + hc > k.t && q.y - hh < k.b){ p.remove(); return null; } } }
      var estela = '';
      if (r){ var e0 = Math.max(0, lp - 1.2 * r), e1 = lp + 2 * Math.PI * r; for (s = e0; s <= e1 + 3; s += 3){ q = p.getPointAtLength(Math.min(s, e1)); estela += (estela ? 'L' : 'M') + f(q.x) + ' ' + f(q.y); } }
      p.remove();
      return {d:dd, L:L, e0:e0, e1:e1, estela:estela, w:d.w, h:d.h};
    }
    function clave(el){ return 'va:' + location.pathname + ':' + (el.id || ''); }
    function visto(el, poner){ try { if (poner) sessionStorage.setItem(clave(el), '1'); else return sessionStorage.getItem(clave(el)) === '1'; } catch(e){ return false; } }
    function avisa(el, nombre){ el.dispatchEvent(new CustomEvent('vuelo:' + nombre, {bubbles:true})); }
    function finalizar(el){
      var st = el._va; if (!st || st.fin) return; st.fin = true;
      st.timers.forEach(clearTimeout); st.anims.forEach(function(a){ a.cancel(); }); st.anims = []; st.timers = [];
      el.classList.remove('va-volando'); window.removeEventListener('resize', st.onResize);
      [st.pieza, st.fantasma].concat(st.revela).forEach(function(n){ if (n) n.classList.add('va-ok'); });
      st.revela.forEach(function(n){ n.querySelectorAll('[pathLength]').forEach(function(p){ p.style.strokeDasharray = ''; }); });
      if (!st.aterrizo) avisa(el, 'aterrizado');
      avisa(el, 'terminado');
      if (el.hasAttribute('data-respira') && !reducido){ st.pieza.classList.add('va-respira'); vigila(st.pieza); }
    }
    function revelar(st, t0, rapido){
      var fin = t0, grupos = {};
      st.revela.forEach(function(n){ var k = +n.getAttribute('data-va-revela') || 1; (grupos[k] = grupos[k] || []).push(n); });
      Object.keys(grupos).sort(function(a, b){ return a - b; }).forEach(function(k, i){
        var t = t0 + i * 150;
        grupos[k].forEach(function(n){
          var trazos = n.matches('[pathLength]') ? [n] : [].slice.call(n.querySelectorAll('[pathLength]')), dur = 300;
          if (rapido){ anima(st, n, [{opacity:0}, {opacity:1}], {duration:300, delay:t0}); return; }
          if (trazos.length){ dur = 400; anima(st, n, [{opacity:1}, {opacity:1}], {duration:dur, delay:t});
            trazos.forEach(function(p){ p.style.strokeDasharray = '1 2'; anima(st, p, [{strokeDashoffset:1.01}, {strokeDashoffset:0}], {duration:dur, delay:t, easing:'cubic-bezier(.77,0,.175,1)'}); }); }
          else if (n.hasAttribute('data-va-sentido')){
            var de = {abajo:'inset(0 0 100% 0)', derecha:'inset(0 100% 0 0)', izquierda:'inset(0 0 0 100%)'}[n.getAttribute('data-va-sentido')] || 'inset(0 0 100% 0)';
            anima(st, n, [{opacity:1, clipPath:de}, {opacity:1, clipPath:'inset(0 0 0 0)'}], {duration:dur, delay:t, easing:'cubic-bezier(.23,1,.32,1)'}); }
          else anima(st, n, [{opacity:0, scale:.9}, {opacity:1, scale:1}], {duration:200, delay:t + 120, easing:'cubic-bezier(.23,1,.32,1)'});
          fin = Math.max(fin, t + dur);
        });
      });
      return rapido ? t0 + 300 : fin;
    }
    function iniciar(el){
      var st = montar(el); if (!st || st.on) return; st.on = true; st.fin = false; st.aterrizo = false;
      var directo = (el.getAttribute('data-una-vez') === 'sesion' && visto(el)) || document.hidden;
      visto(el, true);
      if (directo) return luego(st, function(){ finalizar(el); }, 0);
      var ret = ms(el, '--va-retraso', 200), dur = innerWidth < 640 ? ms(el, '--va-duracion-movil', 1900) : ms(el, '--va-duracion', 2400), ruta = null;
      if (soporta && !reducido && st.objeto){
        var Rv = css(el, '--va-rizo'), R = /px$/.test(Rv) ? parseFloat(Rv) : parseFloat(Rv) * el.getBoundingClientRect().width;
        if (!el.hasAttribute('data-rizo')) R = 0;
        var A = num(el, '--va-amplitud', .18), prueba = st.estela || el.appendChild(document.createElementNS(NS, 'svg'));
        [[A, R], [A / 2, R], [0, R], [0, R / 2], [0, 0]].some(function(x){ ruta = recorrido(el, st, x[0], x[1], prueba, curva(css(el, '--ease-vuelo'), 0)(Math.max(0, 1 - 300 / dur))); return ruta; });
      }
      var fin;
      if (!ruta){
        anima(st, st.pieza, [{opacity:0}, {opacity:1}], {duration:300});
        anima(st, st.fantasma, [{opacity:.22}, {opacity:0}], {duration:300});
        luego(st, function(){ st.aterrizo = true; avisa(el, 'aterrizado'); }, 300);
        fin = reducido ? revelar(st, 0, true) : revelar(st, 300);
      } else {
        var o = st.objeto, T = ret + dur, inv = curva(css(el, '--ease-vuelo'), 1), n = Math.max(1, Math.round(dur / 1300));
        o.style.width = ruta.w + 'px'; o.style.height = ruta.h + 'px'; o.style.offsetPath = 'path("' + ruta.d + '")';
        el.style.setProperty('--va-bam-t', Math.round(dur / n) + 'ms'); el.style.setProperty('--va-bam-n', n);
        var ladeo = css(el, '--va-inclina') || '-12deg'; if (el.classList.contains('va-izq')) ladeo = 'calc(-1 * ' + ladeo + ')';
        st.escala.style.rotate = ladeo;
        el.classList.add('va-volando');
        anima(st, o, [{offsetDistance:'0%'}, {offsetDistance:'100%'}], {duration:dur, delay:ret, easing:css(el, '--ease-vuelo') || 'cubic-bezier(.37,0,.2,1)'});
        anima(st, st.escala, [{scale:css(el, '--va-escala') || 1.5, rotate:ladeo}, {scale:1, rotate:'0deg'}], {duration:420, delay:T, easing:css(el, '--ease-muelle') || 'ease-out'});
        anima(st, el.querySelector('.va-cola'), [{opacity:1}, {opacity:0}], {duration:300, delay:T - 300});
        anima(st, st.fantasma, [{opacity:.22}, {opacity:0}], {duration:200, delay:T});
        if (st.estela && ruta.estela){
          var p = st.estela.querySelector('path') || st.estela.appendChild(document.createElementNS(NS, 'path'));
          p.setAttribute('d', ruta.estela); p.setAttribute('pathLength', 1); p.style.strokeDasharray = '1 2';
          var ta = ret + inv(ruta.e0 / ruta.L) * dur, tb = ret + inv(ruta.e1 / ruta.L) * dur, kf = [];
          for (var k = 0; k <= 8; k++){ var tk = ret + inv((ruta.e0 + (ruta.e1 - ruta.e0) * k / 8) / ruta.L) * dur; kf.push({strokeDashoffset:k ? 1 - k / 8 : 1.01, offset:(tk - ta) / (tb - ta)}); }
          kf[8].offset = 1; anima(st, p, kf, {duration:tb - ta, delay:ta});
          anima(st, st.estela, [{opacity:.35}, {opacity:0}], {duration:400, delay:tb + 700});
        }
        luego(st, function(){ st.aterrizo = true; avisa(el, 'aterrizado'); }, T);
        luego(st, function(){ st.pieza.classList.add('va-ok'); el.classList.remove('va-volando'); }, T + 420);
        fin = Math.max(revelar(st, T + 50), T + 420, ruta.estela ? tb + 1100 : 0);
        var ancho = innerWidth;
        st.onResize = function(){ if (innerWidth !== ancho) finalizar(el); };
        addEventListener('resize', st.onResize);
      }
      luego(st, function(){ finalizar(el); }, fin + 20);
    }
    function reiniciar(el){
      var st = montar(el); if (!st) return;
      st.timers.forEach(clearTimeout); st.anims.forEach(function(a){ a.cancel(); }); st.anims = []; st.timers = [];
      el.classList.remove('va-volando');
      [st.pieza, st.fantasma].concat(st.revela).forEach(function(n){ if (n) n.classList.remove('va-ok', 'va-respira'); });
      st.on = false; void el.getBoundingClientRect(); iniciar(el);
    }
    window.VueloAlLogo = {iniciar:iniciar, reiniciar:reiniciar};
    var io = conIO && !reducido && new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('va-visible', e.isIntersecting); }); });
    function vigila(n){ if (io) io.observe(n); }
    $$('.va-mini').forEach(vigila);
    $$('.va').forEach(function(el){
      var modo = el.getAttribute('data-vuelo') || 'carga';
      if (modo === 'carga') iniciar(el);
      else if (modo === 'al-ver'){
        if (!conIO) return iniciar(el);
        var ob = new IntersectionObserver(function(es){ if (es[0].intersectionRatio >= .4){ ob.disconnect(); iniciar(el); } }, {threshold:[0, .4, .8]});
        ob.observe(el.parentNode);
      }
    });
  })();

  /* ================= Entradas al bajar (M10) y rizos de los titulares (M71 v2) ================= */
  $$('.resenas, .faq, .bento').forEach(function(g){ $$('.reveal', g).forEach(function(el, i){ el.style.setProperty('--retraso', Math.min(i, 6) * 60 + 'ms'); }); });
  alVerUnaVez($$('.reveal, .tf'), function(el){ el.classList.add('visto'); }, {rootMargin:'0px 0px -8% 0px'});

  /* ================= Pausa fuera de pantalla de los bucles (cuerda, cinta) y del brillo del fondo vivo ================= */
  $$('.mov, .fondo-vivo').forEach(function(m){
    if (!conIO){ m.classList.add('en-pantalla'); return; }
    new IntersectionObserver(function(es){ m.classList.toggle('en-pantalla', es[0].isIntersecting); }).observe(m);
  });

  /* ================= Barra fija del móvil: no se enseña mientras se ve otro "Llamar" (portada y final) ================= */
  var barraM = document.getElementById('barraMovil'), tapan = $$('[data-tapa-barra]');
  if (barraM && tapan.length && conIO){
    var vistos = new Set();
    var ioB = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting) vistos.add(e.target); else vistos.delete(e.target); });
      barraM.classList.toggle('tapada', vistos.size > 0);
    });
    tapan.forEach(function(t){ ioB.observe(t); });
  }

  /* ================= Cabecera inteligente (M18) + sección activa (M61) ================= */
  var cab = document.getElementById('cabecera'), menu = document.getElementById('menu');
  if (cab){
    if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && conIO){
      new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(document.querySelector('.centinela'));
    }
    var ultimo = scrollY, pendC = false;
    addEventListener('scroll', function(){
      if (pendC) return; pendC = true;
      requestAnimationFrame(function(){ pendC = false; var y = scrollY, d = y - ultimo; if (Math.abs(d) < 8) return;
        if (y < 120 || d < 0 || (menu && menu.matches(':popover-open'))) cab.classList.remove('oculta'); else cab.classList.add('oculta'); ultimo = y; });
    }, {passive:true});
  }
  if (conIO){
    var enlaces = $$('.nav a'), visibles = {};
    var ioNav = new IntersectionObserver(function(es){
      es.forEach(function(e){ visibles[e.target.id] = e.isIntersecting ? e.intersectionRatio : 0; });
      var mejor = null, max = 0; Object.keys(visibles).forEach(function(id){ if (visibles[id] > max){ max = visibles[id]; mejor = id; } });
      enlaces.forEach(function(a){ if (a.getAttribute('href') === '#' + mejor) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }, {rootMargin:'-30% 0px -50% 0px', threshold:[0, .1, .25, .5, .75, 1]});
    enlaces.forEach(function(a){ var s = document.querySelector(a.getAttribute('href')); if (s) ioNav.observe(s); });
  }

  /* ================= Menú móvil en círculo (menu-escalonado, M52) ================= */
  var hamb = document.querySelector('.hamb');
  if (menu && hamb && typeof menu.showPopover === 'function'){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){ var ab = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(ab)); hamb.setAttribute('aria-label', ab ? 'Cerrar menú' : 'Abrir menú'); if (!ab) hamb.focus(); });
    $$('a', menu).forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* ================= Cuerda con lazos (resaltado-deslizante M53, piel .rd-cuerda): la cometa viaja hasta el lazo activo ================= */
  var cuerdas = [];
  $$('[data-cuerda]').forEach(function(cont){
    var marca = cont.querySelector('.rd-marca'), items = $$('.rd-item', cont);
    function reposo(){ return cont.querySelector('.rd-item[aria-selected="true"]'); }
    function ir(el, sin){
      if (!el || !el.offsetWidth){ marca.classList.remove('listo'); return; }
      var c = cont.getBoundingClientRect(), lz = (el.querySelector('.rd-lazo') || el).getBoundingClientRect();
      var x = lz.left + lz.width / 2 - c.left - marca.offsetWidth / 2, y = lz.top - c.top - marca.offsetHeight + 2;
      var saltar = sin || reducido || !marca.classList.contains('listo');
      if (saltar) marca.style.transition = 'none';
      marca.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      if (saltar){ void marca.offsetWidth; marca.style.transition = ''; }
      marca.classList.add('listo');
    }
    ir(reposo(), true);
    if (raton){
      items.forEach(function(el){ el.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') ir(el); }); });
      cont.addEventListener('pointerleave', function(){ ir(reposo()); });
    }
    cont.addEventListener('focusin', function(e){ var el = e.target.closest('.rd-item'); if (el) ir(el); });
    cont.addEventListener('focusout', function(e){ if (!cont.contains(e.relatedTarget)) ir(reposo()); });
    if ('ResizeObserver' in window) new ResizeObserver(function(){ ir(reposo(), true); }).observe(cont);
    cuerdas.push({cont:cont, volver:function(sin){ ir(reposo(), sin); }});
  });

  /* ================= Carta: pestañas accesibles (menu-tabs-categorias) + racha de viento (transiciones-vista) ================= */
  var puedeVT = typeof document.startViewTransition === 'function' && !reducido;
  function entrar(panel){
    if (reducido) return;
    $$('.plato', panel).forEach(function(f, i){ f.style.setProperty('--n', i); });
    panel.classList.remove('entra'); void panel.offsetWidth; panel.classList.add('entra');
  }
  var tablist = document.querySelector('[data-cuerda]'), zona = document.querySelector('[data-cuerda-zona]');
  if (tablist){
    var tabs = $$('[role="tab"]', tablist);
    var centrarTab = function(tab){
      if (!zona || zona.scrollWidth <= zona.clientWidth) return;
      var z = zona.getBoundingClientRect(), r = tab.getBoundingClientRect();
      zona.scrollTo({left: zona.scrollLeft + (r.left + r.width / 2) - (z.left + z.width / 2), behavior: reducido ? 'auto' : 'smooth'});
    };
    var elegir = function(tab, foco){
      if (tab.getAttribute('aria-selected') === 'true'){ if (foco) tab.focus(); return; }
      var panel = document.getElementById(tab.getAttribute('aria-controls'));
      var aplicar = function(){ tabs.forEach(function(t){ var si = t === tab; t.setAttribute('aria-selected', String(si)); t.tabIndex = si ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls')); if (p) p.hidden = !si; }); entrar(panel); };
      if (puedeVT){ var vt = document.startViewTransition(aplicar); vt.finished.then(function(){ cuerdas.forEach(function(c){ c.volver(); }); }); }
      else aplicar();
      cuerdas.forEach(function(c){ c.volver(); });
      centrarTab(tab);
      var top = document.querySelector('.cuerda-zona').getBoundingClientRect().top;
      if (top < 0) scrollTo({top: scrollY + top - 90, behavior: reducido ? 'auto' : 'smooth'});
      if (foco) tab.focus();
    };
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ elegir(t); });
      t.addEventListener('keydown', function(e){
        var d = null;
        if (e.key === 'ArrowRight') d = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') d = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') d = tabs[0]; else if (e.key === 'End') d = tabs[tabs.length - 1];
        if (d){ e.preventDefault(); elegir(d, true); }
      });
    });
  }

  /* ================= Alérgenos con Popover y ancla (alergenos-popover) · los de su carta digital, tal cual ================= */
  (function(){
    var AL = {
      gluten:['GLU','Gluten','Cereales con gluten: trigo, centeno, cebada, avena.'], crustaceos:['CRU','Crustáceos','Gambas, langostinos, cangrejo y otros crustáceos.'],
      huevo:['HUE','Huevos','Huevos y productos a base de huevo.'], pescado:['PES','Pescado','Pescado y productos a base de pescado.'],
      cacahuetes:['CAC','Cacahuetes','Cacahuetes y productos a base de cacahuete.'], soja:['SOJ','Soja','Soja y productos a base de soja.'],
      lacteos:['LAC','Lácteos','Leche y derivados, incluida la lactosa.'], frutos:['FRC','Frutos de cáscara','Almendras, avellanas, nueces, pistachos y otros frutos de cáscara.'],
      apio:['API','Apio','Apio y productos a base de apio.'], mostaza:['MOS','Mostaza','Mostaza y productos a base de mostaza.'],
      sesamo:['SÉS','Sésamo','Granos de sésamo y productos a base de sésamo.'], sulfitos:['SUL','Sulfitos','Dióxido de azufre y sulfitos.'],
      altramuces:['ALT','Altramuces','Altramuces y productos a base de altramuces.'], moluscos:['MOL','Moluscos','Almejas, mejillones, zamburiñas, calamar, pulpo y otros moluscos.']
    };
    var ley = document.getElementById('lista-leyenda');
    if (ley) Object.keys(AL).forEach(function(k){ var li = document.createElement('li'), b = document.createElement('b'); b.textContent = AL[k][0]; li.appendChild(b); li.appendChild(document.createTextNode(AL[k][1])); ley.appendChild(li); });
    $$('.al').forEach(function(b){ var a = AL[b.dataset.al]; if (a) b.setAttribute('aria-label', a[0] + ', ' + a[1].toLowerCase() + ': más información'); });
    var pop = document.getElementById('info-alergeno'), activo = null;
    if (!pop) return;
    document.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('.al'); if (!b) return;
      var a = AL[b.dataset.al]; pop.querySelector('strong').textContent = a[1]; pop.querySelector('span').textContent = a[2] + ' Según la carta digital del local.';
      if (activo && activo !== b){ activo.style.anchorName = ''; activo.classList.remove('activo'); }
      b.style.anchorName = '--al'; activo = b;
      if (pop.matches(':popover-open') && b.dataset.ultimo !== '1'){ requestAnimationFrame(function(){ if (!pop.matches(':popover-open')) pop.showPopover(); }); }
      $$('.al').forEach(function(x){ x.dataset.ultimo = x === b ? '1' : ''; });
    }, true);
    pop.addEventListener('toggle', function(e){ if (activo) activo.classList.toggle('activo', e.newState === 'open'); });
  })();

  /* ================= Su frase se enciende con el scroll (texto-revelado-scroll v5, M14) ================= */
  $$('.lee-texto').forEach(function(p){
    if (p.querySelector('.pal')) return;
    var n = 0;
    (function partir(nodo){
      Array.prototype.slice.call(nodo.childNodes).forEach(function(h){
        if (h.nodeType === 3){
          var frag = document.createDocumentFragment();
          h.textContent.split(/(\s+)/).forEach(function(t){
            if (!t) return;
            if (/^\s+$/.test(t)){ frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'pal'; s.textContent = t; s.style.setProperty('--i', n++); frag.appendChild(s);
          });
          nodo.replaceChild(frag, h);
        } else if (h.nodeType === 1){ partir(h); }
      });
    })(p);
    p.style.setProperty('--n', n);
  });

  /* ================= Decoración con parallax (decoracion-parallax, M15, y capas data-py del fondo vivo) ================= */
  if (!reducido){
    var capas = $$('[data-px],[data-py]'), pendP = null;
    var parallax = function(){ pendP = null; var vh = innerHeight;
      capas.forEach(function(el){ var s = el.closest('section'); if (!s) return; var r = s.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        if (el.dataset.px) el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0';
        else el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; });
    };
    addEventListener('scroll', function(){ if (!pendP) pendP = requestAnimationFrame(parallax); }, {passive:true});
    addEventListener('resize', parallax); parallax();
  }

  /* ================= Interacciones con ratón (interacciones-cursor v3, M30). Los botones de llamar no se mueven. ================= */
  if (raton && !reducido){
    $$('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    $$('.foto-iman').forEach(function(f){
      var img = f.querySelector('img');
      f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        f.style.translate = (x * 22).toFixed(1) + 'px ' + (y * 18).toFixed(1) + 'px';
        img.style.translate = (x * -12).toFixed(1) + 'px ' + (y * -10).toFixed(1) + 'px'; img.style.scale = '1.05'; });
      f.addEventListener('pointerleave', function(){ f.style.translate = ''; img.style.translate = ''; img.style.scale = ''; });
    });
    var pendR = null;
    document.addEventListener('mousemove', function(e){
      if (pendR) return;
      pendR = requestAnimationFrame(function(){ pendR = null; var el = e.target && e.target.closest ? e.target.closest('.faq details') : null; if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ================= Mapa real solo al pulsar (ubicacion-mapa v3) ================= */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa){
    btnMapa.addEventListener('click', function(){
      var caja = document.getElementById('mapa'), fachada = document.getElementById('mapaFachada'); if (!fachada) return;
      var f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Papaventos Restaurante, C. Rosalía de Castro 10, 28342 Valdemoro, Madrid') + '&hl=es&z=17&output=embed';
      f.title = 'Mapa con la ubicación de Papaventos'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
      caja.appendChild(f); fachada.remove(); f.focus();
    });
  }

  /* ================= Preguntas: acordeón nativo con altura animada (acordeon-nativo) ================= */
  $$('.faq details').forEach(function(el){
    var resumen = el.querySelector('summary'), contenido = el.querySelector('.contenido'), anim = null, cerrando = false, abriendo = false;
    function terminar(abierto){ el.open = abierto; anim = null; cerrando = abriendo = false; el.style.height = el.style.overflow = ''; }
    function animar(desde, hasta, abierto){
      if (anim) anim.cancel();
      if (reducido){ terminar(abierto); return; }
      anim = el.animate({height:[desde, hasta]}, {duration:250, easing:'cubic-bezier(0.23,1,0.32,1)'});
      anim.onfinish = function(){ terminar(abierto); }; anim.oncancel = function(){ cerrando = abriendo = false; };
    }
    resumen.addEventListener('click', function(e){
      e.preventDefault(); el.style.overflow = 'hidden';
      if (cerrando || !el.open){
        $$('.faq details[open]').forEach(function(o){ if (o !== el) o.querySelector('summary').click(); });
        el.style.height = el.offsetHeight + 'px'; el.open = true;
        requestAnimationFrame(function(){ abriendo = true; animar(el.offsetHeight + 'px', (resumen.offsetHeight + contenido.offsetHeight) + 'px', true); });
      } else if (abriendo || el.open){ cerrando = true; animar(el.offsetHeight + 'px', resumen.offsetHeight + 'px', false); }
    });
  });
})();
