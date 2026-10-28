/* Gimnasio Energy v2 · resto de sitio.js, cargado tras el evento load (ver cargarResto en sitio.js): revelados, parallax y pausa
   fuera de pantalla, cifra, resalte del horario, interacciones del cursor, Encuentra tu sala ↔ tablón, mapa, barra del móvil y visor. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;

  /* ---- Aparecer al verse (M10): .reveal con opacidad + translate; filas del tablón escalonadas 40 ms ---- */
  document.querySelectorAll('[data-tablon] .tb-lista').forEach(function(ul){ [].forEach.call(ul.querySelectorAll('.tb-fila'), function(li, i){ li.style.setProperty('--d', (i * 40) + 'ms'); }); });
  var revelar = [].slice.call(document.querySelectorAll('.reveal, .tb-panel'));
  if (reducido || !conIO) revelar.forEach(function(el){ el.classList.add('visto'); });
  else {
    var ior = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); ior.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
    revelar.forEach(function(el){ ior.observe(el); });
  }
  document.addEventListener('tablon:listo', function(e){
    e.target.querySelectorAll('.tb-lista').forEach(function(ul){ [].forEach.call(ul.querySelectorAll('.tb-fila'), function(li, i){ li.style.setProperty('--d', (i * 40) + 'ms'); }); });
  });

  /* ---- decoracion-parallax (M15) + pausa fuera de pantalla (.mov / .en-pantalla) ---- */
  if (conIO){
    var iom = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ iom.observe(el); });
  }
  var capas = [].slice.call(document.querySelectorAll('[data-px],[data-py]'));
  if (capas.length && !reducido){
    var pp = null;
    var parallax = function(){ pp = null; var vh = innerHeight;
      capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        if (el.dataset.px) el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0';
        else el.style.translate = '0 ' + (p * +el.dataset.py * 2).toFixed(1) + 'px'; });
    };
    addEventListener('scroll', function(){ if (!pp) pp = requestAnimationFrame(parallax); }, {passive:true});
    addEventListener('resize', parallax); parallax();
  }

  /* ---- v2.1 focos-techo (M132): cada foco se enciende al verse su sección, una vez ---- */
  var focos = [].slice.call(document.querySelectorAll('.foco-techo'));
  if (!conIO) focos.forEach(function(f){ f.classList.add('ft-on'); });
  else { var iof = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('ft-on'); iof.unobserve(e.target); } }); }, {threshold:.25});
    focos.forEach(function(f){ iof.observe(f); }); }

  /* ---- v2.1 titulares con recorte (M03): se observa el h2 (contenedor), no el span recortado ---- */
  var tits = [].slice.call(document.querySelectorAll('.rev-cont'));
  if (reducido || !conIO) tits.forEach(function(t){ t.classList.add('rev-on'); });
  else { var iot = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('rev-on'); iot.unobserve(e.target); } }); }, {rootMargin:'0px 0px -14% 0px'});
    tits.forEach(function(t){ iot.observe(t); }); }

  /* ---- v2.1 fotos con profundidad: con el scroll la foto va más despacio (±22 px) y con el ratón se desplaza un poco al revés ---- */
  var fotos = [].slice.call(document.querySelectorAll('.prof'));
  if (fotos.length && !reducido){
    var pf = null;
    var mover = function(){ pf = null; var vh = innerHeight;
      fotos.forEach(function(f){ var img = f.querySelector('img'), r = f.getBoundingClientRect(); if (!img || r.bottom < -100 || r.top > vh + 100) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        img.style.translate = (f._mx || 0).toFixed(1) + 'px ' + (p * -44 + (f._my || 0)).toFixed(1) + 'px'; });
    };
    addEventListener('scroll', function(){ if (!pf) pf = requestAnimationFrame(mover); }, {passive:true});
    addEventListener('resize', mover); mover();
    if (raton) fotos.forEach(function(f){
      f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
        f._mx = ((e.clientX - r.left) / r.width - .5) * -16; f._my = ((e.clientY - r.top) / r.height - .5) * -12; if (!pf) pf = requestAnimationFrame(mover); });
      f.addEventListener('pointerleave', function(){ f._mx = f._my = 0; if (!pf) pf = requestAnimationFrame(mover); });
    });
  }

  /* ---- movimiento-marca: cifra que cuenta (M05), solo el 4,9 ---- */
  document.querySelectorAll('.cuenta').forEach(function(c){
    if (reducido || !conIO) return;
    var fin = +c.dataset.fin, dec = +c.dataset.dec || 0, txt = c.textContent;
    c.style.minWidth = c.getBoundingClientRect().width + 'px'; c.textContent = (0).toFixed(dec).replace('.', ',');
    var io = new IntersectionObserver(function(es){ if (!es[0].isIntersecting) return; io.disconnect();
      var t0 = performance.now();
      (function paso(t){ var k = Math.min(1, (t - t0) / 1100), v = fin * (1 - Math.pow(1 - k, 3));
        c.textContent = k < 1 ? v.toFixed(dec).replace('.', ',') : txt; if (k < 1) requestAnimationFrame(paso); })(t0);
    }, {threshold:.6});
    io.observe(c);
  });

  /* ---- resaltado-deslizante (M53), modo "nav": el resalte reposa en la fila de hoy del horario ---- */
  document.querySelectorAll('.resalta').forEach(function(cont){
    var res = cont.querySelector('.resalte'); if (!res){ res = document.createElement('span'); res.className = 'resalte'; res.setAttribute('aria-hidden', 'true'); cont.insertBefore(res, cont.firstChild); }
    var actual = null;
    function reposo(){ return cont.querySelector('.r-item.activo'); }
    function ir(el, sin){
      if (actual) actual.classList.remove('sobre');
      if (!el){ res.classList.remove('listo'); actual = null; return; }
      var c = cont.getBoundingClientRect(), r = el.getBoundingClientRect();
      var saltar = sin || reducido || !res.classList.contains('listo');
      if (saltar) res.style.transition = 'none';
      res.style.clipPath = 'inset(' + (r.top - c.top) + 'px ' + (c.right - r.right) + 'px ' + (c.bottom - r.bottom) + 'px ' + (r.left - c.left) + 'px)';
      if (saltar){ void res.offsetWidth; res.style.transition = ''; }
      res.classList.add('listo'); el.classList.add('sobre'); actual = el;
    }
    ir(reposo(), true);
    if (raton){
      cont.addEventListener('pointerover', function(e){ var el = e.target.closest && e.target.closest('.r-item'); if (el && e.pointerType === 'mouse' && el !== actual) ir(el); });
      cont.addEventListener('pointerleave', function(){ ir(reposo()); });
    }
    cont.closest('[data-tablon]') && cont.closest('[data-tablon]').addEventListener('tablon:listo', function(){ actual = null; ir(reposo(), true); });
    new ResizeObserver(function(){ ir(actual || reposo(), true); }).observe(cont);
  });

  /* ---- interacciones-cursor v3 (M30): imán en botones y resplandor delegado ---- */
  if (raton && !reducido){
    document.querySelectorAll('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    var SEL = '.tb-panel, details', pr = null;
    document.addEventListener('mousemove', function(e){
      if (pr) return;
      pr = requestAnimationFrame(function(){ pr = null;
        var el = e.target && e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ---- Encuentra tu sala (M115): horas y franjas leídas de contenido/tablon.json; el átomo pequeño enciende la sala ---- */
  (function(){
    var rp = document.querySelector('#encuentra [data-rp]'); if (!rp) return;
    var datos = null, NOMBRES = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'], ORDEN = [1,2,3,4,5,6,0];
    var DIAS = {domingo:0, lunes:1, martes:2, miercoles:3, jueves:4, viernes:5, sabado:6};
    function norm(x){ return String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
    function min(h){ var m = /(\d{1,2})[:.](\d{2})/.exec(h || ''); return m ? +m[1] * 60 + +m[2] : null; }
    document.addEventListener('tablon:listo', function(e){ if (e.detail && e.detail.datos) datos = e.detail.datos; });
    /* "De lunes a viernes, de 16:00 a 21:30": los días con el mismo tramo de mañana (antes de las 14:00) o de tarde, agrupados */
    function franja(cual){
      if (!datos || !Array.isArray(datos.horario)) return '';
      var por = {};
      datos.horario.forEach(function(x){ var d = DIAS[norm(x.dia)]; if (d == null) return;
        (x.tramos || []).forEach(function(t){ var a = min(t.desde); if (a == null || !t.hasta) return; if ((a < 840) === (cual === 'manana')) por[d] = 'de ' + t.desde + ' a ' + t.hasta; }); });
      var grupos = [];
      ORDEN.forEach(function(d){ var g = grupos[grupos.length - 1];
        if (!por[d]) return;
        if (g && g.txt === por[d] && ORDEN.indexOf(g.fin) === ORDEN.indexOf(d) - 1) g.fin = d; else grupos.push({ini:d, fin:d, txt:por[d]}); });
      if (!grupos.length) return 'Cerrado ' + (cual === 'manana' ? 'por las mañanas' : 'por las tardes');
      var fuente = rp.getAttribute('data-rp-fuente');
      var t = grupos.map(function(g){ var dias = g.ini === g.fin ? NOMBRES[g.ini] : (ORDEN.indexOf(g.fin) - ORDEN.indexOf(g.ini) === 1 ? NOMBRES[g.ini] + ' y ' + NOMBRES[g.fin] : 'de ' + NOMBRES[g.ini] + ' a ' + NOMBRES[g.fin]); return dias + ', ' + g.txt; }).join('; ');
      return t.charAt(0).toUpperCase() + t.slice(1) + (fuente ? ', ' + fuente : '');
    }
    function hora(actividad){
      if (!datos || !Array.isArray(datos.clases)) return null;                 // sin tablón: se queda el valor del JSON en línea
      var c = datos.clases.filter(function(x){ return norm(x.actividad) === norm(actividad); })[0];
      if (!c || !c.hora) return '';
      return (c.dias ? c.dias + ', ' : '') + c.hora + (c.fuente ? ' (' + c.fuente + ')' : '');
    }
    var DEF = {manana:'De lunes a viernes, de 10:00 a 13:00, según Google', tarde:'De lunes a viernes, de 16:00 a 21:30, según Google'};
    rp.addEventListener('rp:resultado', function(e){
      var r = e.detail.resultado, resp = e.detail.respuestas;
      (r.datos || []).forEach(function(d){
        if (d.clave === 'franja') d.val = franja(resp.franja) || DEF[resp.franja] || '';
        if (d.clave === 'hora'){ var h = hora(d.actividad); if (h !== null) d.val = h; }
      });
    });
    var ao = rp.querySelector('.ao-mini');
    rp.addEventListener('rp:cambio', function(e){ if (!ao) return; var i = e.detail.figura;
      ao.querySelectorAll('.ao-orbita').forEach(function(o, j){ o.classList.toggle('ao-activa', j === i); });
      ao.querySelectorAll('.ao-carril').forEach(function(c, j){ c.classList.toggle('ao-activa', j === i); }); });
  })();

  /* ---- ubicacion-mapa v3: el mapa de Google solo se carga al pulsar ---- */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa) btnMapa.addEventListener('click', function(){
    var caja = document.getElementById('mapa'), fachada = document.getElementById('fachada'); if (!fachada) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Gimnasio Energy, C. Fuenclara 33, 23330 Villanueva del Arzobispo, Jaén') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de Gimnasio Energy'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    caja.appendChild(f); fachada.remove(); f.focus();
  });

  /* ---- barra-pegajosa-movil v2: aparece pasada la portada; nunca a la vez que otros botones de WhatsApp ---- */
  var barra = document.getElementById('barraFija');
  if (barra){
    var act = function(){ barra.classList.toggle('visible', scrollY > innerHeight * .7); };
    addEventListener('scroll', function(){ requestAnimationFrame(act); }, {passive:true}); act();
    if (conIO){
      var vistos = new Set();
      var iob = new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); }); barra.classList.toggle('tapada', vistos.size > 0); });
      document.querySelectorAll('[data-tapa-barra]').forEach(function(el){ iob.observe(el); });
    }
  }

  /* ---- galeria-lightbox v4.1 (M51): la foto de la sala crece hasta la foto grande ---- */
  (function(){
    var dlg = document.getElementById('lightbox4'); if (!dlg) return;
    var todas = [].slice.call(document.querySelectorAll('.lb4-foto, .og-foto-btn[data-galeria], .foto-duo')), img = document.getElementById('lb4Img'), pie = document.getElementById('lb4Pie');
    var puede = typeof document.startViewTransition === 'function' && !reducido;
    var grupo = [], indice = 0, disparador = null;
    function mini(b){ return b.querySelector('img'); }
    function mostrar(i){
      indice = (i + grupo.length) % grupo.length;
      var b = grupo[indice];
      img.src = b.getAttribute('data-grande') || mini(b).currentSrc || mini(b).src; img.alt = mini(b).alt;
      pie.textContent = (b.getAttribute('data-pie') || mini(b).alt) + (grupo.length > 1 ? ' (' + (indice + 1) + ' de ' + grupo.length + ')' : '');
      document.getElementById('lb4Prev').hidden = document.getElementById('lb4Next').hidden = grupo.length < 2;
    }
    function precarga(src){ return new Promise(function(ok){ var i = new Image(), t = setTimeout(ok, 400); i.onload = i.onerror = function(){ clearTimeout(t); ok(); }; i.src = src; }); }
    function abrir(b){
      disparador = b; var g = b.getAttribute('data-galeria');
      grupo = todas.filter(function(x){ return x.getAttribute('data-galeria') === g; });
      var i = grupo.indexOf(b), m = mini(b);
      if (!puede){ mostrar(i); dlg.showModal(); requestAnimationFrame(function(){ dlg.classList.add('is-open'); }); return; }
      precarga(b.getAttribute('data-grande') || m.src).then(function(){
        m.style.viewTransitionName = 'foto-grande'; dlg.classList.add('vt');
        var vt = document.startViewTransition(function(){ m.style.viewTransitionName = ''; mostrar(i); img.style.viewTransitionName = 'foto-grande'; dlg.showModal(); dlg.classList.add('is-open'); });
        vt.finished.finally(function(){ img.style.viewTransitionName = ''; dlg.classList.remove('vt'); });
      });
    }
    function cerrar(){
      var m = grupo[indice] ? mini(grupo[indice]) : null;
      if (!puede || !m){
        dlg.classList.remove('is-open');
        var fin = function(){ dlg.removeEventListener('transitionend', fin); if (dlg.open) dlg.close(); };
        if (reducido) fin(); else { dlg.addEventListener('transitionend', fin); setTimeout(fin, 320); }
        return;
      }
      img.style.viewTransitionName = 'foto-grande'; dlg.classList.add('vt');
      var vt = document.startViewTransition(function(){ img.style.viewTransitionName = ''; dlg.classList.remove('is-open'); dlg.close(); m.style.viewTransitionName = 'foto-grande'; });
      vt.finished.finally(function(){ m.style.viewTransitionName = ''; dlg.classList.remove('vt'); });
    }
    todas.forEach(function(b){ b.addEventListener('click', function(){ abrir(b); }); });
    document.getElementById('lb4Prev').addEventListener('click', function(){ mostrar(indice - 1); });
    document.getElementById('lb4Next').addEventListener('click', function(){ mostrar(indice + 1); });
    document.getElementById('lb4Close').addEventListener('click', cerrar);
    dlg.addEventListener('click', function(e){ if (e.target === dlg) cerrar(); });
    dlg.addEventListener('keydown', function(e){ if (grupo.length < 2) return; if (e.key === 'ArrowRight') mostrar(indice + 1); if (e.key === 'ArrowLeft') mostrar(indice - 1); });
    dlg.addEventListener('cancel', function(e){ e.preventDefault(); cerrar(); });
    dlg.addEventListener('close', function(){ var b = grupo[indice] || disparador; if (b) b.focus({preventScroll:true}); });
  })();
})();
