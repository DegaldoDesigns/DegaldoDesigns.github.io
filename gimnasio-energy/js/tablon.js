/* tablon-recepcion v1.1 (librería: componentes/tablon-recepcion.html). Horario, clases y tarifas desde un JSON editable
   (Pages CMS). El HTML ya trae lo mismo: si el JSON no carga, se queda el HTML. Todo se escribe como texto (textContent).
   v1.1: clases con "fuente" (de cuándo es la hora); clase sin hora = enlace "Pregunta la hora" a WhatsApp si el tablón
   lleva data-tablon-wa; tarifas con "periodo", "incluye" y "carnet" (rellenan los [data-tablon-tarifa] de la página y,
   con data-tablon-sin-carnet en la lista, esas no se repiten en filas); el evento tablon:listo lleva los datos (detail.datos). */
(function(){
  var DIAS = {domingo:0, lunes:1, martes:2, miercoles:3, jueves:4, viernes:5, sabado:6};
  function norm(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function hoyEn(zona){
    try{ var w = new Intl.DateTimeFormat('en-US', {timeZone:zona, weekday:'short'}).format(new Date());
      return {Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[w]; }catch(e){ return new Date().getDay(); }
  }
  function nodo(tag, clase, texto){ var n = document.createElement(tag); if (clase) n.className = clase; if (texto != null) n.textContent = texto; return n; }
  function fechaCorta(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : ''; }
  function plantilla(txt, ctx){ return String(txt || '').replace(/\{(\w+)\}/g, function(_, k){ return ctx[k] != null ? ctx[k] : ''; }); }

  function marcarHoy(t, zona){
    var hoy = hoyEn(zona);
    Array.prototype.forEach.call(t.querySelectorAll('[data-tablon-lista="horario"] [data-dia]'), function(li){
      var es = +li.getAttribute('data-dia') === hoy;
      li.classList.toggle('activo', es);
      if (es){ li.setAttribute('aria-current', 'date'); if (!li.querySelector('.tb-hoy')) li.querySelector('.tb-dia').appendChild(nodo('span', 'tb-hoy', 'Hoy')); }
      else { li.removeAttribute('aria-current'); var h = li.querySelector('.tb-hoy'); if (h) h.remove(); }
    });
  }
  function rellenar(ul, filas){
    var fijo = ul.querySelector('.resalte');                 // el resalte de resaltado-deslizante se conserva
    ul.textContent = ''; if (fijo) ul.appendChild(fijo);
    filas.forEach(function(f){ ul.appendChild(f); });
  }
  /* Una clase sin hora: enlace a WhatsApp con el mismo aspecto que una hora (si hay número), o "Hora por confirmar" */
  function sinHora(t, x){
    var num = (t.getAttribute('data-tablon-wa') || '').replace(/\D/g, '');
    if (!num) return nodo('span', 'tb-hora tb-pend', 'Hora por confirmar');
    var a = nodo('a', 'tb-hora tb-pregunta', t.getAttribute('data-tablon-wa-etiqueta') || 'Pregunta la hora');
    var msg = plantilla(t.getAttribute('data-tablon-wa-texto') || 'Hola, ¿a qué hora es {actividad}?', {actividad:x.actividad || ''});
    a.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg); a.target = '_blank'; a.rel = 'noopener';
    return a;
  }
  /* Carnets u otras piezas de la página con los datos de una tarifa: [data-tablon-tarifa="Nombre"] [data-tb-campo="precio|periodo|incluye|nombre"] */
  function piezasTarifa(x){ return Array.prototype.filter.call(document.querySelectorAll('[data-tablon-tarifa]'), function(p){ return norm(p.getAttribute('data-tablon-tarifa')) === norm(x.nombre); }); }
  function rellenarPieza(p, x){
    Array.prototype.forEach.call(p.querySelectorAll('[data-tb-campo]'), function(c){
      var k = c.getAttribute('data-tb-campo'), v = x[k] != null ? String(x[k]) : '';
      if (k === 'incluye' && !v) v = c.getAttribute('data-tb-vacio') || 'Pregúntanos qué incluye.';
      c.textContent = v; if (k === 'periodo') c.hidden = !v;
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-tablon]'), function(t){
    var zona = t.getAttribute('data-tablon-zona') || 'Europe/Madrid';
    marcarHoy(t, zona);
    var url = t.getAttribute('data-tablon'); if (!url || !window.fetch) return;
    fetch(url, {cache:'no-cache'}).then(function(r){ if (!r.ok) throw r.status; return r.json(); }).then(function(d){
      var ul;
      if (d.actualizado) Array.prototype.forEach.call(t.querySelectorAll('[data-tablon-fecha]'), function(f){ f.textContent = fechaCorta(d.actualizado); f.setAttribute('datetime', d.actualizado); });
      if (Array.isArray(d.horario) && (ul = t.querySelector('[data-tablon-lista="horario"]'))){
        rellenar(ul, d.horario.map(function(x){
          var li = nodo('li', 'tb-fila r-item'), n = DIAS[norm(x.dia)], tr = (x.tramos || []).filter(function(y){ return y && y.desde && y.hasta; });
          if (n != null) li.setAttribute('data-dia', n);
          if (!tr.length) li.classList.add('tb-cerrado');
          li.appendChild(nodo('span', 'tb-dia', x.dia));
          var horas = nodo('span', 'tb-horas', tr.length ? null : (x.texto || 'Cerrado'));
          tr.forEach(function(y){ horas.appendChild(nodo('span', null, y.desde + ' a ' + y.hasta)); });   // un tramo por línea
          li.appendChild(horas);
          return li;
        }));
        marcarHoy(t, zona);
      }
      if (Array.isArray(d.clases) && (ul = t.querySelector('[data-tablon-lista="clases"]'))){
        rellenar(ul, d.clases.map(function(x){
          var li = nodo('li', 'tb-fila'), a = nodo('span', 'tb-act', x.actividad);
          if (x.sala) a.appendChild(nodo('small', null, x.sala));
          li.appendChild(a);
          var h = x.hora ? nodo('span', 'tb-hora', x.hora) : sinHora(t, x);
          var pie = [x.dias, x.hora ? x.fuente : ''].filter(Boolean).join(' · ');                    // días y de cuándo es la hora, debajo
          if (pie) h.appendChild(nodo('small', null, pie));
          li.appendChild(h);
          return li;
        }));
      }
      if (Array.isArray(d.tarifas)){
        d.tarifas.forEach(function(x){ piezasTarifa(x).forEach(function(p){ rellenarPieza(p, x); }); });
        if ((ul = t.querySelector('[data-tablon-lista="tarifas"]'))){
          var sinCarnet = ul.hasAttribute('data-tablon-sin-carnet');
          rellenar(ul, d.tarifas.filter(function(x){ return !(sinCarnet && x.carnet && piezasTarifa(x).length); }).map(function(x){
            var li = nodo('li', 'tb-fila'), nom = nodo('span', 'tb-nombre'), txt = nodo('span', null, x.nombre), det = x.detalle || x.periodo;
            if (det) txt.appendChild(nodo('small', null, det));                                         // el detalle, debajo del nombre
            nom.appendChild(txt);
            li.appendChild(nom); li.appendChild(nodo('span', 'tb-precio', x.precio));
            return li;
          }));
        }
      }
      Array.prototype.forEach.call(t.querySelectorAll('[data-tablon-texto]'), function(p){
        var k = p.getAttribute('data-tablon-texto');
        if (typeof d[k] === 'string'){ p.textContent = d[k]; p.hidden = !d[k]; }
      });
      t.dispatchEvent(new CustomEvent('tablon:listo', {bubbles:true, detail:{datos:d}}));
    }).catch(function(){ /* sin JSON: se queda el HTML */ });
  });
})();
