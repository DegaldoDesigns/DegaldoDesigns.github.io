/* La Esquina · COPIA LITERAL del script de 01-Libreria-de-Codigo/componentes/carta-lista-flexible.html (v1.3.1), forma A (platos en index.html). No editar aquí. */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var puedeVT = typeof document.startViewTransition === 'function' && !reducido;
  function el(tag, cls, txt){ var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function precio(p){
    var lst = p.precios || (p.precio != null && p.precio !== '' ? [p.precio] : []);
    if (!lst.length) return null;
    var s = el('span', 'clf-precio');
    lst.forEach(function(x, i){
      if (i) s.appendChild(el('span', 'sep', '·'));
      if (Array.isArray(x)){ if (x[0]) s.appendChild(el('small', '', x[0])); s.appendChild(document.createTextNode(x[1] || '')); }
      else s.appendChild(document.createTextNode(String(x)));
    });
    if (p.fecha) s.setAttribute('data-fecha', p.fecha);                                // v1.3
    return s;
  }
  /* Forma B: del array al mismo marcado que la forma A */
  function pintar(cont, C, paneles){
    var espera = cont.querySelector('.clf-espera');
    (C.apartados || []).forEach(function(a){
      if (!a || !a.platos || !a.platos.length) return;
      var panel = el('div', 'clf-panel'), col = el('div', 'clf-lista'), ul = el('ul', 'clf-platos');
      if (a.pestana) panel.setAttribute('data-clf-pestana', a.pestana);
      col.appendChild(el('h3', 'clf-tit', a.nombre));
      if (a.nota) col.appendChild(el('p', 'clf-nota', a.nota));                         // v1.3
      if (a.comun){ var cm = el('p', 'clf-comun'), cp = precio(a.comun);
        if (cp){ cm.appendChild(cp); if (a.comun.texto) cm.appendChild(document.createTextNode(' ' + a.comun.texto)); col.appendChild(cm); } }
      a.platos.forEach(function(p){
        var li = el('li', 'clf-plato'), linea = el('p', 'clf-linea');
        linea.appendChild(el('span', 'clf-nombre', p.nombre || ''));
        var pr = precio(p); if (pr) linea.appendChild(pr);
        li.appendChild(linea);
        if (p.desc) li.appendChild(el('p', 'clf-desc', p.desc));
        ul.appendChild(li);
      });
      col.appendChild(ul); panel.appendChild(col);
      var fig = a.foto && espera && espera.querySelector('[data-clf-foto="' + a.foto + '"]');
      if (fig){ var f = fig.cloneNode(true); f.removeAttribute('data-clf-foto'); f.classList.remove('reveal');
        var c = el('div', 'clf-foto'); c.appendChild(f); panel.appendChild(c); panel.classList.add('con-foto'); }
      paneles.appendChild(panel);
    });
    var fe = cont.querySelector('[data-clf-fecha]');
    if (fe && C.fecha) fe.textContent = 'Carta de ' + C.fecha + '. ' + fe.textContent;
  }
  /* v1.3: precios fechados → texto oculto para lectores y leyenda al pie (solo si alguno la lleva) */
  function fechar(cont){
    var precios = cont.querySelectorAll('.clf-precio[data-fecha]'), fechas = [];
    if (!precios.length) return;
    var oculto = cont.getAttribute('data-clf-oculto') || 'precio de {fecha}, pendiente de confirmar';
    Array.prototype.forEach.call(precios, function(pr){
      var f = pr.getAttribute('data-fecha');
      if (fechas.indexOf(f) < 0) fechas.push(f);
      if (!pr.querySelector('.clf-oculto')) pr.appendChild(el('span', 'clf-oculto', ' (' + oculto.replace('{fecha}', f) + ')'));
    });
    if (cont.querySelector('.clf-leyenda')) return;                                   // ya escrita en el HTML
    var marca = (getComputedStyle(cont).getPropertyValue('--clf-marca') || '"*"').trim().replace(/^["']|["']$/g, '');
    var plantilla = cont.getAttribute('data-clf-leyenda') || '{marca} Precios de la carta de {fecha}, pendientes de confirmar.';
    var pie = cont.querySelector('.clf-pie');
    if (!pie){ pie = el('div', 'clf-pie'); (cont.querySelector('.clf-viva') || cont).appendChild(pie); }
    fechas.slice().reverse().forEach(function(f){
      pie.insertBefore(el('p', 'clf-leyenda', plantilla.replace('{fecha}', f).replace('{marca}', marca)), pie.firstChild);
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-clf]'), function(cont, n){
    var paneles = cont.querySelector('.clf-paneles'), espera = cont.querySelector('.clf-espera'), viva = cont.querySelector('.clf-viva');
    if (!paneles) return;
    var nombre = cont.getAttribute('data-clf-datos');
    if (nombre && window[nombre]) pintar(cont, window[nombre], paneles);
    fechar(cont);                                                                     // v1.3
    var todos = Array.prototype.slice.call(paneles.querySelectorAll('.clf-panel'));
    var aps = todos.filter(function(p){ return p.querySelector('.clf-plato'); });
    todos.forEach(function(p){ if (aps.indexOf(p) < 0) p.hidden = true; });          // apartados vacíos: fuera
    if (espera) espera.hidden = aps.length > 0;
    if (viva) viva.hidden = !aps.length;
    if (!aps.length) return;                                                          // sin platos: respaldo
    paneles.style.viewTransitionName = 'clf-panel-' + n;                              // único por carta

    /* Pestañas: solo de los apartados con platos, en su orden */
    var zona = el('div', 'clf-zona'), cab = el('div', 'clf-pestanas'), marca = el('span', 'clf-marca');
    cab.setAttribute('role', 'tablist'); cab.setAttribute('aria-label', cont.getAttribute('data-clf-etiqueta') || 'Apartados de la carta');
    marca.setAttribute('aria-hidden', 'true'); cab.appendChild(marca); zona.appendChild(cab);
    var tabs = aps.map(function(p, i){
      var tit = p.querySelector('.clf-tit'), id = 'clf' + n + '-' + i;
      var t = el('button', 'clf-pestana', p.getAttribute('data-clf-pestana') || (tit ? tit.textContent.trim() : 'Apartado ' + (i + 1)));
      t.type = 'button'; t.id = 't-' + id; t.setAttribute('role', 'tab'); t.setAttribute('aria-controls', p.id || (p.id = 'p-' + id));
      t.setAttribute('aria-selected', String(i === 0)); t.tabIndex = i === 0 ? 0 : -1;
      p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', t.id); p.tabIndex = 0; p.hidden = i !== 0;
      cab.appendChild(t); return t;
    });
    paneles.parentNode.insertBefore(zona, paneles);
    var pista = el('p', 'clf-pista', cont.getAttribute('data-clf-pista') || 'Desliza las pestañas para ver todos los apartados');
    pista.setAttribute('aria-hidden', 'true'); pista.hidden = true; paneles.parentNode.insertBefore(pista, paneles);
    function pistaSiHace(){ pista.hidden = zona.scrollWidth <= zona.clientWidth + 1; }
    cont.classList.add('clf-con-pestanas');

    function reposo(){ return cab.querySelector('[aria-selected="true"]'); }
    function ir(t, sin){
      if (!t || !t.offsetWidth){ marca.classList.remove('listo'); return; }
      var x = t.offsetLeft + t.offsetWidth / 2 - marca.offsetWidth / 2, y = cab.clientHeight - marca.offsetHeight / 2 + .5;
      var saltar = sin || reducido || !marca.classList.contains('listo');
      if (saltar) marca.style.transition = 'none';
      marca.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      if (saltar){ void marca.offsetWidth; marca.style.transition = ''; }
      marca.classList.add('listo');
    }
    ir(reposo(), true);
    pistaSiHace();
    if ('ResizeObserver' in window) new ResizeObserver(function(){ ir(reposo(), true); pistaSiHace(); }).observe(cab);
    if (raton){
      tabs.forEach(function(t){ t.addEventListener('pointerenter', function(e){ if (e.pointerType === 'mouse') ir(t); }); });
      cab.addEventListener('pointerleave', function(){ ir(reposo()); });
    }
    cab.addEventListener('focusin', function(e){ var t = e.target.closest('[role="tab"]'); if (t) ir(t); });
    function entrar(panel){
      if (reducido) return;
      Array.prototype.forEach.call(panel.querySelectorAll('.clf-plato'), function(f, i){ f.style.setProperty('--n', i); });
      panel.classList.remove('entra'); void panel.offsetWidth; panel.classList.add('entra');
    }
    function centrar(t){
      if (zona.scrollWidth <= zona.clientWidth) return;
      var z = zona.getBoundingClientRect(), r = t.getBoundingClientRect();
      zona.scrollTo({left: zona.scrollLeft + (r.left + r.width / 2) - (z.left + z.width / 2), behavior: reducido ? 'auto' : 'smooth'});
    }
    function elegir(t, foco, directo){                                               // directo (v1.3): sin transición ni reubicar
      if (t.getAttribute('aria-selected') === 'true'){ if (foco) t.focus(); return; }
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      var aplicar = function(){ tabs.forEach(function(x){ var si = x === t; x.setAttribute('aria-selected', String(si)); x.tabIndex = si ? 0 : -1;
        var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !si; }); entrar(panel); if (!directo) reubicar(); };
      /* tras el cambio, el principio del panel nuevo tiene que verse: en escritorio, si la tira ya se fue por arriba,
         se vuelve a ella; en móvil (tira pegada), si el panel empieza por encima de la tira, se baja hasta él */
      function reubicar(){
        var arriba = parseFloat(getComputedStyle(cont).getPropertyValue('--clf-arriba')) || 0;
        var z = zona.getBoundingClientRect(), pt = panel.getBoundingClientRect().top, d = 0;
        if (z.top < arriba) d = z.top - arriba - 16;
        else if (pt < z.bottom) d = pt - z.bottom - 16;
        if (d) scrollTo({top: scrollY + d, behavior: reducido ? 'auto' : 'smooth'});
      }
      if (puedeVT && !directo) document.startViewTransition(aplicar); else aplicar();
      ir(t); centrar(t);
      if (foco) t.focus();
    }
    /* v1.3: sin pestañas desde un ancho (data-clf-sin-pestanas="(min-width: 1100px)"): todo a la vista, sin roles */
    var mq = cont.getAttribute('data-clf-sin-pestanas') ? matchMedia(cont.getAttribute('data-clf-sin-pestanas')) : null;
    function modo(){
      var sin = !!(mq && mq.matches);
      zona.hidden = sin; cont.classList.toggle('clf-con-pestanas', !sin);
      aps.forEach(function(p, i){
        if (sin){ p.hidden = false; p.removeAttribute('role'); p.removeAttribute('aria-labelledby'); p.removeAttribute('tabindex'); }
        else { p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', tabs[i].id); p.tabIndex = 0;
          p.hidden = tabs[i].getAttribute('aria-selected') !== 'true'; }
      });
      if (sin) pista.hidden = true; else { ir(reposo(), true); pistaSiHace(); }
    }
    if (mq){ modo(); if (mq.addEventListener) mq.addEventListener('change', modo); else mq.addListener(modo); }
    /* v1.3: ancla a un apartado (#id del panel o de algo dentro): se elige su pestaña y se deja la tira a la vista
       (pegada: el apartado justo debajo de ella). También en 'load', porque el navegador vuelve a saltar al ancla. */
    function porAncla(){
      var id = decodeURIComponent(location.hash.slice(1)), d = id && document.getElementById(id);
      var p = d && d.closest('.clf-panel'), i = p ? aps.indexOf(p) : -1;
      if (i < 0 || zona.hidden) return;
      elegir(tabs[i], false, true);
      var arriba = parseFloat(getComputedStyle(cont).getPropertyValue('--clf-arriba')) || 0;
      var y = getComputedStyle(zona).position === 'sticky' ? d.getBoundingClientRect().top - zona.offsetHeight : zona.getBoundingClientRect().top;
      scrollTo({top: scrollY + y - arriba - 16, behavior: 'instant'});
    }
    porAncla(); addEventListener('hashchange', porAncla); addEventListener('load', porAncla);
    tabs.forEach(function(t, i){
      t.addEventListener('click', function(){ elegir(t); });
      t.addEventListener('keydown', function(e){
        var d = null;
        if (e.key === 'ArrowRight') d = tabs[(i + 1) % tabs.length]; else if (e.key === 'ArrowLeft') d = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') d = tabs[0]; else if (e.key === 'End') d = tabs[tabs.length - 1];
        if (d){ e.preventDefault(); elegir(d, true); }
      });
    });
  });
})();
