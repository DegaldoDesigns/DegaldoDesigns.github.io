/* El carrete (M135): láminas con las capturas de cada web sobre un anillo, en WebGL2 propio (sin three.js).
   La página decide el estado con el scroll y este motor solo pinta:
     c.estado(t, f)  t = 0..1 llegada (anillo visto desde fuera) → dentro del anillo; f = obra delante (decimal)
     c.pick(x, y)    índice de la lámina bajo un punto de la pantalla (px del lienzo) o -1
     c.abrir(i, fin) la lámina i se aplana hasta llenar la pantalla; c.cerrar(fin) la devuelve al anillo
     c.raton(x, y)   onda suave en la lámina señalada; c.activo(bool) pausa el bucle cuando no se ve
   Sin WebGL2 devuelve null y la página enseña la rejilla en HTML. */
(function () {
  'use strict';

  var VS = '#version 300 es\n' +
    'in vec2 aUV;\n' +
    'uniform mat4 uVP; uniform vec3 uEye;\n' +
    'uniform float uAng, uArc, uH, uR, uBend, uOpen;\n' +
    'uniform vec2 uCover;\n' +
    'out vec2 vUV; out float vShade;\n' +
    'void main(){\n' +
    '  float dx = aUV.x - 0.5;\n' +
    '  float a = uAng + dx * uArc;\n' +
    // al correr, la lámina se arquea como una tela (más en el centro) y se abomba hacia dentro
    '  float y = (aUV.y - 0.5) * uH + uBend * (0.25 - dx * dx) * 0.22;\n' +
    '  float r = uR * (1.0 - abs(uBend) * 0.06 * cos(dx * 3.14159));\n' +
    '  vec3 p = vec3(sin(a) * r, y, -cos(a) * r);\n' +
    '  vec3 n = normalize(vec3(-sin(a), 0.0, cos(a)));\n' +
    '  vShade = 0.32 + 0.68 * abs(dot(n, normalize(uEye - p)));\n' +
    '  vec4 c = uVP * vec4(p, 1.0);\n' +
    '  vec4 plano = vec4(aUV * 2.0 - 1.0, -0.999, 1.0);\n' +
    '  gl_Position = uOpen > 0.0 ? mix(c / c.w, plano, uOpen) : c;\n' +
    '  vShade = mix(vShade, 1.0, uOpen);\n' +
    '  vUV = mix(aUV, (aUV - 0.5) * uCover + 0.5, uOpen);\n' +
    '}';

  var FS = '#version 300 es\nprecision highp float;\n' +
    'in vec2 vUV; in float vShade;\n' +
    'uniform sampler2D uTex; uniform float uListo, uSplit, uFundido, uOnda, uOpen, uT;\n' +
    'uniform vec2 uMouse; uniform vec3 uTinta, uLinea;\n' +
    'out vec4 o;\n' +
    'void main(){\n' +
    '  vec2 uv = vUV;\n' +
    '  if (!gl_FrontFacing) uv.x = 1.0 - uv.x;\n' +
    '  vec2 d = uv - uMouse; float dist = length(d * vec2(1.6, 1.0));\n' +
    '  uv += normalize(d + 1e-5) * sin(dist * 34.0 - uT * 5.0) * 0.006 * uOnda * smoothstep(0.42, 0.0, dist);\n' +
    '  float s = uSplit;\n' +
    '  vec3 c = vec3(texture(uTex, uv + vec2(s, 0.0)).r, texture(uTex, uv).g, texture(uTex, uv - vec2(s, 0.0)).b);\n' +
    '  c = mix(uTinta + 0.06, c, uListo);\n' +
    '  c *= vShade * (gl_FrontFacing ? 1.0 : 0.55);\n' +
    // filete blanco de 1,5 px alrededor de cada lámina (se va al abrir)
    '  vec2 e = min(vUV, 1.0 - vUV) / fwidth(vUV);\n' +
    '  float borde = 1.0 - smoothstep(1.0, 2.2, min(e.x, e.y));\n' +
    '  c = mix(c, uLinea, borde * 0.85 * (1.0 - uOpen));\n' +
    '  c = mix(c, uTinta, uFundido);\n' +
    '  o = vec4(c, 1.0);\n' +
    '}';

  function sh(gl, tipo, src) {
    var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  // Matrices 4x4 por columnas
  function persp(fy, asp, n, f) {
    var t = 1 / Math.tan(fy / 2), nf = 1 / (n - f);
    return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0];
  }
  function mirar(e, c) {
    var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2], l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    var xx = zz, xy = 0, xz = -zx; l = Math.hypot(xx, xz); xx /= l; xz /= l; // up = (0,1,0)
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1];
  }
  function mul(a, b) {
    var o = new Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s;
    }
    return o;
  }
  function hex(h) { h = parseInt(h.slice(1), 16); return [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255]; }
  var suave = function (x) { x = Math.min(1, Math.max(0, x)); return x * x * x * (x * (x * 6 - 15) + 10); };
  var curva = function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }; // ease-in-out

  window.Carrete = function (lienzo, opc) {
    var gl = lienzo.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
    if (!gl) return null;
    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl, gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { if (window.console) console.warn("carrete:", e.message); return null; }
    gl.useProgram(prog);
    var U = {};
    ['uVP', 'uEye', 'uAng', 'uArc', 'uH', 'uR', 'uBend', 'uOpen', 'uCover', 'uTex', 'uListo', 'uSplit', 'uFundido', 'uOnda', 'uT', 'uMouse', 'uTinta', 'uLinea']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    // Malla de una lámina: 48 x 12 tramos (la curva y el arqueo necesitan tramos a lo ancho)
    var SX = 48, SY = 12, uv = [], idx = [];
    for (var y = 0; y <= SY; y++) for (var x = 0; x <= SX; x++) uv.push(x / SX, y / SY);
    for (y = 0; y < SY; y++) for (x = 0; x < SX; x++) {
      var a = y * (SX + 1) + x, b = a + 1, c = a + SX + 1, d = c + 1; idx.push(a, b, c, b, d, c);
    }
    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aUV'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    var NIDX = idx.length;

    var N = opc.imagenes.length, PASO = Math.PI * 2 / N, ARC = PASO * 0.86, R = 1, ASPT = 1.6, H = ARC * R / ASPT;
    var tinta = hex(opc.tinta || '#0b0d12'), linea = hex(opc.linea || '#eef0f3');
    gl.uniform1f(U.uArc, ARC); gl.uniform1f(U.uH, H); gl.uniform1f(U.uR, R);
    gl.uniform3fv(U.uTinta, tinta); gl.uniform3fv(U.uLinea, linea); gl.uniform1i(U.uTex, 0);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);

    var tex = [], listo = [], cargadas = 0;
    opc.imagenes.forEach(function (src, i) {
      var t = gl.createTexture(); tex.push(t); listo.push(0);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      var im = new Image(); im.decoding = 'async';
      im.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        listo[i] = 0.0001; cargadas++; if (cargadas === N && opc.alCargar) opc.alCargar(); pedir();
      };
      im.onerror = function () { listo[i] = 0; }; // esa lámina se queda lisa; las demás siguen
      im.src = src;
    });

    // Estado
    var W = 1, Hh = 1, dpr = 1, T = 0, F = 0;
    var ang = 0, vel = 0, objAng = 0;       // giro del anillo (rad), con muelle
    var bend = 0, bendV = 0;                 // arqueo por velocidad, con muelle
    var abierta = -1, open = 0, openDe = 0, openA = 0, openT0 = 0, openFin = null, DUR = 760;
    var mx = .5, my = .5, onda = 0, ondaObj = 0, hover = -1;
    var corriendo = false, visible = true, rafId = 0, ultimo = 0, reloj = 0, VP = null, EYE = [0, 0, 0];

    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, innerWidth < 700 ? 1.6 : 1.75);
      W = lienzo.clientWidth; Hh = lienzo.clientHeight;
      lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(Hh * dpr);
      gl.viewport(0, 0, lienzo.width, lienzo.height); pedir();
    }

    function camara() {
      var asp = W / Hh, e = suave(T), q = 1 - e;
      // dentro: la lámina de delante ocupa la mitad del ancho (84 % en vertical)
      var frac = Math.min(.84, Math.max(.5, .84 - (asp - .5) * .64), .52 * ASPT / asp); // en pantallas muy anchas manda la altura
      var cuerda = 2 * Math.sin(ARC / 2) * R, dist = Math.cos(ARC / 2) * R;
      var tanDentro = (cuerda / 2) / (dist * frac);
      var tanFuera = asp < 1 ? 1.12 / 3.6 : 1.25 / 3.6 * Math.max(1, 1.25 / asp, asp / 1.6);
      var tanH = tanFuera + (tanDentro - tanFuera) * e;
      var fy = 2 * Math.atan(tanH / asp);
      // la cámara baja por encima del canto del anillo y entra en el centro (al cruzar el canto va a y = 0,64)
      EYE = [0, 1.25 * Math.pow(q, .55), 3.4 * q];
      var obj = [0, -0.15 * q + (-0.07) * e, -1 * e];
      VP = mul(persp(fy, asp, 0.02, 20), mirar(EYE, obj));
    }

    function proyectar(p) {
      var m = VP, x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
        w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      if (w <= 0.01) return null;
      return [(x / w * .5 + .5) * W, (1 - (y / w * .5 + .5)) * Hh, w];
    }
    function contorno(i) {
      var a0 = i * PASO + ang, pts = [], k, p;
      for (k = 0; k <= 8; k++) { var a = a0 + (k / 8 - .5) * ARC; p = proyectar([Math.sin(a) * R, H / 2, -Math.cos(a) * R]); if (!p) return null; pts.push(p); }
      for (k = 8; k >= 0; k--) { a = a0 + (k / 8 - .5) * ARC; p = proyectar([Math.sin(a) * R, -H / 2, -Math.cos(a) * R]); if (!p) return null; pts.push(p); }
      return pts;
    }
    function dentro(pts, x, y) {
      var c = false;
      for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        if ((pts[i][1] > y) !== (pts[j][1] > y) && x < (pts[j][0] - pts[i][0]) * (y - pts[i][1]) / (pts[j][1] - pts[i][1]) + pts[i][0]) c = !c;
      }
      return c;
    }

    function cuadro(ahora) {
      rafId = 0;
      var dt = Math.min(.05, (ahora - (ultimo || ahora)) / 1000); ultimo = ahora; reloj += dt;
      // muelle amortiguado (como el del cerebro, que Diego vio fluido): v += (Δ·K − v·2√K)·dt
      var K = T < .999 ? 9 : 26;
      if (T < 0.01 && abierta < 0) objAng += dt * .16;                   // en la llegada gira solo, despacio
      else { var o = -F * PASO; objAng = o + Math.round((ang - o) / (2 * Math.PI)) * 2 * Math.PI; }
      vel += ((objAng - ang) * K - vel * 2 * Math.sqrt(K)) * dt; ang += vel * dt;
      var bObj = Math.max(-1.4, Math.min(1.4, vel * 1.1)) * (T > .5 ? 1 : .3);
      bendV += ((bObj - bend) * 60 - bendV * 2 * Math.sqrt(60)) * dt; bend += bendV * dt;
      onda += (ondaObj - onda) * Math.min(1, dt * 6);
      if (abierta >= 0 && openT0) {
        var k = Math.min(1, (ahora - openT0) / DUR); open = openDe + (openA - openDe) * curva(k);
        if (k >= 1) { openT0 = 0; var f = openFin; openFin = null; if (openA === 0) abierta = -1; if (f) f(); }
      }
      for (var i = 0; i < N; i++) if (listo[i] > 0 && listo[i] < 1) listo[i] = Math.min(1, listo[i] + dt * 2.2);

      camara();
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.uVP, false, VP); gl.uniform3fv(U.uEye, EYE); gl.uniform1f(U.uT, reloj);
      gl.uniform1f(U.uSplit, Math.min(.006, Math.abs(vel) * .004));
      var asp = W / Hh, cov = asp > ASPT ? [1, ASPT / asp] : [asp / ASPT, 1];
      gl.uniform2fv(U.uCover, cov);
      gl.bindVertexArray(vao);
      for (i = 0; i < N; i++) {
        var esta = i === abierta;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[i]);
        gl.uniform1f(U.uAng, i * PASO + ang);
        gl.uniform1f(U.uBend, esta ? bend * (1 - open) : bend);
        gl.uniform1f(U.uOpen, esta ? open : 0);
        gl.uniform1f(U.uFundido, abierta >= 0 && !esta ? Math.min(1, open * 1.4) * .92 : 0);
        gl.uniform1f(U.uListo, suave(listo[i]));
        gl.uniform1f(U.uOnda, i === hover && abierta < 0 ? onda : 0);
        gl.uniform2f(U.uMouse, mx, my);
        gl.drawElements(gl.TRIANGLES, NIDX, gl.UNSIGNED_SHORT, 0);
      }
      var quieto = Math.abs(vel) < 1e-4 && Math.abs(objAng - ang) < 1e-4 && Math.abs(bend) < 1e-4 && Math.abs(bendV) < 1e-4 &&
        !openT0 && Math.abs(onda - ondaObj) < .002 && listo.every(function (v) { return v === 0 || v === 1; }) && onda < .002 && !(T < .01 && abierta < 0);
      if (corriendo && visible && !quieto) rafId = requestAnimationFrame(cuadro);
    }
    function pedir() { if (!rafId && corriendo && visible) { ultimo = 0; rafId = requestAnimationFrame(cuadro); } }

    addEventListener('resize', medir);
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; pedir(); });
    medir();

    return {
      N: N,
      estado: function (t, f) { if (t !== T || f !== F) { T = t; F = f; pedir(); } },
      activo: function (v) { corriendo = v; if (v) pedir(); },
      pick: function (x, y) {
        if (!VP) camara();
        var mejor = -1, prof = 1e9;
        for (var i = 0; i < N; i++) {
          var pts = contorno(i); if (!pts || !dentro(pts, x, y)) continue;
          var c = proyectar([Math.sin(i * PASO + ang) * R, 0, -Math.cos(i * PASO + ang) * R]);
          if (c && c[2] < prof) { prof = c[2]; mejor = i; }
        }
        return mejor;
      },
      raton: function (x, y, i) {
        hover = i; ondaObj = i >= 0 ? 1 : 0;
        if (i >= 0) { // punto dentro de la lámina en coordenadas de textura (aprox. por el contorno)
          var pts = contorno(i);
          if (pts) {
            var x0 = pts[0][0], x1 = pts[8][0], yA = pts[4][1], yB = pts[13][1];
            mx = (x - x0) / (x1 - x0); my = 1 - (y - yA) / (yB - yA);
          }
        }
        pedir();
      },
      abrir: function (i, fin) { abierta = i; openDe = open; openA = 1; openT0 = performance.now(); openFin = fin; hover = -1; ondaObj = 0; pedir(); },
      cerrar: function (fin) { if (abierta < 0) { if (fin) fin(); return; } openDe = open; openA = 0; openT0 = performance.now(); openFin = fin; pedir(); },
      cambiar: function (i) { if (abierta >= 0) abierta = i; pedir(); },
      saltarA: function (i) { var o = -i * PASO; ang = objAng = o + Math.round((ang - o) / (2 * Math.PI)) * 2 * Math.PI; vel = 0; bend = bendV = 0; pedir(); },
      dibujar: pedir
    };
  };
})();
