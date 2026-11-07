// 1) Evita que Google indexe el subdominio gratuito de Cloudflare Pages (*.pages.dev),
//    que sirve el mismo contenido que el dominio real y puede generar contenido duplicado.
//    El dominio real (restaurantesietemares.com) nunca recibe este header.
// 2) Inyecta el pixel de Meta en el <head> de todas las paginas HTML, en un solo lugar.
//    Carga diferida (despues del evento load) para no afectar el rendimiento del sitio.
// 3) En la landing del Club Siete Mares, dispara el evento Lead cuando Brevo muestra
//    su mensaje de exito (el formulario no redirige a una pagina de gracias).

const META_PIXEL_ID = '1388992496383105';

const PIXEL_HEAD = `<script>!function(f,b,e,v,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document);fbq('init','${META_PIXEL_ID}');fbq('track','PageView');window.addEventListener('load',function(){var s=document.createElement('script');s.async=!0;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s)})</script>`;

const PIXEL_NOSCRIPT = `<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"></noscript>`;

// Observa el panel de exito de Brevo y manda el evento Lead una sola vez.
const LEAD_SCRIPT = `<script>(function(){var fired=false;function visible(el){if(!el)return false;var cs=window.getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&el.offsetParent!==null}function check(){if(fired)return;if(!visible(document.getElementById('success-message')))return;fired=true;if(typeof window.fbq==='function'){fbq('track','Lead',{content_name:'Club Siete Mares'})}}try{new MutationObserver(check).observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['style','class']});document.addEventListener('submit',function(){setTimeout(check,1500);setTimeout(check,4000)},true);check()}catch(e){}})()</script>`;

// Pop-up de inscripcion al Club (reglas en /assets/club-popup.v1.js). Se carga diferido en todas las paginas.
const POPUP_SCRIPT = '<script src="/assets/club-popup.v1.js" defer></script>';

class InjectHead {
  element(element) {
    element.append(PIXEL_HEAD, { html: true });
  }
}

class InjectBody {
  constructor(isClub) {
    this.isClub = isClub;
  }
  element(element) {
    element.prepend(PIXEL_NOSCRIPT, { html: true });
    element.append(POPUP_SCRIPT, { html: true });
    if (this.isClub) element.append(LEAD_SCRIPT, { html: true });
  }
}

// Enlace discreto a la bolsa de trabajo del grupo, al final del pie de pagina de todas las paginas.
const JOBS_LINK = '<div class="gh-jobs" style="text-align:center;font-size:.82rem;opacity:.8;padding:14px 16px 6px"><a href="https://empleos.grupoherrero.com/" style="color:inherit;text-decoration:underline">¿Desea formar parte de nuestro equipo? Trabaje con nosotros</a></div>';

class InjectJobs {
  element(element) {
    element.append(JOBS_LINK, { html: true });
  }
}

async function ghBaseOnRequest(context) {
  const response = await context.next();

  try {
    const url = new URL(context.request.url);
    const isPagesDev = url.hostname.endsWith('.pages.dev');
    const isClub = url.pathname.replace(/\/+$/, '') === '/club-siete-mares';
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    // Nada que hacer: ni header que agregar ni HTML que transformar.
    if (!isPagesDev && !isHtml) return response;

    const headers = new Headers(response.headers);
    if (isPagesDev) headers.set('X-Robots-Tag', 'noindex');

    const out = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });

    if (!isHtml) return out;

    return new HTMLRewriter()
      .on('head', new InjectHead())
      .on('footer.site-footer', new InjectJobs()).on('body', new InjectBody(isClub))
      .transform(out);
  } catch (err) {
    // Si algo falla, se sirve la respuesta original sin tocar: el sitio nunca se cae por esto.
    return response;
  }
}

