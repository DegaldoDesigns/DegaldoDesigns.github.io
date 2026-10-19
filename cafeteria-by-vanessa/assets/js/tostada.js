/* Monta tu tostada: el pan, la base y hasta 5 ingredientes se dibujan en SVG capa a capa. */
(function(){
  'use strict';
  var svg = document.getElementById('tostadaSvg');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function(s, c){ return (c || document).querySelector(s); };
  var $$ = function(s, c){ return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var PAN = 'M86 150C86 102 132 90 300 90S514 102 514 150 468 210 300 210 86 198 86 150Z';
  var MAX = 5;
  var ORDEN = ['tomate', 'aceite', 'york', 'serrano', 'salmon', 'atun', 'aguacate', 'huevo', 'anchoas', 'queso', 'manchego', 'burrata', 'cherry', 'rucula', 'semillas'];
  var NOMBRES = { cristal: 'Pan de cristal', cereal: 'Pan de cereal', semillas: 'Pan de semillas',
    tomate: 'tomate natural', aceite: 'aceite de oliva', aguacate: 'aguacate', salmon: 'salmón', york: 'jamón york', serrano: 'jamón serrano', atun: 'atún',
    huevo: 'huevo revuelto', anchoas: 'anchoas', queso: 'queso fresco', manchego: 'manchego', burrata: 'burrata', rucula: 'rúcula', cherry: 'tomates confitados', semillasIng: 'semillas' };
  // Tostadas de su carta con sus ingredientes, para decir cuál se parece más.
  // Tostadas de su carta: ingredientes (para buscar y para dibujarlas) y foto si la hay.
  // Sin foto propia se enseña un dibujo, nunca la foto de otra tostada.
  var CARTA = [
    { n: 'Mediterránea', d: 'Tomate natural y aceite de oliva virgen extra.', i: ['tomate', 'aceite'], f: 'tostada-tomate-matcha' },
    { n: 'Jamón serrano y manchego', d: 'Jamón cortado a mano y queso manchego.', i: ['serrano', 'manchego'], f: 'tostada-serrano-manchego' },
    { n: 'York y manchego', d: 'Queso manchego fundido, orégano y un hilo de aceite.', i: ['aceite', 'york', 'manchego'], f: 'tostada-york-manchego' },
    { n: 'York, queso fresco y aguacate', d: 'Con semillas de chía por encima.', i: ['york', 'aguacate', 'queso', 'semillas'], f: 'tostada-york-queso-fresco-aguacate' },
    { n: 'Aguacate y queso fresco', d: 'Aceite de oliva y mix de semillas.', i: ['aceite', 'aguacate', 'queso', 'semillas'], f: null },
    { n: 'Salmón y aguacate', d: 'Salmón ahumado, aguacate y semillas.', i: ['salmon', 'aguacate', 'semillas'], f: 'tostada-salmon-aguacate' },
    { n: 'Tomate, salmón y queso fresco', d: 'Con un toque de orégano.', i: ['tomate', 'salmon', 'queso'], f: null },
    { n: 'Atún con tomate', d: 'Con queso fresco y aguacate si te apetece.', i: ['tomate', 'atun', 'aguacate', 'queso'], f: null },
    { n: 'Huevo revuelto y aguacate', d: 'Sobre pan de semillas crujiente.', i: ['huevo', 'aguacate', 'semillas'], f: 'tostada-revuelto-aguacate' },
    { n: 'Huevo revuelto y anchoas', d: 'Tomate natural, revuelto cremoso y anchoas.', i: ['tomate', 'huevo', 'anchoas'], f: 'tostada-revuelto-anchoas' },
    { n: 'Burrata', d: 'Aguacate, tomates confitados, rúcula y semillas.', i: ['aguacate', 'burrata', 'cherry', 'rucula', 'semillas'], f: 'tostada-burrata' }
  ];

  var estado = { pan: 'semillas', sel: [] };

  /* ---------- utilidades de dibujo ---------- */
  function azar(semilla){ var a = semilla >>> 0; return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s){ var h = 2166136261; for (var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // Punto al azar dentro de la miga (elipse centrada en 300,150)
  function punto(r, ex, ey){ var a = r() * Math.PI * 2, d = Math.sqrt(r()); return [300 + Math.cos(a) * d * (ex || 190), 150 + Math.sin(a) * d * (ey || 48)]; }
  function el(tag, at){ var e = document.createElementNS(NS, tag); for (var k in at) e.setAttribute(k, at[k]); return e; }
  function f(n){ return n.toFixed(1); }
  // Mancha irregular cerrada alrededor de cx,cy
  function mancha(r, cx, cy, rx, ry, puntas){
    var n = puntas || 9, pts = [];
    for (var i = 0; i < n; i++){ var a = i / n * Math.PI * 2, k = .72 + r() * .5; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    var d = 'M' + f((pts[0][0] + pts[n - 1][0]) / 2) + ' ' + f((pts[0][1] + pts[n - 1][1]) / 2);
    for (var j = 0; j < n; j++){ var p = pts[j], q = pts[(j + 1) % n]; d += 'Q' + f(p[0]) + ' ' + f(p[1]) + ' ' + f((p[0] + q[0]) / 2) + ' ' + f((p[1] + q[1]) / 2); }
    return d + 'Z';
  }
  var TINTA = '#21140d';

  /* ---------- los panes ---------- */
  function dibujaPan(tipo){
    var g = el('g', {}), r = azar(hash(tipo));
    var col = { cristal: ['#c98a45', '#f0d29c', '#e2b878'], cereal: ['#7a4521', '#b9824c', '#a06a3a'], semillas: ['#8c5428', '#cf9c62', '#bb8550'] }[tipo];
    g.appendChild(el('path', { d: PAN, transform: 'translate(0 10)', fill: 'rgba(40,20,8,.22)' }));
    g.appendChild(el('path', { d: PAN, fill: col[0], stroke: TINTA, 'stroke-width': 2.6 }));
    g.appendChild(el('path', { d: PAN, transform: 'translate(300 150) scale(.955 .86) translate(-300 -150)', fill: col[1] }));
    // brillo y miga
    g.appendChild(el('path', { d: PAN, transform: 'translate(300 146) scale(.82 .6) translate(-300 -150)', fill: col[2], opacity: .35 }));
    var i, p;
    if (tipo === 'cristal'){
      for (i = 0; i < 26; i++){ p = punto(r, 180, 44); var rx = 3 + r() * 9; g.appendChild(el('ellipse', { cx: f(p[0]), cy: f(p[1]), rx: f(rx), ry: f(rx * (.4 + r() * .3)), fill: '#b9773a', opacity: .55 })); }
    } else if (tipo === 'cereal'){
      for (i = 0; i < 70; i++){ p = punto(r, 186, 46); g.appendChild(el('ellipse', { cx: f(p[0]), cy: f(p[1]), rx: f(1.5 + r() * 2.5), ry: 1.2, fill: r() > .5 ? '#5a3215' : '#e8c48e', transform: 'rotate(' + f(r() * 180) + ' ' + f(p[0]) + ' ' + f(p[1]) + ')' })); }
    } else {
      for (i = 0; i < 60; i++){ p = punto(r, 186, 46); g.appendChild(el('ellipse', { cx: f(p[0]), cy: f(p[1]), rx: f(2 + r() * 1.6), ry: 1.4, fill: ['#3b2a1c', '#f2e2bf', '#6b5034'][i % 3], transform: 'rotate(' + f(r() * 180) + ' ' + f(p[0]) + ' ' + f(p[1]) + ')' })); }
    }
    // marcas de tostado de la plancha
    for (i = 0; i < 5; i++){ var x = 150 + i * 75; g.appendChild(el('path', { d: 'M' + x + ' 104c-6 30-6 60 0 92', stroke: '#5b3016', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none', opacity: .16 })); }
    return g;
  }

  /* ---------- los ingredientes ---------- */
  var DIBUJO = {
    tomate: function(r, g){
      for (var i = 0; i < 9; i++){ var p = punto(r, 170, 40); g.appendChild(el('path', { d: mancha(r, p[0], p[1], 40 + r() * 30, 20 + r() * 12, 10), fill: i % 2 ? '#c4402b' : '#d9573a', opacity: .85 })); }
      for (var j = 0; j < 22; j++){ var q = punto(r, 180, 44); g.appendChild(el('circle', { cx: f(q[0]), cy: f(q[1]), r: f(1.6 + r() * 2), fill: '#f2c46b', opacity: .8 })); }
    },
    aceite: function(r, g){
      for (var i = 0; i < 7; i++){ var p = punto(r, 170, 40); g.appendChild(el('path', { d: mancha(r, p[0], p[1], 22 + r() * 22, 8 + r() * 8, 8), fill: '#e9c23a', opacity: .42 })); }
      for (var j = 0; j < 10; j++){ var q = punto(r, 170, 40); g.appendChild(el('ellipse', { cx: f(q[0]), cy: f(q[1]), rx: f(3 + r() * 4), ry: 2, fill: '#fff6c8', opacity: .7 })); }
    },
    york: function(r, g){
      for (var i = 0; i < 4; i++){ var p = [170 + i * 85 + r() * 20, 140 + r() * 24]; g.appendChild(el('path', { d: mancha(r, p[0], p[1], 52, 30, 11), fill: '#f2b0aa', stroke: '#c97d78', 'stroke-width': 2 }));
        g.appendChild(el('path', { d: 'M' + f(p[0] - 30) + ' ' + f(p[1] - 4) + 'q30 -14 60 2', stroke: '#fbd3cf', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' })); }
    },
    serrano: function(r, g){
      for (var i = 0; i < 5; i++){ var x = 150 + i * 72 + r() * 14, y = 120 + r() * 50, d = 'M' + f(x - 40) + ' ' + f(y) + 'c20 -26 40 20 60 -6s30 14 30 14';
        g.appendChild(el('path', { d: d, stroke: '#9e2c34', 'stroke-width': 24, fill: 'none', 'stroke-linecap': 'round' }));
        g.appendChild(el('path', { d: d, stroke: '#f3dcd2', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round', transform: 'translate(0 8)', opacity: .9 })); }
    },
    salmon: function(r, g){
      for (var i = 0; i < 4; i++){ var x = 160 + i * 90 + r() * 16, y = 128 + r() * 40, d = 'M' + f(x - 44) + ' ' + f(y) + 'c16 -22 30 18 48 -2s26 16 40 6';
        g.appendChild(el('path', { d: d, stroke: '#ef8457', 'stroke-width': 30, fill: 'none', 'stroke-linecap': 'round' }));
        for (var k = -1; k <= 1; k++) g.appendChild(el('path', { d: d, stroke: '#ffd0b4', 'stroke-width': 2.2, fill: 'none', transform: 'translate(0 ' + (k * 9) + ')', opacity: .85 })); }
    },
    atun: function(r, g){
      for (var i = 0; i < 26; i++){ var p = punto(r, 150, 36); g.appendChild(el('path', { d: mancha(r, p[0], p[1], 9 + r() * 9, 6 + r() * 5, 7), fill: i % 3 ? '#c9ab9b' : '#a98a7a', stroke: '#8a6b5c', 'stroke-width': 1 })); }
    },
    aguacate: function(r, g){
      // Dos abanicos de láminas
      [[230, 148], [380, 152]].forEach(function(c){
        for (var i = 0; i < 6; i++){
          var a = -40 + i * 16 + r() * 4, tr = 'rotate(' + f(a) + ' ' + c[0] + ' ' + c[1] + ')';
          g.appendChild(el('path', { d: 'M' + c[0] + ' ' + (c[1] + 10) + 'c-12 -24 -10 -56 6 -66c16 10 18 42 6 66Z', fill: '#a9c45c', stroke: '#4f6d1f', 'stroke-width': 2.4, transform: tr + ' translate(0 -6)' }));
          g.appendChild(el('path', { d: 'M' + (c[0] + 3) + ' ' + (c[1] + 2) + 'c-6 -16 -6 -36 3 -46', stroke: '#d8e89a', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', transform: tr + ' translate(0 -6)' }));
        }
      });
    },
    huevo: function(r, g){
      for (var i = 0; i < 18; i++){ var p = punto(r, 160, 38); g.appendChild(el('path', { d: mancha(r, p[0], p[1], 18 + r() * 12, 12 + r() * 8, 8), fill: i % 4 ? '#f7d24a' : '#fbe58f', stroke: '#d9a723', 'stroke-width': 1.4 })); }
    },
    anchoas: function(r, g){
      for (var i = 0; i < 5; i++){ var x = 140 + i * 80 + r() * 10, y = 120 + r() * 40, d = 'M' + f(x) + ' ' + f(y) + 'c20 10 46 10 70 2';
        g.appendChild(el('path', { d: d, stroke: '#6e5847', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }));
        g.appendChild(el('path', { d: d, stroke: '#c9c3b8', 'stroke-width': 2.4, fill: 'none', 'stroke-linecap': 'round', transform: 'translate(0 -2)' })); }
    },
    queso: function(r, g){
      for (var i = 0; i < 16; i++){ var p = punto(r, 170, 40), s = 11 + r() * 8; g.appendChild(el('rect', { x: f(p[0] - s / 2), y: f(p[1] - s / 2), width: f(s), height: f(s * .85), rx: 3, fill: '#fffdf6', stroke: '#d8cfc0', 'stroke-width': 1.6, transform: 'rotate(' + f(r() * 90) + ' ' + f(p[0]) + ' ' + f(p[1]) + ')' })); }
    },
    manchego: function(r, g){
      for (var i = 0; i < 5; i++){ var x = 160 + i * 70 + r() * 10, y = 150 + (r() - .5) * 40, rot = f(r() * 360);
        g.appendChild(el('path', { d: 'M' + x + ' ' + (y - 26) + 'l26 44h-52Z', fill: '#f4d47e', stroke: '#b98b2e', 'stroke-width': 2, 'stroke-linejoin': 'round', transform: 'rotate(' + rot + ' ' + x + ' ' + y + ')' }));
        g.appendChild(el('path', { d: 'M' + (x - 26) + ' ' + (y + 18) + 'h52', stroke: '#6b4a1e', 'stroke-width': 5, transform: 'rotate(' + rot + ' ' + x + ' ' + y + ')' })); }
    },
    burrata: function(r, g){
      g.appendChild(el('ellipse', { cx: 300, cy: 156, rx: 64, ry: 40, fill: 'rgba(40,20,8,.18)' }));
      g.appendChild(el('path', { d: mancha(r, 300, 148, 62, 38, 12), fill: '#fbf9f2', stroke: '#d9d2c4', 'stroke-width': 2 }));
      g.appendChild(el('path', { d: mancha(r, 306, 146, 28, 14, 9), fill: '#f3ead6' }));
      g.appendChild(el('path', { d: 'M266 132q20 -12 46 -6', stroke: '#fff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: .9 }));
    },
    cherry: function(r, g){
      for (var i = 0; i < 7; i++){ var p = punto(r, 175, 40), s = 13 + r() * 5;
        g.appendChild(el('circle', { cx: f(p[0]), cy: f(p[1]), r: f(s), fill: '#c9352a', stroke: '#7d1a14', 'stroke-width': 1.8 }));
        g.appendChild(el('circle', { cx: f(p[0]), cy: f(p[1]), r: f(s * .58), fill: '#e8624d' }));
        g.appendChild(el('circle', { cx: f(p[0] - s * .3), cy: f(p[1] - s * .35), r: 2.4, fill: '#ffd2c2' })); }
    },
    rucula: function(r, g){
      for (var i = 0; i < 12; i++){ var p = punto(r, 175, 40), a = f(r() * 360);
        g.appendChild(el('path', { d: 'M' + f(p[0]) + ' ' + f(p[1]) + 'l8 -6 2 6 8 -8 2 8 8 -6 0 10c-10 4 -22 4 -28 -4Z', fill: i % 2 ? '#4f7d2a' : '#5f9134', stroke: '#2f5216', 'stroke-width': 1.2, 'stroke-linejoin': 'round', transform: 'rotate(' + a + ' ' + f(p[0]) + ' ' + f(p[1]) + ')' })); }
    },
    semillas: function(r, g){
      for (var i = 0; i < 90; i++){ var p = punto(r, 186, 46); g.appendChild(el('ellipse', { cx: f(p[0]), cy: f(p[1]), rx: 1.8, ry: 1.2, fill: ['#1f1712', '#3b2e24', '#f4ead1', '#7a5f42'][i % 4], transform: 'rotate(' + f(r() * 180) + ' ' + f(p[0]) + ' ' + f(p[1]) + ')' })); }
    }
  };

  var capaPan = $('#capaPan'), capaBase = $('#capaBase'), capaIngr = $('#capaIngr');
  var grupos = {};

  function entra(g, retraso){
    if (reducido || !g.animate) return;
    g.animate([{ opacity: 0, transform: 'translateY(-46px) scale(1.12)' }, { opacity: 1, offset: .5 }, { opacity: 1, transform: 'translateY(0) scale(1)' }],
      { duration: 520, delay: retraso || 0, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'backwards' });
  }
  function sale(g){
    if (reducido || !g.animate){ g.remove(); return; }
    var a = g.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'translateY(-14px) scale(1.04)' }], { duration: 200, easing: 'cubic-bezier(0.23,1,0.32,1)', fill: 'forwards' });
    a.onfinish = function(){ g.remove(); };
  }
  function ponPan(animar){
    var viejo = capaPan.firstChild, nuevo = dibujaPan(estado.pan);
    nuevo.setAttribute('class', 'capa');
    capaPan.appendChild(nuevo);
    if (viejo) sale(viejo);
    if (animar && !reducido && nuevo.animate) nuevo.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(0.23,1,0.32,1)' });
  }
  function ponIngr(id, retraso){
    var g = el('g', { 'class': 'capa', 'data-id': id });
    DIBUJO[id](azar(hash(id + estado.pan)), g);
    grupos[id] = g;
    var destino = (id === 'tomate' || id === 'aceite') ? capaBase : capaIngr;
    // Inserta respetando el orden de las capas (la base debajo, las semillas encima)
    var antes = null, pos = ORDEN.indexOf(id);
    $$('[data-id]', destino).some(function(x){ if (ORDEN.indexOf(x.getAttribute('data-id')) > pos && !x.dataset.saliendo){ antes = x; return true; } return false; });
    destino.insertBefore(g, antes);
    entra(g, retraso);
  }
  function quitaIngr(id){ var g = grupos[id]; if (!g) return; g.dataset.saliendo = '1'; delete grupos[id]; sale(g); }

  function nombre(id){ return id === 'semillas' ? 'semillas' : NOMBRES[id]; }
  function lista(arr){ return arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' y ' + arr[arr.length - 1]; }
  function ordenados(){ return estado.sel.slice().sort(function(a, b){ return ORDEN.indexOf(a) - ORDEN.indexOf(b); }); }

  function resumen(){
    var s = ordenados(), base = s.filter(function(x){ return x === 'tomate' || x === 'aceite'; }), resto = s.filter(function(x){ return base.indexOf(x) === -1; });
    var t = NOMBRES[estado.pan];
    if (base.length) t += ' con ' + lista(base.map(nombre));
    if (resto.length) t += (base.length ? ', y encima ' : ' con ') + lista(resto.map(nombre));
    if (!s.length) t += ', sin nada encima todavía';
    $('#tostadaTxt').textContent = t;
    $('#contador').textContent = resto.length + ' de ' + MAX;
    // Bloquea ingredientes cuando ya hay 5
    $$('#chipsIngr .chip').forEach(function(b){ b.disabled = resto.length >= MAX && b.getAttribute('aria-pressed') !== 'true'; });
    sugeridas();
  }

  /* ---------- Tostadas de la carta con los ingredientes elegidos ---------- */
  var BASES = ['tomate', 'aceite'];
  var COLOR = {};
  $$('#chipsIngr .chip, #chipsBase .chip').forEach(function(b){ var id = b.dataset.ing || b.dataset.base, bo = b.querySelector('.bola'); COLOR[id] = bo ? bo.style.getPropertyValue('--c') : '#ccc'; });
  var nMini = 0;
  function mini(t){
    // Dibujo de la tostada con sus ingredientes, para las que no tienen foto
    var id = 'clipMini' + (++nMini);
    var s2 = el('svg', { viewBox: '76 68 448 164', 'aria-hidden': 'true', preserveAspectRatio: 'xMidYMid meet' });
    var defs = el('defs', {}), cp = el('clipPath', { id: id }); cp.appendChild(el('path', { d: PAN })); defs.appendChild(cp); s2.appendChild(defs);
    s2.appendChild(dibujaPan('semillas'));
    var g = el('g', { 'clip-path': 'url(#' + id + ')' });
    t.i.slice().sort(function(a, b){ return ORDEN.indexOf(a) - ORDEN.indexOf(b); }).forEach(function(x){ var gg = el('g', {}); DIBUJO[x](azar(hash(x + t.n)), gg); g.appendChild(gg); });
    s2.appendChild(g);
    return s2;
  }
  function tarjeta(t, galeria, elegidos){
    var a = document.createElement('article'); a.className = 'sug-card';
    var foto;
    if (t.f){
      foto = document.createElement('button'); foto.type = 'button'; foto.className = 'sug-foto';
      foto.dataset.grande = 'assets/img/' + t.f + '-grande.webp'; foto.dataset.galeria = galeria; foto.dataset.pie = 'Tostada ' + t.n;
      foto.setAttribute('aria-label', 'Ampliar foto: tostada ' + t.n);
      var im = document.createElement('img'); im.src = 'assets/img/' + t.f + '.webp'; im.alt = 'Tostada ' + t.n; im.width = 220; im.height = 220; im.loading = 'lazy';
      foto.appendChild(im);
    } else {
      foto = document.createElement('div'); foto.className = 'sug-foto';
      foto.appendChild(mini(t));
      var nt = document.createElement('span'); nt.className = 'dib-nota'; nt.textContent = 'dibujada a mano'; foto.appendChild(nt);
    }
    a.appendChild(foto);
    var h = document.createElement('h5'); h.textContent = t.n; a.appendChild(h);
    var p = document.createElement('p'); p.textContent = t.d; a.appendChild(p);
    var ul = document.createElement('ul'); ul.className = 'sug-ings'; ul.setAttribute('aria-label', 'Lleva');
    t.i.forEach(function(x){ var li = document.createElement('li'); li.textContent = nombre(x); if (elegidos.indexOf(x) !== -1) li.className = 'si'; ul.appendChild(li); });
    a.appendChild(ul);
    return a;
  }
  var grupoPrevio = {};
  function sugeridas(){
    var cont = $('#sugGrupos'), nota = $('#sugNota'); if (!cont) return;
    var elegidos = estado.sel.filter(function(x){ return BASES.indexOf(x) === -1; });
    var nuevos = {}, frag = document.createDocumentFragment();
    function grupo(clave, titulo, lista, color, todo){
      var sec = document.createElement('section'); sec.className = 'sug-grupo'; sec.dataset.clave = clave;
      var h = document.createElement('h4');
      if (todo){ var tt = document.createElement('span'); tt.className = 'todo'; tt.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#chispa"/></svg>'; h.appendChild(tt); }
      else { var bo = document.createElement('span'); bo.className = 'bola'; bo.style.setProperty('--c', color); h.appendChild(bo); }
      h.appendChild(document.createTextNode(titulo + ' '));
      var sm = document.createElement('small'); sm.textContent = lista.length === 1 ? '1 tostada' : lista.length + ' tostadas'; h.appendChild(sm);
      sec.appendChild(h);
      if (lista.length){
        var fila = document.createElement('div'); fila.className = 'sug-fila';
        lista.forEach(function(t){ fila.appendChild(tarjeta(t, 'sug-' + clave, elegidos)); });
        sec.appendChild(fila);
      } else {
        var v = document.createElement('p'); v.className = 'sug-vacio'; v.textContent = 'Ninguna de la carta lleva ' + nombre(clave) + ', pero pídela así en barra y te la preparamos.';
        sec.appendChild(v); sm.textContent = '';
      }
      frag.appendChild(sec); nuevos[clave] = true;
    }
    function cuenta(t){ return elegidos.filter(function(x){ return t.i.indexOf(x) !== -1; }).length; }
    if (elegidos.length > 1){
      var todas = CARTA.filter(function(t){ return elegidos.every(function(x){ return t.i.indexOf(x) !== -1; }); });
      if (todas.length) grupo('todo', 'Con todo lo que has elegido', todas, null, true);
    }
    elegidos.forEach(function(x){
      var lista = CARTA.filter(function(t){ return t.i.indexOf(x) !== -1; });
      // Primero las que llevan más de lo que has elegido
      lista.sort(function(a, b){ return cuenta(b) - cuenta(a); });
      grupo(x, 'Con ' + nombre(x), lista, COLOR[x]);
    });
    cont.innerHTML = ''; cont.appendChild(frag);
    nota.textContent = elegidos.length ? 'Toca una foto para verla en grande. Desliza cada fila para ver más.' : 'Elige ingredientes en el paso 3 y aquí te enseñamos las tostadas de la carta que los llevan.';
    // Solo se anima el grupo que acaba de aparecer
    if (!reducido) $$('.sug-grupo', cont).forEach(function(g){
      if (!grupoPrevio[g.dataset.clave] && g.animate) g.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(0.23,1,0.32,1)' });
    });
    grupoPrevio = nuevos;
  }

  function aplicaBotones(){
    $$('#chipsPan .chip').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.pan === estado.pan ? 'true' : 'false'); });
    $$('#chipsBase .chip').forEach(function(b){ b.setAttribute('aria-pressed', estado.sel.indexOf(b.dataset.base) !== -1 ? 'true' : 'false'); });
    $$('#chipsIngr .chip').forEach(function(b){ b.setAttribute('aria-pressed', estado.sel.indexOf(b.dataset.ing) !== -1 ? 'true' : 'false'); });
  }

  function alterna(id){
    var i = estado.sel.indexOf(id);
    if (i === -1){
      var base = id === 'tomate' || id === 'aceite';
      var nIngr = estado.sel.filter(function(x){ return x !== 'tomate' && x !== 'aceite'; }).length;
      if (!base && nIngr >= MAX) return;
      estado.sel.push(id); ponIngr(id, 0);
    } else { estado.sel.splice(i, 1); quitaIngr(id); }
    aplicaBotones(); resumen();
  }

  function redibujaTodo(animar){
    Object.keys(grupos).forEach(function(k){ grupos[k].remove(); delete grupos[k]; });
    capaBase.innerHTML = ''; capaIngr.innerHTML = '';
    ordenados().forEach(function(id, n){ ponIngr(id, animar ? n * 120 : 0); if (!animar && grupos[id].getAnimations) grupos[id].getAnimations().forEach(function(a){ a.finish(); }); });
  }

  $$('#chipsPan .chip').forEach(function(b){ b.addEventListener('click', function(){ if (estado.pan === b.dataset.pan) return; estado.pan = b.dataset.pan; ponPan(true); redibujaTodo(false); aplicaBotones(); resumen(); }); });
  $$('#chipsBase .chip').forEach(function(b){ b.addEventListener('click', function(){ alterna(b.dataset.base); }); });
  $$('#chipsIngr .chip').forEach(function(b){ b.addEventListener('click', function(){ alterna(b.dataset.ing); }); });

  $('#btnLimpiar').addEventListener('click', function(){ estado.sel.slice().forEach(quitaIngr); estado.sel = []; aplicaBotones(); resumen(); });
  $('#btnSorpresa').addEventListener('click', function(){
    // Unas veces una de la carta, otras una combinación al azar
    var r = Math.random, nueva;
    if (r() < .5){ nueva = CARTA[Math.floor(r() * CARTA.length)].i.slice(); }
    else {
      var pool = ORDEN.filter(function(x){ return x !== 'tomate' && x !== 'aceite'; });
      nueva = []; if (r() < .6) nueva.push(r() < .6 ? 'tomate' : 'aceite');
      var n = 2 + Math.floor(r() * 3);
      while (nueva.filter(function(x){ return pool.indexOf(x) !== -1; }).length < n){ var c = pool[Math.floor(r() * pool.length)]; if (nueva.indexOf(c) === -1) nueva.push(c); }
    }
    var panes = ['cristal', 'cereal', 'semillas'], p = panes[Math.floor(r() * 3)];
    estado.sel.slice().forEach(quitaIngr);
    estado.sel = nueva;
    if (p !== estado.pan){ estado.pan = p; ponPan(true); }
    ordenados().forEach(function(id, n){ ponIngr(id, 120 + n * 130); });
    aplicaBotones(); resumen();
  });

  function toast(t){
    var e = document.getElementById('toast'); if (!e) return;
    e.textContent = t; e.classList.add('ve');
    clearTimeout(toast.t); toast.t = setTimeout(function(){ e.classList.remove('ve'); }, 2600);
  }
  $('#btnCompartir').addEventListener('click', function(){
    var q = [estado.pan].concat(ordenados()).join('.');
    var url = location.origin + location.pathname + '?tostada=' + encodeURIComponent(q) + '#monta';
    var texto = 'Mira la tostada que me he montado en Cafetería by Vanessa: ' + $('#tostadaTxt').textContent + '.';
    if (navigator.share){ navigator.share({ title: 'Mi tostada en By Vanessa', text: texto, url: url }).catch(function(){}); return; }
    var hecho = function(){ toast('Enlace copiado. Pégalo donde quieras.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto + ' ' + url).then(hecho, function(){ toast('No se ha podido copiar el enlace.'); });
    else toast('Copia este enlace: ' + url);
  });

  // Una tostada compartida llega en la dirección (?tostada=semillas.tomate.aguacate)
  try {
    var q = new URLSearchParams(location.search).get('tostada');
    if (q){
      var partes = q.split('.');
      if (['cristal', 'cereal', 'semillas'].indexOf(partes[0]) !== -1) estado.pan = partes[0];
      var ingr = 0;
      partes.slice(1).forEach(function(x){ if (DIBUJO[x] && estado.sel.indexOf(x) === -1){ var b = x === 'tomate' || x === 'aceite'; if (b || ingr < MAX){ estado.sel.push(x); if (!b) ingr++; } } });
    }
  } catch (e) {}

  ponPan(false);
  // La tostada de ejemplo se monta sola cuando la sección aparece en pantalla
  if (!estado.sel.length) estado.sel = ['tomate', 'aguacate', 'queso', 'semillas'];
  aplicaBotones(); resumen();
  var sec = document.getElementById('monta');
  if ('IntersectionObserver' in window && !reducido){
    var io = new IntersectionObserver(function(en){ if (en[0].isIntersecting){ io.disconnect(); redibujaTodo(true); } }, { rootMargin: '0px 0px -30% 0px' });
    io.observe(sec);
  } else redibujaTodo(false);
})();
