/* Copia de componentes/figura-ejercicio.html (M122) */
/* ================= COMPONENTE: figura-ejercicio (M122) ================= */
(function(){
  var NS = 'http://www.w3.org/2000/svg';
  var reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var largos = { lumbar:34, dorsal:40, cuello:10, cabeza:11, radio:9, brazo:36, antebrazo:32, muslo:56, pierna:52, pie:15 };
  /* hueso: [padre, articulación al final] (el orden es el de pintado y el de cálculo) */
  var huesos = [['muslo', 'raiz', 'rodilla'], ['pierna', 'muslo', 'tobillo'], ['pie', 'pierna', 'punta'],
    ['lumbar', 'raiz', 'cintura'], ['dorsal', 'lumbar', 'hombro'], ['cuello', 'dorsal', 'cuello'],
    ['brazo', 'dorsal', 'codo'], ['antebrazo', 'brazo', 'mano']];
  var ejercicios = {
    'puente': { ancla:'hombro', recorrido:['tumbado', 'sube', 'arriba', 'sube', 'tumbado', 'sube', 'arriba'], poses:{
      tumbado:{ ancla:[106, 133.5], lumbar:180, dorsal:180, cuello:204, brazo:2, antebrazo:0, muslo:-59.7, pierna:70,   pie:0 },
      sube:   { ancla:[106, 133.5], lumbar:168, dorsal:174, cuello:204, brazo:2, antebrazo:0, muslo:-45.2, pierna:81.7, pie:0 },
      arriba: { ancla:[106, 133.5], lumbar:152, dorsal:160, cuello:204, brazo:2, antebrazo:0, muslo:-23,   pierna:89.1, pie:0 } } },
    'roll-up': { ancla:'raiz', recorrido:['tumbado', 'cabeza', 'enrolla', 'sentado', 'alcanza'], poses:{
      tumbado:{ ancla:[150, 133.5], lumbar:180, dorsal:180, cuello:204, brazo:268, antebrazo:270, muslo:0, pierna:0, pie:-75 },
      cabeza: { ancla:[150, 133.5], lumbar:180, dorsal:195, cuello:228, brazo:296, antebrazo:302, muslo:0, pierna:0, pie:-75 },
      enrolla:{ ancla:[150, 133.5], lumbar:212, dorsal:248, cuello:284, brazo:332, antebrazo:338, muslo:0, pierna:0, pie:-75 },
      sentado:{ ancla:[150, 133.5], lumbar:262, dorsal:290, cuello:298, brazo:354, antebrazo:358, muslo:0, pierna:0, pie:-78 },
      alcanza:{ ancla:[150, 133.5], lumbar:288, dorsal:318, cuello:328, brazo:366, antebrazo:368, muslo:0, pierna:0, pie:-80 } } }
  };
  var cuenta = 0;
  function rad(g){ return g * Math.PI / 180; }

  /* Posiciones de las articulaciones con la cadera en (0,0): para colocar el ancla */
  function articulaciones(pose, L){
    var pos = { raiz:[0, 0] }, fin = { raiz:[0, 0] };
    huesos.forEach(function(h){
      var ini = fin[h[1]], a = rad(pose[h[0]]), l = L[h[0]];
      fin[h[0]] = [ini[0] + l * Math.cos(a), ini[1] + l * Math.sin(a)];
      pos[h[2]] = fin[h[0]];
    });
    var c = pos.cuello, ac = rad(pose.cuello);
    pos.cabeza = [c[0] + (L.cabeza) * Math.cos(ac), c[1] + (L.cabeza) * Math.sin(ac)];
    return pos;
  }
  function mezclar(a, b, t){
    var p = {};
    for (var k in a) p[k] = k === 'ancla' ? [a.ancla[0] + (b.ancla[0] - a.ancla[0]) * t, a.ancla[1] + (b.ancla[1] - a.ancla[1]) * t] : a[k] + (b[k] - a[k]) * t;
    return p;
  }
  function poseEn(ej, p){
    var r = ej.recorrido, n = r.length - 1, f = Math.min(Math.max(p, 0), 1) * n, k = Math.min(Math.floor(f), n - 1), t = f - k;
    t = .5 - Math.cos(t * Math.PI) / 2;                                   /* entra y sale despacio entre poses clave */
    return mezclar(ej.poses[r[k]], ej.poses[r[k + 1]], t);
  }
  function transformaciones(ej, pose){
    var L = Object.assign({}, largos, ej.largos || {});
    var pos = articulaciones(pose, L), anc = pos[ej.ancla || 'raiz'];
    var t = { raiz:'translate(' + (pose.ancla[0] - anc[0]).toFixed(2) + ' ' + (pose.ancla[1] - anc[1]).toFixed(2) + ')' };
    huesos.forEach(function(h){
      var rel = pose[h[0]] - (h[1] === 'raiz' ? 0 : pose[h[1]]);
      t[h[0]] = (h[1] === 'raiz' ? '' : 'translate(' + L[h[1]] + ' 0) ') + 'rotate(' + rel.toFixed(2) + ')';
    });
    return { t:t, L:L };
  }
  function marcado(nombre, pose, id){
    var ej = ejercicios[nombre]; if (!ej) return '';
    pose = pose || ej.poses[ej.recorrido[ej.recorrido.length - 1]];
    id = id || 'fe-cuerpo-' + nombre;
    var x = transformaciones(ej, pose), t = x.t, L = x.L;
    function g(nom, dentro){ return '<g data-fe-hueso="' + nom + '" transform="' + t[nom] + '"><path fill="none" d="M0 0H' + L[nom] + '"/>' + (dentro || '') + '</g>'; }
    var cabeza = '<circle cx="' + (L.cuello + L.cabeza) + '" cy="0" r="' + L.radio + '"/>';
    var cuerpo = '<g data-fe-hueso="raiz" transform="' + t.raiz + '">' +
      g('muslo', g('pierna', g('pie'))) +
      g('lumbar', g('dorsal', g('cuello', cabeza) + g('brazo', g('antebrazo')))) + '</g>';
    return '<defs><g id="' + id + '">' + cuerpo + '</g></defs>' +
      '<line class="fe-suelo" x1="6" y1="147" x2="334" y2="147"/>' +
      '<rect class="fe-esterilla" x="22" y="140" width="296" height="7" rx="3.5"/>' +
      '<use class="fe-contorno" href="#' + id + '"/><use class="fe-relleno" href="#' + id + '"/>';
  }

  function iniciar(el){
    if (el.fe) return el.fe;
    var nombre = el.getAttribute('data-fe'), ej = ejercicios[nombre], svg = el.querySelector('.fe-svg');
    if (!ej || !svg) return null;
    var st = { el:el, actual:1, destino:1 }; el.fe = st;
    if (reducido) return st;                                            /* pose final, la del HTML */
    var id = 'fe-c' + (++cuenta);
    svg.innerHTML = marcado(nombre, null, id);
    var grupos = {};
    [].forEach.call(svg.querySelectorAll('[data-fe-hueso]'), function(n){ grupos[n.getAttribute('data-fe-hueso')] = n; });
    var desde = parseFloat(el.getAttribute('data-fe-desde')) || .95, hasta = parseFloat(el.getAttribute('data-fe-hasta')) || .4;
    var suave = el.hasAttribute('data-fe-suave') ? parseFloat(el.getAttribute('data-fe-suave')) : 90;
    var ultimo = -1, visible = false, marco = 0, antes = 0;
    function aplicar(p){
      if (Math.abs(p - ultimo) < .0004) return; ultimo = p;
      var t = transformaciones(ej, poseEn(ej, p)).t;
      for (var k in grupos) grupos[k].setAttribute('transform', t[k]);
    }
    function destino(){
      var r = el.getBoundingClientRect(), vh = window.innerHeight, c = r.top + r.height / 2;
      return Math.min(1, Math.max(0, (desde * vh - c) / ((desde - hasta) * vh)));
    }
    function paso(ahora){
      marco = 0;
      if (st.manual) return;
      st.destino = destino();
      var dt = antes ? Math.min(64, ahora - antes) : 16; antes = ahora;
      var d = st.destino - st.actual;
      st.actual = (!suave || Math.abs(d) < .001) ? st.destino : st.actual + d * (1 - Math.exp(-dt / suave));
      aplicar(st.actual);
      if (visible && st.actual !== st.destino) marco = requestAnimationFrame(paso); else antes = 0;
    }
    function pedir(){ if (!marco && visible) marco = requestAnimationFrame(paso); }
    st.actual = st.destino = destino(); aplicar(st.actual);
    if ('IntersectionObserver' in window){
      new IntersectionObserver(function(es){
        visible = es[0].isIntersecting;
        st.actual = st.destino = destino(); aplicar(st.actual);        /* al entrar o salir de golpe (enlace, Fin), su pose sin arrastre */
        if (visible) pedir();
      }, { rootMargin:'10% 0px' }).observe(el);
    } else visible = true;
    addEventListener('scroll', pedir, { passive:true });
    addEventListener('resize', pedir);
    st.ver = function(p){ st.manual = true; aplicar(p); };
    if (/[?&]poses\b/.test(location.search)){
      var c = document.createElement('input'); c.type = 'range'; c.min = 0; c.max = 1000; c.value = 1000; c.className = 'fe-control';
      c.setAttribute('aria-label', 'Recorrer las poses de ' + nombre);
      c.addEventListener('input', function(){ st.ver(c.value / 1000); });
      el.appendChild(c);
    }
    return st;
  }

  window.FiguraEjercicio = {
    ejercicios:ejercicios, largos:largos, iniciar:iniciar, marcado:marcado,
    definir:function(nombre, datos){ ejercicios[nombre] = datos; [].forEach.call(document.querySelectorAll('[data-fe="' + nombre + '"]'), iniciar); }
  };
  function todas(){ [].forEach.call(document.querySelectorAll('[data-fe]'), iniciar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todas); else todas();
})();
/* ================= FIN COMPONENTE ================= */
