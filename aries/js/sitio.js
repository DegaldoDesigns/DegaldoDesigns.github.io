/* Aries Bistro Bar (Villa de Vallecas) · demo de Degaldo Designs (2026-10-23)
   Piezas de la librería adaptadas: esquina-que-gira (M85, firma), anillo-horario (M86), borde-animado .brillo-rasante (M44 v2),
   marco-ventana .foto-escaparate (M58 v3, en CSS), fondo-hojas-vivo v3 (M82, baldosas propias), decoracion-parallax (M15),
   titulares-animados (M01), titular-entre-filetes (M71, filete bajo), cabecera-inteligente (M18), enlaces-hover (M61, en CSS),
   menu-escalonado (M52), menu-tabs-categorias + resaltado-deslizante (M53) + transiciones-vista (carta), marquee (M40, en CSS),
   texto-revelado-scroll v5 (M14), interacciones-cursor v3 (M30), ubicacion-mapa v3, acordeon-nativo y barra-pegajosa-movil.
   La carta se rellena en js/carta.js (window.CARTA). */
(function(){
  'use strict';
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;

  function alVerUnaVez(els, fn, opciones){
    if (!conIO || reducido){ els.forEach(fn); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(x){ if (x.isIntersecting){ fn(x.target); io.unobserve(x.target); } }); }, opciones || {rootMargin:'0px 0px -10% 0px'});
    els.forEach(function(el){ io.observe(el); });
  }

  /* ================= La carta (desde js/carta.js): pestañas solo de los apartados con platos ================= */
  (function(){
    var C = window.CARTA || {}, aps = (C.apartados || []).filter(function(a){ return a && a.platos && a.platos.length; });
    var espera = document.getElementById('cartaEspera'), viva = document.getElementById('cartaViva');
    if (!aps.length || !viva) return;                              // sin platos: se queda el respaldo
    var lista = viva.querySelector('[data-pestanas]'), paneles = document.getElementById('paneles');
    function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
    function precio(p){
      var lst = p.precios || (p.precio != null && p.precio !== '' ? [p.precio] : []);
      if (!lst.length) return null;
      var s = el('span', 'pl-precio');
      lst.forEach(function(x, i){
        if (i) s.appendChild(el('span', 'sep', '·'));
        if (Array.isArray(x)){ if (x[0]) s.appendChild(el('small', '', x[0])); s.appendChild(document.createTextNode(x[1] || '')); }
        else s.appendChild(document.createTextNode(String(x)));
      });
      return s;
    }
    aps.forEach(function(a, i){
      var id = 'ap-' + i, tab = el('button', 'pestana', a.pestana || a.nombre);
      tab.type = 'button'; tab.id = 't-' + id; tab.setAttribute('role', 'tab'); tab.setAttribute('aria-controls', 'p-' + id);
      tab.setAttribute('aria-selected', String(i === 0)); tab.tabIndex = i === 0 ? 0 : -1;
      lista.appendChild(tab);
      var panel = el('div', 'panel'); panel.id = 'p-' + id; panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', 't-' + id); panel.tabIndex = 0;
      if (i) panel.hidden = true;
      var col = el('div', 'panel-lista'), ul = el('ul', 'platos');
      col.appendChild(el('h3', 'panel-tit', a.nombre));
      a.platos.forEach(function(p){
        var li = el('li', 'plato'), linea = el('p', 'pl-linea');
        linea.appendChild(el('span', 'pl-nombre', p.nombre || ''));
        var pr = precio(p); if (pr) linea.appendChild(pr);
        li.appendChild(linea);
        if (p.desc) li.appendChild(el('p', 'pl-desc', p.desc));
        ul.appendChild(li);
      });
      col.appendChild(ul); panel.appendChild(col);
      var fig = a.foto && espera && espera.querySelector('[data-foto="' + a.foto + '"]');
      if (fig){ var f = fig.cloneNode(true); f.classList.remove('reveal'); f.removeAttribute('data-foto'); var c = el('div', 'panel-foto'); c.appendChild(f); panel.appendChild(c); panel.classList.add('con-foto'); }
      paneles.appendChild(panel);
    });
    var fe = viva.querySelector('[data-carta-fecha]');
    if (fe) fe.textContent = (C.fecha ? 'Carta de ' + C.fecha + '. ' : '') + 'Precios a confirmar.';
    if (espera) espera.hidden = true;
    viva.hidden = false;
  })();

  /* ================= Horario (lógica de anillo-horario M86: una sola para la tarjeta viva, la sección y la llamada final) ================= */
  var NS = 'http://www.w3.org/2000/svg', DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function ahoraEn(zona){
    try{
      var o = {};
      new Intl.DateTimeFormat('en-US', {timeZone:zona, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
      return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour % 24) * 60 + (+o.minute)};
    }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours() * 60 + n.getMinutes()}; }
  }
  function hora(m){ if (m > 1440) m -= 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function art(m){ var h = Math.floor((m > 1440 ? m - 1440 : m) / 60); return (h === 1 ? 'la ' : 'las ') + hora(m); }
  function estado(H, t){
    var hoy = H[t.d] || [], i, k;
    for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {abierto:true, jornada:t.d, cierra:hoy[i][1]};
    var ayer = (t.d + 6) % 7, tra = H[ayer] || [];
    for (i = 0; i < tra.length; i++) if (tra[i][1] > 1440 && t.min < tra[i][1] - 1440) return {abierto:true, jornada:ayer, cierra:tra[i][1]};
    for (k = 0; k < 8; k++){ var dia = (t.d + k) % 7, tr = H[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.min > 0) return {abierto:false, jornada:t.d, k:k, dia:dia, abre:tr[i][0]}; }
    return {abierto:false, jornada:t.d, k:-1};
  }
  function detalle(e){ return e.abierto ? 'hasta ' + art(e.cierra) : e.k < 0 ? 'consulta el horario'
    : (e.k === 0 ? 'abrimos hoy ' : e.k === 1 ? 'abrimos mañana ' : 'abrimos el ' + DIA[e.dia] + ' ') + 'a ' + art(e.abre); }
  window.AriesHorario = {estado:estado, ahoraEn:ahoraEn, detalle:detalle};   /* para las pruebas con el reloj falseado */
  function punto(r, m){ var a = m / 1440 * 2 * Math.PI; return (50 + r * Math.sin(a)).toFixed(3) + ' ' + (50 - r * Math.cos(a)).toFixed(3); }
  function arco(r, a, b){
    if (b - a >= 1440) return 'M50 ' + (50 - r) + 'A' + r + ' ' + r + ' 0 1 1 50 ' + (50 + r) + 'A' + r + ' ' + r + ' 0 1 1 50 ' + (50 - r);
    return 'M' + punto(r, a) + 'A' + r + ' ' + r + ' 0 ' + (b - a > 720 ? 1 : 0) + ' 1 ' + punto(r, b);
  }
  function svgEl(tag, at){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  var horarioFinal = null;
  $$('.ah[data-horario]').forEach(function(ah){
    var cfg; try{ cfg = JSON.parse(ah.getAttribute('data-horario')); }catch(e){ return; }
    var zona = cfg.zona || 'Europe/Madrid', H = cfg.dias || {}, svg = ah.querySelector('.ah-anillo'), mini = ah.getAttribute('data-tam') === 'mini';
    if (!horarioFinal) horarioFinal = {zona:zona, H:H};
    var est = document.getElementById(ah.getAttribute('data-estado-en') || '');
    var grupo = svgEl('g', {'class':'ah-tramos'}), aguja = svgEl('g', {'class':'ah-ahora'}), firma = '';
    aguja.appendChild(svgEl('circle', {'class':'ah-halo', cx:50, cy:4, r:mini ? 9 : 6}));
    aguja.appendChild(svgEl('circle', {'class':'ah-punto', cx:50, cy:4, r:mini ? 6 : 3.4}));
    svg.appendChild(grupo); svg.appendChild(aguja);
    if (!reducido) ah.classList.add('ah-dibuja');
    function set(sel, v){ var n = est && est.querySelector(sel); if (n && n.textContent !== v) n.textContent = v; }
    function pintar(){
      var t = ahoraEn(zona), e = estado(H, t), tramos = H[e.jornada] || [];
      ah.setAttribute('data-estado', e.abierto ? 'abierto' : 'cerrado');
      aguja.style.rotate = (t.min / 1440 * 360).toFixed(2) + 'deg';
      var f = e.jornada + ':' + JSON.stringify(tramos);
      if (f !== firma){
        firma = f; grupo.textContent = '';
        $$('.ah-hora', ah).forEach(function(n){ n.remove(); });
        var usados = [];
        tramos.forEach(function(tr){
          grupo.appendChild(svgEl('path', {'class':'ah-tramo', d:arco(46, tr[0], tr[1]), pathLength:1}));
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
      set('.ah-detalle', detalle(e));
      ah.classList.add('ah-listo');
    }
    pintar(); setInterval(pintar, 60000);
    if (conIO){
      var visto = false;
      new IntersectionObserver(function(ents){ ents.forEach(function(en){
        ah.classList.toggle('ah-fuera', !en.isIntersecting);
        if (en.isIntersecting && !visto){ visto = true; requestAnimationFrame(function(){ ah.classList.add('ah-visto'); }); }
      }); }, {threshold:.5}).observe(ah);
    } else ah.classList.add('ah-visto');
  });
  /* Línea de estado de la llamada final, con la misma función */
  (function(){
    var fh = document.querySelector('[data-final-hoy]'); if (!fh || !horarioFinal) return;
    function pinta(){ var e = estado(horarioFinal.H, ahoraEn(horarioFinal.zona)), d = detalle(e);
      fh.textContent = (e.abierto ? 'Abierto ahora, ' : 'Cerrado ahora, ') + d + ' · C. Frida Kahlo, 6'; }
    pinta(); setInterval(pinta, 60000);
  })();

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

  /* ================= Brillo rasante (M44 v2, copiado de borde-animado.html): una vez por visita en la portada, al verse en la final ================= */
  (function(){
    if (reducido) return;
    $$('.brillo-rasante').forEach(function(el, i){
      var clave = 'brillo:' + (el.id || location.pathname + ':' + i), una = el.getAttribute('data-una-vez') === 'sesion';
      if (una){ try{ if (sessionStorage.getItem(clave)) return; }catch(e){} }
      var img = el.querySelector('img'), luz = document.createElement('span'), haz = document.createElement('i');
      luz.className = 'br-luz'; luz.setAttribute('aria-hidden', 'true'); luz.appendChild(haz);
      if (!getComputedStyle(el).getPropertyValue('--br-mascara').trim() && img) luz.style.setProperty('--br-mascara', 'url("' + img.src + '")');   /* URL absoluta: relativa, se resolvería contra la hoja de estilos */
      el.appendChild(luz);
      function medir(){ var w = el.offsetWidth, h = el.offsetHeight, a = (parseFloat(getComputedStyle(el).getPropertyValue('--br-angulo')) || 20) * Math.PI / 180;
        if (w){ var hx = .25 * w * Math.cos(a) + 1.1 * h * Math.sin(a);
          el.style.setProperty('--br-desde', Math.round(-.25 * w - hx) + 'px'); el.style.setProperty('--br-hasta', Math.round(.75 * w + hx) + 'px'); } }
      haz.addEventListener('transitionend', function(){ el.classList.add('br-hecho'); });
      function pasa(){
        medir();
        setTimeout(function(){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ el.classList.add('br-pasa'); }); }); }, el.getAttribute('data-brillo') === 'carga' ? 400 : 0);
        if (una){ try{ sessionStorage.setItem(clave, '1'); }catch(e){} }
      }
      if (el.getAttribute('data-brillo') === 'carga'){ if (!img || img.complete) pasa(); else img.addEventListener('load', pasa, {once:true}); }
      else if (conIO){
        var io = new IntersectionObserver(function(ents){ if (ents[0].isIntersecting){ io.disconnect(); pasa(); } }, {threshold:.6}); io.observe(el);
      } else pasa();
    });
  })();

  /* ================= M85 esquina-que-gira (copiado de la librería): modo 3D, encogido exacto, fijado en escritorio y botón ================= */
  (function(){
    if (reducido) return;
    var linea = !!(window.CSS && CSS.supports('animation-timeline: view()'));
    $$('.eg').forEach(function(fig){
      var esc = fig.querySelector('.eg-escena'), prisma = fig.querySelector('.eg-prisma'), boton = null, anim = null, modo = function(){};
      fig.classList.add('eg-3d');
      if (!linea) fig.classList.add('eg-manual');
      function encoge(){
        var W = esc.clientWidth, p = parseFloat(getComputedStyle(esc).perspective) || 1600, k = 1;
        for (var g = 1; g < 90; g++){
          var a = g * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
          [[-.5,.5],[.5,.5],[.5,-.5]].forEach(function(q){
            var x = Math.abs(q[0]*c - q[1]*s), z = q[0]*s + q[1]*c, d = 2*x*p + z*W;
            if (d > 0) k = Math.min(k, (p + W/2) / d);
          });
        }
        fig.style.setProperty('--eg-encoge', (k * .98).toFixed(3));
      }
      encoge();
      if ('ResizeObserver' in window) new ResizeObserver(encoge).observe(esc);
      var sec = fig.closest('[data-eg-recorrido]'), min = fig.getAttribute('data-eg-fijar');
      if (linea && sec && min){
        var mq = matchMedia('(min-width:' + parseInt(min, 10) + 'px)'), tramo = document.createElement('div'), hueco = document.createElement('div');
        tramo.className = 'eg-tramo'; hueco.className = 'eg-hueco'; hueco.setAttribute('aria-hidden', 'true');
        sec.parentNode.insertBefore(tramo, sec); tramo.appendChild(sec); tramo.appendChild(hueco);
        if (sec.getAttribute('data-eg-recorrido')) tramo.style.setProperty('--eg-recorrido', sec.getAttribute('data-eg-recorrido'));
        modo = function(){ var f = mq.matches && !fig.classList.contains('eg-manual'); tramo.classList.toggle('eg-fija', f); if (boton) boton.hidden = f; };
        if (mq.addEventListener) mq.addEventListener('change', modo); else mq.addListener(modo);
      }
      if (fig.hasAttribute('data-eg-boton')){
        var textos = (fig.getAttribute('data-eg-textos') || 'Doblar la esquina|Volver').split('|');
        boton = document.createElement('button'); boton.type = 'button'; boton.className = 'eg-boton iman';
        boton.setAttribute('aria-pressed', 'false'); boton.textContent = textos[0]; fig.appendChild(boton);
        boton.addEventListener('click', function(){
          var cs = getComputedStyle(prisma), m = /(-?[\d.]+)deg/.exec(cs.rotate), desde = m ? parseFloat(m[1]) : 0;
          var sc = parseFloat(cs.scale) || 1, girada = fig.classList.contains('eg-manual') ? !fig.classList.contains('eg-girada') : desde > -45, hasta = girada ? -90 : 0;
          var k = getComputedStyle(fig).getPropertyValue('--eg-encoge').trim() || '.8', kk = k + ' ' + k + ' ' + k;
          var dur = parseFloat(getComputedStyle(fig).getPropertyValue('--eg-duracion-boton')) || 480;
          if (anim) anim.cancel();
          fig.classList.add('eg-manual'); modo();
          fig.classList.toggle('eg-girada', girada);
          boton.setAttribute('aria-pressed', String(girada)); boton.textContent = textos[girada ? 1 : 0] || textos[0];
          anim = prisma.animate([
            {rotate:'y ' + desde + 'deg', scale:sc + ' ' + sc + ' ' + sc},
            {scale:kk, offset:.12}, {scale:kk, offset:.88},
            {rotate:'y ' + hasta + 'deg', scale:'1 1 1'}
          ], {duration:dur * Math.max(Math.abs(hasta - desde) / 90, .35), easing:'cubic-bezier(.77,0,.175,1)'});
        });
        /* v1.1 de la librería: mientras gira con el scroll, el texto y aria-pressed siguen a la cara que se ve (pasada la mitad, "Volver") */
        if (linea){
          var pend = false, ultima = null;
          var sigue = function(){
            pend = false;
            if (fig.classList.contains('eg-manual')) return;                     // tras pulsar, manda el botón
            var m2 = /(-?[\d.]+)deg/.exec(getComputedStyle(prisma).rotate), g = !!(m2 && parseFloat(m2[1]) <= -45);
            if (g === ultima) return;
            ultima = g; boton.setAttribute('aria-pressed', String(g)); boton.textContent = textos[g ? 1 : 0] || textos[0];
          };
          addEventListener('scroll', function(){ if (!pend){ pend = true; requestAnimationFrame(sigue); } }, {passive:true});
          addEventListener('resize', function(){ if (!pend){ pend = true; requestAnimationFrame(sigue); } });
          requestAnimationFrame(sigue);
        }
      }
      modo();
    });
  })();

  /* ================= Entradas al bajar (M10) y filetes de los titulares (M71) ================= */
  $$('.resenas, .faq, .bento, .fotos-mesas').forEach(function(g){ $$('.reveal, .destapa', g).forEach(function(el, i){ el.style.setProperty('--retraso', Math.min(i, 6) * (g.classList.contains('bento') ? 70 : 60) + 'ms'); }); });
  alVerUnaVez($$('.reveal, .destapa, .tf'), function(el){ el.classList.add('visto'); }, {rootMargin:'0px 0px -8% 0px'});

  /* ================= Pausa fuera de pantalla de los bucles (cinta, pin) y del brillo del fondo vivo ================= */
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

  /* ================= Pestañas de la carta (menu-tabs-categorias) + marcador que viaja (M53) + cambio con View Transition ================= */
  (function(){
    var cont = document.querySelector('[data-pestanas]'); if (!cont || cont.closest('[hidden]')) return;
    var tabs = $$('[role="tab"]', cont), marca = cont.querySelector('.rd-marca'), zona = document.querySelector('[data-pestanas-zona]');
    var puedeVT = typeof document.startViewTransition === 'function' && !reducido;
    function reposo(){ return cont.querySelector('[aria-selected="true"]'); }
    function ir(t, sin){
      if (!t || !t.offsetWidth){ marca.classList.remove('listo'); return; }
      var x = t.offsetLeft + t.offsetWidth / 2 - marca.offsetWidth / 2, y = cont.clientHeight - marca.offsetHeight / 2 + .5;
      var saltar = sin || reducido || !marca.classList.contains('listo');
      if (saltar) marca.style.transition = 'none';
      marca.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      if (saltar){ void marca.offsetWidth; marca.style.transition = ''; }
      marca.classList.add('listo');
    }
    /* Pista "Desliza las pestañas…": solo si la tira no cabe (móvil, muchos apartados) */
    var pista = document.querySelector('.carta-pista');
    function pistaSiHace(){ if (pista && zona) pista.hidden = zona.scrollWidth <= zona.clientWidth + 1; }
    ir(reposo(), true); pistaSiHace();
    if ('ResizeObserver' in window) new ResizeObserver(function(){ ir(reposo(), true); pistaSiHace(); }).observe(cont);
    if (raton){
      tabs.forEach(function(t){ t.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') ir(t); }); });
      cont.addEventListener('pointerleave', function(){ ir(reposo()); });
    }
    cont.addEventListener('focusin', function(e){ var t = e.target.closest('[role="tab"]'); if (t) ir(t); });
    function entrar(panel){
      if (reducido) return;
      $$('.plato', panel).forEach(function(f, i){ f.style.setProperty('--n', i); });
      panel.classList.remove('entra'); void panel.offsetWidth; panel.classList.add('entra');
    }
    function centrarTab(t){
      if (!zona || zona.scrollWidth <= zona.clientWidth) return;
      var z = zona.getBoundingClientRect(), r = t.getBoundingClientRect();
      zona.scrollTo({left: zona.scrollLeft + (r.left + r.width / 2) - (z.left + z.width / 2), behavior: reducido ? 'auto' : 'smooth'});
    }
    function elegir(t, foco){
      if (t.getAttribute('aria-selected') === 'true'){ if (foco) t.focus(); return; }
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      var aplicar = function(){ tabs.forEach(function(x){ var si = x === t; x.setAttribute('aria-selected', String(si)); x.tabIndex = si ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !si; }); entrar(panel); reubicar(); };
      /* (carta-lista-flexible) tras el cambio, el principio del panel nuevo tiene que verse: en escritorio, si la tira ya se fue
         por arriba, se vuelve a ella (bajo la cabecera); en móvil (tira pegada), si el panel empieza por encima de la tira, se baja hasta él */
      function reubicar(){
        var z = zona.getBoundingClientRect(), pt = panel.getBoundingClientRect().top, d = 0;
        if (z.top < 0) d = z.top - 90;
        else if (pt < z.bottom) d = pt - z.bottom - 16;
        if (d) scrollTo({top: scrollY + d, behavior: reducido ? 'auto' : 'smooth'});
      }
      if (puedeVT) document.startViewTransition(aplicar); else aplicar();
      ir(t); centrarTab(t);
      if (foco) t.focus();
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ elegir(t); });
      t.addEventListener('keydown', function(e){
        var d = null;
        if (e.key === 'ArrowRight') d = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') d = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') d = tabs[0]; else if (e.key === 'End') d = tabs[tabs.length - 1];
        if (d){ e.preventDefault(); elegir(d, true); }
      });
    });
  })();

  /* ================= Su frase se enciende con el scroll (texto-revelado-scroll v5, M14) ================= */
  $$('.lee-texto').forEach(function(p){
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

  /* ================= Decoración con parallax (decoracion-parallax, M15, y helechos data-py del fondo vivo) ================= */
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
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Aries Bistro Bar, Calle Frida Kahlo 6, 28051 Madrid') + '&hl=es&z=17&output=embed';
      f.title = 'Mapa con la ubicación de Aries Bistró Bar'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
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
