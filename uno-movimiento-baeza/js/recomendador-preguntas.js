/* recomendador-preguntas (M115) v1.3, copia de la librería (Clínica César Navarro / UNO movimiento, 2026-10-27). */
/* recomendador-preguntas (M115): construye las preguntas desde el JSON; sin JS o si el JSON falla, se queda .rp-sinjs */
(function(){
  var DEF = {pregunta:'Pregunta {n} de {t}', atras:'Atrás', recomendacion:'Te recomendamos', mensajeEt:'Se enviará este mensaje:',
             enviar:'Enviar por WhatsApp', reiniciar:'Volver a empezar', sinDato:'Te lo decimos por WhatsApp',
             llamarEt:'Llama al {telefono} y di:', llamar:'Llamar al {telefono}', copiar:'Copiar la frase', copiado:'Frase copiada',
             enviarSec:'Enviar por WhatsApp'};
  var ICO_TEL = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.6 10.8a15.2 15.2 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>';
  var ICO_COPIA = '<span class="rp-ico" aria-hidden="true"><svg class="rp-ico-copia" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg><svg class="rp-ico-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg></span>';
  /* v1.3: copiar con la técnica de copiar-portapapeles (Clipboard API en contexto seguro; si no, execCommand con un textarea) */
  function copiarTexto(t){
    function viejo(){ try { var a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); var ok = document.execCommand('copy'); a.remove(); return ok; } catch (e){ return false; } }
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t).then(function(){ return true; }, viejo);
    return Promise.resolve(viejo());
  }
  var ICO_ATRAS = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICO_WA = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/></svg>';
  var reducido = matchMedia('(prefers-reduced-motion: reduce)');

  function crear(tag, cls, txt){ var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function copia(o){ return JSON.parse(JSON.stringify(o || {})); }
  function rellenar(plantilla, ctx){
    return String(plantilla || '').replace(/\{(\w+)\}/g, function(_, k){ return ctx[k] != null ? ctx[k] : ''; }).replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
  }

  document.querySelectorAll('[data-rp]').forEach(function(rp){
    var datos;
    try { datos = JSON.parse(rp.querySelector('.rp-datos').textContent); } catch (e){ return; }
    if (!datos || !datos.preguntas || !datos.preguntas[datos.inicio]) return;
    var T = Object.assign({}, DEF, datos.textos || {});
    /* v1.3: canal llamada; WhatsApp solo con número (atributo data-rp-whatsapp si existe; si no, el del JSON) */
    var llamada = rp.getAttribute('data-rp-canal') === 'llamada';
    var numWa = String(rp.hasAttribute('data-rp-whatsapp') ? rp.getAttribute('data-rp-whatsapp') : (datos.whatsapp || '')).replace(/\D/g, '');
    var pie = rp.querySelector('[data-rp-pie]');
    var uid = 'rp' + Math.random().toString(36).slice(2, 7);

    /* Profundidad máxima que queda desde una pregunta (para "Pregunta n de t") */
    var memo = {};
    function prof(id, visto){
      if (memo[id] != null) return memo[id];
      visto = visto || {}; if (visto[id]) return 1; visto[id] = true;
      var q = datos.preguntas[id], m = 0;
      (q.opciones || []).forEach(function(o){ if (o.sigue && datos.preguntas[o.sigue]) m = Math.max(m, prof(o.sigue, visto)); });
      return (memo[id] = 1 + m);
    }

    /* Montaje */
    var form = crear('form', 'rp-form'); form.setAttribute('novalidate', ''); form.addEventListener('submit', function(e){ e.preventDefault(); });
    if (rp.getAttribute('aria-label')) form.setAttribute('aria-label', rp.getAttribute('aria-label'));
    var pila = crear('div', 'rp-pila'); form.appendChild(pila);
    var pasos = {};
    Object.keys(datos.preguntas).forEach(function(id){
      var q = datos.preguntas[id];
      var fs = crear('fieldset', 'rp-paso'); fs.dataset.paso = id;
      var lg = crear('legend'); var h = crear('h3', 'rp-titulo'); h.tabIndex = -1; h.id = uid + '-' + id;
      var num = crear('span', 'rp-num'); h.appendChild(num); h.appendChild(document.createTextNode(' ' + q.titulo));
      lg.appendChild(h); fs.appendChild(lg);
      var ul = crear('ul', 'rp-opciones'); ul.setAttribute('role', 'list');
      (q.opciones || []).forEach(function(o, i){
        var li = crear('li');
        if (o.ir){ var en = crear('a', 'rp-op', o.texto); en.href = o.ir; li.appendChild(en); ul.appendChild(li); return; }   /* v1.3: enlace a una sección */
        var b = crear('button', 'rp-op', o.texto); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.dataset.i = i;
        b.addEventListener('click', function(){ elegir(id, i); });
        li.appendChild(b); ul.appendChild(li);
      });
      fs.appendChild(ul); pila.appendChild(fs);
      pasos[id] = {el:fs, titulo:h, num:num, botones:ul.querySelectorAll('button.rp-op')};
    });
    var res = crear('div', 'rp-resultado'); pila.appendChild(res);
    var nav = crear('div', 'rp-nav');
    var atras = crear('button', 'rp-btn'); atras.type = 'button'; atras.innerHTML = ICO_ATRAS; atras.appendChild(document.createTextNode(T.atras)); atras.hidden = true;
    atras.addEventListener('click', volver); nav.appendChild(atras); form.appendChild(nav);
    var vivo = crear('p', 'rp-oculto'); vivo.setAttribute('aria-live', 'polite'); form.appendChild(vivo);
    var lado = rp.querySelector('.rp-lado');
    rp.insertBefore(form, lado ? lado : rp.firstChild);
    rp.classList.add('rp-listo');

    /* Estado */
    var hist = [], vars = {}, elegidas = {}, actual = null;

    function luz(fig){
      rp.querySelectorAll('[data-rp-luz]').forEach(function(n){ n.classList.toggle('rp-on', fig != null && n.getAttribute('data-rp-luz') === String(fig)); });
    }
    function avisar(paso, fig){
      luz(fig);
      rp.dispatchEvent(new CustomEvent('rp:cambio', {detail:{paso:paso, figura:fig == null ? -1 : fig, respuestas:copia(vars)}}));
    }
    function marcar(id){
      var enHist = {}; hist.forEach(function(h){ enHist[h.q] = true; });
      Object.keys(pasos).forEach(function(k){
        var p = pasos[k]; p.el.classList.toggle('rp-activo', k === id); p.el.classList.toggle('rp-antes', !!enHist[k] && k !== id);
      });
      res.classList.toggle('rp-activo', id === 'resultado');
      rp.setAttribute('data-rp-fase', id === 'resultado' ? 'resultado' : 'pregunta');
      atras.hidden = hist.length === 0;
    }
    function enfocar(n, conFoco){
      if (!conFoco) return;
      n.focus({preventScroll:true});
      var r = n.getBoundingClientRect();
      if (r.top < 0 || r.top > innerHeight - 80) n.scrollIntoView({block:'center', behavior: reducido.matches ? 'auto' : 'smooth'});
    }
    function ir(id, conFoco){
      actual = id;
      var p = pasos[id];
      p.num.textContent = rellenar(T.pregunta, {n: hist.length + 1, t: hist.length + prof(id)});
      p.botones.forEach(function(b){ b.setAttribute('aria-pressed', String(elegidas[id] === +b.dataset.i)); });
      marcar(id);
      vivo.textContent = '';
      enfocar(p.titulo, conFoco);
      avisar(id, vars.figura);
    }
    function elegir(id, i){
      var o = datos.preguntas[id].opciones[i];
      hist.push({q:id, vars:copia(vars)});
      elegidas[id] = i;
      Object.assign(vars, o.guarda || {});
      if (o.sigue && datos.preguntas[o.sigue]) ir(o.sigue, true); else fin(true);
    }
    function volver(){
      var h = hist.pop(); if (!h) return;
      vars = h.vars; ir(h.q, true);
    }
    function reiniciar(){ hist = []; vars = {}; elegidas = {}; ir(datos.inicio, true); }

    function fin(conFoco){
      var id = vars.resultado, base = datos.resultados && datos.resultados[id];
      if (!base) return;
      var r = copia(base);
      rp.dispatchEvent(new CustomEvent('rp:resultado', {detail:{id:id, resultado:r, respuestas:copia(vars)}}));
      var ctx = Object.assign({}, vars, {titulo:r.titulo});
      /* v1.2: un dato con "porFranja" (una hora de clase) se calla si ninguna de sus horas cae en la franja elegida
         (variable "franja": "manana" antes de datos.corteFranja, 14:00 por defecto, o "tarde"): nunca "16:00" a quien pidió mañana */
      if (vars.franja === 'manana' || vars.franja === 'tarde'){
        var corte = (function(c){ var m = /(\d{1,2})[:.](\d{2})/.exec(c || '14:00'); return m ? +m[1] * 60 + +m[2] : 840; })(datos.corteFranja);
        (r.datos || []).forEach(function(d){
          if (!d.porFranja) return;
          var hs = (rellenar(d.val, ctx).match(/\d{1,2}[:.]\d{2}/g) || []).map(function(h){ var p = h.split(/[:.]/); return +p[0] * 60 + +p[1]; });
          if (hs.length && !hs.some(function(h){ return (h < corte) === (vars.franja === 'manana'); })){ d.val = ''; if (d.vacioFranja) d.vacio = d.vacioFranja; }
        });
      }
      res.textContent = '';
      var h = crear('h3', 'rp-titulo'); h.tabIndex = -1;
      h.appendChild(crear('span', 'rp-res-kicker', T.recomendacion)); h.appendChild(document.createTextNode(' ' + rellenar(r.titulo, ctx)));
      res.appendChild(h);
      if (r.texto) res.appendChild(crear('p', 'rp-res-texto', rellenar(r.texto, ctx)));
      if (r.datos && r.datos.length){
        var dl = crear('dl', 'rp-res-datos');
        r.datos.forEach(function(d){
          var v = rellenar(d.val, ctx);
          dl.appendChild(crear('dt', '', d.et));
          var dd = crear('dd', v ? '' : 'rp-vacio', v || d.vacio || T.sinDato); dl.appendChild(dd);
        });
        res.appendChild(dl);
      }
      var msg = rellenar(r.mensaje || datos.mensaje, ctx);
      var acc = crear('div', 'rp-acciones');
      if (llamada){
        /* v1.3: «Llama al … y di:» + la frase + Llamar (tel:) + Copiar; WhatsApp solo si hay número */
        var tt = {telefono: datos.telefonoTexto || datos.telefono || ''};
        var et = crear('p', 'rp-msg-et'), partes = T.llamarEt.split('{telefono}');
        et.appendChild(document.createTextNode(partes[0]));
        if (partes.length > 1){ et.appendChild(crear('strong', '', tt.telefono)); et.appendChild(document.createTextNode(partes.slice(1).join(''))); }
        res.appendChild(et);
        res.appendChild(crear('blockquote', 'rp-msg rp-frase', msg));
        var tel = crear('a', 'rp-wa rp-tel'); tel.href = 'tel:' + String(datos.telefono || '').replace(/[^\d+]/g, '');
        tel.innerHTML = ICO_TEL; tel.appendChild(document.createTextNode(rellenar(T.llamar, tt))); acc.appendChild(tel);
        var cp = crear('button', 'rp-btn rp-copiar'); cp.type = 'button'; cp.innerHTML = ICO_COPIA; var cpt = crear('span', '', T.copiar); cp.appendChild(cpt); acc.appendChild(cp);
        var temp = null;
        cp.addEventListener('click', function(){
          copiarTexto(msg).then(function(ok){
            clearTimeout(temp);
            if (ok){ cp.classList.add('rp-copiado'); cpt.textContent = T.copiado; vivo.textContent = T.copiado;
              temp = setTimeout(function(){ cp.classList.remove('rp-copiado'); cpt.textContent = T.copiar; }, 1800); }
            else vivo.textContent = 'No se pudo copiar. Cópiala a mano: ' + msg;
          });
        });
        if (numWa){ var ws = crear('a', 'rp-wa rp-sec'); ws.href = 'https://wa.me/' + numWa + '?text=' + encodeURIComponent(msg);
          ws.target = '_blank'; ws.rel = 'noopener'; ws.innerHTML = ICO_WA; ws.appendChild(document.createTextNode(T.enviarSec)); acc.appendChild(ws); }
      } else {
        res.appendChild(crear('p', 'rp-msg-et', T.mensajeEt));
        res.appendChild(crear('blockquote', 'rp-msg', '«' + msg + '»'));
        var wa = crear('a', 'rp-wa'); wa.href = 'https://wa.me/' + String(datos.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
        wa.target = '_blank'; wa.rel = 'noopener'; wa.innerHTML = ICO_WA; wa.appendChild(document.createTextNode(T.enviar)); acc.appendChild(wa);
      }
      var otra = crear('button', 'rp-btn', T.reiniciar); otra.type = 'button'; otra.addEventListener('click', reiniciar); acc.appendChild(otra);
      res.appendChild(acc);
      if (r.enlace && r.enlace.href){ var en = crear('p'); var a = crear('a', 'rp-enlace', r.enlace.texto); a.href = r.enlace.href; en.appendChild(a); res.appendChild(en); }
      if (pie) res.appendChild(pie);   /* v1.3: el estado de ahora (u otro pie propio) al pie del resultado */
      actual = 'resultado';
      marcar('resultado');
      vivo.textContent = T.recomendacion + ': ' + rellenar(r.titulo, ctx);
      enfocar(h, conFoco);
      avisar('resultado', r.figura != null ? r.figura : vars.figura);
    }

    ir(datos.inicio, false);
  });
})();
