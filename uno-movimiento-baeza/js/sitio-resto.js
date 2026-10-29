/* Clínica César Navarro / UNO movimiento · resto de sitio.js (lo carga js/carga.js tras pintar la portada): revelados (M10), parallax de
   las dos palabras (M15) y pausa fuera de pantalla, interacciones del cursor (M30: imán, foto de portada con profundidad, resplandor),
   nota de demo (.og-anotado), «Pide tu cita» ↔ puertas mini y estado de ahora, copiar los datos de la nevera, mapa al pulsar, barra
   del móvil y visor de fotos (galeria-lightbox v4.1). Piezas de la librería adaptadas: cada bloque dice de cuál. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var conIO = 'IntersectionObserver' in window;

  /* ---- Aparecer al verse (M10) y la nota de demo (objetos-gimnasio .og-anotado: se observa el contenedor) ---- */
  var revelar = [].slice.call(document.querySelectorAll('.reveal, .og-anotado'));
  if (reducido || !conIO) revelar.forEach(function(el){ el.classList.add('visto'); });
  else {
    var ior = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto'); ior.unobserve(e.target); } }); }, {rootMargin:'0px 0px -10% 0px'});
    revelar.forEach(function(el){ ior.observe(el); });
  }

  /* ---- decoracion-parallax (M15, solo «MOVIMIENTO» y «BAEZA») + pausa fuera de pantalla (.mov / .en-pantalla) ---- */
  if (conIO){
    var iom = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    document.querySelectorAll('.mov').forEach(function(el){ iom.observe(el); });
  }
  var capas = [].slice.call(document.querySelectorAll('[data-px]'));
  if (capas.length && !reducido){
    var pp = null;
    var parallax = function(){ pp = null; var vh = innerHeight;
      capas.forEach(function(el){ var r = el.closest('section').getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var p = ((r.top + r.height / 2) - vh / 2) / (vh + r.height);
        el.style.translate = (p * +el.dataset.px * 2).toFixed(1) + 'px 0'; });
    };
    addEventListener('scroll', function(){ if (!pp) pp = requestAnimationFrame(parallax); }, {passive:true});
    addEventListener('resize', parallax); parallax();
  }

  /* ---- interacciones-cursor v3 (M30): imán en botones, foto de portada con profundidad dentro del marco, resplandor delegado ---- */
  if (raton && !reducido){
    document.querySelectorAll('.iman').forEach(function(b){
      b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
        b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
      b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
    });
    /* El marco se queda quieto y la foto se mueve un poco por dentro, hacia el lado contrario (x × -10, y × -8 px) */
    var mr = document.querySelector('.portada .mr'), ven = mr && mr.querySelector('.mr-ventana img');
    if (mr && ven){
      var pf = null;
      mr.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse' || pf) return;
        pf = requestAnimationFrame(function(){ pf = null; var r = mr.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          ven.style.translate = (x * -20).toFixed(1) + 'px ' + (y * -16).toFixed(1) + 'px'; mr.classList.add('mr-cerca'); }); });
      mr.addEventListener('pointerleave', function(){ ven.style.translate = ''; mr.classList.remove('mr-cerca'); });
    }
    var SEL = '.tb-panel', pr = null;
    document.addEventListener('mousemove', function(e){
      if (pr) return;
      pr = requestAnimationFrame(function(){ pr = null;
        var el = e.target && e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
    });
  }

  /* ---- Pide tu cita (recomendador-preguntas v1.3, canal llamada) ↔ .pc-mini de puertas-cristal (M119) y el estado de ahora ---- */
  (function(){
    var rp = document.querySelector('#cita [data-rp]'); if (!rp) return;
    var mini = rp.querySelector('.pc-mini'), pie = rp.querySelector('[data-rp-pie]');
    rp.addEventListener('rp:cambio', function(e){
      if (mini && window.PuertasCristal) PuertasCristal.abrir(mini, e.detail.paso === 'que' ? -1 : e.detail.figura);
      if (e.detail.paso === 'resultado' && pie && window.HorarioCN){
        var x = HorarioCN.texto();
        pie.querySelector('b').textContent = x.palabra; pie.querySelector('.rp-pie-det').textContent = x.detalle;
        pie.setAttribute('data-estado', x.estado);
      }
    });
    /* Quien pide para un familiar: el resultado enlaza también a «¿Llamas por tu padre o tu madre?» */
    rp.addEventListener('rp:resultado', function(e){
      if (e.detail.respuestas.para === 'para un familiar') e.detail.resultado.enlace = {texto:'Si llamas por tu padre o tu madre, mira esto', href:'#familia'};
    });
  })();

  /* ---- Copiar los datos para la nevera (técnica de copiar-portapapeles: Clipboard API, respaldo execCommand, aviso en aria-live) ---- */
  (function(){
    var aviso = document.querySelector('[data-copiar-aviso]');
    function viejo(t){ try { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); var ok = document.execCommand('copy'); a.remove(); return ok; } catch (e){ return false; } }
    function copiar(t){
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(function(){ return true; }, function(){ return viejo(t); });
      return Promise.resolve(viejo(t));
    }
    document.querySelectorAll('[data-copiar]').forEach(function(b){
      var et = b.querySelector('.btn-texto') || b, txt = et.textContent, temp = null;
      b.addEventListener('click', function(){
        copiar(b.getAttribute('data-copiar')).then(function(ok){
          clearTimeout(temp);
          if (aviso) aviso.textContent = ok ? 'Datos copiados' : 'No se pudo copiar. Cópialos a mano: ' + b.getAttribute('data-copiar');
          if (ok){ et.textContent = 'Datos copiados'; temp = setTimeout(function(){ et.textContent = txt; }, 1800); }
        });
      });
    });
  })();

  /* ---- ubicacion-mapa v3: el mapa de Google solo se carga al pulsar ---- */
  var btnMapa = document.getElementById('btnMapa');
  if (btnMapa) btnMapa.addEventListener('click', function(){
    var caja = document.getElementById('mapa'), fachada = document.getElementById('fachada'); if (!fachada) return;
    var f = document.createElement('iframe');
    f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent('Clínica César Navarro, Av. Alcalde Puche Pardo 7, 23440 Baeza, Jaén') + '&hl=es&z=17&output=embed';
    f.title = 'Mapa con la ubicación de la Clínica César Navarro en Baeza'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    caja.appendChild(f); fachada.remove(); f.focus();
  });

  /* ---- barra-pegajosa-movil v2: aparece pasada la portada; se esconde mientras se ven otros botones de llamar ---- */
  var barra = document.getElementById('barraFija');
  if (barra){
    var act = function(){ barra.classList.toggle('visible', scrollY > innerHeight * .7); };
    addEventListener('scroll', function(){ requestAnimationFrame(act); }, {passive:true}); act();
    if (conIO){
      var vistos = new Set();
      var iob = new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? vistos.add(e.target) : vistos.delete(e.target); }); barra.classList.toggle('tapada', vistos.size > 0); });
      document.querySelectorAll('[data-tapa-barra]').forEach(function(el){ iob.observe(el); });
    }
    /* Mientras se escribe (teclado abierto), la barra se aparta para no tapar el campo */
    document.addEventListener('focusin', function(e){ if (e.target.matches('input, textarea')) barra.classList.add('escribiendo'); });
    document.addEventListener('focusout', function(e){ if (e.target.matches('input, textarea')) barra.classList.remove('escribiendo'); });
  }

  /* ---- galeria-lightbox v4.1 (M51): la foto crece hasta la foto grande ---- */
  (function(){
    var dlg = document.getElementById('lightbox4'); if (!dlg) return;
    var todas = [].slice.call(document.querySelectorAll('.lb4-foto')), img = document.getElementById('lb4Img'), pie = document.getElementById('lb4Pie');
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