// Páginas donde salen las reseñas (ruta -> restaurante en el Sheet)
const GH_REV_PAGES = {"/":"sietemares"};
const GH_REV_USTED = true;
const GH_REV_WRAP = "container";
// Copia fija por si el Sheet no responde (se usa solo como respaldo)
const GH_REV_FALLBACK = {"resenas":[{"restaurante":"sietemares","orden":"1","fecha":"2026-10-09","estrellas":"5","nombre":"Valentina Q.","texto":"Cuenta con salón para reuniones, comida sabrosa, lugar cerca de estaciones de tren y bus, personal amable.","mostrar":"SI"},{"restaurante":"sietemares","orden":"2","fecha":"2026-07-14","estrellas":"5","nombre":"Carlos B.","texto":"I had the steak and lobster, my meal was satisfying and tender. The host was friendly and they offered great attention to detail. I would recommend this location if you’re ever in Panama. Definitely bring a date and enjoy the atmosphere.","mostrar":"SI"},{"restaurante":"sietemares","orden":"3","fecha":"2026-08-22","estrellas":"5","nombre":"Andres B.","texto":"La atención excelente desde el valet parking hasta los meseros.. Todos muy amables y atentos. La comida exquisita.","mostrar":"SI"},{"restaurante":"sietemares","orden":"4","fecha":"2026-05-23","estrellas":"5","nombre":"Foodie","texto":"The lobster Thermidor was fantastic. Order it with the chicken with mushrooms and use the sauce from the lobster. They go very good together. Also, we enjoyed the cocktail with the name Bombay. Attentive servers and a nice live piano made it a very enjoyable evening.","mostrar":"SI"},{"restaurante":"sietemares","orden":"5","fecha":"2026-02-03","estrellas":"5","nombre":"Isaac A.","texto":"Hicimos una reunión para celebrar los 45 años de graduación. La comida fue expectacular, el servicio de primera, el ambiente muy bueno se llevó una computadora con toda la música que se quería bailar.","mostrar":"SI"},{"restaurante":"sietemares","orden":"6","fecha":"2026-02-25","estrellas":"5","nombre":"Roy","texto":"The hotel concierge recommended this place and I'm glad he did! The service was EXCELLENT and the food was DELICIOUS! The calamari/octopus appetizer, garlic red snapper and apple tart for dessert...all made to PERFECTION. HIGHLY RECOMMEND","mostrar":"SI"},{"restaurante":"sietemares","orden":"7","fecha":"2026-10-23","estrellas":"5","nombre":"Alfonso C.","texto":"Filete de Corvina fresco y delicioso, justo al punto que lo solicité.","mostrar":"SI"},{"restaurante":"sietemares","orden":"8","fecha":"2026-04-27","estrellas":"5","nombre":"Luis F.","texto":"Altamente recomendado. Muy bien atendidos y la comida deliciosa y al punto de sal y coccion","mostrar":"SI"},{"restaurante":"sietemares","orden":"9","fecha":"2026-06-02","estrellas":"5","nombre":"José M.","texto":"Fuimos a celebrar el cumpleaños de mi esposa y nos reunimos en familia.","mostrar":"SI"},{"restaurante":"sietemares","orden":"10","fecha":"2026-09-14","estrellas":"5","nombre":"Ivo J.","texto":"All was fresh and tasty. We had big family lunch, service was amazing.","mostrar":"SI"},{"restaurante":"sietemares","orden":"11","fecha":"2026-01-29","estrellas":"5","nombre":"Angela G.","texto":"Delicioso! Lo encontré de casualidad y fue execelente todo. Super recomendado 😍","mostrar":"SI"},{"restaurante":"sietemares","orden":"12","fecha":"2026-01-19","estrellas":"5","nombre":"Lisa T.","texto":"This is a really lovely restaurant. Excellent food, service, and atmosphere. They make a very nice Aperol Sprintz, and the salmon was delicious. Highly recommend.","mostrar":"SI"},{"restaurante":"sietemares","orden":"13","fecha":"2025-11-25","estrellas":"5","nombre":"William D.","texto":"No hay pierde… Mero en mantequilla negra y alcaparras… con un adicional de concolon … y un albariño…","mostrar":"SI"},{"restaurante":"sietemares","orden":"14","fecha":"2025-11-10","estrellas":"5","nombre":"Jaime M.","texto":"Acabe de salir del lugar y con gusto volvería, la comida muy deliciosa.","mostrar":"SI"}],"resumen":[{"restaurante":"sietemares","promedio":"4.6","total":"661","ver_todas":"https://maps.google.com/maps?cid=8450833521696550763","dejar_resena":"https://search.google.com/local/writereview?placeid=ChIJa8D_GXyprI8Ra6-vRFBkR3U","actualizado":"2026-11-06"}]};

// ---- Reseñas de Google en la página principal ----
// Fuente: Google Sheet "Reseñas web – Grupo Herrero" (pestañas resenas y resumen).
// Si el Sheet no responde, usa la copia fija GH_REV_FALLBACK (arriba).
const GH_REV_SHEET = '18yojHk7JGHwyuQZYAhv7KN4vrgnRSG--UPCbAGAIouE';
const GH_REV_MAX = 6;

function ghCsv(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else { q = false; } }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
  return rows.filter(r => r.some(x => x !== '')).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}

