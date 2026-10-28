/* M113 atomo-orbitas v1 */
(function(){
  var NS = 'http://www.w3.org/2000/svg', RX = 46, RY = 16;               // % del lado; igual que el ellipse() del CSS
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var escritorio = matchMedia('(min-width: 768px)');
  var conRuta = window.CSS && CSS.supports && CSS.supports('offset-path', 'ellipse(1px 1px at 50% 50%)');

  function el(tag, attrs, padre){ var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (padre) padre.appendChild(n); return n; }

  /* Fracción de recorrido (0-1) del punto de la elipse girada 'a' grados que más avanza en la dirección (dx, dy).
     offset-path: ellipse() empieza en el extremo derecho y gira en el sentido de las agujas del reloj (y hacia abajo). */
  function fraccionHacia(a, dx, dy){
    var K = 360, rad = a * Math.PI / 180, c = Math.cos(rad), s = Math.sin(rad), largo = 0, mejor = -Infinity, enMejor = 0, px = RX, py = 0;
    for (var k = 1; k <= K; k++){
      var t = k / K * 2 * Math.PI, x = RX * Math.cos(t), y = RY * Math.sin(t);
      largo += Math.hypot(x - px, y - py); px = x; py = y;
      var d = (x * c - y * s) * dx + (x * s + y * c) * dy;
      if (d > mejor){ mejor = d; enMejor = largo; }
    }
    return enMejor / largo;
  }

  document.querySelectorAll('[data-ao]').forEach(function(ao){
    var mini = ao.classList.contains('ao-mini');
    var tabs = mini ? [] : Array.prototype.slice.call(ao.querySelectorAll('[role="tab"]'));
    var n = mini ? (parseInt(ao.dataset.aoN, 10) || 3) : tabs.length;
    var tiempos = (ao.dataset.aoTiempos || '11,14,17,20').split(',').map(Number);
    var caja = ao.querySelector('.ao-atomo');
    if (!caja || n < 1) return;

    /* 1. Dibujar el átomo */
    var svg = el('svg', {viewBox:'0 0 100 100', focusable:'false'}, caja);
    var orbitas = [], electrones = [], carriles = [];
    for (var i = 0; i < n; i++){
      var ang = i * 180 / n;
      var g = el('g', {'class':'ao-orbita', transform:'rotate(' + ang + ' 50 50)', style:'--i:' + i}, svg);
      var forma = {cx:50, cy:50, rx:RX, ry:RY, pathLength:1};
      el('ellipse', Object.assign({'class':'ao-toque'}, forma), g);
      el('ellipse', Object.assign({'class':'ao-base'}, forma), g);
      el('ellipse', Object.assign({'class':'ao-on'}, forma), g);
      g.dataset.i = i;
      orbitas.push(g);
      var carril = document.createElement('span'); carril.className = 'ao-carril'; carril.style.setProperty('--a', ang + 'deg');
      var e = document.createElement('i'); e.className = 'ao-e';
      var fase = (i * 37 + 8) % 100;
      e.style.setProperty('--fase', fase + '%');
      carril.appendChild(e); caja.appendChild(carril);
      carriles.push(carril);
      electrones.push({el:e, ang:ang, pos:fase, dur:(tiempos[i] || 11 + 3 * i) * 1000, anim:null});
    }
    var nucleo = el('g', {'class':'ao-nucleo'}, svg);
    el('circle', {cx:50, cy:50, r:7}, nucleo);
    el('circle', {'class':'ao-brillo', cx:47.6, cy:47.4, r:2.4}, nucleo);

    function encender(idx){ orbitas.forEach(function(o, j){ o.classList.toggle('ao-activa', j === idx); }); carriles.forEach(function(c, j){ c.classList.toggle('ao-activa', j === idx); }); }

    /* Variante quieta */
    if (mini){
      ao.classList.add('ao-visto');
      electrones.forEach(function(x){ x.el.classList.add('ao-vivo'); });
      ao.querySelectorAll('[data-ao-orbita]').forEach(function(b){
        var idx = parseInt(b.dataset.aoOrbita, 10);
        b.addEventListener('pointerenter', function(ev){ if (ev.pointerType === 'mouse') encender(idx); });
        b.addEventListener('pointerleave', function(ev){ if (ev.pointerType === 'mouse') encender(-1); });
        b.addEventListener('focus', function(){ encender(idx); });
        b.addEventListener('blur', function(){ encender(-1); });
      });
      return;
    }

    /* 2. Bucles de los electrones (WAAPI; se pausan fuera de pantalla) */
    var corriendo = false, enPantalla = false, activo = -1;
    function bucle(x){
      if (!conRuta || reducido) return;
      if (x.anim) x.anim.cancel();
      x.anim = x.el.animate([{offsetDistance:'0%'}, {offsetDistance:'100%'}], {duration:x.dur, iterations:Infinity});
      x.anim.currentTime = x.pos / 100 * x.dur;
      if (!enPantalla) x.anim.pause();
      x.bucle = true;
    }
    function posActual(x){
      if (!x.anim) return x.pos;
      if (x.bucle) return ((x.anim.currentTime || 0) % x.dur) / x.dur * 100;
      return (parseFloat(getComputedStyle(x.el).offsetDistance) || 0) % 100;
    }
    function aceleron(x){
      var desde = posActual(x), meta;
      var a = caja.getBoundingClientRect(), p = ao.querySelector('.ao-paneles').getBoundingClientRect();
      var dx = (p.left + p.width / 2) - (a.left + a.width / 2), dy = (p.top + p.height / 2) - (a.top + a.height / 2), h = Math.hypot(dx, dy) || 1;
      meta = fraccionHacia(x.ang, dx / h, dy / h) * 100;
      var hasta = desde + ((meta - desde) % 100 + 100) % 100 + 100;
      if (x.anim) x.anim.cancel();
      x.bucle = false; x.pos = meta;
      x.anim = x.el.animate([{offsetDistance:desde + '%'}, {offsetDistance:hasta + '%'}], {duration:700, easing:'cubic-bezier(0.23,1,0.32,1)', fill:'forwards'});
    }

    /* 3. Pestañas */
    var paneles = tabs.map(function(t){ return document.getElementById(t.getAttribute('aria-controls')); });
    var conInert = 'inert' in HTMLElement.prototype;
    function origenFoto(panel){
      var foto = panel && panel.querySelector('.ao-foto'); if (!foto) return;
      var f = foto.getBoundingClientRect(), c = svg.querySelector('.ao-nucleo').getBoundingClientRect();
      var cx = c.left + c.width / 2 - f.left, cy = c.top + c.height / 2 - f.top;
      var r = Math.max(Math.hypot(cx, cy), Math.hypot(cx - f.width, cy), Math.hypot(cx, cy - f.height), Math.hypot(cx - f.width, cy - f.height));
      ao.style.setProperty('--ao-cx', cx.toFixed(1) + 'px'); ao.style.setProperty('--ao-cy', cy.toFixed(1) + 'px'); ao.style.setProperty('--ao-r', Math.ceil(r + 2) + 'px');
    }
    function activar(idx, foco){
      if (idx === activo){ if (foco) tabs[idx].focus(); return; }
      var antes = activo; activo = idx;
      if (ao.classList.contains('ao-listo')) origenFoto(paneles[idx]);
      tabs.forEach(function(t, j){ var si = j === idx; t.setAttribute('aria-selected', si); t.tabIndex = si ? 0 : -1; if (paneles[j]){ paneles[j].classList.toggle('ao-sel', si); if (conInert) paneles[j].inert = !si; } });
      encender(idx);
      if (foco) tabs[idx].focus();
      if (!corriendo) return;
      if (antes > -1 && electrones[antes].anim && !electrones[antes].bucle){ var y = electrones[antes]; y.pos = posActual(y); bucle(y); }
      if (escritorio.matches && !reducido && conRuta) aceleron(electrones[idx]);
    }
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ activar(i, false); });
      t.addEventListener('keydown', function(e){
        var d = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') d = 0;
        if (e.key === 'End') d = tabs.length - 1;
        if (d !== null){ e.preventDefault(); activar(d, true); }
      });
      t.addEventListener('pointerenter', function(ev){ if (ev.pointerType === 'mouse') orbitas[i].classList.add('ao-asoma'); });
      t.addEventListener('pointerleave', function(){ orbitas[i].classList.remove('ao-asoma'); });
    });
    orbitas.forEach(function(o, i){ o.querySelector('.ao-toque').addEventListener('click', function(){ activar(i, false); }); });

    var inicial = Math.max(0, tabs.findIndex(function(t){ return t.getAttribute('aria-selected') === 'true'; }));
    activar(inicial, false);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ origenFoto(paneles[activo]); ao.classList.add('ao-listo'); }); });

    /* 4. Entrada al verse al 50 % y pausa fuera de pantalla */
    function arrancar(){
      if (corriendo) return; corriendo = true;
      electrones.forEach(function(x){ x.el.classList.add('ao-vivo'); bucle(x); });
      if (escritorio.matches && !reducido && conRuta) aceleron(electrones[activo]);
    }
    function entrar(){
      if (ao.classList.contains('ao-visto')) return;
      ao.classList.add('ao-visto');
      setTimeout(arrancar, reducido ? 0 : 600 + 120 * (n - 1));
    }
    if (!('IntersectionObserver' in window)){ enPantalla = true; entrar(); return; }
    if (reducido) entrar();
    else new IntersectionObserver(function(es, obs){ if (es[0].isIntersecting){ obs.disconnect(); entrar(); } }, {threshold:.5}).observe(caja);
    new IntersectionObserver(function(es){
      enPantalla = es[0].isIntersecting;
      electrones.forEach(function(x){ if (x.anim && x.bucle){ enPantalla ? x.anim.play() : x.anim.pause(); } });
    }).observe(ao);
  });
})();
