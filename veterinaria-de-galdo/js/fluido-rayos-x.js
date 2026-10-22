/* Portada v3 · Fluido de rayos X (M39, componentes/fluido-rayos-x.html v1.1). Momento firma de la web.
   Donde pasa el ratón o el dedo, la foto se disuelve como tinta y aparece su radiografía; se cierra sola en ~1 s.
   Una pasada automática al cargar, por encima de las dos caras. WebGL1 propio (técnica de "Skeleton Fluid Reveal" de
   Codrops, MIT, reescrita sin three.js). El lienzo y el puntero se miden sobre la caja de la foto (.fx-medio), no sobre la
   sección: en escritorio la foto empieza detrás del texto y en móvil va arriba, con el texto debajo.
   Respaldo: sin WebGL, sin poder subir la textura (file://), si se pierde el contexto o con movimiento reducido no se crea
   el lienzo; queda la foto y el botón "Ver la radiografía entera". */
(function(){
  'use strict';
  var VS='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0,1);}';
  var CAB='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nvarying vec2 v;' +
    'float h(vec2 q){q=fract(q*vec2(.1031,.1030));q+=dot(q,q.yx+33.33);return fract((q.x+q.y)*q.x);}' +
    'float n(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}';
  /* máscara: difusión con ruido + decaimiento + trazo del puntero (segmento a→b, en unidades de alto) */
  var SIM=CAB+'uniform sampler2D uM;uniform vec2 uPx,uA,uB;uniform float uR,uAs,uDec,uT,uOn;' +
    'void main(){vec2 o=(vec2(n(v*7.+uT),n(v*7.-uT+9.))-.5)*uPx*3.;float c=texture2D(uM,v+o).r;' +
    'float m=max(max(texture2D(uM,v+o+vec2(uPx.x,0)).r,texture2D(uM,v+o-vec2(uPx.x,0)).r),max(texture2D(uM,v+o+vec2(0,uPx.y)).r,texture2D(uM,v+o-vec2(0,uPx.y)).r));' +
    'm=max(c,mix(c,m,.55))-uDec;vec2 s=vec2(uAs,1.),pa=v*s-uA*s,ba=uB*s-uA*s;' +
    'float d=length(pa-ba*clamp(dot(pa,ba)/max(dot(ba,ba),1e-7),0.,1.));m=max(m,uOn*smoothstep(uR,uR*.3,d));' +
    'gl_FragColor=vec4(vec3(clamp(m,0.,1.)),1);}';
  /* pantalla: cover con foco, borde con ruido y halo frío por fuera (sin OES_standard_derivatives, sin halo) */
  var VER=function(d){ return (d ? '#extension GL_OES_standard_derivatives : enable\n' : '') + CAB +
    'uniform sampler2D uF,uX,uM;uniform vec2 uC,uO;uniform float uT,uAs;uniform vec3 uH;' +
    'void main(){vec2 t=v*uC+uO;vec3 f=texture2D(uF,t).rgb,x=texture2D(uX,t).rgb;float m=texture2D(uM,v).r;vec2 q=v*vec2(uAs,1.);' +
    'float g=n(q*5.+uT*.25)*.6+n(q*13.-uT*.4)*.4;float e=m+(g-.5)*.5;float k=smoothstep(.4,.56,e);float a=0.;' +
    (d ? 'a=(1.-smoothstep(.4,2.2,abs(e-.4)/max(fwidth(e),1e-4)))*step(.02,m);' : '') +
    'gl_FragColor=vec4(mix(f,x,k)+uH*a*.7,1);}'; };

  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  Array.prototype.forEach.call(document.querySelectorAll('[data-fluido]'), function(sec){
    var medio = sec.querySelector('.fx-medio'), foto = sec.querySelector('.fx-foto'), rx = sec.querySelector('.fx-rx');
    var btn = sec.querySelector('[data-alternar]'), rot = btn.querySelector('span'), txt = [rot.textContent, btn.dataset.otro];
    btn.addEventListener('click', function(){
      var on = sec.classList.toggle('fx-entera');
      btn.setAttribute('aria-pressed', String(on)); rot.textContent = txt[on ? 1 : 0];
    });
    if (reducido) return;

    var cv = document.createElement('canvas'), gl;
    try { gl = cv.getContext('webgl', {alpha:false, antialias:false, depth:false, stencil:false, powerPreference:'low-power'}); } catch(_){}
    if (!gl) return;
    var lista = function(img){ return new Promise(function(r){
      if (img.complete) r(); else { img.addEventListener('load', r, {once:true}); img.addEventListener('error', r, {once:true}); } }); };
    Promise.all([lista(foto), lista(rx)]).then(function(){ if (foto.naturalWidth && rx.naturalWidth) arranca(); });

    function arranca(){
      function shd(t, s){ var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
      function prog(fs){
        var p = gl.createProgram(), u = {};
        gl.attachShader(p, shd(gl.VERTEX_SHADER, VS)); gl.attachShader(p, shd(gl.FRAGMENT_SHADER, fs));
        gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('shader');
        return { p:p, u:function(k){ return k in u ? u[k] : (u[k] = gl.getUniformLocation(p, k)); } };
      }
      function tex(img, w, h){
        var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (img) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        return t;
      }
      var sim, ver, tF, tX;
      try {
        sim = prog(SIM); ver = prog(VER(gl.getExtension('OES_standard_derivatives')));
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        tF = tex(foto); tX = tex(rx);          /* en file:// salta aquí (SecurityError) y se queda el respaldo */
      } catch(_){ return; }
      var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      cv.className = 'fx-lienzo'; cv.setAttribute('aria-hidden', 'true');
      foto.after(cv);

      var W = 1, H = 1, mw = 1, mh = 1, A = null, B = null, cover = [1,1,0,0];
      var hx = (getComputedStyle(sec).getPropertyValue('--fx-halo').trim().match(/[0-9a-f]{2}/gi) || ['9f','d3','ff']).map(function(c){ return parseInt(c, 16) / 255; });
      function fbo(){ var t = tex(null, mw, mh), f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT); return {t:t, f:f}; }
      function medir(){
        var r = medio.getBoundingClientRect(), dpr = Math.min(1.5, window.devicePixelRatio || 1);
        W = Math.max(1, r.width); H = Math.max(1, r.height);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        [A, B].forEach(function(o){ if (o){ gl.deleteTexture(o.t); gl.deleteFramebuffer(o.f); } });
        mw = Math.max(32, Math.round(W / 4)); mh = Math.max(32, Math.round(H / 4)); A = fbo(); B = fbo();
        /* object-fit:cover + object-position en %: t = v * escala + desplazamiento */
        var pos = getComputedStyle(foto).objectPosition.split(' ').map(function(s){ var n = parseFloat(s); return (isNaN(n) ? 50 : n) / 100; });
        var va = W / H, ia = foto.naturalWidth / foto.naturalHeight, sx = Math.min(1, va / ia), sy = Math.min(1, ia / va);
        cover = [sx, sy, (1 - sx) * pos[0], (1 - sy) * (1 - pos[1])];
        despierta(0);
      }

      /* puntero (solo dentro de la foto) y pasada automática */
      var ant = null, act = null, tUlt = 0, auto = 0, hasta = 0, raf = 0, visible = true, t0 = performance.now(), tPrev = 0;
      function punto(x, y){ var n = performance.now(); if (n - tUlt > 120) ant = null; tUlt = n; act = [x / W, 1 - y / H]; if (!ant) ant = act; despierta(1400); }
      function mover(e){
        var r = medio.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        if (x < 0 || y < 0 || x > r.width || y > r.height) return;
        auto = 0; punto(x, y);
      }
      sec.addEventListener('pointermove', mover); sec.addEventListener('pointerdown', mover);
      function curva(k){ return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }

      function despierta(ms){ hasta = Math.max(hasta, performance.now() + ms); if (!raf && visible) raf = requestAnimationFrame(frame); }
      function frame(now){
        raf = -1;                                  /* ocupado: despierta() no programa otro fotograma */
        var dt = tPrev ? Math.min(.05, (now - tPrev) / 1000) : .016; tPrev = now;
        if (auto){
          var k = (now - auto) / 1500;
          if (k >= 1) auto = 0;
          /* de abajo a la izquierda (patas) a arriba a la derecha, cruzando por la mitad (las caras) */
          else { var e = curva(Math.max(0, k));
            punto(W * (.1 + .8 * e), H * (.78 - .36 * e - .12 * Math.sin(Math.PI * e))); tUlt = now; }
        }
        var R = Math.min(120, Math.max(38, Math.min(W, H) * .1)) / H;
        gl.useProgram(sim.p); gl.bindFramebuffer(gl.FRAMEBUFFER, B.f); gl.viewport(0, 0, mw, mh);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(sim.u('uM'), 0);
        gl.uniform2f(sim.u('uPx'), 1 / mw, 1 / mh); gl.uniform1f(sim.u('uAs'), W / H);
        gl.uniform1f(sim.u('uDec'), dt); gl.uniform1f(sim.u('uT'), now / 1000); gl.uniform1f(sim.u('uR'), R);
        gl.uniform1f(sim.u('uOn'), act ? 1 : 0);
        if (act){ gl.uniform2f(sim.u('uA'), ant[0], ant[1]); gl.uniform2f(sim.u('uB'), act[0], act[1]); ant = act; act = null; }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        var c = A; A = B; B = c;

        gl.useProgram(ver.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, cv.width, cv.height);
        [tF, tX, A.t].forEach(function(t, i){ gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
        gl.uniform1i(ver.u('uF'), 0); gl.uniform1i(ver.u('uX'), 1); gl.uniform1i(ver.u('uM'), 2);
        gl.uniform2f(ver.u('uC'), cover[0], cover[1]); gl.uniform2f(ver.u('uO'), cover[2], cover[3]);
        gl.uniform1f(ver.u('uT'), (now - t0) / 1000); gl.uniform1f(ver.u('uAs'), W / H); gl.uniform3f(ver.u('uH'), hx[0], hx[1], hx[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        sec.classList.add('fx-gl');
        if (visible && (now < hasta || auto)) raf = requestAnimationFrame(frame); else { raf = 0; tPrev = 0; }
      }

      cv.addEventListener('webglcontextlost', function(){ cancelAnimationFrame(raf); raf = 0; visible = false; sec.classList.remove('fx-gl'); cv.remove(); });
      if ('ResizeObserver' in window) new ResizeObserver(medir).observe(medio); else { medir(); addEventListener('resize', medir); }
      var pasada = function(){ if (!pasada) return; pasada = null; setTimeout(function(){ auto = performance.now(); despierta(1500 + 1400); }, 400); };
      if ('IntersectionObserver' in window){
        new IntersectionObserver(function(ents){
          visible = ents[0].isIntersecting;
          if (visible){ if (pasada) pasada(); despierta(0); } else if (raf){ cancelAnimationFrame(raf); raf = 0; tPrev = 0; }
        }).observe(medio);
      } else pasada();
    }
  });
})();
