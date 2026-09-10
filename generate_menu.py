#!/usr/bin/env python3
"""
Sync engine: 4 Google Sheets (menú de Siete Mares) -> carta/index.html y
nuestras-bebidas/index.html

Corre dentro de GitHub Actions, en un checkout del repo
danielherreroc-menu/sietemares-web. Lee las 4 hojas en vivo (via Sheets API,
con una service account de solo lectura), regenera los 5 bloques marcados
con comentarios <!-- MENU-SYNC:... --> / <!-- /MENU-SYNC:... --> en ambas
páginas, y preserva byte a byte todo lo demás (head, header, footer, hero,
menu-switcher, category-tabs, JSON-LD, etc.).

Las pestañas de navegación (category-tabs, menu-switcher) NO se regeneran:
sus etiquetas están escritas a mano y no siempre coinciden literalmente con
el nombre del grupo en la hoja (p. ej. "Licores" en vez de "Nuestro Bar",
"Vinos blancos" en minúscula vs "Vinos Blancos" en la hoja). Si se agrega o
quita una categoría completa alguna vez, hay que ajustar esa nav a mano en
el HTML -- renombrar/reordenar/re-precificar platos dentro de categorías
existentes sí sincroniza solo.

Zonas que este script regenera:
  carta/index.html
    - CARTA-COMIDA        (las 9 categorías de menusietemares)
    - CARTA-POSTRES       (Postres, Café y Té de menupostressietemares)
  nuestras-bebidas/index.html
    - BEBIDAS-BAR          (Cócteles + Nuestro Bar de menubarsietemares)
    - BEBIDAS-DIGESTIVOS   (Digestivos y Brandy y Cognac de menupostressietemares)
    - BEBIDAS-VINOS        (menuvinossietemares completo)

Variables de entorno esperadas:
  GOOGLE_SERVICE_ACCOUNT_JSON  - contenido completo del JSON de la service account
"""
import html
import json
import os
import re
import sys
import unicodedata
from collections import OrderedDict

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# --- Las 4 hojas fuente -----------------------------------------------------

SHEETS = {
    "carta": {
        "id": "16oC2dmqSk4S3J6uhT-jvoiewsPn8h3xoge7GTF1xpwM",
        "range": "menusietemares.csv",
    },
    "vinos": {
        "id": "1ynZKkkYwoXfWLjC4oSailm04CJZ1wipSwVpy7rTxMKs",
        "range": "menuvinossietemares.csv",
    },
    "bar": {
        "id": "1Eo6jDU7lgoDnE3HnGQVkdTSV0PUFU_Hy-LEzJd_6yW0",
        "range": "menubarsietemares.csv",
    },
    "postres": {
        "id": "13ZVYPKAOser5OZLdnwACuRE2jv4inW2BypBv9EWwAvM",
        "range": "menupostressietemares.csv",
    },
}

EXPECTED_HEADER = ["grupo", "seccion", "orden", "plato", "descripcion", "activo", "precio"]

CARTA_PATH = "carta/index.html"
BEBIDAS_PATH = "nuestras-bebidas/index.html"

# Grupos de menupostressietemares que van en cada página
POSTRES_GRUPOS = {"Postres", "Café", "Té"}
DIGESTIVOS_GRUPOS = {"Digestivos", "Brandy y Cognac"}


# --- Helpers de texto/HTML ---------------------------------------------------

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def esc(s):
    return html.escape(s, quote=True)


def fmt_price(p):
    """Precios en bruto, sin prefijo de moneda (ver MENU-INTEGRATION.md):
    '16' -> '16'; '8/16' -> '8 / 16'; '+1' -> '+1' (queda igual, no tiene '/')."""
    p = (p or "").strip()
    if not p:
        return None
    if "/" in p:
        parts = [x.strip() for x in p.split("/")]
        return " / ".join(parts)
    return p


# --- Lectura de las hojas ----------------------------------------------------

