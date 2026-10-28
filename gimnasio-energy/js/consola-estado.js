/* consola-estado (M116) v1, copia de la librería. */
/* ==================== COMPONENTE: consola-estado (JS) ==================== */
(function(){
  var DIAS = {domingo:0, lunes:1, martes:2, miercoles:3, jueves:4, viernes:5, sabado:6};
  var NOMBRE = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var CORTO = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches, hayIO = 'IntersectionObserver' in window;

  function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function aMin(h){ var m = /(\d{1,2})[:.](\d{2})/.exec(h || ''); return m ? (+m[1]) * 60 + (+m[2]) : null; }
  function hh(m){ m = ((m % 1440) + 1440) % 1440; return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
  function alas(m){ return (Math.floor((m % 1440) / 60) === 1 ? 'la ' : 'las ') + hh(m); }
  function duracion(m){
    var d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    if (d > 0) return d + ' d' + (h ? ' ' + h + ' h' : '');
    if (h > 0) return h + ' h' + (mi ? ' ' + mi + ' min' : '');
    return mi + ' min';
  }
  function ahora(zona){
    try{
      var o = {};
      new Intl.DateTimeFormat('en-US', {timeZone:zona, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour) * 60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours() * 60 + n.getMinutes()}; }
  }
  function fechaCorta(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; }

  /* Horario del JSON → {día: [[apertura, cierre], …]} en minutos; un cierre menor que la apertura cruza la medianoche */
  function leerHorario(lista){
    var H = {};
    (lista || []).forEach(function(x){
      var d = DIAS[norm(x.dia)]; if (d == null) return;
      H[d] = (x.tramos || []).map(function(t){ var a = aMin(t.desde), b = aMin(t.hasta); if (a == null || b == null) return null; return [a, b <= a ? b + 1440 : b]; }).filter(Boolean);
    });
    return H;
  }
  /* Lógica de cartel-abierto-cerrado v3 (sin días "con cita") */
  function estado(H, t){
    var hoy = H[t.d] || [], i;
    for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {abierto:true, cierra:hoy[i][1], falta:hoy[i][1] - t.min};
    var tra = H[(t.d + 6) % 7] || [];
    for (i = 0; i < tra.length; i++) if (tra[i][1] > 1440 && t.min < tra[i][1] - 1440) return {abierto:true, cierra:tra[i][1], falta:tra[i][1] - 1440 - t.min};
    for (var k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = H[dia] || [];
      for (i = 0; i < tr.length; i++){ var f = k * 1440 + tr[i][0] - t.min; if (f > 0) return {abierto:false, k:k, dia:dia, abre:tr[i][0], falta:f}; }
    }
    return {abierto:false, k:-1};
  }
  function cuando(k, dia, t){ return k === 0 ? 'hoy' : (k === 1 && t.min >= 360) ? 'mañana' : 'el ' + NOMBRE[dia]; }

  /* Días en texto libre: nombres completos y rangos "de lunes a viernes". Lo demás no se entiende (y no se calcula). */
  function leerDias(txt){
    var s = norm(txt), out = [], m, re = /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(?:a|al|hasta)\s+(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/g;
    while ((m = re.exec(s))){ for (var d = DIAS[m[1]], n = 0; n < 7; n++){ if (out.indexOf(d) < 0) out.push(d); if (d === DIAS[m[2]]) break; d = (d + 1) % 7; } }
    (s.match(/lunes|martes|miercoles|jueves|viernes|sabado|domingo/g) || []).forEach(function(n){ if (out.indexOf(DIAS[n]) < 0) out.push(DIAS[n]); });
    return out;
  }
  /* Horas: "20:30", "16:00 y 20:30" (dos clases), "21:00 a 22:30" (una, con su fin) */
  function leerHoras(txt){
    var out = [], m, re = /(\d{1,2}[:.]\d{2})(?:\s*(?:a|-|–|hasta)\s*(\d{1,2}[:.]\d{2}))?/g;
    while ((m = re.exec(txt || ''))) out.push({ini:aMin(m[1]), fin:m[2] ? aMin(m[2]) : null});
    return out;
  }
  function proximaClase(clases, t){
    var mejor = null;
    clases.forEach(function(c){
      var ds = leerDias(c.dias), hs = leerHoras(c.hora);
      if (!ds.length || !hs.length) return;
      for (var k = 0; k < 8; k++){
        var d = (t.d + k) % 7; if (ds.indexOf(d) < 0) continue;
        hs.forEach(function(h){
          var cand = null, f = k * 1440 + h.ini - t.min;
          if (k === 0 && h.fin != null && t.min >= h.ini && t.min < h.fin) cand = {curso:true, c:c, h:h, f:-1};
          else if (f > 0) cand = {k:k, d:d, c:c, h:h, f:f};
          if (cand && (!mejor || cand.f < mejor.f)) mejor = cand;
        });
      }
    });
    return mejor;
  }

  function set(el, sel, v){ var n = el.querySelector(sel); if (n && n.textContent !== v) n.textContent = v; }
  function pintar(el){
    var c = el._cs; if (!c) return;
    var t = c.simulado || ahora(c.zona);
    if (!c.contando){ set(el, '.cs-dia', CORTO[t.d]); set(el, '.cs-hh', ('0' + Math.floor(t.min / 60)).slice(-2)); set(el, '.cs-mm', ('0' + t.min % 60).slice(-2)); }
    c.ultimo = t;
    var d = c.datos; if (!d) return;
    if (d.horario){
      var e = estado(c.H, t);
      el.setAttribute('data-estado', e.abierto ? 'abierto' : 'cerrado');
      set(el, '.cs-palabra', e.abierto ? 'Abierto' : 'Cerrado');
      set(el, '.cs-detalle', e.abierto ? 'cierra a ' + alas(e.cierra) : e.k >= 0 ? 'abre ' + cuando(e.k, e.dia, t) + ' a ' + alas(e.abre) : 'consulta el horario');
      set(el, '.cs-falta', e.abierto ? 'quedan ' + duracion(e.falta) : e.k >= 0 ? 'faltan ' + duracion(e.falta) : '');
    }
    var linea = el.querySelector('.cs-clase');
    if (linea && Array.isArray(d.clases)){
      var f = norm(el.getAttribute('data-consola-filtro'));
      var cl = d.clases.filter(function(x){ return !f || norm(x.sala).indexOf(f) > -1 || norm(x.actividad).indexOf(f) > -1; });
      linea.hidden = !cl.length;
      if (cl.length){
        var p = proximaClase(cl, t), etq = el.getAttribute('data-consola-etiqueta'), txt;
        if (p){
          txt = p.c.actividad + ', ' + (p.curso ? 'ahora, hasta ' + alas(p.h.fin) : cuando(p.k, p.d, t) + ' a ' + alas(p.h.ini));
          etq = etq || 'Próxima clase';
        } else {
          var conHora = cl.filter(function(x){ return x.hora; })[0];
          txt = conHora ? conHora.actividad + ': ' + conHora.hora + (conHora.fuente ? ' · ' + conHora.fuente : '') : cl[0].actividad + ': pregunta la hora';
          etq = etq || 'Clases';
        }
        set(el, '.cs-etq', etq); set(el, '.cs-clase-txt', txt);
      }
    }
    var fuente = el.getAttribute('data-consola-fuente') || '', fecha = fechaCorta(d.actualizado);
    set(el, '.cs-pie', fuente + (fuente && fecha ? ' · ' : '') + (fecha ? 'Actualizado el ' + fecha : ''));
  }
  function usar(el, datos){ el._cs.datos = datos; el._cs.H = leerHorario(datos.horario); pintar(el); }

  /* Arranque: líneas por segmentos y el reloj que sube de 00:00 a la hora real (600 ms) */
  function arrancar(el){
    el.classList.remove('cs-espera'); el.classList.add('cs-arranca');
    var c = el._cs, fin = (c.simulado || ahora(c.zona)).min, t0 = performance.now();
    c.contando = true;
    (function paso(t){
      var p = Math.min(1, (t - t0) / 600), v = Math.round(fin * (1 - Math.pow(1 - p, 3)));
      set(el, '.cs-hh', ('0' + Math.floor(v / 60)).slice(-2)); set(el, '.cs-mm', ('0' + v % 60).slice(-2));
      if (p < 1) requestAnimationFrame(paso); else { c.contando = false; pintar(el); }
    })(t0);
  }

  var io = hayIO ? new IntersectionObserver(function(es){
    es.forEach(function(e){
      var el = e.target; el.classList.toggle('cs-en-pantalla', e.isIntersecting);
      if (e.isIntersecting && el.classList.contains('cs-espera')) arrancar(el);
    });
  }, {rootMargin:'0px 0px -10% 0px'}) : null;

  document.querySelectorAll('.consola').forEach(function(el){
    el._cs = {zona:el.getAttribute('data-consola-zona') || 'Europe/Madrid', datos:null, H:{}, simulado:null, contando:false};
    if (io && !reducido) el.classList.add('cs-espera');
    if (io) io.observe(el); else el.classList.add('cs-en-pantalla');
    var dentro = el.querySelector('script.cs-datos'), url = el.getAttribute('data-consola');
    if (dentro){ try{ usar(el, JSON.parse(dentro.textContent)); }catch(e){ pintar(el); } }
    else pintar(el);
    if (url && window.fetch) fetch(url, {cache:'no-cache'}).then(function(r){ if (!r.ok) throw r.status; return r.json(); })
      .then(function(d){ usar(el, d); }).catch(function(){ /* sin JSON: se queda el texto del HTML */ });
    setInterval(function(){ pintar(el); }, 10000);
  });

  window.ConsolaEstado = {
    pintar: pintar,
    simular: function(el, t){ el._cs.simulado = t || null; pintar(el); }
  };
})();
/* ================== FIN COMPONENTE: consola-estado (JS) ================== */
