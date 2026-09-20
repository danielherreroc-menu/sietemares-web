// Evita que Google indexe el subdominio gratuito de Cloudflare Pages (*.pages.dev),
// que sirve el mismo contenido que el dominio real y puede generar contenido duplicado.
// El dominio real (ej. restaurantewaikiki.com) nunca recibe este header.
export async function onRequest(context) {
  const response = await context.next();
  const { hostname } = new URL(context.request.url);

  if (hostname.endsWith('.pages.dev')) {
    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}
