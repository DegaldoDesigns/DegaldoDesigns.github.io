/* Clínica Veterinaria De Galdo · JS común (borrador 2026-10-21).
   Cada bloque sale de un componente de 01-Libreria-de-Codigo/componentes/ (indicado en su comentario). */
(function(){
  'use strict';
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hayIO = 'IntersectionObserver' in window;
  function cada(sel, fn, raiz){ Array.prototype.forEach.call((raiz || document).querySelectorAll(sel), fn); }

  /* ---------- HORARIO Y ESTADO (cartel-abierto-cerrado, M47) ----------
     Lunes a viernes, 10:30-14:00 y 17:30-20:30. Sábados con cita (sin horas: nunca se calcula como abierto).
     Domingo cerrado. Festivos y agosto: no se dicen (no se pueden calcular ni están confirmados). */
  var ZONA = 'Europe/Madrid';
  var T = [[10*60+30, 14*60], [17*60+30, 20*60+30]];
  var HORARIO = {1:T, 2:T, 3:T, 4:T, 5:T};
  var DIA_CITA = 6;
  var NOMBRE_DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var TXT_CITA = 'Sábados, con cita: llama antes';
  function ahora(){
    try{
      var o = {};
      new Intl.DateTimeFormat('en-US', {timeZone:ZONA, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour)*60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours()*60 + n.getMinutes()}; }
  }
  function hh(m){ return ('0' + Math.floor(m/60)).slice(-2) + ':' + ('0' + (m%60)).slice(-2); }
  function duracion(m){
    var d = Math.floor(m/1440), h = Math.floor((m%1440)/60), mi = m%60;
    if (d > 0) return d + ' d' + (h ? ' ' + h + ' h' : '');
    if (h > 0) return h + ' h' + (mi ? ' ' + mi + ' min' : '');
    return mi + ' min';
  }
  function estado(t){
    var hoy = HORARIO[t.d] || [], i;
    for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {s:'abierto', cierra:hoy[i][1], falta:hoy[i][1] - t.min};
    if (t.d === DIA_CITA) return {s:'cita'};
    for (var k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++){
        var f = k*1440 + tr[i][0] - t.min;
        if (f > 0) return {s:'cerrado', k:k, dia:dia, abre:tr[i][0], falta:f, pasaSabado: k > 0 && t.d !== 0 && dia < t.d};
      }
    }
    return {s:'cerrado', k:-1};
  }
  function textos(e){
    if (e.s === 'abierto') return {palabra:'Abierto', det:'Cerramos a las ' + hh(e.cierra), cuenta:'Quedan ' + duracion(e.falta), pildora:'Abierto ahora, hasta las ' + hh(e.cierra), nota:''};
    if (e.s === 'cita') return {palabra:'Con cita', det:TXT_CITA, cuenta:'Entre semana, sin cita, desde el lunes a las 10:30', pildora:TXT_CITA, nota:''};
    if (e.k < 0) return {palabra:'Cerrado', det:'Consulta el horario', cuenta:'', pildora:'Consulta el horario', nota:''};
    var det = (e.k === 0 ? 'Hoy abrimos' : e.k === 1 ? 'Mañana abrimos' : 'Abrimos el ' + NOMBRE_DIA[e.dia]) + ' a las ' + hh(e.abre);
    return {palabra:'Cerrado', det:det, cuenta:'Faltan ' + duracion(e.falta), pildora:'Cerrado. ' + det, nota: e.pasaSabado ? TXT_CITA + '.' : ''};
  }
  function set(el, v){ if (el && el.textContent !== v) el.textContent = v; }
  function pintarEstado(){
    var t = ahora(), e = estado(t), x = textos(e);
    cada('[data-estado-vivo]', function(el){ el.setAttribute('data-estado', e.s); });
    cada('[data-estado-texto]', function(el){ set(el, x.pildora); });
    var cartel = document.getElementById('puertaWrap');
    if (cartel){
      set(document.getElementById('puertaEst'), x.palabra);
      set(document.getElementById('puertaDet'), x.det);
      set(document.getElementById('puertaCuenta'), x.cuenta || ' ');
      var nota = document.getElementById('puertaNota'); set(nota, x.nota); nota.hidden = !x.nota;
    }
    cada('.dia[data-dow]', function(li){ li.classList.toggle('hoy', +li.getAttribute('data-dow') === t.d); });
  }
  pintarEstado(); setInterval(pintarEstado, 30000);

  /* ---------- CABECERA (cabecera-inteligente, M18) ---------- */
  var cab = document.getElementById('cabecera');
  if (cab){
    if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && hayIO){
      var cent = document.querySelector('.centinela');
      if (cent) new IntersectionObserver(function(en){ cab.classList.toggle('pegada', !en[0].isIntersecting); }).observe(cent);
    }
    var ultimo = scrollY, pendC = false;
    addEventListener('scroll', function(){
      if (pendC) return; pendC = true;
      requestAnimationFrame(function(){
        pendC = false;
        var y = scrollY, d = y - ultimo;
        if (Math.abs(d) < 8) return;
        var menuAbierto = document.querySelector('#menu:popover-open');
        if (y < 120 || d < 0 || menuAbierto) cab.classList.remove('oculta'); else cab.classList.add('oculta');
        ultimo = y;
      });
    }, {passive:true});
  }

  /* ---------- MENÚ MÓVIL (menu-escalonado, M52) ---------- */
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb');
  if (menu && hamb){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width/2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height/2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){
      var abierto = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      if (!abierto) hamb.focus();
    });
    cada('a', function(a){ a.addEventListener('click', function(){ if (menu.hidePopover) try{ menu.hidePopover(); }catch(err){} }); }, menu);
  }

  /* ---------- TITULAR POR PALABRAS (titulares-animados, M01) ---------- */
  cada('.titular-palabras', function(h){
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
            p.style.setProperty('--i', Math.min(n++, 12));
            v.appendChild(p); frag.appendChild(v);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1 && hijo.tagName !== 'BR' && hijo.tagName !== 'svg'){ partir(hijo); }
      });
    })(h);
    if (reducido || !hayIO){ h.classList.add('visto'); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ h.classList.add('visto'); io.disconnect(); } }); }, {rootMargin:'0px 0px -8% 0px'});
    io.observe(h);
  });

  /* ---------- SUBRAYADO DE TRES FRANJAS (brochazo-marca: se observa el contenedor) ---------- */
  if (hayIO && !reducido){
    var ioS = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('pintada'); ioS.unobserve(e.target); } }); }, {rootMargin:'0px 0px -12% 0px'});
    cada('.rev-cont', function(el){ ioS.observe(el); });
  } else cada('.rev-cont', function(el){ el.classList.add('pintada'); });

  /* ---------- CIFRA QUE CUENTA (contador-cifras / movimiento-marca, M05): el valor final está escrito en el HTML ---------- */
  cada('.cuenta[data-fin]', function(el){
    if (reducido || !hayIO) return;
    var fin = parseFloat(el.dataset.fin), dec = +el.dataset.dec || 0, final = el.textContent;
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    var fmt = function(v){ return v.toFixed(dec).replace('.', ','); };
    el.textContent = fmt(0);
    var io = new IntersectionObserver(function(es){
      if (!es[0].isIntersecting) return; io.disconnect();
      var t0 = performance.now();
      (function paso(t){ var p = Math.min(1, (t - t0) / 1100), v = fin * (1 - Math.pow(1 - p, 3));
        el.textContent = p < 1 ? fmt(v) : final; if (p < 1) requestAnimationFrame(paso); })(t0);
    }, {threshold:.6});
    io.observe(el);
  });

  /* ---------- FRASE QUE SE ENCIENDE (texto-revelado-scroll v2, M14) ---------- */
  cada('.lee-texto', function(p){
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

  /* ---------- HUELLAS (huellas-rastro, M67) ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  var rastros = document.querySelectorAll('.huellas');
  Array.prototype.forEach.call(rastros, function(c){
    var n = Math.max(2, parseInt(c.dataset.n, 10) || 14);
    c.style.setProperty('--n', n);
    for (var i = 0; i < n; i++){
      var s = document.createElementNS(NS, 'svg'), u = document.createElementNS(NS, 'use');
      s.setAttribute('class', 'huella'); s.setAttribute('focusable', 'false'); s.style.setProperty('--i', i);
      u.setAttribute('href', '#huella'); s.appendChild(u); c.appendChild(s);
    }
  });
  if (!hayIO) Array.prototype.forEach.call(rastros, function(c){ c.classList.add('en-pantalla'); });
  else {
    var ioH = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('en-pantalla'); ioH.unobserve(e.target); } }); }, {threshold:.2, rootMargin:'0px 0px -12% 0px'});
    Array.prototype.forEach.call(rastros, function(c){ ioH.observe(c); });
  }

  /* ---------- PAUSA FUERA DE PANTALLA (movimiento-marca) ---------- */
  if (hayIO){
    var ioM = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    cada('.mov', function(el){ ioM.observe(el); });
  }

  /* ---------- MAPA SOLO AL PULSAR (ubicacion-mapa v3) ---------- */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa){
    btnMapa.addEventListener('click', function(){
      var caja = document.getElementById('mapa'), fachada = document.getElementById('fachada');
      if (!fachada) return;
      var f = document.createElement('iframe');
      f.src = caja.dataset.src;
      f.title = 'Mapa con la ubicación de la Clínica Veterinaria De Galdo';
      f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
      caja.appendChild(f); fachada.remove(); f.focus();
    });
  }

  /* ---------- BARRA FIJA DE MÓVIL (barra-pegajosa-movil) ---------- */
  var barraFija = document.getElementById('barraFija');
  if (barraFija){
    var act = function(){ barraFija.classList.toggle('visible', scrollY > innerHeight * .7); };
    addEventListener('scroll', function(){ requestAnimationFrame(act); }, {passive:true}); act();
  }

  /* ---------- DECORACIÓN CON PARALLAX SUAVE (decoracion-parallax; posición de la SECCIÓN, no del elemento) ---------- */
  var capas = Array.prototype.slice.call(document.querySelectorAll('[data-py]'));
  if (capas.length && !reducido){
    var pendP = null;
    var parallax = function(){ pendP = null; var vh = innerHeight;
      capas.forEach(function(el){ var sec = el.closest('section'); if (!sec) return; var r = sec.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height/2) - vh/2) / (vh + r.height);
        el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; });
    };
    addEventListener('scroll', function(){ if (!pendP) pendP = requestAnimationFrame(parallax); }, {passive:true});
    addEventListener('resize', parallax); parallax();
  }

  /* ---------- PAQUETE DE INTERACCIÓN (interacciones-cursor v3, M30): solo ratón y sin movimiento reducido ---------- */
  if (!raton || reducido) return;
  cada('.iman', function(b){
    b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width/2) * .22, y = (e.clientY - r.top - r.height/2) * .35;
      b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
    b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
  });
  cada('.foto-iman', function(f){
    var img = f.querySelector('img'), sello = f.querySelector('.sello');
    f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      f.style.translate = (x * 30).toFixed(1) + 'px ' + (y * 26).toFixed(1) + 'px';
      img.style.translate = (x * -14).toFixed(1) + 'px ' + (y * -12).toFixed(1) + 'px'; img.style.scale = '1.05';
      if (sello) sello.style.translate = (x * 26).toFixed(1) + 'px ' + (y * 20).toFixed(1) + 'px'; });
    f.addEventListener('pointerleave', function(){ f.style.translate = ''; img.style.translate = ''; img.style.scale = ''; if (sello) sello.style.translate = ''; });
  });
  var SEL = '.resena, .acceso, .celda, .faq details', pendR = null;
  document.addEventListener('mousemove', function(e){
    if (pendR) return;
    pendR = requestAnimationFrame(function(){ pendR = null;
      var el = e.target && e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
      var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
  });
})();
