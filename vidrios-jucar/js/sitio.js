/* Vidrios Jucar · JS común (2026-10-22). Cada bloque sale de un componente de 01-Libreria-de-Codigo/componentes
   y solo actúa si su pieza existe en la página. Nada depende de él para leerse: sin JS, todo está a la vista. */
(function(){
  'use strict';
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $$(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* --- cabecera-inteligente: pegada (respaldo) y esconder al bajar --- */
  var cab = document.querySelector('.cabecera');
  if (cab){
    var cent = document.querySelector('.centinela');
    if (cent && !(window.CSS && CSS.supports('container-type', 'scroll-state')) && 'IntersectionObserver' in window){
      new IntersectionObserver(function(e){ cab.classList.toggle('pegada', !e[0].isIntersecting); }).observe(cent);
    }
    var ultimo = scrollY, pend = false;
    addEventListener('scroll', function(){
      if (pend) return; pend = true;
      requestAnimationFrame(function(){
        pend = false;
        var y = scrollY, d = y - ultimo;
        if (Math.abs(d) < 8) return;
        var menu = document.getElementById('menu');
        if (y < 120 || d < 0 || (menu && menu.matches(':popover-open'))) cab.classList.remove('oculta'); else cab.classList.add('oculta');
        ultimo = y;
      });
    }, {passive:true});
  }

  /* --- menu-escalonado: círculo desde el botón, aria-expanded sincronizado --- */
  var menu = document.getElementById('menu'), hamb = document.querySelector('.hamb');
  if (menu && hamb && typeof menu.showPopover === 'function'){
    var centrar = function(){ var r = hamb.getBoundingClientRect(); menu.style.setProperty('--cx', (r.left + r.width / 2) + 'px'); menu.style.setProperty('--cy', (r.top + r.height / 2) + 'px'); };
    hamb.addEventListener('pointerdown', centrar); hamb.addEventListener('keydown', centrar);
    menu.addEventListener('beforetoggle', function(e){ if (e.newState === 'open') centrar(); });
    menu.addEventListener('toggle', function(e){
      var abierto = e.newState === 'open';
      hamb.setAttribute('aria-expanded', String(abierto)); hamb.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      if (!abierto) hamb.focus();
    });
    $$('a', menu).forEach(function(a){ a.addEventListener('click', function(){ menu.hidePopover(); }); });
  }

  /* --- pausa de bucles fuera de pantalla (.mov / .en-pantalla) --- */
  if ('IntersectionObserver' in window){
    var ioMov = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('en-pantalla', e.isIntersecting); }); });
    $$('.mov').forEach(function(el){ ioMov.observe(el); });
  }

  /* --- titulares-animados: revelado por palabras (M01) --- */
  $$('.titular-palabras').forEach(function(h){
    var n = 0;
    (function partir(nodo){
      Array.prototype.slice.call(nodo.childNodes).forEach(function(hijo){
        if (hijo.nodeType === 3){
          var frag = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach(function(t){
            if (!t) return;
            if (/^\s+$/.test(t)){ frag.appendChild(document.createTextNode(' ')); return; }
            var v = document.createElement('span'); v.className = 'ventana';
            var p = document.createElement('span'); p.className = 'palabra'; p.textContent = t;
            p.style.setProperty('--i', Math.min(n++, 12));
            v.appendChild(p); frag.appendChild(v);
          });
          nodo.replaceChild(frag, hijo);
        } else if (hijo.nodeType === 1 && hijo.tagName !== 'BR' && hijo.tagName.toLowerCase() !== 'svg'){ partir(hijo); }
      });
    })(h);
  });

  /* --- revelado de titulares y brochazo (observar el CONTENEDOR, nunca el elemento recortado) --- */
  var revs = $$('.titular-palabras, .rev-cont');
  if (reducido || !('IntersectionObserver' in window)){ revs.forEach(function(h){ h.classList.add('visto', 'pintada'); }); }
  else {
    var ioRev = new IntersectionObserver(function(es){
      es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add('visto', 'pintada'); ioRev.unobserve(e.target); } });
    }, {rootMargin:'0px 0px -10% 0px'});
    revs.forEach(function(h){ ioRev.observe(h); });
  }

  /* --- texto-revelado-scroll: partir en palabras (M14) --- */
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

  /* --- barra fija de móvil: aparece pasada la primera pantalla --- */
  var barraFija = document.getElementById('barraFija');
  if (barraFija){
    var act = function(){ barraFija.classList.toggle('visible', scrollY > innerHeight * .6); };
    addEventListener('scroll', function(){ requestAnimationFrame(act); }, {passive:true}); act();
  }

  /* --- galería con lightbox (v3: data-galeria, data-grande, data-pie) --- */
  var fotos = $$('[data-lb]');
  if (fotos.length){
    var dlg = document.createElement('dialog');
    dlg.className = 'lightbox'; dlg.setAttribute('aria-label', 'Foto ampliada');
    dlg.innerHTML = '<div class="lb-inner"><div class="lb-imagen"><img alt=""></div><div class="lb-barra"><p class="lb-pie" aria-live="polite"></p><div class="lb-controles">' +
      '<button class="lb-btn" type="button" data-ir="-1" aria-label="Foto anterior">&#8249;</button><button class="lb-btn" type="button" data-ir="1" aria-label="Foto siguiente">&#8250;</button>' +
      '<button class="lb-btn" type="button" data-cerrar aria-label="Cerrar">&#10005;</button></div></div></div>';
    document.body.appendChild(dlg);
    var lbImg = dlg.querySelector('img'), lbPie = dlg.querySelector('.lb-pie'), grupo = [], ind = 0, disparador = null;
    var mostrar = function(i){
      ind = (i + grupo.length) % grupo.length;
      var f = grupo[ind], mini = f.querySelector('img');
      lbImg.src = f.getAttribute('data-grande') || mini.currentSrc || mini.src;
      lbImg.alt = mini.alt;
      lbPie.textContent = (f.getAttribute('data-pie') || mini.alt) + ' (' + (ind + 1) + ' de ' + grupo.length + ')';
      dlg.querySelectorAll('[data-ir]').forEach(function(b){ b.hidden = grupo.length < 2; });
    };
    var cerrar = function(){
      dlg.classList.remove('is-open');
      var fin = function(){ dlg.close(); dlg.removeEventListener('transitionend', fin); if (disparador) disparador.focus(); };
      if (reducido) fin(); else { dlg.addEventListener('transitionend', fin); setTimeout(function(){ if (dlg.open) fin(); }, 400); }
    };
    fotos.forEach(function(f){
      f.addEventListener('click', function(){
        disparador = f;
        var nombre = f.getAttribute('data-galeria');
        grupo = fotos.filter(function(x){ return x.getAttribute('data-galeria') === nombre; });
        mostrar(grupo.indexOf(f));
        dlg.showModal(); requestAnimationFrame(function(){ dlg.classList.add('is-open'); });
      });
    });
    dlg.addEventListener('click', function(e){
      if (e.target === dlg || e.target.hasAttribute('data-cerrar')) cerrar();
      else if (e.target.hasAttribute('data-ir')) mostrar(ind + +e.target.getAttribute('data-ir'));
    });
    dlg.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') mostrar(ind + 1); if (e.key === 'ArrowLeft') mostrar(ind - 1); });
    dlg.addEventListener('cancel', function(){ dlg.classList.remove('is-open'); });
  }

  /* --- acordeon-nativo: altura real animada con la Web Animations API --- */
  $$('details.acordeon').forEach(function(el){
    var sum = el.querySelector('summary'), cont = el.querySelector('.contenido'), anim = null;
    sum.addEventListener('click', function(e){
      e.preventDefault();
      if (reducido){ el.open = !el.open; return; }
      el.style.overflow = 'hidden';
      var abrir = !el.open, desde = el.offsetHeight + 'px';
      if (abrir) el.open = true;
      var hasta = (abrir ? sum.offsetHeight + cont.offsetHeight : sum.offsetHeight) + 'px';
      if (anim) anim.cancel();
      anim = el.animate({height:[desde, hasta]}, {duration:250, easing:'cubic-bezier(0.23,1,0.32,1)'});
      anim.onfinish = function(){ el.open = abrir; anim = null; el.style.overflow = ''; };
    });
  });

  /* --- pila de tarjetas (M11): la de debajo se encoge y oscurece --- */
  if (!reducido) $$('.pila').forEach(function(pila){
    var cartas = $$('.carta', pila), p2 = false;
    var calc = function(){
      p2 = false;
      var r = pila.getBoundingClientRect(); if (r.bottom < -200 || r.top > innerHeight + 200) return;
      cartas.forEach(function(c, i){
        var sig = cartas[i + 1]; if (!sig) return;
        var a = c.getBoundingClientRect(), b = sig.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, 1 - (b.top - a.top) / c.offsetHeight));
        c.style.scale = (1 - p * .05).toFixed(4); c.style.setProperty('--osc', (p * .45).toFixed(3));
      });
    };
    addEventListener('scroll', function(){ if (!p2){ p2 = true; requestAnimationFrame(calc); } }, {passive:true});
    addEventListener('resize', calc); calc();
  });

  /* --- ubicacion-mapa v3: el mapa de Google solo se crea al pulsar --- */
  $$('[data-mapa]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var caja = btn.closest('.mapa'), fachada = btn.closest('.fachada-mapa');
      var f = document.createElement('iframe');
      f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(btn.getAttribute('data-mapa')) + '&hl=es&z=16&output=embed';
      f.title = 'Mapa de Google con la ubicación de Vidrios Jucar en Heras';
      f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.setAttribute('allowfullscreen', '');
      caja.appendChild(f); fachada.remove();
    });
  });

  /* --- cartel-abierto-cerrado v2: horario partido en la zona del negocio --- */
  var puerta = document.getElementById('puertaWrap');
  if (puerta){
    var ZONA = 'Europe/Madrid';
    var TRAMOS = [[9*60, 14*60], [15*60, 18*60]];
    var HORARIO = {1:TRAMOS, 2:TRAMOS, 3:TRAMOS, 4:TRAMOS, 5:TRAMOS};
    var DIA = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var ahora = function(){
      try{
        var o = {};
        new Intl.DateTimeFormat('en-US', {timeZone:ZONA, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23'}).formatToParts(new Date()).forEach(function(p){ o[p.type] = p.value; });
        return {d:{Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[o.weekday], min:(+o.hour) * 60 + (+o.minute)};
      }catch(e){ var n = new Date(); return {d:n.getDay(), min:n.getHours() * 60 + n.getMinutes()}; }
    };
    var hh = function(m){ return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); };
    var dur = function(m){ var d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
      if (d > 0) return d + ' d' + (h ? ' ' + h + ' h' : ''); if (h > 0) return h + ' h' + (mi ? ' ' + mi + ' min' : ''); return mi + ' min'; };
    var estado = function(t){
      var hoy = HORARIO[t.d] || [], i;
      for (i = 0; i < hoy.length; i++) if (t.min >= hoy[i][0] && t.min < hoy[i][1]) return {abierto:true, cierra:hoy[i][1], falta:hoy[i][1] - t.min, ultimo:i === hoy.length - 1};
      for (var k = 0; k < 8; k++){ var dia = (t.d + k) % 7, tr = HORARIO[dia] || [];
        for (i = 0; i < tr.length; i++){ var f = k * 1440 + tr[i][0] - t.min; if (f > 0) return {abierto:false, k:k, dia:dia, abre:tr[i][0], falta:f, mediodia:k === 0 && i > 0}; } }
      return {abierto:false, k:-1};
    };
    var set = function(id, v){ var el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; };
    var pintar = function(){
      var t = ahora(), e = estado(t), det, cuenta = '';
      if (e.abierto){ det = e.ultimo ? 'Cerramos a las ' + hh(e.cierra) : 'Hasta las ' + hh(e.cierra) + '; volvemos a las ' + hh(HORARIO[t.d][1][0]); cuenta = 'Quedan ' + dur(e.falta); }
      else if (e.k >= 0){ det = (e.mediodia ? 'Volvemos a las ' : e.k === 0 ? 'Hoy abrimos a las ' : e.k === 1 ? 'Mañana abrimos a las ' : 'Abrimos el ' + DIA[e.dia] + ' a las ') + hh(e.abre); cuenta = 'Faltan ' + dur(e.falta); }
      else det = 'Consulta el horario';
      var s = e.abierto ? 'abierto' : 'cerrado';
      puerta.setAttribute('data-estado', s);
      var sec = puerta.closest('section'); if (sec) sec.setAttribute('data-estado', s);
      set('puertaEst', e.abierto ? 'Abierto' : 'Cerrado'); set('puertaDet', det); set('puertaCuenta', cuenta || ' ');
      $$('.dia[data-dow]').forEach(function(li){ li.classList.toggle('hoy', +li.getAttribute('data-dow') === t.d); });
    };
    pintar(); setInterval(pintar, 30000);
  }

  /* --- copiar-portapapeles --- */
  $$('[data-copiar]').forEach(function(b){
    b.addEventListener('click', function(){
      var texto = b.getAttribute('data-copiar'), vivo = document.getElementById('avisoCopia');
      var hecho = function(){ b.classList.add('hecho'); if (vivo) vivo.textContent = 'Copiado: ' + texto; setTimeout(function(){ b.classList.remove('hecho'); }, 2200); };
      var aMano = function(){ if (vivo) vivo.textContent = 'No se pudo copiar. La dirección es ' + texto; };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(texto).then(hecho, aMano);
      else { try{ var ta = document.createElement('textarea'); ta.value = texto; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); ok ? hecho() : aMano(); }catch(e){ aMano(); } }
    });
  });

  /* --- formulario-presupuesto-email: compone un mailto: con asunto y cuerpo (sin backend) --- */
  var form = document.getElementById('formPresu');
  if (form){
    var DESTINO = form.getAttribute('data-destino');
    var aviso = form.querySelector('.aviso');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      if (form.querySelector('[name="web"]').value) return;            // honeypot: un bot lo rellena
      if (!form.reportValidity()) return;
      var v = function(n){ var el = form.elements[n]; return el ? el.value.trim() : ''; };
      var asunto = 'Presupuesto: ' + v('trabajo') + (v('localidad') ? ' en ' + v('localidad') : '');
      var lineas = ['Hola, quiero pedir presupuesto.', '', 'Qué necesito: ' + v('trabajo')];
      if (v('localidad')) lineas.push('Dónde: ' + v('localidad'));
      if (v('medidas')) lineas.push('Medidas aproximadas: ' + v('medidas'));
      if (v('mensaje')) lineas.push('', v('mensaje'));
      lineas.push('', 'Nombre: ' + v('nombre'));
      if (v('telefono')) lineas.push('Teléfono: ' + v('telefono'));
      lineas.push('', '(Si tengo fotos o un plano, los adjunto a este correo.)');
      var url = 'mailto:' + DESTINO + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(lineas.join('\r\n'));
      aviso.textContent = '';
      location.href = url;
      setTimeout(function(){ aviso.textContent = 'Si no se ha abierto tu correo, escríbenos directamente a ' + DESTINO + ' o llama al 942 54 15 74.'; }, 1500);
    });
  }

  /* --- A partir de aquí, solo con ratón y sin movimiento reducido --- */
  if (reducido) return;

  /* --- decoracion-parallax: posición de la SECCIÓN, no del elemento --- */
  var capas = $$('[data-px],[data-py]');
  if (capas.length){
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

  if (!raton) return;

  /* --- interacciones-cursor v3: imán en botones importantes (translate, no transform) --- */
  $$('.iman').forEach(function(b){
    b.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = b.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .35;
      b.style.translate = Math.max(-10, Math.min(10, x)).toFixed(1) + 'px ' + Math.max(-7, Math.min(7, y)).toFixed(1) + 'px'; });
    b.addEventListener('pointerleave', function(){ b.style.translate = ''; });
  });
  /* foto protagonista con imán y profundidad */
  $$('.foto-iman').forEach(function(f){
    var img = f.querySelector('img'), sello = f.querySelector('figcaption');
    f.addEventListener('pointermove', function(e){ if (e.pointerType !== 'mouse') return; var r = f.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      f.style.translate = (x * 30).toFixed(1) + 'px ' + (y * 26).toFixed(1) + 'px';
      img.style.translate = (x * -12).toFixed(1) + 'px ' + (y * -10).toFixed(1) + 'px'; img.style.scale = '1.04';
      if (sello) sello.style.translate = (x * 24).toFixed(1) + 'px ' + (y * 18).toFixed(1) + 'px'; });
    f.addEventListener('pointerleave', function(){ f.style.translate = ''; img.style.translate = ''; img.style.scale = ''; if (sello) sello.style.translate = ''; });
  });
  /* resplandor delegado: un único listener */
  var SEL = '.temas li, .faq details', pg = null;
  document.addEventListener('mousemove', function(e){
    if (pg) return;
    pg = requestAnimationFrame(function(){ pg = null;
      var el = e.target && e.target.closest ? e.target.closest(SEL) : null; if (!el) return;
      var r = el.getBoundingClientRect(); el.style.setProperty('--gx', (e.clientX - r.left) + 'px'); el.style.setProperty('--gy', (e.clientY - r.top) + 'px'); });
  });

  /* --- lamina-vidrio (M23): inclinación hacia el cursor --- */
  $$('.lv').forEach(function(sec){
    var escena = sec.querySelector('.lv-escena'), lamina = sec.querySelector('.lv-lamina');
    var x = 0, y = 0, tx = 0, ty = 0, raf = null;
    var bucle = function(){
      x += (tx - x) * .12; y += (ty - y) * .12;
      lamina.style.setProperty('--lv-mx', x.toFixed(3)); lamina.style.setProperty('--lv-my', y.toFixed(3));
      if (Math.abs(tx - x) < .002 && Math.abs(ty - y) < .002){ raf = null; return; }
      raf = requestAnimationFrame(bucle);
    };
    var pide = function(){ if (!raf) raf = requestAnimationFrame(bucle); };
    escena.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse') return;
      var r = escena.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - r.left) / r.width * 2 - 1));
      ty = Math.max(-1, Math.min(1, (e.clientY - r.top) / r.height * 2 - 1));
      pide();
    });
    escena.addEventListener('pointerleave', function(){ tx = 0; ty = 0; pide(); });
  });
})();
