/* Pop-up de inscripcion al club de cumpleanos. Lo carga functions/_middleware.js en todas las paginas.
   Reglas: sale a los 15 s, al bajar la mitad de la pagina o (en computadora) al ir a salir; si lo cierran no vuelve en 30 dias;
   no sale a quien ya se inscribio en este navegador, ni en la pagina del club, sus terminos, privacidad, certificados ni opina.
   Para verlo sin esperar: agregar #ghp-preview a cualquier URL. */
window.__GH_CLUB_POPUP__ = {
 "id": "sm",
 "club": "Club Siete Mares",
 "clubPath": "/club-siete-mares",
 "terminos": "/terminos-y-condiciones-club-siete-mares/",
 "excluir": [
  "/terminos-y-condiciones-club-siete-mares",
  "/politica-de-privacidad",
  "/certificados",
  "/opina"
 ],
 "accion": "https://7e03564a.sibforms.com/serve/MUIFAGha56P974jWBj5q17lbzhLgpbJTV4SHxXMqzFxUT5SKPCWHW-VxW-29MYkKoN6DDVaHTdGzxCgbZqvgPx9Rl6bDuN4VXM94waif7cTHCQmsiNEhGAwxAz3lgqZE81nkhnIx82yP7ss9h9pW5lCiuASP5OnhlHmGJzypv4kS_XQ6rSg-R4EdymsQmbiLXOLS-jIEzKane3Hyyg==",
 "foto": "/assets/images/siete-mares-club-cumpleanos-card-600.webp",
 "fotoAlt": "Postre de cumpleaños con vela y copas de prosecco en una mesa de Siete Mares",
 "fonts": {
  "sans": "Barlow, Arial, sans-serif",
  "cond": "'Barlow Condensed', 'Arial Narrow', sans-serif",
  "titleFont": "500 32px/1.08 'Cormorant Garamond', Georgia, serif",
  "titleMobile": "26px",
  "capFont": "500 22px/1.15 'Cormorant Garamond', Georgia, serif"
 },
 "color": {
  "overlay": "rgba(8,42,74,.64)",
  "paper": "#fffdf8",
  "ink": "#202b33",
  "body": "#46515a",
  "title": "#082a4a",
  "accent": "#b9542f",
  "link": "#8f3f22",
  "line": "#c9c1b4",
  "soft": "#f3efe7",
  "dark": "#082a4a",
  "capBg": "rgba(8,42,74,.86)",
  "capInk": "#faf7f0",
  "capEyebrow": "#f3c2ad",
  "btn": "#082a4a",
  "btnInk": "#faf7f0"
 },
 "t": {
  "acepto": "Acepto los",
  "mayor": "Solo mayores de 18 años.",
  "ahoraNo": "Ahora no, gracias",
  "dia": "Día",
  "mes": "Mes",
  "anio": "Año",
  "enviando": "Enviando…",
  "seguir": "Seguir navegando",
  "graciasTexto": "Le acabamos de enviar un correo de bienvenida. Por ese medio manejaremos toda la comunicación del Club.",
  "graciasSpam": "Si no lo ve en su bandeja de entrada, revise la carpeta de correo no deseado y muévalo a su bandeja principal.",
  "eNombre": "Escriba su nombre.",
  "eApellido": "Escriba su apellido.",
  "eCorreo": "Revise su correo electrónico.",
  "eWhatsapp": "Revise su número de WhatsApp.",
  "eFecha": "Indique su fecha de nacimiento completa.",
  "eMenor": "El Club es solo para mayores de 18 años.",
  "eTerminos": "Para inscribirse debe aceptar los términos y condiciones.",
  "eGeneral": "No se pudo guardar su inscripción. Inténtelo nuevamente.",
  "eTelDup": "Este número de WhatsApp ya está inscrito en el Club con otro correo. Si ya es miembro, no necesita inscribirse de nuevo.",
  "eyebrow": "Club Siete Mares · Inscripción gratuita",
  "titulo": "Su cumpleaños no dura un día. Con nosotros dura todo el mes.",
  "beneficios": [
   "Postre de cumpleaños y una copa de prosecco para usted",
   "Una copa de prosecco para cada adulto de su mesa",
   "Si trae su propio pastel, el servicio va sin costo"
  ],
  "conocer": "Conozca todos los beneficios del Club",
  "capEyebrow": "Todo su mes de cumpleaños",
  "capText": "Escoja el día que quiera para celebrar.",
  "boton": "Inscribirme gratis",
  "graciasTitulo": "¡Bienvenido al Club Siete Mares!"
 }
};
/*MOTOR*/
(function () {
  'use strict';
  var C = window.__GH_CLUB_POPUP__;
  if (!C || window.__ghClubPopupLoaded) return;
  window.__ghClubPopupLoaded = true;

  var KEY = 'gh_club_popup_' + C.id;
  var PREVIEW = /ghp-preview/.test(location.hash);
  var DIAS_REPOSO = 30;
  var path = location.pathname.replace(/\/+$/, '') || '/';

  function leer() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function guardar(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }

  // En la landing del club no sale el pop-up. Si se inscribe ahi, se marca como miembro.
  var enClub = C.clubPath && (path === C.clubPath || path.indexOf(C.clubPath + '/') === 0);
  if (enClub && !PREVIEW) {
    try {
      var obs = new MutationObserver(function () {
        var ok = document.getElementById('success-message');
        if (ok && ok.offsetParent !== null && getComputedStyle(ok).display !== 'none') { guardar({ member: 1 }); obs.disconnect(); }
      });
      obs.observe(document.documentElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['style', 'class'] });
    } catch (e) {}
    return;
  }
  if (!PREVIEW) {
    for (var i = 0; i < C.excluir.length; i++) {
      var x = C.excluir[i];
      if (path === x || path.indexOf(x + '/') === 0) return;
    }
    var st = leer();
    if (st.member) return;
    if (st.closedAt && (Date.now() - st.closedAt) < DIAS_REPOSO * 864e5) return;
  }

  var t = C.t, k = C.color;
  var MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var CHECK = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
  var X = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l12 12M15 3L3 15"/></svg>';

  var css =
    '.ghp-ov{position:fixed;inset:0;z-index:2147483000;background:' + k.overlay + ';display:flex;align-items:center;justify-content:center;padding:16px;opacity:0;transition:opacity .25s}' +
    '.ghp-ov.on{opacity:1}' +
    '.ghp{position:relative;display:flex;width:820px;max-width:100%;max-height:calc(100vh - 32px);background:' + k.paper + ';color:' + k.ink + ';border-radius:6px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.35);font-family:' + C.fonts.sans + ';transform:translateY(12px);transition:transform .25s}' +
    '.ghp-ov.on .ghp{transform:none}' +
    '.ghp:focus{outline:none}' +
    '.ghp *{box-sizing:border-box}' +
    '.ghp-foto{width:300px;flex-shrink:0;position:relative;background:' + k.dark + '}' +
    '.ghp-foto img{width:100%;height:100%;object-fit:cover;display:block}' +
    '.ghp-cap{position:absolute;left:0;right:0;bottom:0;padding:20px 22px;background:' + k.capBg + ';color:' + k.capInk + '}' +
    '.ghp-cap b{display:block;font:500 13px ' + C.fonts.cond + ';letter-spacing:.16em;text-transform:uppercase;color:' + k.capEyebrow + '}' +
    '.ghp-cap span{display:block;margin-top:6px;font:' + C.fonts.capFont + '}' +
    '.ghp-body{flex:1;min-width:0;overflow-y:auto;padding:32px 36px 22px;display:flex;flex-direction:column;gap:14px}' +
    '.ghp-x{position:absolute;top:8px;right:8px;width:44px;height:44px;border:0;background:transparent;color:' + k.body + ';cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%;z-index:2}' +
    '.ghp-x:hover{background:rgba(0,0,0,.06)}' +
    '.ghp-eb{margin:0;padding-right:36px;font:500 13px ' + C.fonts.cond + ';letter-spacing:.16em;text-transform:uppercase;color:' + k.accent + '}' +
    '.ghp-h{margin:0;padding-right:28px;font:' + C.fonts.titleFont + ';color:' + k.title + ';text-wrap:balance}' +
    '.ghp-ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:15px;line-height:1.35;color:' + k.body + '}' +
    '.ghp-ul li{display:flex;gap:10px;align-items:flex-start}.ghp-ul svg{flex-shrink:0;margin-top:2px;color:' + k.accent + '}' +
    '.ghp-mas{align-self:flex-start;font:500 14px ' + C.fonts.sans + ';color:' + k.link + '}' +
    '.ghp-f{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;margin:0}' +
    '.ghp-c{display:flex;flex-direction:column;gap:5px;min-width:0}.ghp-full{grid-column:1/-1}' +
    '.ghp-c label{font:500 12px ' + C.fonts.sans + ';letter-spacing:.05em;text-transform:uppercase;color:' + k.body + '}' +
    '.ghp-i{width:100%;height:44px;border:1px solid ' + k.line + ';border-radius:4px;background:#fff;padding:0 12px;font:400 16px ' + C.fonts.sans + ';color:' + k.ink + ';-webkit-appearance:none;appearance:none}' +
    'select.ghp-i{padding-right:28px;background:#fff url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27%3E%3Cpath d=%27M1 1l5 5 5-5%27 fill=%27none%27 stroke=%27%23666%27 stroke-width=%271.6%27/%3E%3C/svg%3E") no-repeat right 10px center}' +
    '.ghp-i:focus{outline:2px solid ' + k.title + ';outline-offset:1px}' +
    '.ghp-i.err{border-color:#b3261e}' +
    '.ghp-fn{display:grid;grid-template-columns:76px 1fr 92px;gap:8px}' +
    '.ghp-tel{display:flex}.ghp-tel span{display:flex;align-items:center;padding:0 10px;border:1px solid ' + k.line + ';border-right:0;border-radius:4px 0 0 4px;background:' + k.soft + ';color:' + k.body + ';font-size:15px}' +
    '.ghp-tel .ghp-i{border-radius:0 4px 4px 0}' +
    '.ghp-ok{grid-column:1/-1;display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.4;color:' + k.body + ';cursor:pointer}' +
    '.ghp-ok input{width:20px;height:20px;margin:0;flex-shrink:0;accent-color:' + k.title + '}' +
    '.ghp-ok a{color:' + k.link + '}' +
    '.ghp-msg{grid-column:1/-1;margin:0;font-size:13px;color:#b3261e;min-height:0}' +
    '.ghp-btn{grid-column:1/-1;height:50px;border:0;border-radius:4px;background:' + k.btn + ';color:' + k.btnInk + ';font:500 15px ' + C.fonts.cond + ';letter-spacing:.14em;text-transform:uppercase;cursor:pointer}' +
    '.ghp-btn:hover{filter:brightness(1.1)}.ghp-btn[disabled]{opacity:.6;cursor:wait}' +
    '.ghp-no{align-self:center;border:0;background:none;font:14px ' + C.fonts.sans + ';color:' + k.body + ';text-decoration:underline;cursor:pointer;padding:6px}' +
    '.ghp-gr{display:none;flex:1;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:14px;padding:44px 40px}' +
    '.ghp.done .ghp-body{display:none}.ghp.done .ghp-gr{display:flex}' +
    '.ghp-gr i{width:56px;height:56px;border-radius:50%;border:2px solid ' + k.accent + ';color:' + k.accent + ';display:flex;align-items:center;justify-content:center}' +
    '.ghp-gr p{margin:0;max-width:420px;font-size:15px;line-height:1.5;color:' + k.body + '}' +
    '.ghp-gr .ghp-btn{width:auto;padding:0 32px}' +
    '@media (max-width:700px){' +
      '.ghp-ov{align-items:flex-end;padding:0}' +
      '.ghp{width:100%;max-height:92vh;border-radius:18px 18px 0 0;transform:translateY(40px)}' +
      '.ghp-foto{display:none}' +
      '.ghp-body{padding:22px 18px 16px;gap:12px}' +
      '.ghp-body:before{content:"";align-self:center;width:44px;height:4px;border-radius:2px;background:' + k.line + ';margin:-12px 0 2px}' +
      '.ghp-h{font-size:' + C.fonts.titleMobile + '}' +
      '.ghp-f{grid-template-columns:1fr 1fr}.ghp-c.ghp-m-full{grid-column:1/-1}' +
      '.ghp-ul{font-size:14px}' +
    '}' +
    '@media (prefers-reduced-motion:reduce){.ghp-ov,.ghp{transition:none}}';

  var dias = '<option value="">' + t.dia + '</option>';
  for (var d = 1; d <= 31; d++) dias += '<option value="' + (d < 10 ? '0' + d : d) + '">' + d + '</option>';
  var meses = '<option value="">' + t.mes + '</option>';
  for (var m = 0; m < 12; m++) meses += '<option value="' + (m < 9 ? '0' + (m + 1) : m + 1) + '">' + MESES[m] + '</option>';

  var html =
    '<div class="ghp" role="dialog" aria-modal="true" aria-labelledby="ghp-h">' +
      '<button type="button" class="ghp-x" aria-label="Cerrar">' + X + '</button>' +
      '<div class="ghp-foto"><img src="' + C.foto + '" alt="' + C.fotoAlt + '" loading="lazy"><div class="ghp-cap"><b>' + t.capEyebrow + '</b><span>' + t.capText + '</span></div></div>' +
      '<div class="ghp-body">' +
        '<p class="ghp-eb">' + t.eyebrow + '</p>' +
        '<h2 class="ghp-h" id="ghp-h">' + t.titulo + '</h2>' +
        '<ul class="ghp-ul">' + t.beneficios.map(function (b) { return '<li>' + CHECK + '<span>' + b + '</span></li>'; }).join('') + '</ul>' +
        '<a class="ghp-mas" href="' + C.clubPath + '/">' + t.conocer + ' &rarr;</a>' +
        '<form class="ghp-f" novalidate>' +
          '<div class="ghp-c"><label for="ghp-n">Nombre</label><input class="ghp-i" id="ghp-n" name="FIRSTNAME" autocomplete="given-name" maxlength="200"></div>' +
          '<div class="ghp-c"><label for="ghp-a">Apellido</label><input class="ghp-i" id="ghp-a" name="LASTNAME" autocomplete="family-name" maxlength="200"></div>' +
          '<div class="ghp-c ghp-m-full"><label for="ghp-e">Correo electrónico</label><input class="ghp-i" id="ghp-e" name="EMAIL" type="email" autocomplete="email" inputmode="email" placeholder="nombre@correo.com"></div>' +
          '<div class="ghp-c ghp-m-full"><label for="ghp-w">WhatsApp</label><div class="ghp-tel"><span>+507</span><input class="ghp-i" id="ghp-w" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="6000-0000"></div></div>' +
          '<div class="ghp-c ghp-full"><label for="ghp-d">Fecha de nacimiento</label><div class="ghp-fn">' +
            '<select class="ghp-i" id="ghp-d" aria-label="Día">' + dias + '</select>' +
            '<select class="ghp-i" id="ghp-m" aria-label="Mes">' + meses + '</select>' +
            '<input class="ghp-i" id="ghp-y" inputmode="numeric" maxlength="4" placeholder="' + t.anio + '" aria-label="Año"></div></div>' +
          '<label class="ghp-ok"><input type="checkbox" id="ghp-t"><span>' + t.acepto + ' <a href="' + C.terminos + '" target="_blank" rel="noopener">términos y condiciones</a>. ' + t.mayor + '</span></label>' +
          '<p class="ghp-msg" role="alert"></p>' +
          '<button type="submit" class="ghp-btn">' + t.boton + '</button>' +
        '</form>' +
        '<button type="button" class="ghp-no">' + t.ahoraNo + '</button>' +
      '</div>' +
      '<div class="ghp-gr"><i>' + CHECK.replace('width="16" height="16"', 'width="24" height="24"') + '</i>' +
        '<h2 class="ghp-h" style="padding:0">' + t.graciasTitulo + '</h2>' +
        '<p>' + t.graciasTexto + '</p><p style="font-size:13px">' + t.graciasSpam + '</p>' +
        '<button type="button" class="ghp-btn ghp-cerrar">' + t.seguir + '</button></div>' +
    '</div>';

  var ov, prevFocus, abierto = false, mostrado = false;

  function cerrar(miembro) {
    if (!ov) return;
    if (!PREVIEW) guardar(miembro ? { member: 1 } : { closedAt: Date.now() });
    ov.classList.remove('on');
    document.removeEventListener('keydown', onKey, true);
    setTimeout(function () { if (ov && ov.parentNode) ov.parentNode.removeChild(ov); ov = null; }, 260);
    document.documentElement.style.overflow = '';
    abierto = false;
    if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) {}
  }

  function onKey(e) {
    if (!abierto) return;
    if (e.key === 'Escape') { cerrar(ov.querySelector('.ghp').classList.contains('done')); return; }
    if (e.key === 'Tab') {
      var f = [].slice.call(ov.querySelectorAll('a[href],button,input,select')).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  }

  function mostrar() {
    if (mostrado) return;
    var s = leer();
    if (!PREVIEW && (s.member || (s.closedAt && (Date.now() - s.closedAt) < DIAS_REPOSO * 864e5))) return;
    mostrado = true;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    ov = document.createElement('div'); ov.className = 'ghp-ov'; ov.innerHTML = html;
    document.body.appendChild(ov);
    prevFocus = document.activeElement;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { ov.classList.add('on'); });
    abierto = true;
    document.addEventListener('keydown', onKey, true);
    var box = ov.querySelector('.ghp');
    box.setAttribute('tabindex', '-1'); box.focus({ preventScroll: true });
    ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(box.classList.contains('done')); });
    ov.querySelector('.ghp-x').addEventListener('click', function () { cerrar(box.classList.contains('done')); });
    ov.querySelector('.ghp-no').addEventListener('click', function () { cerrar(false); });
    ov.querySelector('.ghp-cerrar').addEventListener('click', function () { cerrar(true); });
    ov.querySelector('.ghp-f').addEventListener('submit', enviar);
    evento('view');
  }

  function evento(tipo) {
    try {
      if (tipo === 'lead') {
        if (typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_name: C.club, content_category: 'popup' });
        if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { form_name: 'popup ' + C.club });
      } else if (typeof window.gtag === 'function') {
        window.gtag('event', 'club_popup_' + tipo, { club: C.club });
      }
    } catch (e) {}
  }

  var CODIGOS = ['507', '1', '506', '503', '502', '504', '505', '57', '58', '593', '51', '52', '53', '54', '55', '56', '34', '39', '33', '44', '49'];

  function enviar(e) {
    e.preventDefault();
    var f = e.target, q = function (id) { return ov.querySelector('#' + id); };
    var msg = ov.querySelector('.ghp-msg'), btn = ov.querySelector('.ghp-btn');
    [].forEach.call(f.querySelectorAll('.err'), function (n) { n.classList.remove('err'); });
    var errores = [];
    function mal(id, txt) { q(id).classList.add('err'); errores.push(txt); }

    var n = q('ghp-n').value.trim(), a = q('ghp-a').value.trim(), em = q('ghp-e').value.trim();
    if (!n) mal('ghp-n', t.eNombre);
    if (!a) mal('ghp-a', t.eApellido);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) mal('ghp-e', t.eCorreo);

    var raw = q('ghp-w').value.trim(), dig = raw.replace(/\D/g, ''), cc = '+507';
    if (/^(\+|00)/.test(raw)) {
      dig = dig.replace(/^00/, '');
      for (var i = 0; i < CODIGOS.length; i++) if (dig.indexOf(CODIGOS[i]) === 0 && dig.length - CODIGOS[i].length >= 6) { cc = '+' + CODIGOS[i]; dig = dig.slice(CODIGOS[i].length); break; }
    } else if (dig.indexOf('507') === 0 && dig.length === 11) { dig = dig.slice(3); }
    if (dig.length < 7 || dig.length > 12) mal('ghp-w', t.eWhatsapp);

    var dd = q('ghp-d').value, mm = q('ghp-m').value, yy = q('ghp-y').value.trim();
    var fechaOk = dd && mm && /^\d{4}$/.test(yy);
    if (fechaOk) {
      var fe = new Date(+yy, +mm - 1, +dd);
      if (fe.getDate() !== +dd || +yy < 1900) fechaOk = false;
      else {
        var hoy = new Date(), edad = hoy.getFullYear() - +yy;
        if (hoy.getMonth() + 1 < +mm || (hoy.getMonth() + 1 === +mm && hoy.getDate() < +dd)) edad--;
        if (edad < 18) { mal('ghp-y', t.eMenor); fechaOk = null; }
      }
    }
    if (fechaOk === false || (!dd || !mm || !yy)) { ['ghp-d', 'ghp-m', 'ghp-y'].forEach(function (id) { q(id).classList.add('err'); }); errores.push(t.eFecha); }
    if (!q('ghp-t').checked) errores.push(t.eTerminos);

    if (errores.length) { msg.textContent = errores[0]; var p = f.querySelector('.err'); if (p) p.focus(); return; }

    msg.textContent = '';
    btn.disabled = true; btn.textContent = t.enviando;
    var fd = new FormData();
    fd.append('FIRSTNAME', n); fd.append('LASTNAME', a); fd.append('EMAIL', em);
    fd.append('SMS__COUNTRY_CODE', cc); fd.append('SMS', dig);
    fd.append('BIRTHDAY', dd + '-' + mm + '-' + yy);
    fd.append('ACEPTA_TERMINOS_CLUB', '1'); fd.append('email_address_check', ''); fd.append('locale', 'es');

    fetch(C.accion + (C.accion.indexOf('?') < 0 ? '?' : '&') + 'isAjax=1', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.success) {
          guardar({ member: 1 });
          ov.querySelector('.ghp').classList.add('done');
          ov.querySelector('.ghp-cerrar').focus();
          evento('lead');
        } else {
          var m2 = t.eGeneral, er = (j && j.errors) || {};
          if (er.SMS) { m2 = /vinculad|existe|exist/i.test(er.SMS) ? t.eTelDup : t.eWhatsapp; q('ghp-w').classList.add('err'); }
          else if (er.EMAIL) { m2 = t.eCorreo; q('ghp-e').classList.add('err'); }
          else if (er.BIRTHDAY) { m2 = t.eFecha; }
          throw { mensaje: m2 };
        }
      })
      .catch(function (err) {
        msg.textContent = (err && err.mensaje) || t.eGeneral;
        btn.disabled = false; btn.textContent = t.boton;
      });
  }

  // Cuando aparece: a los 15 s, al bajar la mitad de la pagina, o (en computadora) al ir a salir.
  function armar() {
    if (PREVIEW) { setTimeout(mostrar, 300); return; }
    var timer = setTimeout(mostrar, 15000);
    function scroll() {
      var h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0 && scrollY / h >= 0.5) { window.removeEventListener('scroll', scroll); clearTimeout(timer); mostrar(); }
    }
    window.addEventListener('scroll', scroll, { passive: true });
    if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setTimeout(function () {
        document.addEventListener('mouseout', function sal(e) {
          if (!e.relatedTarget && e.clientY <= 0) { document.removeEventListener('mouseout', sal); clearTimeout(timer); mostrar(); }
        });
      }, 4000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', armar); else armar();
})();
