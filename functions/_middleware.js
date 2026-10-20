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
    if (this.isClub) element.append(LEAD_SCRIPT, { html: true });
  }
}

export async function onRequest(context) {
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
      .on('body', new InjectBody(isClub))
      .transform(out);
  } catch (err) {
    // Si algo falla, se sirve la respuesta original sin tocar: el sitio nunca se cae por esto.
    return response;
  }
}
