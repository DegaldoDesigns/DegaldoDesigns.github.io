/* Mesa de pacientes (M36 adaptada, componentes/mesa-vista-pajaro.html → variante "mesa de acero", mesa-acero-polaroids.html).
   Polaroids que se arrastran y se lanzan con física (fricción .92, rebote .5 en los bordes de la SECCIÓN).
   Clic sin mover (< 5 px) = visor (window.abrirVisor de js/visor.js). Si se ha arrastrado, un listener de clic en fase
   de captura bloquea ese clic. Todo con style.translate / style.rotate; la entrada anima el hijo .pol-in.
   Movimiento reducido: sin entrada ni inercia (se siguen pudiendo mover). */
(function(){
  'use strict';
  var zona = document.getElementById('mesaZona');
  if (!zona) return;
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mesa = zona.closest('section'), pista = document.getElementById('mesaPista');
  var fotos = [].slice.call(zona.querySelectorAll('.polaroid'));

  var bloquea = false;
  document.addEventListener('click', function(e){ if (bloquea){ e.preventDefault(); e.stopPropagation(); bloquea = false; } }, true);
  function trasArrastre(){ bloquea = true; setTimeout(function(){ bloquea = false; }, 60); }

  var estados = fotos.map(function(f){ var r = parseFloat(f.dataset.r || 0); return { el: f, x: 0, y: 0, vx: 0, vy: 0, r: r, base: r, arr: false, tocada: false }; });
  function limites(s){
    var mr = mesa.getBoundingClientRect(), zr = zona.getBoundingClientRect();
    return { x0: mr.left - zr.left + 8, x1: mr.right - zr.left - s.el.offsetWidth - 8, y0: mr.top - zr.top + 8, y1: mr.bottom - zr.top - s.el.offsetHeight - 8 };
  }
  function pinta(s){ s.el.style.translate = s.x.toFixed(1) + 'px ' + s.y.toFixed(1) + 'px'; s.el.style.rotate = s.r.toFixed(2) + 'deg'; }
  function coloca(){
    var W = zona.clientWidth, H = zona.clientHeight;
    estados.forEach(function(s){
      if (!s.tocada){ s.x = parseFloat(s.el.dataset.x) * (W - s.el.offsetWidth); s.y = parseFloat(s.el.dataset.y) * (H - s.el.offsetHeight); }
      else { var l = limites(s); s.x = Math.min(l.x1, Math.max(l.x0, s.x)); s.y = Math.min(l.y1, Math.max(l.y0, s.y)); }
      pinta(s);
    });
  }
  coloca(); addEventListener('resize', coloca);
  /* las fotos son lazy: al cargar cambia el alto de la polaroid */
  fotos.forEach(function(f){ var i = f.querySelector('img'); if (i && !i.complete) i.addEventListener('load', coloca); });

  var activo = false;
  function fisica(){
    var vivo = false;
    estados.forEach(function(s){
      if (s.arr){ vivo = true; s.r += ((s.base + Math.max(-14, Math.min(14, s.vx * .9))) - s.r) * .2; pinta(s); return; }
      if (Math.abs(s.vx) < .05 && Math.abs(s.vy) < .05 && Math.abs(s.r - s.base) < .05) return;
      vivo = true; s.x += s.vx; s.y += s.vy; s.vx *= .92; s.vy *= .92;
      var l = limites(s);
      if (s.x < l.x0){ s.x = l.x0; s.vx = Math.abs(s.vx) * .5; } if (s.x > l.x1){ s.x = l.x1; s.vx = -Math.abs(s.vx) * .5; }
      if (s.y < l.y0){ s.y = l.y0; s.vy = Math.abs(s.vy) * .5; } if (s.y > l.y1){ s.y = l.y1; s.vy = -Math.abs(s.vy) * .5; }
      s.r += ((s.base + Math.max(-10, Math.min(10, s.vx * .7))) - s.r) * .12; pinta(s);
    });
    if (vivo) requestAnimationFrame(fisica); else activo = false;
  }
  function arranca(){ if (!activo){ activo = true; requestAnimationFrame(fisica); } }

  estados.forEach(function(s){
    var f = s.el, ox = 0, oy = 0, sx = 0, sy = 0, lx = 0, ly = 0, lt = 0, movido = 0;
    f.tabIndex = 0; f.setAttribute('role', 'button');
    /* nombre accesible desde el contenido (alt + pie a mano visibles), con 'Ampliar foto:' delante solo para lectores */
    var sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = 'Ampliar foto: '; f.querySelector('.pol-in').insertBefore(sr, f.querySelector('.pol-in').firstChild);
    f.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); f.click(); } });
    f.addEventListener('pointerdown', function(e){
      if (e.button !== 0) return;
      try{ f.setPointerCapture(e.pointerId); }catch(_){}
      s.arr = true; s.tocada = true; s.vx = s.vy = 0; movido = 0;
      f.classList.add('agarrada'); f.style.zIndex = 20;
      var zr = zona.getBoundingClientRect(); ox = e.clientX - zr.left - s.x; oy = e.clientY - zr.top - s.y;
      sx = lx = e.clientX; sy = ly = e.clientY; lt = performance.now(); arranca();
    });
    f.addEventListener('pointermove', function(e){
      if (!s.arr) return;
      var zr = zona.getBoundingClientRect(), l = limites(s), t = performance.now(), dt = Math.max(8, t - lt);
      s.x = Math.min(l.x1, Math.max(l.x0, e.clientX - zr.left - ox)); s.y = Math.min(l.y1, Math.max(l.y0, e.clientY - zr.top - oy));
      s.vx = s.vx * .5 + ((e.clientX - lx) / dt * 16) * .5; s.vy = s.vy * .5 + ((e.clientY - ly) / dt * 16) * .5;
      lx = e.clientX; ly = e.clientY; lt = t; movido = Math.max(movido, Math.hypot(e.clientX - sx, e.clientY - sy));
    });
    function suelta(){
      if (!s.arr) return; s.arr = false; f.classList.remove('agarrada');
      estados.forEach(function(o){ if (o !== s && +o.el.style.zIndex > 2) o.el.style.zIndex = 2; }); f.style.zIndex = 4;
      if (performance.now() - lt > 90 || reducido){ s.vx = 0; s.vy = 0; }
      if (movido > 5){ trasArrastre(); if (pista) pista.classList.add('fuera'); }
      arranca();
    }
    f.addEventListener('pointerup', suelta); f.addEventListener('pointercancel', suelta);
    f.addEventListener('click', function(){ if (window.abrirVisor) window.abrirVisor(f.dataset.grande, f.dataset.pie, f); });
  });

  /* Entrada: las fotos caen sobre la mesa cuando la mesa entra en pantalla (no es otro momento orquestado: responde al scroll) */
  if (!reducido && document.body.animate && 'IntersectionObserver' in window){
    fotos.forEach(function(f){ f.querySelector('.pol-in').style.opacity = '0'; });
    var io = new IntersectionObserver(function(ents){
      if (!ents[0].isIntersecting) return; io.disconnect();
      fotos.forEach(function(f, i){
        var g = (i % 2 ? 1 : -1) * (8 + i * 3), pi = f.querySelector('.pol-in');
        pi.style.opacity = '';
        pi.animate([{ opacity: 0, transform: 'translateY(-70px) scale(1.25) rotate(' + g + 'deg)' }, { opacity: 1, offset: .4 }, { opacity: 1, transform: 'none' }],
          { duration: 620, delay: i * 140, easing: 'cubic-bezier(0.34,1.28,0.64,1)', fill: 'backwards' });
      });
    }, { threshold: .3 });
    io.observe(zona);
  }
})();
