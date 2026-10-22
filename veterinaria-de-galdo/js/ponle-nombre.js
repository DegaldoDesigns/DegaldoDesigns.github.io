/* Ponle nombre (M68, componentes/ponle-nombre.html v2). Se carga en TODAS las páginas:
   - En cualquier página: lee el nombre guardado y cambia el texto de cada [data-nombre] ("Llamar por {nombre}").
   - En Inicio, además, monta la ficha de paciente ([data-ponle-nombre]).
   localStorage siempre dentro de try/catch (si el navegador lo bloquea, todo funciona igual sin recordarlo).
   Nunca innerHTML: el nombre se sanea y se escribe con textContent. */
(function(){
  'use strict';
  var CLAVE = 'degaldo-nombre';
  var raiz = document.documentElement;

  function sanea(s){ return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20).trim(); }
  function lee(){
    try { var d = JSON.parse(localStorage.getItem(CLAVE) || 'null');
      if (d) return { nombre: sanea(d.nombre), especie: (d.especie === 'perro' || d.especie === 'gato') ? d.especie : '' };
    } catch(_){}
    return { nombre: '', especie: '' };
  }
  function guarda(a){
    try { if (a.nombre || a.especie) localStorage.setItem(CLAVE, JSON.stringify(a)); else localStorage.removeItem(CLAVE); } catch(_){}
  }
  var destinos = document.querySelectorAll('[data-nombre]');
  Array.prototype.forEach.call(destinos, function(el){ if (el.dataset.pnDefecto === undefined) el.dataset.pnDefecto = el.textContent; });
  function aplica(a){
    var animal = a.especie || 'animal';
    Array.prototype.forEach.call(destinos, function(el){
      var t = a.nombre ? el.dataset.nombre.split('{nombre}').join(a.nombre).split('{animal}').join(animal) : el.dataset.pnDefecto;
      if (el.textContent !== t) el.textContent = t;
    });
    raiz.classList.toggle('con-nombre', !!a.nombre);
  }
  var actual = lee();
  aplica(actual);

  /* ---------- La ficha (solo en Inicio) ---------- */
  var sec = document.querySelector('[data-ponle-nombre]');
  if (!sec) return;
  var input = sec.querySelector('.pn-input'), radios = sec.querySelectorAll('input[name="especie"]');
  var fNombre = sec.querySelector('[data-ficha="nombre"]'), fEspecie = sec.querySelector('[data-ficha="especie"]'), fNota = sec.querySelector('[data-ficha="nota"]');
  var vacios = { nombre: fNombre.textContent, especie: fEspecie.textContent }, espera = null;

  function escribe(el, texto, vacio){
    if (el.textContent === (texto || vacio) && el.classList.contains('vacio') === !texto) return;
    el.classList.remove('escribe'); el.classList.add('cerrada');
    el.textContent = texto || vacio;
    el.classList.toggle('vacio', !texto);
    void el.offsetWidth;
    el.classList.remove('cerrada'); el.classList.add('escribe');
  }
  function pinta(){
    escribe(fNombre, actual.nombre, vacios.nombre);
    escribe(fEspecie, actual.especie ? (actual.especie === 'perro' ? 'Perro' : 'Gato') : '', vacios.especie);
    fNota.textContent = actual.nombre ? '¡Hola, ' + actual.nombre + '!' : '';
    aplica(actual);
  }
  function confirma(){ clearTimeout(espera); actual.nombre = sanea(input.value); pinta(); guarda(actual); }

  input.addEventListener('input', function(){ clearTimeout(espera); espera = setTimeout(confirma, 350); });
  sec.querySelector('form').addEventListener('submit', function(e){ e.preventDefault(); confirma(); });
  Array.prototype.forEach.call(radios, function(r){ r.addEventListener('change', function(){ actual.especie = r.value; actual.nombre = sanea(input.value); pinta(); guarda(actual); }); });
  sec.querySelector('[data-borrar]').addEventListener('click', function(){
    clearTimeout(espera); input.value = ''; Array.prototype.forEach.call(radios, function(r){ r.checked = false; });
    actual = { nombre: '', especie: '' }; pinta(); guarda(actual); input.focus();
  });
  if (actual.nombre || actual.especie){
    input.value = actual.nombre;
    Array.prototype.forEach.call(radios, function(r){ r.checked = r.value === actual.especie; });
    pinta();
  }
})();
