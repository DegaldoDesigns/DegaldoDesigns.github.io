/* rueda-scroll (M114) v1, copia de la librería. Energy: se carga tras luces:fin (ver sitio.js). */
/* ==================== COMPONENTE: rueda-scroll (JS) ==================== */
(function(){
  var ruedas = [].slice.call(document.querySelectorAll('[data-rs]'));
  if(!ruedas.length || !('IntersectionObserver' in window)) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---- Colocar la capa .rs-foto sobre el disco de su foto ---- */
  function posicion(valor, libre){            // un eje de object-position → px desde el borde
    if(valor === 'left' || valor === 'top') return 0;
    if(valor === 'right' || valor === 'bottom') return libre;
    if(valor === 'center' || valor === undefined) return libre / 2;
    if(valor.slice(-1) === '%') return libre * parseFloat(valor) / 100;
    return parseFloat(valor) || 0;
  }
  function colocar(r){
    var img = r._img;
    if(!img || !img.naturalWidth) return;
    var cs = getComputedStyle(r), ci = getComputedStyle(img);
    var cx = parseFloat(cs.getPropertyValue('--rs-cx')), cy = parseFloat(cs.getPropertyValue('--rs-cy')), rr = parseFloat(cs.getPropertyValue('--rs-r'));
    if(!(cx >= 0 && cy >= 0 && rr > 0)) return;
    var W = img.clientWidth, H = img.clientHeight, nw = img.naturalWidth, nh = img.naturalHeight;
    var dw = W, dh = H, ajuste = ci.objectFit;
    if(ajuste === 'cover' || ajuste === 'contain'){
      var s = ajuste === 'cover' ? Math.max(W / nw, H / nh) : Math.min(W / nw, H / nh);
      dw = nw * s; dh = nh * s;
    }
    var op = ci.objectPosition.split(/\s+/);
    var caja = img.getBoundingClientRect(), padre = (r.offsetParent || document.body).getBoundingClientRect();
    var x0 = caja.left - padre.left + posicion(op[0], W - dw), y0 = caja.top - padre.top + posicion(op[1], H - dh);
    var R = rr * dw;
    r.style.width = r.style.height = (2 * R).toFixed(1) + 'px';
    r.style.left = (x0 + cx * dw - R).toFixed(1) + 'px';
    r.style.top = (y0 + cy * dh - R).toFixed(1) + 'px';
    r.classList.add('rs-lista');
  }
  var recolocar = function(){ ruedas.forEach(function(r){ if(r._img) colocar(r); }); };
  var ro = 'ResizeObserver' in window ? new ResizeObserver(recolocar) : null;

  /* ---- Estado de cada rueda ---- */
  ruedas.forEach(function(r){
    r.rueda = {
      ang: 0, w: 0, op: -1,
      vel: parseFloat(r.getAttribute('data-rs-vel')) || 0.6,
      sentido: r.getAttribute('data-rs-sentido') === '-1' ? -1 : 1,
      inercia: r.hasAttribute('data-rs-inercia') ? Math.max(0, parseFloat(r.getAttribute('data-rs-inercia')) || 0) : 1100,
      gira: r.querySelector('.rs-gira'),
      estela: r.querySelector('.rs-estela'),
      nitido: r.querySelector('.rs-gira svg')
    };
    if(r.classList.contains('rs-foto')){
      r._img = r.parentElement.querySelector('img');
      if(r._img){
        r._img.addEventListener('load', function(){ colocar(r); });
        if(ro) ro.observe(r._img);
        colocar(r);
      }
    }
  });
  if(!ro) addEventListener('resize', recolocar);

  /* ---- Bucle: solo con scroll o mientras frena, solo las ruedas en pantalla ---- */
  var vivas = [], ultY = scrollY, ultT = 0, raf = 0;
  var MAX = 1.6;                               // grados/ms: tope para que los agujeros no "vayan hacia atrás" (efecto carro)
  var ROCE = 0.00012;                          // grados/ms²: frenado constante que se suma al de la inercia
  var io = new IntersectionObserver(function(entradas){
    entradas.forEach(function(e){
      var i = vivas.indexOf(e.target);
      if(e.isIntersecting && i < 0) vivas.push(e.target);
      if(!e.isIntersecting && i >= 0) vivas.splice(i, 1);
    });
  }, {rootMargin:'80px 0px'});
  ruedas.forEach(function(r){ io.observe(r); });

  function arrancar(){
    if(!vivas.length){ ultY = scrollY; return; }  // fuera de pantalla: no se calcula nada (y al volver no hay salto)
    if(!raf){ ultT = performance.now(); raf = requestAnimationFrame(paso); }
  }
  function paso(t){
    var dt = Math.min(64, Math.max(1, t - ultT)); ultT = t;
    var y = scrollY, dy = Math.max(-260, Math.min(260, y - ultY)); ultY = y;
    var sigue = dy !== 0;
    for(var k = 0; k < vivas.length; k++){
      var e = vivas[k].rueda;
      var entra = dy * e.vel * e.sentido / dt;  // velocidad que pide el scroll (grados/ms)
      var w = e.w;
      if(e.inercia === 0) w = entra;
      else {
        var libre = w * Math.exp(-dt / e.inercia);  // frenando sola
        // Si el scroll empuja más fuerte o en sentido contrario, la rueda lo sigue enseguida; si no, rueda libre.
        w = (dy !== 0 && (entra * libre < 0 || Math.abs(entra) > Math.abs(libre))) ? libre + (entra - libre) * Math.min(1, dt / 45) : libre;
        if(dy === 0) w = w > 0 ? Math.max(0, w - ROCE * dt) : Math.min(0, w + ROCE * dt);  // roce: se para del todo, sin cola eterna
      }
      w = Math.max(-MAX, Math.min(MAX, w));
      if(Math.abs(w) < 0.002) w = 0; else sigue = true;
      e.w = w;
      if(w !== 0){ e.ang = (e.ang + w * dt) % 360; e.gira.style.rotate = e.ang.toFixed(2) + 'deg'; }
      var v = Math.min(1, Math.abs(w) / (MAX * 0.75));  // 0 quieta … 1 deprisa
      v = Math.round(v * 40) / 40;
      if(v !== e.op){
        e.op = v;
        if(e.estela) e.estela.style.opacity = v;
        if(e.nitido) e.nitido.style.opacity = 1 - v * 0.7;
      }
    }
    raf = sigue ? requestAnimationFrame(paso) : 0;
  }
  addEventListener('scroll', arrancar, {passive:true});
})();
/* ================== FIN COMPONENTE: rueda-scroll (JS) ================== */