async function ghRevData(context) {
  const base = 'https://docs.google.com/spreadsheets/d/' + GH_REV_SHEET + '/gviz/tq?tqx=out:csv&sheet=';
  try {
    const opt = { cf: { cacheTtl: 3600, cacheEverything: true } };
    const [a, b] = await Promise.all([fetch(base + 'resenas', opt), fetch(base + 'resumen', opt)]);
    const ok = r => r.ok && (r.headers.get('content-type') || '').includes('csv');
    if (ok(a) && ok(b)) {
      const resenas = ghCsv(await a.text()); const resumen = ghCsv(await b.text());
      if (resumen.length) return { resenas, resumen };
    }
  } catch (e) {}
  return GH_REV_FALLBACK;
}

function ghEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

const GH_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function ghRevHtml(data, slug, usted, wrap) {
  const sum = (data.resumen || []).find(r => r.restaurante === slug);
  if (!sum) return '';
  const list = (data.resenas || [])
    .filter(r => r.restaurante === slug && String(r.mostrar).toUpperCase() === 'SI' && r.texto)
    .sort((x, y) => (Number(x.orden) || 999) - (Number(y.orden) || 999))
    .slice(0, GH_REV_MAX);
  if (list.length > 3 && list.length < 6) list.length = 3; // filas completas de 3
  const total = Number(String(sum.total).replace(/[^0-9]/g, '')) || 0;
  const avg = String(sum.promedio || '').replace(',', '.');
  const cta = usted ? '¿Ya nos visitó? Déjenos su reseña' : '¿Ya nos visitaste? Déjanos tu reseña';
  const css = '<style>.gh-rev-sec{padding:clamp(48px,7vw,88px) 0}.gh-rev-sec h2{margin:0 0 10px}.gh-rev-sum{margin:0 0 24px;opacity:.85}.gh-rev-sum a,.gh-rev-cta a{color:inherit;text-decoration:underline}.gh-rev-list{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.gh-rev{margin:0;padding:22px;border:1px solid rgba(0,0,0,.12);border-radius:14px;background:rgba(255,255,255,.55);display:flex;flex-direction:column;gap:12px}.gh-rev-stars{color:#E8A317;letter-spacing:2px;font-size:1.05rem}.gh-rev blockquote{margin:0;font-size:1rem;line-height:1.55}.gh-rev figcaption{margin-top:auto;font-size:.88rem;opacity:.75}.gh-rev-cta{margin:24px 0 0}@media (max-width:820px){.gh-rev-list{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:85%;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}.gh-rev{scroll-snap-align:start}}</style>';
  if (!list.length || !total) {
    if (!sum.dejar_resena) return '';
    const h = usted ? '¿Ya nos visitó?' : '¿Ya nos visitaste?';
    const p = usted ? 'Su reseña en Google ayuda a que más personas nos encuentren.' : 'Tu reseña en Google ayuda a que más gente nos encuentre.';
    const b = usted ? 'Déjenos su reseña en Google' : 'Déjanos tu reseña en Google';
    return css + '<section class="gh-rev-sec" aria-labelledby="gh-rev-t"><div class="' + wrap + '"><h2 id="gh-rev-t">' + h + '</h2><p class="gh-rev-sum">' + p + '</p><p class="gh-rev-cta"><a href="' + ghEsc(sum.dejar_resena) + '" target="_blank" rel="noopener">' + b + '</a></p></div></section>';
  }
  const cards = list.map(r => {
    let t = r.texto; if (t.length > 280) t = t.slice(0, 280).replace(/\s+\S*$/, '') + '…';
    const n = Math.max(1, Math.min(5, Number(r.estrellas) || 5));
    const d = /^\d{4}-\d{2}/.test(r.fecha) ? GH_MESES[Number(r.fecha.slice(5, 7)) - 1] + ' de ' + r.fecha.slice(0, 4) : '';
    return '<figure class="gh-rev"><div class="gh-rev-stars" aria-label="' + n + ' de 5 estrellas">' + '★'.repeat(n) + '</div><blockquote>' + ghEsc(t) + '</blockquote><figcaption>' + ghEsc(r.nombre) + (d ? ' · ' + d : '') + ' · Google</figcaption></figure>';
  }).join('');
  const resumen = '<strong>' + ghEsc(avg) + ' de 5 ★</strong> · ' + total.toLocaleString('en-US') + ' reseñas en Google' + (sum.ver_todas ? ' · <a href="' + ghEsc(sum.ver_todas) + '" target="_blank" rel="noopener">Ver todas</a>' : '');
  return css + '<section class="gh-rev-sec" aria-labelledby="gh-rev-t"><div class="' + wrap + '"><h2 id="gh-rev-t">Lo que dicen en Google</h2><p class="gh-rev-sum">' + resumen + '</p><div class="gh-rev-list">' + cards + '</div>' + (sum.dejar_resena ? '<p class="gh-rev-cta"><a href="' + ghEsc(sum.dejar_resena) + '" target="_blank" rel="noopener">' + cta + '</a></p>' : '') + '</div></section>';
}

