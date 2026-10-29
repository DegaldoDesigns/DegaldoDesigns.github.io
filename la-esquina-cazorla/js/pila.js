/* La Esquina · COPIA LITERAL del script de 01-Libreria-de-Codigo/componentes/pila-deslizable.html (v3): la burger del mes. No editar aquí. */
/* pila-deslizable v3: datos opcionales en JSON + etiqueta honrada del mes + arrastre por velocidad */
(function(){
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function mesHoy(zona){
    try{
      var p = {};
      new Intl.DateTimeFormat('en-US', {timeZone:zona, year:'numeric', month:'2-digit'}).formatToParts(new Date()).forEach(function(x){ p[x.type] = x.value; });
      return p.year + '-' + p.month;
    }catch(e){ var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2); }
  }
  function nombreMes(m){ var a = /^(\d{4})-(\d{2})$/.exec(m || ''); if (!a) return ''; var n = MESES[+a[2] - 1]; return n ? n.charAt(0).toUpperCase() + n.slice(1) + ' de ' + a[1] : ''; }
  function crear(tag, clase, texto){ var e = document.createElement(tag); if (clase) e.className = clase; if (texto != null) e.textContent = texto; return e; }

  /* Una tarjeta desde un dato del JSON (solo textContent) */
  function tarjeta(d){
    var a = crear('article', 'tar');
    if (d.mes) a.setAttribute('data-mes', String(d.mes));
    if (d.foto){
      var f = crear('figure', 'tar-foto'), i = document.createElement('img');
      i.src = String(d.foto); i.alt = d.alt ? String(d.alt) : ''; i.width = 500; i.height = 400; i.loading = 'lazy'; i.decoding = 'async';
      f.appendChild(i); a.appendChild(f);
    } else {
      var m = crear('div', 'tar-marca'); m.setAttribute('aria-hidden', 'true'); m.appendChild(crear('span', 'tar-marca-nombre', String(d.nombre || ''))); a.appendChild(m);
    }
    var c = crear('div', 'tar-cuerpo');
    c.appendChild(crear('p', 'tar-tag', ''));
    c.appendChild(crear('h3', '', String(d.nombre || '')));
    if (d.texto) c.appendChild(crear('p', 'tar-texto', String(d.texto)));
    if (d.fuente) c.appendChild(crear('p', 'tar-fuente', String(d.fuente)));
    a.appendChild(c);
    return a;
  }

  /* La etiqueta honrada: se calcula sobre el orden ORIGINAL (la primera es la más reciente) */
  function etiquetar(pila){
    var et = {este:'Este mes', ultima:'La última que hemos anunciado', antes:'De antes'};
    try{ var x = JSON.parse(pila.getAttribute('data-pila-etiquetas') || '{}'); for (var k in x) et[k] = x[k]; }catch(e){}
    var hoy = mesHoy(pila.getAttribute('data-pila-zona') || 'Europe/Madrid');
    [].forEach.call(pila.children, function(t, i){
      var mes = t.getAttribute('data-mes') || '', txt;
      if (i === 0) txt = mes === hoy ? et.este : (mes > hoy ? 'Para ' + nombreMes(mes).toLowerCase() : et.ultima);
      else txt = mes > hoy ? 'Para ' + nombreMes(mes).toLowerCase() : (nombreMes(mes) || et.antes);
      var tag = t.querySelector('.tar-tag'); if (tag) tag.textContent = txt;
      if (i === 0){
        var est = document.getElementById(pila.getAttribute('data-pila-estado-en') || '') || (pila.closest('.pila-zona') || document).querySelector('[data-pila-estado]') || document.querySelector('[data-pila-estado]');
        var h = t.querySelector('h3');
        if (est && h) est.textContent = txt + ': ' + h.textContent;
      }
    });
  }

  function iniciar(pila){
    var zona = pila.closest('.pila-zona') || pila.parentNode;
    var cuenta = zona.querySelector('.pila-cuenta'), bAnt = zona.querySelector('.pila-ant'), bSig = zona.querySelector('.pila-sig');
    var total = pila.children.length, actual = 0, ocupado = false;
    etiquetar(pila);
    pila.classList.add('pila-lista');

    function marcar(){
      Array.prototype.forEach.call(pila.children, function(t, i){
        if (i === 0){ t.removeAttribute('aria-hidden'); t.inert = false; } else { t.setAttribute('aria-hidden', 'true'); t.inert = true; }
      });
      if (cuenta) cuenta.textContent = (actual + 1) + ' de ' + total;
    }
    function limpiar(t){ t.style.translate = ''; t.style.rotate = ''; t.style.opacity = ''; }

    /* Saca la de arriba hacia un lado (dir = 1 derecha, -1 izquierda) y la manda al fondo */
    function siguiente(dir){
      if (ocupado || total < 2) return; ocupado = true;
      var t = pila.firstElementChild;
      t.classList.remove('arrastrando', 'vuelve');
      if (reducido){ t.style.opacity = '0'; }
      else { t.style.translate = (dir * 130) + '% 0'; t.style.rotate = (dir * 14) + 'deg'; }
      setTimeout(function(){
        t.style.transition = 'none'; pila.appendChild(t); limpiar(t); t.offsetWidth; t.style.transition = '';
        actual = (actual + 1) % total; marcar(); ocupado = false;
      }, reducido ? 200 : 320);
    }
    /* Trae la del fondo arriba */
    function anterior(){
      if (ocupado || total < 2) return; ocupado = true;
      var t = pila.lastElementChild;
      t.style.transition = 'none';
      if (reducido) t.style.opacity = '0'; else { t.style.translate = '-130% 0'; t.style.rotate = '-14deg'; }
      pila.insertBefore(t, pila.firstElementChild); t.offsetWidth; t.style.transition = '';
      limpiar(t);
      actual = (actual - 1 + total) % total; marcar();
      setTimeout(function(){ ocupado = false; }, 320);
    }

    /* Arrastre */
    var x0 = 0, t0 = 0, dx = 0, activa = null;
    pila.addEventListener('pointerdown', function(e){
      var t = e.target.closest('.tar'); if (!t || t !== pila.firstElementChild || ocupado) return;
      activa = t; x0 = e.clientX; t0 = performance.now(); dx = 0;
      t.setPointerCapture(e.pointerId); t.classList.add('arrastrando'); t.classList.remove('vuelve');
    });
    pila.addEventListener('pointermove', function(e){
      if (!activa) return;
      dx = e.clientX - x0;
      activa.style.translate = dx + 'px 0';
      if (!reducido) activa.style.rotate = (dx / 22).toFixed(2) + 'deg';
    });
    function soltar(){
      if (!activa) return;
      var t = activa; activa = null; t.classList.remove('arrastrando');
      var v = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (Math.abs(dx) > t.offsetWidth / 3 || (v > 0.11 && Math.abs(dx) > 20)){ siguiente(dx > 0 ? 1 : -1); }
      else { t.classList.add('vuelve'); limpiar(t); }
    }
    pila.addEventListener('pointerup', soltar);
    pila.addEventListener('pointercancel', soltar);

    if (bSig) bSig.addEventListener('click', function(){ siguiente(1); });
    if (bAnt) bAnt.addEventListener('click', anterior);
    pila.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); siguiente(1); }
      if (e.key === 'ArrowLeft'){ e.preventDefault(); anterior(); }
    });
    marcar();
  }

  document.querySelectorAll('.pila').forEach(function(pila){
    var url = pila.getAttribute('data-pila-datos');
    if (!url || !window.fetch){ iniciar(pila); return; }
    fetch(url, {cache:'no-cache'}).then(function(r){ if (!r.ok) throw 0; return r.json(); }).then(function(j){
      var lista = j && Array.isArray(j.lista) ? j.lista.filter(function(d){ return d && d.nombre; }) : [];
      if (lista.length){
        var frag = document.createDocumentFragment();
        lista.forEach(function(d){ frag.appendChild(tarjeta(d)); });
        pila.textContent = ''; pila.appendChild(frag);
      }
    }).catch(function(){ /* sin JSON: se queda la pila del HTML */ }).then(function(){ iniciar(pila); });
  });
})();
