# sietemares-web

Sitio estático de restaurantesietemares.com — mismo molde que [waikiki-web](https://github.com/danielherreroc-menu/waikiki-web).

Base visual y técnica construida por GPT/Codex y auditada por Claude (schema.org completo, mapa como fachada de clic, imágenes AVIF+WebP con srcset, fuentes autoalojadas, WCAG AA). La carta y las bebidas están sincronizadas desde 4 Google Sheets (`menusietemares`, `menuvinossietemares`, `menubarsietemares`, `menupostressietemares`) vía `generate_menu.py`.

## Actualizar el menú

Después de editar cualquiera de las 4 hojas: pestaña **Actions** de este repo → workflow "Sincronizar menú desde Google Sheets" → botón **Run workflow**. Si hubo cambios, el workflow hace commit directo a `main` y Cloudflare Pages despliega solo.

`generate_menu.py` solo regenera las secciones de categorías/platos dentro de `carta/index.html` y `nuestras-bebidas/index.html` (marcadas con comentarios `<!-- MENU-SYNC:... -->`). Las pestañas de navegación (`category-tabs`, `menu-switcher`) NO se regeneran — están escritas a mano porque sus etiquetas no siempre coinciden literalmente con el nombre del grupo en la hoja. Agregar o quitar una categoría completa requiere editar esa navegación a mano; renombrar/reordenar/re-precificar platos dentro de categorías existentes sincroniza solo.

## Desplegado

Cloudflare Pages, conectado por Git a la rama `main` (sin build command — el sitio ya es estático).
