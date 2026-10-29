/* M108 burro-taller v1 (Millán Atelier v2, 2026-10-26; versión genérica en 01-Libreria-de-Codigo/componentes/burro-taller.html).
   La tira es un scroll horizontal normal (a dedo, rueda, teclado: el foco en la tira y las flechas). Además:
   - Con ratón se arrastra (Pointer Events; un arrastre no cuenta como clic en un alfiler).
   - Al bajar la página con la barra a la vista, las prendas avanzan un poco (parte del desplazamiento vertical va a la tira).
   - Cada prenda cuelga de su gancho (transform-origin) y se balancea con la velocidad de la tira: muelle amortiguado, solo rotate.
   - Alfileres: botón con aria-expanded que abre su nota (también con el foco de teclado); Escape la cierra.
   - El dedo en vertical hace scroll de la página como siempre (no se bloquea nada: es scroll nativo). */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-bt]').forEach(function(bt){
    var tira = bt.querySelector('.bt-tira'), prendas = [].slice.call(bt.querySelectorAll('.bt-prenda'));
    var ang = prendas.map(function(){ return 0; }), vel = prendas.map(function(){ return 0; });
    var ultimoX = tira.scrollLeft, raf = 0, arrastre = null, movido = false;

    /* ---- balanceo ---- */
    function bucle(){
      raf = 0;
      var dx = tira.scrollLeft - ultimoX; ultimoX = tira.scrollLeft;
      var vivo = false;
      prendas.forEach(function(p, i){
        var rigidez = .06 + (i % 3) * .012;                         // cada percha a su ritmo
        vel[i] += Math.max(-.8, Math.min(.8, -dx * .03)) - ang[i] * rigidez;
        vel[i] *= .9; ang[i] = Math.max(-4.5, Math.min(4.5, ang[i] + vel[i]));
        if (Math.abs(ang[i]) > .02 || Math.abs(vel[i]) > .02) vivo = true; else { ang[i] = 0; vel[i] = 0; }
        p.style.rotate = ang[i] ? ang[i].toFixed(2) + 'deg' : '';
      });
      if (vivo || dx) raf = requestAnimationFrame(bucle);
    }
    if (!reducido) tira.addEventListener('scroll', function(){ if (!raf) raf = requestAnimationFrame(bucle); }, {passive:true});

    /* ---- arrastre con ratón ---- */
    tira.addEventListener('pointerdown', function(e){
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      arrastre = {x:e.clientX, s:tira.scrollLeft, id:e.pointerId}; movido = false;
    });
    tira.addEventListener('pointermove', function(e){
      if (!arrastre || e.pointerId !== arrastre.id) return;
      var d = e.clientX - arrastre.x;
      if (!movido && Math.abs(d) > 5){ movido = true; tira.classList.add('arrastrando'); try { tira.setPointerCapture(e.pointerId); } catch (err) {} }
      if (movido) tira.scrollLeft = arrastre.s - d;
    });
    function soltar(){ if (!arrastre) return; arrastre = null; tira.classList.remove('arrastrando'); setTimeout(function(){ movido = false; }, 0); }
    tira.addEventListener('pointerup', soltar); tira.addEventListener('pointercancel', soltar); tira.addEventListener('lostpointercapture', soltar);
    tira.addEventListener('click', function(e){ if (movido){ e.preventDefault(); e.stopPropagation(); } }, true);
    tira.addEventListener('dragstart', function(e){ e.preventDefault(); });

    /* ---- al bajar la página, la tira avanza ---- */
    if (!reducido){
      var visible = false, ultimoY = scrollY;
      if ('IntersectionObserver' in window) new IntersectionObserver(function(es){ visible = es[0].isIntersecting; ultimoY = scrollY; }, {threshold:.2}).observe(bt);
      addEventListener('scroll', function(){
        var dy = scrollY - ultimoY; ultimoY = scrollY;
        if (visible && !arrastre && Math.abs(dy) < 300) tira.scrollLeft += dy * .55;
      }, {passive:true});
    }

    /* ---- alfileres ---- */
    bt.querySelectorAll('.alfiler').forEach(function(a){
      var nota = document.getElementById(a.getAttribute('aria-controls')), onda = document.createElement('span');
      onda.className = 'alfiler-onda'; onda.setAttribute('aria-hidden', 'true'); a.appendChild(onda);
      function abrir(si){ a.setAttribute('aria-expanded', String(si)); nota.hidden = !si; if (si) onda.remove(); }
      a.addEventListener('click', function(){ abrir(a.getAttribute('aria-expanded') !== 'true'); });
      a.addEventListener('focus', function(){ if (a.matches(':focus-visible')) abrir(true); });
      a.addEventListener('blur', function(){ abrir(false); });
      a.addEventListener('keydown', function(e){ if (e.key === 'Escape') abrir(false); });
    });
  });
})();