def fetch_sheet_rows(sheet_key, service):
    cfg = SHEETS[sheet_key]
    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=cfg["id"], range=cfg["range"])
        .execute()
    )
    values = result.get("values", [])
    if not values:
        print(f"ERROR: la hoja '{sheet_key}' vino vacia", file=sys.stderr)
        sys.exit(1)

    header = [c.strip().lower() for c in values[0]]
    if header != EXPECTED_HEADER:
        print(f"ERROR: encabezado inesperado en '{sheet_key}': {header}", file=sys.stderr)
        sys.exit(1)

    rows = []
    for raw in values[1:]:
        cells = list(raw) + [""] * (len(header) - len(raw))
        row = dict(zip(header, cells))
        if not any(v.strip() for v in row.values()):
            continue
        if row.get("activo", "SI").strip().upper() != "SI":
            continue
        rows.append(row)
    return rows


def fetch_all_sheets():
    creds_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not creds_json:
        print("ERROR: falta la variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON", file=sys.stderr)
        sys.exit(1)
    creds_info = json.loads(creds_json)
    credentials = Credentials.from_service_account_info(
        creds_info, scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"]
    )
    service = build("sheets", "v4", credentials=credentials)
    return {key: fetch_sheet_rows(key, service) for key in SHEETS}


# --- Agrupado y render --------------------------------------------------------

def group_rows(rows):
    groups = OrderedDict()
    for row in rows:
        g = row["grupo"].strip()
        groups.setdefault(g, []).append(row)
    return groups


def render_item(row, seen_ids):
    plato = row["plato"].strip()
    desc = row.get("descripcion", "").strip()
    precio = fmt_price(row.get("precio", ""))
    base_id = slugify(plato)
    item_id = base_id or "item"
    n = 2
    while item_id in seen_ids:
        item_id = f"{base_id}-{n}"
        n += 1
    seen_ids.add(item_id)
    out = [f'            <article class="menu-item" data-menu-item data-item-id="{item_id}">']
    out.append("              <div>")
    out.append(f"                <h3 data-name>{esc(plato)}</h3>")
    if desc:
        out.append(f"                <p data-description>{esc(desc)}</p>")
    out.append("              </div>")
    if precio:
        out.append(f'              <span class="menu-price">{esc(precio)}</span>')
    out.append("            </article>")
    return "\n".join(out)


def render_category(heading, kicker, rows, cat_id, seen_ids, seen_cat_ids, html_id=None):
    cat_slug = cat_id
    n = 2
    while cat_slug in seen_cat_ids:
        cat_slug = f"{cat_id}-{n}"
        n += 1
    seen_cat_ids.add(cat_slug)
    id_attr = f' id="{html_id}"' if html_id else ""
    out = [f'        <section class="menu-category"{id_attr} data-menu-category data-category-id="{cat_slug}">']
    out.append('          <div class="category-heading">')
    out.append(f"            <h2 data-category-name>{esc(heading)}</h2>")
    if kicker:
        out.append(f"            <span data-category-kicker>{esc(kicker)}</span>")
    out.append("          </div>")
    out.append('          <div class="menu-list" data-menu-items>')
    for row in rows:
        out.append(render_item(row, seen_ids))
    out.append("          </div>")
    out.append("        </section>")
    return "\n".join(out)


