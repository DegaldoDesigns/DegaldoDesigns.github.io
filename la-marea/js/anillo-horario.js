/* La Marea · COPIA LITERAL del script de 01-Libreria-de-Codigo/componentes/anillo-horario.html (M86 v2, 2026-10-24): v1 (tarjeta viva) + v2 (.ah-mareas, la firma). No editar aquí: se cambia allí y se vuelve a copiar. */
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

/* M86 v2: la semana (data-ah-escala="semana") y el reloj de plazo (.ah-mareas). Por tiempo, nunca ligado al scroll */
(function(){
  var D = document, H = D.documentElement;
  var NS = 'http://www.w3.org/2000/svg', SEM = 10080, R = 44, CIRC = 'M50 6A44 44 0 1 1 50 94A44 44 0 1 1 50 6';
  var DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], CORTO = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  var LETRA = ['D','L','M','X','J','V','S'];
  var EIO = 'cubic-bezier(.77,0,.175,1)', EO = 'cubic-bezier(.23,1,.32,1)';
  var MUELLE = (window.CSS && CSS.supports('transition-timing-function', 'linear(0, 1)')) ? 'linear(0, .006, .025 2.8%, .101 6.1%, .539 18.9%, .721 25.3%, .849 31.5%, .937 38.1%, .968 41.8%, .991 45.7%, 1.006 50.1%, 1.015 55%, 1.017 63.9%, 1.001 85.3%, 1)' : EO;
  var red = matchMedia('(prefers-reduced-motion: reduce)').matches || H.classList.contains('ah-simula-reducido');
  var TX = {asap:'Si lo encargas ahora, desde {cuando}.', cerrado:'Abrimos {apertura}. Si lo encargas entonces, desde {cuando}.',
    dia:'Para {objetivo}: encárgalo como tarde {plazo}, {antelacion} antes de la hora a la que vengas.',
    diaCierre:'Para {objetivo}: encárgalo como tarde {plazo} ({cerrados} cerramos).',
    tarde:'Para {este} ya no llega: para el siguiente, encárgalo como tarde {plazo}.'};
  var TC = {asap:['Desde {corto}', 'si lo encargas ahora'], cerrado:['Desde {corto}', 'si lo encargas {encargo}'],
    dia:['Como tarde {plazoCorto}', 'para {objetivo}'], tarde:['Como tarde {plazoCorto}', 'para el siguiente {nombre}']};

  function ahora(zona){
    try{
      var o = {};
      new Intl.DateTimeFormat('en-US', {timeZone:zona, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour % 24) * 60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours() * 60 + n.getMinutes()}; }
  }
  function hora(m){ if (m > 1440) m -= 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function art(m){ var h = Math.floor((m > 1440 ? m - 1440 : m) / 60); return (h === 1 ? 'la ' : 'las ') + hora(m); }
  function el(tag, at){ var e = D.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  function pt(r, g){ var a = g * Math.PI / 180; return (50 + r * Math.sin(a)).toFixed(3) + ' ' + (50 - r * Math.cos(a)).toFixed(3); }
  function arcoG(r, g0, g1){ return 'M' + pt(r, g0) + 'A' + r + ' ' + r + ' 0 ' + (g1 - g0 > 180 ? 1 : 0) + ' 1 ' + pt(r, g1); }
  function json(s){ try{ return s ? JSON.parse(s) : null; }catch(e){ return null; } }
  function fmt(s, d){ return s.replace(/\{(\w+)\}/g, function(m, k){ return d[k] != null ? d[k] : m; }); }
  function lista(a){ return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' y ' + a[a.length - 1]; }
  function dist(a, b){ var d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); }

  /* El modelo: tramos en minutos absolutos desde las 0:00 de HOY (k = día relativo). Funciones puras */
  function modelo(dias, t, inicio){
    var iv = [];
    for (var k = -15; k <= 22; k++){ var w = ((t.d + k) % 7 + 7) % 7;
      (dias[w] || []).forEach(function(x){ iv.push({a:k * 1440 + x[0], b:k * 1440 + x[1], k:k, wd:w}); }); }
    iv.sort(function(p, q){ return p.a - q.a; });
    var M = {iv:iv, t:t,
      wd:function(k){ return ((t.d + k) % 7 + 7) % 7; },
      dia:function(x){ return Math.floor(x / 1440); },
      en:function(x){ for (var i = 0; i < iv.length; i++) if (x >= iv[i].a && x < iv[i].b) return iv[i]; return null; },
      prox:function(x){ for (var i = 0; i < iv.length; i++) if (iv[i].a >= x) return iv[i]; return null; },
      tramos:function(k){ return iv.filter(function(v){ return v.k === k; }); },
      abre:function(k){ return Math.min.apply(null, M.tramos(k).map(function(v){ return v.a; })); },
      cierra:function(k){ return Math.max.apply(null, M.tramos(k).map(function(v){ return v.b; })); },
      pos:function(w){ return ((w - inicio) % 7 + 7) % 7; },
      ang:function(x){ var k = Math.floor(x / 1440); return (M.pos(M.wd(k)) * 1440 + x - k * 1440) / SEM * 360; },
      otraSemana:function(k){ return k >= 7 || (k >= 5 && M.pos(t.d) + k >= 7); }
    };
    return M;
  }
  function relDia(M, k){ var w = M.wd(k); return k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + DIA[w] + (M.otraSemana(k) ? ' de la semana que viene' : ''); }
  function relCorto(M, k){ var w = M.wd(k); return k === 0 ? 'hoy' : k === 1 ? 'mañana' : 'el ' + DIA[w] + (M.otraSemana(k) ? ' que viene' : ''); }

  /* La cuenta. modo: 'asap' o el número de día (0 domingo … 6 sábado). Devuelve null si no hay horario */
  function calcula(o, t, modo){
    var M = modelo(o.dias, t, o.inicio), P = o.plazo, now = t.min, vNow = M.en(now), d, caso;
    var ant = P % 60 ? P + ' minutos' : (P / 60) + (P === 60 ? ' hora' : ' horas');
    if (modo === 'asap'){
      var px = vNow ? null : M.prox(now), enc = vNow ? now : px && px.a;
      if (enc == null) return null;
      var lis = enc + P, vL = M.en(lis), serv = lis, conHora = false;
      if (!vL || M.dia(lis) !== vL.k){ var nx = M.prox(lis); if (!nx) return null; serv = nx.a; conHora = true; }
      var kS = M.dia(serv), kE = M.dia(enc);
      d = {cuando:relDia(M, kS) + (conHora ? ', a partir de ' + art(serv - kS * 1440) : ''), corto:relCorto(M, kS),
        apertura:relDia(M, kE) + ' a ' + art(enc - kE * 1440), encargo:relCorto(M, kE), antelacion:ant};
      caso = vNow ? 'asap' : 'cerrado';
      return {modo:'asap', M:M, a0:enc, a1:lis, a2:serv, caso:caso, d:d, dia:DIA[M.wd(kS)], k:kS, conHora:conHora, etiqueta:true};
    }
    var dw = +modo;
    if (!(o.dias[dw] || []).length) return null;
    var kHoy = vNow && vNow.k < 0 ? -1 : 0, pd = Math.ceil(P / 1440), kT = 0, k0;
    while (M.wd(kT) !== dw) kT++;
    k0 = kT;
    function plazoDe(kT){ var kP = kT - pd, salt = [];
      for (var g = 0; g < 7 && !M.tramos(kP).length; g++){ salt.unshift(DIA[M.wd(kP)]); kP--; }
      return {kP:kP, salt:salt}; }
    var p = (kT === 0 && P > 0) ? null : plazoDe(kT), tarde = false;
    if (!p || p.kP < kHoy || (p.kP === kHoy && now >= M.cierra(p.kP))){ tarde = true; kT += 7; p = plazoDe(kT); }
    var Tabs = M.abre(kT), ini = Math.min(Math.max(Tabs - P, M.abre(p.kP)), M.cierra(p.kP));
    var cola = p.kP === kHoy && kHoy === -1, wP = DIA[M.wd(p.kP)];
    d = {objetivo:kT === 1 ? 'mañana' : 'el ' + DIA[dw] + (M.otraSemana(kT) && !tarde ? ' de la semana que viene' : ''),
      nombre:DIA[dw], este:k0 === 0 ? 'hoy' : 'este ' + DIA[dw], cerrados:lista(p.salt), antelacion:ant,
      plazo:cola ? 'ahora, antes de ' + art(M.cierra(p.kP) - p.kP * 1440) : p.kP === 0 ? 'hoy ' + wP : p.kP === 1 ? 'mañana ' + wP : relDia(M, p.kP),
      plazoCorto:cola ? 'ahora' : relCorto(M, p.kP)};
    caso = tarde ? 'tarde' : p.salt.length ? 'diaCierre' : 'dia';
    return {modo:'dia', M:M, a0:ini, a1:Tabs, a2:Tabs, caso:caso, d:d, dia:DIA[dw], k:kT, kPlazo:p.kP, tarde:tarde, etiqueta:Tabs - ini === P};
  }
  function textos(o, s){ var c = o.tc[s.caso === 'diaCierre' ? 'dia' : s.caso];
    return {texto:fmt(o.tx[s.caso], s.d), c1:fmt(c[0], s.d), c2:fmt(c[1], s.d)}; }

  /* La esfera de la semana: minuto a minuto (2 abierto, 1 día cerrado, 0 resto) y arcos por tramos seguidos */
  function corridas(a, v){
    var N = a.length, out = [], i0 = -1, j, s;
    for (j = 0; j < N; j++) if (a[j] !== a[(j + N - 1) % N]){ i0 = j; break; }
    if (i0 < 0) return a[0] === v ? [[0, N]] : [];
    for (j = 0; j < N;){ if (a[(i0 + j) % N] !== v){ j++; continue; }
      s = i0 + j; while (j < N && a[(i0 + j) % N] === v) j++; out.push([s, i0 + j]); }
    return out;
  }
  function dibujaSemana(ah, o){
    var svg = ah.querySelector('.ah-anillo'), ref = ah.querySelector('.ah-centro');
    [].forEach.call(svg.querySelectorAll('.ah-sem'), function(n){ n.remove(); });
    [].forEach.call(ah.querySelectorAll('.ah-dia, .ah-cerrado'), function(n){ n.remove(); });
    var est = new Uint8Array(SEM), w, m, p, g = el('g', {'class':'ah-sem'}), cerr = [], cerradoDia = [];
    function posW(w){ return ((w - o.inicio) % 7 + 7) % 7; }
    for (w = 0; w < 7; w++) if (!(o.dias[w] || []).length){ cerradoDia[posW(w)] = 1; for (m = 0; m < 1440; m++) est[posW(w) * 1440 + m] = 1; }
    for (w = 0; w < 7; w++) (o.dias[w] || []).forEach(function(x){ for (var m = x[0]; m < x[1]; m++) est[(posW(w) * 1440 + m) % SEM] = 2; });
    function arcos(v, cls){ corridas(est, v).forEach(function(c){
      g.appendChild(el('path', {'class':cls, d:c[1] - c[0] >= SEM ? CIRC : arcoG(R, c[0] / SEM * 360, c[1] / SEM * 360)})); }); }
    arcos(0, 'ah-sem-pista'); arcos(1, 'ah-sem-cerrado');
    for (p = 0; p < 7; p++){ var a = p / 7 * 2 * Math.PI;
      g.appendChild(el('line', {'class':'ah-sem-marca', x1:(50 + 39.5 * Math.sin(a)).toFixed(3), y1:(50 - 39.5 * Math.cos(a)).toFixed(3), x2:(50 + 48.5 * Math.sin(a)).toFixed(3), y2:(50 - 48.5 * Math.cos(a)).toFixed(3)})); }
    arcos(2, 'ah-sem-tramo');
    svg.insertBefore(g, svg.firstChild);
    function etiqueta(cls, txt, gr, extra){ var s = D.createElement('span'); s.className = cls; s.setAttribute('aria-hidden', 'true'); s.textContent = txt;
      s.style.setProperty('--sx', Math.sin(gr * Math.PI / 180).toFixed(4)); s.style.setProperty('--cy', Math.cos(gr * Math.PI / 180).toFixed(4));
      for (var k in extra) s.setAttribute(k, extra[k]); ah.insertBefore(s, ref); return s; }
    for (p = 0; p < 7; p++){ w = (p + o.inicio) % 7; etiqueta('ah-dia', (o.letras && o.letras[p]) || LETRA[w], (p + .5) / 7 * 360, {'data-wd':w}); }
    var cd = new Uint8Array(7); for (p = 0; p < 7; p++) cd[p] = cerradoDia[p] ? 1 : 0;
    if (o.cerradoTexto) corridas(cd, 1).forEach(function(c){ if (c[1] - c[0] >= 7) return; var gr = (c[0] + c[1]) / 2 / 7 * 360;
      cerr.push({g:gr % 360, n:etiqueta('ah-cerrado', o.cerradoTexto, gr, {})}); });
    return cerr;
  }
  function opciones(ah){
    var cfg = json(ah.getAttribute('data-horario')); if (!cfg) return null;
    var tc = {}, extra = json(ah.getAttribute('data-ah-centro')) || {}, k, inicio = parseInt(ah.getAttribute('data-ah-inicio'), 10);
    for (k in TC) tc[k] = extra[k] || TC[k];
    function at(n, def){ var v = ah.getAttribute(n); return v == null ? def : v; }
    return {zona:cfg.zona || 'Europe/Madrid', dias:cfg.dias || {}, inicio:isNaN(inicio) ? 1 : ((inicio % 7) + 7) % 7,
      plazo:parseInt(at('data-ah-plazo', '1440'), 10) || 0, letras:json(ah.getAttribute('data-ah-letras')),
      cerradoTexto:at('data-ah-cerrado-texto', 'cerrado'), etiqueta:at('data-ah-etiqueta', '24 h'),
      tx:{asap:at('data-ah-texto-asap', TX.asap), cerrado:at('data-ah-texto-cerrado', TX.cerrado), dia:at('data-ah-texto-dia', TX.dia),
        diaCierre:at('data-ah-texto-dia-cierre', TX.diaCierre), tarde:at('data-ah-texto-tarde', TX.tarde)}, tc:tc};
  }

  function iniciar(ah, n){
    var o = opciones(ah); if (!o) return;
    var svg = ah.querySelector('.ah-anillo'), mareas = ah.classList.contains('ah-mareas'), pin = null, cerr = dibujaSemana(ah, o);
    var aguja = el('g', {'class':'ah-ahora'});
    aguja.appendChild(el('circle', {'class':'ah-halo', cx:50, cy:6, r:5.6}));
    aguja.appendChild(el('circle', {'class':'ah-punto', cx:50, cy:6, r:mareas ? 2.4 : 3.2}));
    svg.appendChild(aguja);
    var padre = ah.parentElement;
    var est = D.getElementById(ah.getAttribute('data-estado-en') || '') || (function(x){ while (x && !(x.classList && x.classList.contains('ah-estado'))) x = x.nextElementSibling; return x; })(ah.nextElementSibling);
    function T(){ return pin || ahora(o.zona); }
    function set(nodo, sel, v){ var x = nodo && nodo.querySelector(sel); if (x && x.textContent !== v) x.textContent = v; }
    function pintaAhora(){
      var t = T(), M = modelo(o.dias, t, o.inicio), v = M.en(t.min);
      ah.setAttribute('data-estado', v ? 'abierto' : 'cerrado');
      aguja.style.rotate = M.ang(t.min).toFixed(2) + 'deg';
      [].forEach.call(ah.querySelectorAll('.ah-dia'), function(s){ s.classList.toggle('ah-es-hoy', +s.getAttribute('data-wd') === t.d); });
      if (est){ var nx = v ? null : M.prox(t.min), kx = nx ? M.dia(nx.a) : 0;
        set(est, '.ah-palabra', v ? 'Abierto' : 'Cerrado');
        set(est, '.ah-detalle', v ? 'hasta ' + art(v.b - v.k * 1440) : !nx ? 'consulta el horario'
          : (kx === 0 ? 'abrimos hoy' : kx === 1 ? 'abrimos mañana' : 'abrimos el ' + DIA[M.wd(kx)]) + ' a ' + art(nx.a - kx * 1440)); }
      ah.classList.add('ah-listo');
    }
    var io = null;
    if ('IntersectionObserver' in window){
      io = new IntersectionObserver(function(e){ ah.classList.toggle('ah-fuera', !e[e.length - 1].isIntersecting); });
      io.observe(ah);
    }
    if (!mareas){
      pintaAhora(); setInterval(pintaAhora, 60000);
      ah._ah = function(op){ if (op && op.estatico) return estatico(ah); if (op && 'ahora' in op){ pin = op.ahora; pintaAhora(); } };
      return;
    }

    /* ---- el plazo ---- */
    var id = 'ah-m' + n + '-' + Math.random().toString(36).slice(2, 7);
    var defs = el('defs', {}), mascara = el('mask', {id:id, maskUnits:'userSpaceOnUse', x:-5, y:-5, width:110, height:110});
    var mascP = el('path', {'class':'ah-extra-mascara', d:CIRC, pathLength:1});
    mascara.appendChild(mascP); defs.appendChild(mascara);
    var plazoG = el('g', {'class':'ah-plazo-grupo'}), estela = el('path', {'class':'ah-estela', d:CIRC, pathLength:1});
    var extraG = el('g', {'class':'ah-extra-grupo'}), extra = el('path', {'class':'ah-extra', d:CIRC, mask:'url(#' + id + ')'});
    var marcador = el('g', {'class':'ah-marcador'}), pulso = el('g', {'class':'ah-pulso'});
    pulso.appendChild(el('circle', {cx:50, cy:6, r:3.2})); marcador.appendChild(pulso); extraG.appendChild(extra);
    plazoG.appendChild(estela); plazoG.appendChild(extraG); plazoG.appendChild(marcador);
    svg.appendChild(defs); svg.appendChild(plazoG);
    var brazo = D.createElement('span'), etq = D.createElement('span');
    brazo.className = 'ah-brazo'; brazo.setAttribute('aria-hidden', 'true'); etq.className = 'ah-etiqueta'; etq.textContent = o.etiqueta;
    brazo.appendChild(etq); ah.insertBefore(brazo, ah.querySelector('.ah-centro'));
    var centro = ah.querySelector('.ah-centro-texto'), c1 = ah.querySelector('.ah-c1'), c2 = ah.querySelector('.ah-c2');
    var res = D.getElementById(ah.getAttribute('data-ah-resultado-en') || '') || (padre && padre.querySelector('[data-ah-resultado]'));
    var sel = D.getElementById(ah.getAttribute('data-ah-selector-en') || '') || (padre && padre.querySelector('[data-ah-selector]'));
    var elegido = 'asap', cur = null, hecho = false, anim = {a:[], t:[], on:false}, ultimo = null;

    if (sel){
      if (sel.getAttribute('data-ah-selector') === 'auto'){
        [].slice.call(sel.children).forEach(function(c){ if (c.tagName !== 'LEGEND') c.remove(); });
        var nombre = 'ah-dia-' + id, opc = [['asap', ah.getAttribute('data-ah-asap-texto') || 'Lo antes posible']];
        for (var p = 0; p < 7; p++){ var w = (p + o.inicio) % 7; if ((o.dias[w] || []).length) opc.push([String(w), CORTO[w]]); }
        opc.forEach(function(x, i){ var l = D.createElement('label'), r = D.createElement('input');
          l.className = 'ah-pildora'; r.type = 'radio'; r.name = nombre; r.value = x[0]; if (!i) r.checked = true;
          l.appendChild(r); l.appendChild(D.createTextNode(x[1])); sel.appendChild(l); });
      }
      sel.hidden = false;
    }
    function marcaRadios(){ if (!sel) return; [].forEach.call(sel.querySelectorAll('input[type="radio"]'), function(r){
      r.checked = r.value === elegido; r.parentElement.classList.toggle('ah-elegida', r.checked); }); }
    function clave(){ return 'ah:' + location.pathname + ':' + (ah.id || n); }
    function visto(poner){ try{ if (poner) sessionStorage.setItem(clave(), '1'); else return sessionStorage.getItem(clave()) === '1'; }catch(e){} }
    function aviso(s, tx){ ah.dispatchEvent(new CustomEvent('reloj:posado', {bubbles:true, detail:{dia:s.dia, texto:tx.texto}})); }
    function escribe(tx, fundido){
      var cambia = !c1 || c1.textContent !== tx.c1 || (c2 && c2.textContent !== tx.c2);
      if (c1 && c1.textContent !== tx.c1) c1.textContent = tx.c1; if (c2 && c2.textContent !== tx.c2) c2.textContent = tx.c2;
      if (res && res.textContent !== tx.texto) res.textContent = tx.texto;
      if (res && !res.hasAttribute('aria-live')) res.setAttribute('aria-live', 'polite');   // tras la primera frase
      if (centro && !red && ultimo != null && (cambia || fundido) && centro.animate) centro.animate([{opacity:.15}, {opacity:1}], {duration:200, easing:EO});
    }
    function angulos(s){ var g0 = s.M.ang(s.a0); return {g0:g0, g1:g0 + (s.a1 - s.a0) / SEM * 360, g2:g0 + (s.a2 - s.a0) / SEM * 360}; }
    function pon(s, trans){   // deja el estado final en estilos en línea (con transiciones CSS si trans)
      var g = angulos(s);
      if (cur){ var sh = 360 * Math.round((cur.g2 - g.g2) / 360); g.g0 += sh; g.g1 += sh; g.g2 += sh; }
      ah.classList.toggle('ah-trans', !!trans && !red);
      marcador.style.rotate = g.g2.toFixed(3) + 'deg';
      estela.style.rotate = g.g0.toFixed(3) + 'deg';
      estela.style.strokeDashoffset = (1 - (g.g1 - g.g0) / 360).toFixed(5);
      var hay = s.a2 > s.a1;
      if (hay){ var dd = arcoG(R, g.g1, g.g2); extra.setAttribute('d', dd); mascP.setAttribute('d', dd); mascP.style.strokeDashoffset = 0; }
      extraG.style.transitionDelay = hay && trans ? '.26s' : '0s';
      extraG.style.opacity = hay ? 1 : 0;
      // la etiqueta: en la estela, lejos de los "cerrado"
      var L = g.g1 - g.g0, mid = null, f = [.5, .32, .68, .18, .82], i;
      for (i = 0; i < f.length && mid == null; i++){ var mm = g.g0 + L * f[i]; if (cerr.every(function(c){ return dist(mm, c.g) >= 26; })) mid = mm; }
      var tapa = mid == null; if (tapa) mid = g.g0 + L / 2;
      cerr.forEach(function(c){ c.n.classList.toggle('ah-tapado', tapa && s.etiqueta && dist(mid, c.g) < 26); });
      if (cur && cur.mid != null) mid += 360 * Math.round((cur.mid - mid) / 360);
      g.mid = mid;
      brazo.style.rotate = mid.toFixed(3) + 'deg'; etq.style.rotate = (-mid).toFixed(3) + 'deg';
      etq.style.opacity = s.etiqueta && o.etiqueta && L >= 12 ? 1 : 0;
      cur = g; return g;
    }
    function antes(s){   // el punto de partida: marcador en el inicio, estela recogida
      var g = pon(s, false);
      marcador.style.rotate = g.g0.toFixed(3) + 'deg'; estela.style.strokeDashoffset = 1; mascP.style.strokeDashoffset = 1; etq.style.opacity = 0;
    }
    function para(){ anim.t.forEach(clearTimeout); anim.t = []; anim.a.forEach(function(a){ a.cancel(); }); anim.a = []; anim.on = false;
      if (anim.rs){ removeEventListener('resize', anim.rs); anim.rs = null; } }
    function calc(m){ return calcula(o, T(), m === 'asap' ? 'asap' : +m); }
    function posa(s){ para(); var tx = textos(o, s); pon(s, false); escribe(tx, false); ultimo = tx.texto; aviso(s, tx); }
    function recorre(repetir){
      if (!repetir){ if (hecho) return; hecho = true; visto(true); }
      para(); elegido = 'asap'; marcaRadios();
      var s = calc('asap'); if (!s) return;
      if (D.hidden) return posa(s);
      var tx = textos(o, s), g = pon(s, false); escribe(tx, false); ultimo = tx.texto;
      if (red){ anim.a.push(plazoG.animate([{opacity:0}, {opacity:1}], {duration:300, easing:EO}));
        if (o.etiqueta && s.etiqueta) anim.a.push(etq.animate([{opacity:0}, {opacity:1}], {duration:300, easing:EO}));
        anim.t.push(setTimeout(function(){ para(); aviso(s, tx); }, 310)); return; }
      var L1 = (g.g1 - g.g0) / 360, fin = 1060;
      function mete(e, k, op){ anim.a.push(e.animate(k, op)); }
      mete(pulso, [{scale:1}, {scale:1.25}, {scale:1}], {duration:160, easing:EO});
      mete(marcador, [{rotate:g.g0 + 'deg'}, {rotate:g.g1 + 'deg'}], {duration:900, delay:160, easing:EIO, fill:'both'});
      mete(estela, [{strokeDashoffset:1}, {strokeDashoffset:1 - L1}], {duration:900, delay:160, easing:EIO, fill:'both'});
      if (+etq.style.opacity) mete(etq, [{opacity:0}, {opacity:1}], {duration:160, delay:530, easing:EO, fill:'both'});
      if (s.a2 > s.a1){
        mete(marcador, [{rotate:g.g1 + 'deg'}, {rotate:g.g2 + 'deg'}], {duration:400, delay:1060, easing:EO, fill:'forwards'});
        mete(mascP, [{strokeDashoffset:1}, {strokeDashoffset:0}], {duration:400, delay:1060, easing:EO, fill:'both'});
        fin = 1460;
      }
      anim.on = true;
      anim.t.push(setTimeout(function(){ mete(pulso, [{scale:1.15}, {scale:1}], {duration:160, easing:MUELLE}); escribe(tx, true); }, fin));
      anim.t.push(setTimeout(function(){ para(); aviso(s, tx); }, fin + 170));
      var w0 = innerWidth; anim.rs = function(){ if (innerWidth !== w0) posa(s); }; addEventListener('resize', anim.rs);   // solo el ancho
    }
    function congela(){   // a mitad de la entrada: fija lo que se ve y deja que la transición siga desde ahí
      var r = getComputedStyle(marcador).rotate, of = getComputedStyle(estela).strokeDashoffset, eo = getComputedStyle(etq).opacity;
      para(); ah.classList.remove('ah-trans'); marcador.style.rotate = r; estela.style.strokeDashoffset = of; etq.style.opacity = eo; mascP.style.strokeDashoffset = 0;
      void ah.offsetWidth;
    }
    function elige(v){
      elegido = v; hecho = true; marcaRadios();
      if (anim.on) congela();
      var s = calc(v); if (!s) return;
      var tx = textos(o, s); pon(s, true); escribe(tx, true); ultimo = tx.texto; aviso(s, tx);
    }
    if (sel) sel.addEventListener('change', function(e){ if (e.target && e.target.name && e.target.type === 'radio') elige(e.target.value); });
    D.addEventListener('visibilitychange', function(){ if (D.hidden && anim.on){ var s = calc('asap'); if (s) posa(s); } });
    function cada(){   // cada 60 s, sin animación
      pintaAhora(); if (anim.on) return;
      var s = calc(elegido); if (!s) return;
      var tx = textos(o, s);
      if (hecho) pon(s, false); else antes(s);
      if (tx.texto !== ultimo){ escribe(tx, false); ultimo = tx.texto; }
    }
    pintaAhora(); marcaRadios();
    var s0 = calc('asap');
    if (s0){ var t0 = textos(o, s0); escribe(t0, false); ultimo = t0.texto;
      if (ah.getAttribute('data-una-vez') === 'sesion' && visto()){ hecho = true; pon(s0, false); } else antes(s0); }
    setInterval(cada, 60000);
    ah._ah = function(op){
      op = op || {};
      if (op.estatico) return estatico(ah);
      if ('ahora' in op){ pin = op.ahora; para(); pintaAhora(); var s = calc(op.repetir ? 'asap' : elegido); if (s){ var tx = textos(o, s); pon(s, false); escribe(tx, false); ultimo = tx.texto; } }
      if (op.repetir) recorre(true);
    };
    if (!s0 || hecho) return;
    if (!io) return recorre();
    var um = parseFloat(ah.getAttribute('data-ah-umbral')) || .5, es = parseInt(ah.getAttribute('data-ah-espera'), 10), dentro = false, tm;
    if (isNaN(es)) es = 150;
    um = Math.min(um, .95 * innerHeight / Math.max(1, ah.getBoundingClientRect().height));   // si no cabe, lo que quepa
    function espera(){ clearTimeout(tm); if (dentro) tm = setTimeout(function(){
      if (!dentro) return; io2.disconnect(); removeEventListener('scroll', espera); recorre(); }, es); }
    var io2 = new IntersectionObserver(function(e){ dentro = e[e.length - 1].intersectionRatio >= um - .01; espera(); }, {threshold:[0, um]});
    io2.observe(ah); addEventListener('scroll', espera, {passive:true});
  }
  function estatico(ah){   // el marcado de la esfera sin marcadores, para pegarlo en el HTML (respaldo sin JS)
    var c = ah.cloneNode(true);
    [].forEach.call(c.querySelectorAll('.ah-ahora, defs, .ah-plazo-grupo, .ah-brazo'), function(x){ x.remove(); });
    [].forEach.call(c.querySelectorAll('.ah-es-hoy, .ah-tapado'), function(x){ x.classList.remove('ah-es-hoy', 'ah-tapado'); });
    var s = c.querySelector('.ah-sem'), sp = [].map.call(c.querySelectorAll('.ah-dia, .ah-cerrado'), function(x){ return x.outerHTML; }).join('');
    return {svg:s ? s.outerHTML : '', spans:sp};
  }

  window.anilloHorario = function(el, op){ if (el && el._ah) return el._ah(op); };
  window.anilloHorario.semana = function(dias, t, op){   // funciones puras, x = minutos desde las 0:00 de hoy
    op = op || {}; var o = {dias:dias, inicio:op.inicio == null ? 1 : op.inicio, plazo:op.plazo == null ? 1440 : op.plazo, tx:TX, tc:TC};
    var M = modelo(dias, t, o.inicio);
    return {abierto:function(x){ return !!M.en(x); },
      proxApertura:function(x){ var v = M.prox(x); return v && {k:M.dia(v.a), dia:DIA[v.wd], min:v.a - M.dia(v.a) * 1440}; },
      listo:function(x){ var l = x + o.plazo, v = M.en(l); if (v && M.dia(l) === v.k) return {k:M.dia(l), dia:DIA[M.wd(M.dia(l))], conHora:false};
        var nx = M.prox(l); return nx && {k:M.dia(nx.a), dia:DIA[nx.wd], min:nx.a - M.dia(nx.a) * 1440, conHora:true}; },
      plazoPara:function(dia){ var s = calcula(o, t, dia); return s && {texto:textos(o, s).texto, k:s.kPlazo, tarde:s.tarde, cerrados:s.d.cerrados}; },
      resultado:function(modo){ var s = calcula(o, t, modo); return s && {caso:s.caso, dia:s.dia, k:s.k, texto:textos(o, s).texto, centro:[textos(o, s).c1, textos(o, s).c2]}; }};
  };
  if (!H.classList.contains('js')) return;                      // sin .js: la esfera estática y el texto del HTML
  [].forEach.call(D.querySelectorAll('.ah[data-ah-escala="semana"][data-horario]'), iniciar);
})();
