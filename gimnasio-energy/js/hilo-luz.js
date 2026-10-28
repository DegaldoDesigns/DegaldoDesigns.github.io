/* hilo-luz (M121) v1.1, copia de la librería. */
/* ================= COMPONENTE: hilo-luz (M121) ================= */
(function(){
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conTimeline = !!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()') && CSS.supports('view-timeline-name: --a'));
  var todos = [];

  function luminosidad(el){
    for (var n = el; n && n.nodeType === 1; n = n.parentElement){
      var m = getComputedStyle(n).backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > .5)){
        var c = m.slice(0, 3).map(function(v){ v = v / 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
        return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
      }
    }
    return 0;
  }
  function seccionDe(el, secciones){ for (var i = 0; i < secciones.length; i++) if (secciones[i].contains(el)) return i; return -1; }

  function iniciar(cont){
    if (cont.hl) return cont.hl;
    var sel = cont.getAttribute('data-hl-tramos') || ':scope > section';
    var secciones = [].slice.call(cont.querySelectorAll(sel));
    var paradas = [].slice.call(cont.querySelectorAll('[data-hl-parada]'));
    var q = function(a){ var s = cont.getAttribute(a); return s ? (cont.querySelector(s) || document.querySelector(s)) : null; };
    var desde = q('data-hl-desde'), hasta = q('data-hl-hasta') || paradas[paradas.length - 1];
    if (!secciones.length || !hasta) return null;
    var i0 = desde ? seccionDe(desde, secciones) : -1; if (i0 < 0) i0 = paradas.length ? seccionDe(paradas[0], secciones) : 0;
    var i1 = seccionDe(hasta, secciones); if (i1 < i0) return null;
    var izq = cont.getAttribute('data-hl-lado') === 'izquierda';
    var st = { cont:cont, tramos:[], vivo:false, visibles:[] };
    cont.hl = st;

    for (var i = i0; i <= i1; i++){
      var s = secciones[i];
      if (getComputedStyle(s).position === 'static') s.style.position = 'relative';
      s.classList.add('hl-sec');
      var tono = s.getAttribute('data-hl-tono') || (luminosidad(s) > .3 ? 'claro' : 'oscuro');
      var t = document.createElement('span'); t.className = 'hl-tramo hl-' + tono; t.setAttribute('aria-hidden', 'true');
      t.innerHTML = '<span class="hl-via"></span><span class="hl-luz"></span><span class="hl-carro"></span>';
      var tr = { sec:s, el:t, luz:t.children[1], carro:t.children[2], nodos:[] };
      paradas.forEach(function(p){
        if (!s.contains(p)) return;
        p.classList.add('hl-sobre-' + tono);
        var n = document.createElement('span'); n.className = 'hl-nodo'; t.appendChild(n);
        tr.nodos.push({ parada:p, el:n }); p._hlNodo = n;
      });
      s.appendChild(t);
      st.tramos.push(tr);
    }
    if (desde){
      var sal = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      sal.setAttribute('class', 'hl-salida ' + st.tramos[0].el.className.split(' ')[1]); sal.setAttribute('aria-hidden', 'true'); sal.setAttribute('focusable', 'false');
      sal.innerHTML = '<path pathLength="1"/>';
      st.tramos[0].sec.appendChild(sal); st.salida = sal;
    }

    function medir(){
      var cw = document.documentElement.clientWidth, cs = getComputedStyle(cont);
      var hueco = parseFloat(cs.getPropertyValue('--hl-hueco')) || 8, salidaY = parseFloat(cs.getPropertyValue('--hl-salida')) || 48;
      var junto = st.tramos[0].sec.querySelector(cont.getAttribute('data-hl-junto') || '.wrap');
      var x;
      if (junto){
        var jr = junto.getBoundingClientRect(), jc = getComputedStyle(junto);
        x = izq ? (jr.left + parseFloat(jc.paddingLeft)) / 2 : (jr.right - parseFloat(jc.paddingRight) + cw) / 2;
      } else x = izq ? 40 : cw - 40;
      x = izq ? Math.max(x, hueco) : Math.min(x, cw - hueco);
      var arriba = null, abajo = hasta.getBoundingClientRect();
      var finY = abajo.top + Math.min(abajo.height / 2, 14);
      if (desde && st.salida){
        var dr = desde.getBoundingClientRect(), sr0 = st.tramos[0].sec.getBoundingClientRect();
        var bx = izq ? dr.left : dr.right, dist = izq ? bx - x : x - bx;
        var y0 = dr.bottom - Math.min(salidaY, dr.height / 3);
        if (dist > 6){
          var r = Math.min(26, dist - 2), ax = Math.min(bx, x) - 4, svgW = Math.abs(x - bx) + 8;
          var sx = bx - ax, ex = x - ax, sgn = izq ? -1 : 1;
          st.salida.style.display = '';
          st.salida.setAttribute('width', svgW); st.salida.setAttribute('height', r + 8);
          st.salida.style.left = (ax - sr0.left) + 'px'; st.salida.style.top = (y0 - 4 - sr0.top) + 'px';
          st.salida.firstChild.setAttribute('d', 'M' + sx + ' 4H' + (ex - sgn * r) + 'Q' + ex + ' 4 ' + ex + ' ' + (4 + r));
          arriba = y0 + r;
        } else { st.salida.style.display = 'none'; arriba = dr.bottom; }
      }
      st.tramos.forEach(function(tr, k){
        var sr = tr.sec.getBoundingClientRect();
        var top = (k === 0 && arriba !== null) ? arriba - sr.top : (k === 0 && !desde ? finY - sr.top : 0);
        if (k === 0 && !desde && paradas.length){ var pr = paradas[0].getBoundingClientRect(); top = pr.top + Math.min(pr.height / 2, 14) - sr.top; }
        var bottom = (k === st.tramos.length - 1) ? sr.bottom - finY : 0;
        tr.el.style.left = (x - sr.left) + 'px';
        tr.el.style.top = Math.max(0, top) + 'px';
        tr.el.style.bottom = Math.max(0, bottom) + 'px';
        var tTop = sr.top + Math.max(0, top);
        tr.nodos.forEach(function(n){ var pr = n.parada.getBoundingClientRect(); n.el.style.top = (pr.top + Math.min(pr.height / 2, 14) - tTop) + 'px'; });
      });
      if (!conTimeline && st.vivo && !reducido) pedir();
    }
    var pendiente = false, anchoAntes = 0;
    function pedirMedir(){ if (pendiente) return; pendiente = true; requestAnimationFrame(function(){ pendiente = false; medir(); }); }
    st.medir = medir;

    /* Respaldo sin animation-timeline: transform en un rAF, solo para los tramos que se ven */
    var marco = false;
    function pintar(){
      marco = false;
      var vh = window.innerHeight, punto = parseFloat(getComputedStyle(cont).getPropertyValue('--hl-punto')) || .6, lect = vh * punto;
      var datos = st.visibles.map(function(tr){ var r = tr.el.getBoundingClientRect(); return [tr, r]; });
      datos.forEach(function(d){
        var r = d[1], p = r.height ? Math.min(1, Math.max(0, (lect - r.top) / r.height)) : 0;
        d[0].luz.style.transform = 'scaleY(' + p.toFixed(4) + ')';
        d[0].carro.style.transform = 'translateY(' + (p * 100).toFixed(2) + '%)';
        d[0].carro.style.opacity = (p > .015 && p < .985) ? 1 : 0;
      });
    }
    function pedir(){ if (!marco){ marco = true; requestAnimationFrame(pintar); } }

    function arrancar(){
      if (st.vivo) return; st.vivo = true;
      medir();
      if (reducido) cont.classList.add('hl-quieta');
      else if (conTimeline) cont.classList.add('hl-css');
      void cont.offsetWidth;
      cont.classList.add('hl-vivo');
      var punto = parseFloat(getComputedStyle(cont).getPropertyValue('--hl-punto')) || .6;
      if (reducido){ paradas.forEach(function(p){ p.classList.add('hl-on'); if (p._hlNodo) p._hlNodo.classList.add('hl-on'); }); }
      else if ('IntersectionObserver' in window){
        var io = new IntersectionObserver(function(es){
          es.forEach(function(e){
            var on = e.isIntersecting;                       /* la zona va desde muy arriba hasta el punto de lectura */
            e.target.classList.toggle('hl-on', on);
            if (e.target._hlNodo) e.target._hlNodo.classList.toggle('hl-on', on);
          });
        }, { rootMargin:'99999px 0px ' + (-(1 - punto) * 100).toFixed(1) + '% 0px', threshold:0 });
        paradas.forEach(function(p){ io.observe(p); });
        if (!conTimeline){
          var vis = new IntersectionObserver(function(es){
            es.forEach(function(e){
              var tr = st.tramos.filter(function(t){ return t.el === e.target; })[0], k = st.visibles.indexOf(tr);
              if (e.isIntersecting && k < 0) st.visibles.push(tr);
              if (!e.isIntersecting && k >= 0){ st.visibles.splice(k, 1); }
              if (!e.isIntersecting){ var r = e.boundingClientRect, lect = innerHeight * punto, p = r.top > lect ? 0 : 1;
                tr.luz.style.transform = 'scaleY(' + p + ')'; tr.carro.style.opacity = 0; }
            });
            pedir();
          });
          st.tramos.forEach(function(tr){ vis.observe(tr.el); });
          addEventListener('scroll', pedir, { passive:true });
        }
      } else paradas.forEach(function(p){ p.classList.add('hl-on'); });
      cont.dispatchEvent(new CustomEvent('hilo:listo', { bubbles:true }));
    }

    medir();
    anchoAntes = document.documentElement.clientWidth;
    if ('ResizeObserver' in window){ var ro = new ResizeObserver(pedirMedir); st.tramos.forEach(function(tr){ ro.observe(tr.sec); }); if (desde) ro.observe(desde); }
    addEventListener('resize', function(){ var w = document.documentElement.clientWidth; if (w !== anchoAntes){ anchoAntes = w; pedirMedir(); } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(pedirMedir);

    var espera = cont.getAttribute('data-hl-espera');
    if (!espera || reducido || !desde) arrancar();
    else {
      var mr = desde.closest ? (desde.matches('.mr') ? desde : desde.closest('.mr')) : null;
      if (espera === 'marco:listo' && mr && window.MarcoRecepcion && MarcoRecepcion.cuando) MarcoRecepcion.cuando(mr, arrancar);
      else if (mr && mr.getAttribute('data-mr') === 'listo') arrancar();
      else if (cont.getAttribute('data-hl-hecho') && desde.matches(cont.getAttribute('data-hl-hecho'))) arrancar();   /* v1.1: la firma ya acabó antes de cargar */
      else desde.addEventListener(espera, arrancar, { once:true });
      if ('IntersectionObserver' in window){                            /* el origen ya no se ve: nada con lo que competir */
        var fuera = new IntersectionObserver(function(es){ if (!es[0].isIntersecting){ fuera.disconnect(); arrancar(); } });
        fuera.observe(desde);
      }
      setTimeout(arrancar, 6000);
    }
    todos.push(st);
    return st;
  }

  window.HiloLuz = {
    iniciar:iniciar,
    medir:function(){ todos.forEach(function(s){ s.medir(); }); }
  };
  function todosLosHilos(){ [].forEach.call(document.querySelectorAll('[data-hl]'), iniciar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todosLosHilos); else todosLosHilos();
})();
/* ================= FIN COMPONENTE ================= */