class GhRevBefore {
  constructor(st, html) { this.st = st; this.html = html; }
  element(el) { if (!this.st.done) { el.before(this.html, { html: true }); this.st.done = true; } }
}

async function ghAddReviews(context, response) {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname.replace(/index\.html$/, '');
    const slug = GH_REV_PAGES[path] || GH_REV_PAGES[path + '/'];
    if (!slug) return response;
    if (!(response.headers.get('content-type') || '').includes('text/html') || response.status !== 200) return response;
    const data = await ghRevData(context);
    if (!data) return response;
    const html = ghRevHtml(data, slug, GH_REV_USTED, GH_REV_WRAP);
    if (!html) return response;
    const st = { done: false };
    return new HTMLRewriter().on('section.faq-gh', new GhRevBefore(st, html)).on('footer.site-footer', new GhRevBefore(st, html)).transform(response);
  } catch (e) {
    return response;
  }
}

export async function onRequest(context) {
  const response = await ghBaseOnRequest(context);
  return ghAddReviews(context, await ghAddLinks(response));
}

// Enlaces que se agregan al pie de todas las páginas
const GH_LINKS = [{"find":"href=\"/carta/\"","add":"<a href=\"/a-domicilio/\">A domicilio</a>","skip":"href=\"/a-domicilio/\""},{"find":"href=\"/nuestras-bebidas/\"","add":"<a href=\"/paella-en-panama/\">Paella en Panamá</a>","skip":"href=\"/paella-en-panama/\""},{"find":"href=\"/paella-en-panama/\"","add":"<a href=\"/centollo-en-panama/\">Centollo y langosta</a>","skip":"href=\"/centollo-en-panama/\""},{"find":"href=\"/salones-para-eventos-en-panama/\"","add":"<a href=\"/ubicacion-siete-mares/\">Ubicación</a>","skip":"href=\"/ubicacion-siete-mares/\""},{"find":"href=\"/opina/\"","add":"<a href=\"/en/seafood-restaurant-panama-city/\" lang=\"en\">In English</a>","skip":"href=\"/en/seafood-restaurant-panama-city/\""}];

// Velocidad: Analytics y el píxel de Meta cargan después de que se ve la página
const GH_TUNE = {"defer":true};

// ---- Ajustes de la página en el servidor (enlaces del pie, velocidad) ----
// GH_LINKS: enlaces que se agregan al <footer class="site-footer"> (si no están ya).
// GH_TUNE (opcional): defer = Analytics y el píxel de Meta cargan al primer toque/scroll o 3.5 s después de cargar;
// headAdd = etiquetas que se agregan antes de </head>; headRemove = textos exactos que se quitan.
const GH_LATE = '<script>window.ghLate=function(f){var d=0,g=function(){if(d)return;d=1;f()};["scroll","pointerdown","touchstart","keydown"].forEach(function(e){addEventListener(e,g,{once:true,passive:true})});if(document.readyState==="complete")setTimeout(g,3500);else addEventListener("load",function(){setTimeout(g,3500)})};</script>';
async function ghAddLinks(response) {
  const tune = (typeof GH_TUNE !== 'undefined') ? GH_TUNE : null;
  if ((!GH_LINKS.length && !tune) || response.status !== 200 || !(response.headers.get('content-type') || '').includes('text/html')) return response;
  let html;
  try { html = await response.text(); } catch (e) { return response; }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  try {
    if (tune) {
      for (const r of (tune.headRemove || [])) html = html.split(r).join('');
      if (tune.headAdd && !html.includes(tune.headAdd)) html = html.replace('</head>', tune.headAdd + '</head>');
      const lateKey = "window.addEventListener('load',function(){var s=document.createElement('script')";
      const at = html.indexOf(lateKey);
      if (tune.defer && at >= 0 && !html.includes('window.ghLate=')) {
        const sAt = html.lastIndexOf('<script', at);
        html = html.slice(0, sAt) + GH_LATE + html.slice(sAt);
        html = html.split(lateKey).join("ghLate(function(){var s=document.createElement('script')");
      }
    }
    const fs = html.search(/<footer[^>]*class="[^"]*site-footer/);
    if (fs >= 0 && GH_LINKS.length) {
      let foot = html.slice(fs);
      for (const l of GH_LINKS) {
        if (foot.includes(l.skip)) continue;
        const i = foot.indexOf(l.find);
        if (i < 0) continue;
        const pos = l.before ? foot.lastIndexOf('<a', i) : foot.indexOf('</a>', i) + 4;
        if (pos < 4) continue;
        foot = foot.slice(0, pos) + l.add + foot.slice(pos);
      }
      html = html.slice(0, fs) + foot;
    }
  } catch (e) {}
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
