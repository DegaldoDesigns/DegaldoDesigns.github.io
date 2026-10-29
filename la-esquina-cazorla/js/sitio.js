/* La Esquina (Cazorla) · demo de Degaldo Designs (2026-10-26). Piezas de la librería adaptadas; cada bloque dice de dónde sale.
   Copias literales aparte: js/anillo-horario.js (M86 v1), js/pila.js (pila-deslizable v3), js/carta.js (carta-lista-flexible)
   y js/lista-foto.js (lista-foto-hover). */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ================= Portada tipográfica (M97, portada-tipografica v1): "LA ESQUI[foto]NA" se abre una vez ================= */
  var pt = document.querySelector('.pt');
  if (pt){
    var nombre = pt.querySelector('.pt-nombre'), palabra = pt.querySelector('.pt-palabra'), imgPt = pt.querySelector('.pt-hueco img');
    var medir = function(){
      nombre.style.fontSize = '';
      pt.classList.remove('pt-estrecho');
      if (palabra.offsetWidth <= nombre.clientWidth + 1) return;
      pt.classList.add('pt-estrecho');
      var sobra = palabra.offsetWidth, cabe = nombre.clientWidth;
      if (sobra > cabe + 1) nombre.style.fontSize = (parseFloat(getComputedStyle(nombre).fontSize) * cabe / sobra * 0.98) + 'px';
    };
    var anchoAnterior = innerWidth;
    addEventListener('resize', function(){ if (innerWidth === anchoAnterior) return; anchoAnterior = innerWidth; medir(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medir);
    medir();
    if (reducido) pt.classList.add('pt-abierta');
    else {
      var tope = new Promise(function(r){ setTimeout(r, 500); });
      var dec = (imgPt && imgPt.decode) ? imgPt.decode().catch(function(){}) : Promise.resolve();
      Promise.race([dec, tope]).then(function(){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ pt.classList.add('pt-abierta'); }); }); });
    }
  }

  /* ================= Estado de hoy para la lista de Horario y la llamada final (misma lógica que anillo-horario v1).
     CONFIRMAR CON EL CLIENTE: horario de Google Maps (0 = domingo). Los festivos no se calculan: nunca "hoy no hay servicio". ================= */
  var HORARIO = {2:[[570, 810]], 3:[[570, 810], [1200, 1440]], 4:[[570, 810], [1200, 1440]], 5:[[570, 810], [1200, 1440]], 6:[[750, 990], [1200, 1440]], 0:[[750, 990], [1200, 1440]]};
  var DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  function hora(m){ if (m > 1440) m -= 1440; return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function art(m){ var h = Math.floor((m > 1440 ? m - 1440 : m) / 60); return (h === 1 ? 'la ' : 'las ') + hora(m); }
  function ahora(){
    try {
      var p = {}, n = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
      new Intl.DateTimeFormat('en-US', {timeZone:'Europe/Madrid', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {d:n[p.weekday], m:(+p.hour % 24) * 60 + (+p.minute)};
    } catch (e){ var f = new Date(); return {d:f.getDay(), m:f.getHours() * 60 + f.getMinutes()}; }
  }
  function estado(t){
    var hoy = HORARIO[t.d] || [], i, k;
    for (i = 0; i < hoy.length; i++) if (t.m >= hoy[i][0] && t.m < hoy[i][1]) return {abierto:true, jornada:t.d, detalle:'hasta ' + art(hoy[i][1])};
    var ayer = (t.d + 6) % 7, tra = HORARIO[ayer] || [];
    for (i = 0; i < tra.length; i++) if (tra[i][1] > 1440 && t.m < tra[i][1] - 1440) return {abierto:true, jornada:ayer, detalle:'hasta ' + art(tra[i][1])};
    for (k = 0; k < 8; k++){
      var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
      for (i = 0; i < tr.length; i++) if (k * 1440 + tr[i][0] - t.m > 0)
        return {abierto:false, jornada:t.d, detalle:(k === 0 ? 'abrimos hoy a ' : k === 1 ? 'abrimos mañana a ' : 'abrimos el ' + DIAS[dia] + ' a ') + art(tr[i][0])};
    }
    return {abierto:false, jornada:t.d, detalle:'escríbenos por WhatsApp'};
  }
  var estados = document.querySelectorAll('[data-estado-hoy]'), dias = document.getElementById('dias'), filas = dias ? dias.querySelectorAll('[data-dia]') : [];
  function pintar(){
    var t = ahora(), e = estado(t), w = e.abierto ? 'Abierto' : 'Cerrado';
    [].forEach.call(estados, function(el){
      var pa = el.querySelector('.estado-palabra'), de = el.querySelector('.estado-detalle');
      if (pa.textContent !== w) pa.textContent = w;
      if (de.textContent !== e.detalle) de.textContent = e.detalle;
      el.setAttribute('data-e', e.abierto ? 'abierto' : 'cerrado');
    });
    [].forEach.call(filas, function(f){
      var es = +f.getAttribute('data-dia') === e.jornada, et = f.querySelector('.hoy-et'), txt = e.jornada === t.d ? 'Hoy' : 'Ahora';
      f.classList.toggle('hoy', es);
      if (es && !et){ et = document.createElement('span'); et.className = 'hoy-et'; f.querySelector('dt').appendChild(et); }
      if (es && et.textContent !== txt) et.textContent = txt;
      if (!es && et) et.remove();
    });
  }
  pintar(); setInterval(pintar, 30000);

  /* ================= M10 al verse, por tiempo + subrayado de rotulador (brochazo-marca, variante subrayado).
     Se observa el CONTENEDOR, nunca lo recortado (regla de Della Grotta). ================= */
  var unaVez = document.querySelectorAll('.aparece, .revela, .rev-cont');
  if (!('IntersectionObserver' in window) || reducido) unaVez.forEach(function(t){ t.classList.add('visto', 'pintada'); });
  else {
    var iov = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); if (e.target.classList.contains('rev-cont')) e.target.classList.add('pintada'); iov.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
    unaVez.forEach(function(t){ iov.observe(t); });
  }

  /* ================= Pausa fuera de pantalla (pin del mapa) ================= */
  if ('IntersectionObserver' in window){
    var iop = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ iop.observe(el); });
  } else document.querySelectorAll('.mov').forEach(function(el){ el.classList.add('en-pantalla'); });

  /* ================= Parallax de la decoración (M15, decoracion-parallax: data-px horizontal, data-py vertical).
     SOLO desde 900 px (en móvil, quieta; lección de Embocado). Posición de la SECCIÓN, nunca la del propio elemento. ================= */
  if (!reducido){
    var capas = [].slice.call(document.querySelectorAll('[data-px], [data-py]')), pend = null, ancho = matchMedia('(min-width: 900px)');
    var mover = function(){ pend = null; var vh = innerHeight;
      if (!ancho.matches){ capas.forEach(function(el){ el.style.translate = ''; }); return; }
      capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        el.style.translate = el.dataset.px ? (p * +el.dataset.px * 2).toFixed(1) + 'px 0' : '0 ' + (p * +el.dataset.py).toFixed(1) + 'px'; }); };
    addEventListener('scroll', function(){ if (!pend && ancho.matches) pend = requestAnimationFrame(mover); }, {passive:true});
    if (ancho.addEventListener) ancho.addEventListener('change', mover);
    mover();
  }

  /* ================= Cabecera inteligente (M18) + sección activa (M61) ================= */
  var cab = document.getElementById('cabecera');
  if (!(window.CSS && CSS.supports('container-type', 'scroll-state')) && 'IntersectionObserver' in window){
    new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(document.querySelector('.centinela'));
  }
  var ultimo = scrollY, pendC = false;
  addEventListener('scroll', function(){
    if (pendC) return; pendC = true;
    requestAnimationFrame(function(){
      pendC = false;
      var y = scrollY, d = y - ultimo;
      if (Math.abs(d) < 8) return;
      if (y < 120 || d < 0) cab.classList.remove('oculta'); else cab.classList.add('oculta');
      ultimo = y;
    });
  }, {passive:true});
  var enlaces = document.querySelectorAll('.nav a');
  if ('IntersectionObserver' in window){
    var ioa = new IntersectionObserver(function(es){ es.forEach(function(e){ if (!e.isIntersecting) return;
      enlaces.forEach(function(a){ if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }); },
      {rootMargin:'-45% 0px -50% 0px'});
    ['inicio','burger-del-mes','carta','cumpleanos','horario','ubicacion','preguntas'].forEach(function(id){ var s = document.getElementById(id); if (s) ioa.observe(s); });
  }

  /* ================= Menú móvil en círculo (M52 menu-escalonado) ================= */
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb');
  if (menu && hamb){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){
      var abierto = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      if (!abierto) hamb.focus({preventScroll:true});
    });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* ================= Barra fija del móvil (barra-pegajosa-movil v2): nunca dos WhatsApp a la vez ================= */
  var barra = document.getElementById('barraMovil');
  if (barra){
    var verBarra = function(){ barra.classList.toggle('visible', scrollY > 420); };
    addEventListener('scroll', function(){ requestAnimationFrame(verBarra); }, {passive:true}); verBarra();
    if ('IntersectionObserver' in window){
      var vistos = new Set();
      var iob = new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); }); barra.classList.toggle('tapada', vistos.size > 0); });
      document.querySelectorAll('[data-tapa-barra]').forEach(function(el){ iob.observe(el); });
    }
  }

  /* ================= Interacciones con ratón (M30 interacciones-cursor v3) ================= */
  if (raton && !reducido){
    document.querySelectorAll('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    document.querySelectorAll('.foto-iman').forEach(function(f){
      var img = f.querySelector('img');
      f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        f.style.translate = (x * 34).toFixed(1) + 'px ' + (y * 30).toFixed(1) + 'px';
        img.style.translate = (x * -14).toFixed(1) + 'px ' + (y * -12).toFixed(1) + 'px'; img.style.scale = '1.05'; });
      f.addEventListener('pointerleave', function(){ f.style.translate = ''; img.style.translate = ''; img.style.scale = ''; });
    });
    var pendG = null;
    document.addEventListener('mousemove', function(e){
      if (pendG) return;
      pendG = requestAnimationFrame(function(){ pendG = null;
        var el = e.target && e.target.closest ? e.target.closest('.faq details') : null; if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ================= Mapa real solo al pulsar (ubicacion-mapa v3; la web no usa cookies propias) ================= */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa) btnMapa.addEventListener('click', function(){
    var caja = document.getElementById('mapa'), fachada = document.getElementById('mapaFachada'); if (!fachada) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('La Esquina, C. Carmen 22, 23470 Cazorla, Jaén') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de La Esquina'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
    caja.appendChild(f); fachada.remove(); f.focus();
  });

  /* ================= Preguntas: acordeón nativo con altura animada (acordeon-nativo) ================= */
  document.querySelectorAll('.faq details').forEach(function(el){
    var resumen = el.querySelector('summary'), contenido = el.querySelector('.contenido'), anim = null, cerrando = false, abriendo = false;
    function terminar(abierto){ el.open = abierto; anim = null; cerrando = abriendo = false; el.style.height = el.style.overflow = ''; }
    function animar(desde, hasta, abierto){
      if (anim) anim.cancel();
      if (reducido){ terminar(abierto); return; }
      anim = el.animate({height:[desde, hasta]}, {duration:250, easing:'cubic-bezier(0.23,1,0.32,1)'});
      anim.onfinish = function(){ terminar(abierto); };
      anim.oncancel = function(){ cerrando = abriendo = false; };
    }
    resumen.addEventListener('click', function(e){
      e.preventDefault(); el.style.overflow = 'hidden';
      if (cerrando || !el.open){
        document.querySelectorAll('.faq details[open]').forEach(function(o){ if (o !== el) o.open = false; });
        el.style.height = el.offsetHeight + 'px'; el.open = true;
        requestAnimationFrame(function(){ abriendo = true; animar(el.offsetHeight + 'px', (resumen.offsetHeight + contenido.offsetHeight) + 'px', true); });
      } else if (abriendo || el.open){ cerrando = true; animar(el.offsetHeight + 'px', resumen.offsetHeight + 'px', false); }
    });
  });
})();