def build_block(rows, anchor_id=None):
    """Devuelve el HTML del bloque de secciones. Reglas de 'id' verificadas
    byte a byte contra el sitio aprobado por Daniel:
      - la primera sub-sección del PRIMER grupo del bloque -> anchor_id
      - la primera sub-sección de CUALQUIER OTRO grupo -> slug del grupo
      - cualquier sub-sección siguiente dentro de un grupo -> slug grupo+seccion
      - grupos de una sola sección (seccion == grupo o no) siguen la misma regla,
        tratados como 'sub-sección única' de su propio grupo."""
    groups = group_rows(rows)
    seen_ids = set()
    seen_cat_ids = set()
    sections = []
    first = True
    for grupo, grows in groups.items():
        seccion_vals = list(dict.fromkeys(r["seccion"].strip() for r in grows))
        grupo_slug = slugify(grupo)

        if len(seccion_vals) == 1:
            html_id = anchor_id if first else grupo_slug
            kicker = None if seccion_vals[0] == grupo else seccion_vals[0]
            block = render_category(grupo, kicker, grows, grupo_slug, seen_ids, seen_cat_ids, html_id=html_id)
            sections.append(block)
        else:
            for i, sec in enumerate(seccion_vals):
                sub_rows = [r for r in grows if r["seccion"].strip() == sec]
                cat_slug = slugify(f"{grupo}-{sec}")
                if first and i == 0:
                    hid = anchor_id
                elif i == 0:
                    hid = grupo_slug
                else:
                    hid = cat_slug
                block = render_category(sec, grupo, sub_rows, cat_slug, seen_ids, seen_cat_ids, html_id=hid)
                sections.append(block)
        first = False
    return "\n\n".join(sections)


def replace_marker(content, marker, new_inner):
    pattern = re.compile(
        r"(<!-- MENU-SYNC:" + marker + r" -->\n).*?(\n\s*<!-- /MENU-SYNC:" + marker + r" -->)",
        re.DOTALL,
    )
    new_content, n = pattern.subn(lambda m: m.group(1) + new_inner + m.group(2), content, count=1)
    if n != 1:
        print(f"ERROR: no se encontró el marcador MENU-SYNC:{marker}", file=sys.stderr)
        sys.exit(1)
    return new_content


def write_if_changed(path, content):
    with open(path, encoding="utf-8") as f:
        original = f.read()
    if content == original:
        return False
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Escrito: {path} ({len(original)} -> {len(content)} bytes)")
    return True


def main():
    data = fetch_all_sheets()

    postres_rows = [r for r in data["postres"] if r["grupo"].strip() in POSTRES_GRUPOS]
    digestivos_rows = [r for r in data["postres"] if r["grupo"].strip() in DIGESTIVOS_GRUPOS]

    for key, rows in [("carta", data["carta"]), ("postres", postres_rows), ("digestivos", digestivos_rows)]:
        if not rows:
            print(f"ERROR: el grupo de filas '{key}' salió vacío; no se toca ningún HTML", file=sys.stderr)
            sys.exit(1)
    if not data["vinos"] or not data["bar"]:
        print("ERROR: vinos o bar salieron vacíos; no se toca ningún HTML", file=sys.stderr)
        sys.exit(1)

    comida_html = build_block(data["carta"], anchor_id="carta-principal")
    postres_html = build_block(postres_rows, anchor_id="postres")
    bar_html = build_block(data["bar"], anchor_id="licores")
    digestivos_html = build_block(digestivos_rows, anchor_id="licores-digestivos")
    vinos_html = build_block(data["vinos"], anchor_id="vinos")

    changed = False

    with open(CARTA_PATH, encoding="utf-8") as f:
        carta_content = f.read()
    carta_content = replace_marker(carta_content, "CARTA-COMIDA", comida_html)
    carta_content = replace_marker(carta_content, "CARTA-POSTRES", postres_html)
    changed |= write_if_changed(CARTA_PATH, carta_content)

    with open(BEBIDAS_PATH, encoding="utf-8") as f:
        bebidas_content = f.read()
    bebidas_content = replace_marker(bebidas_content, "BEBIDAS-BAR", bar_html)
    bebidas_content = replace_marker(bebidas_content, "BEBIDAS-DIGESTIVOS", digestivos_html)
    bebidas_content = replace_marker(bebidas_content, "BEBIDAS-VINOS", vinos_html)
    changed |= write_if_changed(BEBIDAS_PATH, bebidas_content)

    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")
    if not changed:
        print("Sin cambios: el HTML generado es idéntico al actual en ambas páginas.")


if __name__ == "__main__":
    main()
