# sietemares-web

Sitio estático de restaurantesietemares.com — mismo molde que [waikiki-web](https://github.com/danielherreroc-menu/waikiki-web).

Base visual y técnica construida por GPT/Codex, con la carta y las bebidas integradas y sincronizadas desde 4 Google Sheets (`menusietemares`, `menuvinossietemares`, `menubarsietemares`, `menupostressietemares`) vía `generate_menu.py`.

Para actualizar el menú tras editar cualquiera de las 4 hojas: pestaña **Actions** de este repo → workflow "Sincronizar menú desde Google Sheets" → botón **Run workflow**.

Desplegado en Cloudflare Pages, conectado por Git a la rama `main` (sin build command — el sitio ya es estático).
