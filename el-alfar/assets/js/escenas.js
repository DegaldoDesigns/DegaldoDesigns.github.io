/* El Alfar · escenas de la v3 (2026-10-20)
   - La mesa servida (portada): los platos se sirven al cargar y, al bajar, la cámara entra en la ensalada El Alfar.
   - La pizarra del día: el menú de la semana (contenido/menu-semana.json) se escribe a tiza, con polvo.
   - La carta como pase de cocina: escena fijada por comandas, plato con distorsión líquida (WebGL2) y plato abierto a pantalla completa.
   - Viaje por el comedor: la cámara avanza entre las fotos del local en 3D (CSS) y al final se enciende la luz (paso de noche a día).
   - ¿Cuántos sois?: la mesa se pone con ese número de platos.
   - La cabecera cambia de tono según la sección (noche / día).
   Todo funciona sin este archivo (el contenido está en el HTML) y respeta prefers-reduced-motion. */
(function(){
  'use strict';
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function(x, a, b){ return x < a ? a : x > b ? b : x; };
  var lerp = function(a, b, t){ return a + (b - a) * t; };
  var suave = function(t){ t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  var curva = function(t){ t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var esc = function(t){ var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
  var vw = window.innerWidth, vh = window.innerHeight;
  function progreso(sec){ var r = sec.getBoundingClientRect(), total = r.height - vh; return total > 0 ? clamp(-r.top / total, 0, 1) : 0; }

  /* Bucle común: cada escena registra una función que se llama en el scroll (una vez por fotograma) */
  var escenas = [], pendiente = false;
  function tic(){ pendiente = false; for (var i = 0; i < escenas.length; i++) escenas[i](); }
  function pedir(){ if (!pendiente){ pendiente = true; requestAnimationFrame(tic); } }
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', function(){ vw = window.innerWidth; vh = window.innerHeight; medidas.forEach(function(f){ f(); }); pedir(); });
  var medidas = [];

  /* ---------- Cabecera: noche o día según la sección que tiene debajo ---------- */
  var cab = $('#cabecera'), oscuras = $$('.tono-oscuro');
  if (cab){
    escenas.push(function(){
      var y = 40, oscuro = false;
      for (var i = 0; i < oscuras.length; i++){ var r = oscuras[i].getBoundingClientRect(); if (r.top <= y && r.bottom > y){ oscuro = true; break; } }
      var t = oscuro ? 'oscuro' : 'claro'; if (cab.dataset.tono !== t) cab.dataset.tono = t;
    });
  }

  /* ======================================================================
     La mesa servida
     ====================================================================== */
  var mesa = $('.mesa');
  if (mesa){
    var mundo = $('#mesaMundo'), central = $('#platoCentral'), texto = $('#mesaTexto'), fundido = $('#mesaFundido'),
        velo = $('.mesa-velo', mesa), baja = $('.mesa-baja', mesa), fija = $('.mesa-fija', mesa), etq = $('#mesaEtq');
    var servir = function(){ mesa.classList.add('servida'); setTimeout(function(){ mesa.classList.add('lista'); }, 2300); };
    if (reducido) servir(); else setTimeout(function(){ requestAnimationFrame(servir); }, 120);
    var o = { x: 0, y: 0, d: 1, mx: 0, my: 0 };
    var medirMesa = function(){
      o.x = central.offsetLeft; o.y = central.offsetTop; o.d = central.offsetWidth;
      o.mx = mundo.offsetLeft; o.my = mundo.offsetTop;
      mundo.style.transformOrigin = o.x + 'px ' + o.y + 'px';
    };
    medirMesa(); medidas.push(medirMesa);
    var pMesa = 0;
    if (!reducido){
      escenas.push(function(){
        var r = mesa.getBoundingClientRect();
        document.body.classList.toggle('en-portada', r.bottom > vh * 1.02);
        if (r.bottom < 0 || r.top > vh) return;
        var p = pMesa = progreso(mesa);
        var a = suave(p / .22);                         /* el texto se va */
        var z = curva((p - .1) / .74);                  /* la cámara entra en el plato */
        var S = Math.max(vw, vh) * 1.35 / o.d;
        var s = Math.pow(S, z);
        var cx = o.mx + o.x, cy = o.my + o.y;
        var dx = (vw / 2 - cx) * suave(z * 1.25), dy = (vh / 2 - cy) * suave(z * 1.25);
        mundo.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) rotate(' + (z * 14).toFixed(2) + 'deg) scale(' + s.toFixed(4) + ')';
        texto.style.opacity = (1 - a).toFixed(3);
        texto.style.translate = '0 ' + (-50 * a).toFixed(1) + 'px';
        texto.style.visibility = a > .99 ? 'hidden' : '';
        velo.style.opacity = (1 - suave(z * 1.6) * .95).toFixed(3);
        fundido.style.opacity = suave((p - .74) / .22).toFixed(3);
        if (baja) baja.style.opacity = (1 - clamp(p * 6, 0, 1)).toFixed(3);
        if (p > .02 && etq) etq.classList.remove('ver');
      });
    }
    /* Luz cálida que sigue al ratón y nombre del plato al pasar por encima */
    if (raton && !reducido){
      var lx = 60, ly = 46, tlx = 60, tly = 46, girandoL = false;
      var moverLuz = function(){
        lx += (tlx - lx) * .08; ly += (tly - ly) * .08;
        fija.style.setProperty('--lx', lx.toFixed(2) + '%'); fija.style.setProperty('--ly', ly.toFixed(2) + '%');
        if (Math.abs(tlx - lx) > .05 || Math.abs(tly - ly) > .05) requestAnimationFrame(moverLuz); else girandoL = false;
      };
      fija.addEventListener('pointermove', function(e){
        if (e.pointerType !== 'mouse') return;
        tlx = e.clientX / vw * 100; tly = e.clientY / vh * 100;
        if (!girandoL){ girandoL = true; requestAnimationFrame(moverLuz); }
        if (etq.classList.contains('ver')){ etq.style.setProperty('--ex', (e.clientX - o.mx + 18) + 'px'); etq.style.setProperty('--ey', (e.clientY - o.my + 16) + 'px'); }
      });
      $$('.plato-m', mesa).forEach(function(pl){
        pl.addEventListener('mouseenter', function(e){
          if (pMesa > .02 || !mesa.classList.contains('lista')) return;
          etq.textContent = pl.dataset.nombre;
          etq.style.setProperty('--ex', (e.clientX - o.mx + 18) + 'px'); etq.style.setProperty('--ey', (e.clientY - o.my + 16) + 'px');
          etq.classList.add('ver');
        });
        pl.addEventListener('mouseleave', function(){ etq.classList.remove('ver'); });
      });
    }
  }

  /* ======================================================================
     Menú de la semana: la pizarra y la etiqueta de la portada
     ====================================================================== */
  var pz = $('#pizarra'), pzTexto = $('#pzTexto'), chip = $('#chipMenu');
  function lineasPizarra(m, hoy){
    var modo = m.mostrar_como || 'oculto';
    var hasta = String(m.valido_hasta || '').slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(hasta) && hasta < hoy) modo = 'oculto';
    var limpio = function(k){ return (m[k] || []).filter(function(x){ return x && String(x).trim(); }); };
    var pl = { entrantes: limpio('entrantes'), segundos: limpio('segundos'), postres: limpio('postres') };
    var L = [['tz-titulo', 'Menú de la semana']];
    if (modo === 'oculto' || !pl.entrantes.length || !pl.segundos.length){
      L.push(['tz-sub', 'Cambia cada semana']);
      [['Entrantes', 'Cuatro para elegir'], ['Segundos', 'Cuatro para elegir'], ['Postres', 'Postre casero o café']].forEach(function(g){ L.push(['tz-grupo', g[0]], ['tz-item', g[1]]); });
    } else {
      L.push(['tz-sub', modo === 'semana' ? esc(m.semana || 'Esta semana') : 'Ejemplo con platos y precios de otras semanas']);
      [['entrantes', 'Entrantes'], ['segundos', 'Segundos'], ['postres', 'Postres']].forEach(function(g){
        if (!pl[g[0]].length) return; L.push(['tz-grupo', g[1]]); pl[g[0]].forEach(function(x){ L.push(['tz-item', esc(x)]); });
      });
    }
    var pe = String(m.precio_entre_semana || '').trim(), pf = String(m.precio_fin_de_semana || '').trim();
    if (pe && pf) L.push(['tz-precio', '<span class="pz-cifra">' + esc(pe) + ' €</span> entre semana · <span class="pz-cifra2">' + esc(pf) + ' €</span> fin de semana']);
    else if (pe) L.push(['tz-precio', '<span class="pz-cifra">' + esc(pe) + ' €</span>']);
    else L.push(['tz-precio', 'Pregúntanos el precio']);
    var inc = String(m.incluye || 'Vino, agua y postre o café');
    L.push(['tz-inc', 'Incluye ' + esc(inc.charAt(0).toLowerCase() + inc.slice(1))]);
    if (m.nota && String(m.nota).trim()) L.push(['tz-nota', esc(m.nota)]);
    return L.map(function(l){ return '<p class="tz ' + l[0] + '"><span class="tz-in">' + l[1] + '</span></p>'; }).join('');
  }
  var hoyMadrid = function(){
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { return new Date().toISOString().slice(0, 10); }
  };
  var estadoPz = 'quieta';   /* quieta | escribiendo | escrita */
  if (pz){
    pz.classList.add('pz-js');
    fetch(pz.dataset.cms, { cache: 'no-cache' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(m){
      if (!m) return;
      var h = lineasPizarra(m, hoyMadrid());
      if (pzTexto.innerHTML !== h){ pzTexto.innerHTML = h; if (estadoPz !== 'quieta'){ pz.classList.remove('escribiendo'); pz.classList.add('vista', 'circulo'); } }
      var t = chip ? $('.chip-txt', chip) : null;
      if (t){
        var pe = String(m.precio_entre_semana || '').trim(), pf = String(m.precio_fin_de_semana || '').trim(), p;
        var num = function(x){ return parseFloat(String(x).replace(',', '.')); };
        if (pe && pf && pe !== pf) p = 'desde <b>' + esc(num(pe) <= num(pf) ? pe : pf) + ' €</b>';
        else if (pe) p = '<b>' + esc(pe) + ' €</b>';
        else p = 'cada semana distinto';
        var nuevo = 'Menú de la semana con vino · ' + p;
        if (t.innerHTML !== nuevo) t.innerHTML = nuevo;
      }
    }).catch(function(){});

    /* Polvo de tiza */
    var lienzo = $('#pzPolvo'), ctx = lienzo.getContext('2d'), motas = [], polvoVivo = false, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var tamPolvo = function(){ var r = lienzo.getBoundingClientRect(); lienzo.width = r.width * dpr; lienzo.height = r.height * dpr; };
    var polvo = function(){
      ctx.clearRect(0, 0, lienzo.width, lienzo.height);
      for (var i = motas.length - 1; i >= 0; i--){
        var q = motas[i]; q.t += 1 / 60;
        if (q.t > q.v){ motas.splice(i, 1); continue; }
        q.vy += .045; q.x += q.vx; q.y += q.vy;
        ctx.globalAlpha = (1 - q.t / q.v) * .75; ctx.fillStyle = q.c;
        ctx.fillRect(q.x * dpr, q.y * dpr, q.s * dpr, q.s * dpr);
      }
      ctx.globalAlpha = 1;
      if (motas.length) requestAnimationFrame(polvo); else polvoVivo = false;
    };
    var soltarPolvo = function(x, y, color){
      for (var k = 0; k < 2; k++) motas.push({ x: x + (Math.random() - .5) * 4, y: y + (Math.random() - .5) * 10, vx: (Math.random() - .5) * .5, vy: Math.random() * .3, s: .8 + Math.random() * 1.6, t: 0, v: .6 + Math.random() * .7, c: color });
      if (!polvoVivo){ polvoVivo = true; requestAnimationFrame(polvo); }
    };

    var escribir = function(){
      if (estadoPz === 'escribiendo') return;
      var lineas = $$('.tz', pzTexto);
      if (reducido){ pz.classList.add('vista', 'circulo'); estadoPz = 'escrita'; return; }
      estadoPz = 'escribiendo'; tamPolvo();
      lineas.forEach(function(l){ $('.tz-in', l).style.setProperty('--w', '0%'); });
      pz.classList.remove('circulo'); pz.classList.add('vista', 'escribiendo');
      var i = 0, base = lienzo.getBoundingClientRect();
      var siguiente = function(){
        if (i >= lineas.length){ pz.classList.remove('escribiendo'); estadoPz = 'escrita'; var b = $('#pzOtra'); if (b) b.hidden = false; return; }
        var l = lineas[i++], span = $('.tz-in', l), largo = span.textContent.length;
        var dur = clamp(largo * (l.classList.contains('tz-titulo') ? 34 : 15), 200, 760), t0 = null;
        var color = l.classList.contains('tz-grupo') || l.classList.contains('tz-nota') ? '#f2b48c' : '#f3efe6';
        var paso = function(t){
          if (!t0) t0 = t;
          var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 1.6);
          span.style.setProperty('--w', (e * 100).toFixed(2) + '%');
          var r = span.getBoundingClientRect();
          if (k < 1 && Math.random() < .8) soltarPolvo(r.left - base.left + r.width * e, r.top - base.top + r.height * (.35 + Math.random() * .5), color);
          if (k < 1) requestAnimationFrame(paso);
          else {
            if (l.classList.contains('tz-precio')) pz.classList.add('circulo');
            setTimeout(siguiente, l.classList.contains('tz-titulo') ? 200 : l.classList.contains('tz-grupo') ? 90 : 40);
          }
        };
        requestAnimationFrame(paso);
      };
      siguiente();
    };
    if ('IntersectionObserver' in window){
      var ioPz = new IntersectionObserver(function(en){ if (en[0].isIntersecting){ ioPz.disconnect(); escribir(); } }, { threshold: .35 });
      ioPz.observe(pz);
    } else escribir();
    var otra = $('#pzOtra');
    if (otra) otra.addEventListener('click', function(){ otra.hidden = true; estadoPz = 'quieta'; escribir(); });
  }

  /* ======================================================================
     La carta como pase de cocina
     ====================================================================== */
  var pase = $('#carta.carta-pase');
  var datos = null; try { datos = JSON.parse($('#paseDatos').textContent); } catch (e) {}
  var dlgPa = $('#platoAbierto');
  if (pase && datos){
    var tickets = $$('.ticket', pase), listas = $$('.pase-lista', pase), num = $('#paseNum'), plato = $('#pasePlato'),
        ppImg = $('#ppImg'), ppNom = $('#ppNombre'), ppPre = $('#ppPrecio'), ppTipo = $('#ppTipo'), ppBtn = $('#ppBtn'), lienzoGl = $('#ppGl');
    var N = tickets.length, actual = -1, lineal = false, platoActual = null;
    var fotoDe = function(f){ return 'assets/img/' + f + '.webp'; };
    var modoLineal = function(){
      lineal = reducido || window.matchMedia('(max-width: 900px)').matches || vh < 600;
      pase.classList.toggle('pase-lineal', lineal);
    };
    modoLineal(); medidas.push(modoLineal);

    /* Distorsión líquida con WebGL2: un solo lienzo para el plato del pase */
    var liquido = (function(){
      if (reducido || !lienzoGl) return null;
      var gl = null; try { gl = lienzoGl.getContext('webgl2', { premultipliedAlpha: false, antialias: true }); } catch (e) {}
      if (!gl) return null;
      var vs = '#version 300 es\nin vec2 p;out vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
      var fs = '#version 300 es\nprecision highp float;in vec2 v;out vec4 o;uniform sampler2D uA,uB;uniform float uMix,uT,uHover;uniform vec2 uRatA,uRatB,uM;' +
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
        'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
        'float fb(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}' +
        'vec2 cub(vec2 u,vec2 r){return (u-.5)*r+.5;}' +
        'void main(){vec2 u=v;float d=distance(u,uM);float f=smoothstep(.5,0.,d)*uHover;' +
        'vec2 dsp=(vec2(fb(u*3.+uT*.25),fb(u*3.+9.+uT*.25))-.5)*.07*f;dsp+=normalize(u-uM+1e-4)*sin(d*38.-uT*5.)*.005*f;' +
        'float t=uMix;float w=sin(t*3.14159);vec2 dt=(vec2(fb(u*2.5+3.),fb(u*2.5+5.))-.5)*.22*w;' +
        'vec4 a=texture(uA,cub(u+dsp+dt,uRatA));vec4 b=texture(uB,cub(u+dsp-dt,uRatB));' +
        'float k=smoothstep(t*1.3-.25,t*1.3-.05,fb(u*3.5)*.9+.05);o=mix(b,a,k);}';
      var prog = gl.createProgram();
      [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function(x){ var s = gl.createShader(x[0]); gl.shaderSource(s, x[1]); gl.compileShader(s); gl.attachShader(prog, s); });
      gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
      gl.useProgram(prog);
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var U = {}; ['uA', 'uB', 'uMix', 'uT', 'uHover', 'uRatA', 'uRatB', 'uM'].forEach(function(k){ U[k] = gl.getUniformLocation(prog, k); });
      gl.uniform1i(U.uA, 0); gl.uniform1i(U.uB, 1);
      var cache = {}, texA = null, texB = null, ratA = [1, 1], ratB = [1, 1], mezcla = 0, hover = 0, hoverObj = 0, mx = .5, my = .5, t0 = performance.now(), vivo = false, transicion = null;
      var cargar = function(url, cb){
        if (cache[url]){ if (cache[url].listo) cb(cache[url]); else cache[url].esperan.push(cb); return; }
        var c = cache[url] = { listo: false, esperan: [cb] }, im = new Image();
        im.onload = function(){
          var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
          var ar = im.naturalWidth / im.naturalHeight;
          c.tex = t; c.rat = ar > 1 ? [1 / ar, 1] : [1, ar]; c.listo = true;
          c.esperan.forEach(function(f){ f(c); }); c.esperan = [];
        };
        im.onerror = function(){ c.esperan = []; };
        im.src = url;
      };
      var tam = function(){ var r = lienzoGl.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); lienzoGl.width = Math.max(2, Math.round(r.width * d)); lienzoGl.height = Math.max(2, Math.round(r.height * d)); gl.viewport(0, 0, lienzoGl.width, lienzoGl.height); };
      var dibujar = function(){
        if (!texA) return;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texA);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texB || texA);
        gl.uniform1f(U.uMix, mezcla); gl.uniform1f(U.uT, (performance.now() - t0) / 1000); gl.uniform1f(U.uHover, hover);
        gl.uniform2f(U.uRatA, ratA[0], ratA[1]); gl.uniform2f(U.uRatB, (texB ? ratB : ratA)[0], (texB ? ratB : ratA)[1]); gl.uniform2f(U.uM, mx, my);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      var bucle = function(){
        hover += (hoverObj - hover) * .07;
        if (transicion){ var k = clamp((performance.now() - transicion.t) / 820, 0, 1); mezcla = curva(k); if (k >= 1){ texA = texB; ratA = ratB; texB = null; mezcla = 0; transicion = null; } }
        dibujar();
        if (transicion || hoverObj > 0 || hover > .004) requestAnimationFrame(bucle); else { hover = 0; dibujar(); vivo = false; }
      };
      var despertar = function(){ if (!vivo){ vivo = true; requestAnimationFrame(bucle); } };
      ppBtn.addEventListener('pointermove', function(e){ var r = lienzoGl.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = 1 - (e.clientY - r.top) / r.height; hoverObj = 1; despertar(); });
      ppBtn.addEventListener('pointerleave', function(){ hoverObj = 0; despertar(); });
      medidas.push(function(){ tam(); dibujar(); });
      tam();
      return {
        poner: function(url, conTransicion){
          cargar(url, function(c){
            if (!texA || !conTransicion){ texA = c.tex; ratA = c.rat; texB = null; transicion = null; mezcla = 0; plato.classList.add('con-gl'); dibujar(); return; }
            if (c.tex === texA && !transicion) return;
            if (transicion){ texA = texB || texA; ratA = transicion.rat || ratA; }
            texB = c.tex; ratB = c.rat; transicion = { t: performance.now(), rat: c.rat }; despertar();
          });
        },
        precargar: function(url){ cargar(url, function(){}); }
      };
    })();

    var ponerPlato = function(d, cat, conTransicion){
      /* d: { f, n, p } o null (plato "escrito" para los platos sin foto) */
      var clave = d ? (d.f || 'tipo:' + d.n) : '';
      if (clave === platoActual) return; platoActual = clave;
      ppNom.textContent = d ? d.n : ''; ppPre.textContent = d ? d.p : '';
      if (d && d.f){
        plato.classList.remove('sin-foto');
        ppBtn.setAttribute('aria-label', 'Ver en grande: ' + d.n);
        ppBtn.disabled = false;
        if (liquido) liquido.poner(fotoDe(d.f), conTransicion); else ppImg.src = fotoDe(d.f);
      } else {
        plato.classList.add('sin-foto');
        ppBtn.disabled = true;
        ppTipo.innerHTML = '<small>' + esc(cat) + '</small>' + esc(d ? d.n : cat);
      }
    };
    var platoPorDefecto = function(c){
      var ps = datos.cats[c].platos, con = ps.filter(function(x){ return x.f; });
      return (con.filter(function(x){ return x.r; })[0] || con[0] || ps[0]);
    };
    var mostrarCat = function(i, servirPlato){
      if (i === actual) return; actual = i;
      tickets.forEach(function(t, k){ t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
      listas.forEach(function(l, k){
        var on = k === i;
        if (!lineal){ l.classList.toggle('activa', on); if (on){ $$('.pd', l).forEach(function(li, n){ li.style.setProperty('--n', n); }); l.classList.remove('entra'); void l.offsetWidth; l.classList.add('entra'); } }
        l.setAttribute('aria-hidden', !lineal && !on ? 'true' : 'false');
      });
      $$('.pd.activo', pase).forEach(function(x){ x.classList.remove('activo'); });
      if (num) num.textContent = ('0' + (i + 1)).slice(-2);
      if (!lineal){
        if (servirPlato && !reducido){ plato.classList.remove('sirve'); void plato.offsetWidth; plato.classList.add('sirve'); }
        platoActual = null; ponerPlato(platoPorDefecto(i), datos.cats[i].t, false);
        /* Precarga las fotos de la categoría */
        if (liquido) datos.cats[i].platos.forEach(function(x){ if (x.f) liquido.precargar(fotoDe(x.f)); });
      }
    };
    mostrarCat(0, false);
    escenas.push(function(){
      if (lineal) return;
      var r = pase.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var p = progreso(pase), i = Math.min(N - 1, Math.floor(p * N));
      if (i !== actual) mostrarCat(i, true);
    });
    /* Las comandas llevan a su categoría */
    var irA = function(i){
      if (lineal){ var l = listas[i]; if (l) l.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' }); mostrarCat(i, false); return; }
      var top = pase.getBoundingClientRect().top + window.scrollY, total = pase.offsetHeight - vh;
      window.scrollTo({ top: top + total * (i + .5) / N, behavior: reducido ? 'auto' : 'smooth' });
    };
    tickets.forEach(function(t, i){
      t.addEventListener('click', function(){ irA(i); });
      t.addEventListener('keydown', function(e){
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % N; if (e.key === 'ArrowLeft') n = (i - 1 + N) % N;
        if (e.key === 'Home') n = 0; if (e.key === 'End') n = N - 1;
        if (n !== null){ e.preventDefault(); tickets[n].focus(); irA(n); }
      });
    });
    /* Al pasar por un plato de la lista, el plato del pase lo enseña */
    $$('.pase-lista', pase).forEach(function(l, c){
      $$('.pd', l).forEach(function(li, k){
        var b = $('.pd-btn', li), d = datos.cats[c].platos[k];
        var ver = function(){ if (lineal) return; $$('.pd.activo', pase).forEach(function(x){ x.classList.remove('activo'); }); li.classList.add('activo'); ponerPlato(d, datos.cats[c].t, true); };
        /* Intención: solo cambia si el ratón se queda un momento (al cruzar la lista hacia el plato no cambia) */
        var espera = null;
        b.addEventListener('mouseenter', function(){ if (!raton) return; clearTimeout(espera); espera = setTimeout(ver, 160); });
        b.addEventListener('mouseleave', function(){ clearTimeout(espera); });
        if (b.tagName === 'BUTTON'){
          b.addEventListener('focus', ver);
          b.addEventListener('click', function(){ abrirPlato(+b.dataset.plato, lineal ? $('.pd-mini', b) : $('.pp-foto', plato)); });
        }
      });
    });
    ppBtn.addEventListener('click', function(){
      if (plato.classList.contains('sin-foto')) return;
      var f = platoActual, k = -1; datos.fotos.forEach(function(x, n){ if (x.f === f) k = n; });
      if (k >= 0) abrirPlato(k, $('.pp-foto', plato));
    });
  }

  /* ---------- El plato abierto a pantalla completa (crece desde donde estaba) ---------- */
  var paK = 0, paOrigen = null;
  function rellenarPa(k){
    var d = datos.fotos[k]; paK = k;
    $('#paImg').src = 'assets/img/' + d.f + '-grande.webp'; $('#paImg').alt = d.n + (d.d ? ', ' + d.d.charAt(0).toLowerCase() + d.d.slice(1) : '');
    $('#paCat').textContent = d.c + (d.r ? ' · recomendado' : '');
    $('#paNombre').textContent = d.n; $('#paDesc').textContent = d.d ? d.d + '.' : ''; $('#paPrecio').textContent = d.p;
    $('#paCuenta').textContent = (k + 1) + ' de ' + datos.fotos.length;
  }
  function abrirPlato(k, origen){
    if (!dlgPa || !dlgPa.showModal) return;
    rellenarPa(k); paOrigen = origen || null;
    dlgPa.showModal();
    var foto = $('.pa-foto', dlgPa);
    if (!reducido && origen && foto.animate){
      var a = origen.getBoundingClientRect(), b = foto.getBoundingClientRect();
      if (a.width && b.width){
        var s = a.width / b.width;
        foto.animate([{ transform: 'translate(' + (a.left + a.width / 2 - b.left - b.width / 2) + 'px,' + (a.top + a.height / 2 - b.top - b.height / 2) + 'px) scale(' + s + ')' }, { transform: 'none' }],
          { duration: 560, easing: 'cubic-bezier(0.32,0.72,0,1)' });
      }
    }
  }
  if (dlgPa){
    var cerrarPa = function(){
      var foto = $('.pa-foto', dlgPa), o = paOrigen;
      if (!reducido && o && foto.animate && o.getBoundingClientRect().width){
        var a = o.getBoundingClientRect(), b = foto.getBoundingClientRect(), s = a.width / b.width;
        var an = foto.animate([{ transform: 'none', opacity: 1 }, { transform: 'translate(' + (a.left + a.width / 2 - b.left - b.width / 2) + 'px,' + (a.top + a.height / 2 - b.top - b.height / 2) + 'px) scale(' + s + ')', opacity: .4 }],
          { duration: 380, easing: 'cubic-bezier(0.23,1,0.32,1)' });
        var hecho = false, fin = function(){ if (!hecho){ hecho = true; dlgPa.close(); } };
        an.onfinish = fin; setTimeout(fin, 460);
      } else dlgPa.close();
    };
    $('#paCerrar').addEventListener('click', cerrarPa);
    dlgPa.addEventListener('click', function(e){ if (e.target === dlgPa) cerrarPa(); });
    dlgPa.addEventListener('cancel', function(e){ e.preventDefault(); cerrarPa(); });
    dlgPa.addEventListener('close', function(){ var b = paOrigen && paOrigen.closest ? paOrigen.closest('button') : null; if (b) b.focus(); });
    var cambiarPa = function(d){ var n = datos.fotos.length; paOrigen = null; rellenarPa((paK + d + n) % n); var f = $('.pa-foto', dlgPa); if (!reducido && f.animate) f.animate([{ opacity: 0, transform: 'rotate(' + (d * 18) + 'deg) scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.23,1,0.32,1)' }); };
    $('#paAnt').addEventListener('click', function(){ cambiarPa(-1); });
    $('#paSig').addEventListener('click', function(){ cambiarPa(1); });
    dlgPa.addEventListener('keydown', function(e){ if (e.key === 'ArrowRight') cambiarPa(1); if (e.key === 'ArrowLeft') cambiarPa(-1); });
  }

  /* ======================================================================
     Viaje por el comedor
     ====================================================================== */
  var viaje = $('#comedor.viaje');
  if (viaje && !reducido){
    var vfs = $$('.vf', viaje), vIntro = $('#viajeIntro'), vFin = $('#viajeFin'), vLuz = $('#viajeLuz'), vBarra = $('.viaje-barra', viaje);
    var SEP = 1050, ULT = vfs.length - 1;
    var INI = 2000, colocar = vfs.map(function(f, i){ return { z: -(i * SEP) - INI, x: +f.dataset.x, y: i % 2 ? 18 : -26 }; });
    escenas.push(function(){
      var r = viaje.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var p = progreso(viaje);
      var ab = Math.min(vw * .27, 420), tv = curva((p - .08) / .78);
      var cam = lerp(0, ULT * SEP + INI - 160, tv), entrada = suave((p - .05) / .07);
      vfs.forEach(function(f, i){
        var c = colocar[i], zr = c.z + cam;
        var op = suave((zr + 4200) / 1200) * (1 - suave((zr - 60) / 260));
        if (i === ULT) op = suave((zr + 4200) / 1200);
        op *= entrada;
        var foco = 1 - clamp(Math.abs(zr + 650) / 550, 0, 1);
        if (i === ULT) foco = suave((zr + 900) / 500);
        f.style.transform = 'translate(-50%,-50%) translate3d(' + (c.x * ab).toFixed(1) + 'px,' + c.y + 'px,' + zr.toFixed(1) + 'px) rotateY(' + (-c.x * 16) + 'deg)';
        f.style.opacity = op.toFixed(3);
        f.style.setProperty('--foco', foco.toFixed(3));
        f.style.pointerEvents = op > .5 && zr < -100 ? 'auto' : 'none';
        f.style.visibility = op < .01 ? 'hidden' : 'visible';
      });
      var ia = suave((p - .03) / .08);
      vIntro.style.opacity = (1 - ia).toFixed(3); vIntro.style.translate = '-50% calc(-50% - ' + (ia * 40).toFixed(1) + 'px)';
      var fa = suave((p - .8) / .06) * (1 - suave((p - .93) / .05));
      vFin.style.opacity = fa.toFixed(3); vFin.classList.toggle('ver', fa > .5);
      vLuz.style.setProperty('--r', (suave((p - .9) / .1) * 80).toFixed(2) + '%');
      if (vBarra) vBarra.style.setProperty('--p', p.toFixed(3));
    });
  }

  /* ======================================================================
     ¿Cuántos sois?: la mesa se pone
     ====================================================================== */
  var ccNum = $('#ccNum'), mpPlatos = $('#mpPlatos');
  if (ccNum && mpPlatos){
    var NS = 'http://www.w3.org/2000/svg', n = 2, MAX = 10;
    var ccMenos = $('#ccMenos'), ccMas = $('#ccMas'), ccTxt = $('#ccTxt'), ccNota = $('#ccNota');
    var el = function(tag, at){ var x = document.createElementNS(NS, tag); for (var k in at) x.setAttribute(k, at[k]); return x; };
    var poner = function(antes){
      mpPlatos.textContent = '';
      var R = n > 6 ? 86 : 82, rp = n > 6 ? 18 : n > 4 ? 21 : 25;
      for (var i = 0; i < n; i++){
        var a = i / n * Math.PI * 2 - Math.PI / 2, x = Math.cos(a) * R, y = Math.sin(a) * R, deg = a * 180 / Math.PI + 90;
        var g = el('g', { 'class': 'mp-plato' + (i >= antes ? ' nuevo' : ''), transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + deg.toFixed(1) + ')' });
        g.appendChild(el('circle', { 'class': 'loza', r: rp }));
        g.appendChild(el('circle', { 'class': 'aro', r: (rp * .66).toFixed(1) }));
        g.appendChild(el('line', { 'class': 'cub', x1: -(rp + 7), y1: -rp * .6, x2: -(rp + 7), y2: rp * .6 }));
        g.appendChild(el('line', { 'class': 'cub', x1: rp + 7, y1: -rp * .6, x2: rp + 7, y2: rp * .6 }));
        g.appendChild(el('circle', { 'class': 'copita', cx: (rp * .8).toFixed(1), cy: (-rp - 9).toFixed(1), r: (rp * .3).toFixed(1) }));
        mpPlatos.appendChild(g);
      }
      ccNum.textContent = n === MAX ? MAX + '+' : n;
      ccMenos.disabled = n <= 1; ccMas.disabled = n >= MAX;
      if (n >= 8){ ccTxt.textContent = 'Reservar mesa'; ccNota.textContent = 'Para grupos de 8 o más, mejor llámanos con unos días de margen y te preparamos la mesa larga.'; }
      else { ccTxt.textContent = 'Reservar mesa para ' + n; ccNota.textContent = n === 1 ? 'Mesa para uno. Elige día y hora en el siguiente paso.' : 'Mesa para ' + n + '. Elige día y hora en el siguiente paso.'; }
    };
    ccMenos.addEventListener('click', function(){ if (n > 1){ n--; poner(n); } });
    ccMas.addEventListener('click', function(){ if (n < MAX){ var a = n; n++; poner(a); } });
    poner(0);
  }

  pedir();
  window.addEventListener('load', function(){ medidas.forEach(function(f){ f(); }); pedir(); });
})();
