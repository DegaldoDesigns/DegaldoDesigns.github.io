/* La Esquina · COPIA LITERAL del script de 01-Libreria-de-Codigo/componentes/pedido-whatsapp.html (v1). No editar aquí. */
/* Pedido para recoger por WhatsApp, sin servidor: el cliente monta el pedido en la carta (cantidades, cambios de ingredientes,
   hora de recogida y nombre) y se abre WhatsApp con UN mensaje ya escrito. Lo envía el propio cliente: no se guarda nada.
   Marcado: un contenedor [data-pd='{config}'] con los dos <dialog> (#pd-opciones y #pd-pedido) y la burbuja .pd-flota,
   y en cada plato pedible [data-pd-plato] (el nombre sale de .clf-nombre si el atributo va vacío). Opcionales por plato:
   data-pd-precio="9.5", data-pd-grupo="burger" (grupos de opciones de la config), data-pd-quitar="Lechuga, Tomate". */
(function(){
  var raiz = document.querySelector('[data-pd]');
  if (!raiz) return;
  var C = {};
  try { C = JSON.parse(raiz.getAttribute('data-pd')); } catch (e) { return; }
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var paso = C.intervalo || 15, minimo = C.minimo || 20, cola = C.ultimo || 0;
  var lineas = [];                                               // {id, nombre, precio, cambios:[], cant}
  var plato = null;                                              // plato abierto en el diálogo de opciones

  var dOp = document.getElementById('pd-opciones'), dPed = document.getElementById('pd-pedido');
  var flota = raiz.querySelector('.pd-flota'), flotaN = raiz.querySelector('.pd-flota-n');
  var aviso = raiz.querySelector('.pd-aviso');                   // región viva: "Añadido: …"
  var lista = dPed.querySelector('.pd-lista'), vacio = dPed.querySelector('.pd-vacio');
  var hora = dPed.querySelector('#pd-hora'), nombre = dPed.querySelector('#pd-nombre'), notas = dPed.querySelector('#pd-notas');
  var total = dPed.querySelector('.pd-total'), enviar = dPed.querySelector('.pd-enviar'), error = dPed.querySelector('.pd-error');
  var form = dPed.querySelector('.pd-form');

  function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function euros(n){ return n.toFixed(2).replace('.', ',').replace(',00', '') + ' €'; }
  function hhmm(m){ m = m % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }

  /* Hora del negocio (Europe/Madrid), no la del móvil de quien pide */
  function ahora(){
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', {timeZone: C.zona || 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'})
        .formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return {dia: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: (+p.hour) * 60 + (+p.minute)};
    } catch (e) { var d = new Date(); return {dia: d.getDay(), min: d.getHours() * 60 + d.getMinutes()}; }
  }
  /* Horas de recogida: cada `paso` minutos dentro de los tramos del día, desde ahora + `minimo`.
     Si hoy ya no queda ninguna, las del siguiente día que abra (dentro de una semana). */
  function horas(){
    var a = ahora();
    for (var k = 0; k < 8; k++){
      var dia = (a.dia + k) % 7, tramos = (C.horario || {})[dia] || [], out = [];
      tramos.forEach(function(t){
        var desde = k === 0 ? Math.max(t[0] + minimo, a.min + minimo) : t[0] + minimo;
        desde = Math.ceil(desde / paso) * paso;
        for (var m = desde; m <= t[1] - cola; m += paso) out.push(m);
      });
      if (out.length) return {k: k, dia: dia, horas: out};
    }
    return null;
  }
  function etiquetaDia(r){ return r.k === 0 ? 'hoy' : r.k === 1 ? 'mañana' : 'el ' + DIAS[r.dia]; }
  function pintarHoras(){
    var r = horas(), elegida = hora.value;
    hora.textContent = '';
    if (!r){ hora.appendChild(el('option', '', 'Sin horas disponibles')); hora.disabled = true; return; }
    hora.disabled = false;
    var g = el('optgroup'); g.label = etiquetaDia(r).replace(/^./, function(c){ return c.toUpperCase(); });
    var ph = el('option', '', 'Elige una hora'); ph.value = ''; hora.appendChild(ph);
    r.horas.forEach(function(m){ var o = el('option', '', hhmm(m)); o.value = etiquetaDia(r) + ' a las ' + hhmm(m); g.appendChild(o); });
    hora.appendChild(g);
    if (elegida && hora.querySelector('option[value="' + elegida + '"]')) hora.value = elegida;
  }

  /* ---------- Platos: botón "Añadir" en cada uno ---------- */
  var platos = Array.prototype.slice.call(document.querySelectorAll('[data-pd-plato]'));
  platos.forEach(function(li){
    var n = li.getAttribute('data-pd-plato') || (li.querySelector('.clf-nombre') || li).textContent.trim();
    var b = el('button', 'pd-add');
    b.type = 'button';
    b.innerHTML = '<span class="pd-add-t">Añadir</span><span class="pd-add-ok" aria-hidden="true">Añadido</span>';
    b.setAttribute('aria-label', 'Añadir ' + n + ' al pedido');
    (li.querySelector('.clf-linea') || li).appendChild(b);
    b.addEventListener('click', function(){
      var info = {nombre: n, precio: parseFloat(li.getAttribute('data-pd-precio')) || null,
        grupos: (li.getAttribute('data-pd-grupo') || '').split(/\s+/).filter(Boolean),
        quitar: (li.getAttribute('data-pd-quitar') || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean), boton: b};
      if (!info.grupos.length && !info.quitar.length && !C.siempreOpciones) { meter(info, [], 1); hecho(b, n); }
      else abrirOpciones(info);
    });
  });
  if (!platos.length) return;
  raiz.hidden = false;
  Array.prototype.forEach.call(document.querySelectorAll('[data-pd-intro]'), function(p){ p.hidden = false; });

  function hecho(b, n){
    aviso.textContent = ''; setTimeout(function(){ aviso.textContent = 'Añadido al pedido: ' + n; }, 30);
    b.classList.add('ok'); clearTimeout(b._t); b._t = setTimeout(function(){ b.classList.remove('ok'); }, 1300);
  }
  function meter(info, cambios, cant){
    var id = info.nombre + '|' + cambios.join('|');
    var l = lineas.filter(function(x){ return x.id === id; })[0];
    if (l) l.cant += cant; else lineas.push({id: id, nombre: info.nombre, precio: info.precio, cambios: cambios, cant: cant});
    pintar(true);
  }

  /* ---------- Diálogo de opciones (cambios de ingredientes) ---------- */
  var opTit = dOp.querySelector('.pd-op-tit'), opCampos = dOp.querySelector('.pd-op-campos'), opCant = dOp.querySelector('.pd-cant-n');
  var opOtro = dOp.querySelector('#pd-otro'), cant = 1;
  function abrirOpciones(info){
    plato = info; cant = 1; opCant.textContent = '1'; opOtro.value = '';
    opTit.textContent = info.nombre; opCampos.textContent = '';
    info.grupos.forEach(function(g, gi){
      var def = (C.grupos || {})[g]; if (!def) return;
      def.forEach(function(op, oi){
        var fs = el('fieldset', 'pd-campo'), lg = el('legend', '', op.nombre); fs.appendChild(lg);
        var fila = el('div', 'pd-chips');
        op.opciones.forEach(function(o, i){
          var lb = el('label', 'pd-chip'), inp = el('input'); inp.type = 'radio'; inp.name = 'pd-g' + gi + '-' + oi; inp.value = i === 0 ? '' : (op.formato || '{o}').replace('{o}', o.toLowerCase());
          inp.checked = i === 0; lb.appendChild(inp); lb.appendChild(el('span', '', o)); fila.appendChild(lb);
        });
        fs.appendChild(fila); opCampos.appendChild(fs);
      });
    });
    if (info.quitar.length){
      var fs = el('fieldset', 'pd-campo'); fs.appendChild(el('legend', '', 'Quitar algo')); var fila = el('div', 'pd-chips');
      info.quitar.forEach(function(q){
        var lb = el('label', 'pd-chip'), inp = el('input'); inp.type = 'checkbox'; inp.value = 'sin ' + q.toLowerCase();
        lb.appendChild(inp); lb.appendChild(el('span', '', 'Sin ' + q.toLowerCase())); fila.appendChild(lb);
      });
      fs.appendChild(fila); opCampos.appendChild(fs);
    }
    dOp.showModal();
  }
  dOp.querySelector('.pd-menos').addEventListener('click', function(){ cant = Math.max(1, cant - 1); opCant.textContent = cant; });
  dOp.querySelector('.pd-mas').addEventListener('click', function(){ cant = Math.min(20, cant + 1); opCant.textContent = cant; });
  dOp.querySelector('.pd-op-ok').addEventListener('click', function(){
    var cambios = [];
    Array.prototype.forEach.call(opCampos.querySelectorAll('input:checked'), function(i){ if (i.value) cambios.push(i.value); });
    var otro = opOtro.value.trim(); if (otro) cambios.push(otro);
    meter(plato, cambios, cant); dOp.close(); hecho(plato.boton, plato.nombre);
  });

  /* ---------- El pedido ---------- */
  function cuenta(){ return lineas.reduce(function(s, l){ return s + l.cant; }, 0); }
  function pintar(nuevo){
    var n = cuenta();
    flotaN.textContent = n;
    flota.setAttribute('aria-label', 'Ver tu pedido: ' + n + (n === 1 ? ' plato' : ' platos'));
    var antes = flota.classList.contains('visible');
    flota.classList.toggle('visible', n > 0);
    document.documentElement.classList.toggle('pd-con-pedido', n > 0);
    if (nuevo && antes && !reducido && flota.animate)
      flota.animate([{scale: 1}, {scale: 1.1}, {scale: 1}], {duration: 260, easing: 'cubic-bezier(0.23,1,0.32,1)'});
    lista.textContent = ''; vacio.hidden = n > 0; form.hidden = n === 0;
    lineas.forEach(function(l, i){
      var li = el('li', 'pd-linea'), txt = el('div', 'pd-linea-txt');
      txt.appendChild(el('p', 'pd-linea-nombre', l.nombre));
      if (l.cambios.length) txt.appendChild(el('p', 'pd-linea-cambios', l.cambios.join(' · ')));
      if (l.precio) txt.appendChild(el('p', 'pd-linea-precio', euros(l.precio * l.cant)));
      var ctr = el('div', 'pd-cant');
      var m = el('button', 'pd-menos', '−'), c = el('span', 'pd-cant-n', l.cant), p = el('button', 'pd-mas', '+');
      m.type = p.type = 'button';
      m.setAttribute('aria-label', (l.cant === 1 ? 'Quitar ' : 'Uno menos de ') + l.nombre); p.setAttribute('aria-label', 'Uno más de ' + l.nombre);
      m.addEventListener('click', function(){ l.cant--; if (l.cant < 1) lineas.splice(i, 1); pintar(); foco(i); });
      p.addEventListener('click', function(){ l.cant = Math.min(20, l.cant + 1); pintar(); foco(i, true); });
      ctr.appendChild(m); ctr.appendChild(c); ctr.appendChild(p);
      li.appendChild(txt); li.appendChild(ctr); lista.appendChild(li);
    });
    var conPrecio = lineas.length && lineas.every(function(l){ return l.precio; });
    total.textContent = conPrecio ? 'Total: ' + euros(lineas.reduce(function(s, l){ return s + l.precio * l.cant; }, 0)) : (C.sinPrecio || 'Te decimos el total al confirmar.');
    mensaje();
  }
  function foco(i, mas){                                         // tras + o −, el foco sigue en la misma línea
    var f = lista.children[Math.min(i, lista.children.length - 1)];
    if (f) f.querySelector(mas ? '.pd-mas' : '.pd-menos').focus(); else dPed.querySelector('.pd-cerrar').focus();
  }
  function mensaje(){
    var t = (C.saludo || 'Hola, quiero hacer un pedido para recoger:') + '\n\n';
    lineas.forEach(function(l){ t += '• ' + l.cant + ' × ' + l.nombre + (l.cambios.length ? ' (' + l.cambios.join('; ') + ')' : '') + '\n'; });
    t += '\nRecogida: ' + (hora.value || '(sin elegir)');
    t += '\nA nombre de: ' + (nombre.value.trim() || '(sin nombre)');
    if (notas.value.trim()) t += '\nNotas: ' + notas.value.trim();
    var conPrecio = lineas.length && lineas.every(function(l){ return l.precio; });
    if (conPrecio) t += '\nTotal según la web: ' + euros(lineas.reduce(function(s, l){ return s + l.precio * l.cant; }, 0));
    enviar.href = 'https://wa.me/' + C.telefono + '?text=' + encodeURIComponent(t);
  }
  [hora, nombre, notas].forEach(function(c){ c.addEventListener('input', function(){ mensaje(); error.hidden = true; c.removeAttribute('aria-invalid'); }); });
  enviar.addEventListener('click', function(e){
    var mal = !hora.value ? hora : !nombre.value.trim() ? nombre : null;
    if (mal){ e.preventDefault(); mal.setAttribute('aria-invalid', 'true'); error.textContent = mal === hora ? 'Elige a qué hora lo recoges.' : 'Dinos a nombre de quién va el pedido.'; error.hidden = false; mal.focus(); }
  });

  flota.addEventListener('click', function(){ pintarHoras(); mensaje(); dPed.showModal(); });
  if (C.pausa){                                                  // pedidos parados: se sigue viendo la carta, se pide por WhatsApp
    form.hidden = true; dPed.querySelector('.pd-pausa').hidden = false;
    var pintarOrig = pintar; pintar = function(n){ pintarOrig(n); form.hidden = true; };
  }
  /* Cerrar: botón ×, Escape (nativo) o clic en el fondo */
  [dOp, dPed].forEach(function(d){
    d.querySelector('.pd-cerrar').addEventListener('click', function(){ d.close(); });
    d.addEventListener('click', function(e){ if (e.target === d) d.close(); });
  });
  setInterval(function(){ if (dPed.open) pintarHoras(); }, 60000);
  pintar();
})();
