/* La Esquina · COPIA LITERAL del script de 01-Libreria-de-Codigo/componentes/lista-foto-hover.html (v1.2.1): la foto que sigue al cursor en la carta (M32). No editar aquí. */
/* lista-foto-hover · v1.2 */
(function(){
  var raton = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-lista-foto]').forEach(function(lista){
    var filas = lista.querySelectorAll(lista.getAttribute('data-fila') || '.fila'), sinMarca = lista.hasAttribute('data-sin-marca'),
        arriba = lista.getAttribute('data-flota') === 'arriba';

    /* Táctil: miniatura en cada fila con foto (y de marca con la inicial en las demás, salvo data-sin-marca) */
    if (!raton){
      filas.forEach(function(f){
        var m;
        if (f.dataset.foto){ m = document.createElement('img'); m.src = f.dataset.fotoMini || f.dataset.foto; m.alt = ''; m.loading = 'lazy'; m.width = 64; m.height = 64; }
        else if (sinMarca) return;
        else { m = document.createElement('span'); m.className = 'marca'; m.setAttribute('aria-hidden', 'true');
          m.textContent = (f.querySelector('h3, .clf-nombre') || f).textContent.trim().charAt(0); }
        m.classList.add('mini'); f.classList.add('con-mini'); f.insertBefore(m, f.firstChild);
      });
      return;
    }

    /* Ratón: una sola figura flotante para toda la lista */
    var fig = document.createElement('figure'); fig.className = 'flota'; fig.setAttribute('aria-hidden', 'true');
    var img = document.createElement('img'); img.alt = ''; fig.appendChild(img); document.body.appendChild(fig);
    var W = 240, H = 300, x = 0, y = 0, tx = 0, ty = 0, rot = 0, raf = null, visible = false;

    function medir(){ W = fig.offsetWidth || W; H = fig.offsetHeight || H; }
    function limitar(){ tx = Math.max(12, Math.min(innerWidth - W - 12, tx)); ty = Math.max(12, Math.min(innerHeight - H - 12, ty)); }
    function bucle(){
      var dx = tx - x; x += dx * .18; y += (ty - y) * .18;
      rot += (Math.max(-6, Math.min(6, dx * .08)) - rot) * .2;
      fig.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      fig.style.rotate = rot.toFixed(2) + 'deg';
      if (Math.abs(tx - x) < .3 && Math.abs(ty - y) < .3 && Math.abs(rot) < .05 && !visible){ raf = null; return; }
      raf = requestAnimationFrame(bucle);
    }
    /* v1.2: arriba, salvo que la foto suba por encima del principio de la lista de la fila (taparía el título del apartado): entonces, al lado */
    function sitio(e, f){ var top = f && f.parentNode ? f.parentNode.getBoundingClientRect().top : -1e9;
      if (arriba && e.clientY - H - 22 >= top - 8){ tx = e.clientX - W / 2; ty = e.clientY - H - 22; }
      else { tx = e.clientX + 28; ty = arriba ? Math.max(e.clientY - H / 2, top - 8) : e.clientY - H / 2; } limitar(); }
    function mover(e, f){
      sitio(e, f);
      if (reducido){ x = tx; y = ty; fig.style.translate = x + 'px ' + y + 'px'; return; }
      if (!raf) raf = requestAnimationFrame(bucle);
    }
    filas.forEach(function(f){
      f.addEventListener('pointerenter', function(e){
        if (e.pointerType !== 'mouse') return;
        if (!f.dataset.foto){ fig.classList.remove('ve'); visible = false; return; }
        medir();
        if (!visible){ sitio(e, f); x = tx; y = ty + 16; }
        img.src = f.dataset.foto; visible = true; fig.classList.add('ve'); mover(e, f);
      });
      f.addEventListener('pointermove', function(e){ if (e.pointerType === 'mouse' && f.dataset.foto) mover(e, f); });
    });
    lista.addEventListener('pointerleave', function(){ visible = false; fig.classList.remove('ve'); });
    addEventListener('scroll', function(){ if (visible){ visible = false; fig.classList.remove('ve'); } }, {passive:true});
  });
})();
