/* ponle-nombre (M68) v3, solo la tarjeta regalo (.pn-regalo con data-pn-sin-guardar), copia de la librería (Clínica César Navarro / UNO movimiento, 2026-10-27). */
/* v3: .pn-regalo con data-pn-sin-guardar. El nombre NO se guarda: vive solo en esta página mientras está abierta. */
(function(){
  'use strict';
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches, raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  function copiar(t){
    function viejo(){ try { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); var ok = document.execCommand('copy'); a.remove(); return ok; } catch (e){ return false; } }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(function(){ return true; }, viejo);
    return Promise.resolve(viejo());
  }
  document.querySelectorAll('[data-ponle-nombre][data-pn-sin-guardar]').forEach(function(sec){
    var max = parseInt(sec.getAttribute('data-pn-max'), 10) || 24;
    function sanea(s){ return String(s || '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max).trim(); }
    var input = sec.querySelector('.pn-input'), mano = sec.querySelector('[data-ficha="nombre"]'), aviso = sec.querySelector('[data-pn-aviso]');
    var destinos = sec.querySelectorAll('[data-nombre]'), copias = sec.querySelectorAll('[data-pn-copiar]');
    destinos.forEach(function(el){ el.dataset.pnDefecto = el.textContent; });
    var vacio = mano ? mano.textContent : '', nombre = '', espera = null, espMs = parseInt(sec.getAttribute('data-pn-espera'), 10) || 300;
    function poner(n){
      if (n === nombre) return; nombre = n;
      destinos.forEach(function(el){ var t = n ? el.dataset.nombre.split('{nombre}').join(n) : el.dataset.pnDefecto; if (el.textContent !== t) el.textContent = t; });
      if (mano){
        mano.classList.remove('escribe'); mano.classList.add('cerrada');
        mano.textContent = n || vacio; mano.classList.toggle('vacio', !n);
        /* nombres largos: la línea encoge (hasta 24 caracteres caben a 375 px) */
        mano.parentNode.style.setProperty('--pn-escala', Math.min(1, 15 / Math.max(1, (n || vacio).length + 5)).toFixed(3));
        void mano.offsetWidth; mano.classList.remove('cerrada'); mano.classList.add('escribe');
      }
      if (aviso) aviso.textContent = n ? 'Tarjeta para ' + n : '';
    }
    if (input){
      input.addEventListener('input', function(){ clearTimeout(espera); espera = setTimeout(function(){ poner(sanea(input.value)); }, espMs); });
      input.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); clearTimeout(espera); poner(sanea(input.value)); } });
    }
    copias.forEach(function(b){
      var txt = b.textContent, temp = null;
      b.addEventListener('click', function(){
        var t = nombre ? b.dataset.pnCopiar.split('{nombre}').join(nombre) : (b.dataset.pnCopiarDefecto || b.dataset.pnCopiar.replace(/\s*\{nombre\}/g, ''));
        copiar(t).then(function(ok){
          clearTimeout(temp);
          if (aviso) aviso.textContent = ok ? 'Frase copiada' : 'No se pudo copiar. Cópiala a mano: ' + t;
          if (ok){ b.textContent = 'Frase copiada'; temp = setTimeout(function(){ b.textContent = txt; }, 1800); }
        });
      });
    });
    /* Inclinación hacia el cursor (máx. 5°), solo ratón (M31) */
    var tj = sec.querySelector('.pn-tarjeta');
    if (!tj || !raton || reducido) return;
    var pend = null;
    tj.addEventListener('pointermove', function(e){
      if (e.pointerType !== 'mouse' || pend) return;
      pend = requestAnimationFrame(function(){ pend = null;
        var r = tj.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        tj.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg'); tj.style.setProperty('--rx', (y * -10).toFixed(2) + 'deg'); });
    });
    tj.addEventListener('pointerleave', function(){ tj.style.setProperty('--rx', '0deg'); tj.style.setProperty('--ry', '0deg'); });
  });
})();
